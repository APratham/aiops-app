const sqliteDb = require('./sqliteDb'); // Assume this is your SQLite database connection
const UserModel = require('../models/user.model'); // MongoDB model for users
const SettingsModel = require('../models/settings.model'); // MongoDB model for user settings

const sanitizedData = {};

// CRUD operations

/**  Create data in MongoDB and cache in SQLite 
 * @param {string} collection - The name of the collection in MongoDB
 * @param {object} data - The data to be created
 * @param {string} sqliteTable - The name of the table in SQLite
 * @returns {object} The data created in MongoDB
*/
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

/** Read data from MongoDB and cache in SQLite
 * @param {string} collection - The name of the collection in MongoDB
 * @param {object} query - The query to find the data
 * @param {string} sqliteTable - The name of the table in SQLite
 * @returns {object} The data found in MongoDB
*/
async function readData(collection, query, sqliteTable) {
  try {
    // SQLite read operation
    const cachedData = await getCachedData(sqliteTable, query.sub);
    if (cachedData) {
      console.log(`Data found in SQLite cache for ${collection}`);
      console.log('SQLite data:', cachedData);
      return cachedData;
    }

    // MongoDB read operation
    const Model = getMongoModel(collection);
    const dataFromMongo = await Model.findOne(query);
    if (dataFromMongo) {
      console.log(`Data found in MongoDB for ${collection}, caching in SQLite`);
      console.log('MongoDB data:', dataFromMongo);
      console.log('Type of MongoDB data:', typeof dataFromMongo);

      const { _id, __v, ...sanitizedData } = dataFromMongo.toObject ? dataFromMongo.toObject() : dataFromMongo;


      //console.log('Sanitized data:', sanitizedData);

      await cacheData(sqliteTable, dataFromMongo);
      return dataFromMongo;
    } else if (!dataFromMongo && !cachedData) {
      console.log(`Data not found in MongoDB for ${collection}`);
      return null;
    }
  } catch (error) {
    console.error(`Error reading data from ${collection}:`, error);
    return null;
  }
}

/** Update data in MongoDB and cache in SQLite
 * @param {string} collection - The name of the collection in MongoDB
 * @param {object} query - The query to find the data to update
 * @param {object} updateData - The data to update
 * @param {string} sqliteTable - The name of the table in SQLite
 * @returns {object} The updated data from MongoDB
*/
async function updateData(collection, query, updateData, sqliteTable) {
  try {
    if (updateData) {
      const mongoUpdateData = { $set: { 'settings.theme': updateData.theme } };
      const Model = getMongoModel(collection);

      console.log('MongoDB model:', Model);
      console.log('MongoDB query:', query);
      console.log('MongoDB updateData:', mongoUpdateData);

      const updatedData = await Model.findOneAndUpdate(query, mongoUpdateData, { new: true, upsert: true });
      console.log('MongoDB operation result:', updatedData);

      const sqliteUpdateData = {
        sub: updatedData.sub,
        theme: updatedData.settings.theme
      };

      await cacheData(sqliteTable, sqliteUpdateData);

      await logChange(collection, 'update', JSON.stringify(mongoUpdateData));

      return updatedData;
    } else if (!updateData || !query) {
      console.log('No data to update');
      return null;
    }
  } catch (error) {
    console.error(`Error updating data in ${collection}:`, error.message, error.stack);
    throw error;
  }
}



/** Delete data from MongoDB and SQLite cache
 * @param {string} collection - The name of the collection in MongoDB
 * @param {object} query - The query to find the data to delete
 * @param {string} sqliteTable - The name of the table in SQLite
 * @returns {void}
*/
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
  else if (collection === 'settings') return SettingsModel;
  else if (collection === 'change_log') return ChangeLogModel;
  else throw new Error(`Unknown collection: ${collection}`);
  // Add more cases here for other collections if needed
}

async function cacheData(sqliteTable, data) {
  console.log("Data to cache:", data);

  // Initialize sanitizedData
  const sanitizedData = {};

  // Sanitize the data by removing unwanted fields
  Object.keys(data).forEach(key => {
    if (!key.startsWith('$') && key !== '__v' && key !== '_id' && key !== '_doc' && key !== 'isNew') {
      sanitizedData[key] = data[key];
    }
  });

  console.log("Sanitized data:", sanitizedData);

  // If sanitizedData is empty, log a message and return early
  if (Object.keys(sanitizedData).length === 0) {
    console.error("Sanitized data is empty. Nothing to cache.");
    return;
  }

  // Now generate the query dynamically
  const keys = Object.keys(sanitizedData);
  const values = Object.values(sanitizedData);

  // Construct placeholders for the prepared statement
  const placeholders = keys.map(() => '?').join(', ');

  // Construct the SQL query dynamically
  const query = `
    INSERT OR REPLACE INTO ${sqliteTable} (${keys.join(', ')})
    VALUES (${placeholders})
  `;
  console.log("Generated SQL Query:", query);

  // Prepare the statement
  const stmt = sqliteDb.prepare(query);

  // Run the statement with the values
  stmt.run(values, (err) => {
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