const fs = require('node:fs');
const path = require('node:path');
const Database = require('better-sqlite3');

function createDb(dbPath = process.env.DB_PATH || path.join(__dirname, '../../data.sqlite')) {
  const db = new Database(dbPath);
  db.pragma('foreign_keys = ON');
  db.exec(fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8'));
  db.prepare(`
    INSERT OR IGNORE INTO Usuarios (id, email, nombre)
    VALUES (1, 'visitante@ecoharmony.com', 'Visitante de prueba')
  `).run();
  return db;
}

module.exports = { createDb };
