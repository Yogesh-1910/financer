import React from 'react';
import styles from './UserAvatar.module.css';

const UserAvatar = ({ user, size = 40 }) => {
  const getInitials = (name) => {
    if (!name) return '?';
    const nameParts = name.split(' ');
    if (nameParts.length > 1) {
      return `${nameParts[0][0]}${nameParts[nameParts.length - 1][0]}`.toUpperCase();
    }
    return name[0].toUpperCase();
  };

  const avatarStyle = {
    width: `${size}px`,
    height: `${size}px`,
    fontSize: `${size * 0.4}px`, // Adjust font size based on avatar size
    lineHeight: `${size}px`,
  };

  // A simple color hashing for variety, not cryptographically secure
  const stringToColor = (str) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    let color = '#';
    for (let i = 0; i < 3; i++) {
      const value = (hash >> (i * 8)) & 0xFF;
      color += ('00' + value.toString(16)).slice(-2);
    }
    return color;
  };
  
  const backgroundColor = user?.username ? stringToColor(user.username) : '#cccccc';


  if (user?.profilePictureUrl) {
    return (
      <img
        src={user.profilePictureUrl}
        alt={user.fullName || user.username || 'User Avatar'}
        className={styles.avatarImage}
        style={{ width: `${size}px`, height: `${size}px` }}
      />
    );
  }

  return (
    <div className={styles.avatarInitials} style={{ ...avatarStyle, backgroundColor }}>
      {getInitials(user?.fullName || user?.username)}
    </div>
  );
};

export default UserAvatar;