/**
 * seedNow.js — Standalone fast seed with longer Atlas timeout
 * Run: node data/seedNow.js
 */
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import dns from 'node:dns';
import bcrypt from 'bcrypt';

dotenv.config();

// Use Google DNS to resolve Atlas SRV records
dns.setServers(['8.8.8.8', '1.1.1.1']);

const MONGO_URI = process.env.MONGO_URI || process.env.MONGO_LOCAL_URI;

// ─── Schemas (inline to avoid import issues) ────────────────────────────────
const roleSchema = new mongoose.Schema({ name: String, permissions: [String], description: String });
const Role = mongoose.model('Role', roleSchema);

const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  role: { type: mongoose.Schema.Types.ObjectId, ref: 'Role' },
  department: String
}, { timestamps: true });
const User = mongoose.model('User', userSchema);

// ─── User Data ───────────────────────────────────────────────────────────────
const users = [
  { name: 'Alexandra Reynolds', email: 'ceo@helleyx.com',      password: 'Admin@1234',   role: 'admin',   dept: 'Executive' },
  { name: 'Daniel Carter',      email: 'dcarter@helleyx.com',  password: 'Manager@1234', role: 'manager', dept: 'Engineering' },
  { name: 'Priya Sharma',       email: 'psharma@helleyx.com',  password: 'Manager@1234', role: 'manager', dept: 'Finance' },
  { name: 'Marcus Johnson',     email: 'mjohnson@helleyx.com', password: 'Manager@1234', role: 'manager', dept: 'Sales' },
  { name: 'Emily Turner',       email: 'eturner@helleyx.com',  password: 'User@1234',    role: 'user',    dept: 'Engineering' },
  { name: 'James Kim',          email: 'jkim@helleyx.com',     password: 'User@1234',    role: 'user',    dept: 'Engineering' },
  { name: 'Natasha Ivanova',    email: 'nivanova@helleyx.com', password: 'User@1234',    role: 'user',    dept: 'Engineering' },
  { name: 'Aisha Ndiaye',       email: 'andiaye@helleyx.com',  password: 'User@1234',    role: 'user',    dept: 'Engineering' },
  { name: 'Fatima Al-Hassan',   email: 'falhassan@helleyx.com',password: 'User@1234',    role: 'user',    dept: 'Finance' },
  { name: 'Carlos Mendez',      email: 'cmendez@helleyx.com',  password: 'User@1234',    role: 'user',    dept: 'Finance' },
  { name: 'Omar Sheikh',        email: 'osheikh@helleyx.com',  password: 'User@1234',    role: 'user',    dept: 'Finance' },
  { name: 'Sophie Brown',       email: 'sbrown@helleyx.com',   password: 'User@1234',    role: 'user',    dept: 'Sales' },
  { name: 'Liam Patel',         email: 'lpatel@helleyx.com',   password: 'User@1234',    role: 'user',    dept: 'Sales' },
  { name: 'Taylor Brooks',      email: 'tbrooks@helleyx.com',  password: 'User@1234',    role: 'user',    dept: 'Sales' },
];

// ─── Main ────────────────────────────────────────────────────────────────────
(async () => {
  try {
    console.log('Connecting to MongoDB Atlas...');
    await mongoose.connect(MONGO_URI, {
      serverSelectionTimeoutMS: 30000,  // 30 second timeout
      connectTimeoutMS: 30000,
    });
    console.log('✅ Connected!\n');

    // Fetch roles
    const roles = await Role.find({});
    if (!roles.length) { console.error('❌ No roles found. Run seedRoles.js first.'); process.exit(1); }
    const roleMap = {};
    roles.forEach(r => roleMap[r.name] = r._id);

    // Clear existing users
    await User.deleteMany({});
    console.log('🗑  Cleared existing users.\n');

    // Create each user with properly hashed password
    for (const u of users) {
      const salt = await bcrypt.genSalt(10);
      const hashed = await bcrypt.hash(u.password, salt);
      await User.create({ name: u.name, email: u.email, password: hashed, role: roleMap[u.role], department: u.dept });
      console.log(`  ✓ [${u.role.toUpperCase().padEnd(7)}] ${u.name} — ${u.email}`);
    }

    console.log(`\n✅ All ${users.length} users created successfully!`);
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('❌ Failed:', err.message);
    process.exit(1);
  }
})();
