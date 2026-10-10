/**
 * Bihar Land Transparency -> Google Sheets sink.
 * Deploy as a Web App (Execute as: Me; access: Anyone) and keep the URL/secret
 * only in the backend environment, never in React/Vite public variables.
 * Bind this script to the destination spreadsheet or set SPREADSHEET_ID below.
 */
const CONFIG = {
  SHEET_NAME: 'Citizen Feedback',
  // Optional: paste the destination spreadsheet ID here. Leave blank if this
  // Apps Script project is bound to the destination spreadsheet.
  SPREADSHEET_ID: '',
  // Set the same long random secret as GOOGLE_SYNC_SECRET in the backend.
  SHARED_SECRET: 'REPLACE_WITH_A_LONG_RANDOM_SECRET'
};
const HEADERS = [
  'Citizen Case ID','Received At','District','Subdivision','Circle','Case Number','Case Year',
  'Application Date','Order Date','Case Type','Current Status','Rule / Provision Concern',
  'Complaint Number','Complaint Date','Authority / Department','Next Action','Suggestion',
  'Source','No Evidence Upload','Sync Event ID'
];

function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    const body = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    if (!body.secret || body.secret !== CONFIG.SHARED_SECRET) return json({ok:false,message:'Unauthorized'});
    if (!body.eventId || !body.record) return json({ok:false,message:'eventId and record are required'});
    lock.waitLock(15000);
    const sheet = getSheet_();
    ensureHeaders_(sheet);
    // Idempotency: backend retries may resend the same case after a timeout.
    const lastRow = sheet.getLastRow();
    if (lastRow > 1) {
      const found = sheet.getRange(2, 20, lastRow - 1, 1)
        .createTextFinder(String(body.eventId)).matchEntireCell(true).findNext();
      if (found) return json({ok:true,duplicate:true,eventId:body.eventId});
    }
    const r = body.record;
    const values = [
      r.citizen_case_id || body.eventId, new Date(), safe_(r.district), safe_(r.subdivision), safe_(r.circle),
      safe_(r.case_number), safe_(r.case_year), safe_(r.application_date), safe_(r.order_date),
      safe_(r.case_type), safe_(r.status), safe_(r.rule_issue), safe_(r.complaint_number),
      safe_(r.complaint_date), safe_(r.authority), safe_(r.next_action), safe_(r.suggestion),
      safe_(r.source || 'Website'), r.noEvidenceUpload === true ? 'Yes' : 'Yes - uploads disabled', body.eventId
    ];
    sheet.appendRow(values);
    return json({ok:true,eventId:body.eventId});
  } catch (err) {
    return json({ok:false,message:String(err && err.message || err)});
  } finally {
    try { lock.releaseLock(); } catch (_) {}
  }
}

function getSheet_() {
  const ss = CONFIG.SPREADSHEET_ID
    ? SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID)
    : SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) throw new Error('No spreadsheet: bind this script to a Google Sheet or set SPREADSHEET_ID');
  return ss.getSheetByName(CONFIG.SHEET_NAME) || ss.insertSheet(CONFIG.SHEET_NAME);
}
function ensureHeaders_(sheet) {
  if (sheet.getLastRow() === 0) sheet.appendRow(HEADERS);
  else if (sheet.getRange(1,1,1,HEADERS.length).getValues()[0][0] !== HEADERS[0]) {
    throw new Error('Unexpected header row. Please use a new/empty sheet named ' + CONFIG.SHEET_NAME);
  }
}
// Prevent spreadsheet formula injection from user-entered strings.
function safe_(value) {
  if (value === null || value === undefined) return '';
  const s = String(value).slice(0, 5000);
  return /^[=+\-@]/.test(s) ? "'" + s : s;
}
function json(value) {
  return ContentService.createTextOutput(JSON.stringify(value)).setMimeType(ContentService.MimeType.JSON);
}
