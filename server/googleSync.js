import db from './db.js';

// Durable outbox: the case is committed to SQLite first. Google Sheets delivery is retryable.
db.exec(`CREATE TABLE IF NOT EXISTS google_sync_queue (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  citizen_case_id TEXT NOT NULL UNIQUE,
  payload_json TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  attempts INTEGER NOT NULL DEFAULT 0,
  last_error TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  synced_at TEXT
);`);

const insertQueue = db.prepare(`INSERT OR IGNORE INTO google_sync_queue(citizen_case_id,payload_json,status)
VALUES(?,?,'pending')`);

export function enqueueGoogleSync(citizenCaseId, payload) {
  insertQueue.run(citizenCaseId, JSON.stringify(payload));
}

export function googleSyncStatus() {
  return {
    configured: Boolean(process.env.GOOGLE_APPS_SCRIPT_URL && process.env.GOOGLE_SYNC_SECRET),
    ...db.prepare(`SELECT
      SUM(CASE WHEN status='pending' THEN 1 ELSE 0 END) pending,
      SUM(CASE WHEN status='failed' THEN 1 ELSE 0 END) failed,
      SUM(CASE WHEN status='synced' THEN 1 ELSE 0 END) synced
      FROM google_sync_queue`).get(),
    recent: db.prepare(`SELECT citizen_case_id,status,attempts,last_error,created_at,updated_at,synced_at
      FROM google_sync_queue ORDER BY id DESC LIMIT 20`).all()
  };
}

export async function syncOneQueuedCase(row) {
  const url = process.env.GOOGLE_APPS_SCRIPT_URL;
  const secret = process.env.GOOGLE_SYNC_SECRET;
  if (!url || !secret) return { skipped: true, reason: 'Google Sheets sync is not configured' };
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ secret, eventId: row.citizen_case_id, record: JSON.parse(row.payload_json) }),
      signal: AbortSignal.timeout(12000)
    });
    const text = await response.text();
    let result;
    try { result = JSON.parse(text); } catch { result = { ok: response.ok, message: text.slice(0, 300) }; }
    if (!response.ok || result.ok === false) throw new Error(result.message || `Google endpoint returned HTTP ${response.status}`);
    db.prepare(`UPDATE google_sync_queue SET status='synced',attempts=attempts+1,last_error=NULL,
      updated_at=CURRENT_TIMESTAMP,synced_at=CURRENT_TIMESTAMP WHERE id=?`).run(row.id);
    return { ok: true, citizenCaseId: row.citizen_case_id };
  } catch (error) {
    db.prepare(`UPDATE google_sync_queue SET status='pending',attempts=attempts+1,last_error=?,
      updated_at=CURRENT_TIMESTAMP WHERE id=?`).run(String(error.message || error).slice(0, 1000), row.id);
    return { ok: false, citizenCaseId: row.citizen_case_id, error: String(error.message || error) };
  }
}

export async function retryPendingGoogleSync(limit = 25) {
  if (!process.env.GOOGLE_APPS_SCRIPT_URL || !process.env.GOOGLE_SYNC_SECRET) {
    return { configured: false, attempted: 0, synced: 0, pending: googleSyncStatus().pending || 0 };
  }
  const rows = db.prepare(`SELECT * FROM google_sync_queue WHERE status='pending' ORDER BY id LIMIT ?`).all(limit);
  let synced = 0;
  for (const row of rows) {
    const result = await syncOneQueuedCase(row);
    if (result.ok) synced++;
  }
  return { configured: true, attempted: rows.length, synced, pending: googleSyncStatus().pending || 0 };
}
