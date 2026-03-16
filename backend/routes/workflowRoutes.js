import express from 'express';
import { getWorkflows, createWorkflow, getWorkflowById, updateWorkflow, deleteWorkflow } from '../controllers/workflowController.js';
import { protect, ensureAdmin } from '../middleware/auth.js';

const router = express.Router();

router.route('/')
  .get(protect, getWorkflows)
  .post(protect, ensureAdmin, createWorkflow);

router.route('/:id')
  .get(protect, getWorkflowById)
  .put(protect, ensureAdmin, updateWorkflow)
  .delete(protect, ensureAdmin, deleteWorkflow);

export default router;
