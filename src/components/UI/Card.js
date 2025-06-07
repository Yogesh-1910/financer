import React from 'react';
import styles from './Card.module.css';

const Card = ({ children, title, className = '', actions }) => {
  return (
    <div className={`${styles.card} ${className}`}>
      {title && (
        <div className={styles.cardHeader}>
          <h2 className={styles.cardTitle}>{title}</h2>
          {actions && <div className={styles.cardActions}>{actions}</div>}
        </div>
      )}
      <div className={styles.cardContent}>
        {children}
      </div>
    </div>
  );
};

export default Card;