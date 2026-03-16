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
    
    // Aggregate requests by department
    // We'll aggregate from Execution payloadData.department first, then fallback to requester's department if available
    const allExecutions = await Execution.find().populate('requesterId', 'department');
    const deptStats = {};
    const statusStats = { completed: 0, failed: 0, in_progress: 0, paused: 0 };

    allExecutions.forEach(ex => {
      const dept = ex.payloadData?.department || ex.requesterId?.department || 'Unassigned';
      deptStats[dept] = (deptStats[dept] || 0) + 1;

      if (ex.status === 'completed') statusStats.completed++;
      else if (['failed', 'canceled'].includes(ex.status)) statusStats.failed++;
      else if (ex.status === 'paused_for_approval') statusStats.paused++;
      else statusStats.in_progress++;
    });

    res.json({
      totalExecutions,
      completedExecutions,
      pendingApprovals,
      failedExecutions,
      avgCompletionTimeMs: avgTimeMs,
      systemHealth: health.toFixed(2),
      activeUsers,
      requestsByDepartment: Object.entries(deptStats).map(([name, count]) => ({ name, count })),
      statusBreakdown: statusStats
    });
  } catch (error) {
    next(error);
  }
};
