import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  BarChart3, 
  Users, 
  Activity, 
  Download, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Building2,
  ArrowUpRight,
  FileSpreadsheet
} from 'lucide-react';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { apiClient } from '../../api/client';
import './AdminDashboard.css';

export function AdminDashboard() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [recentRequests, setRecentRequests] = useState([]);

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      const [analyticsRes, requestsRes] = await Promise.all([
        apiClient.get('/analytics'),
        apiClient.get('/executions?limit=10')
      ]);
      setAnalytics(analyticsRes.data);
      setRecentRequests(requestsRes.data.executions || []);
    } catch (err) {
      console.error('Failed to fetch admin data', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadReport = () => {
    if (!recentRequests.length) return;
    
    // Generate CSV content
    const headers = ['ID', 'Workflow', 'Requester', 'Department', 'Status', 'Date'];
    const rows = recentRequests.map(req => [
      req._id,
      req.workflowId?.title || 'Unknown',
      req.requesterId?.name || 'Unknown',
      req.payloadData?.department || 'N/A',
      req.status,
      new Date(req.createdAt).toLocaleDateString()
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `helleyx_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="flex center h-[60vh]">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const { statusBreakdown, requestsByDepartment } = analytics || {};

  return (
    <div className="admin-dashboard-container animate-fade-in">
      {/* Premium Header with Export */}
      <div className="export-header">
        <div>
          <h1 className="text-h1 font-bold mb-2">Systems Overview</h1>
          <p className="text-white text-opacity-80">Global monitor for all organizational workflows and department requests.</p>
        </div>
        <Button 
          variant="secondary" 
          icon={<Download size={18} />}
          onClick={handleDownloadReport}
          className="bg-white text-primary hover:bg-white hover:bg-opacity-90 transition-all shadow-xl"
        >
          Export Report
        </Button>
      </div>

      {/* Main Stats Grid */}
      <div className="stats-grid">
        <div className="admin-stat-card">
          <div className="stat-icon bg-blue-100 text-blue-600">
            <Activity size={24} />
          </div>
          <div>
            <p className="text-sm text-muted font-semibold uppercase">Total Requests</p>
            <h3 className="text-h2 font-black">{analytics.totalExecutions}</h3>
          </div>
        </div>
        <div className="admin-stat-card">
          <div className="stat-icon bg-success bg-opacity-10 text-success">
            <CheckCircle2 size={24} />
          </div>
          <div>
            <p className="text-sm text-muted font-semibold uppercase">Accepted</p>
            <h3 className="text-h2 font-black">{statusBreakdown?.completed || 0}</h3>
          </div>
        </div>
        <div className="admin-stat-card">
          <div className="stat-icon bg-error bg-opacity-10 text-error">
            <XCircle size={24} />
          </div>
          <div>
            <p className="text-sm text-muted font-semibold uppercase">Rejected</p>
            <h3 className="text-h2 font-black">{statusBreakdown?.failed || 0}</h3>
          </div>
        </div>
        <div className="admin-stat-card">
          <div className="stat-icon bg-warning bg-opacity-10 text-warning">
            <Clock size={24} />
          </div>
          <div>
            <p className="text-sm text-muted font-semibold uppercase">In Progress</p>
            <h3 className="text-h2 font-black">{statusBreakdown?.running || 0}</h3>
          </div>
        </div>
      </div>

      <div className="dashboard-sections">
        {/* Department Breakdown */}
        <div className="section-card">
          <div className="section-header">
            <h2 className="text-h4 font-bold flex items-center gap-2">
              <Building2 size={20} className="text-primary" /> Requests by Department
            </h2>
            <ArrowUpRight size={18} className="text-muted" />
          </div>
          <div className="dept-list">
            {(requestsByDepartment || []).map((dept) => {
              const percentage = (dept.count / (analytics.totalExecutions || 1)) * 100;
              return (
                <div key={dept.name} className="flex-col gap-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium text-primary-text">{dept.name}</span>
                    <span className="text-muted">{dept.count} requests</span>
                  </div>
                  <div className="dept-bar-bg">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${percentage}%` }}
                      transition={{ duration: 1, ease: "easeOut" }}
                      className="dept-bar-fill"
                    ></motion.div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* System Health / Users */}
        <div className="section-card">
          <div className="section-header">
            <h2 className="text-h4 font-bold flex items-center gap-2">
              <Users size={20} className="text-secondary" /> Administrative Status
            </h2>
          </div>
          <div className="flex-col gap-6">
            <div className="flex justify-between items-center p-4 bg-tertiary rounded-xl border border-color">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary bg-opacity-10 text-primary flex center">
                   <Activity size={20} />
                </div>
                <span className="font-semibold">System Health</span>
              </div>
              <span className="text-h4 font-bold text-success">{analytics.systemHealth}%</span>
            </div>
            <div className="flex justify-between items-center p-4 bg-tertiary rounded-xl border border-color">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-secondary bg-opacity-10 text-secondary flex center">
                   <Users size={20} />
                </div>
                <span className="font-semibold">Active Seats</span>
              </div>
              <span className="text-h4 font-bold">{analytics.activeUsers} / 100</span>
            </div>
            <div className="p-4 bg-primary bg-opacity-5 rounded-xl border border-primary border-opacity-20">
               <p className="text-xs text-muted mb-2 font-bold uppercase tracking-widest">Average Response Time</p>
               <h4 className="text-h3 font-black text-primary">{Math.round((analytics.avgCompletionTimeMs || 0) / 1000 / 60)} mins</h4>
               <div className="mt-3 flex items-center gap-2 text-success text-xs font-bold">
                  <ArrowUpRight size={14} /> 12% faster than last month
               </div>
            </div>
          </div>
        </div>

        {/* Recent Activity Table */}
        <div className="section-card recent-table-card">
           <div className="section-header">
              <h2 className="text-h4 font-bold flex items-center gap-2">
                <FileSpreadsheet size={20} className="text-primary" /> Recent Global Network Activity
              </h2>
           </div>
           <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-color text-muted text-xs uppercase tracking-widest">
                    <th className="p-4 font-bold">Execution ID</th>
                    <th className="p-4 font-bold">User</th>
                    <th className="p-4 font-bold">Workflow</th>
                    <th className="p-4 font-bold">Priority</th>
                    <th className="p-4 font-bold">Status</th>
                    <th className="p-4 font-bold text-right">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {[...recentRequests]
                    .sort((a, b) => {
                      const order = { high: 0, medium: 1, low: 2 };
                      return order[a.priority || 'medium'] - order[b.priority || 'medium'];
                    })
                    .map(req => (
                    <tr key={req._id} className="border-b border-color last:border-0 hover:bg-tertiary transition-colors">
                      <td className="p-4 text-xs font-mono text-muted">{req._id.slice(-8)}</td>
                      <td className="p-4 font-medium">{req.requesterId?.name}</td>
                      <td className="p-4 text-sm font-semibold text-primary">{req.workflowId?.title}</td>
                      <td className="p-4">
                        <Badge variant={
                          req.priority === 'high' ? 'error' : 
                          req.priority === 'medium' ? 'warning' : 'neutral'
                        }>
                          {req.priority || 'medium'}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <Badge variant={
                          req.status === 'completed' ? 'success' : 
                          ['failed', 'canceled'].includes(req.status) ? 'error' : 'warning'
                        }>
                          {req.status}
                        </Badge>
                      </td>
                      <td className="p-4 text-right text-xs text-muted">{new Date(req.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
           </div>
        </div>
      </div>
    </div>
  );
}
