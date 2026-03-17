import mongoose from 'mongoose';

const stepSchema = new mongoose.Schema({
  workflowId: { type: mongoose.Schema.Types.ObjectId, ref: 'Workflow', required: true, alias: 'workflow_id' },
  name: { type: String, required: true },
  type: { type: String, enum: ['task', 'approval', 'notification'], required: true, alias: 'step_type' },
  config: { type: mongoose.Schema.Types.Mixed, default: {}, alias: 'metadata' }, // E.g., email template ID, or task details
}, { timestamps: true, toJSON: { virtuals: true, aliases: true }, toObject: { virtuals: true, aliases: true } });

stepSchema.index({ workflowId: 1 });

const Step = mongoose.model('Step', stepSchema);
export default Step;
