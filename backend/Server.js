import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import connectDB from './config/db.js';
import { notFound, errorHandler } from './middleware/errorMiddleware.js';

import apiRoutes from './routes/api.js';
import { recoverInterruptedExecutions } from './services/executionService.js';

dotenv.config();

// Connect to MongoDB
connectDB().then(() => {
  recoverInterruptedExecutions();
});

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Global Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again after 15 minutes'
});
app.use('/api/', limiter);

// API Routes
app.use('/api', apiRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── TEMPORARY SEED ENDPOINT (remove after running once) ──────────────────────
// Visit: http://localhost:5000/seed?key=helleyx-seed-2024
app.get('/seed', async (req, res) => {
  if (req.query.key !== 'helleyx-seed-2024') {
    return res.status(403).json({ message: 'Forbidden' });
  }
  try {
    const { default: bcrypt } = await import('bcrypt');
    const { default: User } = await import('./models/User.js');
    const { default: Role } = await import('./models/Role.js');

    const roles = await Role.find({});
    if (!roles.length) return res.status(400).json({ message: 'No roles found. Run seedRoles first.' });
    const roleMap = {};
    roles.forEach(r => roleMap[r.name] = r._id);

    const users = [
      { name: 'Alexandra Reynolds', email: 'ceo@helleyx.com', password: 'Admin@1234', role: 'admin', dept: 'Executive' },
      { name: 'Daniel Carter', email: 'dcarter@helleyx.com', password: 'Manager@1234', role: 'manager', dept: 'Engineering' },
      { name: 'Priya Sharma', email: 'psharma@helleyx.com', password: 'Manager@1234', role: 'manager', dept: 'Finance' },
      { name: 'Marcus Johnson', email: 'mjohnson@helleyx.com', password: 'Manager@1234', role: 'manager', dept: 'Sales' },
      { name: 'Emily Turner', email: 'eturner@helleyx.com', password: 'User@1234', role: 'user', dept: 'Engineering' },
      { name: 'James Kim', email: 'jkim@helleyx.com', password: 'User@1234', role: 'user', dept: 'Engineering' },
      { name: 'Natasha Ivanova', email: 'nivanova@helleyx.com', password: 'User@1234', role: 'user', dept: 'Engineering' },
      { name: 'Aisha Ndiaye', email: 'andiaye@helleyx.com', password: 'User@1234', role: 'user', dept: 'Engineering' },
      { name: 'Fatima Al-Hassan', email: 'falhassan@helleyx.com', password: 'User@1234', role: 'user', dept: 'Finance' },
      { name: 'Carlos Mendez', email: 'cmendez@helleyx.com', password: 'User@1234', role: 'user', dept: 'Finance' },
      { name: 'Omar Sheikh', email: 'osheikh@helleyx.com', password: 'User@1234', role: 'user', dept: 'Finance' },
      { name: 'Sophie Brown', email: 'sbrown@helleyx.com', password: 'User@1234', role: 'user', dept: 'Sales' },
      { name: 'Liam Patel', email: 'lpatel@helleyx.com', password: 'User@1234', role: 'user', dept: 'Sales' },
      { name: 'Taylor Brooks', email: 'tbrooks@helleyx.com', password: 'User@1234', role: 'user', dept: 'Sales' },
    ];

    // Clear all existing users
    await User.deleteMany({});

    const created = [];
    for (const u of users) {
      const salt = await bcrypt.genSalt(10);
      const hashed = await bcrypt.hash(u.password, salt);
      await User.create({ name: u.name, email: u.email, password: hashed, role: roleMap[u.role], department: u.dept });
      created.push(`${u.role.toUpperCase()}: ${u.name} <${u.email}>`);
    }

    res.json({ success: true, message: `Seeded ${created.length} users`, users: created });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
// ─────────────────────────────────────────────────────────────────────────────

// Error Handling Middleware
app.use(notFound);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
