import React from 'react';
import styles from './Input.module.css';

const Input = ({ label, type = 'text', value, onChange, name, placeholder, error, required=false, disabled=false }) => {
  return (
    <div className={styles.inputGroup}>
      {label && <label htmlFor={name} className={styles.label}>{label}{required && "*"}</label>}
      <input
        type={type}
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`${styles.input} ${error ? styles.errorInput : ''}`}
        required={required}
        disabled={disabled}
      />
      {error && <p className={styles.errorMessage}>{error}</p>}
    </div>
  );
};

export default Input;