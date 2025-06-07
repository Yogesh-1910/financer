// src/components/Layout/Sidebar.js
import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import styles from './Sidebar.module.css';
import { useAuth } from '../../contexts/AuthContext';
// Button component is used for the logout button, assuming it's a styled custom button.
// If it's a plain <button>, you can remove this import and use a plain button.
// import Button from '../UI/Button';

const Sidebar = ({ isOpen, toggleSidebar }) => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
    if (isOpen && window.innerWidth <= 992) {
      toggleSidebar();
    }
  };

  const allNavItems = [
    { path: '/dashboard', label: 'Dashboard Home', icon: '🏠' },
    { path: '/dashboard/budget', label: 'Budget Manager', icon: '💰' },
    { path: '/dashboard/loans-emi', label: 'Loan & EMI Tracker', icon: '💳' },
    { path: '/dashboard/stocks', label: 'Stock Monitor', icon: '📈' },
    { path: '/dashboard/ai-assistant', label: 'AI FinBot', icon: '🤖' },
    { path: '/dashboard/profile', label: 'My Profile', icon: '👤' }, // This will be filtered
  ];

  const navItems = allNavItems.filter(item => item.label !== 'My Profile');

  const handleLinkClick = () => {
    if (isOpen && window.innerWidth <= 992) {
      toggleSidebar();
    }
  };

  return (
    <>
      {/* Backdrop for mobile overlay */}
      {isOpen && window.innerWidth <= 992 && <div className={styles.backdrop} onClick={toggleSidebar}></div>}

      <aside className={`${styles.sidebar} ${isOpen ? styles.open : styles.closed}`}>
        {/* This div acts as a minimal top spacer or can hold a tiny collapsed logo element if desired */}
        <div className={styles.sidebarHeader}>
          {/* Intentionally left empty to remove user profile display from sidebar top */}
          {/* If you wanted a logo here when isOpen is true:
            {isOpen && <img src="/path-to-logo.png" alt="Logo" className={styles.sidebarAppLogo} />}
          */}
        </div>

        <nav className={styles.sidebarNav}>
          <ul>
            {navItems.map(item => (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  end={item.path === '/dashboard'}
                  className={({ isActive }) => `${styles.navLink} ${isActive ? styles.active : ''}`}
                  title={item.label}
                  onClick={handleLinkClick}
                >
                  <span className={styles.icon}>{item.icon}</span>
                  {isOpen && <span className={styles.label}>{item.label}</span>}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className={styles.sidebarFooter}>
          <button onClick={handleLogout} className={styles.logoutButtonSidebar} title="Logout">
            <span className={styles.icon}>🚪</span>
            {isOpen && <span className={styles.label}>Logout</span>}
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;