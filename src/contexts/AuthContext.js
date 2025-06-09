// src/contexts/AuthContext.js
import React, { createContext, useState, useContext, useEffect } from 'react';
import authService from '../api/authService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [token, setToken] = useState(authService.getToken());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verifyTokenAndLoadUser = async () => {
      const currentToken = authService.getToken();
      // No need to call setToken(currentToken) here, it's already initialized with it.
      // This effect should run primarily based on component mount, not token changes from login/logout.
      // Login/logout will directly set currentUser and token state.

      if (currentToken) {
        try {
          console.log("[AuthContext] Token exists, fetching user profile...");
          const userProfile = await authService.fetchUserProfile(); // Validates token
          setCurrentUser(userProfile);
          setToken(currentToken); // Ensure token state is also set if userProfile fetch is successful
          console.log("[AuthContext] User profile loaded and set:", userProfile);
        } catch (error) {
          console.warn("[AuthContext] Failed to validate token/fetch profile:", error.response?.data?.msg || error.message);
          authService.logout(); // Clear bad token
          setCurrentUser(null);
          setToken(null);
        }
      } else {
        setCurrentUser(null); // Explicitly set to null if no token
        setToken(null);
      }
      setLoading(false);
    };

    verifyTokenAndLoadUser();
  }, []); // Run ONCE on component mount to check initial auth state

  const loginUser = async (credentials) => {
    // Component local isLoading state handles button disabling
    try {
      const data = await authService.login(credentials);
      setCurrentUser(data.user);
      setToken(data.token); // This might trigger the useEffect if it depended on 'token'
      return data;
    } catch (error) { throw error; }
  };

  const signupUser = async (userData) => {
    try {
      const data = await authService.signup(userData);
      setCurrentUser(data.user);
      setToken(data.token);
      return data;
    } catch (error) { throw error; }
  };

  const logoutUser = () => {
    authService.logout();
    setCurrentUser(null);
    setToken(null);
  };

  const updateUserContext = (updatedUserDataFromBackend) => {
    console.log("[AuthContext] Context updated with user data:", updatedUserDataFromBackend);
    setCurrentUser(updatedUserDataFromBackend);
    // Token usually doesn't change on profile update, so no need to setToken here
    // authService methods already updated localStorage
  };

  const value = {
    currentUser,
    token,
    login: loginUser,
    signup: signupUser,
    logout: logoutUser,
    updateUserContext,
    isAuthenticated: !!token && !!currentUser,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  return useContext(AuthContext);
};