import React from 'react';
import './Input.css';

export const Input = React.forwardRef(({ 
  label, 
  error, 
  icon: Icon,
  className = '', 
  wrapperClassName = '',
  ...props 
}, ref) => {
  return (
    <div className={`input-wrapper ${wrapperClassName}`}>
      {label && <label className="input-label">{label}</label>}
      <div className="input-container">
        {Icon && <span className="input-icon"><Icon size={18} /></span>}
        <input 
          ref={ref}
          className={`input-field ${Icon ? 'has-icon' : ''} ${error ? 'has-error' : ''} ${className}`}
          {...props}
        />
      </div>
      {error && <p className="input-error">{error}</p>}
    </div>
  );
});

Input.displayName = 'Input';
