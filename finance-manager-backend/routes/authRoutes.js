// finance-manager-backend/routes/authRoutes.js
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('../models'); // Make sure User is correctly imported
const router = express.Router();

// POST /api/auth/signup
router.post('/signup', async (req, res) => {
  console.log("[Backend Signup] Received request body:", req.body);
  const { fullName, age, occupation, phoneNumber, username, password } = req.body;

  // Validate required fields
  if (!fullName || !username || !password) {
    console.log("[Backend Signup] Validation Error: Missing required fields.");
    return res.status(400).json({ msg: 'Full name, username, and password are required.' });
  }
  if (fullName.trim() === "" || username.trim() === "" || password === "") { // Password itself shouldn't be just spaces
     console.log("[Backend Signup] Validation Error: Required fields cannot be empty or just whitespace.");
     return res.status(400).json({ msg: 'Full name, username, and password cannot be empty.' });
  }
  if (password.length < 6) {
     console.log("[Backend Signup] Validation Error: Password too short.");
     return res.status(400).json({ msg: 'Password must be at least 6 characters long.' });
  }


  try {
    const trimmedUsername = username.trim();
    let existingUser = await User.findOne({ where: { username: trimmedUsername } });
    if (existingUser) {
      console.log("[Backend Signup] Error: Username already exists -", trimmedUsername);
      return res.status(400).json({ msg: 'Username already exists' });
    }

    // Prepare data for user creation
    const userToCreate = {
      fullName: fullName.trim(),
      username: trimmedUsername,
      password: password, // Password will be hashed by the model's beforeCreate hook
      age: age !== undefined && age !== '' && !isNaN(parseInt(age)) ? parseInt(age) : null,
      occupation: occupation !== undefined && occupation !== '' ? occupation.trim() : null,
      phoneNumber: phoneNumber !== undefined && phoneNumber !== '' ? phoneNumber.trim() : null,
    };
    console.log("[Backend Signup] Attempting to create user with data:", userToCreate);

    const newUser = await User.create(userToCreate);
    console.log("[Backend Signup] User created successfully:", newUser.id);


    const payload = { user: { id: newUser.id, username: newUser.username } };
    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '5h' },
      (err, token) => {
        if (err) {
          console.error("[Backend Signup] JWT Signing Error:", err);
          throw err; // This will be caught by the outer try-catch
        }
        console.log("[Backend Signup] JWT generated, sending response.");
        res.status(201).json({
          token,
          user: { // Send back some basic user info
            id: newUser.id,
            username: newUser.username,
            fullName: newUser.fullName,
            // You can add other non-sensitive fields here if needed by frontend immediately
          }
        });
      }
    );
  } catch (err) {
    console.error('[Backend Signup] Full Error Object:', err);
    if (err.name === 'SequelizeUniqueConstraintError') {
      // Example: err.errors might contain [{ message: 'phoneNumber must be unique', path: 'phoneNumber', ... }]
      const field = err.errors && err.errors.length > 0 ? err.errors[0].path : 'unique field';
      return res.status(400).json({ msg: `An account with that ${field} already exists.` });
    }
    if (err.name === 'SequelizeValidationError') {
      const messages = err.errors.map(e => `${e.path}: ${e.message}`);
      return res.status(400).json({ msg: 'Validation Error', details: messages });
    }
    res.status(500).json({ msg: 'Server error during signup.', error: err.message });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  console.log("[Backend Login] Received request body:", req.body);
  const { username, password } = req.body;

  if (!username || !password) {
    console.log("[Backend Login] Validation Error: Missing username or password.");
    return res.status(400).json({ msg: 'Please provide username and password.' });
  }

  try {
    const user = await User.findOne({ where: { username: username.trim() } });
    if (!user) {
      console.log("[Backend Login] Error: User not found -", username.trim());
      return res.status(400).json({ msg: 'Invalid credentials.' }); // Generic message
    }

    const isMatch = await user.isValidPassword(password);
    if (!isMatch) {
      console.log("[Backend Login] Error: Password mismatch for user -", username.trim());
      return res.status(400).json({ msg: 'Invalid credentials.' }); // Generic message
    }

    console.log("[Backend Login] Login successful for user:", user.id);
    const payload = { user: { id: user.id, username: user.username } };
    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '5h' },
      (err, token) => {
        if (err) {
          console.error("[Backend Login] JWT Signing Error:", err);
          throw err;
        }
        console.log("[Backend Login] JWT generated, sending response.");
        res.json({
          token,
          user: { // Send back user info needed by frontend context
            id: user.id,
            username: user.username,
            fullName: user.fullName,
            age: user.age,
            occupation: user.occupation,
            phoneNumber: user.phoneNumber
          }
        });
      }
    );
  } catch (err) {
    console.error('[Backend Login] Full Error Object:', err);
    res.status(500).json({ msg: 'Server error during login.', error: err.message });
  }
});

module.exports = router;