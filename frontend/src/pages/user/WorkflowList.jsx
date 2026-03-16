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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((workflow, index) => (
            <motion.div
              key={workflow._id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="h-full flex-col hover:-translate-y-1 transition-transform duration-300">
                <CardContent className="p-6 flex-col flex-1">
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-12 h-12 rounded-lg bg-primary bg-opacity-10 text-primary flex center">
                      <Settings2 size={24} />
                    </div>
                    {adminMode && (
                      <Badge variant={workflow.status === 'published' ? 'success' : 'warning'}>
                        {workflow.status} v{workflow.version}
                      </Badge>
                    )}
                  </div>
                  
                  <h3 className="text-h4 mb-2">{workflow.title}</h3>
                  <p className="text-sm text-muted mb-6 flex-1 line-clamp-3">
                    {workflow.description}
                  </p>
                  
                  <div className="mt-auto border-t border-color pt-4 flex gap-3">
                    {adminMode ? (
                      <>
                        <Button 
                          variant="outline" 
                          icon={<Edit3 size={16} />} 
                          className="flex-1 justify-center"
                          onClick={() => navigate(`/admin/editor/${workflow._id}`)}
                        >
                          Edit
                        </Button>
                        <Button 
                          variant="danger-outline" 
                          icon={<Trash2 size={16} />} 
                          title="Delete"
                          onClick={() => handleDelete(workflow._id)}
                        />
                      </>
                    ) : (
                      <Button 
                        variant="primary" 
                        icon={<Play size={16} />} 
                        className="w-full justify-center"
                        onClick={() => navigate(`/user/workflows/${workflow._id}/start`)}
                      >
                        Start Request
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
