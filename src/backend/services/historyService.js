const db = require('../db');

function saveRunHistory(runParams, resultJSON) {
  const stmt = db.prepare(`
    INSERT INTO history (runParams, resultJSON) 
    VALUES (?, ?)
  `);
  const info = stmt.run(JSON.stringify(runParams), JSON.stringify(resultJSON));
  return { id: info.lastInsertRowid };
}

function getAllHistory() {
  const stmt = db.prepare(`SELECT * FROM history ORDER BY createdAt DESC`);
  const rows = stmt.all();
  return rows.map(row => ({
    ...row,
    runParams: JSON.parse(row.runParams),
    resultJSON: JSON.parse(row.resultJSON),
  }));
}

function getHistoryById(id) {
  const stmt = db.prepare(`SELECT * FROM history WHERE id=?`);
  const row = stmt.get(id);
  if (!row) return null;
  return {
    ...row,
    runParams: JSON.parse(row.runParams),
    resultJSON: JSON.parse(row.resultJSON),
  };
}

module.exports = {
  saveRunHistory,
  getAllHistory,
  getHistoryById
};
