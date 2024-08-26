// sqliteDb.js

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Initialize SQLite connection
const sqliteDb = new sqlite3.Database(path.resolve(__dirname, 'local_database.sqlite'), (err) => {
  if (err) {
    console.error('Error opening SQLite database:', err.message);
  } else {
    console.log('Connected to SQLite database.');
  }
});

// Initialize SQLite schema if it doesn't exist
sqliteDb.serialize(() => {
  // Create user_info table if it doesn't exist
  sqliteDb.run(`
    CREATE TABLE IF NOT EXISTS user_info (
      sub TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      given_name TEXT NOT NULL,
      family_name TEXT NOT NULL,
      picture TEXT NOT NULL
    );
  `, (err) => {
    if (err) {
      console.error('Error creating user_info table:', err.message);
    } else {
      console.log('User_info table created or already exists.');
    }
  });

  // Create user_settings table if it doesn't exist
  sqliteDb.run(`
    CREATE TABLE IF NOT EXISTS user_settings (
      sub TEXT PRIMARY KEY,
      theme TEXT NOT NULL,
      FOREIGN KEY(sub) REFERENCES user_info(sub) ON DELETE CASCADE
    );
  `, (err) => {
    if (err) {
      console.error('Error creating user_settings table:', err.message);
    } else {
      console.log('User_settings table created or already exists.');
    }
  });

  // Create change_log table if it doesn't exist
  sqliteDb.run(`
    CREATE TABLE IF NOT EXISTS change_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      collection TEXT,
      change_type TEXT,
      change_time DATETIME DEFAULT CURRENT_TIMESTAMP,
      details TEXT
    );
  `, (err) => {
    if (err) {
      console.error('Error creating change_log table:', err.message);
    } else {
      console.log('Change_log table created or already exists.');
    }
  });
});

module.exports = sqliteDb;