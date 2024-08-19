const express = require('express');
const { storeUserInfo, getCachedUserInfo } = require('./dal');

const router = express.Router();

// Example route for testing purposes
router.post('/storeUserInfo', async (req, res) => {
  try {
    const userInfo = req.body;
    await storeUserInfo(userInfo);
    res.status(200).send('User info stored successfully');
  } catch (error) {
    res.status(500).send('Failed to store user info');
  }
});

router.get('/getUserInfo/:sub', (req, res) => {
  const sub = req.params.sub;
  const userInfo = getCachedUserInfo(sub);
  if (userInfo) {
    res.status(200).json(userInfo);
  } else {
    res.status(404).send('User not found in cache');
  }
});

module.exports = router;
