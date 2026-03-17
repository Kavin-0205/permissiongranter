import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Filter, Plus, FileText, Settings2, Play, Loader2, Edit3, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { Card, CardContent } from '../../components/ui/Card';
import { apiClient } from '../../api/client';

export function WorkflowList({ adminMode = false }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [workflows, setWorkflows] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchWorkflows();
  }, [adminMode]);

  const fetchWorkflows = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/workflows');
      let data = res.data.workflows || [];
      // users can't see drafts
      if (!adminMode) {
        data = data.filter(w => w.status === 'published');
      }
      setWorkflows(data);
    } catch (err) {
      console.error('Failed to fetch workflows', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if(!window.confirm('Are you sure you want to delete this workflow? Executions will be preserved.')) return;
    try {
      await apiClient.delete(`/workflows/${id}`);
      fetchWorkflows();
    } catch(err) {
      console.error(err);
    }
  }

  const filteredItems = workflows.filter(w => 
    w.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (w.description && w.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="flex-col w-full h-full max-w-7xl mx-auto p-4 md:p-8 animate-fade-in fade-in-up">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-h2 mb-2">{adminMode ? 'Workflow Library' : 'Available Workflows'}</h1>
          <p className="text-muted">
            {adminMode 
              ? 'Manage, build, and publish enterprise workflows.' 
              : 'Select a process to start a new automated request.'}
          </p>
        </div>
        {adminMode && (
          <Button variant="primary" icon={<Plus size={18} />} onClick={() => navigate('/admin/editor')}>
            Create Workflow
          </Button>
        )}
      </div>

      <div className="flex gap-4 mb-8">
        <div className="flex-1">
          <Input 
            icon={<Search size={18} />} 
            placeholder="Search workflows by name or description..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button 
          variant="outline" 
          icon={<Filter size={18} />}
          onClick={() => alert('Search-based filtering is active. Status filters coming soon!')}
        >
          Filter
        </Button>
      </div>

      {loading ? (
        <div className="flex center p-12 text-muted">
          <Loader2 className="animate-spin mr-2" /> Loading workflows...
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="flex-col center p-12 text-muted border border-dashed border-color rounded-xl">
          <FileText size={48} className="mb-4 opacity-20" />
          <p>No workflows found.</p>
        </div>
      ) : (
        <div className="bg-secondary rounded-xl border border-color overflow-hidden shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-tertiary border-b border-color">
                <th className="p-4 text-xs font-bold uppercase text-muted tracking-wider">ID</th>
                <th className="p-4 text-xs font-bold uppercase text-muted tracking-wider">Name</th>
                <th className="p-4 text-xs font-bold uppercase text-muted tracking-wider text-center">Steps</th>
                <th className="p-4 text-xs font-bold uppercase text-muted tracking-wider text-center">Version</th>
                <th className="p-4 text-xs font-bold uppercase text-muted tracking-wider">Status</th>
                <th className="p-4 text-xs font-bold uppercase text-muted tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((workflow, index) => (
                <motion.tr 
                  key={workflow._id}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className="border-b border-color hover:bg-tertiary transition-colors"
                >
                  <td className="p-4">
                    <code className="text-[10px] text-muted bg-tertiary px-1 py-0.5 rounded">{workflow._id.substring(workflow._id.length - 8)}</code>
                  </td>
                  <td className="p-4">
                    <div className="flex-col">
                      <span className="font-semibold text-primary-text">{workflow.title || workflow.name}</span>
                      {workflow.description && <span className="text-xs text-muted line-clamp-1 max-w-xs">{workflow.description}</span>}
                    </div>
                  </td>
                  <td className="p-4 text-center">
                    <Badge variant="neutral">{workflow.steps?.length || 0}</Badge>
                  </td>
                  <td className="p-4 text-center">
                    <span className="text-sm font-medium">v{workflow.version}</span>
                  </td>
                  <td className="p-4">
                    <Badge variant={workflow.status === 'published' ? 'success' : 'warning'}>
                      {workflow.status.toUpperCase()}
                    </Badge>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-2">
                      {adminMode ? (
                        <>
                          <Button 
                            variant="secondary" 
                            size="sm"
                            icon={<Edit3 size={14} />} 
                            onClick={() => navigate(`/admin/editor/${workflow._id}`)}
                          >
                            Edit
                          </Button>
                          <Button 
                            variant="danger-outline" 
                            size="sm"
                            icon={<Trash2 size={14} />} 
                            onClick={() => handleDelete(workflow._id)}
                          />
                        </>
                      ) : (
                        <Button 
                          variant="primary" 
                          size="sm"
                          icon={<Play size={14} />} 
                          onClick={() => navigate(`/user/workflows/${workflow._id}/start`)}
                        >
                          Execute
                        </Button>
                      )}
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
