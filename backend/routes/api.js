import express from 'express';
import authRoutes from './authRoutes.js';
import workflowRoutes from './workflowRoutes.js';
import executionRoutes from './executionRoutes.js';
import analyticsRoutes from './analyticsRoutes.js';

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/workflows', workflowRoutes);
router.use('/executions', executionRoutes);
router.use('/analytics', analyticsRoutes);

export default router;
