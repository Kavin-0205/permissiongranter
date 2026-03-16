import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, Search, Filter, AlertTriangle, Loader2 } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { apiClient } from '../../api/client';

export function ApprovalDashboard() {
  const [searchTerm, setSearchTerm] = useState('');
  const [approvals, setApprovals] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [processingId, setProcessingId] = useState(null);
  const [comment, setComment] = useState('');
  const [activeModalId, setActiveModalId] = useState(null);
  const [decisionType, setDecisionType] = useState(null); // 'approved' or 'rejected'

  useEffect(() => {
    fetchApprovals();
  }, []);

  const fetchApprovals = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/executions?status=paused_for_approval');
      setApprovals(res.data.executions || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const submitDecision = async () => {
    if (!activeModalId || !decisionType) return;
    setProcessingId(activeModalId);
    try {
      await apiClient.post(`/executions/${activeModalId}/resume`, {
        decision: decisionType,
        comment: comment || `Manager ${decisionType} the request.`
      });
      // Remove from list
      setApprovals(approvals.filter(a => a._id !== activeModalId));
    } catch (err) {
      console.error(err);
      alert('Failed to process approval');
    } finally {
      setProcessingId(null);
      setActiveModalId(null);
      setComment('');
      setDecisionType(null);
    }
  };

  const filteredApprovals = approvals.filter(req => 
    (req.workflowId?.title || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
    (req.requesterId?.name || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex-col w-full h-full max-w-7xl mx-auto p-4 md:p-8 animate-fade-in fade-in-up">
      <div className="mb-8">
        <h1 className="text-h2 mb-2">Pending Approvals</h1>
        <p className="text-muted">Review and authorize workflow requests requiring manager intervention.</p>
      </div>

      <div className="flex gap-4 mb-8">
        <div className="flex-1">
          <Input 
            icon={<Search size={18} />} 
            placeholder="Search by workflow or requester name..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button variant="outline" icon={<Filter size={18} />}>Filter</Button>
      </div>

      {loading ? (
        <div className="p-12 flex center"><Loader2 className="animate-spin text-muted" size={32} /></div>
      ) : filteredApprovals.length === 0 ? (
        <div className="flex-col center p-12 text-muted border border-dashed border-color rounded-xl">
          <CheckCircle2 size={48} className="mb-4 opacity-20" />
          <h3 className="text-h4 mb-1">You're all caught up!</h3>
          <p>No pending approvals in your queue.</p>
        </div>
      ) : (
        <div className="flex-col gap-4">
          <AnimatePresence>
            {filteredApprovals.map((req) => (
              <motion.div
                key={req._id}
                initial={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95, height: 0 }}
                className="bg-secondary border border-color p-5 rounded-xl flex-col md:flex-row gap-5"
              >
                {/* Request Info */}
                <div className="flex-col gap-3 flex-1">
                  <div className="flex items-center gap-3">
                    <Badge variant="warning">Approval Required</Badge>
                    <span className="text-sm font-mono text-muted">ID: {req._id.slice(-6)}</span>
                  </div>
                  
                  <div>
                    <h3 className="text-h3 font-semibold text-primary-text">{req.workflowId?.title}</h3>
                    <p className="text-sm text-muted mt-1">
                      Submitted by <span className="font-medium text-primary-text">{req.requesterId?.name}</span> • {new Date(req.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  
                  {/* JSON Payload Data representation */}
                  <div className="mt-3 bg-tertiary p-3 rounded-md border border-color text-sm">
                    <h4 className="font-semibold text-muted mb-2 text-xs uppercase tracking-wider">Payload Details</h4>
                    <div className="grid grid-cols-2 gap-2">
                       {req.payloadData ? Object.entries(req.payloadData).map(([k, v]) => (
                         <div key={k} className="flex flex-col">
                           <span className="text-xs text-muted capitalize">{k}</span>
                           <span className="font-medium text-primary-text">{String(v)}</span>
                         </div>
                       )) : <span className="text-muted">No payload data</span>}
                    </div>
                  </div>
                </div>
                
                {/* Actions */}
                <div className="flex md:flex-col gap-3 md:w-48 justify-center">
                  {processingId === req._id ? (
                     <div className="flex center p-4 w-full h-full text-primary"><Loader2 className="animate-spin" /></div>
                  ) : activeModalId === req._id ? (
                     <div className="flex-col gap-2 w-full animate-fade-in fade-in-up">
                        <textarea 
                          className="w-full bg-tertiary border border-color rounded p-2 text-sm focus:outline-none focus:border-primary"
                          placeholder="Optional comment..."
                          value={comment}
                          onChange={(e) => setComment(e.target.value)}
                        />
                        <div className="flex gap-2">
                           <Button variant="ghost" size="sm" className="flex-1 justify-center" onClick={() => {setActiveModalId(null); setDecisionType(null)}}>Cancel</Button>
                           <Button 
                             variant={decisionType === 'approved' ? 'success' : 'danger-outline'} 
                             size="sm" 
                             className="flex-1 justify-center"
                             onClick={submitDecision}
                           >
                              Confirm
                           </Button>
                        </div>
                     </div>
                  ) : (
                    <>
                      <Button 
                        variant="success" 
                        icon={<CheckCircle2 size={16} />} 
                        className="w-full justify-center"
                        onClick={() => { setActiveModalId(req._id); setDecisionType('approved'); }}
                      >
                        Approve
                      </Button>
                      <Button 
                        variant="danger-outline" 
                        icon={<XCircle size={16} />} 
                        className="w-full justify-center"
                        onClick={() => { setActiveModalId(req._id); setDecisionType('rejected'); }}
                      >
                        Reject
                      </Button>
                    </>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
