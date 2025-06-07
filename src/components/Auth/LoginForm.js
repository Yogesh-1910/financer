// src/components/Auth/LoginForm.js
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Input from '../UI/Input';
import Button from '../UI/Button';
import styles from './LoginForm.module.css';

const LoginForm = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false); // Local form submission loading state
  const { login, loading: authLoading } = useAuth(); // authLoading is global auth check
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!username || !password) {
      setError('Username and password are required.');
      return;
    }
    setIsLoading(true);
    try {
      console.log("[LoginForm] Attempting login with:", { username, password });
      await login({ username, password }); // Calls loginUser from AuthContext
      console.log("[LoginForm] Login call successful, navigating to dashboard.");
      navigate('/dashboard');
    } catch (err) {
      const errorMessage = err.response?.data?.msg || err.response?.data?.error || 'Login failed. Please check your credentials or server connection.';
      setError(errorMessage);
      console.error("[LoginForm] Login submission error:", err.response || err.message || err);
    }
    setIsLoading(false);
  };
 
  if (authLoading) { // If global auth state is still loading (e.g. verifying token)
     return <div className={styles.loginFormContainer}><p>Loading authentication...</p></div>;
  }

  return (
    <div className={styles.loginFormContainer}>
      <h2>Login</h2>
      {error && <p className={styles.errorMessage}>{error}</p>}
      <form onSubmit={handleSubmit}>
        <Input
          label="Username"
          type="text"
          name="username"
          value={username}
          onChange={(e) => setUsername(e.target.value.trim())} // Trim username
          placeholder="Enter your username"
          required
          disabled={isLoading}
        />
        <Input
          label="Password"
          type="password"
          name="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)} // Don't trim password during input
          placeholder="Enter your password"
          required
          disabled={isLoading}
        />
        <Button type="submit" variant="primary" className={styles.loginButton} disabled={isLoading}>
          {isLoading ? 'Logging in...' : 'Login'}
        </Button>
      </form>
      <p className={styles.signupPrompt}>
        Don't have an account? <Link to="/signup">Sign Up</Link>
      </p>
    </div>
  );
};

export default LoginForm;