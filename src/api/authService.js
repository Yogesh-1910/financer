// src/api/authService.js
import axios from 'axios';

const API_AUTH_URL = `${process.env.REACT_APP_API_URL}/auth`;
const API_USERS_URL = process.env.REACT_APP_API_URL_USERS; // e.g., http://localhost:5001/api/users

console.log("[FE AuthService] API_AUTH_URL:", API_AUTH_URL);
console.log("[FE AuthService] API_USERS_URL:", API_USERS_URL);


const signup = async (userData) => { /* ... same as previous full code ... */
  console.log("[FE authService] Attempting signup with data:", userData);
  try {
    const response = await axios.post(`${API_AUTH_URL}/signup`, userData);
    console.log("[FE authService] Signup successful, response:", response.data);
    if (response.data.token && response.data.user) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('financeManagerUser', JSON.stringify(response.data.user));
    }
    return response.data;
  } catch (error) {
    console.error("[FE authService] Signup error:", error.response?.data || error.message);
    throw error;
  }
};

const login = async (credentials) => { /* ... same as previous full code ... */
  console.log("[FE authService] Attempting login with credentials:", credentials);
  try {
    const response = await axios.post(`${API_AUTH_URL}/login`, credentials);
    console.log("[FE authService] Login successful, response:", response.data);
    if (response.data.token && response.data.user) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('financeManagerUser', JSON.stringify(response.data.user));
    }
    return response.data;
  } catch (error) {
    console.error("[FE authService] Login error:", error.response?.data || error.message);
    throw error;
  }
};

const logout = () => { /* ... same as previous full code ... */
  console.log("[FE authService] Logging out.");
  localStorage.removeItem('token');
  localStorage.removeItem('financeManagerUser');
};

const getCurrentUserFromStorage = () => { /* ... same as previous full code ... */
  const userStr = localStorage.getItem('financeManagerUser');
  try { if (userStr) return JSON.parse(userStr); } catch (e) { console.error("[FE authService] Error parsing user from localStorage", e); }
  return null;
};

const getToken = () => localStorage.getItem('token');

const getAuthHeaders = (isFormData = false) => {
  const token = getToken();
  const headers = {};
  if (!isFormData) { // For JSON payloads
     headers['Content-Type'] = 'application/json';
  } // For FormData, browser sets Content-Type with boundary
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

const fetchUserProfile = async () => { /* ... same as previous full code, uses getAuthHeaders() ... */
  console.log("[FE authService] Attempting to fetch user profile.");
  try {
    const response = await axios.get(`${API_USERS_URL}/me`, { headers: getAuthHeaders() });
    console.log("[FE authService] Fetched user profile:", response.data);
    if (response.data) {
      localStorage.setItem('financeManagerUser', JSON.stringify(response.data));
    }
    return response.data;
  } catch (error) {
    console.error("[FE authService] Fetch user profile error:", error.response?.data || error.message);
    throw error;
  }
};

const updateUserProfile = async (profileData) => { /* ... same as previous full code, uses getAuthHeaders() ... */
  console.log("[FE authService] Attempting to update user profile (text) with data:", profileData);
  try {
    const response = await axios.put(`${API_USERS_URL}/me`, profileData, { headers: getAuthHeaders() });
    console.log("[FE authService] Updated user profile (text):", response.data);
    if (response.data) {
      localStorage.setItem('financeManagerUser', JSON.stringify(response.data));
    }
    return response.data;
  } catch (error) {
    console.error("[FE authService] Update user profile (text) error:", error.response?.data || error.message);
    throw error;
  }
};

// NEW or UPDATED
const uploadProfilePic = async (file) => {
  const formData = new FormData();
  formData.append('profilePic', file); // 'profilePic' must match the field name in backend multer upload.single()

  console.log("[FE authService] Uploading profile picture (file object):", file);
  try {
    // For FormData, axios will set Content-Type automatically with boundary
    const response = await axios.post(`${API_USERS_URL}/me/profile-pic`, formData, {
      headers: getAuthHeaders(true) // Pass true to signal it's FormData
    });
    console.log("[FE authService] Profile picture uploaded, response:", response.data);
    if (response.data) {
      localStorage.setItem('financeManagerUser', JSON.stringify(response.data)); // Update stored user with new pic URL
    }
    return response.data; // Returns updated user object
  } catch (error) {
    console.error("[FE authService] Profile picture upload error:", error.response?.data || error.message, error.response);
    throw error;
  }
};

export default {
  signup, login, logout, getCurrentUserFromStorage, getToken,
  getAuthHeaders, fetchUserProfile, updateUserProfile,
  uploadProfilePic // Make sure this is exported
};