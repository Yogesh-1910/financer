// src/components/Dashboard/ProfileManager.js
import React, { useState, useEffect } from 'react';
import Card from '../UI/Card';
import Input from '../UI/Input'; // We'll use this only for editing
import Button from '../UI/Button';
import styles from './ProfileManager.module.css';
import { useAuth } from '../../contexts/AuthContext';

const ProfileManager = () => {
  const { currentUser, login } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    age: '',
    occupation: '',
    phoneNumber: '',
  });
  const [message, setMessage] = useState('');
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (currentUser) {
      // Initialize formData for editing whenever currentUser changes or on mount
      setFormData({
        fullName: currentUser.fullName || '',
        age: currentUser.age || '',
        occupation: currentUser.occupation || '',
        phoneNumber: currentUser.phoneNumber || '',
      });
    }
  }, [currentUser]); // This effect runs when currentUser is updated

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
    setMessage('');
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.fullName.trim()) {
      newErrors.fullName = "Full name cannot be empty.";
    }
    if (formData.age && (isNaN(formData.age) || parseInt(formData.age, 10) < 1 || parseInt(formData.age, 10) > 120)) {
      newErrors.age = "Please enter a valid age (1-120).";
    }
    if (formData.phoneNumber) {
        const phoneDigits = formData.phoneNumber.replace(/\D/g, '');
        if (phoneDigits.length !== 0 && phoneDigits.length !== 10) { // Allow empty or must be 10 digits
             newErrors.phoneNumber = "Phone number should be 10 digits if provided.";
        }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleEditToggle = () => {
    if (isEditing) { // If was editing, now cancelling
      // Reset formData to current user's data to discard changes
      if (currentUser) {
        setFormData({
          fullName: currentUser.fullName || '',
          age: currentUser.age || '',
          occupation: currentUser.occupation || '',
          phoneNumber: currentUser.phoneNumber || '',
        });
      }
      setErrors({});
    } else { // If was not editing, now starting to edit
      // formData should already be up-to-date from the useEffect [currentUser]
      // but we can explicitly ensure it here if needed or if there are race conditions.
      if (currentUser) {
        setFormData({
            fullName: currentUser.fullName || '',
            age: currentUser.age || '',
            occupation: currentUser.occupation || '',
            phoneNumber: currentUser.phoneNumber || '',
          });
      }
    }
    setIsEditing(!isEditing);
    setMessage('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) {
      setMessage('Please correct the errors in the form.');
      return;
    }

    const updatedUserDetails = {
      ...currentUser,
      fullName: formData.fullName.trim(),
      age: formData.age ? parseInt(formData.age, 10) : '',
      occupation: formData.occupation.trim(),
      phoneNumber: formData.phoneNumber.trim(),
    };

    login(updatedUserDetails); // Updates AuthContext and localStorage

    setMessage('Profile updated successfully!');
    setIsEditing(false);
    setTimeout(() => setMessage(''), 3000);
  };

  if (!currentUser) {
    return <Card title="User Profile"><p>Loading profile or not logged in...</p></Card>;
  }

  return (
    <Card title="User Profile">
      {message && (
        <p className={`${styles.message} ${Object.keys(errors).length > 0 && !message.includes('successfully') ? styles.errorMessage : styles.successMessage}`}>
          {message}
        </p>
      )}

      {isEditing ? (
        // --- EDITING MODE: Render Form with Inputs ---
        <form onSubmit={handleSubmit} className={styles.profileForm}>
          <Input
            label="Full Name"
            name="fullName"
            value={formData.fullName}
            onChange={handleChange}
            error={errors.fullName}
            required
          />
          <Input
            label="Age"
            name="age"
            type="number"
            value={formData.age}
            onChange={handleChange}
            error={errors.age}
          />
          <Input
            label="Occupation"
            name="occupation"
            value={formData.occupation}
            onChange={handleChange}
            // error={errors.occupation} // Add if you have occupation validation
          />
          <Input
            label="Phone Number"
            name="phoneNumber"
            type="tel"
            value={formData.phoneNumber}
            onChange={handleChange}
            error={errors.phoneNumber}
          />
          <Input // Display Username, but it's not part of formData for editing
            label="Username"
            name="username"
            value={currentUser.username || ''}
            disabled
          />
          <div className={styles.buttonGroup}>
            <Button type="submit" variant="primary">Save Changes</Button>
            <Button type="button" variant="secondary" onClick={handleEditToggle}>Cancel</Button>
          </div>
        </form>
      ) : (
        // --- DISPLAY MODE: Render Text ---
        <div className={styles.profileDisplay}>
          <div className={styles.displayField}>
            <span className={styles.displayLabel}>Full Name:</span>
            <span className={styles.displayValue}>{currentUser.fullName || 'N/A'}</span>
          </div>
          <div className={styles.displayField}>
            <span className={styles.displayLabel}>Age:</span>
            <span className={styles.displayValue}>{currentUser.age || 'N/A'}</span>
          </div>
          <div className={styles.displayField}>
            <span className={styles.displayLabel}>Occupation:</span>
            <span className={styles.displayValue}>{currentUser.occupation || 'N/A'}</span>
          </div>
          <div className={styles.displayField}>
            <span className={styles.displayLabel}>Phone Number:</span>
            <span className={styles.displayValue}>{currentUser.phoneNumber || 'N/A'}</span>
          </div>
          <div className={styles.displayField}>
            <span className={styles.displayLabel}>Username:</span>
            <span className={styles.displayValue}>{currentUser.username || 'N/A'}</span>
          </div>
          <div className={styles.buttonGroup}>
            <Button type="button" onClick={handleEditToggle}>Edit Profile</Button>
          </div>
        </div>
      )}
    </Card>
  );
};

export default ProfileManager;