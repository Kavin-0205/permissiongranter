import mongoose from 'mongoose';
import dotenv from 'dotenv';
import connectDB from '../config/db.js';
import Role from '../models/Role.js';

dotenv.config();

const roles = [
  {
    name: 'admin',
    permissions: ['all'],
    description: 'System Administrator - full access'
  },
  {
    name: 'manager',
    permissions: ['workflow:create', 'workflow:edit', 'execution:approve', 'execution:view'],
    description: 'Workflow Manager - can create and manage workflows and approvals'
  },
  {
    name: 'user',
    permissions: ['execution:create', 'execution:view_own'],
    description: 'Standard User - can start and track own executions'
  }
];

const seedRoles = async () => {
  try {
    await connectDB();
    
    // Check if roles already exist
    const count = await Role.countDocuments();
    if (count > 0) {
      console.log('Roles already exist. Skipping seed.');
      process.exit(0);
    }

    await Role.insertMany(roles);
    console.log('Roles seeded successfully');
    process.exit(0);
  } catch (error) {
    console.error(`Error seeding roles: ${error.message}`);
    process.exit(1);
  }
};

seedRoles();
