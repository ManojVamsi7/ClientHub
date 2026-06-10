import React from 'react';
import './ui.css';

const Badge = ({ variant = 'default', showDot = false, children }) => {
  return (
    <span className={`badge ${variant}`}>
      {showDot && <span className="badge-dot" />}
      {children}
    </span>
  );
};

export default Badge;
