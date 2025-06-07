import React from 'react';
import LoginForm from '../components/Auth/LoginForm';
import styles from './AuthPage.module.css'; // Shared styles for auth pages

const LoginPage = () => {
  return (
    <div className={styles.authPageContainer}>
      {/* Optional: Add a logo or app name header here */}
      {/* <h1 className={styles.appName}>Financier</h1> */}
      <LoginForm />
    </div>
  );
};

export default LoginPage;