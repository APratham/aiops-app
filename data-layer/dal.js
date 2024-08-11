const mongoose = require('mongoose');
const sqlite3 = require('sqlite3').verbose();
const UserModel = require('../backend/models/user.model'); // MongoDB model
require('dotenv').config();

const uri = process.env.MONGODB_URI;
connectMongoDB(uri);

// Initialize SQLite connection
const sqliteDb = new sqlite3.Database('./local_database.sqlite', (err) => {
  if (err) {
    console.error('Error opening SQLite database:', err.message);
  } else {
    console.log('Connected to SQLite database.');
  }
});

// Initialize SQLite schema if it doesn't exist
sqliteDb.serialize(() => {
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
      console.error('Error creating table:', err.message);
    } else {
      console.log('User_info table created or already exists.');
    }
  });
});

// Connect to MongoDB
async function connectMongoDB(uri, retries = 5) {
    for (let i = 0; i < retries; i++) {
      try {
        await mongoose.connect(uri, {
          useNewUrlParser: true,
          useUnifiedTopology: true,
          connectTimeoutMS: 20000, // 20 seconds timeout
        });
        console.log('Connected to MongoDB');
        return; // Exit the function if the connection is successful
      } catch (error) {
        console.error(`Error connecting to MongoDB (attempt ${i + 1} of ${retries}):`, error);
  
        if (i === retries - 1) {
          console.error('All retry attempts failed.');
          throw error; // Re-throw the error after the last attempt
        }
  
        console.log(`Retrying in 5 seconds...`);
        await new Promise(res => setTimeout(res, 5000)); // Wait for 5 seconds before retrying
      }
    }
  }
  

// Store user info in MongoDB
async function storeUserInfo(userInfo) {
  try {
    const existingUser = await UserModel.findOne({ sub: userInfo.sub });
    if (existingUser) {
      await UserModel.updateOne({ sub: userInfo.sub }, userInfo);
    } else {
      const user = new UserModel(userInfo);
      await user.save();
    }
    console.log('User info stored in MongoDB');
  } catch (error) {
    console.error('Error storing user info in MongoDB:', error);
  }
}

// Cache user info in SQLite
function cacheUserInfo(userInfo) {
  sqliteDb.serialize(() => {
    const stmt = sqliteDb.prepare(`
      INSERT OR REPLACE INTO user_info (sub, name, given_name, family_name, picture)
      VALUES (?, ?, ?, ?, ?)
    `);
    stmt.run(userInfo.sub, userInfo.name, userInfo.given_name, userInfo.family_name, userInfo.picture, (err) => {
      if (err) {
        console.error('Error caching user info in SQLite:', err.message);
      } else {
        console.log('User info cached in SQLite');
      }
    });
    stmt.finalize();
  });
}

// Retrieve cached user info from SQLite
function getCachedUserInfo(sub) {
  return new Promise((resolve, reject) => {
    sqliteDb.get('SELECT * FROM user_info WHERE sub = ?', [sub], (err, row) => {
      if (err) {
        console.error('Error retrieving user info from SQLite:', err.message);
        reject(err);
      } else {
        resolve(row);
      }
    });
  });
}

module.exports = {
  connectMongoDB,
  storeUserInfo,
  cacheUserInfo,
  getCachedUserInfo,
};
