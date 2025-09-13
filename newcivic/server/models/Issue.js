const mongoose = require('mongoose');

const issueSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    required: true,
    enum: [
      'pothole',
      'streetlight',
      'garbage',
      'water_leak',
      'traffic_signal',
      'road_damage',
      'sewage',
      'parks',
      'other'
    ]
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: [
      'pending',
      'in_progress',
      'pending_verification',
      'verified_solved',
      'escalated',
      'reopened'
    ],
    default: 'pending'
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true
    },
    address: {
      type: String,
      required: true
    },
    zone: {
      type: String,
      required: true
    }
  },
  images: [{
    url: String,
    publicId: String,
    caption: String
  }],
  videos: [{
    url: String,
    publicId: String,
    caption: String
  }],
  reportedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  assignedDepartment: {
    type: String,
    trim: true
  },
  assignedAt: {
    type: Date
  },
  dueDate: {
    type: Date
  },
  resolvedAt: {
    type: Date
  },
  verifiedAt: {
    type: Date
  },
  escalatedAt: {
    type: Date
  },
  escalationReason: {
    type: String
  },
  workProof: [{
    url: String,
    publicId: String,
    description: String,
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  comments: [{
    text: String,
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    isInternal: {
      type: Boolean,
      default: false
    }
  }],
  statusHistory: [{
    status: String,
    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    changedAt: {
      type: Date,
      default: Date.now
    },
    reason: String
  }],
  isPublic: {
    type: Boolean,
    default: true
  },
  tags: [String],
  estimatedCost: {
    type: Number
  },
  actualCost: {
    type: Number
  }
}, {
  timestamps: true
});

// Create geospatial index
issueSchema.index({ location: '2dsphere' });

// Create text index for search
issueSchema.index({ 
  title: 'text', 
  description: 'text', 
  category: 'text' 
});

// Virtual for days since creation
issueSchema.virtual('daysSinceCreation').get(function() {
  return Math.floor((Date.now() - this.createdAt) / (1000 * 60 * 60 * 24));
});

// Virtual for days since assignment
issueSchema.virtual('daysSinceAssignment').get(function() {
  if (!this.assignedAt) return null;
  return Math.floor((Date.now() - this.assignedAt) / (1000 * 60 * 60 * 24));
});

// Method to add status change to history
issueSchema.methods.addStatusChange = function(newStatus, changedBy, reason = '') {
  this.statusHistory.push({
    status: newStatus,
    changedBy,
    reason
  });
  this.status = newStatus;
};

// Method to check if issue should be escalated
issueSchema.methods.shouldEscalate = function() {
  if (this.status === 'pending' || this.status === 'in_progress') {
    const daysSinceAssignment = this.daysSinceAssignment;
    return daysSinceAssignment && daysSinceAssignment >= 5;
  }
  return false;
};

module.exports = mongoose.model('Issue', issueSchema);
