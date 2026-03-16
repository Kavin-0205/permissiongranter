import mongoose from 'mongoose';

const ruleSchema = new mongoose.Schema({
  stepId: { type: mongoose.Schema.Types.ObjectId, ref: 'Step', required: true },
  conditionExpression: { type: String, required: true }, // E.g., "amount > 1000" or "DEFAULT"
  priority: { type: Number, default: 0 }, // Lower number = higher priority to evaluate first
  nextStepId: { type: mongoose.Schema.Types.ObjectId, ref: 'Step' }, // Can be null if it's the end of flow
  isFallback: { type: Boolean, default: false },
}, { timestamps: true });

ruleSchema.index({ stepId: 1, priority: 1 });

const Rule = mongoose.model('Rule', ruleSchema);
export default Rule;
