const { createUserInfo, getUserInfo, updateUserInfo, deleteUserInfo, 
        saveUserSettings, fetchUserSettings, deleteUserSettings } = require('./dbOperations');

const connectDB = require('./mongoDB'); // Import the MongoDB connection

const express = require('express'); // Import Express
const router = express.Router(); // Initialize the router

const { updateData } = require('./dbOperations'); // Adjust the path as necessary

router.use(express.json());

connectDB();

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

router.post('/saveUserSettings', async (req, res) => {
  console.log('Received payload:', req.body); // Log the payload received
  try {
    const { sub, settings } = req.body;
    const updateDataPayload = { theme: settings.theme }; // Structure updateData correctly

    await updateData('settings', { sub }, updateDataPayload, 'user_settings'); // Correctly call updateData

    console.log('MongoDB updateData:', updateDataPayload);
    res.status(200).send('User settings saved successfully');
  } catch (error) {
    console.error('Failed to save user settings:', error);
    res.status(500).send('Failed to save user settings');
  }
});


router.get('/getUserSettings/:sub', async (req, res) => {
  try {
    const sub = req.params.sub;
    const settings = await fetchUserSettings(sub);
    if (settings) {
      res.status(200).json(settings);
    } else {
      res.status(404).send('Settings not found');
    }
  } catch (error) {
    res.status(500).send('Failed to retrieve user settings');
  }
});


router.delete('/deleteUserSettings/:sub', async (req, res) => {
  try {
    const sub = req.params.sub;
    await deleteUserSettings(sub);
    res.status(200).send('User settings deleted successfully');
  } catch (error) {
    res.status(500).send('Failed to delete user settings');
  }
});

module.exports = router;
