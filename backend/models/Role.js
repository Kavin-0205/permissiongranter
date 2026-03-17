import mongoose from 'mongoose';

const roleSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true, 
    unique: true,
    enum: ['admin', 'manager', 'user'],
    lowercase: true 
  },
  permissions: [{
    type: String,
    required: true
  }],
  description: { type: String }
}, { timestamps: true });

const Role = mongoose.model('Role', roleSchema);
export default Role;
