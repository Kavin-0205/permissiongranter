import { ExecutionStatus, Priority } from '../constants/enums.js';

const executionSchema = new mongoose.Schema({
  workflowId: { type: mongoose.Schema.Types.ObjectId, ref: 'Workflow', required: true },
  requesterId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  payloadData: { type: mongoose.Schema.Types.Mixed, default: {} }, // Input data submitted by user
  status: { 
    type: String, 
    enum: Object.values(ExecutionStatus), 
    default: ExecutionStatus.PENDING 
  },
  currentStepId: { type: mongoose.Schema.Types.ObjectId, ref: 'Step' },
  priority: { 
    type: String, 
    enum: Object.values(Priority), 
    default: Priority.MEDIUM 
  },
}, { timestamps: true });

// Optimize query performance for execution dashboards and analytics
executionSchema.index({ workflowId: 1 });
executionSchema.index({ requesterId: 1 });
executionSchema.index({ status: 1 });

const Execution = mongoose.model('Execution', executionSchema);
export default Execution;
