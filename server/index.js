import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import {fileURLToPath} from 'url';
import db from './db.js';
import {OFFICIAL_CIRCLE_SOURCE, syncOfficialMasterData, seedLocalMasterData, latestMasterSync} from './masterData.js';
import {enqueueGoogleSync, googleSyncStatus, retryPendingGoogleSync} from './googleSync.js';

const __dirname=path.dirname(fileURLToPath(import.meta.url));
const app=express();
const PORT=process.env.PORT||4000;
const ADMIN_TOKEN=process.env.ADMIN_TOKEN||'change-me-in-production';
app.use(cors({origin:process.env.CORS_ORIGIN?.split(',')||true}));
app.use(express.json({limit:'256kb'}));
app.use(express.urlencoded({extended:false,limit:'256kb'}));

const admin=(req,res,next)=>{if(req.headers['x-admin-token']!==ADMIN_TOKEN)return res.status(401).json({error:'Unauthorized'});next()};
const caseId=()=>`BLTA-${new Date().getFullYear()}-${Math.random().toString(36).slice(2,8).toUpperCase().padEnd(6,'0')}`;
const clean=v=>typeof v==='string'?v.trim():v;

app.get('/api/health',(req,res)=>res.json({ok:true,service:'bihar-land-transparency-api',time:new Date().toISOString()}));
app.get('/api/districts',(req,res)=>res.json(db.prepare('SELECT id,name,code FROM districts WHERE active=1 ORDER BY name').all()));
app.get('/api/districts/:id/subdivisions',(req,res)=>res.json(db.prepare('SELECT id,name,code FROM subdivisions WHERE district_id=? AND active=1 ORDER BY name').all(Number(req.params.id))));
app.get('/api/subdivisions/:id/circles',(req,res)=>res.json(db.prepare('SELECT id,name,code FROM circles WHERE subdivision_id=? AND active=1 ORDER BY name').all(Number(req.params.id))));
app.get('/api/legal-sources',(req,res)=>res.json(db.prepare('SELECT * FROM legal_sources ORDER BY CASE WHEN year="Current" THEN 9999 ELSE CAST(year AS INTEGER) END, id').all()));
app.get('/api/cases/duplicate-check',(req,res)=>{const {districtId,caseNumber,caseYear}=req.query;if(!districtId||!caseNumber||!caseYear)return res.json({duplicate:false});const row=db.prepare('SELECT citizen_case_id,case_number,case_year FROM cases WHERE district_id=? AND case_number=? AND case_year=?').get(Number(districtId),clean(caseNumber),Number(caseYear));res.json({duplicate:!!row,existing:row||null})});

app.post('/api/cases',(req,res)=>{
  const b=req.body||{};
  const required=['districtId','caseNumber','caseYear','caseType','status'];
  if(required.some(k=>!b[k]))return res.status(400).json({error:'Required fields missing'});
  const district=db.prepare('SELECT id FROM districts WHERE id=? AND active=1').get(Number(b.districtId));
  if(!district)return res.status(400).json({error:'Invalid district'});
  if(b.subdivisionId){const x=db.prepare('SELECT id FROM subdivisions WHERE id=? AND district_id=? AND active=1').get(Number(b.subdivisionId),Number(b.districtId));if(!x)return res.status(400).json({error:'Invalid subdivision for district'})}
  if(b.circleId){const x=db.prepare('SELECT id FROM circles WHERE id=? AND district_id=? AND active=1').get(Number(b.circleId),Number(b.districtId));if(!x)return res.status(400).json({error:'Invalid circle for district'})}
  const duplicate=db.prepare('SELECT citizen_case_id,case_number,case_year FROM cases WHERE district_id=? AND case_number=? AND case_year=?').get(Number(b.districtId),clean(b.caseNumber),Number(b.caseYear));
  if(duplicate)return res.status(409).json({error:'Duplicate case detected',existing:duplicate});
  const id=caseId();
  try{
    const tx=db.transaction(()=>{
      db.prepare(`INSERT INTO cases(citizen_case_id,district_id,subdivision_id,circle_id,case_number,case_year,application_date,order_date,case_type,status,rule_issue,complaint_number,complaint_date,authority,next_action,suggestion) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(id,Number(b.districtId),b.subdivisionId?Number(b.subdivisionId):null,b.circleId?Number(b.circleId):null,clean(b.caseNumber),Number(b.caseYear),b.applicationDate||null,b.orderDate||null,clean(b.caseType),clean(b.status),clean(b.ruleIssue)||null,clean(b.complaintNumber)||null,b.complaintDate||null,clean(b.authority)||null,clean(b.nextAction)||null,clean(b.suggestion)||null);
      const c=db.prepare(`SELECT c.*,d.name district,s.name subdivision,cr.name circle FROM cases c JOIN districts d ON d.id=c.district_id LEFT JOIN subdivisions s ON s.id=c.subdivision_id LEFT JOIN circles cr ON cr.id=c.circle_id WHERE c.citizen_case_id=?`).get(id);
      db.prepare(`INSERT INTO case_events(case_id,event_type,event_date,note) VALUES(?,?,?,?)`).run(c.id,'Case Registered',b.applicationDate||new Date().toISOString().slice(0,10),'Citizen-submitted report; allegations are not verified findings.');
      enqueueGoogleSync(id,{...c,source:'भूमि अधिकार एवं पारदर्शिता अभियान — बिहार',noEvidenceUpload:true});
    });
    tx();
  }catch(e){if(String(e.message).includes('UNIQUE'))return res.status(409).json({error:'Duplicate case detected'});throw e}
  // SQLite is the source of truth. Google sync is best-effort and retryable after the case is saved.
  retryPendingGoogleSync(1).catch(err=>console.warn('Google Sheets sync retry deferred:',err.message));
  res.status(201).json(db.prepare('SELECT * FROM cases WHERE citizen_case_id=?').get(id));
});

app.get('/api/cases/:citizenCaseId',(req,res)=>{const row=db.prepare(`SELECT c.*,d.name district,s.name subdivision,cr.name circle FROM cases c JOIN districts d ON d.id=c.district_id LEFT JOIN subdivisions s ON s.id=c.subdivision_id LEFT JOIN circles cr ON cr.id=c.circle_id WHERE c.citizen_case_id=?`).get(req.params.citizenCaseId);if(!row)return res.status(404).json({error:'Case not found'});row.events=db.prepare('SELECT * FROM case_events WHERE case_id=? ORDER BY event_date,id').all(row.id);res.json(row)});
app.post('/api/cases/:citizenCaseId/events',admin,(req,res)=>{const c=db.prepare('SELECT id FROM cases WHERE citizen_case_id=?').get(req.params.citizenCaseId);if(!c)return res.status(404).json({error:'Case not found'});const {eventType,eventDate,note}=req.body;if(!eventType)return res.status(400).json({error:'eventType required'});const info=db.prepare('INSERT INTO case_events(case_id,event_type,event_date,note) VALUES(?,?,?,?)').run(c.id,clean(eventType),eventDate||null,clean(note)||null);res.status(201).json(db.prepare('SELECT * FROM case_events WHERE id=?').get(info.lastInsertRowid))});

app.get('/api/dashboard',(req,res)=>{const totals=db.prepare(`SELECT COUNT(*) cases,COUNT(DISTINCT district_id) districts,SUM(CASE WHEN status='Resolved' THEN 1 ELSE 0 END) resolved FROM cases`).get();const byDistrict=db.prepare(`SELECT d.name,COUNT(c.id) cases,SUM(CASE WHEN c.status='Resolved' THEN 1 ELSE 0 END) resolved,SUM(CASE WHEN c.status='Not Resolved' THEN 1 ELSE 0 END) unresolved FROM districts d LEFT JOIN cases c ON c.district_id=d.id GROUP BY d.id ORDER BY cases DESC,d.name`).all();res.json({totals,byDistrict})});


app.get('/api/admin/google-sync',admin,(req,res)=>res.json(googleSyncStatus()));
app.post('/api/admin/google-sync/retry',admin,async(req,res)=>{
  try { res.json(await retryPendingGoogleSync(Math.min(Number(req.body?.limit)||25,100))); }
  catch(e) { res.status(502).json({error:'Google Sheets retry failed',detail:String(e.message||e)}); }
});

app.get('/api/admin/overview',admin,(req,res)=>{const totalCases=db.prepare('SELECT COUNT(*) c FROM cases').get().c;const totalDistricts=db.prepare('SELECT COUNT(DISTINCT district_id) c FROM cases').get().c;const duplicateGroups=db.prepare('SELECT COUNT(*) c FROM (SELECT district_id,case_number,case_year FROM cases GROUP BY district_id,case_number,case_year HAVING COUNT(*)>1)').get().c;const pendingVerification=db.prepare("SELECT COUNT(*) c FROM cases WHERE status IN ('Under Process','Not Resolved','Appeal/Court Pending')").get().c;res.json({totalCases,totalDistricts,duplicateGroups,pendingVerification})});
app.get('/api/admin/duplicates',admin,(req,res)=>res.json(db.prepare(`SELECT d.name district,c.case_number,c.case_year,COUNT(*) count FROM cases c JOIN districts d ON d.id=c.district_id GROUP BY c.district_id,c.case_number,c.case_year HAVING COUNT(*)>1`).all()));
app.get('/api/admin/cases',admin,(req,res)=>{const limit=Math.min(Number(req.query.limit)||100,500);res.json(db.prepare(`SELECT c.*,d.name district,s.name subdivision,cr.name circle FROM cases c JOIN districts d ON d.id=c.district_id LEFT JOIN subdivisions s ON s.id=c.subdivision_id LEFT JOIN circles cr ON cr.id=c.circle_id ORDER BY c.created_at DESC LIMIT ?`).all(limit))});
app.get('/api/admin/legal',admin,(req,res)=>res.json(db.prepare('SELECT * FROM legal_sources ORDER BY id DESC').all()));
app.get('/api/admin/master-data/status',admin,(req,res)=>{
  const sync=latestMasterSync();
  const counts={districts:db.prepare('SELECT COUNT(*) c FROM districts WHERE active=1').get().c,subdivisions:db.prepare('SELECT COUNT(*) c FROM subdivisions WHERE active=1').get().c,circles:db.prepare('SELECT COUNT(*) c FROM circles WHERE active=1').get().c};
  res.json({sourceUrl:OFFICIAL_CIRCLE_SOURCE,counts,sync});
});
app.post('/api/admin/master-data/sync',admin,async(req,res)=>{
  try { const result=await syncOfficialMasterData(); res.json({ok:true,...result}); }
  catch(e){ db.prepare(`INSERT INTO master_data_syncs(source_url,status,message) VALUES(?,?,?)`).run(OFFICIAL_CIRCLE_SOURCE,'failed',String(e.message||e)); res.status(502).json({error:'Official master-data sync failed',detail:String(e.message||e)}); }
});

const dist=path.resolve(__dirname,'..','dist');
app.use(express.static(dist));
app.use((req,res,next)=>{
  if(req.method!=='GET') return next();
  const index=path.join(dist,'index.html');
  if(requirelessExists(index)) return res.sendFile(index);
  return res.status(503).json({error:'Frontend build not found',hint:'Run npm run build before starting production server.'});
});
function requirelessExists(file){ try { return fs.existsSync(file); } catch { return false; } }
try {
  const local=seedLocalMasterData();
  if(local.seeded) console.log(`Local official master data loaded: ${local.districtCount} districts / ${local.subdivisionCount} subdivisions / ${local.circleCount} circles`);
} catch(e) { console.warn(`Local master-data seed skipped: ${e.message}`); }
setInterval(()=>retryPendingGoogleSync(25).catch(e=>console.warn('Google Sheets retry loop:',e.message)), 60_000).unref();

app.listen(PORT,()=>{
  console.log(`Bihar Land Transparency API: http://localhost:${PORT}`);
  if(process.env.SYNC_OFFICIAL_MASTER_DATA_ON_START==='true') syncOfficialMasterData().then(r=>console.log(`Official master data synced: ${r.districtCount} districts / ${r.subdivisionCount} subdivisions / ${r.circleCount} circles`)).catch(e=>console.warn(`Official master data sync skipped: ${e.message}`));
});
