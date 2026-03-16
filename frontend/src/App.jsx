import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/layout/Layout';

import { Login } from './pages/Login';
import { Register } from './pages/Register';

import { AdminDashboard } from './pages/admin/AdminDashboard';
import { UserDashboard } from './pages/user/Dashboard';
import { WorkflowList } from './pages/user/WorkflowList';
import { WorkflowEditor } from './pages/user/WorkflowEditor';
import { WorkflowRunner } from './pages/user/WorkflowRunner';
import { ExecutionTracker } from './pages/user/ExecutionTracker';

import { ManagerDashboard } from './pages/manager/ManagerDashboard';
import { ApprovalDashboard } from './pages/manager/ApprovalDashboard';
import { AuditLogs } from './pages/manager/AuditLogs';

import { apiClient } from './api/client';

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore session
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      apiClient.defaults.headers.common['Authorization'] = `Bearer ${parsedUser.token}`;
    }
    setLoading(false);
  }, []);

  if (loading) return <div className="h-screen w-full flex center bg-background"><div className="w-8 h-8 rounded-full border-t-2 border-primary animate-spin"></div></div>;

  return (
    <Routes>
      <Route path="/login" element={
        user ? <Navigate to={`/${user.role}/dashboard`} replace /> : <Login setUser={setUser} />
      } />
      
      <Route path="/register" element={
        user ? <Navigate to={`/${user.role}/dashboard`} replace /> : <Register setUser={setUser} />
      } />
      
      {/* Admin Routes */}
      <Route path="/admin" element={
        user?.role === 'admin' ? <Layout user={user} setUser={setUser} title="Admin Workspace" /> : <Navigate to="/login" replace />
      }>
        <Route index element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="workflows" element={<WorkflowList adminMode={true} />} />
        <Route path="editor" element={<WorkflowEditor />} />
        <Route path="editor/:id" element={<WorkflowEditor />} />
      </Route>

      {/* User Routes */}
      <Route path="/user" element={
        user?.role === 'user' ? <Layout user={user} setUser={setUser} title="User Workspace" /> : <Navigate to="/login" replace />
      }>
        <Route index element={<Navigate to="/user/dashboard" replace />} />
        <Route path="dashboard" element={<UserDashboard user={user} />} />
        <Route path="workflows" element={<WorkflowList adminMode={false} />} />
        <Route path="workflows/:workflowId/start" element={<WorkflowRunner />} />
        <Route path="execution" element={<ExecutionTracker />} />
        <Route path="execution/:id" element={<ExecutionTracker />} />
      </Route>

      {/* Manager Routes */}
      <Route path="/manager" element={
        (user?.role === 'manager' || user?.role === 'admin') ? <Layout user={user} setUser={setUser} title="Manager Workspace" /> : <Navigate to="/login" replace />
      }>
        <Route index element={<Navigate to="/manager/dashboard" replace />} />
        <Route path="dashboard" element={<ManagerDashboard />} />
        <Route path="approvals" element={<ApprovalDashboard />} />
        <Route path="audit-logs" element={<AuditLogs />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to={user ? `/${user.role}/dashboard` : "/login"} replace />} />
    </Routes>
  );
}
