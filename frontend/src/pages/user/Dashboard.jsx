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
    <div className="flex-col gap-6 p-4 md:p-8 max-w-7xl mx-auto w-full animate-fade-in fade-in-up">
      {/* Welcome Banner */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-primary-dark to-primary p-8 rounded-2xl text-white shadow-lg relative overflow-hidden"
      >
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
          <div>
            <h1 className="text-h2 font-bold mb-2">Welcome back, {user?.name || 'User'}!</h1>
            <p className="text-white text-opacity-80 max-w-lg text-lg">
              You have {stats.active} workflows currently being processed. Need something else? Start a new request from the library.
            </p>
          </div>
          <button 
            className="flex items-center gap-2 bg-white text-primary px-6 py-3 rounded-xl font-semibold hover:-translate-y-1 transition-transform shadow-md"
            onClick={() => navigate('/user/workflows')}
          >
            <FileText size={20} /> Browse Workflows
          </button>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="hover:-translate-y-1 transition-transform">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-warning bg-opacity-20 flex center text-warning">
              <Clock size={28} />
            </div>
            <div>
              <p className="text-sm font-semibold text-muted uppercase tracking-wider">In Progress</p>
              <h3 className="text-h2 font-bold mt-1">{stats.active}</h3>
            </div>
          </CardContent>
        </Card>
        <Card className="hover:-translate-y-1 transition-transform">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-success bg-opacity-20 flex center text-success">
              <CheckCircle2 size={28} />
            </div>
            <div>
              <p className="text-sm font-semibold text-muted uppercase tracking-wider">Completed</p>
              <h3 className="text-h2 font-bold mt-1">{stats.completed}</h3>
            </div>
          </CardContent>
        </Card>
        <Card className="hover:-translate-y-1 transition-transform">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-error bg-opacity-20 flex center text-error">
              <AlertCircle size={28} />
            </div>
            <div>
              <p className="text-sm font-semibold text-muted uppercase tracking-wider">Failed / Canceled</p>
              <h3 className="text-h2 font-bold mt-1">{stats.failed}</h3>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity Table */}
      <div className="mt-4">
        <h2 className="text-h3 font-semibold mb-4 flex items-center gap-2">
          <Activity size={20} className="text-primary" /> Recent Requests
        </h2>
        
        {recentRequests.length === 0 ? (
          <div className="bg-secondary p-8 rounded-xl text-center text-muted border border-color border-dashed">
            <p>You haven't submitted any requests yet.</p>
          </div>
        ) : (
          <div className="bg-secondary rounded-xl border border-color overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-tertiary border-b border-color text-sm text-muted">
                  <th className="p-4 font-semibold">Workflow</th>
                  <th className="p-4 font-semibold">Submitted</th>
                  <th className="p-4 font-semibold">Current Step</th>
                  <th className="p-4 font-semibold">Status</th>
                  <th className="p-4 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {recentRequests.map(req => (
                  <tr key={req._id} className="border-b border-color hover:bg-tertiary transition-colors">
                    <td className="p-4 font-medium text-primary-text">{req.workflowId?.title || 'Unknown Workflow'}</td>
                    <td className="p-4 text-sm text-muted">{new Date(req.createdAt).toLocaleDateString()}</td>
                    <td className="p-4 text-sm text-muted">{req.currentStepId?.name || 'End'}</td>
                    <td className="p-4">
                      <Badge variant={
                        req.status === 'completed' ? 'success' : 
                        ['failed', 'canceled'].includes(req.status) ? 'error' : 'warning'
                      }>
                        {req.status.replace(/_/g, ' ')}
                      </Badge>
                    </td>
                    <td className="p-4 text-right">
                      <button 
                        className="text-primary hover-text-primary-light font-medium text-sm flex items-center gap-1 inline-flex"
                        onClick={() => navigate('/user/execution')}
                      >
                        Track <ArrowRight size={14} />
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
  );
}
