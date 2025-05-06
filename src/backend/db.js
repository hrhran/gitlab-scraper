const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'appData.sqlite');
const db = new Database(dbPath);


db.exec(`
  CREATE TABLE IF NOT EXISTS repos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    gitlabPath TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS groups (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS group_repos (
    groupId INTEGER NOT NULL,
    repoId INTEGER NOT NULL,
    UNIQUE(groupId, repoId)
  );

  CREATE TABLE IF NOT EXISTS test_patterns (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    pattern TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    runParams TEXT NOT NULL,   -- store as JSON string
    resultJSON TEXT NOT NULL,  -- store as JSON string
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT
  );
`);

module.exports = db;
