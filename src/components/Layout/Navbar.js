// src/components/Layout/Navbar.js
import React from 'react';
import { Link } from 'react-router-dom'; // No useNavigate needed here for logout if handled by Sidebar
import { useAuth } from '../../contexts/AuthContext';
import Button from '../UI/Button';
import UserAvatar from './UserAvatar';
import styles from './Navbar.module.css';
// import AppLogo from '../../assets/app-logo.svg'; // Example: if you have an SVG logo

const Navbar = ({ toggleSidebar, isSidebarOpen }) => { // isSidebarOpen might be used to change menu icon
  const { currentUser } = useAuth();

  return (
    <header className={styles.navbar}> {/* Changed nav to header for semantics */}
      <div className={styles.navLeft}>
        <Button onClick={toggleSidebar} variant="text" className={styles.menuButton}>
          {/* Icon changes based on sidebar state, good for mobile where sidebar overlays */}
          {isSidebarOpen && window.innerWidth <= 992 ? '✕' : '☰'}
        </Button>
        {/* <img src={AppLogo} alt="Financier Logo" className={styles.appLogo} /> */}
        <Link to="/dashboard" className={styles.brand}>
          Financier
        </Link>
      </div>
      <div className={styles.navRight}>
        {currentUser && (
          <Link to="/dashboard/profile" className={styles.profileLink}>
            <span className={styles.usernameNav}>{currentUser.fullName || currentUser.username}</span>
            <UserAvatar user={currentUser} size={36} />
          </Link>
        )}
        {/* Logout button moved to Sidebar for better UX on dashboards */}
      </div>
    </header>
  );
};

export default Navbar;