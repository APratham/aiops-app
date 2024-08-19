// Required modules
const mongoose = require('mongoose');
const db = require('./models/preferences.schema'); // SQLite setup
const UserModel = require('./models/user.model'); // MongoDB model

// Function to store user info in MongoDB
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

// Function to retrieve user info from MongoDB and cache it in SQLite
async function retrieveAndCacheUserInfo(sub) {
  try {
    const userInfo = await UserModel.findOne({ sub });
    if (userInfo) {
      // Cache in SQLite
      const stmt = db.prepare(`
        INSERT OR REPLACE INTO user_info (sub, name, given_name, family_name, picture)
        VALUES (?, ?, ?, ?, ?)
      `);
      stmt.run(userInfo.sub, userInfo.name, userInfo.given_name, userInfo.family_name, userInfo.picture);
      console.log('User info cached in SQLite');
      return userInfo;
    } else {
      console.log('User not found in MongoDB');
      return null;
    }
  } catch (error) {
    console.error('Error retrieving user info from MongoDB:', error);
    return null;
  }
}

// Exporting the functions
module.exports = {
  storeUserInfo,
  retrieveAndCacheUserInfo,
};
