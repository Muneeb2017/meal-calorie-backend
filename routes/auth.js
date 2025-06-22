const express = require('express');
const User = require('../models/User');
const { asyncHandler } = require('../middleware/errorHandler');
const {
  validateRegistration,
  validateLogin,
  handleValidationErrors
} = require('../middleware/validation');

const router = express.Router();

/**
 * @route   POST /auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post('/register', 
  validateRegistration,
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const { firstName, lastName, email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        error: 'Registration failed',
        message: 'User with this email already exists'
      });
    }

    // Create new user
    const user = new User({
      firstName,
      lastName,
      email,
      password
    });

    await user.save();

    // Generate JWT token
    const token = user.generateAuthToken();

    // Log successful registration
    console.log(` New user registered: ${email}`);

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        createdAt: user.createdAt
      },
      token
    });
  })
);

/**
 * @route   POST /auth/login
 * @desc    Login user
 * @access  Public
 */
router.post('/login',
  validateLogin,
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    try {
      // Find user by credentials
      const user = await User.findByCredentials(email, password);
      
      // Generate JWT token
      const token = user.generateAuthToken();

      // Log successful login
      console.log(` User logged in: ${email}`);

      res.json({
        message: 'Login successful',
        user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          lastLogin: user.lastLogin
        },
        token
      });

    } catch (error) {
      console.log(`Failed login attempt: ${email}`);
      res.status(401).json({
        error: 'Authentication failed',
        message: 'Invalid email or password'
      });
    }
  })
);

module.exports = router;