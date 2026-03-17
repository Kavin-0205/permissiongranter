import mongoose from 'mongoose';
import { WorkflowStatus } from '../constants/enums.js';

const workflowSchema = new mongoose.Schema({
  title: { type: String, required: true, alias: 'name' },
  description: { type: String },
  status: { type: String, enum: Object.values(WorkflowStatus), default: WorkflowStatus.DRAFT },
  version: { type: Number, default: 1 },
  inputSchema: { type: mongoose.Schema.Types.Mixed, default: {}, alias: 'input_schema' }, // JSON Schema for dynamic form
  startStepId: { type: mongoose.Schema.Types.ObjectId, ref: 'Step', alias: 'start_step_id' },
  isDeleted: { type: Boolean, default: false },
  is_active: { type: Boolean, default: true }, // Added as per requirement
}, { timestamps: true, toJSON: { virtuals: true, aliases: true }, toObject: { virtuals: true, aliases: true } });

// Optimize query performance for dashboard listings
workflowSchema.index({ status: 1, isDeleted: 1 });

const Workflow = mongoose.model('Workflow', workflowSchema);
export default Workflow;
