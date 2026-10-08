import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

const dataDir = path.resolve('server/data');
fs.mkdirSync(dataDir, { recursive: true });
const db = new Database(path.join(dataDir, 'land_transparency.sqlite'));
db.pragma('journal_mode = WAL');

db.exec(`
CREATE TABLE IF NOT EXISTS districts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  code TEXT UNIQUE,
  active INTEGER NOT NULL DEFAULT 1
);
CREATE TABLE IF NOT EXISTS subdivisions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  district_id INTEGER NOT NULL REFERENCES districts(id),
  name TEXT NOT NULL,
  code TEXT,
  active INTEGER NOT NULL DEFAULT 1,
  UNIQUE(district_id, name)
);
CREATE TABLE IF NOT EXISTS circles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  subdivision_id INTEGER NOT NULL REFERENCES subdivisions(id),
  district_id INTEGER NOT NULL REFERENCES districts(id),
  name TEXT NOT NULL,
  code TEXT,
  active INTEGER NOT NULL DEFAULT 1,
  UNIQUE(district_id, name)
);
CREATE TABLE IF NOT EXISTS cases (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  citizen_case_id TEXT NOT NULL UNIQUE,
  district_id INTEGER NOT NULL REFERENCES districts(id),
  subdivision_id INTEGER REFERENCES subdivisions(id),
  circle_id INTEGER REFERENCES circles(id),
  case_number TEXT NOT NULL,
  case_year INTEGER NOT NULL,
  application_date TEXT,
  order_date TEXT,
  case_type TEXT NOT NULL,
  status TEXT NOT NULL,
  rule_issue TEXT,
  complaint_number TEXT,
  complaint_date TEXT,
  authority TEXT,
  next_action TEXT,
  suggestion TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(district_id, case_number, case_year)
);
CREATE TABLE IF NOT EXISTS case_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  case_id INTEGER NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  event_date TEXT,
  note TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS legal_sources (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  year TEXT NOT NULL,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  summary TEXT,
  current_status TEXT,
  official_url TEXT NOT NULL,
  source_owner TEXT NOT NULL,
  verified_on TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS admins (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL DEFAULT 'research_admin',
  active INTEGER NOT NULL DEFAULT 1
);
CREATE TABLE IF NOT EXISTS master_data_syncs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  source_url TEXT NOT NULL,
  synced_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  district_count INTEGER NOT NULL DEFAULT 0,
  subdivision_count INTEGER NOT NULL DEFAULT 0,
  circle_count INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL,
  message TEXT
);
`);

const districts = [
['Araria','AR'],['Arwal','AW'],['Aurangabad','AU'],['Banka','BK'],['Begusarai','BG'],['Bhagalpur','BP'],['Bhojpur','BH'],['Buxar','BU'],['Darbhanga','DB'],['East Champaran','EC'],['Gaya','GY'],['Gopalganj','GP'],['Jamui','JM'],['Jehanabad','JE'],['Kaimur','KM'],['Katihar','KT'],['Khagaria','KH'],['Kishanganj','KS'],['Lakhisarai','LK'],['Madhepura','MD'],['Madhubani','MB'],['Munger','MU'],['Muzaffarpur','MZ'],['Nalanda','NL'],['Nawada','NW'],['Patna','PT'],['Purnia','PN'],['Rohtas','RT'],['Saharsa','SH'],['Samastipur','SM'],['Saran','SR'],['Sheikhpura','SK'],['Sheohar','SO'],['Sitamarhi','ST'],['Siwan','SW'],['Supaul','SP'],['Vaishali','VA'],['West Champaran','WC']
];
const insertDistrict = db.prepare('INSERT OR IGNORE INTO districts(name,code) VALUES(?,?)');
for (const d of districts) insertDistrict.run(...d);

const legalSeed = [
['2011','Bihar Land Mutation Act, 2011','Act','मूल अधिनियम — बिहार अधिनियम 23, 2011','Base law; current applicability must be read with later amendments.','https://www.indiacode.nic.in/','India Code','2026-10-08'],
['2012','Bihar Land Mutation (Amendment) Act, 2012','Amendment','Bihar Act 16, 2012; amendment to the Bihar Land Mutation Act, 2011.','Read with subsequent amendments.','https://www.indiacode.nic.in/bitstream/123456789/7860/1/16-12.pdf','India Code','2026-10-08'],
['2012','Bihar Land Mutation Rules, 2012','Rules','Mutation petition filing and procedural rules.','Current rules subject to later amendments.','https://upload.indiacode.nic.in/showfile?actid=AC_BR_59_738_00016_00016_1552646862790&filename=the_bihar_land_mutation_rules%2C_2012_14.08.2012.pdf&type=hindirule','India Code','2026-10-08'],
['2017','Bihar Land Mutation (Amendment) Act, 2017','Amendment','2017 amendment to the mutation law.','Read with subsequent amendments.','https://land.bihar.gov.in/Acts.aspx','Revenue & Land Reforms, Bihar','2026-10-08'],
['2017','Bihar Land Mutation Rules, 2017 (Amendment)','Rules Amendment','Department rules amendment listed in the official rules archive.','Current rules subject to subsequent amendments.','https://land.bihar.gov.in/Rules.aspx','Revenue & Land Reforms, Bihar','2026-10-08'],
['2020','Mutation-related departmental rules/circular layer','Department Source','Current operational procedure must be read with the Department rules/circular archive; do not infer a standalone 2020 mutation rule without source verification.','Verification layer; latest applicable order/circular controls operational publication.','https://land.bihar.gov.in/Rules.aspx','Revenue & Land Reforms, Bihar','2026-10-08'],
['2021','Bihar Land Mutation (Amendment) Act, 2021','Amendment','Introduced Pre-Mutation Revenue Sketch Map and related changes.','Current amendment; operational requirements should be verified against latest departmental instructions.','https://www.indiacode.nic.in/bitstream/123456789/20175/2/bihar_land_mutation_%28amendment%29_act_2021.pdf','India Code','2026-10-08'],
['Current','Official BiharBhumi services','Digital Services','Online mutation, Jamabandi, Parimarjan Plus, Revenue Court, e-Mapi and related services.','Live government service layer; this project links to it but does not represent itself as a government portal.','https://biharbhumi.bihar.gov.in/','Revenue & Land Reforms, Bihar','2026-10-08'],
['Current','Department Rules & Circulars','Department Sources','Official departmental rules and circular archive for current operational verification.','Use latest applicable order/circular before publishing a finding.','https://land.bihar.gov.in/Rules.aspx','Revenue & Land Reforms, Bihar','2026-10-08']
];
const count = db.prepare('SELECT COUNT(*) AS c FROM legal_sources').get().c;
if (!count) {
  const ins = db.prepare(`INSERT INTO legal_sources(year,title,category,summary,current_status,official_url,source_owner,verified_on) VALUES(?,?,?,?,?,?,?,?)`);
  const tx = db.transaction(rows => rows.forEach(r => ins.run(...r)));
  tx(legalSeed);
}

export default db;
