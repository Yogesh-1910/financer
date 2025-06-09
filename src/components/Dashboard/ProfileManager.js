// src/components/Dashboard/ProfileManager.js
import React, { useState, useEffect, useRef } from 'react';
import Card from '../UI/Card';
import Input from '../UI/Input';
import Button from '../UI/Button';
import styles from './ProfileManager.module.css';
import { useAuth } from '../../contexts/AuthContext';
import authService from '../../api/authService';

const API_BASE_URL_ENV = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';
const IMAGE_SERVER_URL = API_BASE_URL_ENV.endsWith('/api')
                         ? API_BASE_URL_ENV.substring(0, API_BASE_URL_ENV.length - '/api'.length)
                         : API_BASE_URL_ENV;

const DEFAULT_PROFILE_PIC = "https://via.placeholder.com/150.png?text=User";

const ProfileManager = () => {
  const { currentUser, updateUserContext, loading: authLoading } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ fullName: '', age: '', occupation: '', phoneNumber: '' });
  const [message, setMessage] = useState('');
  const [errors, setErrors] = useState({});
  const [fileError, setFileError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [profilePicFile, setProfilePicFile] = useState(null);
  const [profilePicPreview, setProfilePicPreview] = useState(DEFAULT_PROFILE_PIC);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (currentUser) {
      setFormData({
        fullName: currentUser.fullName || '',
        age: currentUser.age || '',
        occupation: currentUser.occupation || '',
        phoneNumber: currentUser.phoneNumber || '',
      });
      if (currentUser.profilePicUrl) {
        setProfilePicPreview(`${IMAGE_SERVER_URL}${currentUser.profilePicUrl}?t=${new Date().getTime()}`);
      } else {
        setProfilePicPreview(DEFAULT_PROFILE_PIC);
      }
    } else {
      setProfilePicPreview(DEFAULT_PROFILE_PIC);
    }
  }, [currentUser]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }));
    setMessage('');
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.fullName.trim()) newErrors.fullName = "Full name cannot be empty.";
    if (formData.age && (isNaN(formData.age) || parseInt(formData.age, 10) < 1 || parseInt(formData.age, 10) > 120)) {
      newErrors.age = "Please enter a valid age (1-120).";
    }
    if (formData.phoneNumber && formData.phoneNumber.trim()) {
        const phoneDigits = formData.phoneNumber.replace(/\D/g, '');
        if (phoneDigits.length !== 10) newErrors.phoneNumber = "Phone number should be 10 digits if provided.";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleEditToggle = () => {
    if (isEditing) { // Cancelling edit
        if (currentUser) {
            setFormData({ fullName: currentUser.fullName || '', age: currentUser.age || '', occupation: currentUser.occupation || '', phoneNumber: currentUser.phoneNumber || ''});
            setProfilePicPreview(currentUser.profilePicUrl ? `${IMAGE_SERVER_URL}${currentUser.profilePicUrl}?t=${new Date().getTime()}` : DEFAULT_PROFILE_PIC);
        }
        setProfilePicFile(null);
        setErrors({});
        setFileError('');
    } else { // Starting edit
         if (currentUser) {
            setFormData({ fullName: currentUser.fullName || '', age: currentUser.age || '', occupation: currentUser.occupation || '', phoneNumber: currentUser.phoneNumber || ''});
            // Preview is already set by useEffect based on currentUser
         }
    }
    setIsEditing(!isEditing);
    setMessage('');
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    setFileError('');
    if (file) {
        if (file.size > 5 * 1024 * 1024) {
            setFileError("File is too large (max 5MB).");
            setProfilePicFile(null);
            event.target.value = null; return;
        }
        if (!['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(file.type)) {
            setFileError("Invalid file type (JPG, PNG, GIF, WEBP).");
            setProfilePicFile(null);
            event.target.value = null; return;
        }
        setProfilePicFile(file);
        setProfilePicPreview(URL.createObjectURL(file));
    } else { // No file selected or selection cancelled
        setProfilePicFile(null);
        setProfilePicPreview(currentUser?.profilePicUrl ? `${IMAGE_SERVER_URL}${currentUser.profilePicUrl}?t=${new Date().getTime()}` : DEFAULT_PROFILE_PIC);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) { setMessage('Please correct the errors in the text fields.'); return; }
    if (fileError) { setMessage(fileError); return; }

    setIsSubmitting(true);
    setMessage('');
    let userAfterTextUpdate = currentUser;

    try {
      const textFieldsChanged =
         (formData.fullName.trim() !== (currentUser.fullName || '')) ||
         (formData.age ? String(parseInt(formData.age)) : '') !== String(currentUser.age || '') ||
         (formData.occupation.trim() !== (currentUser.occupation || '')) ||
         (formData.phoneNumber.trim() !== (currentUser.phoneNumber || ''));

      if (textFieldsChanged) {
         const profileDataToUpdate = {
             fullName: formData.fullName.trim(),
             age: formData.age === '' ? null : (formData.age ? parseInt(formData.age) : null),
             occupation: formData.occupation.trim() || null,
             phoneNumber: formData.phoneNumber.trim() || null,
         };
         userAfterTextUpdate = await authService.updateUserProfile(profileDataToUpdate);
         updateUserContext(userAfterTextUpdate);
      }

      if (profilePicFile) {
        const updatedUserWithPic = await authService.uploadProfilePic(profilePicFile);
        updateUserContext(updatedUserWithPic); // This contains the latest state including pic
        setProfilePicFile(null);
      }

      setMessage('Profile updated successfully!');
      setIsEditing(false);
      setTimeout(() => setMessage(''), 4000);

    } catch (error) {
      const errorMsg = error.response?.data?.msg || error.response?.data?.error || 'Failed to update profile.';
      setMessage(errorMsg);
      console.error("[FE ProfileManager] Profile update/upload error:", error.response || error);
    }
    setIsSubmitting(false);
  };

  if (authLoading && !currentUser) return <Card title="User Profile"><p>Loading profile...</p></Card>;
  if (!currentUser) return <Card title="User Profile"><p>Not logged in.</p></Card>;

  const imageToDisplay = (isEditing && profilePicPreview.startsWith('blob:'))
                        ? profilePicPreview
                        : (currentUser.profilePicUrl
                            ? `${IMAGE_SERVER_URL}${currentUser.profilePicUrl}?t=${new Date().getTime()}`
                            : DEFAULT_PROFILE_PIC);

  return (
    <Card title="User Profile">
      {message && ( <p className={`${styles.message} ${fileError || (Object.keys(errors).length > 0 && !message.includes('successfully')) || message.includes('Failed') || message.includes('correct') ? styles.errorMessage : styles.successMessage}`}>{message}</p>)}

      <div className={styles.profileLayout}>
         <div className={styles.profilePictureArea}>
             <img
                 src={imageToDisplay}
                 alt="Profile"
                 className={styles.profileImageEditPage}
                 onError={(e) => { e.target.onerror = null; e.target.src=DEFAULT_PROFILE_PIC; }}
             />
             {isEditing && (
                 <div className={styles.fileInputContainer}>
                     <input type="file" accept="image/jpeg,image/png,image/gif,image/webp" onChange={handleFileChange} className={styles.fileInputHidden} ref={fileInputRef} disabled={isSubmitting}/>
                     <Button type="button" onClick={() => fileInputRef.current.click()} disabled={isSubmitting} variant="secondary">Change Picture</Button>
                     {fileError && <p className={styles.fileErrorMessage}>{fileError}</p>}
                 </div>
             )}
         </div>

         <div className={styles.profileFormArea}>
             {isEditing ? (
                 <form onSubmit={handleSubmit} className={styles.profileForm}>
                     <Input label="Full Name*" name="fullName" value={formData.fullName} onChange={handleChange} error={errors.fullName} required disabled={isSubmitting}/>
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
         </div>
      </div>
    </Card>
  );
};
export default ProfileManager;