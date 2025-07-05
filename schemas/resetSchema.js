// models/User.js
const mongoose = require('mongoose');

const resetSchema = new mongoose.Schema({
  email: String,
  password: String,
  resetPasswordToken: String,
  resetPasswordExpires: Date,
});

module.exports = mongoose.model('User', resetSchema);
