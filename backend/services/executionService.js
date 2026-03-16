import { z } from 'zod';
import Execution from '../models/Execution.js';
import ExecutionLog from '../models/ExecutionLog.js';
import Step from '../models/Step.js';
import Rule from '../models/Rule.js';
import Workflow from '../models/Workflow.js';
import { evaluateRule } from './ruleEngine.js';

/**
 * Dynamically constructs a Zod schema from the workflow inputSchema
 */
const validatePayload = (schema, data) => {
  if (!schema || Object.keys(schema).length === 0) return data;

  const shape = {};
  Object.keys(schema).forEach(key => {
    const type = schema[key];
    if (type === 'number') shape[key] = z.number();
    else if (type === 'boolean') shape[key] = z.boolean();
    else shape[key] = z.string();
  });

  const zodSchema = z.object(shape);
  return zodSchema.parse(data);
};

export const startExecution = async (workflowId, requesterId, payloadData) => {
  const workflow = await Workflow.findById(workflowId);
  if (!workflow || workflow.isDeleted) throw new Error('Workflow not found or deleted');
  
  // Enterprise-grade Payload Validation
  let validatedPayload = payloadData;
  try {
    validatedPayload = validatePayload(workflow.inputSchema, payloadData);
  } catch (err) {
    if (err instanceof z.ZodError) {
      throw new Error(`Invalid data: ${err.errors.map(e => `${e.path}: ${e.message}`).join(', ')}`);
    }
    throw err;
  }
  
  if (!workflow.startStepId) throw new Error('Workflow has no starting step configured');

  const execution = await Execution.create({
    workflowId,
    requesterId,
    payloadData: validatedPayload,
    status: 'in_progress',
    currentStepId: workflow.startStepId,
    priority: payloadData.priority || 'medium'
  });

  await ExecutionLog.create({
    executionId: execution._id,
    action: 'Execution Started',
    details: 'Received valid payload, routing to start step',
    actorId: requesterId
  });

  // Start the runner async
  runNextStep(execution._id).catch(console.error);

  return execution;
};

export const runNextStep = async (executionId) => {
  const MAX_ITERATIONS = 50;
  let iterations = 0;

  let execution = await Execution.findById(executionId);

  while (execution && execution.status === 'in_progress' && iterations < MAX_ITERATIONS) {
    iterations++;

    if (!execution.currentStepId) {
      execution.status = 'completed';
      await execution.save();
      await ExecutionLog.create({
        executionId: execution._id,
        action: 'Execution Completed',
        details: 'Workflow reached end naturally.'
      });
      break;
    }

    const step = await Step.findById(execution.currentStepId);
    if (!step) {
      execution.status = 'failed';
      await execution.save();
      await ExecutionLog.create({ executionId: execution._id, action: 'Error', errorReason: 'Step not found' });
      break;
    }

    const startTime = Date.now();

    // Perform Step logic
    if (step.type === 'task') {
      await ExecutionLog.create({
        executionId: execution._id,
        stepId: step._id,
        action: 'Task Executed',
        details: `Simulated task: ${step.name}`,
        durationMs: Date.now() - startTime
      });
    } else if (step.type === 'notification') {
      await ExecutionLog.create({
        executionId: execution._id,
        stepId: step._id,
        action: 'Notification Sent',
        details: `Simulated email/alert sent via NotificationService: ${step.name}`,
        durationMs: Date.now() - startTime
      });
    } else if (step.type === 'approval') {
      // Pause runner
      execution.status = 'paused_for_approval';
      await execution.save();
      await ExecutionLog.create({
        executionId: execution._id,
        stepId: step._id,
        action: 'Paused for Approval',
        details: `Awaiting manager decision for: ${step.name}`,
        durationMs: Date.now() - startTime
      });
      break; // Exit the loop until resumed
    }

    // Determine Next Step via Rule Engine
    const rules = await Rule.find({ stepId: step._id }).sort({ priority: 1 });
    let nextStepId = null;
    let ruleMatched = false;

    // Check expression rules first
    for (const rule of rules) {
      if (!rule.isFallback) {
        const isMatch = evaluateRule(rule.conditionExpression, execution.payloadData);
        if (isMatch) {
          nextStepId = rule.nextStepId;
          ruleMatched = true;
          await ExecutionLog.create({
            executionId: execution._id,
            action: 'Rule Evaluated',
            details: `Condition matched: ${rule.conditionExpression}`
          });
          break;
        }
      }
    }

    // Fallback logic
    if (!ruleMatched) {
      const fallbackRule = rules.find(r => r.isFallback);
      if (fallbackRule) {
        nextStepId = fallbackRule.nextStepId;
        await ExecutionLog.create({
          executionId: execution._id,
          action: 'Rule Evaluated',
          details: 'No conditions matched. Submitting to Default/Fallback rule.'
        });
      }
    }

    // Update execution ptr
    execution.currentStepId = nextStepId;
    await execution.save();
    
    // Refresh execution from DB for next iteration
    execution = await Execution.findById(executionId);
  }

  if (iterations >= MAX_ITERATIONS) {
    execution.status = 'failed';
    await execution.save();
    await ExecutionLog.create({
      executionId: execution._id,
      action: 'Error',
      errorReason: `Exceeded Max Iterations Loop Protection Limit (${MAX_ITERATIONS})`
    });
  }
};

export const resumeExecution = async (executionId, approverId, decision, comment) => {
  const execution = await Execution.findById(executionId);
  if (!execution || execution.status !== 'paused_for_approval') {
    throw new Error('Execution is not awaiting approval');
  }

  const step = await Step.findById(execution.currentStepId);

  await ExecutionLog.create({
    executionId: execution._id,
    stepId: execution.currentStepId,
    action: `Approval Decision: ${decision}`,
    details: comment || 'No comment provided',
    actorId: approverId
  });

  if (decision === 'rejected') {
    execution.status = 'failed';
    await execution.save();
    return execution;
  }

  const rules = await Rule.find({ stepId: step._id }).sort({ priority: 1 });
  let nextStepId = rules.find(r => r.isFallback)?.nextStepId || null;
  
  execution.currentStepId = nextStepId;
  execution.status = 'in_progress';
  await execution.save();

  runNextStep(execution._id).catch(console.error);
  return execution;
};

export const retryExecution = async (executionId, actorId) => {
  const execution = await Execution.findById(executionId);
  if (!execution || execution.status !== 'failed') {
    throw new Error('Only failed executions can be retried');
  }

  execution.status = 'in_progress';
  await execution.save();

  await ExecutionLog.create({
    executionId: execution._id,
    action: 'Execution Retried',
    details: 'System attempting to resume from last failed step pointer.',
    actorId
  });

  runNextStep(execution._id).catch(console.error);
  return execution;
};
