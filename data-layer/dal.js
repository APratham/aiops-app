const mongoose = require('mongoose');
const sqlite3 = require('sqlite3').verbose();
const UserModel = require('../backend/models/user.model'); // MongoDB model
const axios = require('axios');
const fs = require('fs');
const path = require('path');
require('dotenv').config();


const uri = process.env.MONGODB_URI;

(async () => {
    try {
      await connectMongoDB(uri);
    } catch (error) {
      console.error('An error occurred:', error);
    }
  })();

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

// Connect to MongoDB with retry logic
async function connectMongoDB(uri, retries = 5) {
    for (let i = 0; i < retries; i++) {
      try {
        await mongoose.connect(uri, {
          connectTimeoutMS: 30000, // Increase timeout to 30 seconds
          serverSelectionTimeoutMS: 30000, // Increase server selection timeout
        });
        console.log('Connected to MongoDB');
        return; // Exit if successful
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
  

// Ensure the profile_pictures directory exists
function ensureDirectoryExists(directory) {
    if (!fs.existsSync(directory)) {
      fs.mkdirSync(directory, { recursive: true });
      console.log(`Directory '${directory}' created.`);
    }
  }
  
  // Download profile picture and save it locally
  async function downloadProfilePicture(url, sub) {
    try {
      const profilePicturesDir = path.resolve(__dirname, 'profile_pictures');
      ensureDirectoryExists(profilePicturesDir);
  
      const picturePath = path.join(profilePicturesDir, `${sub}.jpg`);
      const response = await axios({
        url,
        responseType: 'stream',
      });
  
      const writer = fs.createWriteStream(picturePath);
  
      response.data.pipe(writer);
  
      return new Promise((resolve, reject) => {
        writer.on('finish', () => resolve(picturePath));
        writer.on('error', reject);
      });
    } catch (error) {
      console.error('Error downloading profile picture:', error);
      throw error;
    }
  }

// Cache user info in SQLite and optionally in MongoDB
async function cacheUserInfo(userInfo, shouldSaveToMongoDB = false) {
  const userInSQLite = await getCachedUserInfo(userInfo.sub);

  if (userInSQLite) {
    console.log('User already exists in the database.');
  } else {
    try {
      // Download the profile picture
      const picturePath = await downloadProfilePicture(userInfo.picture, userInfo.sub);

      sqliteDb.serialize(() => {
        const stmt = sqliteDb.prepare(`
          INSERT INTO user_info (sub, name, given_name, family_name, picture)
          VALUES (?, ?, ?, ?, ?)
        `);
        stmt.run(userInfo.sub, userInfo.name, userInfo.given_name, userInfo.family_name, picturePath, (err) => {
          if (err) {
            console.error('Error caching user info in SQLite:', err.message);
          } else {
            console.log('User info cached in SQLite');
          }
        });
        stmt.finalize();
      });

      if (shouldSaveToMongoDB) {
        await storeUserInfo(userInfo);
      }
    } catch (error) {
      console.error('Error in caching user info:', error);
    }
  }
}

async function storeUserInfo(userInfo, retries = 5) {
    if (mongoose.connection.readyState !== 1) { // 1 means connected
      throw new Error('Mongoose is not connected to MongoDB');
    }
  
    for (let i = 0; i < retries; i++) {
      try {
        const existingUser = await UserModel.findOne({ sub: userInfo.sub });
  
        if (existingUser) {
          console.log('User already exists in MongoDB');
          return; // Exit early if the user already exists
        }
  
        const user = new UserModel(userInfo);
        await user.save();
        console.log('User info stored in MongoDB');
        return; // Exit after successfully storing the user info
  
      } catch (error) {
        if (error.name === 'MongoNetworkError' || error.name === 'MongooseError') {
          console.error(`Error storing user info in MongoDB (attempt ${i + 1} of ${retries}):`, error);
  
          if (i === retries - 1) {
            console.error('All retry attempts failed.');
            throw error; // Re-throw the error after the last attempt
          }
  
          console.log(`Retrying in 5 seconds...`);
          await new Promise(res => setTimeout(res, 5000)); // Wait for 5 seconds before retrying
        } else {
          console.error('An unexpected error occurred:', error);
          throw error;
        }
      }
    }
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

// Periodic backup to MongoDB
async function backupToMongoDB() {
  sqliteDb.all('SELECT * FROM user_info', async (err, rows) => {
    if (err) {
      console.error('Error fetching data from SQLite for backup:', err.message);
      return;
    }
    for (const row of rows) {
      await storeUserInfo(row);
    }
    console.log('Backup to MongoDB completed.');
  });
}

// Call this function periodically to backup SQLite data to MongoDB
setInterval(backupToMongoDB, 259200000); // Backup every hour

module.exports = {
  connectMongoDB,
  storeUserInfo,
  cacheUserInfo,
  getCachedUserInfo,
};
