import React from 'react';
import { Bell, Search, Menu } from 'lucide-react';
import './TopNav.css';

export function TopNav({ title, user }) {
  return (
    <header className="topnav">
      <div className="left-section">
        <button className="mobile-menu-btn">
          <Menu size={20} />
        </button>
        <h1 className="page-title">{title}</h1>
      </div>
      
      <div className="right-section">
        <div className="search-bar hidden md:flex">
          <Search size={16} className="text-muted" />
          <input type="text" placeholder="Search workflows..." />
        </div>
        
        <button className="icon-btn relative">
          <Bell size={20} />
          <span className="notification-badge"></span>
        </button>
      </div>
    </header>
  );
}
