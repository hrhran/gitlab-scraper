const db = require('../db');

function getAllGroups() {
  const stmt = db.prepare(`SELECT * FROM groups`);
  return stmt.all();
}

function createGroup({ name }) {
  const stmt = db.prepare(`INSERT INTO groups (name) VALUES (?)`);
  const result = stmt.run(name);
  return { id: result.lastInsertRowid, name };
}

function updateGroup({ id, name }) {
  const stmt = db.prepare(`UPDATE groups SET name=? WHERE id=?`);
  stmt.run(name, id);
  return { id, name };
}

function deleteGroup(groupId) {
  db.prepare(`DELETE FROM group_repos WHERE groupId=?`).run(groupId);
  db.prepare(`DELETE FROM groups WHERE id=?`).run(groupId);
  return true;
}

function addRepoToGroup(groupId, repoId) {
  const stmt = db.prepare(`
    INSERT OR IGNORE INTO group_repos (groupId, repoId)
    VALUES (?, ?)
  `);
  stmt.run(groupId, repoId);
  return true;
}

function removeRepoFromGroup(groupId, repoId) {
  const stmt = db.prepare(`
    DELETE FROM group_repos WHERE groupId=? AND repoId=?
  `);
  stmt.run(groupId, repoId);
  return true;
}

function getReposForGroup(groupId) {
  const stmt = db.prepare(`
    SELECT r.* 
    FROM repos r
    JOIN group_repos gr ON gr.repoId = r.id
    WHERE gr.groupId = ?
  `);
  return stmt.all(groupId);
}

module.exports = {
  getAllGroups,
  createGroup,
  updateGroup,
  deleteGroup,
  addRepoToGroup,
  removeRepoFromGroup,
  getReposForGroup
};
