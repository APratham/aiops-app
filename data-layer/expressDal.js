const { createUserInfo, getUserInfo, updateUserInfo, deleteUserInfo } = require('./dbOperations');
const express = require('express'); // Import Express
const router = express.Router(); // Initialize the router

router.post('/storeUserInfo', async (req, res) => {
  try {
    const userInfo = req.body;
    await createUserInfo(userInfo);
    res.status(200).send('User info stored successfully');
  } catch (error) {
    res.status(500).send('Failed to store user info');
  }
});

router.get('/getUserInfo/:sub', async (req, res) => {
  try {
    const sub = req.params.sub;
    const userInfo = await getUserInfo(sub);
    if (userInfo) {
      res.status(200).json(userInfo);
    } else {
      res.status(404).send('User not found in cache or database');
    }
  } catch (error) {
    res.status(500).send('Failed to retrieve user info');
  }
});

module.exports = router;
