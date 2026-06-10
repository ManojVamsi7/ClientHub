import React from 'react';
import './ui.css';

const Select = ({
  label,
  options = [],
  error,
  id,
  className = '',
  required = false,
  placeholder,
  children,
  ...props
}) => {
  return (
    <div className={`form-group ${className}`}>
      {label && (
        <label htmlFor={id} className="form-label">
          {label} {required && <span style={{ color: 'var(--error)' }}>*</span>}
        </label>
      )}
      <select
        id={id}
        required={required}
        className={`form-select ${error ? 'error' : ''}`}
        {...props}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {children ? children : options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <span className="form-error">{error}</span>}
    </div>
  );
};

export default Select;
