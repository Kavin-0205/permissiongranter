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
  // Theme is now forced to light/white mixed
  const {} = useTheme();
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
    <div className="login-page">
      <motion.div
        className="login-card"
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
      >
        {/* Logo */}
        <div className="login-logo-wrap">
          <div className="brand-logo">WA</div>
        </div>

        <div className="mb-8 text-center">
          <h2 className="text-h2">Welcome back</h2>
          <p className="text-muted mt-2">Sign in to your account to continue</p>
        </div>

        <form onSubmit={handleLogin} className="flex-col gap-5">
          <div className="login-field">
            <input
              id="login-email"
              type="email"
              className="login-input"
              placeholder=" "
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
            <label htmlFor="login-email" className="login-label">Email Address</label>
          </div>

          <div className="login-field">
            <input
              id="login-password"
              type="password"
              className="login-input"
              placeholder=" "
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
            <label htmlFor="login-password" className="login-label">Password</label>
          </div>

          <div className="flex justify-between items-center">
            <label className="flex items-center gap-2 text-sm text-muted cursor-pointer">
              <input type="checkbox" className="custom-checkbox" />
              Remember me
            </label>
            <span className="text-sm font-semibold text-primary hover-underline cursor-pointer">
              Forgot password?
            </span>
          </div>

          <Button type="submit" variant="primary" size="lg" className="w-full justify-center mt-2">
            Sign In <ArrowRight size={18} className="ml-2" />
          </Button>
        </form>

        <p className="text-center text-xs text-muted mt-8 opacity-60">
          Access is managed by your administrator.
        </p>
      </motion.div>
    </div>
  );
}
