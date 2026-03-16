import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ShieldAlert, Loader2, UserPlus } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { apiClient } from '../api/client';
import { useTheme } from '../components/layout/ThemeContext';
import './Register.css'; // New dedicated styling

export function Register({ setUser }) {
  const { isDark } = useTheme();
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
    <div className={`register-page ${isDark ? 'dark' : ''}`}>
      <div className="register-mesh-bg"></div>
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="register-glass-card"
      >
        <div className="text-center mb-8">
          <div className="inline-flex justify-center items-center w-14 h-14 rounded-full bg-gradient-to-tr from-primary to-secondary text-white mb-6 shadow-lg">
            <UserPlus size={28} />
          </div>
          <h2 className="text-h2 mb-2 font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
            Join Platform
          </h2>
          <p className="text-muted">Create your enterprise account</p>
        </div>

        {error && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }} 
            animate={{ opacity: 1, y: 0 }}
            className="bg-error bg-opacity-10 border border-error text-error text-sm p-4 rounded-lg mb-6 flex items-center gap-3"
          >
            <ShieldAlert size={18} />
            <span className="font-medium">{error}</span>
          </motion.div>
        )}

        <form onSubmit={handleRegister} className="flex-col gap-5">
          <div>
             <label className="register-label">Full Name</label>
             <input type="text" className="register-form-input" placeholder="e.g. Jane Doe" value={name} onChange={e => setName(e.target.value)} required />
          </div>

          <div>
             <label className="register-label">Email Address</label>
             <input type="email" className="register-form-input" placeholder="name@company.com" value={email} onChange={e => setEmail(e.target.value)} required />
          </div>

          <div>
             <label className="register-label">Create Password</label>
             <input type="password" className="register-form-input" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required />
          </div>
          
          <div className="flex items-center gap-3 mt-2 p-3 rounded-lg border border-color bg-primary bg-opacity-5 cursor-pointer hover:bg-opacity-10 transition-colors" onClick={() => setIsManager(!isManager)}>
            <input 
              type="checkbox" 
              id="isManager" 
              checked={isManager} 
              onChange={(e) => setIsManager(e.target.checked)}
              className="w-4 h-4 rounded text-primary focus:ring-primary border-gray-300 cursor-pointer"
              onClick={(e) => e.stopPropagation()}
            />
            <label htmlFor="isManager" className="text-sm font-medium text-primary-text cursor-pointer select-none">
              Register with an Invite Code (Manager/Admin)
            </label>
          </div>

          {isManager && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="overflow-hidden">
              <div className="pt-2">
                <label className="register-label text-primary">Security Code</label>
                <input type="text" className="register-form-input border-primary" placeholder="helleyx-admin-2024" value={managerCode} onChange={e => setManagerCode(e.target.value)} required={isManager} />
              </div>
            </motion.div>
          )}

          <Button 
            type="submit" 
            variant="primary" 
            className="w-full mt-6 py-3 text-base justify-center shadow-md hover:shadow-lg transition-all" 
            disabled={loading}
          >
            {loading ? <Loader2 className="animate-spin" /> : 'Create Account'}
          </Button>

          <div className="text-center mt-6 pt-6 border-t border-color text-sm text-muted">
              Already have an account? <Link to="/login" className="text-primary font-bold ml-1 hover:underline">Sign in instead</Link>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
