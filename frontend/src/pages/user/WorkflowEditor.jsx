import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { GripVertical, Bell, Webhook, CheckSquare, Settings2, Plus, Save, Play, X, Loader2, Code } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { apiClient } from '../../api/client';
import './WorkflowEditor.css';

const stepTypes = {
  trigger: { icon: Webhook, color: 'text-primary', bg: 'bg-primary', label: 'Trigger Event' },
  task: { icon: Settings2, color: 'text-secondary', bg: 'bg-secondary', label: 'Action Task' },
  approval: { icon: CheckSquare, color: 'text-warning', bg: 'bg-warning', label: 'Approval Pause' },
  notification: { icon: Bell, color: 'text-success', bg: 'bg-success', label: 'Notification' }
};

export function WorkflowEditor() {
  const { id } = useParams(); // If present, we are editing
  const [workflow, setWorkflow] = useState({ title: 'New Workflow', description: '', status: 'draft' });
  const [steps, setSteps] = useState([]);
  const [rules, setRules] = useState({}); // stepId -> array of rules
  
  const [isRuleModalOpen, setIsRuleModalOpen] = useState(false);
  const [activeStepId, setActiveStepId] = useState(null);
  const [activeStepRules, setActiveStepRules] = useState([]);
  
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(id ? true : false);
  const navigate = useNavigate();

  useEffect(() => {
    if (id) {
      fetchWorkflow();
    } else {
      // Default trigger step
      const stepId = `new_step_${Date.now()}`;
      setSteps([{ _id: stepId, name: 'Form Submission', type: 'trigger', config: {} }]);
      setRules({ [stepId]: [{ conditionExpression: 'DEFAULT', priority: 0, isFallback: true }] });
    }
  }, [id]);

  const fetchWorkflow = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get(`/workflows/${id}`);
      setWorkflow(res.data);
      if (res.data.steps) {
         setSteps(res.data.steps);
         // Simulate loading rules for each step (requires API support, mocking for now if not present)
         const rulesMap = {};
         res.data.steps.forEach(s => rulesMap[s._id] = [{ conditionExpression: 'DEFAULT', priority: 0, isFallback: true }]);
         setRules(rulesMap);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        title: workflow.title,
        description: workflow.description,
        status: 'draft',
        steps: steps.map(s => ({
          ...s,
          rules: rules[s._id] || []
        }))
      };

      if (id) {
        await apiClient.put(`/workflows/${id}`, payload);
      } else {
        await apiClient.post('/workflows', payload);
      }
      navigate('/admin/workflows');
    } catch (err) {
      console.error('Save failed', err);
      alert('Save failed: ' + (err.response?.data?.message || err.message));
    } finally {
      setSaving(false);
    }
  };

  const addStep = (type) => {
    const stepId = `new_step_${Date.now()}`;
    const newStep = { _id: stepId, name: `New ${type}`, type, config: {} };
    setSteps([...steps, newStep]);
    setRules({ ...rules, [stepId]: [{ conditionExpression: 'DEFAULT', priority: 0, isFallback: true }] });
  };

  const removeStep = (stepId) => {
    setSteps(steps.filter(s => s._id !== stepId));
    const newRules = { ...rules };
    delete newRules[stepId];
    setRules(newRules);
  };

  const handleDragEnd = (result) => {
    if (!result.destination) return;
    const items = Array.from(steps);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    setSteps(items);
  };

  const openRuleEditor = (stepId) => {
    setActiveStepId(stepId);
    setActiveStepRules([...(rules[stepId] || [])]);
    setIsRuleModalOpen(true);
  };

  const saveRulesToState = () => {
    setRules({ ...rules, [activeStepId]: activeStepRules });
    setIsRuleModalOpen(false);
  };

  if (loading) return <div className="p-8"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="flex-col gap-6 h-full editor-layout">
      {/* Header */}
      <div className="flex justify-between items-center bg-secondary p-4 rounded-lg border border-color">
        <div className="flex-col gap-2">
          <input 
            type="text" 
            value={workflow.title}
            onChange={(e) => setWorkflow({...workflow, title: e.target.value})}
            className="bg-transparent border-b border-dashed border-color text-h3 font-semibold focus:outline-none focus:border-primary px-1"
          />
          <div className="flex items-center gap-3">
            <Badge variant={workflow.status === 'published' ? 'success' : 'neutral'}>{workflow.status || 'Draft'}</Badge>
            {workflow.version && <span className="text-xs text-muted">Version {workflow.version}</span>}
          </div>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" icon={<Play size={18} />}>Test Run</Button>
          <Button variant="primary" icon={saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />} onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save Workflow'}
          </Button>
        </div>
      </div>

      <div className="editor-workspace">
        {/* Left Sidebar - Available Nodes */}
        <div className="editor-palette bg-secondary rounded-lg border border-color p-4">
          <h4 className="text-sm font-semibold mb-4 text-muted uppercase">Add Step</h4>
          <div className="flex-col gap-3">
            {Object.entries(stepTypes).map(([type, template]) => {
              const Icon = template.icon;
              return (
                <div key={type} className="palette-item cursor-pointer hover:bg-tertiary transition-colors" onClick={() => addStep(type)}>
                  <div className={`p-2 rounded-md bg-opacity-20 ${template.color} ${template.bg}`}>
                    <Icon size={18} />
                  </div>
                  <span className="font-medium text-sm">{template.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Main Canvas - Drag & Drop */}
        <div className="editor-canvas flex-1 p-6 bg-tertiary rounded-lg border border-color overflow-y-auto">
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="workflow-steps">
              {(provided) => (
                <div className="steps-container" {...provided.droppableProps} ref={provided.innerRef}>
                  {steps.map((step, index) => {
                    const Template = stepTypes[step.type] || stepTypes.task;
                    const Icon = Template.icon;
                    return (
                      <Draggable key={step._id} draggableId={step._id} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className={`workflow-step-card ${snapshot.isDragging ? 'dragging' : ''}`}
                          >
                            <div className="step-drag-handle" {...provided.dragHandleProps}>
                              <GripVertical size={20} className="text-muted cursor-grab active:cursor-grabbing" />
                            </div>
                            
                            <div className="step-content flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <div className={`p-1.5 rounded-md text-white ${Template.bg}`}>
                                  <Icon size={16} />
                                </div>
                                <span className="text-xs font-semibold uppercase tracking-wider text-muted">
                                  {Template.label}
                                </span>
                              </div>
                              <input 
                                className="font-semibold text-primary-text bg-transparent border-0 focus:ring-1 focus:ring-primary rounded px-1 w-full"
                                value={step.name}
                                onChange={(e) => {
                                  const newSteps = [...steps];
                                  newSteps[index].name = e.target.value;
                                  setSteps(newSteps);
                                }}
                              />
                            </div>

                            <div className="step-actions pl-4">
                              <Button variant="secondary" size="sm" onClick={() => openRuleEditor(step._id)}>
                                <Code size={14} className="mr-1" /> Rules ({rules[step._id]?.length || 0})
                              </Button>
                              <button className="icon-btn text-muted hover-text-error border-0 bg-transparent p-2 cursor-pointer transition-colors" onClick={() => removeStep(step._id)}>
                                <X size={18} />
                              </button>
                            </div>
                            
                            {index < steps.length - 1 && <div className="step-connector"></div>}
                          </div>
                        )}
                      </Draggable>
                    )
                  })}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        </div>
      </div>

      {/* Rule Editor Sandbox Modal */}
      <Modal 
        isOpen={isRuleModalOpen} 
        onClose={() => setIsRuleModalOpen(false)}
        title="Rule Engine Sandbox"
        footer={
          <>
            <Button variant="ghost" onClick={() => setIsRuleModalOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={saveRulesToState}>Save Evaluators</Button>
          </>
        }
      >
        <div className="flex-col gap-4 max-h-[60vh] overflow-y-auto p-1">
          <div className="bg-primary bg-opacity-10 border border-primary p-3 rounded-md mb-2">
            <h4 className="text-sm font-semibold text-primary flex items-center gap-2 mb-1">
              <Code size={16} /> Dynamic Evaluation Syntax
            </h4>
            <p className="text-xs text-muted">
              Write logical rules using Javascript syntax that evaluate against the payload (e.g. <code>amount &gt; 1000 && department == 'Sales'</code>). The engine uses Priority order (lowest number first).
            </p>
          </div>

          {activeStepRules.map((rule, idx) => (
            <div key={idx} className="bg-tertiary p-4 rounded-md border border-color flex-col gap-3 relative group">
              <button 
                onClick={() => setActiveStepRules(activeStepRules.filter((_, i) => i !== idx))}
                className="absolute top-2 right-2 text-muted hover-text-error opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X size={16} />
              </button>
              
              <div className="flex justify-between items-center">
                <Badge variant={rule.isFallback ? 'warning' : 'primary'}>
                  {rule.isFallback ? 'Fallback / Default' : `Priority: ${rule.priority}`}
                </Badge>
              </div>
              
              <div className="flex-col gap-2">
                <label className="text-xs text-muted font-medium">Condition Expression</label>
                <input 
                  type="text" 
                  className="form-input font-mono text-sm p-2 bg-secondary border border-color rounded w-full focus:outline-none focus:border-primary"
                  value={rule.conditionExpression}
                  onChange={(e) => {
                    const arr = [...activeStepRules];
                    arr[idx].conditionExpression = e.target.value;
                    setActiveStepRules(arr);
                  }}
                  disabled={rule.isFallback}
                />
              </div>

              <div className="flex gap-4">
                <div className="flex-1 flex-col gap-2">
                  <label className="text-xs text-muted font-medium">Next Step ID Target</label>
                  <select 
                    className="form-select text-sm p-2 bg-secondary border border-color rounded w-full focus:outline-none focus:border-primary"
                    value={rule.nextStepId || ''}
                    onChange={(e) => {
                      const arr = [...activeStepRules];
                      arr[idx].nextStepId = e.target.value;
                      setActiveStepRules(arr);
                    }}
                  >
                    <option value="">-- End Workflow --</option>
                    {steps.filter(s => s._id !== activeStepId).map(s => (
                      <option key={s._id} value={s._id}>{s.name} ({s.type})</option>
                    ))}
                  </select>
                </div>
                {!rule.isFallback && (
                  <div className="flex-col gap-2 w-24">
                    <label className="text-xs text-muted font-medium">Priority #</label>
                    <input 
                      type="number" 
                      className="form-input text-sm p-2 bg-secondary border border-color rounded w-full focus:outline-none focus:border-primary"
                      value={rule.priority}
                      min="0"
                      onChange={(e) => {
                        const arr = [...activeStepRules];
                        arr[idx].priority = parseInt(e.target.value) || 0;
                        setActiveStepRules(arr);
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
          ))}

          <Button 
            variant="outline" 
            className="w-full border-dashed flex justify-center py-3 mt-2"
            onClick={() => setActiveStepRules([...activeStepRules, { conditionExpression: '', priority: activeStepRules.length, isFallback: false }])}
          >
            <Plus size={16} className="mr-2" /> Add Expression Rule
          </Button>
        </div>
      </Modal>
    </div>
  );
}
