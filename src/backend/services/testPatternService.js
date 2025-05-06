const db = require('../db');

function getAllPatterns() {
  const stmt = db.prepare(`SELECT * FROM test_patterns`);
  return stmt.all();
}

function createPattern(pattern) {
  const stmt = db.prepare(`INSERT INTO test_patterns (pattern) VALUES (?)`);
  const result = stmt.run(pattern);
  return { id: result.lastInsertRowid, pattern };
}

function deletePattern(patternId) {
  const stmt = db.prepare(`DELETE FROM test_patterns WHERE id=?`);
  stmt.run(patternId);
  return true;
}

module.exports = {
  getAllPatterns,
  createPattern,
  deletePattern
};
