import React from 'react';
import { motion } from 'framer-motion';
import './Button.css';

export function Button({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  className = '', 
  icon,
  ...props 
}) {
  return (
    <motion.button 
      whileHover={{ y: -1 }}
      whileTap={{ scale: 0.97 }}
      className={`btn btn-${variant} btn-${size} ${className}`}
      {...props}
    >
      {icon && <span className="btn-icon">{icon}</span>}
      {children}
    </motion.button>
  );
}
