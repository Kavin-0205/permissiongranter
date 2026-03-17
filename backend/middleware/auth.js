import { verifyToken } from '../utils/authUtils.js';
import User from '../models/User.js';

const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = verifyToken(token);
      
      req.user = await User.findById(decoded.id).populate('role').select('-password');
      
      if (!req.user) {
        res.status(401);
        return next(new Error('Not authorized, user not found'));
      }
      
      next();
    } catch (error) {
      console.error('Auth middleware error:', error.message);
      res.status(401);
      next(new Error('Not authorized, token invalid'));
    }
  }

  if (!token) {
    res.status(401);
    next(new Error('Not authorized, no token'));
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (req.user && roles.includes(req.user.role.name)) {
      next();
    } else {
      res.status(403);
      next(new Error(`Not authorized. Required roles: ${roles.join(', ')}`));
    }
  };
};

const ensureAdmin = authorize('admin');
const ensureManager = authorize('manager', 'admin');

export { protect, authorize, ensureAdmin, ensureManager };
