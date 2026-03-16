import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Clock, AlertCircle, FileText, ArrowRight, Activity, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../../api/client';

export function UserDashboard({ user }) {
  const [stats, setStats] = useState({ active: 0, completed: 0, failed: 0 });
  const [recentRequests, setRecentRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const res = await apiClient.get('/executions?limit=5');
      const executions = res.data.executions || [];
      
      let active = 0, completed = 0, failed = 0;
      executions.forEach(ex => {
        if (['in_progress', 'paused_for_approval', 'pending'].includes(ex.status)) active++;
        else if (ex.status === 'completed') completed++;
        else failed++;
      });
      
      setStats({ active, completed, failed });
      setRecentRequests(executions.slice(0, 5));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-8"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="user-dashboard-wrapper">
      <div className="user-dashboard-bg"></div>
      <div className="flex-col gap-6 p-4 md:p-8 max-w-7xl mx-auto w-full animate-fade-in fade-in-up user-dashboard-content">
        {/* Welcome Banner */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="user-welcome-banner relative overflow-hidden"
        >
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
            <div>
              <h1 className="text-h1 font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
                Welcome back, {user?.name || 'User'}!
              </h1>
              <p className="text-muted max-w-lg text-lg">
                You have {stats.active} workflows currently being processed. Need something else? Start a new request from the library.
              </p>
            </div>
            <button 
              className="flex items-center gap-2 bg-gradient-to-r from-primary to-primary-hover text-white px-6 py-3 rounded-xl font-semibold hover:-translate-y-1 transition-transform shadow-lg"
              onClick={() => navigate('/user/workflows')}
            >
              <FileText size={20} /> Browse Workflows
            </button>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="user-stat-card p-6 flex items-center gap-5">
              <div className="w-16 h-16 rounded-2xl bg-warning bg-opacity-20 flex center text-warning shadow-inner">
                <Clock size={32} />
              </div>
              <div>
                <p className="text-sm font-bold text-muted uppercase tracking-wider">In Progress</p>
                <h3 className="text-h1 font-black mt-1 text-primary-text">{stats.active}</h3>
              </div>
          </div>
          <div className="user-stat-card p-6 flex items-center gap-5">
              <div className="w-16 h-16 rounded-2xl bg-success bg-opacity-20 flex center text-success shadow-inner">
                <CheckCircle2 size={32} />
              </div>
              <div>
                <p className="text-sm font-bold text-muted uppercase tracking-wider">Completed</p>
                <h3 className="text-h1 font-black mt-1 text-primary-text">{stats.completed}</h3>
              </div>
          </div>
          <div className="user-stat-card p-6 flex items-center gap-5">
              <div className="w-16 h-16 rounded-2xl bg-error bg-opacity-20 flex center text-error shadow-inner">
                <AlertCircle size={32} />
              </div>
              <div>
                <p className="text-sm font-bold text-muted uppercase tracking-wider">Failed / Canceled</p>
                <h3 className="text-h1 font-black mt-1 text-primary-text">{stats.failed}</h3>
              </div>
          </div>
        </div>

        {/* Recent Activity Table */}
        <div className="mt-8">
          <h2 className="text-h3 font-bold mb-6 flex items-center gap-3 text-primary-text">
            <Activity size={24} className="text-primary" /> My Recent Requests
          </h2>
          
          {recentRequests.length === 0 ? (
            <div className="user-welcome-banner text-center text-muted border-dashed border-2">
              <p>You haven't submitted any requests yet.</p>
            </div>
          ) : (
            <div className="user-table-wrapper">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-primary bg-opacity-5 border-b border-color text-sm text-primary-text">
                    <th className="p-5 font-bold">Workflow</th>
                    <th className="p-5 font-bold">Priority</th>
                    <th className="p-5 font-bold">Submitted Date</th>
                    <th className="p-5 font-bold">Current Step</th>
                    <th className="p-5 font-bold">Status</th>
                    <th className="p-5 font-bold text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {[...recentRequests]
                    .sort((a, b) => {
                      const order = { high: 0, medium: 1, low: 2 };
                      return order[a.priority || 'medium'] - order[b.priority || 'medium'];
                    })
                    .map(req => (
                    <tr key={req._id} className="border-b border-color border-opacity-50 hover:bg-primary hover:bg-opacity-5 transition-colors">
                      <td className="p-5 font-semibold text-primary">{req.workflowId?.title || 'Unknown Workflow'}</td>
                      <td className="p-5">
                        <Badge variant={
                          req.priority === 'high' ? 'error' : 
                          req.priority === 'medium' ? 'warning' : 'neutral'
                        }>
                          {req.priority || 'medium'}
                        </Badge>
                      </td>
                      <td className="p-5 text-sm text-muted">{new Date(req.createdAt).toLocaleDateString()}</td>
                      <td className="p-5 text-sm text-muted font-medium bg-secondary bg-opacity-50 rounded inline-block mt-3">{req.currentStepId?.name || 'End'}</td>
                      <td className="p-5">
                        <Badge variant={
                          req.status === 'completed' ? 'success' : 
                          ['failed', 'canceled'].includes(req.status) ? 'error' : 'warning'
                        }>
                          {req.status.replace(/_/g, ' ')}
                        </Badge>
                      </td>
                      <td className="p-5 text-right">
                        <button 
                          className="bg-secondary text-primary-text hover:bg-primary border border-color hover:text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 inline-flex ml-auto shadow-sm"
                          onClick={() => navigate('/user/execution')}
                        >
                          Track Flow <ArrowRight size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
