import mongoose from 'mongoose';

const executionLogSchema = new mongoose.Schema({
  executionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Execution', required: true },
  stepId: { type: mongoose.Schema.Types.ObjectId, ref: 'Step' }, // Optional, as some logs might be system-level
  action: { type: String, required: true }, // e.g., 'Started', 'Rule Evaluated', 'Notification Sent', 'Approval Paused'
  details: { type: mongoose.Schema.Types.Mixed }, // Payload, rule condition, or other contextual data
  durationMs: { type: Number },
  errorReason: { type: String },
  actorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Who triggered this action (approver, system, etc.)
}, { timestamps: true });

executionLogSchema.index({ executionId: 1 });

const ExecutionLog = mongoose.model('ExecutionLog', executionLogSchema);
export default ExecutionLog;
