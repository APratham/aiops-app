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

module.exports = {
  createUserInfo,
  getUserInfo,
  updateUserInfo,
  deleteUserInfo,
  cacheUserInfo
};