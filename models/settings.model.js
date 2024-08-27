const mongoose = require('mongoose');

mongoose.set('debug', true);


const SettingsSchema = new mongoose.Schema({
    sub: { type: String, required: true, unique: true }, // Reference to the User model
    settings: {
        theme: { type: String, required: true },
        notifications: { type: Number, required: true },
        docker: { type: Number, required: true },
      },
});

const SettingsModel = mongoose.model('Settings', SettingsSchema);

module.exports = SettingsModel;

/**
 sub: "101533395827973845474",
 settings: {
    theme: "dark",
}
    sub: "116507055371194802833",
    settings: {
        theme: "light",
    }
 */
