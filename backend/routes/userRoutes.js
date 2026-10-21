const express = require('express');
const router = express.Router();
const User = require('../models/User');
const HealthData = require('../models/HealthData');
const { verifyToken, generateToken } = require('../middleware/auth');
const {
  validateRegister,
  validateLogin,
  validateProfileUpdate,
  validateDeleteMe
} = require('../middleware/validation');

// @route   POST /api/users/register
// @desc    Register a new user
// @access  Public
router.post('/register', validateRegister, async (req, res) => {
  try {
    const { name, email, password, age, height, weight, diagnosedWithPCOS, familyHistory } = req.body;
    const normalizedEmail = email.toLowerCase().trim();

    // Check if user already exists
    const userExists = await User.findOne({ email: normalizedEmail });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create new user
    const user = await User.create({
      name,
      email: normalizedEmail,
      password,
      age,
      height,
      weight,
      diagnosedWithPCOS,
      familyHistory
    });

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      age: user.age,
      bmi: user.bmi,
      token: generateToken(user._id)
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error registering user' });
  }
});

// @route   POST /api/users/login
// @desc    Authenticate user & get token
// @access  Public
router.post('/login', validateLogin, async (req, res) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = email.toLowerCase().trim();

    // Find user by email including hidden password
    const user = await User.findOne({ email: normalizedEmail }).select('+password');
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Check if password matches
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Update last login timestamp
    user.lastLogin = Date.now();
    await user.save();

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      age: user.age,
      bmi: user.bmi,
      token: generateToken(user._id)
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// @route   GET /api/users/profile
// @desc    Get current user profile
// @access  Private
router.get('/profile', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      age: user.age,
      height: user.height,
      weight: user.weight,
      bmi: user.bmi,
      diagnosedWithPCOS: user.diagnosedWithPCOS,
      familyHistory: user.familyHistory
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Server error fetching profile' });
  }
});

// @route   PUT /api/users/profile
// @desc    Update user profile (requires currentPassword for email or password change)
// @access  Private
router.put('/profile', verifyToken, validateProfileUpdate, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('+password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const { currentPassword, email, password, name, age, height, weight, diagnosedWithPCOS, familyHistory } = req.body;
    let passwordChanged = false;

    // If changing email or password, require currentPassword verification
    const isChangingEmail = email && email.toLowerCase().trim() !== user.email.toLowerCase();
    const isChangingPassword = Boolean(password);

    if (isChangingEmail || isChangingPassword) {
      if (!currentPassword) {
        return res.status(400).json({ message: 'Current password is required to change email or password' });
      }

      const isCurrentMatch = await user.matchPassword(currentPassword);
      if (!isCurrentMatch) {
        return res.status(401).json({ message: 'Invalid current password' });
      }

      if (isChangingEmail) {
        const targetEmail = email.toLowerCase().trim();
        const existingEmailUser = await User.findOne({ email: targetEmail });
        if (existingEmailUser && existingEmailUser._id.toString() !== user._id.toString()) {
          return res.status(409).json({ message: 'Email is already in use by another account' });
        }
        user.email = targetEmail;
      }

      if (isChangingPassword) {
        user.password = password;
        passwordChanged = true;
      }
    }

    // Update profile attributes
    if (name !== undefined) user.name = name;
    if (age !== undefined) user.age = age;
    if (height !== undefined) user.height = height;
    if (weight !== undefined) user.weight = weight;
    if (diagnosedWithPCOS !== undefined) user.diagnosedWithPCOS = diagnosedWithPCOS;
    if (familyHistory !== undefined) user.familyHistory = familyHistory;

    const updatedUser = await user.save();

    const response = {
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      age: updatedUser.age,
      height: updatedUser.height,
      weight: updatedUser.weight,
      bmi: updatedUser.bmi,
      diagnosedWithPCOS: updatedUser.diagnosedWithPCOS,
      familyHistory: updatedUser.familyHistory
    };

    // Only issue a new token if the password changed
    if (passwordChanged) {
      response.token = generateToken(updatedUser._id);
    }

    res.json(response);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: 'Email is already in use by another account' });
    }
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Server error updating profile' });
  }
});

// @route   DELETE /api/users/me
// @desc    Permanently delete own user account and associated health data
// @access  Private
router.delete('/me', verifyToken, validateDeleteMe, async (req, res) => {
  try {
    const { currentPassword } = req.body;
    const user = await User.findById(req.userId).select('+password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid current password' });
    }

    // Delete associated HealthData records first
    await HealthData.deleteMany({ user: req.userId });

    // Delete user account
    await User.findByIdAndDelete(req.userId);

    res.json({ message: 'Account and associated health records permanently deleted' });
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({ message: 'Server error deleting account' });
  }
});

module.exports = router;