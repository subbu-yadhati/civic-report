const express = require('express');
const { body, validationResult, query } = require('express-validator');
const Issue = require('../models/Issue');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { uploadToCloudinary } = require('../utils/cloudinary');

const router = express.Router();

// @route   POST /api/issues
// @desc    Create a new issue
// @access  Private
router.post('/', authenticateToken, [
  body('title').trim().isLength({ min: 5 }).withMessage('Title must be at least 5 characters'),
  body('description').trim().isLength({ min: 10 }).withMessage('Description must be at least 10 characters'),
  body('category').isIn(['pothole', 'streetlight', 'garbage', 'water_leak', 'traffic_signal', 'road_damage', 'sewage', 'parks', 'other']).withMessage('Invalid category'),
  body('location.coordinates').isArray({ min: 2, max: 2 }).withMessage('Coordinates must be an array of 2 numbers'),
  body('location.address').trim().notEmpty().withMessage('Address is required'),
  body('location.zone').trim().notEmpty().withMessage('Zone is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      title,
      description,
      category,
      location,
      images = [],
      videos = [],
      priority = 'medium',
      tags = []
    } = req.body;

    // Create new issue
    const issue = new Issue({
      title,
      description,
      category,
      location,
      images,
      videos,
      priority,
      tags,
      reportedBy: req.user._id
    });

    await issue.save();

    // Auto-assign based on category and zone
    await autoAssignIssue(issue);

    // Create notification for admins
    await createNotification({
      type: 'issue_created',
      title: 'New Issue Reported',
      message: `A new ${category} issue has been reported in ${location.zone}`,
      relatedIssue: issue._id,
      priority: priority === 'urgent' ? 'high' : 'medium'
    }, 'admin');

    // Emit real-time update
    req.io.emit('new_issue', {
      issue: await issue.populate('reportedBy', 'name email')
    });

    res.status(201).json({
      message: 'Issue reported successfully',
      issue: await issue.populate('reportedBy', 'name email')
    });
  } catch (error) {
    console.error('Create issue error:', error);
    res.status(500).json({ message: 'Server error while creating issue' });
  }
});

// @route   GET /api/issues
// @desc    Get issues with filtering and pagination
// @access  Private
router.get('/', authenticateToken, [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('status').optional().isIn(['pending', 'in_progress', 'pending_verification', 'verified_solved', 'escalated', 'reopened']),
  query('category').optional().isIn(['pothole', 'streetlight', 'garbage', 'water_leak', 'traffic_signal', 'road_damage', 'sewage', 'parks', 'other']),
  query('priority').optional().isIn(['low', 'medium', 'high', 'urgent']),
  query('zone').optional().isString()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      page = 1,
      limit = 10,
      status,
      category,
      priority,
      zone,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build filter object
    const filter = {};

    // Role-based filtering
    if (req.user.role === 'citizen') {
      filter.reportedBy = req.user._id;
    } else if (req.user.role === 'low_admin') {
      filter.$or = [
        { assignedTo: req.user._id },
        { assignedDepartment: req.user.department },
        { 'location.zone': { $in: req.user.assignedZones } }
      ];
    }
    // High admins can see all issues

    if (status) filter.status = status;
    if (category) filter.category = category;
    if (priority) filter.priority = priority;
    if (zone) filter['location.zone'] = zone;

    if (search) {
      filter.$text = { $search: search };
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get issues
    const issues = await Issue.find(filter)
      .populate('reportedBy', 'name email')
      .populate('assignedTo', 'name email')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count
    const total = await Issue.countDocuments(filter);

    res.json({
      issues,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get issues error:', error);
    res.status(500).json({ message: 'Server error while fetching issues' });
  }
});

// @route   GET /api/issues/:id
// @desc    Get single issue
// @access  Private
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const issue = await Issue.findById(req.params.id)
      .populate('reportedBy', 'name email phone')
      .populate('assignedTo', 'name email phone')
      .populate('statusHistory.changedBy', 'name email')
      .populate('comments.author', 'name email role');

    if (!issue) {
      return res.status(404).json({ message: 'Issue not found' });
    }

    // Check access permissions
    if (req.user.role === 'citizen' && issue.reportedBy._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (req.user.role === 'low_admin') {
      const hasAccess = issue.assignedTo?._id.toString() === req.user._id.toString() ||
                       issue.assignedDepartment === req.user.department ||
                       req.user.assignedZones.includes(issue.location.zone);
      
      if (!hasAccess) {
        return res.status(403).json({ message: 'Access denied' });
      }
    }

    res.json({ issue });
  } catch (error) {
    console.error('Get issue error:', error);
    res.status(500).json({ message: 'Server error while fetching issue' });
  }
});

// @route   PUT /api/issues/:id/assign
// @desc    Assign issue to admin
// @access  Private (Admin only)
router.put('/:id/assign', authenticateToken, requireRole(['low_admin', 'high_admin']), [
  body('assignedTo').isMongoId().withMessage('Valid assignedTo ID is required'),
  body('assignedDepartment').optional().isString().withMessage('Department must be a string'),
  body('dueDate').optional().isISO8601().withMessage('Due date must be a valid date')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { assignedTo, assignedDepartment, dueDate } = req.body;

    const issue = await Issue.findById(req.params.id);
    if (!issue) {
      return res.status(404).json({ message: 'Issue not found' });
    }

    // Check if user can assign this issue
    if (req.user.role === 'low_admin' && !canAssignIssue(req.user, issue)) {
      return res.status(403).json({ message: 'You cannot assign this issue' });
    }

    // Verify assigned user exists and has appropriate role
    const assignedUser = await User.findById(assignedTo);
    if (!assignedUser || !['low_admin', 'high_admin'].includes(assignedUser.role)) {
      return res.status(400).json({ message: 'Invalid assigned user' });
    }

    // Update issue
    issue.assignedTo = assignedTo;
    issue.assignedDepartment = assignedDepartment || assignedUser.department;
    issue.assignedAt = new Date();
    issue.dueDate = dueDate ? new Date(dueDate) : undefined;

    issue.addStatusChange('in_progress', req.user._id, 'Issue assigned');

    await issue.save();

    // Create notification for assigned user
    await createNotification({
      type: 'issue_assigned',
      title: 'Issue Assigned',
      message: `You have been assigned a new ${issue.category} issue`,
      relatedIssue: issue._id,
      priority: issue.priority === 'urgent' ? 'high' : 'medium'
    }, assignedUser._id);

    // Emit real-time update
    req.io.emit('issue_updated', {
      issue: await issue.populate('assignedTo', 'name email')
    });

    res.json({
      message: 'Issue assigned successfully',
      issue: await issue.populate('assignedTo', 'name email')
    });
  } catch (error) {
    console.error('Assign issue error:', error);
    res.status(500).json({ message: 'Server error while assigning issue' });
  }
});

// @route   PUT /api/issues/:id/status
// @desc    Update issue status
// @access  Private
router.put('/:id/status', authenticateToken, [
  body('status').isIn(['pending', 'in_progress', 'pending_verification', 'verified_solved', 'escalated', 'reopened']).withMessage('Invalid status'),
  body('reason').optional().isString().withMessage('Reason must be a string')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { status, reason } = req.body;

    const issue = await Issue.findById(req.params.id);
    if (!issue) {
      return res.status(404).json({ message: 'Issue not found' });
    }

    // Check permissions
    if (!canUpdateStatus(req.user, issue, status)) {
      return res.status(403).json({ message: 'You cannot update this issue status' });
    }

    // Validate status transition
    if (!isValidStatusTransition(issue.status, status, req.user.role)) {
      return res.status(400).json({ message: 'Invalid status transition' });
    }

    // Update status
    issue.addStatusChange(status, req.user._id, reason);

    // Handle special status changes
    if (status === 'pending_verification') {
      issue.resolvedAt = new Date();
    } else if (status === 'verified_solved') {
      issue.verifiedAt = new Date();
    } else if (status === 'escalated') {
      issue.escalatedAt = new Date();
    }

    await issue.save();

    // Create notifications
    await handleStatusChangeNotifications(issue, status, req.user);

    // Emit real-time update
    req.io.emit('issue_updated', {
      issue: await issue.populate(['reportedBy', 'assignedTo'], 'name email')
    });

    res.json({
      message: 'Status updated successfully',
      issue: await issue.populate(['reportedBy', 'assignedTo'], 'name email')
    });
  } catch (error) {
    console.error('Update status error:', error);
    res.status(500).json({ message: 'Server error while updating status' });
  }
});

// @route   POST /api/issues/:id/comments
// @desc    Add comment to issue
// @access  Private
router.post('/:id/comments', authenticateToken, [
  body('text').trim().isLength({ min: 1 }).withMessage('Comment text is required'),
  body('isInternal').optional().isBoolean().withMessage('isInternal must be boolean')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { text, isInternal = false } = req.body;

    const issue = await Issue.findById(req.params.id);
    if (!issue) {
      return res.status(404).json({ message: 'Issue not found' });
    }

    // Check access
    if (!hasIssueAccess(req.user, issue)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Add comment
    issue.comments.push({
      text,
      author: req.user._id,
      isInternal: isInternal && ['low_admin', 'high_admin'].includes(req.user.role)
    });

    await issue.save();

    // Create notification
    await createNotification({
      type: 'comment_added',
      title: 'New Comment',
      message: `A new comment was added to issue: ${issue.title}`,
      relatedIssue: issue._id
    }, 'participants', issue);

    res.json({
      message: 'Comment added successfully',
      comment: issue.comments[issue.comments.length - 1]
    });
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({ message: 'Server error while adding comment' });
  }
});

// @route   POST /api/issues/:id/work-proof
// @desc    Upload work proof
// @access  Private (Admin only)
router.post('/:id/work-proof', authenticateToken, requireRole(['low_admin', 'high_admin']), [
  body('description').optional().isString().withMessage('Description must be a string')
], async (req, res) => {
  try {
    const { description } = req.body;

    const issue = await Issue.findById(req.params.id);
    if (!issue) {
      return res.status(404).json({ message: 'Issue not found' });
    }

    // Check if user can add work proof
    if (!canAddWorkProof(req.user, issue)) {
      return res.status(403).json({ message: 'You cannot add work proof for this issue' });
    }

    // Handle file upload (assuming files are in req.files from multer middleware)
    const workProof = [];
    
    if (req.files) {
      for (const file of req.files) {
        const result = await uploadToCloudinary(file.path, 'work-proof');
        workProof.push({
          url: result.secure_url,
          publicId: result.public_id,
          description: description || file.originalname,
          uploadedBy: req.user._id
        });
      }
    }

    issue.workProof.push(...workProof);
    await issue.save();

    res.json({
      message: 'Work proof uploaded successfully',
      workProof: issue.workProof.slice(-workProof.length)
    });
  } catch (error) {
    console.error('Upload work proof error:', error);
    res.status(500).json({ message: 'Server error while uploading work proof' });
  }
});

// Helper functions
async function autoAssignIssue(issue) {
  try {
    // Find appropriate admin based on category and zone
    const admin = await User.findOne({
      role: 'low_admin',
      assignedZones: issue.location.zone,
      isActive: true
    }).sort({ 'assignedIssues': 1 }); // Assign to admin with least issues

    if (admin) {
      issue.assignedTo = admin._id;
      issue.assignedDepartment = admin.department;
      issue.assignedAt = new Date();
      issue.status = 'in_progress';
      
      await issue.save();

      // Create notification
      await createNotification({
        type: 'issue_assigned',
        title: 'Issue Auto-Assigned',
        message: `A new ${issue.category} issue has been auto-assigned to you`,
        relatedIssue: issue._id,
        priority: issue.priority === 'urgent' ? 'high' : 'medium'
      }, admin._id);
    }
  } catch (error) {
    console.error('Auto-assign error:', error);
  }
}

async function createNotification(notificationData, recipient, issue = null) {
  try {
    if (recipient === 'admin') {
      // Send to all admins
      const admins = await User.find({ role: { $in: ['low_admin', 'high_admin'] } });
      const notifications = admins.map(admin => ({
        ...notificationData,
        recipient: admin._id
      }));
      await Notification.insertMany(notifications);
    } else if (recipient === 'participants' && issue) {
      // Send to issue participants
      const participants = [issue.reportedBy];
      if (issue.assignedTo) participants.push(issue.assignedTo);
      
      const notifications = participants.map(participant => ({
        ...notificationData,
        recipient: participant
      }));
      await Notification.insertMany(notifications);
    } else {
      // Send to specific user
      const notification = new Notification({
        ...notificationData,
        recipient
      });
      await notification.save();
    }
  } catch (error) {
    console.error('Create notification error:', error);
  }
}

function canAssignIssue(user, issue) {
  if (user.role === 'high_admin') return true;
  if (user.role === 'low_admin') {
    return user.assignedZones.includes(issue.location.zone) ||
           user.department === issue.assignedDepartment;
  }
  return false;
}

function canUpdateStatus(user, issue, newStatus) {
  if (user.role === 'high_admin') return true;
  if (user.role === 'low_admin') {
    return issue.assignedTo?.toString() === user._id.toString() ||
           user.assignedZones.includes(issue.location.zone);
  }
  if (user.role === 'citizen') {
    return issue.reportedBy.toString() === user._id.toString() &&
           ['pending_verification', 'reopened'].includes(newStatus);
  }
  return false;
}

function isValidStatusTransition(currentStatus, newStatus, userRole) {
  const transitions = {
    'pending': ['in_progress', 'escalated'],
    'in_progress': ['pending_verification', 'escalated'],
    'pending_verification': ['verified_solved', 'reopened'],
    'verified_solved': ['reopened'],
    'escalated': ['in_progress', 'pending_verification'],
    'reopened': ['in_progress', 'escalated']
  };

  return transitions[currentStatus]?.includes(newStatus) || false;
}

function hasIssueAccess(user, issue) {
  if (user.role === 'high_admin') return true;
  if (user.role === 'low_admin') {
    return issue.assignedTo?.toString() === user._id.toString() ||
           user.assignedZones.includes(issue.location.zone);
  }
  if (user.role === 'citizen') {
    return issue.reportedBy.toString() === user._id.toString();
  }
  return false;
}

function canAddWorkProof(user, issue) {
  if (user.role === 'high_admin') return true;
  if (user.role === 'low_admin') {
    return issue.assignedTo?.toString() === user._id.toString();
  }
  return false;
}

async function handleStatusChangeNotifications(issue, newStatus, changedBy) {
  const notifications = [];

  switch (newStatus) {
    case 'in_progress':
      // Notify reporter
      notifications.push({
        type: 'issue_updated',
        title: 'Issue In Progress',
        message: `Your reported issue "${issue.title}" is now being worked on`,
        relatedIssue: issue._id,
        recipient: issue.reportedBy
      });
      break;

    case 'pending_verification':
      // Notify high admin and reporter for verification
      const highAdmins = await User.find({ role: 'high_admin' });
      highAdmins.forEach(admin => {
        notifications.push({
          type: 'verification_required',
          title: 'Verification Required',
          message: `Issue "${issue.title}" requires verification`,
          relatedIssue: issue._id,
          recipient: admin._id,
          priority: 'high'
        });
      });

      notifications.push({
        type: 'verification_required',
        title: 'Issue Resolution Pending Verification',
        message: `Your reported issue "${issue.title}" has been marked as resolved and is pending verification`,
        relatedIssue: issue._id,
        recipient: issue.reportedBy
      });
      break;

    case 'verified_solved':
      // Notify reporter
      notifications.push({
        type: 'issue_resolved',
        title: 'Issue Resolved',
        message: `Your reported issue "${issue.title}" has been verified as resolved`,
        relatedIssue: issue._id,
        recipient: issue.reportedBy
      });
      break;

    case 'escalated':
      // Notify high admin
      const highAdminsForEscalation = await User.find({ role: 'high_admin' });
      highAdminsForEscalation.forEach(admin => {
        notifications.push({
          type: 'issue_escalated',
          title: 'Issue Escalated',
          message: `Issue "${issue.title}" has been escalated and requires your attention`,
          relatedIssue: issue._id,
          recipient: admin._id,
          priority: 'high'
        });
      });
      break;

    case 'reopened':
      // Notify assigned admin
      if (issue.assignedTo) {
        notifications.push({
          type: 'issue_reopened',
          title: 'Issue Reopened',
          message: `Issue "${issue.title}" has been reopened`,
          relatedIssue: issue._id,
          recipient: issue.assignedTo,
          priority: 'high'
        });
      }
      break;
  }

  if (notifications.length > 0) {
    await Notification.insertMany(notifications);
  }
}

module.exports = router;
