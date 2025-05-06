const db = require('../db');

function getAllRepos() {
  const stmt = db.prepare(`SELECT * FROM repos`);
  return stmt.all();
}

function createRepo({ name, gitlabPath }) {
  const stmt = db.prepare(`INSERT INTO repos (name, gitlabPath) VALUES (?, ?)`);
  const result = stmt.run(name, gitlabPath);
  return { id: result.lastInsertRowid, name, gitlabPath };
}

function updateRepo({ id, name, gitlabPath }) {
  const stmt = db.prepare(`UPDATE repos SET name=?, gitlabPath=? WHERE id=?`);
  stmt.run(name, gitlabPath, id);
  return { id, name, gitlabPath };
}

function deleteRepo(repoId) {
  const stmt = db.prepare(`DELETE FROM repos WHERE id=?`);
  stmt.run(repoId);
  return true;
}

module.exports = {
  getAllRepos,
  createRepo,
  updateRepo,
  deleteRepo,
};
