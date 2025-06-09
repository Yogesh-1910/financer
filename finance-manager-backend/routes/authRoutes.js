// src/api/authService.js
import axios from 'axios';

const API_AUTH_URL = `${process.env.REACT_APP_API_URL}/auth`;
const API_USERS_URL = process.env.REACT_APP_API_URL_USERS;

const signup = async (userData) => {
  try {
    const response = await axios.post(`${API_AUTH_URL}/signup`, userData);
    if (response.data.token && response.data.user) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('financeManagerUser', JSON.stringify(response.data.user));
    }
    return response.data;
  } catch (error) { console.error("[FE authService] Signup error:", error.response?.data || error.message); throw error; }
};

const login = async (credentials) => {
  try {
    const response = await axios.post(`${API_AUTH_URL}/login`, credentials);
    if (response.data.token && response.data.user) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('financeManagerUser', JSON.stringify(response.data.user));
    }
    return response.data;
  } catch (error) { console.error("[FE authService] Login error:", error.response?.data || error.message); throw error; }
};

const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('financeManagerUser');
};

const getCurrentUserFromStorage = () => {
  const userStr = localStorage.getItem('financeManagerUser');
  try { if (userStr) return JSON.parse(userStr); } catch (e) { console.error("[FE authService] Error parsing user from localStorage", e); }
  return null;
};

const getToken = () => localStorage.getItem('token');

const getAuthHeaders = (isFormData = false) => {
  const token = getToken();
  const headers = {};
  if (!isFormData) headers['Content-Type'] = 'application/json';
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
};

const fetchUserProfile = async () => {
  try {
    const response = await axios.get(`${API_USERS_URL}/me`, { headers: getAuthHeaders() });
    if (response.data) localStorage.setItem('financeManagerUser', JSON.stringify(response.data));
    return response.data;
  } catch (error) { console.error("[FE authService] Fetch profile error:", error.response?.data || error.message); throw error; }
};

const updateUserProfile = async (profileData) => { // For text fields
  try {
    const response = await axios.put(`${API_USERS_URL}/me`, profileData, { headers: getAuthHeaders() });
    if (response.data) localStorage.setItem('financeManagerUser', JSON.stringify(response.data));
    return response.data;
  } catch (error) { console.error("[FE authService] Update text profile error:", error.response?.data || error.message); throw error; }
};

const uploadProfilePic = async (file) => {
  const formData = new FormData();
  formData.append('profilePic', file);
  try {
    const response = await axios.post(`${API_USERS_URL}/me/profile-pic`, formData, {
      headers: getAuthHeaders(true) // Signal it's FormData
    });
    if (response.data) localStorage.setItem('financeManagerUser', JSON.stringify(response.data));
    return response.data;
  } catch (error) { console.error("[FE authService] Upload pic error:", error.response?.data || error.message); throw error; }
};

export default {
  signup, login, logout, getCurrentUserFromStorage, getToken,
  getAuthHeaders, fetchUserProfile, updateUserProfile, uploadProfilePic
};