export const ExecutionStatus = {
  PENDING: 'pending',
  RUNNING: 'running',
  WAITING_FOR_APPROVAL: 'waiting_for_approval',
  COMPLETED: 'completed',
  FAILED: 'failed',
  CANCELED: 'canceled'
};

export const WorkflowStatus = {
  DRAFT: 'draft',
  PUBLISHED: 'published'
};

export const StepType = {
  TASK: 'task',
  APPROVAL: 'approval',
  NOTIFICATION: 'notification'
};

export const Priority = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high'
};
