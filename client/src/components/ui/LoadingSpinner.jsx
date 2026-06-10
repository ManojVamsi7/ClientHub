import React from 'react';
import './ui.css';

const LoadingSpinner = ({ message = 'Loading content...' }) => {
  return (
    <div className="spinner-container">
      <div className="spinner" />
      {message && <span className="loading-text">{message}</span>}
    </div>
  );
};

export default LoadingSpinner;
