const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  phone: {
    type: String,
    required: true,
    trim: true
  },
  role: {
    type: String,
    enum: ['citizen', 'low_admin', 'high_admin'],
    default: 'citizen'
  },
  assignedZones: [{
    type: String,
    trim: true
  }],
  department: {
    type: String,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date
  },
  profileImage: {
    type: String
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

const User = mongoose.model('User', userSchema);

async function createAdmin() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/civic-reporting');
    console.log('Connected to MongoDB');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: 'admin@civicreporting.com' });
    if (existingAdmin) {
      console.log('Admin user already exists!');
      console.log('Email: admin@civicreporting.com');
      console.log('Password: admin123');
      console.log('Role:', existingAdmin.role);
      process.exit(0);
    }

    // Create high admin user
    const adminUser = new User({
      name: 'System Administrator',
      email: 'admin@civicreporting.com',
      password: 'admin123',
      phone: '+1234567890',
      role: 'high_admin',
      assignedZones: ['Zone A', 'Zone B', 'Zone C'],
      department: 'Administration',
      isActive: true
    });

    await adminUser.save();
    console.log('✅ High Admin user created successfully!');
    console.log('📧 Email: admin@civicreporting.com');
    console.log('🔑 Password: admin123');
    console.log('👑 Role: high_admin');

    // Create low admin user
    const lowAdminUser = new User({
      name: 'Department Manager',
      email: 'manager@civicreporting.com',
      password: 'manager123',
      phone: '+1234567891',
      role: 'low_admin',
      assignedZones: ['Zone A', 'Zone B'],
      department: 'Public Works',
      isActive: true
    });

    await lowAdminUser.save();
    console.log('✅ Low Admin user created successfully!');
    console.log('📧 Email: manager@civicreporting.com');
    console.log('🔑 Password: manager123');
    console.log('👑 Role: low_admin');

    // Create test citizen user
    const citizenUser = new User({
      name: 'John Citizen',
      email: 'citizen@civicreporting.com',
      password: 'citizen123',
      phone: '+1234567892',
      role: 'citizen',
      isActive: true
    });

    await citizenUser.save();
    console.log('✅ Test Citizen user created successfully!');
    console.log('📧 Email: citizen@civicreporting.com');
    console.log('🔑 Password: citizen123');
    console.log('👑 Role: citizen');

    console.log('\n🎉 All test users created successfully!');
    console.log('\nYou can now login with any of these accounts:');
    console.log('1. High Admin: admin@civicreporting.com / admin123');
    console.log('2. Low Admin: manager@civicreporting.com / manager123');
    console.log('3. Citizen: citizen@civicreporting.com / citizen123');

  } catch (error) {
    console.error('Error creating admin user:', error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

createAdmin();
