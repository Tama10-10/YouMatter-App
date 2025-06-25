const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  userName:{
    type: String,
    required: true,
    unique: true,
    trim: true,
  },

  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
  },

  password: {
    type: String,
    required: true,
  },
  emergencyContact: {
    type: String,
    required: true,
  },
 

  mobileNumber: {
    type: String,
    required: true,
  },

  secretPin: {
    type: String,
    required: true,
  },

  agreedToTerms: {
    type: Boolean,
    required: true,
  },

  date: {
    type: Date,
    default: Date.now,
  }
});

module.exports = userSchema;
