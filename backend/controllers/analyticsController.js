import Execution from '../models/Execution.js';
import User from '../models/User.js';
import { ExecutionStatus } from '../constants/enums.js';

// @desc    Get dashboard analytics (Total executions, success rate, etc.)
// @route   GET /api/analytics
// @access  Private (Admin/Manager)
export const getAnalytics = async (req, res, next) => {
  try {
    const totalExecutions = await Execution.countDocuments();
    const activeUsers = await User.countDocuments();

    // Single aggregation for status counts and average completion time
    const statsResult = await Execution.aggregate([
      {
        $facet: {
          statusBreakdown: [
            {
              $group: {
                _id: '$status',
                count: { $sum: 1 }
              }
            }
          ],
          avgCompletionTime: [
            { $match: { status: ExecutionStatus.COMPLETED } },
            {
              $project: {
                duration: { $subtract: ['$updatedAt', '$createdAt'] }
              }
            },
            {
              $group: {
                _id: null,
                avgTime: { $avg: '$duration' }
              }
            }
          ],
          deptStats: [
            {
              // Join with User to get department if not in payload
              $lookup: {
                from: 'users',
                localField: 'requesterId',
                foreignField: '_id',
                as: 'requester'
              }
            },
            { $unwind: '$requester' },
            {
              $project: {
                department: {
                  $ifNull: ['$payloadData.department', '$requester.department', 'Unassigned']
                }
              }
            },
            {
              $group: {
                _id: '$department',
                count: { $sum: 1 }
              }
            },
            { $sort: { count: -1 } }
          ]
        }
      }
    ]);

    const stats = statsResult[0];
    
    // Format status breakdown
    const statusMap = {
      completed: 0,
      failed: 0,
      running: 0, // renamed from in_progress
      waiting: 0  // renamed from paused_for_approval
    };

    stats.statusBreakdown.forEach(s => {
      if (s._id === ExecutionStatus.COMPLETED) statusMap.completed = s.count;
      else if (s._id === ExecutionStatus.FAILED || s._id === ExecutionStatus.CANCELED) statusMap.failed += s.count;
      else if (s._id === ExecutionStatus.WAITING_FOR_APPROVAL) statusMap.waiting = s.count;
      else statusMap.running += s.count;
    });

    const failedCount = statusMap.failed;
    const health = totalExecutions > 0 ? ((totalExecutions - failedCount) / totalExecutions) * 100 : 100;

    res.json({
      totalExecutions,
      completedExecutions: statusMap.completed,
      pendingApprovals: statusMap.waiting,
      failedExecutions: failedCount,
      avgCompletionTimeMs: stats.avgCompletionTime[0]?.avgTime || 0,
      systemHealth: health.toFixed(2),
      activeUsers,
      requestsByDepartment: stats.deptStats.map(d => ({ name: d._id, count: d.count })),
      statusBreakdown: statusMap
    });
  } catch (error) {
    next(error);
  }
};
