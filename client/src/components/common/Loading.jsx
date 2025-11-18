// File: client/src/components/common/Loading.jsx
// Purpose: Loading spinner component
// Dependencies: React

import React from 'react';
import styles from './Loading.module.css';

const Loading = ({ size = 'medium', fullScreen = false }) => {
  if (fullScreen) {
    return (
      <div className={styles.fullScreen}>
        <div className={`${styles.spinner} ${styles[size]}`}></div>
      </div>
    );
  }

  return <div className={`${styles.spinner} ${styles[size]}`}></div>;
};

export default Loading;
