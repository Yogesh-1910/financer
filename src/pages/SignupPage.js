// src/pages/SignupPage.js
import React from 'react';
import SignupForm from '../components/Auth/SignupForm'; // Ensure this path is correct
import styles from './AuthPage.module.css';      // Shared CSS for page layout and video

const SignupPage = () => {
  // Ensure this video file exists in public/assets/
  // You can use the same video as login or a different one
  const videoFileName = '91260-628462870.mp4'; // <<<< YOUR VIDEO FILENAME

  return (
    <div className={styles.authPageContainer}>
      {/* VIDEO ELEMENT */}
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

      {/* OVERLAY */}
      <div className={styles.videoOverlay}></div>

      {/* Optional: App Name Header */}
      {/* <h1 className={styles.appName}>Financier</h1> */}

      {/* FORM WRAPPER */}
      <div className={styles.formWrapper}> {/* Use max-width from AuthPage.module.css */}
        <SignupForm />
      </div>
    </div>
  );
};

export default SignupPage;