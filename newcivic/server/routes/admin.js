const express = require('express');
const { body, validationResult, query } = require('express-validator');
const Issue = require('../models/Issue');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { authenticateToken, requireHighAdmin } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/admin/dashboard
// @desc    Get admin dashboard data
// @access  Private (Admin only)
router.get('/dashboard', authenticateToken, requireHighAdmin, async (req, res) => {
  try {
    // Get overview statistics
    const totalIssues = await Issue.countDocuments();
    const pendingIssues = await Issue.countDocuments({ 
      status: { $in: ['pending', 'in_progress'] } 
    });
    const resolvedIssues = await Issue.countDocuments({ 
      status: 'verified_solved' 
    });
    const escalatedIssues = await Issue.countDocuments({ 
      status: 'escalated' 
    });

    // Get issues by category
    const issuesByCategory = await Issue.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Get issues by priority
    const issuesByPriority = await Issue.aggregate([
      { $group: { _id: '$priority', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Get issues by zone
    const issuesByZone = await Issue.aggregate([
      { $group: { _id: '$location.zone', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Get recent issues
    const recentIssues = await Issue.find()
      .populate('reportedBy', 'name email')
      .populate('assignedTo', 'name email')
      .sort({ createdAt: -1 })
      .limit(10);

    // Get admin performance
    const adminPerformance = await User.aggregate([
      { $match: { role: 'low_admin' } },
      {
        $lookup: {
          from: 'issues',
          localField: '_id',
          foreignField: 'assignedTo',
          as: 'assignedIssues'
        }
      },
      {
        $lookup: {
          from: 'issues',
          localField: '_id',
          foreignField: 'assignedTo',
          as: 'resolvedIssues',
          pipeline: [
            { $match: { status: 'verified_solved' } }
          ]
        }
      },
      {
        $project: {
          name: 1,
          email: 1,
          assignedZones: 1,
          department: 1,
          totalAssigned: { $size: '$assignedIssues' },
          totalResolved: { $size: '$resolvedIssues' },
          resolutionRate: {
            $cond: {
              if: { $gt: [{ $size: '$assignedIssues' }, 0] },
              then: {
                $multiply: [
                  { $divide: [{ $size: '$resolvedIssues' }, { $size: '$assignedIssues' }] },
                  100
                ]
              },
              else: 0
            }
          }
        }
      },
      { $sort: { resolutionRate: -1 } }
    ]);

    // Get issues requiring attention (escalated or overdue)
    const issuesRequiringAttention = await Issue.find({
      $or: [
        { status: 'escalated' },
        { 
          status: { $in: ['pending', 'in_progress'] },
          assignedAt: { $exists: true },
          $expr: {
            $gte: [
              { $divide: [{ $subtract: ['$$NOW', '$assignedAt'] }, 1000 * 60 * 60 * 24] },
              5
            ]
          }
        }
      ]
    })
    .populate('reportedBy', 'name email')
    .populate('assignedTo', 'name email')
    .sort({ createdAt: -1 });

    res.json({
      overview: {
        totalIssues,
        pendingIssues,
        resolvedIssues,
        escalatedIssues,
        resolutionRate: totalIssues > 0 ? ((resolvedIssues / totalIssues) * 100).toFixed(2) : 0
      },
      issuesByCategory,
      issuesByPriority,
      issuesByZone,
      recentIssues,
      adminPerformance,
      issuesRequiringAttention
    });
  } catch (error) {
    console.error('Get dashboard data error:', error);
    res.status(500).json({ message: 'Server error while fetching dashboard data' });
  }
});

// @route   GET /api/admin/analytics
// @desc    Get detailed analytics
// @access  Private (High admin only)
router.get('/analytics', authenticateToken, requireHighAdmin, [
  query('startDate').optional().isISO8601().withMessage('Start date must be valid'),
  query('endDate').optional().isISO8601().withMessage('End date must be valid'),
  query('zone').optional().isString().withMessage('Zone must be string'),
  query('category').optional().isString().withMessage('Category must be string')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { startDate, endDate, zone, category } = req.query;

    // Build date filter
    const dateFilter = {};
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) dateFilter.createdAt.$gte = new Date(startDate);
      if (endDate) dateFilter.createdAt.$lte = new Date(endDate);
    }

    // Build additional filters
    if (zone) dateFilter['location.zone'] = zone;
    if (category) dateFilter.category = category;

    // Issues over time
    const issuesOverTime = await Issue.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
    ]);

    // Resolution time analysis
    const resolutionTimeAnalysis = await Issue.aggregate([
      {
        $match: {
          ...dateFilter,
          status: 'verified_solved',
          assignedAt: { $exists: true },
          verifiedAt: { $exists: true }
        }
      },
      {
        $project: {
          resolutionTimeDays: {
            $divide: [
              { $subtract: ['$verifiedAt', '$assignedAt'] },
              1000 * 60 * 60 * 24
            ]
          },
          category: 1,
          priority: 1,
          'location.zone': 1
        }
      },
      {
        $group: {
          _id: null,
          avgResolutionTime: { $avg: '$resolutionTimeDays' },
          minResolutionTime: { $min: '$resolutionTimeDays' },
          maxResolutionTime: { $max: '$resolutionTimeDays' },
          medianResolutionTime: { $percentile: { input: '$resolutionTimeDays', p: [0.5] } }
        }
      }
    ]);

    // Category performance
    const categoryPerformance = await Issue.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: '$category',
          total: { $sum: 1 },
          resolved: {
            $sum: { $cond: [{ $eq: ['$status', 'verified_solved'] }, 1, 0] }
          },
          avgResolutionTime: {
            $avg: {
              $cond: [
                { $eq: ['$status', 'verified_solved'] },
                {
                  $divide: [
                    { $subtract: ['$verifiedAt', '$assignedAt'] },
                    1000 * 60 * 60 * 24
                  ]
                },
                null
              ]
            }
          }
        }
      },
      {
        $project: {
          category: '$_id',
          total: 1,
          resolved: 1,
          resolutionRate: {
            $multiply: [{ $divide: ['$resolved', '$total'] }, 100]
          },
          avgResolutionTime: 1
        }
      },
      { $sort: { total: -1 } }
    ]);

    // Zone performance
    const zonePerformance = await Issue.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: '$location.zone',
          total: { $sum: 1 },
          resolved: {
            $sum: { $cond: [{ $eq: ['$status', 'verified_solved'] }, 1, 0] }
          },
          avgResolutionTime: {
            $avg: {
              $cond: [
                { $eq: ['$status', 'verified_solved'] },
                {
                  $divide: [
                    { $subtract: ['$verifiedAt', '$assignedAt'] },
                    1000 * 60 * 60 * 24
                  ]
                },
                null
              ]
            }
          }
        }
      },
      {
        $project: {
          zone: '$_id',
          total: 1,
          resolved: 1,
          resolutionRate: {
            $multiply: [{ $divide: ['$resolved', '$total'] }, 100]
          },
          avgResolutionTime: 1
        }
      },
      { $sort: { total: -1 } }
    ]);

    // Admin performance details
    const adminPerformanceDetails = await User.aggregate([
      { $match: { role: 'low_admin' } },
      {
        $lookup: {
          from: 'issues',
          localField: '_id',
          foreignField: 'assignedTo',
          as: 'assignedIssues',
          pipeline: [
            { $match: dateFilter }
          ]
        }
      },
      {
        $lookup: {
          from: 'issues',
          localField: '_id',
          foreignField: 'assignedTo',
          as: 'resolvedIssues',
          pipeline: [
            { $match: { ...dateFilter, status: 'verified_solved' } }
          ]
        }
      },
      {
        $project: {
          name: 1,
          email: 1,
          assignedZones: 1,
          department: 1,
          totalAssigned: { $size: '$assignedIssues' },
          totalResolved: { $size: '$resolvedIssues' },
          resolutionRate: {
            $cond: {
              if: { $gt: [{ $size: '$assignedIssues' }, 0] },
              then: {
                $multiply: [
                  { $divide: [{ $size: '$resolvedIssues' }, { $size: '$assignedIssues' }] },
                  100
                ]
              },
              else: 0
            }
          },
          avgResolutionTime: {
            $avg: {
              $map: {
                input: '$resolvedIssues',
                as: 'issue',
                in: {
                  $divide: [
                    { $subtract: ['$$issue.verifiedAt', '$$issue.assignedAt'] },
                    1000 * 60 * 60 * 24
                  ]
                }
              }
            }
          }
        }
      },
      { $sort: { resolutionRate: -1 } }
    ]);

    res.json({
      issuesOverTime,
      resolutionTimeAnalysis: resolutionTimeAnalysis[0] || {},
      categoryPerformance,
      zonePerformance,
      adminPerformanceDetails
    });
  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({ message: 'Server error while fetching analytics' });
  }
});

// @route   POST /api/admin/escalate-issue
// @desc    Manually escalate an issue
// @access  Private (High admin only)
router.post('/escalate-issue', authenticateToken, requireHighAdmin, [
  body('issueId').isMongoId().withMessage('Valid issue ID is required'),
  body('reason').trim().isLength({ min: 5 }).withMessage('Reason must be at least 5 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { issueId, reason } = req.body;

    const issue = await Issue.findById(issueId);
    if (!issue) {
      return res.status(404).json({ message: 'Issue not found' });
    }

    if (issue.status === 'escalated') {
      return res.status(400).json({ message: 'Issue is already escalated' });
    }

    // Update issue status
    issue.addStatusChange('escalated', req.user._id, reason);
    issue.escalatedAt = new Date();
    issue.escalationReason = reason;

    await issue.save();

    // Create notifications
    const notifications = [];

    // Notify assigned admin if exists
    if (issue.assignedTo) {
      notifications.push({
        type: 'issue_escalated',
        title: 'Issue Escalated',
        message: `Issue "${issue.title}" has been escalated: ${reason}`,
        relatedIssue: issue._id,
        recipient: issue.assignedTo,
        priority: 'high'
      });
    }

    // Notify reporter
    notifications.push({
      type: 'issue_escalated',
      title: 'Issue Escalated',
      message: `Your reported issue "${issue.title}" has been escalated for priority attention`,
      relatedIssue: issue._id,
      recipient: issue.reportedBy,
      priority: 'high'
    });

    if (notifications.length > 0) {
      await Notification.insertMany(notifications);
    }

    res.json({
      message: 'Issue escalated successfully',
      issue: await issue.populate(['reportedBy', 'assignedTo'], 'name email')
    });
  } catch (error) {
    console.error('Escalate issue error:', error);
    res.status(500).json({ message: 'Server error while escalating issue' });
  }
});

// @route   POST /api/admin/reassign-issue
// @desc    Reassign an issue to another admin
// @access  Private (High admin only)
router.post('/reassign-issue', authenticateToken, requireHighAdmin, [
  body('issueId').isMongoId().withMessage('Valid issue ID is required'),
  body('newAssigneeId').isMongoId().withMessage('Valid new assignee ID is required'),
  body('reason').optional().trim().isString().withMessage('Reason must be a string')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { issueId, newAssigneeId, reason } = req.body;

    const issue = await Issue.findById(issueId);
    if (!issue) {
      return res.status(404).json({ message: 'Issue not found' });
    }

    const newAssignee = await User.findById(newAssigneeId);
    if (!newAssignee || !['low_admin', 'high_admin'].includes(newAssignee.role)) {
      return res.status(400).json({ message: 'Invalid assignee' });
    }

    const previousAssignee = issue.assignedTo;

    // Update issue
    issue.assignedTo = newAssigneeId;
    issue.assignedDepartment = newAssignee.department;
    issue.assignedAt = new Date();

    issue.addStatusChange('in_progress', req.user._id, `Reassigned${reason ? ': ' + reason : ''}`);

    await issue.save();

    // Create notifications
    const notifications = [];

    // Notify new assignee
    notifications.push({
      type: 'issue_assigned',
      title: 'Issue Reassigned to You',
      message: `Issue "${issue.title}" has been reassigned to you`,
      relatedIssue: issue._id,
      recipient: newAssigneeId,
      priority: issue.priority === 'urgent' ? 'high' : 'medium'
    });

    // Notify previous assignee if different
    if (previousAssignee && previousAssignee.toString() !== newAssigneeId.toString()) {
      notifications.push({
        type: 'issue_updated',
        title: 'Issue Reassigned',
        message: `Issue "${issue.title}" has been reassigned to another admin`,
        relatedIssue: issue._id,
        recipient: previousAssignee,
        priority: 'medium'
      });
    }

    if (notifications.length > 0) {
      await Notification.insertMany(notifications);
    }

    res.json({
      message: 'Issue reassigned successfully',
      issue: await issue.populate(['reportedBy', 'assignedTo'], 'name email')
    });
  } catch (error) {
    console.error('Reassign issue error:', error);
    res.status(500).json({ message: 'Server error while reassigning issue' });
  }
});

module.exports = router;
