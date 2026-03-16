import React, { useState } from 'react';
import { Bell, Search, Menu, X, Info } from 'lucide-react';
import './TopNav.css';

export function TopNav({ title, user }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchValue, setSearchValue] = useState('');

  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);
  const toggleNotifications = () => setShowNotifications(!showNotifications);

  return (
    <header className="topnav">
      <div className="left-section">
        <button 
          className={`mobile-menu-btn ${isMobileMenuOpen ? 'active' : ''}`}
          onClick={toggleMobileMenu}
          aria-label="Toggle Menu"
        >
          {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
        <h1 className="page-title">{title}</h1>
      </div>
      
      <div className="right-section">
        <div className="search-bar hidden md:flex">
          <Search size={16} className="text-muted" />
          <input 
            type="text" 
            placeholder="Search workflows..." 
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
          />
        </div>
        
        <div className="relative">
          <button 
            className={`icon-btn relative ${showNotifications ? 'active' : ''}`}
            onClick={toggleNotifications}
          >
            <Bell size={20} />
            <span className="notification-badge"></span>
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-64 bg-secondary border border-color rounded-xl shadow-xl z-50 animate-fade-in p-2">
              <div className="p-3 border-b border-color flex items-center justify-between">
                <span className="font-semibold text-sm">Notifications</span>
              </div>
              <div className="p-4 flex-col items-center justify-center text-center gap-2">
                <div className="w-10 h-10 rounded-full bg-primary bg-opacity-10 text-primary flex items-center justify-center mx-auto mb-2">
                  <Info size={20} />
                </div>
                <p className="text-xs text-muted">No new notifications at this time.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
