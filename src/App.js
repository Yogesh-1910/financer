import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import { DashboardRoutes } from './pages/DashboardPage';
import './App.css';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth(); // Added loading state
  if (loading) {
    return <div>Loading application...</div>; // Or a proper spinner component
  }
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

const PublicOnlyRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth(); // Added loading state
  if (loading) {
    return <div>Loading application...</div>;
  }
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route
            path="/login"
            element={<PublicOnlyRoute><LoginPage /></PublicOnlyRoute>}
          />
          <Route
            path="/signup"
            element={<PublicOnlyRoute><SignupPage /></PublicOnlyRoute>}
          />
          <Route
            path="/dashboard/*"
            element={<ProtectedRoute><DashboardRoutes /></ProtectedRoute>}
          />
          <Route
            path="/"
            element={<RootRedirect />}
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

const RootRedirect = () => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) {
    return <div>Loading...</div>; // Or a spinner
  }
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />;
};

export default App;