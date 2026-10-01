import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { CssBaseline, Container, Box, Paper, Typography } from '@mui/material';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import FeedPage from './pages/FeedPage';
import ProfilePage from './pages/ProfilePage';

const requireAuth = () => !!localStorage.getItem('token');

function App() {
  return (
    <>
      <CssBaseline />
      <Box sx={{ minHeight: '100vh', py: 3, px: 2, background: 'transparent' }}>
        <Container maxWidth="md" sx={{ py: 0 }}>
          <Routes>
            <Route path="/" element={requireAuth() ? <Navigate to="/feed" replace /> : <Navigate to="/login" replace />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/feed" element={requireAuth() ? <FeedPage /> : <Navigate to="/login" replace />} />
            <Route path="/profile" element={requireAuth() ? <ProfilePage /> : <Navigate to="/login" replace />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Container>
      </Box>
    </>
  );
}


export default App;
