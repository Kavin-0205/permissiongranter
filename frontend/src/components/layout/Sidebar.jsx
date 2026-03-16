import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Settings, 
  Workflow, 
  CheckSquare, 
  Activity, 
  LogOut,
  PenTool
} from 'lucide-react';
import './Sidebar.css';

export function Sidebar({ user, onLogout }) {
  const role = user?.role || 'user';

  const userLinks = [
    { to: '/user/dashboard', icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
    { to: '/user/workflows', icon: <Workflow size={20} />, label: 'Available Workflows' },
    { to: '/user/execution', icon: <Activity size={20} />, label: 'My Requests' }
  ];

  const managerLinks = [
    { to: '/manager/dashboard', icon: <LayoutDashboard size={20} />, label: 'Overview' },
    { to: '/manager/approvals', icon: <CheckSquare size={20} />, label: 'Approvals' },
    { to: '/manager/audit-logs', icon: <Activity size={20} />, label: 'Audit Logs' }
  ];

  const adminLinks = [
    { to: '/admin/dashboard', icon: <LayoutDashboard size={20} />, label: 'Control Center' },
    { to: '/admin/workflows', icon: <Workflow size={20} />, label: 'Workflow Library' },
    { to: '/admin/editor', icon: <PenTool size={20} />, label: 'Build Workflow' },
    { to: '/manager/approvals', icon: <CheckSquare size={20} />, label: 'Global Approvals' }
  ];

  let links = userLinks;
  if (role === 'admin') links = adminLinks;
  if (role === 'manager') links = managerLinks;

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
         <div className="logo-icon">Hx</div>
         <div className="logo-text">Helleyx Flow</div>
      </div>
      
      <nav className="sidebar-nav">
        <ul>
          {links.map((link) => (
            <li key={link.to}>
              <NavLink 
                to={link.to} 
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              >
                {link.icon}
                <span>{link.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
      
      <div className="sidebar-footer">
        <div className="user-info">
          <div className="avatar">{user?.name ? user.name.charAt(0).toUpperCase() : 'U'}</div>
          <div className="details">
            <div className="name">{user?.name || 'User'}</div>
            <div className="role-badge capitalize">{role}</div>
          </div>
        </div>
        <button className="logout-btn" onClick={onLogout}>
          <LogOut size={18} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
