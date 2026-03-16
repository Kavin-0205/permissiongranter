import Execution from '../models/Execution.js';
import ExecutionLog from '../models/ExecutionLog.js';
import Step from '../models/Step.js';
import Rule from '../models/Rule.js';
import Workflow from '../models/Workflow.js';
import { evaluateRule } from './ruleEngine.js';

export const startExecution = async (workflowId, requesterId, payloadData) => {
  // Find workflow
  const workflow = await Workflow.findById(workflowId);
  if (!workflow || workflow.isDeleted) throw new Error('Workflow not found or deleted');
  
  // Here we would validate payloadData against workflow.inputSchema using Zod/Joi dynamically.
  // For simplicity MVP we will assume payload isValid.
  
  if (!workflow.startStepId) throw new Error('Workflow has no starting step configured');

  const execution = await Execution.create({
    workflowId,
    requesterId,
    payloadData,
    status: 'in_progress',
    currentStepId: workflow.startStepId
  });

  await ExecutionLog.create({
    executionId: execution._id,
    action: 'Execution Started',
    details: 'Received valid payload, routing to start step',
    actorId: requesterId
  });

  // Start the runner async (fire & forget for background processing in a real system)
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

  // If approved, we must evaluate rules to find the next step 
  // (In a real system, the approval result would append to payload and be evaluated)
  const rules = await Rule.find({ stepId: step._id }).sort({ priority: 1 });
  let nextStepId = rules.find(r => r.isFallback)?.nextStepId || null;
  
  // Since we don't have true payload injection for the approval itself right now, we just map fallback 
  // or default next step
  execution.currentStepId = nextStepId;
  execution.status = 'in_progress';
  await execution.save();

  // Resume loop
  runNextStep(execution._id).catch(console.error);
  return execution;
};
