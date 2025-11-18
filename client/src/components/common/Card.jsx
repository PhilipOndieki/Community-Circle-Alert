// File: client/src/components/common/Card.jsx
// Purpose: Reusable Card component
// Dependencies: React

import React from 'react';
import styles from './Card.module.css';

const Card = ({ children, className = '', onClick, hover = false }) => {
  return (
    <div
      className={`${styles.card} ${hover ? styles.hover : ''} ${className}`}
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
    >
      {children}
    </div>
  );
};

export default Card;
