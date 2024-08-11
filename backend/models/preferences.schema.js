const sqlite3 = require('sqlite3').verbose();

// Open a database connection
const db = new sqlite3.Database('./local_database.sqlite', (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to SQLite database.');
  }
});

// Initialize SQLite schema if it doesn't exist
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS user_info (
      sub TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      given_name TEXT NOT NULL,
      family_name TEXT NOT NULL,
      picture TEXT NOT NULL
    );
  `, (err) => {
    if (err) {
      console.error('Error creating table:', err.message);
    } else {
      console.log('User_info table created or already exists.');
    }
  });
});

module.exports = db;
