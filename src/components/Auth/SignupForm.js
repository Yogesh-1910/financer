// src/components/Auth/SignupForm.js
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Input from '../UI/Input';
import Button from '../UI/Button';
import styles from './SignupForm.module.css'; // Assuming this CSS file exists

const SignupForm = () => {
  const [formData, setFormData] = useState({
    fullName: '', age: '', occupation: '', phoneNumber: '',
    username: '', password: '', confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { signup, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const { fullName, age, occupation, phoneNumber, username, password, confirmPassword } = formData;

    if (!fullName.trim() || !username.trim() || !password) {
      setError('Full name, username, and password are required.'); return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.'); return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters long.'); return;
    }
    // Optional: More robust phone/age validation
    if (phoneNumber.trim() && !/^\d{10}$/.test(phoneNumber.trim().replace(/\D/g,''))) {
         setError('If provided, phone number should be 10 digits.'); return;
    }
    if (age.trim() && (isNaN(parseInt(age)) || parseInt(age) < 1 || parseInt(age) > 120 )) {
         setError('If provided, age must be a valid number between 1 and 120.'); return;
    }


    setIsLoading(true);
    try {
      const dataToSend = {
        fullName: fullName.trim(),
        age: age.trim() ? parseInt(age.trim()) : null,
        occupation: occupation.trim() || null,
        phoneNumber: phoneNumber.trim() || null,
        username: username.trim(),
        password: password, // Backend will hash
      };
      console.log("[SignupForm] Attempting signup with:", dataToSend);
      await signup(dataToSend); // Calls signupUser from AuthContext
      console.log("[SignupForm] Signup call successful, navigating to dashboard.");
      navigate('/dashboard');
    } catch (err) {
      const errorMessage = err.response?.data?.msg || err.response?.data?.error || 'Signup failed. Please try again or check server connection.';
      setError(errorMessage);
      console.error("[SignupForm] Signup submission error:", err.response || err.message || err);
    }
    setIsLoading(false);
  };
 
  if (authLoading) {
     return <div className={styles.signupFormContainer}><p>Loading authentication...</p></div>;
  }

  return (
    <div className={styles.signupFormContainer}>
      <h2>Sign Up</h2>
      {error && <p className={styles.errorMessage}>{error}</p>}
      <form onSubmit={handleSubmit}>
        <Input label="Full Name*" name="fullName" value={formData.fullName} onChange={handleChange} required disabled={isLoading}/>
        <Input label="Age" name="age" type="number" value={formData.age} onChange={handleChange} disabled={isLoading}/>
        <Input label="Occupation" name="occupation" value={formData.occupation} onChange={handleChange} disabled={isLoading}/>
        <Input label="Phone Number" name="phoneNumber" type="tel" value={formData.phoneNumber} onChange={handleChange} placeholder="e.g., 1234567890" disabled={isLoading}/>
        <Input label="Username*" name="username" value={formData.username} onChange={handleChange} required disabled={isLoading}/>
        <Input label="Password* (min 6 chars)" name="password" type="password" value={formData.password} onChange={handleChange} required disabled={isLoading}/>
        <Input label="Confirm Password*" name="confirmPassword" type="password" value={formData.confirmPassword} onChange={handleChange} required disabled={isLoading}/>
        <Button type="submit" variant="primary" className={styles.signupButton} disabled={isLoading}>
          {isLoading ? 'Signing up...' : 'Sign Up'}
        </Button>
      </form>
      <p className={styles.loginPrompt}>
        Already have an account? <Link to="/login">Login</Link>
      </p>
    </div>
  );
};
export default SignupForm;