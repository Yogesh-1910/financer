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
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!username || !password) {
      setError('Username and password are required.');
      return;
    }
    try {
      // MOCK LOGIN: In a real app, you'd call an API.
      // Here, we check if a user exists in localStorage (from signup)
      // This is a very basic check and not secure for production.
      const storedUser = localStorage.getItem('financeManagerUser');
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        // For this demo, any existing user can log in with their username
        // In a real app, you'd verify password against a hash from backend
        if (parsedUser.username === username) { // Add password check if you store it (not recommended for client-side)
          login(parsedUser); // Pass the full stored user data to preserve other fields
          navigate('/dashboard');
          return;
        }
      }
      // If no user or credentials don't match (for this simple demo)
      setError('Invalid username or password. (Demo: Try signing up first)');

    } catch (err) {
      setError('Failed to log in. Please try again.');
      console.error("Login error:", err);
    }
  };

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
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Enter your username"
          required
        />
        <Input
          label="Password"
          type="password"
          name="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter your password"
          required
        />
        <Button type="submit" variant="primary" className={styles.loginButton}>
          Login
        </Button>
      </form>
      <p className={styles.signupPrompt}>
        Don't have an account? <Link to="/signup">Sign Up</Link>
      </p>
    </div>
  );
};

export default LoginForm;