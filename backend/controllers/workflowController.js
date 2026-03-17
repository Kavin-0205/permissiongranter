import { z } from 'zod';
import Workflow from '../models/Workflow.js';
import Step from '../models/Step.js';
import Rule from '../models/Rule.js';

// Define Zod schema for input validation
const workflowSchema = z.object({
  title: z.string().min(2, 'Title must be at least 2 characters'),
  description: z.string().optional(),
  inputSchema: z.record(z.any()).optional(),
  status: z.enum(['draft', 'published']).optional()
});

// @desc    Get all workflows (excluding soft-deleted)
// @route   GET /api/workflows
// @access  Private
export const getWorkflows = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const query = { isDeleted: false };
    if (req.query.status) query.status = req.query.status;

    const total = await Workflow.countDocuments(query);
    const workflows = await Workflow.find(query)
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('startStepId');

    res.json({
      workflows,
      page,
      pages: Math.ceil(total / limit),
      total
    });
  } catch (error) {
    next(error);
  }
};

// Helper to save steps and rules for a workflow
const saveStepsAndRules = async (workflow, stepsPayload) => {
  if (!stepsPayload || !Array.isArray(stepsPayload)) return;

  const workflowId = workflow._id;
  const idMap = {}; // Maps frontend IDs (temp or real) to real MongoDB ObjectIds

  // 1. Create/Update Steps (First pass: generate/verify all Step IDs)
  const existingSteps = await Step.find({ workflowId });
  const existingStepIds = existingSteps.map(s => s._id.toString());
  const incomingStepIds = stepsPayload.map(s => s._id).filter(id => !id.startsWith('new_'));

  // Delete steps that are no longer in the payload
  const stepsToDelete = existingStepIds.filter(id => !incomingStepIds.includes(id));
  if (stepsToDelete.length > 0) {
    await Step.deleteMany({ _id: { $in: stepsToDelete } });
    await Rule.deleteMany({ stepId: { $in: stepsToDelete } });
  }

  for (const stepData of stepsPayload) {
    let dbStep;
    const isTempId = stepData._id.startsWith('new_');

    if (isTempId) {
      dbStep = await Step.create({
        workflowId,
        name: stepData.name,
        type: stepData.type,
        config: stepData.config
      });
      idMap[stepData._id] = dbStep._id;
    } else {
      dbStep = await Step.findByIdAndUpdate(stepData._id, {
        name: stepData.name,
        type: stepData.type,
        config: stepData.config
      }, { new: true, upsert: true });
      idMap[stepData._id] = dbStep._id;
    }
    
    // Check if this is the start step (usually the first one if not specified, 
    // or we can handle a specific flag from FE)
    if (stepData.isStartStep || (stepsPayload.indexOf(stepData) === 0 && !workflow.startStepId)) {
      workflow.startStepId = dbStep._id;
    }
  }

  // 2. Create/Update Rules (Second pass: link nextStepId using idMap)
  for (const stepData of stepsPayload) {
    const dbStepId = idMap[stepData._id];
    
    // Purge existing rules for this step to simplify sync
    await Rule.deleteMany({ stepId: dbStepId });

    if (stepData.rules && Array.isArray(stepData.rules)) {
      for (const ruleData of stepData.rules) {
        const nextStepId = ruleData.nextStepId ? (idMap[ruleData.nextStepId] || ruleData.nextStepId) : null;
        
        await Rule.create({
          stepId: dbStepId,
          conditionExpression: ruleData.conditionExpression,
          priority: ruleData.priority || 0,
          nextStepId,
          isFallback: ruleData.isFallback || false
        });
      }
    }
  }

  await workflow.save();
};

// @desc    Create a new workflow
// @route   POST /api/workflows
// @access  Private/Admin
export const createWorkflow = async (req, res, next) => {
  try {
    const validatedData = workflowSchema.parse(req.body);
    validatedData.status = WorkflowStatus.DRAFT;

    const workflow = await Workflow.create(validatedData);
    
    if (req.body.steps) {
      await saveStepsAndRules(workflow, req.body.steps);
    }
    
    res.status(201).json(workflow);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400); return next(new Error(error.errors.map(e => e.message).join(', ')));
    }
    next(error);
  }
};

// @desc    Get single workflow
// @route   GET /api/workflows/:id
// @access  Private
export const getWorkflowById = async (req, res, next) => {
  try {
    const workflow = await Workflow.findById(req.params.id);
    if (workflow && !workflow.isDeleted) {
      const steps = await Step.find({ workflowId: workflow._id }).lean();
      
      // Fetch rules for these steps
      for(let step of steps) {
        step.rules = await Rule.find({ stepId: step._id }).lean();
      }
      
      res.json({ ...workflow.toObject(), steps });
    } else {
      res.status(404); throw new Error('Workflow not found');
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Update a workflow (handles version increment if published)
// @route   PUT /api/workflows/:id
// @access  Private/Admin
export const updateWorkflow = async (req, res, next) => {
  try {
    const validatedData = workflowSchema.parse(req.body);
    let workflow = await Workflow.findById(req.params.id);

    if (!workflow || workflow.isDeleted) {
      res.status(404); throw new Error('Workflow not found');
    }

    if (workflow.status === 'published') {
      workflow.isDeleted = true; 
      await workflow.save();

      const newWorkflow = await Workflow.create({
        ...workflow.toObject(),
        _id: undefined,
        version: workflow.version + 1,
        status: 'draft',
        ...validatedData
      });

      if (req.body.steps) {
        await saveStepsAndRules(newWorkflow, req.body.steps);
      }

      return res.status(201).json(newWorkflow);
    } else {
      Object.assign(workflow, validatedData);
      const updatedWorkflow = await workflow.save();
      
      if (req.body.steps) {
        await saveStepsAndRules(updatedWorkflow, req.body.steps);
      }
      
      res.json(updatedWorkflow);
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400); return next(new Error(error.errors.map(e => e.message).join(', ')));
    }
    next(error);
  }
};

// @desc    Soft delete workflow
// @route   DELETE /api/workflows/:id
// @access  Private/Admin
export const deleteWorkflow = async (req, res, next) => {
  try {
    const workflow = await Workflow.findById(req.params.id);

    if (workflow) {
      workflow.isDeleted = true;
      await workflow.save();
      res.json({ message: 'Workflow removed' });
    } else {
      res.status(404);
      throw new Error('Workflow not found');
    }
  } catch (error) {
    next(error);
  }
};
