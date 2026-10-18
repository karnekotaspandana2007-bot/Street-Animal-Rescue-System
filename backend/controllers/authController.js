const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Generate JWT
const generateToken = (id) => {
    const secret = process.env.JWT_SECRET || 'smart_street_animal_rescue_secret_key_2026';
    return jwt.sign({ id }, secret, {
        expiresIn: '30d',
    });
};

// @desc    Register a user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
    try {
        let { name, email, phone, password, role, location } = req.body;
        
        email = String(email || '').trim().toLowerCase();
        name = String(name || '').trim();
        phone = String(phone || '').trim();

        // Check if user exists
        const userExists = await User.findOne({ email });

        if (userExists) {
            return res.status(400).json({ success: false, message: 'User already exists with this email. Please login.' });
        }

        // Create user
        const user = await User.create({
            name,
            email,
            phone,
            password,
            role: role || 'user',
            location: location || ''
        });

        if (user) {
            res.status(201).json({
                success: true,
                message: 'Registration successful. Please login.'
            });
        } else {
            res.status(400).json({ success: false, message: 'Invalid user data' });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Authenticate a user
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
    try {
        let { email, password } = req.body;
        email = String(email || '').trim().toLowerCase();

        // Check for user email
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid credentials. Please check your email or password.' });
        }

        // Check if password matches
        const isMatch = await user.matchPassword(password);

        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Invalid credentials. Please check your email or password.' });
        }

        res.json({
            success: true,
            token: generateToken(user._id),
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ 
            success: false, 
            message: error.message || 'Authentication error. Please try again.' 
        });
    }
};

// @desc    Get user data
// @route   GET /api/auth/profile
// @access  Private
const getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        res.json({ success: true, data: user });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    registerUser,
    loginUser,
    getProfile
};
