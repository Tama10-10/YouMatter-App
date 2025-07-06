const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const authenticate = require('../middlewares/authenticate');
const User = require('../schemas/userSchema');

const crypto = require('crypto');
const nodemailer = require('nodemailer');


const router = express.Router();



router.use((req, res, next) => {
  console.log(`Incoming: ${req.method} ${req.originalUrl}`);
  next();
});
// Signup Route
router.post('/signup', async (req, res) => {
  try {
    const {
      name,
      userName,
      email,
      password,
      confirmPassword,
      emergencyContact,
      mobileNumber,
      secretPin,
      agreedToTerms
    } = req.body;
    console.log('Received signup data:', req.body);
    if (password !== confirmPassword) {
      return res.status(400).json({ error: 'Passwords do not match' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }
    const existingUser1 = await User.findOne({ userName });
    if (existingUser1) {
      return res.status(400).json({ error: 'Username already registered' });
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      name,
      userName,
      email,
      password: hashedPassword,
      emergencyContact,
      mobileNumber,
      secretPin,
      agreedToTerms
    });

    const savedUser = await newUser.save();
    console.log('Saved User:', savedUser);

    res.status(201).json({
      message: 'User registered successfully',
      userId: savedUser._id
    });

  } catch (err) {
    res.status(500).json({ error: 'Server error: ' + err.message });
  }
});
//login
router.post('/login', async (req, res) => {
  try {
    const { userName, password } = req.body;
    
    console.log('Received login data:', req.body);

    const user = await User.findOne({ userName });
    console.log('Found User:', user);
    if (!user) {
      return res.status(400).json({ error: 'User not found' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }
     const token=jwt.sign(
      { userName: user.userName ,
        userId: user._id 

      },process.env.JWT_SECRET,
  { expiresIn: "12h" });
   res.status(200).json({
  message: 'Login successful',
  accessToken: token,
  user: {
    _id: user._id,
    userName: user.userName
  }
});

  } catch (err) {
    res.status(500).json({ error: 'Server error: ' + err.message });
  }
});
router.get('/verify-token', authenticate, (req, res) => {
  // If authenticate middleware calls next(), token is valid
  console.log('Authorization header:', req.headers.authorization);

  res.json({ valid: true, user: req.user }); // req.user set by authenticate middleware
});
// Get User Profile
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password -__v');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Error fetching profile' });
  }
});
// Update profile fields
router.put('/:id/update',async (req, res) => {
  const { userName, email, mobileNumber, emergencyContact } = req.body;
  try {
    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { userName, email, mobileNumber, emergencyContact },
      { new: true }
    );
    res.json({ message: 'Profile updated', user: updatedUser });
  } catch (err) {
    res.status(500).json({ error: 'Error updating profile' });
  }
});
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });

  if (!user) return res.status(404).json({ error: 'No user found with this email' });

  const token = crypto.randomBytes(32).toString('hex');
  user.resetPasswordToken = token;
  user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
  await user.save();
  const host = req.headers.host; // e.g., "localhost:5000" or "yourdomain.com"
  const isLocalhost = host.startsWith('localhost') || host.startsWith('127.0.0.1');

  const Base = isLocalhost
  ? 'http://127.0.0.1:5501/public'
  : 'https://youmatter-app.onrender.com'; 

  const resetLink = `${Base}/reset-password.html?token=${token}`;
  // Send email
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER, // store in .env
      pass: process.env.EMAIL_PASS
    }
  });

  const mailOptions = {
    to: user.email,
    from: process.env.EMAIL_USER,
    subject: 'Reset Your Password',
    text: `You requested a password reset. Click this link to reset it:\n\n${resetLink}`
  };

  transporter.sendMail(mailOptions, (err, info) => {
    if (err) return res.status(500).json({ error: 'Email failed to send' });
    res.json({ message: 'Password reset link sent to your email' });
  });
});
router.post('/reset-password/:token', async (req, res) => {
  const { token } = req.params;
  const { newPassword } = req.body;
console.log('Reset token received in URL param:', token);

  const user = await User.findOne({
    resetPasswordToken: token,
    resetPasswordExpires: { $gt: Date.now() }
  });
  console.log('User found for token:', user);


  if (!user) return res.status(400).json({ error: 'Invalid or expired token' });

  const hashedPassword = await bcrypt.hash(newPassword, 10);
  user.password = hashedPassword;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  await user.save();

  res.json({ message: 'Password has been reset successfully' });
});


module.exports = router;