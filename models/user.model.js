const mongoose = require('mongoose');

mongoose.set('debug', true);

const UserSchema = new mongoose.Schema({
  sub: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  given_name: { type: String, required: true },
  family_name: { type: String, required: true },
  picture: { type: String, required: true },
});

const UserModel = mongoose.model('User', UserSchema);

module.exports = UserModel;
