import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Box, Paper, TextField, Button, Typography, Alert } from '@mui/material';
import axios from 'axios';
import { authLogin, API_BASE } from '../services/api';

const LoginPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const { data } = await authLogin({ email: email.trim(), password });
      try {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        const savedToken = localStorage.getItem('token');
        if (!savedToken) {
          setError('Login succeeded but token could not be persisted. Check browser privacy/site-data settings and try again.');
          return;
        }
      } catch (storageErr) {
        console.error(storageErr);
        setError('Login succeeded but browser storage is blocked. Disable private/incognito mode or allow site data, then try again.');
        return;
      }
      navigate('/feed', { replace: true });
      setTimeout(() => {
        if (window.location.pathname === '/login') window.location.replace('/feed');
      }, 0);
    } catch (err) {
      console.error(err);
      if (axios.isAxiosError(err) && !err.response) {
        setError(`Cannot reach the server at ${API_BASE}. Make sure the backend is running and reachable.`);
        return;
      }
      setError((axios.isAxiosError(err) && err.response?.data?.message) || err?.message || 'Login failed');
    }
  };

  return (
    <Box
      display="flex"
      justifyContent="center"
      alignItems="center"
      minHeight="100vh"
      px={2}
    >
      <Paper
        sx={{
          p: { xs: 3, sm: 4 },
          maxWidth: 400,
          width: '100%',
          borderRadius: 2,
          boxShadow: 3,
        }}
      >
        <Typography variant="h5" mb={2} textAlign="center">
          Login
        </Typography>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <Box component="form" onSubmit={handleSubmit} display="grid" gap={2}>
          <TextField
            required
            label="Email"
            type="email"
            fullWidth
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <TextField
            required
            label="Password"
            type="password"
            fullWidth
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Button type="submit" variant="contained" fullWidth>
            Login
          </Button>
        </Box>
        <Typography variant="body2" mt={2} textAlign="center">
          Don't have an account? <Link to="/signup">Signup</Link>
        </Typography>
      </Paper>
    </Box>
  );
};

export default LoginPage;
