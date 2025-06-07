// src/api/authService.js
import axios from 'axios';

const API_AUTH_URL = `${process.env.REACT_APP_API_URL}/auth`; // e.g., http://localhost:5001/api/auth
const API_USERS_URL = process.env.REACT_APP_API_URL_USERS; // e.g., http://localhost:5001/api/users

console.log("Auth Service API URL:", API_AUTH_URL); // For debugging

const signup = async (userData) => {
  console.log("[authService] Attempting signup with data:", userData);
  try {
    const response = await axios.post(`${API_AUTH_URL}/signup`, userData);
    console.log("[authService] Signup successful, response:", response.data);
    if (response.data.token && response.data.user) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('financeManagerUser', JSON.stringify(response.data.user));
    }
    return response.data;
  } catch (error) {
    console.error("[authService] Signup error:", error.response?.data || error.message);
    throw error; // Re-throw to be caught by the component
  }
};

const login = async (credentials) => {
  console.log("[authService] Attempting login with credentials:", credentials);
  try {
    const response = await axios.post(`${API_AUTH_URL}/login`, credentials);
    console.log("[authService] Login successful, response:", response.data);
    if (response.data.token && response.data.user) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('financeManagerUser', JSON.stringify(response.data.user));
    }
    return response.data;
  } catch (error) {
    console.error("[authService] Login error:", error.response?.data || error.message);
    throw error;
  }
};

const logout = () => {
  console.log("[authService] Logging out.");
  localStorage.removeItem('token');
  localStorage.removeItem('financeManagerUser');
};

const getCurrentUserFromStorage = () => {
  const userStr = localStorage.getItem('financeManagerUser');
  try {
    if (userStr) return JSON.parse(userStr);
  } catch (e) { console.error("[authService] Error parsing user from localStorage", e); }
  return null;
};

const getToken = () => {
  return localStorage.getItem('token');
};

const getAuthHeaders = () => {
  const token = getToken();
  const headers = { 'Content-Type': 'application/json' };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

const fetchUserProfile = async () => {
  console.log("[authService] Attempting to fetch user profile.");
  try {
    const response = await axios.get(`${API_USERS_URL}/me`, { headers: getAuthHeaders() });
    console.log("[authService] Fetched user profile:", response.data);
    if (response.data) {
      localStorage.setItem('financeManagerUser', JSON.stringify(response.data));
    }
    return response.data;
  } catch (error) {
    console.error("[authService] Fetch user profile error:", error.response?.data || error.message);
    throw error;
  }
};

const updateUserProfile = async (profileData) => {
  console.log("[authService] Attempting to update user profile with data:", profileData);
  try {
    const response = await axios.put(`${API_USERS_URL}/me`, profileData, { headers: getAuthHeaders() });
    console.log("[authService] Updated user profile:", response.data);
    if (response.data) {
      localStorage.setItem('financeManagerUser', JSON.stringify(response.data));
    }
    return response.data;
  } catch (error) {
    console.error("[authService] Update user profile error:", error.response?.data || error.message);
    throw error;
  }
};

export default {
  signup,
  login,
  logout,
  getCurrentUserFromStorage,
  getToken,
  getAuthHeaders,
  fetchUserProfile,
  updateUserProfile
};