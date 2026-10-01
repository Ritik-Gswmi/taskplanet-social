import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Paper, Box, TextField, Button, Typography, Alert, IconButton } from '@mui/material';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import { getProfile, updateProfile } from '../services/api';

const ProfilePage = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState({ username: '', email: '' });
  const [postCount, setPostCount] = useState(0);
  const [usernameInput, setUsernameInput] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showProfileForm, setShowProfileForm] = useState(false);
  const [resetMode, setResetMode] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    document.body.classList.toggle('dark-mode', localStorage.getItem('darkMode') === 'true');
  }, []);

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      try {
        const { data } = await getProfile();
        setUser({ username: data.user.username, email: data.user.email });
        setUsernameInput(data.user.username);
        setEmailInput(data.user.email);
        setPostCount(data.postCount || 0);
      } catch (err) {
        console.error(err);
        setError(err.response?.data?.message || 'Could not load profile');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleSave = async () => {
    setError('');
    setSuccess('');

    if (usernameInput.trim().length < 3) {
      setError('Username must be at least 3 characters');
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(emailInput.trim())) {
      setError('Invalid email format');
      return;
    }

    const payload = {
      username: usernameInput.trim(),
      email: emailInput.trim(),
    };

    if (newPassword.trim()) {
      if (!resetMode && !currentPassword.trim()) {
        setError('Current password is required to change password');
        return;
      }
      payload.newPassword = newPassword.trim();
      if (resetMode) {
        payload.resetPassword = true;
      } else {
        payload.currentPassword = currentPassword.trim();
      }
    }

    try {
      const { data } = await updateProfile(payload);
      setSuccess(data.message || 'Profile updated successfully');

      const storedUser = (() => {
        try {
          return JSON.parse(localStorage.getItem('user')) || {};
        } catch {
          return {};
        }
      })();

      const userId = data?.user?.id || storedUser.id || storedUser._id || null;
      const newUser = data?.user
        ? { id: userId, username: data.user.username, email: data.user.email }
        : { id: userId, username: usernameInput.trim(), email: emailInput.trim() };

      setUser(newUser);
      setUsernameInput(newUser.username);
      setEmailInput(newUser.email);
      localStorage.setItem('user', JSON.stringify(newUser));

      setPostCount(data.postCount ?? postCount);
      setShowProfileForm(false);
      setCurrentPassword('');
      setNewPassword('');
      setResetMode(false);
    } catch (err) {
      console.error(err);
      const errorMsg = err.response?.data?.message || 'Update failed';
      setError(errorMsg);
      if (errorMsg === 'Wrong password') {
        setResetMode(true);
      }
    }
  };

  return (
    <Box sx={{ px: { xs: 2, sm: 3, md: 4 }, py: 2, maxWidth: 800, mx: 'auto' }}>
      <Box display="flex" alignItems="center" gap={1} mb={2}>
        <IconButton onClick={() => navigate('/feed')} size="small" sx={{ color: 'inherit' }}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h4" sx={{ fontWeight: 900, letterSpacing: 1, color: '#1565c0', fontSize: { xs: '1.5rem', sm: '2rem', md: '2.5rem' } }}>Profile</Typography>
      </Box>
      <Typography variant="subtitle1" sx={{ color: '#3b4a5a', mb: 2, fontSize: { xs: '0.9rem', sm: '1rem' } }}>Manage your account details and security.</Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

      <Paper sx={{ p: { xs: 2, sm: 3 }, mb: 3, borderRadius: 2 }}>
        <Typography variant="body2" sx={{ mb: 1.5, fontSize: { xs: '0.9rem', sm: '1rem' } }}><strong>Username:</strong> {user.username}</Typography>
        <Typography variant="body2" sx={{ mb: 1.5, fontSize: { xs: '0.9rem', sm: '1rem' } }}><strong>Email:</strong> {user.email}</Typography>
        <Typography variant="h6" sx={{ mt: 2, mb: 2, color: '#2d6cc6', fontSize: { xs: '1rem', sm: '1.25rem' } }}>Total Posts: {postCount}</Typography>
      </Paper>

      <Paper sx={{ p: { xs: 2, sm: 3 }, borderRadius: 2 }}>
        {showProfileForm ? (
          <Box display="grid" gap={2}>
            <TextField
              label="Username"
              value={usernameInput}
              onChange={(e) => setUsernameInput(e.target.value)}
              fullWidth
            />
            <TextField
              label="Email"
              type="email"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              fullWidth
            />
            {!resetMode && (
              <TextField
                label="Current Password"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                fullWidth
              />
            )}
            <TextField
              label="New Password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              fullWidth
            />
            <Box display="flex" gap={1} flexWrap="wrap">
              <Button variant="contained" onClick={handleSave} disabled={loading} sx={{ width: { xs: '100%', sm: 'auto' } }}>
                Update Profile
              </Button>
              <Button
                variant="outlined"
                onClick={() => {
                  setShowProfileForm(false);
                  setCurrentPassword('');
                  setNewPassword('');
                  setResetMode(false);
                }}
                sx={{ width: { xs: '100%', sm: 'auto' } }}
              >
                Cancel
              </Button>
            </Box>
            {error === 'Wrong password' && (
              <Button
                variant="text"
                color="secondary"
                onClick={() => setResetMode(true)}
                sx={{ mt: 1, fontSize: { xs: '0.85rem', sm: '0.9rem' } }}
              >
                Forgot Password? Reset without current password
              </Button>
            )}
          </Box>
        ) : (
          <Button variant="contained" onClick={() => setShowProfileForm(true)} sx={{ width: { xs: '100%', sm: 'auto' } }}>
            Update Profile
          </Button>
        )}
      </Paper>

      <Box mt={2} display="flex" gap={1} flexWrap="wrap">
        <Button variant="outlined" onClick={() => navigate('/feed')} sx={{ width: { xs: '100%', sm: 'auto' } }}>Back to Feed</Button>
        <Button variant="contained" color="secondary" onClick={() => { localStorage.removeItem('token'); localStorage.removeItem('user'); window.location.replace('/login'); }} sx={{ width: { xs: '100%', sm: 'auto' } }}>Logout</Button>
      </Box>
    </Box>
  );
};

export default ProfilePage;
