import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const master = JSON.parse(fs.readFileSync(path.join(root,'data','bihar_official_master_data.json'),'utf8'));
const legal = JSON.parse(fs.readFileSync(path.join(root,'data','bihar_mutation_legal_database.json'),'utf8'));
const rights = JSON.parse(fs.readFileSync(path.join(root,'data','rights_duties_accountability.json'),'utf8'));
const districtCount = new Set(master.records.map(x=>x.district)).size;
const subdivisionCount = new Set(master.records.map(x=>`${x.district}|${x.subdivision}`)).size;
const circleCount = master.records.length;
if(districtCount !== 38 || subdivisionCount !== 101 || circleCount !== 534) throw new Error(`Master data mismatch: ${districtCount}/${subdivisionCount}/${circleCount}`);
const act = legal.records.find(x=>x.id==='act-2011');
if(!act || act.provisions?.length !== 23) throw new Error('2011 Act must contain 23 provisions');
if(!rights.sections?.length) throw new Error('Rights/duties dataset missing');
for(const p of ['public/data/bihar_official_master_data.json','public/data/bihar_mutation_legal_database.json','public/data/rights_duties_accountability.json']) if(!fs.existsSync(path.join(root,p))) throw new Error(`Missing ${p}`);
console.log('VALID');
console.log(JSON.stringify({districts:districtCount,subdivisions:subdivisionCount,circles:circleCount,actSections:act.provisions.length,legalRecords:legal.records.length,rightsSections:rights.sections.length},null,2));
