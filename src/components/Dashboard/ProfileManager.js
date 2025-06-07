// src/components/Dashboard/ProfileManager.js
import React, { useState, useEffect } from 'react';
import Card from '../UI/Card';
import Input from '../UI/Input';
import Button from '../UI/Button';
import styles from './ProfileManager.module.css';
import { useAuth } from '../../contexts/AuthContext';
import authService from '../../api/authService'; // For update API call

const ProfileManager = () => {
  const { currentUser, updateUserContext, loading: authLoading } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ fullName: '', age: '', occupation: '', phoneNumber: '' });
  const [message, setMessage] = useState('');
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false); // For save button loading

  useEffect(() => {
    // Initialize form data when currentUser is available or changes
    if (currentUser) {
      setFormData({
        fullName: currentUser.fullName || '',
        age: currentUser.age || '',
        occupation: currentUser.occupation || '',
        phoneNumber: currentUser.phoneNumber || '',
      });
    }
    // Optional: If currentUser from context is minimal (e.g., only id, username from login),
    // you might want to fetch the full profile here.
    // const fetchFullProfile = async () => {
    //   if (currentUser && !currentUser.occupation) { // Example condition: fetch if occupation is missing
    //     try {
    //       console.log("Fetching full profile for ProfileManager...");
    //       const fullProfile = await authService.fetchUserProfile();
    //       updateUserContext(fullProfile); // Update context, which will re-trigger this useEffect
    //     } catch (error) {
    //       console.error("Could not fetch full profile on mount:", error);
    //       setMessage("Could not load complete profile details.");
    //     }
    //   }
    // };
    // fetchFullProfile();

  }, [currentUser /*, updateUserContext */]); // updateUserContext if using fetchFullProfile above

  const handleChange = (e) => { /* ... same as previous correct version ... */
     const { name, value } = e.target;
     setFormData(prev => ({ ...prev, [name]: value }));
     if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }));
     setMessage('');
  };
  const validateForm = () => { /* ... same as previous correct version ... */
     const newErrors = {};
     if (!formData.fullName.trim()) newErrors.fullName = "Full name cannot be empty.";
     if (formData.age && (isNaN(formData.age) || parseInt(formData.age, 10) < 1 || parseInt(formData.age, 10) > 120)) newErrors.age = "Please enter a valid age (1-120).";
     if (formData.phoneNumber) {
         const phoneDigits = formData.phoneNumber.replace(/\D/g, '');
         if (phoneDigits.length !== 0 && phoneDigits.length !== 10) newErrors.phoneNumber = "Phone number should be 10 digits if provided.";
     }
     setErrors(newErrors);
     return Object.keys(newErrors).length === 0;
  };
  const handleEditToggle = () => { /* ... same as previous correct version ... */
     if (isEditing) {
       if (currentUser) setFormData({ fullName: currentUser.fullName || '', age: currentUser.age || '', occupation: currentUser.occupation || '', phoneNumber: currentUser.phoneNumber || '' });
       setErrors({});
     } else if (currentUser) { // Sync formData before entering edit mode
         setFormData({ fullName: currentUser.fullName || '', age: currentUser.age || '', occupation: currentUser.occupation || '', phoneNumber: currentUser.phoneNumber || '' });
     }
     setIsEditing(!isEditing);
     setMessage('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      setMessage('Please correct the errors in the form.');
      return;
    }
    setIsSubmitting(true);
    setMessage('');
    try {
      const profileDataToUpdate = {
        fullName: formData.fullName.trim(),
        age: formData.age === '' ? null : (formData.age ? parseInt(formData.age, 10) : null),
        occupation: formData.occupation.trim() || null,
        phoneNumber: formData.phoneNumber.trim() || null,
      };
      const updatedUserFromBackend = await authService.updateUserProfile(profileDataToUpdate);
      updateUserContext(updatedUserFromBackend); // Update context with response from backend
      setMessage('Profile updated successfully!');
      setIsEditing(false);
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage(error.response?.data?.msg || error.response?.data?.error || 'Failed to update profile.');
      console.error("Profile update error:", error.response || error);
    }
    setIsSubmitting(false);
  };

  if (authLoading && !currentUser) { // Show loading if auth context is loading and no user yet
     return <Card title="User Profile"><p>Loading profile...</p></Card>;
  }
  if (!currentUser) { // Should ideally not happen if ProtectedRoute works, but a fallback
     return <Card title="User Profile"><p>Not logged in or profile unavailable.</p></Card>;
  }

  // ... (Your JSX for display/edit mode, same as the last correct version I gave you) ...
  // Make sure to use disabled={isSubmitting} for save/cancel buttons during submission
  // and disabled={!isEditing || isSubmitting} for input fields.
   return (
     <Card title="User Profile">
       {message && ( <p className={`${styles.message} ${Object.keys(errors).length > 0 || message.includes('Failed') || message.includes('correct') ? styles.errorMessage : styles.successMessage}`}>{message}</p>)}
       {isEditing ? (
         <form onSubmit={handleSubmit} className={styles.profileForm}>
           <Input label="Full Name" name="fullName" value={formData.fullName} onChange={handleChange} error={errors.fullName} required disabled={isSubmitting}/>
           <Input label="Age" name="age" type="number" value={formData.age} onChange={handleChange} error={errors.age} disabled={isSubmitting}/>
           <Input label="Occupation" name="occupation" value={formData.occupation} onChange={handleChange} disabled={isSubmitting}/>
           <Input label="Phone Number" name="phoneNumber" type="tel" value={formData.phoneNumber} onChange={handleChange} error={errors.phoneNumber} disabled={isSubmitting}/>
           <Input label="Username" name="username" value={currentUser.username || ''} disabled />
           <div className={styles.buttonGroup}>
             <Button type="submit" variant="primary" disabled={isSubmitting}>{isSubmitting ? 'Saving...' : 'Save Changes'}</Button>
             <Button type="button" variant="secondary" onClick={handleEditToggle} disabled={isSubmitting}>Cancel</Button>
           </div>
         </form>
       ) : (
         <div className={styles.profileDisplay}>
             <div className={styles.displayField}><span className={styles.displayLabel}>Full Name:</span><span className={styles.displayValue}>{currentUser.fullName || 'N/A'}</span></div>
             <div className={styles.displayField}><span className={styles.displayLabel}>Age:</span><span className={styles.displayValue}>{currentUser.age || 'N/A'}</span></div>
             <div className={styles.displayField}><span className={styles.displayLabel}>Occupation:</span><span className={styles.displayValue}>{currentUser.occupation || 'N/A'}</span></div>
             <div className={styles.displayField}><span className={styles.displayLabel}>Phone Number:</span><span className={styles.displayValue}>{currentUser.phoneNumber || 'N/A'}</span></div>
             <div className={styles.displayField}><span className={styles.displayLabel}>Username:</span><span className={styles.displayValue}>{currentUser.username || 'N/A'}</span></div>
           <div className={styles.buttonGroup}>
             <Button type="button" onClick={handleEditToggle}>Edit Profile</Button>
           </div>
         </div>
       )}
     </Card>
   );
};
export default ProfileManager;