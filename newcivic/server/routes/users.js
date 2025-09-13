const express = require('express');
const { body, validationResult, query } = require('express-validator');
const User = require('../models/User');
const Issue = require('../models/Issue');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/users
// @desc    Get users (Admin only)
// @access  Private
router.get('/', authenticateToken, requireRole(['high_admin']), [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('role').optional().isIn(['citizen', 'low_admin', 'high_admin']),
  query('search').optional().isString()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      page = 1,
      limit = 10,
      role,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build filter object
    const filter = {};

    if (role) filter.role = role;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get users
    const users = await User.find(filter)
      .select('-password')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count
    const total = await User.countDocuments(filter);

    res.json({
      users,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Server error while fetching users' });
  }
});

// @route   GET /api/users/:id
// @desc    Get single user
// @access  Private
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check access permissions
    if (req.user.role === 'citizen' && req.user._id.toString() !== req.params.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json({ user });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Server error while fetching user' });
  }
});

// @route   PUT /api/users/:id
// @desc    Update user
// @access  Private
router.put('/:id', authenticateToken, [
  body('name').optional().trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
  body('phone').optional().isMobilePhone().withMessage('Please provide a valid phone number'),
  body('assignedZones').optional().isArray().withMessage('Assigned zones must be an array'),
  body('department').optional().isString().withMessage('Department must be a string'),
  body('isActive').optional().isBoolean().withMessage('isActive must be boolean')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, phone, assignedZones, department, isActive } = req.body;

    // Check permissions
    if (req.user.role === 'citizen' && req.user._id.toString() !== req.params.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (req.user.role === 'low_admin' && req.user._id.toString() !== req.params.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Only high admins can modify admin-specific fields
    if (['assignedZones', 'department', 'isActive'].some(field => req.body[field] !== undefined) && 
        req.user.role !== 'high_admin') {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }

    const updateData = {};
    if (name) updateData.name = name;
    if (phone) updateData.phone = phone;
    if (assignedZones) updateData.assignedZones = assignedZones;
    if (department) updateData.department = department;
    if (isActive !== undefined) updateData.isActive = isActive;

    const user = await User.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      message: 'User updated successfully',
      user
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ message: 'Server error while updating user' });
  }
});

// @route   DELETE /api/users/:id
// @desc    Delete user (High admin only)
// @access  Private
router.delete('/:id', authenticateToken, requireRole(['high_admin']), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Prevent deletion of the last high admin
    if (user.role === 'high_admin') {
      const highAdminCount = await User.countDocuments({ role: 'high_admin' });
      if (highAdminCount <= 1) {
        return res.status(400).json({ message: 'Cannot delete the last high admin' });
      }
    }

    // Soft delete by deactivating
    user.isActive = false;
    await user.save();

    res.json({ message: 'User deactivated successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ message: 'Server error while deleting user' });
  }
});

// @route   GET /api/users/:id/stats
// @desc    Get user statistics
// @access  Private
router.get('/:id/stats', authenticateToken, async (req, res) => {
  try {
    const userId = req.params.id;

    // Check access permissions
    if (req.user.role === 'citizen' && req.user._id.toString() !== userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    let stats = {};

    if (user.role === 'citizen') {
      // Citizen stats
      const totalReports = await Issue.countDocuments({ reportedBy: userId });
      const resolvedReports = await Issue.countDocuments({ 
        reportedBy: userId, 
        status: 'verified_solved' 
      });
      const pendingReports = await Issue.countDocuments({ 
        reportedBy: userId, 
        status: { $in: ['pending', 'in_progress', 'pending_verification'] } 
      });

      stats = {
        totalReports,
        resolvedReports,
        pendingReports,
        resolutionRate: totalReports > 0 ? (resolvedReports / totalReports * 100).toFixed(2) : 0
      };
    } else if (user.role === 'low_admin') {
      // Low admin stats
      const assignedIssues = await Issue.countDocuments({ assignedTo: userId });
      const resolvedIssues = await Issue.countDocuments({ 
        assignedTo: userId, 
        status: 'verified_solved' 
      });
      const pendingIssues = await Issue.countDocuments({ 
        assignedTo: userId, 
        status: { $in: ['pending', 'in_progress', 'pending_verification'] } 
      });
      const escalatedIssues = await Issue.countDocuments({ 
        assignedTo: userId, 
        status: 'escalated' 
      });

      // Average resolution time
      const resolvedIssuesWithTimes = await Issue.find({
        assignedTo: userId,
        status: 'verified_solved',
        assignedAt: { $exists: true },
        verifiedAt: { $exists: true }
      }).select('assignedAt verifiedAt');

      const avgResolutionTime = resolvedIssuesWithTimes.length > 0 
        ? resolvedIssuesWithTimes.reduce((sum, issue) => {
            const resolutionTime = (issue.verifiedAt - issue.assignedAt) / (1000 * 60 * 60 * 24); // days
            return sum + resolutionTime;
          }, 0) / resolvedIssuesWithTimes.length
        : 0;

      stats = {
        assignedIssues,
        resolvedIssues,
        pendingIssues,
        escalatedIssues,
        resolutionRate: assignedIssues > 0 ? (resolvedIssues / assignedIssues * 100).toFixed(2) : 0,
        avgResolutionTime: avgResolutionTime.toFixed(1)
      };
    } else if (user.role === 'high_admin') {
      // High admin stats
      const totalIssues = await Issue.countDocuments();
      const resolvedIssues = await Issue.countDocuments({ status: 'verified_solved' });
      const pendingIssues = await Issue.countDocuments({ 
        status: { $in: ['pending', 'in_progress', 'pending_verification'] } 
      });
      const escalatedIssues = await Issue.countDocuments({ status: 'escalated' });

      // Issues by category
      const issuesByCategory = await Issue.aggregate([
        { $group: { _id: '$category', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]);

      // Issues by priority
      const issuesByPriority = await Issue.aggregate([
        { $group: { _id: '$priority', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]);

      stats = {
        totalIssues,
        resolvedIssues,
        pendingIssues,
        escalatedIssues,
        resolutionRate: totalIssues > 0 ? (resolvedIssues / totalIssues * 100).toFixed(2) : 0,
        issuesByCategory,
        issuesByPriority
      };
    }

    res.json({ stats });
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({ message: 'Server error while fetching user stats' });
  }
});

module.exports = router;
