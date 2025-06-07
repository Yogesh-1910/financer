// routes/userRoutes.js
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { User } = require('../models');

// GET /api/users/me - Get current user's profile
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password'] } // Don't send password hash
    });
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// PUT /api/users/me - Update current user's profile
router.put('/me', authMiddleware, async (req, res) => {
  const { fullName, age, occupation, phoneNumber } = req.body;
  const userId = req.user.id;

  try {
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    user.fullName = fullName !== undefined ? fullName.trim() : user.fullName;
    user.age = age !== undefined ? (age === '' || age === null ? null : parseInt(age)) : user.age;
    user.occupation = occupation !== undefined ? occupation.trim() : user.occupation;
    user.phoneNumber = phoneNumber !== undefined ? phoneNumber.trim() : user.phoneNumber;

    await user.save();
    
    const { password, ...userWithoutPassword } = user.get({ plain: true });
    res.json(userWithoutPassword);
  } catch (err) {
    console.error('Profile Update Error:', err.message);
    if (err.name === 'SequelizeUniqueConstraintError') {
        return res.status(400).json({ msg: 'Phone number may already be in use by another account.' });
    }
    res.status(500).send('Server Error during profile update');
  }
});

module.exports = router;