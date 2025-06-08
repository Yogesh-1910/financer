// src/components/Layout/Sidebar.js
import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import styles from './Sidebar.module.css';
import { useAuth } from '../../contexts/AuthContext';

// Import chosen icons
import { MdDashboard, MdAccountBalanceWallet, MdPayment, MdShowChart, MdSupportAgent, MdLogout, MdPerson } from 'react-icons/md';

const Sidebar = ({ isOpen, toggleSidebar }) => {
  const { logout, currentUser } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
    if (window.innerWidth <= 768 && toggleSidebar && isOpen) {
        toggleSidebar();
    }
  };

  const navItems = [
    { path: '/dashboard', label: 'Dashboard Home', iconComponent: <MdDashboard /> },
    { path: '/dashboard/budget', label: 'Budget Manager', iconComponent: <MdAccountBalanceWallet /> },
    { path: '/dashboard/loans-emi', label: 'Loan & EMI Tracker', iconComponent: <MdPayment /> },
    { path: '/dashboard/stocks', label: 'Stock Monitoring', iconComponent: <MdShowChart /> },
    { path: '/dashboard/ai-assistant', label: 'AI Fin Bot', iconComponent: <MdSupportAgent /> },
    //{ path: '/dashboard/profile', label: 'Profile', iconComponent: <MdPerson /> }, // Using react-icon for profile too
  ];

  const handleLinkClick = () => {
    if (window.innerWidth <= 768 && toggleSidebar && isOpen) {
      toggleSidebar();
    }
  };

  return (
    <>
      {isOpen && window.innerWidth <= 768 && <div className={styles.backdrop} onClick={toggleSidebar}></div>}
      <aside className={`${styles.sidebar} ${isOpen ? styles.open : styles.closed}`}>
        <div className={styles.sidebarHeader}>
          {/* "FinanceHub" text removed or replaced if you have a logo/actual app name */}
          {/* Example: <img src="/logo.png" alt="App Logo" className={styles.sidebarLogo} /> */}
          {/* Or just leave it empty for a cleaner look if no logo/text desired here */}
          <button onClick={toggleSidebar} className={styles.closeButtonMobile}>✕</button>
        </div>

        <nav className={styles.sidebarNav}>
          <ul>
            {navItems.map((item) => ( // Removed index as key if path is unique
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  // For react-router-dom v6: Add 'end' prop for the root dashboard link
                  end={item.path === '/dashboard'}
                  className={({ isActive }) => isActive ? `${styles.navLink} ${styles.active}` : styles.navLink}
                  title={item.label}
                  onClick={handleLinkClick}
                >
                  <span className={styles.icon}>
                    {item.iconComponent} {/* Assuming all items now have iconComponent */}
                  </span>
                  <span className={styles.label}>{item.label}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className={styles.sidebarFooter}>
            <button onClick={handleLogout} className={styles.logoutButtonSidebar}>
                <span className={styles.icon}><MdLogout /></span> {/* Using react-icon for logout */}
                <span className={styles.label}>Logout</span>
            </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;