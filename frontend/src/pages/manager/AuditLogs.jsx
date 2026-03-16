import React, { useState, useEffect } from 'react';
import { ShieldCheck, Search, Filter, Loader2, ArrowRight } from 'lucide-react';
import { Card, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../../api/client';

export function AuditLogs() {
  const [searchTerm, setSearchTerm] = useState('');
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      // In a real app we would have a dedicated /logs endpoint.
      // Here we will just fetch all recent executions to show an audit trail to managers.
      const res = await apiClient.get('/executions?limit=50');
      setLogs(res.data.executions || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter(log => 
    (log.workflowId?.title || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
    (log.requesterId?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    log._id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex-col w-full h-full max-w-7xl mx-auto p-4 md:p-8 animate-fade-in fade-in-up">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-h2 mb-2">Audit Logs</h1>
          <p className="text-muted">A read-only trail of all system workflow executions for compliance.</p>
        </div>
      </div>

      <div className="flex gap-4 mb-8">
        <div className="flex-1">
          <Input 
            icon={<Search size={18} />} 
            placeholder="Search by ID, Workflow, or User..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button variant="outline" icon={<Filter size={18} />}>Filter Date</Button>
      </div>

      <Card className="border-color">
        <div className="p-6 border-b border-color flex items-center gap-3">
           <ShieldCheck size={20} className="text-primary" />
           <h2 className="text-h4 font-semibold">System Executions</h2>
        </div>
        
        {loading ? (
          <div className="p-12 flex center"><Loader2 className="animate-spin text-muted" size={32} /></div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-12 text-center text-muted">No logs match your search.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-secondary border-b border-color text-sm text-muted">
                  <th className="p-4 font-semibold font-mono">Execution ID</th>
                  <th className="p-4 font-semibold">Workflow</th>
                  <th className="p-4 font-semibold">Requester</th>
                  <th className="p-4 font-semibold">Time</th>
                  <th className="p-4 font-semibold">Status</th>
                  <th className="p-4 font-semibold text-right">Details</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map(log => (
                  <tr key={log._id} className="border-b border-color last:border-b-0 hover:bg-tertiary transition-colors">
                    <td className="p-4 text-sm font-mono text-muted">{log._id}</td>
                    <td className="p-4 font-medium text-primary-text">{log.workflowId?.title || 'Unknown'}</td>
                    <td className="p-4 text-sm text-muted">{log.requesterId?.name || 'Unknown'}</td>
                    <td className="p-4 text-sm text-muted">{new Date(log.createdAt).toLocaleString()}</td>
                    <td className="p-4">
                      <Badge variant={
                        log.status === 'completed' ? 'success' : 
                        ['failed', 'canceled'].includes(log.status) ? 'error' : 
                        'warning'
                      }>
                        {log.status.replace(/_/g, ' ')}
                      </Badge>
                    </td>
                    <td className="p-4 text-right">
                       <button 
                         className="text-primary hover-text-primary-light font-medium text-sm flex items-center gap-1 inline-flex"
                         onClick={() => navigate(`/user/execution/${log._id}`)}
                       >
                         View Timeline
                       </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

// Inline mock Button/Badge for AuditLogs to avoid deep imports if not exported from components/ui
function Button({ children, variant="primary", className="", icon, onClick }) {
  const base = "inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed";
  const variants = {
    primary: "bg-primary text-white hover:bg-primary-dark shadow-sm border border-transparent",
    outline: "bg-transparent text-primary-text border border-color hover:border-primary hover:text-primary",
    ghost: "bg-transparent text-muted hover:text-primary-text hover:bg-secondary border border-transparent",
  };
  return (
    <button className={`${base} ${variants[variant]} ${className}`} onClick={onClick}>
      {icon} {children}
    </button>
  );
}
