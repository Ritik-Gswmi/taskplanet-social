const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Post = require('../models/Post');
const auth = require('../middleware/auth');

const router = express.Router();

const uploadsDir = path.join(__dirname, '..', 'uploads');
fs.mkdirSync(uploadsDir, { recursive: true });

const normalizeImageUrl = (image, baseUrl) => {
  if (!image) return '';
  if (image.startsWith('/uploads/')) return `${baseUrl}${image}`;

  // fix legacy local-dev URLs stored in DB
  const legacyLocal = image.match(/^https?:\/\/localhost:\d+\/uploads\/(.+)$/i);
  if (legacyLocal) return `${baseUrl}/uploads/${legacyLocal[1]}`;

  return image;
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const filename = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, filename);
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image uploads are allowed'));
    }
    cb(null, true);
  }
});

router.post('/', auth, upload.single('image'), async (req, res) => {
  try {
    const { text = '' } = req.body;
    const image = req.file
      ? `/uploads/${req.file.filename}`
      : req.body.image || '';

    if (!text.trim() && !image) return res.status(400).json({ message: 'Text or image required' });

    const post = new Post({
      userId: req.user.id,
      username: req.user.username,
      text: text.trim(),
      image,
      likes: [],
      comments: []
    });

    await post.save();

    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const created = post.toObject();
    created.image = normalizeImageUrl(created.image, baseUrl);
    res.status(201).json(created);
  } catch (err) {
    console.error(err); res.status(500).json({ message: 'Server error' });
  }
});

router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const posts = await Post.find().sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit);
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const normalized = posts.map((p) => {
      const obj = p.toObject();
      obj.image = normalizeImageUrl(obj.image, baseUrl);
      return obj;
    });
    res.json(normalized);
  } catch (err) {
    console.error(err); res.status(500).json({ message: 'Server error' });
  }
});

router.put('/:id/like', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    const userId = req.user.id;
    const index = post.likes.findIndex((likeUserId) => likeUserId.toString() === userId);
    if (index >= 0) {
      post.likes.splice(index, 1);
    } else {
      post.likes.push(userId);
    }

    await post.save();
    res.json(post);
  } catch (err) {
    console.error(err); res.status(500).json({ message: 'Server error' });
  }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || !text.trim()) return res.status(400).json({ message: 'Text is required' });

    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });
    if (post.userId.toString() !== req.user.id) return res.status(403).json({ message: 'Not authorized' });

    post.text = text.trim();
    await post.save();

    res.json(post);
  } catch (err) {
    console.error(err); res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });
    if (post.userId.toString() !== req.user.id) return res.status(403).json({ message: 'Not authorized' });

    await Post.findByIdAndDelete(req.params.id);
    res.json({ message: 'Post deleted' });
  } catch (err) {
    console.error(err); res.status(500).json({ message: 'Server error' });
  }
});

router.post('/:id/comment', auth, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || !text.trim()) return res.status(400).json({ message: 'Comment text required' });

    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    post.comments.push({ username: req.user.username, text: text.trim() });
    await post.save();

    res.status(201).json(post);
  } catch (err) {
    console.error(err); res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
