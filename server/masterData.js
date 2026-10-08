import db from './db.js';
import fs from 'fs';
import path from 'path';

export const OFFICIAL_CIRCLE_SOURCE = 'https://land.bihar.gov.in/CircleOfficerContactList.aspx';

const districtMap = new Map([
  ['अररिया','AR'],['अरवल','AW'],['औरंगाबाद','AU'],['बांका','BK'],['बेगूसराय','BG'],['भागलपुर','BP'],['भोजपुर','BH'],['बक्सर','BU'],['दरभंगा','DB'],['पूर्वी चंपारण','EC'],['गया','GY'],['गोपालगंज','GP'],['जमुई','JM'],['जहानाबाद','JE'],['कैमूर','KM'],['कटिहार','KT'],['खगड़िया','KH'],['किशनगंज','KS'],['लखीसराय','LK'],['मधेपुरा','MD'],['मधुबनी','MB'],['मुंगेर','MU'],['मुजफ्फरपुर','MZ'],['नालन्दा','NL'],['नवादा','NW'],['पटना','PT'],['पुर्णिया','PN'],['रोहतास','RT'],['सहरसा','SH'],['समस्तीपुर','SM'],['सारण','SR'],['शेखपुरा','SK'],['शिवहर','SO'],['सीतामढ़ी','ST'],['सिवान','SW'],['सुपौल','SP'],['वैशाली','VA'],['पश्चिम चंपारण','WC']
]);

function textOf(html) {
  return html
    .replace(/<br\s*\/?\s*>/gi, ' ')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;|&#160;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

export function parseRows(html) {
  const rows = [...html.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)].map(m => m[1]);
  let header = null;
  const parsed = [];
  for (const row of rows) {
    const cells = [...row.matchAll(/<t[dh]\b[^>]*>([\s\S]*?)<\/t[dh]>/gi)].map(m => textOf(m[1]));
    if (!cells.length) continue;
    const lower = cells.map(x => x.toLowerCase());
    if (lower.some(x => x.includes('district')) && lower.some(x => x.includes('circle name'))) {
      header = lower;
      continue;
    }
    if (header) parsed.push(cells);
  }
  if (!header) throw new Error('Official master-data table header not found');
  const districtIndex = header.findIndex(x => x.includes('district'));
  const subdivisionIndex = header.findIndex(x => x.includes('sub division') || x.includes('subdivision'));
  const circleIndex = header.findIndex(x => x.includes('circle name'));
  if (districtIndex < 0 || subdivisionIndex < 0 || circleIndex < 0) throw new Error('Official master-data columns not found');

  let district = '';
  let subdivision = '';
  const out = [];
  for (const cells of parsed) {
    district = cells[districtIndex] || district;
    subdivision = cells[subdivisionIndex] || subdivision;
    const circle = cells[circleIndex] || '';
    if (district && subdivision && circle && !/^circle name$/i.test(circle)) out.push({district, subdivision, circle});
  }
  return out;
}


export function seedLocalMasterData() {
  const candidates = [
    path.resolve('data/bihar_official_master_data.json'),
    path.resolve('public/data/bihar_official_master_data.json')
  ];
  const file = candidates.find(x => fs.existsSync(x));
  if (!file) return { seeded: false, reason: 'local master-data file not found' };
  const payload = JSON.parse(fs.readFileSync(file, 'utf8'));
  const rows = payload.records || [];
  if (rows.length < 500) throw new Error(`Local master dataset has only ${rows.length} Circle records; refusing import`);
  const tx = db.transaction(() => {
    const getDistrict = db.prepare('SELECT id FROM districts WHERE code=?');
    const upsertSubdivision = db.prepare(`INSERT INTO subdivisions(district_id,name,code,active) VALUES(?,?,?,1)
      ON CONFLICT(district_id,name) DO UPDATE SET active=1, code=excluded.code`);
    const getSubdivision = db.prepare('SELECT id FROM subdivisions WHERE district_id=? AND name=?');
    const upsertCircle = db.prepare(`INSERT INTO circles(subdivision_id,district_id,name,code,active) VALUES(?,?,?,?,1)
      ON CONFLICT(district_id,name) DO UPDATE SET subdivision_id=excluded.subdivision_id, active=1, code=excluded.code`);
    for (const row of rows) {
      const code = districtMap.get(row.district);
      if (!code) continue;
      const d = getDistrict.get(code);
      if (!d) continue;
      const subCode = `${code}-${row.subdivision}`;
      upsertSubdivision.run(d.id, row.subdivision, subCode);
      const sub = getSubdivision.get(d.id, row.subdivision);
      const circleCode = `${code}-${sub.id}-${row.circle}`;
      upsertCircle.run(sub.id, d.id, row.circle, circleCode);
    }
    const districtCount = db.prepare('SELECT COUNT(*) c FROM districts WHERE active=1').get().c;
    const subdivisionCount = db.prepare('SELECT COUNT(*) c FROM subdivisions WHERE active=1').get().c;
    const circleCount = db.prepare('SELECT COUNT(*) c FROM circles WHERE active=1').get().c;
    db.prepare(`INSERT INTO master_data_syncs(source_url,district_count,subdivision_count,circle_count,status,message) VALUES(?,?,?,?,?,?)`)
      .run(OFFICIAL_CIRCLE_SOURCE, districtCount, subdivisionCount, circleCount, 'local-seed', `Loaded ${circleCount} records from verified local master dataset`);
    return { seeded:true, districtCount, subdivisionCount, circleCount, sourceUrl:OFFICIAL_CIRCLE_SOURCE, file };
  });
  return tx();
}

export async function syncOfficialMasterData() {
  const response = await fetch(OFFICIAL_CIRCLE_SOURCE, { headers: { 'user-agent': 'Bihar-Land-Transparency/1.0' } });
  if (!response.ok) throw new Error(`Official source returned HTTP ${response.status}`);
  const html = await response.text();
  const rows = parseRows(html);
  if (rows.length < 500) throw new Error(`Only ${rows.length} Circle records parsed; import aborted for safety`);

  const now = new Date().toISOString();
  const sync = db.transaction(() => {
    db.prepare('UPDATE subdivisions SET active=0').run();
    db.prepare('UPDATE circles SET active=0').run();

    const getDistrict = db.prepare('SELECT id FROM districts WHERE code=?');
    const insertDistrict = db.prepare('INSERT INTO districts(name,code,active) VALUES(?,?,1)');
    const updateDistrict = db.prepare('UPDATE districts SET name=?,active=1 WHERE id=?');
    const upsertSubdivision = db.prepare(`INSERT INTO subdivisions(district_id,name,code,active) VALUES(?,?,?,1)
      ON CONFLICT(district_id,name) DO UPDATE SET active=1, code=excluded.code`);
    const getSubdivision = db.prepare('SELECT id FROM subdivisions WHERE district_id=? AND name=?');
    const upsertCircle = db.prepare(`INSERT INTO circles(subdivision_id,district_id,name,code,active) VALUES(?,?,?,?,1)
      ON CONFLICT(district_id,name) DO UPDATE SET subdivision_id=excluded.subdivision_id, active=1, code=excluded.code`);

    const districtIds = new Map();
    for (const row of rows) {
      const code = districtMap.get(row.district) || `AUTO-${row.district}`;
      let d = getDistrict.get(code);
      if (!d) {
        const info = insertDistrict.run(row.district, code);
        d = {id: info.lastInsertRowid};
      } else {
        updateDistrict.run(row.district, d.id);
      }
      districtIds.set(row.district, {id: d.id, code});
    }

    for (const row of rows) {
      const d = districtIds.get(row.district);
      const subdivisionCode = `${d.code}-${row.subdivision}`;
      upsertSubdivision.run(d.id, row.subdivision, subdivisionCode);
      const s = getSubdivision.get(d.id, row.subdivision);
      const circleCode = `${d.code}-${s.id}-${row.circle}`;
      upsertCircle.run(s.id, d.id, row.circle, circleCode);
    }

    const districtCount = db.prepare('SELECT COUNT(*) c FROM districts WHERE active=1').get().c;
    const subdivisionCount = db.prepare('SELECT COUNT(*) c FROM subdivisions WHERE active=1').get().c;
    const circleCount = db.prepare('SELECT COUNT(*) c FROM circles WHERE active=1').get().c;
    db.prepare(`INSERT INTO master_data_syncs(source_url,synced_at,district_count,subdivision_count,circle_count,status,message) VALUES(?,?,?,?,?,?,?)`)
      .run(OFFICIAL_CIRCLE_SOURCE, now, districtCount, subdivisionCount, circleCount, 'success', `Imported ${circleCount} official Circle records`);
    return {districtCount, subdivisionCount, circleCount, sourceUrl: OFFICIAL_CIRCLE_SOURCE, syncedAt: now};
  });
  return sync();
}

export function latestMasterSync() {
  return db.prepare('SELECT * FROM master_data_syncs ORDER BY id DESC LIMIT 1').get() || null;
}
