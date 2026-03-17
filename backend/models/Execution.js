import mongoose from 'mongoose';
import { ExecutionStatus, Priority } from '../constants/enums.js';

const executionSchema = new mongoose.Schema({
  workflowId: { type: mongoose.Schema.Types.ObjectId, ref: 'Workflow', required: true },
  workflow_version: { type: Number }, // Snapshot at time of execution
  requesterId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, alias: 'triggered_by' },
  payloadData: { type: mongoose.Schema.Types.Mixed, default: {}, alias: 'data' }, 
  status: { 
    type: String, 
    enum: Object.values(ExecutionStatus), 
    default: ExecutionStatus.PENDING 
  },
  currentStepId: { type: mongoose.Schema.Types.ObjectId, ref: 'Step', alias: 'current_step_id' },
  priority: { 
    type: String, 
    enum: Object.values(Priority), 
    default: Priority.MEDIUM 
  },
  retries: { type: Number, default: 0 },
}, { timestamps: true, toJSON: { virtuals: true, aliases: true }, toObject: { virtuals: true, aliases: true } });

// Optimize query performance for execution dashboards and analytics
executionSchema.index({ workflowId: 1 });
executionSchema.index({ requesterId: 1 });
executionSchema.index({ status: 1 });

const Execution = mongoose.model('Execution', executionSchema);
export default Execution;
