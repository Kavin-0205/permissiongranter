import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { KeyRound, Mail, User, ShieldAlert, ArrowRight, Loader2 } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { apiClient } from '../api/client';
import './Login.css'; // Reuse login styling

export function Register({ setUser }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isManager, setIsManager] = useState(false);
  const [managerCode, setManagerCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await apiClient.post('/auth/register', {
        name,
        email,
        password,
        managerCode: isManager ? managerCode : undefined
      });
      setUser(res.data);
      localStorage.setItem('user', JSON.stringify(res.data));
      apiClient.defaults.headers.common['Authorization'] = `Bearer ${res.data.token}`;
      navigate(`/${res.data.role}/dashboard`);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container flex center h-screen w-full">
      <div className="login-bg-pattern"></div>
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="login-card w-full max-w-md bg-secondary border border-color rounded-xl p-8 shadow-2xl relative z-10"
      >
        <div className="text-center mb-8">
          <div className="inline-flex justify-center items-center w-12 h-12 rounded-lg bg-primary bg-opacity-20 text-primary mb-4">
            <User size={24} />
          </div>
          <h2 className="text-h2 mb-2">Create Account</h2>
          <p className="text-muted">Join the Enterprise Workflow Platform</p>
        </div>

        {error && (
          <div className="bg-error bg-opacity-20 border border-error text-error text-sm p-3 rounded-md mb-6 flex items-center gap-2">
            <ShieldAlert size={16} />
            {error}
          </div>
        )}

        <form onSubmit={handleRegister} className="flex-col gap-4">
          <div className="flex-col gap-1">
             <label className="text-sm font-semibold text-muted">Full Name</label>
             <input type="text" className="form-input bg-tertiary border border-color rounded p-3 w-full focus:outline-none focus:border-primary" placeholder="John Doe" value={name} onChange={e => setName(e.target.value)} required />
          </div>

          <div className="flex-col gap-1">
             <label className="text-sm font-semibold text-muted">Email Address</label>
             <input type="email" className="form-input bg-tertiary border border-color rounded p-3 w-full focus:outline-none focus:border-primary" placeholder="john@company.com" value={email} onChange={e => setEmail(e.target.value)} required />
          </div>

          <div className="flex-col gap-1">
             <label className="text-sm font-semibold text-muted">Password</label>
             <input type="password" className="form-input bg-tertiary border border-color rounded p-3 w-full focus:outline-none focus:border-primary" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required />
          </div>
          
          <div className="flex items-center gap-2 mt-2">
            <input 
              type="checkbox" 
              id="isManager" 
              checked={isManager} 
              onChange={(e) => setIsManager(e.target.checked)}
              className="rounded"
            />
            <label htmlFor="isManager" className="text-sm text-muted cursor-pointer">
              Register as Manager or Admin
            </label>
          </div>

          {isManager && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
              <div className="flex-col gap-1">
                <label className="text-sm font-semibold text-muted">Manager / Admin Code</label>
                <input type="text" className="form-input bg-tertiary border border-color rounded p-3 w-full focus:outline-none focus:border-primary" placeholder="helleyx-admin-2024" value={managerCode} onChange={e => setManagerCode(e.target.value)} required={isManager} />
              </div>
            </motion.div>
          )}

          <Button 
            type="submit" 
            variant="primary" 
            className="w-full mt-4 justify-center" 
            disabled={loading}
          >
            {loading ? <Loader2 className="animate-spin" /> : 'Register Account'}
          </Button>

          <div className="text-center mt-4">
            <p className="text-sm text-muted">
              Already have an account? <Link to="/login" className="text-primary hover-text-primary-light font-semibold">Sign in</Link>
            </p>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
