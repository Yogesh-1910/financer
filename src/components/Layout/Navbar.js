// src/components/Layout/Navbar.js
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import UserAvatar from './UserAvatar'; // Assuming this component exists and is styled
import styles from './Navbar.module.css';

// Import icons for menu toggle
import { MdMenu, MdClose } from 'react-icons/md';

const Navbar = ({ toggleSidebar, isSidebarOpen }) => {
  const { currentUser } = useAuth();
  const [isMobileViewForMenu, setIsMobileViewForMenu] = useState(window.innerWidth <= 992); // Threshold for mobile menu icon logic

  useEffect(() => {
    const handleResize = () => {
      setIsMobileViewForMenu(window.innerWidth <= 992);
    };
    window.addEventListener('resize', handleResize);
    // Initial check
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Determine which icon to show for the menu button
  // On mobile, it changes based on sidebar state. On desktop, it might always be the hamburger.
  // Your previous logic: isSidebarOpen && window.innerWidth <= 992 ? '✕' : '☰'
  // Let's refine this: if it's mobile, toggle. If desktop, always show hamburger (or base it on isSidebarOpen if desktop sidebar can also fully collapse/disappear).
  // For simplicity, let's keep the toggle visible on desktop too if the sidebar can be fully hidden/shown by it.
  const menuIconToDisplay = isSidebarOpen ? <MdClose /> : <MdMenu />;

  return (
    <header className={styles.navbar}>
      <div className={styles.navLeft}>
        <button onClick={toggleSidebar} className={styles.menuButton} aria-label={isSidebarOpen ? "Close menu" : "Open menu"}>
          {menuIconToDisplay}
        </button>
        <Link to="/dashboard" className={styles.brand}>
          Financier
        </Link>
      </div>

      <div className={styles.navRight}>
        {currentUser ? (
          // This Link is the element that gets the black background on hover
          <Link to="/dashboard/profile" className={styles.profileLinkContainer} title={`View profile for ${currentUser.username}`}>
            <span className={styles.usernameNav}>{currentUser.username}</span>
            <UserAvatar user={currentUser} size={30} /> {/* Consistent size */}
          </Link>
        ) : (
          <>
            {/* Login/Signup buttons would go here if user is not logged in,
                but your screenshot shows them for an authenticated user.
                Assuming these are handled elsewhere or not needed when logged in. */}
          </>
        )}
        {/* Logout button is in Sidebar in your current design */}
      </div>
    </header>
  );
};

export default Navbar;