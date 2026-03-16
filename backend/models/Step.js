import mongoose from 'mongoose';

const stepSchema = new mongoose.Schema({
  workflowId: { type: mongoose.Schema.Types.ObjectId, ref: 'Workflow', required: true },
  name: { type: String, required: true },
  type: { type: String, enum: ['task', 'approval', 'notification'], required: true },
  config: { type: mongoose.Schema.Types.Mixed, default: {} }, // E.g., email template ID, or task details
}, { timestamps: true });

stepSchema.index({ workflowId: 1 });

const Step = mongoose.model('Step', stepSchema);
export default Step;
