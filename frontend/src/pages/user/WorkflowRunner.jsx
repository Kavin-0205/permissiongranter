import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Play, Loader2, Sparkles } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { apiClient } from '../../api/client';

export function WorkflowRunner() {
  const { workflowId } = useParams();
  const [workflow, setWorkflow] = useState(null);
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchWorkflowDetails();
  }, [workflowId]);

  const fetchWorkflowDetails = async () => {
    try {
      const res = await apiClient.get(`/workflows/${workflowId}`);
      setWorkflow(res.data);
      
      // Auto-generate initial form state from explicit inputSchema or default fields
      const schema = res.data.inputSchema || {};
      const initialData = {};
      Object.keys(schema).forEach(key => initialData[key] = '');
      
      // If schema is completely empty, provide some default mock fields for the demo 
      if (Object.keys(schema).length === 0) {
        initialData.amount = '';
        initialData.department = '';
        initialData.reason = '';
      }
      
      setFormData({ ...initialData, priority: 'medium' });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      // payload parsed as numbers where applicable for mathjs evaluation
      const parsedPayload = { ...formData };
      if (parsedPayload.amount) parsedPayload.amount = parseFloat(parsedPayload.amount);

      await apiClient.post(`/executions/${workflowId}`, { payload: parsedPayload });
      navigate('/user/execution'); // Jump to tracking timeline
    } catch (err) {
      console.error(err);
      alert('Failed to start workflow execution.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="p-8"><Loader2 className="animate-spin" /></div>;
  if (!workflow) return <div className="p-8 text-error">Workflow not found</div>;

  return (
    <div className="flex-col max-w-3xl mx-auto p-4 md:p-8 animate-fade-in fade-in-up">
      <button 
        className="flex items-center gap-2 text-muted hover-text-primary mb-6 transition-colors"
        onClick={() => navigate('/user/workflows')}
      >
        <ArrowLeft size={16} /> Back to Library
      </button>

      <div className="bg-secondary rounded-2xl shadow-xl border border-color overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary-dark to-primary p-8 text-white">
          <div className="flex items-center gap-3 mb-3">
             <div className="w-10 h-10 rounded-lg bg-white bg-opacity-20 flex center">
               <Sparkles size={20} />
             </div>
             <h1 className="text-h2 font-bold m-0">{workflow.title}</h1>
          </div>
          <p className="text-white text-opacity-80 text-lg ml-13">
            {workflow.description || 'Fill out the dynamic schema details below to trigger this workflow sequence.'}
          </p>
        </div>

        {/* Dynamic Form */}
        <form onSubmit={handleSubmit} className="p-8 flex-col gap-6">
          <div className="flex justify-between items-center border-b border-color pb-2 mb-2">
            <h3 className="text-lg font-semibold">Request Details</h3>
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-muted uppercase">Priority:</span>
              <div className="flex bg-tertiary p-1 rounded-lg border border-color">
                {['low', 'medium', 'high'].map(p => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setFormData({ ...formData, priority: p })}
                    className={`px-3 py-1 rounded-md text-[10px] font-bold uppercase transition-all ${
                      formData.priority === p 
                        ? (p === 'high' ? 'bg-error text-white' : p === 'medium' ? 'bg-warning text-white' : 'bg-primary text-white')
                        : 'text-muted hover:text-primary-text'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          </div>
          
          {Object.keys(formData).filter(k => k !== 'priority').map((key) => (
            <div key={key} className="flex-col gap-2">
              <label className="text-sm font-medium text-muted capitalize">
                {key.replace(/([A-Z])/g, ' $1').trim()}
              </label>
              {key.toLowerCase() === 'reason' || key.toLowerCase() === 'description' ? (
                 <textarea 
                   className="form-input bg-tertiary border border-color rounded p-3 w-full focus:outline-none focus:border-primary min-h-[100px]"
                   placeholder={`Enter ${key}...`}
                   value={formData[key]}
                   onChange={(e) => setFormData({...formData, [key]: e.target.value})}
                   required
                 />
              ) : (
                <Input 
                  type={key.toLowerCase() === 'amount' ? 'number' : 'text'}
                  placeholder={`Enter ${key}...`}
                  value={formData[key]}
                  onChange={(e) => setFormData({...formData, [key]: e.target.value})}
                  required
                />
              )}
            </div>
          ))}

          <div className="pt-6 border-t border-color flex justify-end gap-4">
            <Button variant="ghost" onClick={() => navigate('/user/workflows')}>Cancel</Button>
            <Button type="submit" variant="primary" icon={submitting ? <Loader2 size={18} className="animate-spin" /> : <Play size={18} />} disabled={submitting}>
              {submitting ? 'Initiating...' : 'Start Execution Request'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
