import React from 'react';
import './ui.css';

const Button = ({ 
  type = 'button',
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  onClick,
  icon: Icon,
  iconPosition = 'left',
  children,
  ...props
}) => {
  return (
    <button
      type={type}
      className={`btn btn-${variant} btn-${size}`}
      disabled={disabled || loading}
      onClick={onClick}
      {...props}
    >
      {loading && <div className="spinner" style={{ width: '14px', height: '14px', borderWeight: '2px' }} />}
      
      {!loading && Icon && iconPosition === 'left' && <Icon size={16} />}
      
      <span>{children}</span>
      
      {!loading && Icon && iconPosition === 'right' && <Icon size={16} />}
    </button>
  );
};

export default Button;
