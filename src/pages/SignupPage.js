import React from 'react';
import SignupForm from '../components/Auth/SignupForm';
import styles from './AuthPage.module.css'; // Shared styles for auth pages

const SignupPage = () => {
  return (
    <div className={styles.authPageContainer}>
      {/* <h1 className={styles.appName}>Financier</h1> */}
      <SignupForm />
    </div>
  );
};

export default SignupPage;