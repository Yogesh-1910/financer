import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('financeManagerUser');
    if (storedUser) {
      try {
        setCurrentUser(JSON.parse(storedUser));
      } catch (error) {
        console.error("Failed to parse user from localStorage", error);
        localStorage.removeItem('financeManagerUser');
      }
    }
    setLoading(false);
  }, []);

  const login = (userData) => {
    const mockUser = {
      id: currentUser?.id || Date.now(), // Preserve ID if updating
      ...currentUser, // Preserve existing fields not in userData
      ...userData
    };
    localStorage.setItem('financeManagerUser', JSON.stringify(mockUser));
    setCurrentUser(mockUser);
  };

  const signup = (userData) => {
    const newUser = {
      id: Date.now(),
      ...userData
    };
    localStorage.setItem('financeManagerUser', JSON.stringify(newUser));
    setCurrentUser(newUser);
  };

  const logout = () => {
    localStorage.removeItem('financeManagerUser');
    setCurrentUser(null);
  };

  const value = {
    currentUser,
    login,
    signup,
    logout,
    isAuthenticated: !!currentUser,
  };

  if (loading) {
    return <div>Loading authentication...</div>;
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  return useContext(AuthContext);
};