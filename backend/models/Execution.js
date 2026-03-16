import mongoose from 'mongoose';

const executionSchema = new mongoose.Schema({
  workflowId: { type: mongoose.Schema.Types.ObjectId, ref: 'Workflow', required: true },
  requesterId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  payloadData: { type: mongoose.Schema.Types.Mixed, default: {} }, // Input data submitted by user
  status: { 
    type: String, 
    enum: ['pending', 'in_progress', 'paused_for_approval', 'completed', 'failed', 'canceled'], 
    default: 'pending' 
  },
  currentStepId: { type: mongoose.Schema.Types.ObjectId, ref: 'Step' },
}, { timestamps: true });

// Optimize query performance for execution dashboards and analytics
executionSchema.index({ workflowId: 1 });
executionSchema.index({ requesterId: 1 });
executionSchema.index({ status: 1 });

const Execution = mongoose.model('Execution', executionSchema);
export default Execution;
