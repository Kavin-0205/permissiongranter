import express from 'express';
import { getAnalytics } from '../controllers/analyticsController.js';
import { protect, ensureManager } from '../middleware/auth.js';

const router = express.Router();

router.route('/')
  .get(protect, ensureManager, getAnalytics);

export default router;
