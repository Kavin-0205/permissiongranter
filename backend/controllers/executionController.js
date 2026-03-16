import Execution from '../models/Execution.js';
import ExecutionLog from '../models/ExecutionLog.js';
import { startExecution, runNextStep, resumeExecution } from '../services/executionService.js';

// @desc    Get all executions for a user (or all if admin/manager)
// @route   GET /api/executions
// @access  Private
export const getExecutions = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const query = {};
    if (req.user.role === 'user') {
      query.requesterId = req.user._id;
    }
    
    // Filters
    if (req.query.status) query.status = req.query.status;
    if (req.query.workflowId) query.workflowId = req.query.workflowId;

    const total = await Execution.countDocuments(query);
    const executions = await Execution.find(query)
      .populate('workflowId', 'title version')
      .populate('requesterId', 'name email')
      .populate('currentStepId', 'name type')
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limit);

    res.json({
      executions,
      page,
      pages: Math.ceil(total / limit),
      total
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Start an execution
// @route   POST /api/executions/:workflowId
// @access  Private
export const createExecution = async (req, res, next) => {
  try {
    const execution = await startExecution(req.params.workflowId, req.user._id, req.body.payload);
    res.status(201).json(execution);
  } catch (error) {
    next(error);
  }
};

// @desc    Get execution details + logs tracker
// @route   GET /api/executions/:id
// @access  Private
export const getExecutionById = async (req, res, next) => {
  try {
    const execution = await Execution.findById(req.params.id)
      .populate('workflowId')
      .populate('requesterId', 'name email')
      .populate('currentStepId');

    if (!execution) {
      res.status(404);
      throw new Error('Execution not found');
    }

    // Role check: users can only see their own
    if (req.user.role === 'user' && execution.requesterId._id.toString() !== req.user._id.toString()) {
      res.status(403);
      throw new Error('Not authorized to view this execution');
    }

    const logs = await ExecutionLog.find({ executionId: execution._id })
      .populate('actorId', 'name role')
      .populate('stepId', 'name type')
      .sort({ createdAt: 1 });

    res.json({
      execution,
      logs
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Cancel an execution safely
// @route   PUT /api/executions/:id/cancel
// @access  Private
export const cancelExecution = async (req, res, next) => {
  try {
    const execution = await Execution.findById(req.params.id);
    if (!execution) { res.status(404); throw new Error('Not found'); }
    
    if (req.user.role === 'user' && execution.requesterId.toString() !== req.user._id.toString()) {
      res.status(403); throw new Error('Not auth');
    }

    if (execution.status === 'completed' || execution.status === 'canceled') {
      res.status(400); throw new Error('Cannot cancel a finished execution');
    }

    execution.status = 'canceled';
    await execution.save();

    await ExecutionLog.create({
      executionId: execution._id,
      action: 'Execution Canceled',
      actorId: req.user._id,
      details: req.body.reason || 'User canceled'
    });

    res.json(execution);
  } catch (error) {
    next(error);
  }
};

// @desc    Manager resumes (approves/rejects) an execution step
// @route   POST /api/executions/:id/resume
// @access  Private/Manager
export const processApproval = async (req, res, next) => {
  try {
    const { decision, comment } = req.body; // 'approved' or 'rejected'
    if (!['approved', 'rejected'].includes(decision)) {
      res.status(400); throw new Error('Decision must be approved or rejected');
    }

    const execution = await resumeExecution(req.params.id, req.user._id, decision, comment);
    res.json(execution);
  } catch (error) {
    next(error);
  }
};
