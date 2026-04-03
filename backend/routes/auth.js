const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Post = require('../models/Post');
const auth = require('../middleware/auth');

const router = express.Router();

const normalizeEmail = (value) => (typeof value === 'string' ? value.trim().toLowerCase() : '');
const normalizeUsername = (value) => (typeof value === 'string' ? value.trim() : '');
const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

router.post('/signup', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const normalizedUsername = normalizeUsername(username);
    const normalizedEmail = normalizeEmail(email);

    if (!normalizedUsername || !normalizedEmail || !password) return res.status(400).json({ message: 'All fields are required' });
    if (normalizedUsername.length < 3) return res.status(400).json({ message: 'Username must be at least 3 characters' });
    if (password.length < 6) return res.status(400).json({ message: 'Password must be at least 6 characters' });
    if (!/^\S+@\S+\.\S+$/.test(normalizedEmail)) return res.status(400).json({ message: 'Invalid email format' });

    const exists = await User.findOne({
      $or: [
        { email: new RegExp(`^${escapeRegExp(normalizedEmail)}$`, 'i') },
        { username: normalizedUsername }
      ]
    });
    if (exists) return res.status(409).json({ message: 'Email or username already exists' });

    const hashed = await bcrypt.hash(password, 10);
    const user = new User({ username: normalizedUsername, email: normalizedEmail, password: hashed });

    try {
      await user.save();
    } catch (saveErr) {
      if (saveErr?.code === 11000) return res.status(409).json({ message: 'Email or username already exists' });
      throw saveErr;
    }

    const token = jwt.sign({ id: user._id, username: user.username, email: user.email }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ user: { id: user._id, username: user.username, email: user.email }, token });
  } catch (err) {
    console.error(err); res.status(500).json({ message: 'Server error' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = normalizeEmail(email);
    if (!normalizedEmail || !password) return res.status(400).json({ message: 'Email and password required' });

    let user = await User.findOne({ email: normalizedEmail });
    if (!user && typeof email === 'string' && email.trim()) {
      user = await User.findOne({ email: new RegExp(`^${escapeRegExp(email.trim())}$`, 'i') });
    }
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    let matched = false;
    try {
      matched = await bcrypt.compare(password, user.password);
    } catch {
      matched = false;
    }
    if (!matched) return res.status(401).json({ message: 'Invalid credentials' });

    const token = jwt.sign({ id: user._id, username: user.username, email: user.email }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ user: { id: user._id, username: user.username, email: user.email }, token });
  } catch (err) {
    console.error(err); res.status(500).json({ message: 'Server error' });
  }
});

router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });

    const postCount = await Post.countDocuments({ userId: req.user.id });
    res.json({ user, postCount });
  } catch (err) {
    console.error(err); res.status(500).json({ message: 'Server error' });
  }
});

router.put('/profile', auth, async (req, res) => {
  try {
    const { username, email, currentPassword, newPassword, resetPassword } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    let changed = false;

    const normalizedUsername = normalizeUsername(username);
    if (normalizedUsername && normalizedUsername.length >= 3 && normalizedUsername !== user.username) {
      const exists = await User.findOne({ _id: { $ne: req.user.id }, username: normalizedUsername });
      if (exists) return res.status(409).json({ message: 'Username already taken' });
      user.username = normalizedUsername;
      changed = true;
    }

    const normalizedEmail = normalizeEmail(email);
    if (normalizedEmail && normalizedEmail !== user.email) {
      if (!/^\S+@\S+\.\S+$/.test(normalizedEmail)) return res.status(400).json({ message: 'Invalid email format' });
      const exists = await User.findOne({
        _id: { $ne: req.user.id },
        email: new RegExp(`^${escapeRegExp(normalizedEmail)}$`, 'i')
      });
      if (exists) return res.status(409).json({ message: 'Email already in use' });
      user.email = normalizedEmail;
      changed = true;
    }

    if (newPassword) {
      if (newPassword.length < 6) return res.status(400).json({ message: 'New password must be at least 6 characters' });

      if (resetPassword) {
        user.password = await bcrypt.hash(newPassword, 10);
        changed = true;
      } else {
        if (!currentPassword) return res.status(400).json({ message: 'Current password required' });
        const match = await bcrypt.compare(currentPassword, user.password);
        if (!match) return res.status(401).json({ message: 'Wrong password' });

        user.password = await bcrypt.hash(newPassword, 10);
        changed = true;
      }
    }

    if (!changed) return res.status(400).json({ message: 'No valid updates provided' });

    await user.save();

    const postCount = await Post.countDocuments({ userId: req.user.id });
    res.json({ user: { id: user._id, username: user.username, email: user.email }, postCount, message: 'Profile updated successfully' });
  } catch (err) {
    console.error(err); res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
