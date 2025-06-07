import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Input from '../UI/Input';
import Button from '../UI/Button';
import styles from './SignupForm.module.css';

const SignupForm = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    age: '',
    occupation: '',
    phoneNumber: '',
    username: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const { signup } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const { fullName, age, occupation, phoneNumber, username, password, confirmPassword } = formData;

    if (!fullName || !age || !occupation || !phoneNumber || !username || !password || !confirmPassword) {
        setError('All fields are required.');
        return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (password.length < 6) {
        setError('Password must be at least 6 characters long.');
        return;
    }
    // Basic phone number validation (example)
    if (!/^\d{10}$/.test(phoneNumber.replace(/\s|-/g, ''))) { // Allows 10 digits, optionally with spaces/hyphens
        setError('Please enter a valid 10-digit phone number.');
        return;
    }


    try {
      // In a real app, check if username already exists via API
      const { confirmPassword: _, ...signupData } = formData; // Exclude confirmPassword
      signup(signupData);
      navigate('/dashboard');
    } catch (err) {
      setError('Failed to sign up. Please try again.');
      console.error("Signup error:", err)
    }
  };

  return (
    <div className={styles.signupFormContainer}>
      <h2>Sign Up</h2>
      {error && <p className={styles.errorMessage}>{error}</p>}
      <form onSubmit={handleSubmit}>
        <Input label="Full Name" name="fullName" value={formData.fullName} onChange={handleChange} required />
        <Input label="Age" name="age" type="number" value={formData.age} onChange={handleChange} required />
        <Input label="Occupation" name="occupation" value={formData.occupation} onChange={handleChange} required />
        <Input label="Phone Number" name="phoneNumber" type="tel" value={formData.phoneNumber} onChange={handleChange} required placeholder="e.g., 123-456-7890" />
        <Input label="Username" name="username" value={formData.username} onChange={handleChange} required />
        <Input label="Password (min 6 chars)" name="password" type="password" value={formData.password} onChange={handleChange} required />
        <Input label="Confirm Password" name="confirmPassword" type="password" value={formData.confirmPassword} onChange={handleChange} required />
        <Button type="submit" variant="primary" className={styles.signupButton}>
          Sign Up
        </Button>
      </form>
      <p className={styles.loginPrompt}>
        Already have an account? <Link to="/login">Login</Link>
      </p>
    </div>
  );
};

export default SignupForm;