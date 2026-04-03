import axios from 'axios';

export const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const instance = axios.create({ baseURL: API_BASE, headers: { 'Content-Type': 'application/json' } });

instance.interceptors.request.use((config) => {
  let token;
  try {
    token = localStorage.getItem('token');
  } catch {
    token = null;
  }
  const url = typeof config.url === 'string' ? config.url : '';
  const isAuthLoginOrSignup = url === '/auth/login' || url === '/auth/signup';
  if (token && !isAuthLoginOrSignup) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

instance.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    if (status === 401) {
      try {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      } catch {
        // ignore
      }
      if (typeof window !== 'undefined' && window.location?.pathname && window.location.pathname !== '/login') {
        window.location.replace('/login');
      }
    }
    return Promise.reject(error);
  }
);

export const authSignup = (payload) => instance.post('/auth/signup', payload);
export const authLogin = (payload) => instance.post('/auth/login', payload);

export const getPosts = (page = 1, limit = 50) => instance.get(`/posts?page=${page}&limit=${limit}`);
export const createPost = (formData) => instance.post('/posts', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
export const likePost = (id) => instance.put(`/posts/${id}/like`);
export const commentPost = (id, data) => instance.post(`/posts/${id}/comment`, data);
export const updatePost = (id, data) => instance.put(`/posts/${id}`, data);
export const deletePost = (id) => instance.delete(`/posts/${id}`);

export const getProfile = () => instance.get('/auth/profile');
export const updateProfile = (payload) => instance.put('/auth/profile', payload);
