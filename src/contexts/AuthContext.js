// src/contexts/AuthContext.js
import React, { createContext, useState, useContext, useEffect } from 'react';
import authService from '../api/authService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [token, setToken] = useState(authService.getToken()); // Initialize token from localStorage
  const [loading, setLoading] = useState(true); // Start true for initial auth check

  useEffect(() => {
    const verifyTokenAndLoadUser = async () => {
      console.log("[AuthContext] Initializing Auth. Current token from localStorage:", token);
      if (token) {
        try {
          console.log("[AuthContext] Token found, attempting to fetch user profile...");
          const userProfile = await authService.fetchUserProfile(); // Validates token and gets fresh user data
          setCurrentUser(userProfile);
          console.log("[AuthContext] User profile fetched and set:", userProfile);
        } catch (error) {
          console.warn("[AuthContext] Failed to fetch user profile with stored token (it might be expired/invalid):", error.response?.data?.msg || error.message);
          authService.logout(); // Clear invalid token and user from localStorage
          setCurrentUser(null);
          setToken(null); // Clear token state
        }
      } else {
        console.log("[AuthContext] No token found in localStorage.");
        setCurrentUser(null); // Ensure user is null if no token
      }
      setLoading(false);
    };

    verifyTokenAndLoadUser();
  }, [token]); // Rerun if token changes (e.g., after login) - but initial load is key.
                // For initial load, you might also just run it once: }, []); and handle token set explicitly in login/signup.
                // The current [token] dependency means if token is set by login, this effect will run again.

  const loginUser = async (credentials) => {
    // setLoading(true); // Handled by component's local loading state
    try {
      const data = await authService.login(credentials); // authService handles localStorage
      setCurrentUser(data.user);
      setToken(data.token); // This will trigger the useEffect above if it depends on token
      console.log("[AuthContext] Login successful, user & token set.");
      // setLoading(false);
      return data;
    } catch (error) {
      // setLoading(false);
      console.error("[AuthContext] Login failed:", error.response?.data || error.message);
      throw error; // Re-throw for the component to handle UI error display
    }
  };

  const signupUser = async (userData) => {
    // setLoading(true);
    try {
      const data = await authService.signup(userData); // authService handles localStorage
      setCurrentUser(data.user);
      setToken(data.token);
      console.log("[AuthContext] Signup successful, user & token set.");
      // setLoading(false);
      return data;
    } catch (error) {
      // setLoading(false);
      console.error("[AuthContext] Signup failed:", error.response?.data || error.message);
      throw error;
    }
  };

  const logoutUser = () => {
    console.log("[AuthContext] Logging out user.");
    authService.logout(); // authService handles localStorage
    setCurrentUser(null);
    setToken(null);
  };

  const updateUserContext = (updatedUserDataFromBackend) => {
    console.log("[AuthContext] Updating user context with:", updatedUserDataFromBackend);
    // authService.updateUserProfile would have already updated localStorage
    setCurrentUser(updatedUserDataFromBackend);
  };

  const value = {
    currentUser,
    token,
    login: loginUser,
    signup: signupUser,
    logout: logoutUser,
    updateUserContext,
    isAuthenticated: !!token && !!currentUser,
    loading, // Global loading state for initial auth check
  };

  // Render children only after initial loading is complete
  // Or show a global loading spinner here based on `loading`
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  return useContext(AuthContext);
};