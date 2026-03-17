import express from 'express';
import { authUser, getUserProfile } from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Registration is disabled — accounts are managed by the system administrator
router.post('/register', (req, res) => res.status(403).json({ message: 'Registration is closed. Contact your administrator.' }));
router.post('/login', authUser);
router.route('/profile').get(protect, getUserProfile);

export default router;
