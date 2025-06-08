// src/pages/LoginPage.js
import React from 'react';
import LoginForm from '../components/Auth/LoginForm';
import styles from './AuthPage.module.css';

const LoginPage = () => {
  const videoFileName = '91260-628462870.mp4'; // <<<< YOUR VIDEO FILENAME

  return (
    <div className={styles.authPageContainer}>
      <video 
        autoPlay 
        loop 
        muted 
        playsInline 
        className={styles.backgroundVideo}
        key={videoFileName} 
      >
        <source src={`/assets/${videoFileName}`} type="video/mp4" />
        Your browser does not support the video tag.
      </video>
      <div className={styles.videoOverlay}></div> {/* Overlay */}
      <div className={styles.formWrapper}> {/* Form on top */}
        <LoginForm />
      </div>
    </div>
  );
};
export default LoginPage;