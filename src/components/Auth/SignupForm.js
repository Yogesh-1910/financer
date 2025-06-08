// src/components/Auth/SignupForm.js
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Input from '../UI/Input'; // Ensure this path is correct
import Button from '../UI/Button'; // Ensure this path is correct
import styles from './SignupForm.module.css'; // Ensure this CSS file exists and is styled for dark theme

const SignupForm = () => {
  const [formData, setFormData] = useState({
    fullName: '', 
    age: '',        // Keep as string for input, parse to number or null on submit
    occupation: '', 
    phoneNumber: '',
    username: '', 
    password: '', 
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false); // Local loading state for this form's submission
  const { signup, loading: authContextLoading } = useAuth(); // `signup` is signupUser from context, `authContextLoading` is global auth check
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevData => ({ ...prevData, [name]: value }));
    if (error) setError(''); // Clear error when user starts typing again
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); // Clear previous errors

    // Destructure and trim string values for validation and submission
    const trimmedFullName = formData.fullName.trim();
    const trimmedUsername = formData.username.trim();
    const trimmedAge = formData.age.trim();
    const trimmedOccupation = formData.occupation.trim();
    const trimmedPhoneNumber = formData.phoneNumber.trim();
    const password = formData.password; // Passwords usually aren't trimmed by default
    const confirmPassword = formData.confirmPassword;

    // Client-side Validations
    if (!trimmedFullName || !trimmedUsername || !password) {
      setError('Full name, username, and password are required.');
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
    if (trimmedPhoneNumber && !/^\d{10}$/.test(trimmedPhoneNumber.replace(/\D/g,''))) {
         setError('If provided, phone number should be 10 digits.');
         return;
    }
    if (trimmedAge && (isNaN(parseInt(trimmedAge)) || parseInt(trimmedAge) < 1 || parseInt(trimmedAge) > 120 )) {
         setError('If provided, age must be a valid number between 1 and 120.');
         return;
    }

    setIsLoading(true);
    try {
      const dataToSend = {
        fullName: trimmedFullName,
        age: trimmedAge ? parseInt(trimmedAge) : null, // Send as number or null
        occupation: trimmedOccupation || null,         // Send as string or null
        phoneNumber: trimmedPhoneNumber || null,       // Send as string or null
        username: trimmedUsername,
        password: password, // Backend will hash this password
      };
      console.log("[SignupForm] Attempting signup with payload:", dataToSend);

      await signup(dataToSend); // This calls the signupUser function from AuthContext

      console.log("[SignupForm] Signup call successful, navigating to dashboard.");
      navigate('/dashboard');
    } catch (err) {
      // Extract error message from backend response if available, otherwise use generic
      const backendErrorMessage = err.response?.data?.msg || err.response?.data?.error;
      const displayError = backendErrorMessage || 'Signup failed. Please try again or check server connection.';
      setError(displayError);
      console.error("[SignupForm] Signup submission error:", err.response || err.message || err);
    }
    setIsLoading(false);
  };
 
  // Show a global loading message if AuthContext is still verifying initial token, etc.
  if (authContextLoading) {
     return (
       <div className={styles.signupFormContainer}> {/* Use same container for consistent look */}
         <p style={{ textAlign: 'center', color: 'var(--text-color)' }}>Loading authentication...</p>
       </div>
     );
  }

  return (
    <div className={styles.signupFormContainer}> {/* Styled by SignupForm.module.css */}
      <h2>Sign Up</h2>
      {error && <p className={styles.errorMessage}>{error}</p>}
      <form onSubmit={handleSubmit}>
        <Input 
          label="Full Name*" 
          name="fullName" 
          value={formData.fullName} 
          onChange={handleChange} 
          required 
          disabled={isLoading}
        />
        <Input 
          label="Age" 
          name="age" 
          type="number" 
          value={formData.age} 
          onChange={handleChange} 
          disabled={isLoading}
        />
        <Input 
          label="Occupation" 
          name="occupation" 
          value={formData.occupation} 
          onChange={handleChange} 
          disabled={isLoading}
        />
        <Input 
          label="Phone Number" 
          name="phoneNumber" 
          type="tel" 
          value={formData.phoneNumber} 
          onChange={handleChange} 
          placeholder="e.g., 1234567890" 
          disabled={isLoading}
        />
        <Input 
          label="Username*" 
          name="username" 
          value={formData.username} 
          onChange={handleChange} 
          required 
          disabled={isLoading}
        />
        <Input 
          label="Password* (min 6 chars)" 
          name="password" 
          type="password" 
          value={formData.password} 
          onChange={handleChange} 
          required 
          disabled={isLoading}
        />
        <Input 
          label="Confirm Password*" 
          name="confirmPassword" 
          type="password" 
          value={formData.confirmPassword} 
          onChange={handleChange} 
          required 
          disabled={isLoading}
        />
        <Button 
          type="submit" 
          variant="primary" 
          className={styles.signupButton} 
          disabled={isLoading}
        >
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