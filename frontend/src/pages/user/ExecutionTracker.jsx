import React, { useState, useEffect } from 'react';
import { CheckCircle2, CircleDashed, Clock, AlertCircle, ChevronRight, Play, Loader2, RefreshCw } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { apiClient } from '../../api/client';

export function ExecutionTracker() {
  const { id } = useParams();
  const [executions, setExecutions] = useState([]);
  const [activeExecution, setActiveExecution] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchExecutions();
  }, [id]);

  const fetchExecutions = async () => {
    try {
      setLoading(true);
      if (id) {
        await fetchExecutionDetails(id);
      } else {
        const res = await apiClient.get('/executions?limit=50');
        setExecutions(res.data.executions || []);
        if (res.data.executions?.length > 0) {
          await fetchExecutionDetails(res.data.executions[0]._id);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchExecutionDetails = async (executionId) => {
    setRefreshing(true);
    try {
      const res = await apiClient.get(`/executions/${executionId}`);
      setActiveExecution(res.data.execution);
      setLogs(res.data.logs || []);
      // if not in the list (direct navigation), add it or update url
      if (id !== executionId) {
        navigate(`/user/execution/${executionId}`, { replace: true });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setRefreshing(false);
    }
  };

  if (loading && !activeExecution) return <div className="p-8"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="flex w-full h-full p-4 md:p-8 gap-6 animate-fade-in fade-in-up">
      
      {/* Sidebar List */}
      <div className="w-1/3 flex-col gap-4 bg-secondary p-4 rounded-xl border border-color overflow-y-auto">
        <h3 className="font-semibold text-lg border-b border-color pb-4 mb-2">My Requests</h3>
        {executions.map(ex => (
          <div 
            key={ex._id}
            onClick={() => fetchExecutionDetails(ex._id)}
            className={`p-4 rounded-lg cursor-pointer transition-colors border ${
              activeExecution?._id === ex._id 
                ? 'border-primary bg-primary bg-opacity-10' 
                : 'border-transparent hover:bg-tertiary hover:border-color'
            }`}
          >
            <div className="flex justify-between items-start mb-2">
              <span className="font-medium text-primary-text">{ex.workflowId?.title || 'Unknown'}</span>
              <Badge variant={ex.status === 'completed' ? 'success' : ['failed', 'canceled'].includes(ex.status) ? 'error' : 'warning'}>
                {ex.status.replace(/_/g, ' ')}
              </Badge>
            </div>
            <div className="flex justify-between items-center mb-2">
               <Badge variant={
                 ex.priority === 'high' ? 'error' : 
                 ex.priority === 'medium' ? 'warning' : 'neutral'
               }>
                 {ex.priority || 'medium'}
               </Badge>
               <p className="text-xs text-muted">
                 Started: {new Date(ex.createdAt).toLocaleDateString()}
               </p>
            </div>
          </div>
        ))}
      </div>

      {/* Main Timeline View */}
      {activeExecution ? (
        <div className="flex-1 flex-col gap-6">
          <Card className="shadow-lg border-color overflow-hidden">
            <div className="bg-gradient-to-r from-secondary to-tertiary p-6 border-b border-color flex justify-between items-center">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h2 className="text-h2 font-bold m-0">{activeExecution.workflowId?.title}</h2>
                  <Badge variant={
                    activeExecution.priority === 'high' ? 'error' : 
                    activeExecution.priority === 'medium' ? 'warning' : 'neutral'
                  }>
                    {activeExecution.priority || 'medium'}
                  </Badge>
                </div>
                <p className="text-sm text-muted">ID: {activeExecution._id}</p>
              </div>
              <div className="flex items-center gap-4">
                <Button variant="outline" size="sm" onClick={() => fetchExecutionDetails(activeExecution._id)} disabled={refreshing}>
                  <RefreshCw size={16} className={refreshing ? "animate-spin mr-2" : "mr-2"} /> Refresh
                </Button>
                {activeExecution.status === 'failed' && (
                  <Button 
                    variant="primary" 
                    size="sm" 
                    onClick={async () => {
                      if (!window.confirm('Attempt to resume execution from last point?')) return;
                      try {
                        await apiClient.put(`/executions/${activeExecution._id}/retry`);
                        fetchExecutionDetails(activeExecution._id);
                      } catch (err) {
                        alert('Retry failed: ' + (err.response?.data?.message || err.message));
                      }
                    }}
                  >
                    <RefreshCw size={16} className="mr-2" /> Retry
                  </Button>
                )}
                <div className="text-right">
                  <span className="text-xs text-muted block mb-1">Current Status</span>
                  <Badge variant={activeExecution.status === 'completed' ? 'success' : 'warning'}>
                     {activeExecution.status.toUpperCase().replace(/_/g, ' ')}
                  </Badge>
                </div>
              </div>
            </div>
            
            <CardContent className="p-8">
              <h3 className="font-semibold text-lg mb-6 flex items-center gap-2 border-b border-color pb-2">
                <Play size={18} className="text-primary" /> Execution Timeline
              </h3>
              
              <div className="relative border-l-2 border-color ml-4 pl-8 py-2 flex-col gap-8">
                {logs.map((log, index) => {
                  const isError = log.action.toLowerCase().includes('error') || log.errorReason;
                  const isWait = log.action.toLowerCase().includes('pause');
                  const isSuccess = log.action.toLowerCase().includes('completed') || log.action.toLowerCase().includes('approved');
                  
                  let Icon = ChevronRight;
                  let colorClass = 'bg-secondary text-muted border-color';
                  
                  if (isError) { Icon = AlertCircle; colorClass = 'bg-error bg-opacity-20 text-error border-error'; }
                  else if (isWait) { Icon = Clock; colorClass = 'bg-warning bg-opacity-20 text-warning border-warning'; }
                  else if (isSuccess) { Icon = CheckCircle2; colorClass = 'bg-success bg-opacity-20 text-success border-success'; }

                  return (
                    <div key={log._id} className="relative">
                      {/* Timeline Dot */}
                      <div className={`absolute -left-[45px] top-1 w-8 h-8 rounded-full border-2 flex center shadow-sm bg-secondary ${colorClass}`}>
                        <Icon size={16} />
                      </div>
                      
                      <div className="bg-tertiary p-4 rounded-lg border border-color">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-semibold text-primary-text">{log.stepId?.name || log.action}</h4>
                          <span className="text-xs font-mono text-muted bg-secondary px-2 py-1 flex items-center gap-1 rounded border border-color">
                            <Clock size={12} />
                            {new Date(log.createdAt).toLocaleTimeString()}
                          </span>
                        </div>
                        <p className="text-sm text-muted">{log.details}</p>
                        {log.errorReason && (
                          <p className="text-sm text-error mt-2 font-mono bg-error bg-opacity-10 p-2 rounded">
                            {log.errorReason}
                          </p>
                        )}
                        {log.durationMs !== undefined && (
                          <p className="text-xs text-muted mt-3 pt-3 border-t border-color opacity-70">
                            Duration: {log.durationMs}ms
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
                
                {activeExecution.status === 'running' && (
                  <div className="relative opacity-60">
                     <div className="absolute -left-[45px] top-1 w-8 h-8 rounded-full border-2 border-dashed border-primary flex center bg-secondary text-primary animate-pulse">
                        <CircleDashed size={16} className="animate-spin" />
                     </div>
                     <div className="p-4">
                       <h4 className="font-semibold text-primary-text italic">Processing Next Rules...</h4>
                     </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="flex-1 flex center bg-secondary border border-color border-dashed rounded-xl">
           <p className="text-muted">Select a request to view its timeline.</p>
        </div>
      )}
    </div>
  );
}
