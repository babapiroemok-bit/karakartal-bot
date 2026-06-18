const { DatabaseSync } = require('node:sqlite');
const db = new DatabaseSync('karakartal.db');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    user_id TEXT,
    guild_id TEXT,
    xp INTEGER DEFAULT 0,
    level INTEGER DEFAULT 1,
    balance INTEGER DEFAULT 0,
    PRIMARY KEY (user_id, guild_id)
  );

  CREATE TABLE IF NOT EXISTS warnings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT,
    guild_id TEXT,
    reason TEXT,
    moderator_id TEXT,
    timestamp TEXT
  );

  CREATE TABLE IF NOT EXISTS drivers (
    user_id TEXT PRIMARY KEY,
    guild_id TEXT,
    full_name TEXT,
    plate TEXT,
    total_deliveries INTEGER DEFAULT 0,
    total_earned INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS deliveries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    guild_id TEXT,
    start_loc TEXT,
    end_loc TEXT,
    cargo TEXT,
    reward INTEGER,
    status TEXT DEFAULT 'open',
    driver_id TEXT,
    created_at TEXT,
    completed_at TEXT
  );

  CREATE TABLE IF NOT EXISTS vehicles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    guild_id TEXT,
    plate TEXT,
    model TEXT,
    capacity TEXT
  );

  CREATE TABLE IF NOT EXISTS tickets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    guild_id TEXT,
    user_id TEXT,
    type TEXT,
    channel_id TEXT,
    status TEXT DEFAULT 'open',
    created_at TEXT
  );
`);

module.exports = db;
