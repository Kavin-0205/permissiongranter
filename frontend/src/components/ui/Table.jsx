import React from 'react';
import './Table.css';

export function Table({ children, className = '' }) {
  return (
    <div className={`table-container ${className}`}>
      <table className="w-full">
        {children}
      </table>
    </div>
  );
}

export function TableHeader({ children }) {
  return <thead>{children}</thead>;
}

export function TableBody({ children }) {
  return <tbody>{children}</tbody>;
}

export function TableRow({ children, className = '', onClick }) {
  return (
    <tr 
      className={`table-row ${onClick ? 'clickable' : ''} ${className}`}
      onClick={onClick}
    >
      {children}
    </tr>
  );
}

export function TableHead({ children, className = '' }) {
  return <th className={`table-head ${className}`}>{children}</th>;
}

export function TableCell({ children, className = '' }) {
  return <td className={`table-cell ${className}`}>{children}</td>;
}
