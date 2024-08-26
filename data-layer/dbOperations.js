const { createData, readData, updateData, deleteData, cacheData, logChange } = require('./dal');

async function createUserInfo(userInfo) {
  return await createData('user', userInfo, 'user_info');
}

async function getUserInfo(sub) {
  return await readData('user', { sub }, 'user_info');
}

async function updateUserInfo(sub, updatedInfo) {
  return await updateData('user', { sub }, updatedInfo, 'user_info');
}

async function deleteUserInfo(sub) {
  return await deleteData('user', { sub }, 'user_info');
}

async function cacheUserInfo(userInfo) {
  try {
    // Cache user info in SQLite using the generalized cacheData function
    await cacheData('user_info', userInfo);

    // Log the caching action
    await logChange('user', 'cache', JSON.stringify(userInfo));

    console.log('User info cached successfully in SQLite');
  } catch (error) {
    console.error('Error caching user info:', error);
  }
}

async function saveUserSettings(sub, settings) {
  console.log(`Saving settings for user: ${sub} with data:`, settings);
  const query = { sub };  // The query to find the settings by user ID (sub)
  console.log('MongoDB query:', query);
  return await updateData('settings', query, settings, 'user_settings');
}

async function fetchUserSettings(sub) {
  const query = { sub };
  return await readData('settings', query, 'user_settings');
}

async function deleteUserSettings(sub) {
  const query = { sub };
  return await deleteData('user_settings', query, 'user_settings');
}

module.exports = {
  updateData,
  createUserInfo,
  getUserInfo,
  updateUserInfo,
  deleteUserInfo,
  cacheUserInfo,
  saveUserSettings,
  fetchUserSettings,
  deleteUserSettings,
};