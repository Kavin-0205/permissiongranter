import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { User, ShieldCheck, ArrowRight } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useTheme } from '../components/layout/ThemeContext';
import { apiClient } from '../api/client';
import './Login.css';

import { useNavigate } from 'react-router-dom';

export function Login({ setUser }) {
  const { isDark } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await apiClient.post('/auth/login', {
        email,
        password
      });
      localStorage.setItem('user', JSON.stringify(res.data));
      apiClient.defaults.headers.common['Authorization'] = `Bearer ${res.data.token}`;
      setUser(res.data);
    } catch (err) {
      console.error('Login failed', err);
      alert('Login Failed: ' + (err.response?.data?.message || err.message));
    }
  };

  return (
    <div className={`login-page ${isDark ? 'dark' : ''}`}>
      <div className="login-container">
        
        {/* Left Side - Brand/marketing */}
        <div className="login-brand">
          <div className="brand-content">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="brand-logo">WA</div>
              <h1 className="text-h1 mt-6" style={{ color: 'white' }}>Automate Your World</h1>
              <p className="text-lg mt-4" style={{ color: 'rgba(255,255,255,0.8)' }}>
                The modern, highly dynamic SaaS platform for building and managing 
                complex workflows seamlessly. Join thousands of users optimizing their daily operations.
              </p>
            </motion.div>
          </div>
          <div className="brand-bg-pattern"></div>
        </div>

        {/* Right Side - Login Form */}
        <div className="login-form-container">
          <motion.div 
            className="login-form-wrapper"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="mb-8">
              <h2 className="text-h2">Welcome back</h2>
              <p className="text-muted mt-2">Sign in to your account to continue</p>
            </div>



            <form onSubmit={handleLogin} className="flex-col gap-4">
              <div className="flex-col gap-1">
                 <label className="text-sm font-semibold text-muted">Email Address</label>
                 <input type="email" className="form-input bg-tertiary border border-color rounded p-3 w-full focus:outline-none focus:border-primary" placeholder="name@company.com" value={email} onChange={e => setEmail(e.target.value)} required />
              </div>

              <div className="flex-col gap-1">
                 <label className="text-sm font-semibold text-muted">Password</label>
                 <input type="password" className="form-input bg-tertiary border border-color rounded p-3 w-full focus:outline-none focus:border-primary" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required />
              </div>

              <div className="flex justify-between items-center mt-2 mb-4">
                <label className="flex items-center gap-2 text-sm text-muted cursor-pointer">
                  <input type="checkbox" className="custom-checkbox rounded" />
                  Remember me
                </label>
                <span className="text-sm font-semibold text-primary hover-underline cursor-pointer">
                  Forgot password?
                </span>
              </div>

              <Button type="submit" variant="primary" size="lg" className="w-full justify-center">
                Sign In <ArrowRight size={18} className="ml-2" />
              </Button>
            </form>
            
            <p className="text-center text-sm text-muted mt-8">
              Don't have an account? <span onClick={() => navigate('/register')} className="text-primary font-semibold cursor-pointer hover-underline">Sign up</span>
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
