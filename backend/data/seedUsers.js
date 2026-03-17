/**
 * seedUsers.js
 * Run: node backend/data/seedUsers.js
 * 
 * Creates all pre-defined users for the system.
 * Registration is disabled — only these accounts can log in.
 */

import dotenv from 'dotenv';
import connectDB from '../config/db.js';
import User from '../models/User.js';
import Role from '../models/Role.js';

dotenv.config();

const users = [
  // ── Admin (CEO) ───────────────────────────────────────────────────────
  {
    name: 'Alexandra Reynolds',
    email: 'ceo@helleyx.com',
    password: 'Admin@1234',
    role: 'admin',
    department: 'Executive'
  },

  // ── Managers ─────────────────────────────────────────────────────────
  {
    name: 'Daniel Carter',
    email: 'dcarter@helleyx.com',
    password: 'Manager@1234',
    role: 'manager',
    department: 'Engineering'
  },
  {
    name: 'Priya Sharma',
    email: 'psharma@helleyx.com',
    password: 'Manager@1234',
    role: 'manager',
    department: 'Finance'
  },
  {
    name: 'Marcus Johnson',
    email: 'mjohnson@helleyx.com',
    password: 'Manager@1234',
    role: 'manager',
    department: 'Sales'
  },

  // ── Employees ─────────────────────────────────────────────────────────
  {
    name: 'Emily Turner',
    email: 'eturner@helleyx.com',
    password: 'User@1234',
    role: 'user',
    department: 'Engineering'
  },
  {
    name: 'James Kim',
    email: 'jkim@helleyx.com',
    password: 'User@1234',
    role: 'user',
    department: 'Engineering'
  },
  {
    name: 'Fatima Al-Hassan',
    email: 'falhassan@helleyx.com',
    password: 'User@1234',
    role: 'user',
    department: 'Finance'
  },
  {
    name: 'Carlos Mendez',
    email: 'cmendez@helleyx.com',
    password: 'User@1234',
    role: 'user',
    department: 'Finance'
  },
  {
    name: 'Sophie Brown',
    email: 'sbrown@helleyx.com',
    password: 'User@1234',
    role: 'user',
    department: 'Sales'
  },
  {
    name: 'Liam Patel',
    email: 'lpatel@helleyx.com',
    password: 'User@1234',
    role: 'user',
    department: 'Sales'
  },
  {
    name: 'Natasha Ivanova',
    email: 'nivanova@helleyx.com',
    password: 'User@1234',
    role: 'user',
    department: 'Engineering'
  },
  {
    name: 'Omar Sheikh',
    email: 'osheikh@helleyx.com',
    password: 'User@1234',
    role: 'user',
    department: 'Finance'
  },
  {
    name: 'Taylor Brooks',
    email: 'tbrooks@helleyx.com',
    password: 'User@1234',
    role: 'user',
    department: 'Sales'
  },
  {
    name: 'Aisha Ndiaye',
    email: 'andiaye@helleyx.com',
    password: 'User@1234',
    role: 'user',
    department: 'Engineering'
  }
];

const seedUsers = async () => {
  try {
    await connectDB();

    // Load all roles into a lookup map
    const roles = await Role.find({});
    if (roles.length === 0) {
      console.error('❌ No roles found. Run seedRoles.js first.');
      process.exit(1);
    }
    const roleMap = {};
    roles.forEach(r => roleMap[r.name] = r._id);

    // Wipe existing users for a clean re-seed
    await User.deleteMany({});
    console.log('🗑  Cleared existing users.\n');

    let created = 0;
    for (const u of users) {
      // Pass plain password — the User model's pre-save hook hashes it once
      await User.create({
        name: u.name,
        email: u.email,
        password: u.password,
        role: roleMap[u.role],
        department: u.department
      });
      console.log(`  ✓ Created [${u.role.toUpperCase().padEnd(7)}]: ${u.name} <${u.email}>`);
      created++;
    }

    console.log(`\n✅ Done. Created: ${created} users.`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Seed failed:', error.message);
    process.exit(1);
  }
};

seedUsers();

