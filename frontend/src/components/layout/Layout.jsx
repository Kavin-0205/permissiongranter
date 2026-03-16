import React from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopNav } from './TopNav';
import { apiClient } from '../../api/client';
import './Layout.css';

export function Layout({ user, setUser, title }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('user');
    delete apiClient.defaults.headers.common['Authorization'];
    setUser(null);
    navigate('/login');
  };

  return (
    <div className="layout-container">
      <Sidebar user={user} onLogout={handleLogout} />
      <div className="main-content">
        <TopNav title={title} user={user} />
        <main className="page-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
