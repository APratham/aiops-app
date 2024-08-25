const sqliteDb = require('./sqliteDb'); // Assume this is your SQLite database connection
const UserModel = require('../models/user.model'); // MongoDB model for users

async function createData(collection, data, sqliteTable) {
  try {
    // MongoDB insert operation
    const Model = getMongoModel(collection);
    const newData = new Model(data);
    await newData.save();

    // Cache in SQLite
    await cacheData(sqliteTable, data);

    // Log the change
    await logChange(collection, 'create', JSON.stringify(data));

    return newData;
  } catch (error) {
    console.error(`Error creating data in ${collection}:`, error);
    throw error;
  }
}

async function readData(collection, query, sqliteTable) {
  try {
    // SQLite read operation
    const cachedData = await getCachedData(sqliteTable, query.sub);
    if (cachedData) {
      console.log(`Data found in SQLite cache for ${collection}`);
      return cachedData;
    }

    // MongoDB read operation
    const Model = getMongoModel(collection);
    const dataFromMongo = await Model.findOne(query);
    if (dataFromMongo) {
      console.log(`Data found in MongoDB for ${collection}, caching in SQLite`);
      await cacheData(sqliteTable, dataFromMongo);
      return dataFromMongo;
    } else {
      console.log(`Data not found in MongoDB for ${collection}`);
      return null;
    }
  } catch (error) {
    console.error(`Error reading data from ${collection}:`, error);
    return null;
  }
}

async function updateData(collection, query, updateData, sqliteTable) {
  try {
    // MongoDB update operation
    const Model = getMongoModel(collection);
    const updatedData = await Model.findOneAndUpdate(query, updateData, { new: true, upsert: true });

    // Update SQLite cache
    await cacheData(sqliteTable, updatedData);

    // Log the change
    await logChange(collection, 'update', JSON.stringify(updateData));

    return updatedData;
  } catch (error) {
    console.error(`Error updating data in ${collection}:`, error);
    throw error;
  }
}

async function deleteData(collection, query, sqliteTable) {
  try {
    // MongoDB delete operation
    const Model = getMongoModel(collection);
    await Model.deleteOne(query);

    // Delete from SQLite cache
    const stmt = sqliteDb.prepare(`DELETE FROM ${sqliteTable} WHERE sub = ?`);
    stmt.run(query.sub, (err) => {
      if (err) {
        console.error(`Error deleting from SQLite ${sqliteTable}:`, err.message);
      } else {
        console.log(`Data deleted from SQLite cache for ${collection}`);
      }
    });

    // Log the deletion
    await logChange(collection, 'delete', `Deleted entry with query: ${JSON.stringify(query)}`);
  } catch (error) {
    console.error(`Error deleting data from ${collection}:`, error);
    throw error;
  }
}

// Utility functions

function getMongoModel(collection) {
  if (collection === 'user') return UserModel;
  // Add more cases here for other collections if needed
  throw new Error(`Unknown collection: ${collection}`);
}

async function cacheData(sqliteTable, data) {
  const stmt = sqliteDb.prepare(`
    INSERT OR REPLACE INTO ${sqliteTable} (sub, name, given_name, family_name, picture)
    VALUES (?, ?, ?, ?, ?)
  `);
  stmt.run(data.sub, data.name, data.given_name, data.family_name, data.picture, (err) => {
    if (err) {
      console.error(`Error caching data in SQLite ${sqliteTable}:`, err.message);
    } else {
      console.log(`Data cached in SQLite ${sqliteTable}`);
    }
  });
}

async function logChange(collection, changeType, details) {
  const stmt = sqliteDb.prepare(`
    INSERT INTO change_log (collection, change_type, details)
    VALUES (?, ?, ?)
  `);
  stmt.run(collection, changeType, details, (err) => {
    if (err) {
      console.error(`Error logging change in ${collection}:`, err.message);
    } else {
      console.log(`Change logged for ${collection}`);
    }
  });
}

async function getCachedData(sqliteTable, sub) {
  return new Promise((resolve, reject) => {
    sqliteDb.get(`SELECT * FROM ${sqliteTable} WHERE sub = ?`, [sub], (err, row) => {
      if (err) {
        console.error(`Error retrieving cached data from ${sqliteTable}:`, err.message);
        reject(err);
      } else {
        resolve(row);
      }
    });
  });
}

module.exports = {
  createData,
  readData,
  updateData,
  deleteData,
  cacheData,
  getCachedData,
  logChange,
};