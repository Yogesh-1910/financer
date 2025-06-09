// src/components/Layout/Navbar.js
import React from 'react'; // Removed useState, useEffect
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../UI/Button';
import styles from './Navbar.module.css';

// Construct base URL for images, removing '/api' if present from REACT_APP_API_URL
const API_BASE_URL_ENV_NAV = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';
const IMAGE_SERVER_URL_NAV = API_BASE_URL_ENV_NAV.endsWith('/api')
                           ? API_BASE_URL_ENV_NAV.substring(0, API_BASE_URL_ENV_NAV.length - '/api'.length)
                           : API_BASE_URL_ENV_NAV;

const DEFAULT_NAV_PLACEHOLDER_INITIAL = '?'; // Fallback character if no name/username

const Navbar = ({ toggleSidebar, isSidebarOpen }) => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  let navProfileDisplay;
  if (currentUser) {
    const profilePicSrc = currentUser.profilePicUrl
                        ? `${IMAGE_SERVER_URL_NAV}${currentUser.profilePicUrl}?t=${new Date().getTime()}` // Cache buster
                        : null;

    const userInitial = currentUser.fullName ? currentUser.fullName.charAt(0).toUpperCase()
                      : currentUser.username ? currentUser.username.charAt(0).toUpperCase()
                      : DEFAULT_NAV_PLACEHOLDER_INITIAL;

    if (profilePicSrc) {
      navProfileDisplay = (
        <img
            src={profilePicSrc}
            alt="User"
            className={styles.navProfilePic}
            // Simple onError to hide if truly broken, CSS background can show placeholder
            onError={(e) => { e.target.style.display = 'none'; /* Hide broken img */
                              // Find sibling .navProfileInitial and display it (more complex)
                              // For simplicity, CSS can handle a background on .navProfileLink
                           }}
        />
      );
    } else {
      navProfileDisplay = (
        <div className={styles.navProfileInitial}>{userInitial}</div>
      );
    }
  }


  return (
    <nav className={styles.navbar}>
      <div className={styles.navLeft}>
        <Button onClick={toggleSidebar} variant="text" className={styles.menuButton}>
          {isSidebarOpen ? '✕' : '☰'}
        </Button>
        <Link to="/dashboard" className={styles.brand}>Financier</Link>
      </div>
      <div className={styles.navRight}>
        {currentUser ? (
          <>
            <span className={styles.welcomeMessage}>Hi, {currentUser.fullName || currentUser.username}!</span>
            <Link to="/dashboard/profile" className={styles.navProfileLink} title="View Profile">
              {navProfileDisplay}
            </Link>
            <Button onClick={handleLogout} variant="danger" className={styles.logoutButton}>Logout</Button>
          </>
        ) : (
          <>
            <Link to="/login" className={styles.navLink}><Button variant="secondary">Login</Button></Link>
            <Link to="/signup" className={styles.navLink}><Button variant="primary">Sign Up</Button></Link>
          </>
        )}
      </div>
    </nav>
  );
};
export default Navbar;