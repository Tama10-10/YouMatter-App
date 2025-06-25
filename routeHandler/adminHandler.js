// routeHandler/adminHandler.js
const express = require('express');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const router = express.Router();

router.post('/login', (req, res) => {
  const { userName, password } = req.body;
 
  if (
    userName === process.env.ADMIN_USERNAME &&
    password === process.env.ADMIN_PASSWORD
  ) {
    const token = jwt.sign(
      {
        userName,
        isAdmin: true,
      },
      process.env.JWT_SECRET
    );

    return res.status(200).json({
      message: 'Admin login successful',
      accessToken: token,
      user: {
        userName,
        isAdmin: true,
      },
    });
  } else {
    return res.status(401).json({ error: 'Invalid admin credentials' });
  }
});

module.exports = router;
