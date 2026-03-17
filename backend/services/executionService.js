import { z } from 'zod';
import Execution from '../models/Execution.js';
import ExecutionLog from '../models/ExecutionLog.js';
import Step from '../models/Step.js';
import Rule from '../models/Rule.js';
import Workflow from '../models/Workflow.js';
import { evaluateRule } from './ruleEngine.js';
import { ExecutionStatus, Priority } from '../constants/enums.js';

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

/**
 * Recover executions that were 'RUNNING' but interrupted by server restart
 */
export const recoverInterruptedExecutions = async () => {
  const hanging = await Execution.find({ status: ExecutionStatus.RUNNING });
  if (hanging.length > 0) {
    console.log(`[Engine] Found ${hanging.length} interrupted executions. Resuming...`);
    for (const execution of hanging) {
      runNextStep(execution._id).catch(err => console.error(`Failed to resume ${execution._id}:`, err));
    }
  }
};

export const startExecution = async (workflowId, requesterId, payloadData) => {
  const workflow = await Workflow.findById(workflowId);
  if (!workflow || workflow.isDeleted) throw new Error('Workflow not found or deleted');
  
  // Validation
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
    status: ExecutionStatus.PENDING,
    currentStepId: workflow.startStepId,
    priority: payloadData.priority || Priority.MEDIUM
  });

  await ExecutionLog.create({
    executionId: execution._id,
    action: 'Execution Started',
    details: 'Received valid payload, initializing flow',
    actorId: requesterId
  });

  // Start the runner async
  runNextStep(execution._id).catch(console.error);

  return execution;
};

export const runNextStep = async (executionId) => {
  const MAX_ITERATIONS = 50;
  let iterations = 0;

  // Atomic update to mark as RUNNING to prevent duplicate processing
  let execution = await Execution.findOneAndUpdate(
    { _id: executionId, status: { $in: [ExecutionStatus.PENDING, ExecutionStatus.RUNNING] } },
    { status: ExecutionStatus.RUNNING },
    { new: true }
  );

  if (!execution) return; // Already finished or being processed elsewhere

  try {
    while (execution && execution.status === ExecutionStatus.RUNNING && iterations < MAX_ITERATIONS) {
      iterations++;

      if (!execution.currentStepId) {
        execution.status = ExecutionStatus.COMPLETED;
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
        throw new Error(`Step NOT FOUND: ${execution.currentStepId}`);
      }

      const startTime = Date.now();

      // Perform Step logic
      if (step.type === 'task') {
        await ExecutionLog.create({
          executionId: execution._id,
          stepId: step._id,
          action: 'Task Executed',
          details: `Step: ${step.name}`,
          durationMs: Date.now() - startTime
        });
      } else if (step.type === 'notification') {
        await ExecutionLog.create({
          executionId: execution._id,
          stepId: step._id,
          action: 'Notification Sent',
          details: `Sent update for: ${step.name}`,
          durationMs: Date.now() - startTime
        });
      } else if (step.type === 'approval') {
        execution.status = ExecutionStatus.WAITING_FOR_APPROVAL;
        await execution.save();
        await ExecutionLog.create({
          executionId: execution._id,
          stepId: step._id,
          action: 'Wait for Approval',
          details: `Awaiting decision for: ${step.name}`,
          durationMs: Date.now() - startTime
        });
        break; // Exit loop, wait for human decision
      }

      // Determine Next Step via Rule Engine
      const rules = await Rule.find({ stepId: step._id }).sort({ priority: 1 });
      let nextStepId = null;
      let ruleMatched = false;

      for (const rule of rules) {
        if (!rule.isFallback) {
          const isMatch = evaluateRule(rule.conditionExpression, execution.payloadData);
          if (isMatch) {
            nextStepId = rule.nextStepId;
            ruleMatched = true;
            await ExecutionLog.create({
              executionId: execution._id,
              action: 'Rule Match',
              details: `Matched: ${rule.conditionExpression} -> routing to next step`
            });
            break;
          }
        }
      }

      if (!ruleMatched) {
        const fallbackRule = rules.find(r => r.isFallback);
        if (fallbackRule) {
          nextStepId = fallbackRule.nextStepId;
          await ExecutionLog.create({
            executionId: execution._id,
            action: 'Fallback Rule',
            details: 'Using default path.'
          });
        }
      }

      execution.currentStepId = nextStepId || null;
      await execution.save();
      
      // If nextStepId is null, it will be caught in the next iteration at the top
    }

    if (iterations >= MAX_ITERATIONS) {
      throw new Error('Infinite loop detected: Exceeded Max Iterations limit');
    }
  } catch (error) {
    console.error(`Execution error [${executionId}]:`, error.message);
    execution.status = ExecutionStatus.FAILED;
    await execution.save();
    await ExecutionLog.create({
      executionId: execution._id,
      action: 'Error',
      details: error.message
    });
  }
};

export const resumeExecution = async (executionId, approverId, decision, comment) => {
  const execution = await Execution.findById(executionId);
  if (!execution || execution.status !== ExecutionStatus.WAITING_FOR_APPROVAL) {
    throw new Error('Execution is not awaiting approval');
  }

  const step = await Step.findById(execution.currentStepId);

  await ExecutionLog.create({
    executionId: execution._id,
    stepId: execution.currentStepId,
    action: `Decision: ${decision}`,
    details: comment || 'No comment',
    actorId: approverId
  });

  if (decision === 'rejected') {
    execution.status = ExecutionStatus.FAILED;
    await execution.save();
    return execution;
  }

  // Find the rule that handles 'approved' or just use the fallback if simpler
  // In a robust system, we would have specific rules for approval results.
  // Here we'll look for rules that match 'decision == "approved"' or similar if exists,
  // otherwise we use fallthrough.
  
  const rules = await Rule.find({ stepId: step._id }).sort({ priority: 1 });
  let nextStepId = null;
  
  // Try to find a rule specifically for approved decision
  for (const rule of rules) {
    if (rule.conditionExpression.includes('approved') || rule.conditionExpression.includes('decision')) {
       if (evaluateRule(rule.conditionExpression, { decision })) {
         nextStepId = rule.nextStepId;
         break;
       }
    }
  }

  if (!nextStepId) {
    nextStepId = rules.find(r => r.isFallback)?.nextStepId || null;
  }
  
  execution.currentStepId = nextStepId;
  execution.status = ExecutionStatus.RUNNING;
  await execution.save();

  runNextStep(execution._id).catch(console.error);
  return execution;
};

export const retryExecution = async (executionId, actorId) => {
  const execution = await Execution.findById(executionId);
  if (!execution || execution.status !== ExecutionStatus.FAILED) {
    throw new Error('Only failed executions can be retried');
  }

  execution.status = ExecutionStatus.RUNNING;
  await execution.save();

  await ExecutionLog.create({
    executionId: execution._id,
    action: 'Retried',
    details: 'Resuming from failure point',
    actorId
  });

  runNextStep(execution._id).catch(console.error);
  return execution;
};
