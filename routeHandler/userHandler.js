const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const authenticate = require('../middlewares/authenticate');
const userSchema = require('../schemas/userSchema');
const router = express.Router();

const User = mongoose.models.User || mongoose.model('User', userSchema);


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
  { expiresIn: "1h" });
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

module.exports = router;



