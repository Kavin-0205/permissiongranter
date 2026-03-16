import mongoose from 'mongoose';

const workflowSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  status: { type: String, enum: ['draft', 'published'], default: 'draft' },
  version: { type: Number, default: 1 },
  inputSchema: { type: mongoose.Schema.Types.Mixed, default: {} }, // JSON Schema for dynamic form
  startStepId: { type: mongoose.Schema.Types.ObjectId, ref: 'Step' },
  isDeleted: { type: Boolean, default: false },
}, { timestamps: true });

// Optimize query performance for dashboard listings
workflowSchema.index({ status: 1, isDeleted: 1 });

const Workflow = mongoose.model('Workflow', workflowSchema);
export default Workflow;
