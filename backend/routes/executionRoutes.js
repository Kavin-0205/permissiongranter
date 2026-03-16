import express from 'express';
import { getExecutions, createExecution, getExecutionById, cancelExecution, processApproval } from '../controllers/executionController.js';
import { protect, ensureManager } from '../middleware/auth.js';

const router = express.Router();

router.route('/')
  .get(protect, getExecutions);

router.route('/:workflowId')
  .post(protect, createExecution);

router.route('/:id')
  .get(protect, getExecutionById);

router.route('/:id/cancel')
  .put(protect, cancelExecution);

router.route('/:id/resume')
  .post(protect, ensureManager, processApproval);

export default router;
