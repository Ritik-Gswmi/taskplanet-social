import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Paper, Box, TextField, Button, Typography, CircularProgress, Alert, Avatar, IconButton } from '@mui/material';
import { Search as SearchIcon, Send as SendIcon, InsertEmoticon as InsertEmoticonIcon, Image as ImageIcon, LightMode as LightModeIcon, DarkMode as DarkModeIcon } from '@mui/icons-material';
import { getPosts, createPost, likePost, commentPost, updatePost, deletePost } from '../services/api';
import PostCard from '../components/PostCard';

const FeedPage = () => {
  const navigate = useNavigate();
  const [text, setText] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [searchValue, setSearchValue] = useState('');
  const [search, setSearch] = useState('');
  const [darkMode, setDarkMode] = useState(localStorage.getItem('darkMode') === 'true');
  const [successMsg, setSuccessMsg] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const fileInputRef = useRef(null);
  const emojis = ['😀', '😄', '😍', '🔥', '🎉', '👍', '🤩'];

  const getStoredUser = () => {
    try {
      return JSON.parse(localStorage.getItem('user')) || null;
    } catch {
      return null;
    }
  };

  const getUserIdFromToken = () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return null;
      const payload = token.split('.')[1];
      if (!payload) return null;
      const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
      const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
      const json = atob(padded);
      const parsed = JSON.parse(json);
      return parsed?.id || null;
    } catch {
      return null;
    }
  };

  const storedUser = getStoredUser();
  const userId = storedUser?.id || storedUser?._id || getUserIdFromToken();
  const user = storedUser || { username: 'User', id: userId };

  const filteredPosts = posts
    .filter((post) => {
      if (filter === 'my-post') return post.userId === userId;
      if (filter === 'most-liked') return post.likes.length > 0;
      if (filter === 'most-commented') return post.comments.length > 0;
      return true;
    })
    .filter((post) => {
      const target = `${post.text || ''} ${post.username || ''}`.toLowerCase();
      return target.includes(search.toLowerCase());
    })
    .sort((a, b) => {
      if (filter === 'most-liked') return b.likes.length - a.likes.length;
      if (filter === 'most-commented') return b.comments.length - a.comments.length;
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

  useEffect(() => {
    document.body.classList.toggle('dark-mode', darkMode);
    localStorage.setItem('darkMode', darkMode);
  }, [darkMode]);

  const loadPosts = async () => {
    setLoading(true);
    try {
      const { data } = await getPosts();
      const stored = getStoredUser();
      const currentUserId = stored?.id || stored?._id || getUserIdFromToken();
      const normalized = data.map((post) => ({ ...post, liked: currentUserId ? post.likes.includes(currentUserId) : false }));
      setPosts(normalized);
    } catch (err) {
      setError('Could not load posts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPosts();
  }, []);

  const handleCreate = async () => {
    if (!text.trim() && !imageFile) {
      setError('Text or image is required');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('text', text);
      if (imageFile) formData.append('image', imageFile);

      await createPost(formData);
      setText('');
      setImageFile(null);
      setError('');
      setSuccessMsg('Post created successfully');
      setTimeout(() => setSuccessMsg(''), 3000);
      await loadPosts();
    } catch (err) {
      setError(err.response?.data?.message || 'Post creation failed');
    }
  };

  const handleLike = async (postId) => {
    try {
      await likePost(postId);
      await loadPosts();
    } catch (err) {
      console.error(err);
    }
  };

  const handleComment = async (postId, commentText) => {
    try {
      await commentPost(postId, { text: commentText });
      await loadPosts();
    } catch (err) {
      console.error(err);
    }
  };

  const handleEditPost = async (postId, newText) => {
    try {
      await updatePost(postId, { text: newText });
      await loadPosts();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeletePost = async (postId) => {
    try {
      await deletePost(postId);
      setSuccessMsg('Post deleted successfully');
      setTimeout(() => setSuccessMsg(''), 3000);
      await loadPosts();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Could not delete post');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login', { replace: true });
  };

  return (
    <Box sx={{ px: { xs: 1, sm: 2, md: 3 }, py: 2, maxWidth: 1200, mx: 'auto' }}>
      <Box textAlign="center" mb={1}>
        <Typography
          variant="h3"
          sx={{
            fontWeight: 800,
            letterSpacing: 1,
            background: 'linear-gradient(90deg, #1976d2, #69b4ff)',
            WebkitBackgroundClip: 'text',
            color: 'transparent',
            fontSize: { xs: '1.8rem', sm: '2.5rem', md: '3rem' },
          }}
        >
          TaskPlanet Social
        </Typography>
        <Typography
          variant="subtitle1"
          sx={{
            color: '#546e7a',
            mt: 0.5,
            fontSize: { xs: '0.85rem', sm: '1rem' },
          }}
        >
          Share your journey with the TaskPlanet community
        </Typography>
        {successMsg && <Alert severity="success" sx={{ mt: 1 }}>{successMsg}</Alert>}
      </Box>

      <Box
        display="flex"
        flexDirection={{ xs: 'column', sm: 'row' }}
        justifyContent="space-between"
        alignItems={{ xs: 'stretch', sm: 'center' }}
        gap={2}
        mb={2}
      >
        <Box display="flex" alignItems="center" gap={1} justifyContent={{ xs: 'center', sm: 'flex-start' }}>
          <Avatar
            sx={{ bgcolor: '#0d47a1', cursor: 'pointer' }}
            onClick={() => navigate('/profile')}
          >
            {user.username.charAt(0).toUpperCase()}
          </Avatar>
          <IconButton
            color="primary"
            sx={{ bgcolor: '#e6ecf7', width: 48, height: 48 }}
            onClick={() => setDarkMode((prev) => !prev)}
          >
            {darkMode ? <LightModeIcon /> : <DarkModeIcon />}
          </IconButton>
          <Button variant="outlined" size="small" onClick={handleLogout}>
            Logout
          </Button>
        </Box>

        <Box
          display="flex"
          alignItems="center"
          gap={1}
          flexDirection={{ xs: 'column', sm: 'row' }}
          width={{ xs: '100%', sm: 'auto' }}
        >
          <TextField
            variant="outlined"
            placeholder="Search posts..."
            value={searchValue}
            onChange={(e) => {
              const value = e.target.value;
              setSearchValue(value);
              if (!value) setSearch('');
            }}
            size="small"
            fullWidth
            sx={{ width: { xs: '100%', sm: 300 } }}
            onKeyDown={(e) => { if (e.key === 'Enter') setSearch(searchValue); }}
            InputProps={{
              endAdornment: searchValue ? (
                <IconButton size="small" onClick={() => {
                  setSearchValue('');
                  setSearch('');
                }}>
                  ×
                </IconButton>
              ) : null,
            }}
          />
          <IconButton
            color="primary"
            sx={{ bgcolor: '#1e90ff', width: 48, height: 48 }}
            onClick={() => setSearch(searchValue)}
          >
            <SearchIcon sx={{ color: '#fff' }}/>
          </IconButton>
        </Box>
      </Box>

      <Typography variant="h5" sx={{ fontWeight: 700, mb: 1, fontSize: { xs: '1.2rem', sm: '1.5rem' } }}>Create Post</Typography>
      <Paper className="social-card" sx={{ p: { xs: 2, sm: 3 }, mb: 2, background: '#fff', border: '1px solid #e6ecf7', borderRadius: 2 }}>
        {error && <Alert severity="error" sx={{ mb: 1 }}>{error}</Alert>}
        <Box display="flex" flexDirection="column" gap={1}>
          <TextField
            multiline
            minRows={2}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="What's on your mind?"
            fullWidth
          />

          <Box display="flex" flexDirection={{ xs: 'column', sm: 'row' }} alignItems={{ xs: 'stretch', sm: 'center' }} gap={1}>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={(e) => setImageFile(e.target.files[0])}
              style={{ display: 'none' }}
            />

            <Button
              variant="outlined"
              startIcon={<ImageIcon />}
              onClick={() => fileInputRef.current?.click()}
              sx={{ width: { xs: '100%', sm: 'auto' } }}
            >
              Choose File
            </Button>

            <Typography
              variant="body2"
              sx={{
                flex: 1,
                color: '#6b7280',
                textAlign: { xs: 'center', sm: 'left' },
                display: { xs: 'block', sm: 'flex' },
                alignItems: 'center',
              }}
            >
              {imageFile ? imageFile.name : 'No file chosen'}
            </Typography>

            <IconButton
              aria-label="emoji"
              onClick={() => setShowEmojiPicker((prev) => !prev)}
            >
              <InsertEmoticonIcon />
            </IconButton>

            <Button
              variant="contained"
              endIcon={<SendIcon />}
              onClick={handleCreate}
              sx={{ width: { xs: '100%', sm: 'auto' } }}
            >
              Post
            </Button>
          </Box>

          {showEmojiPicker && (
            <Box display="flex" gap={1} flexWrap="wrap" p={1}>
              {emojis.map((emoji) => (
                <Button key={emoji} size="small" onClick={() => {
                  setText((prev) => prev + emoji);
                  setShowEmojiPicker(false);
                }}>
                  {emoji}
                </Button>
              ))}
            </Box>
          )}
        </Box>
      </Paper>

      <Box
        display="flex"
        gap={1}
        mb={2}
        flexWrap="wrap"
        justifyContent={{ xs: 'center', sm: 'flex-start' }}
      >
        {['all', 'my-post', 'most-liked', 'most-commented'].map((item) => (
          <Button
            key={item}
            variant={filter === item ? 'contained' : 'outlined'}
            onClick={() => setFilter(item)}
            size="small"
            sx={{ fontSize: { xs: '0.75rem', sm: '1rem' }, py: { xs: 0.5, sm: 1 } }}
          >
            {item === 'all' && 'All Posts'}
            {item === 'my-post' && 'My Post'}
            {item === 'most-liked' && 'Most Liked'}
            {item === 'most-commented' && 'Most Commented'}
          </Button>
        ))}
      </Box>

      {loading && <CircularProgress />}
      {!loading && filteredPosts.length === 0 && (
        <Typography>
          {filter === 'most-commented' ? 'No comments available yet for any posts.' : 'No posts yet.'}
        </Typography>
      )}
      {filteredPosts.map((post) => (
        <PostCard
          key={post._id}
          post={post}
          currentUserId={userId}
          onLike={handleLike}
          onComment={handleComment}
          onEdit={handleEditPost}
          onDelete={handleDeletePost}
        />
      ))}
    </Box>
  );
};

export default FeedPage;
