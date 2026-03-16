import Execution from '../models/Execution.js';
import Workflow from '../models/Workflow.js';
import User from '../models/User.js';

// @desc    Get dashboard analytics (Total executions, success rate, etc.)
// @route   GET /api/analytics
// @access  Private (Admin/Manager)
export const getAnalytics = async (req, res, next) => {
  try {
    const totalExecutions = await Execution.countDocuments();
    const completedExecutions = await Execution.countDocuments({ status: 'completed' });
    const pendingApprovals = await Execution.countDocuments({ status: 'paused_for_approval' });
    const failedExecutions = await Execution.countDocuments({ status: 'failed' });
    
    // Calculate average completion time
    const completedList = await Execution.find({ status: 'completed' }).select('createdAt updatedAt');
    let totalTime = 0;
    completedList.forEach(ex => {
      totalTime += (new Date(ex.updatedAt) - new Date(ex.createdAt));
    });
    
    const avgTimeMs = completedList.length > 0 ? totalTime / completedList.length : 0;
    
    // System health rough estimate
    const health = totalExecutions > 0 ? ((totalExecutions - failedExecutions) / totalExecutions) * 100 : 100;

    const activeUsers = await User.countDocuments();

    res.json({
      totalExecutions,
      completedExecutions,
      pendingApprovals,
      failedExecutions,
      avgCompletionTimeMs: avgTimeMs,
      systemHealth: health.toFixed(2),
      activeUsers
    });
  } catch (error) {
    next(error);
  }
};
