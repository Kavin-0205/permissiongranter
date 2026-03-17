import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, BarChart3, Clock, CheckCircle2, Loader2, ListTodo } from 'lucide-react';
import { Card, CardContent, CardHeader } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../../api/client';

export function ManagerDashboard() {
  const [stats, setStats] = useState({ pendingApprovals: 0, systemHealth: 100, avgTime: 0 });
  const [recentApprovals, setRecentApprovals] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [analyticsRes, executionsRes] = await Promise.all([
        apiClient.get('/analytics'),
        apiClient.get('/executions?status=waiting_for_approval&limit=5')
      ]);
      
      setStats({
        pendingApprovals: analyticsRes.data.pendingApprovals || 0,
        systemHealth: analyticsRes.data.systemHealth || 100,
        avgTime: Math.round((analyticsRes.data.avgCompletionTimeMs || 0) / 1000 / 60) // in minutes
      });
      
      setRecentApprovals(executionsRes.data.executions || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-8"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="flex-col gap-6 p-4 md:p-8 max-w-7xl mx-auto w-full animate-fade-in fade-in-up">
      <div className="flex justify-between items-center mb-2">
         <div>
            <h1 className="text-h2 mb-2">Manager Overview</h1>
            <p className="text-muted">Monitor team workflows and pending approvals.</p>
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="hover:-translate-y-1 transition-transform border-t-4 border-t-warning">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-warning bg-opacity-20 flex center text-warning">
              <ListTodo size={28} />
            </div>
            <div>
              <p className="text-sm font-semibold text-muted uppercase tracking-wider">Pending Approvals</p>
              <h3 className="text-h2 font-bold mt-1">{stats.pendingApprovals}</h3>
            </div>
          </CardContent>
        </Card>
        <Card className="hover:-translate-y-1 transition-transform border-t-4 border-t-success">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-success bg-opacity-20 flex center text-success">
              <ShieldCheck size={28} />
            </div>
            <div>
              <p className="text-sm font-semibold text-muted uppercase tracking-wider">System Health</p>
              <h3 className="text-h2 font-bold mt-1">{stats.systemHealth}%</h3>
            </div>
          </CardContent>
        </Card>
        <Card className="hover:-translate-y-1 transition-transform border-t-4 border-t-primary">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-primary bg-opacity-20 flex center text-primary">
              <Clock size={28} />
            </div>
            <div>
              <p className="text-sm font-semibold text-muted uppercase tracking-wider">Avg Completion</p>
              <h3 className="text-h2 font-bold mt-1">{stats.avgTime} mins</h3>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8 bg-secondary rounded-xl border border-color overflow-hidden">
        <div className="p-6 border-b border-color flex justify-between items-center">
          <h2 className="text-h3 font-semibold">Priority Requires Action</h2>
          <button 
            className="text-primary text-sm font-medium hover-text-primary-light"
            onClick={() => navigate('/manager/approvals')}
          >
            View All Approvals
          </button>
        </div>
        
        {recentApprovals.length === 0 ? (
          <div className="p-8 text-center text-muted">No pending approvals at this time.</div>
        ) : (
          <div className="flex-col">
             {recentApprovals
               .sort((a, b) => {
                 const priorityOrder = { 'high': 3, 'medium': 2, 'low': 1 };
                 const priorityA = priorityOrder[a.priority] || 2; // Default to medium if not specified
                 const priorityB = priorityOrder[b.priority] || 2; // Default to medium if not specified
                 return priorityB - priorityA; // Descending order (High first)
               })
               .map((req, idx) => (
               <div key={req._id} className={`p-4 md:p-6 flex justify-between items-center hover:bg-tertiary transition-colors ${idx !== recentApprovals.length - 1 ? 'border-b border-color' : ''}`}>
                 <div>
                   <div className="flex items-center gap-3 mb-1">
                     <span className="font-semibold text-primary-text">{req.workflowId?.title || 'Unknown'}</span>
                     <Badge variant={
                       req.priority === 'high' ? 'error' : 
                       req.priority === 'medium' ? 'warning' : 'neutral'
                     }>
                       {req.priority || 'medium'}
                     </Badge>
                     <Badge variant="warning">Awaiting Approval</Badge>
                   </div>
                   <p className="text-sm text-muted">
                     Requested by <span className="text-primary-text">{req.requesterId?.name}</span> • {new Date(req.createdAt).toLocaleDateString()}
                   </p>
                 </div>
                 <button 
                    className="bg-primary text-white px-4 py-2 rounded-lg font-medium hover:bg-primary-dark transition-colors"
                    onClick={() => navigate('/manager/approvals')}
                 >
                   Review
                 </button>
               </div>
             ))}
          </div>
        )}
      </div>
    </div>
  );
}
