import mongoose from 'mongoose';

const adminSchema = new mongoose.Schema({
  adminId: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  phone: {
    type: String,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  avatar: {
    type: String
  },
  role: {
    type: String,
    enum: ['superadmin', 'admin', 'uploader'],
    default: 'admin'
  },
  rtom: {
    type: String,
    trim: true,
    required: function() {
      return this.role === 'admin'; // RTOM required only for admins
    }
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  isLoggedIn: {
    type: Boolean,
    default: false
  },
  token: {
    type: String,
    default: null
  },
  otp: {
    type: String,
    default: null
  },
  otpExpiry: {
    type: Date,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  preferences: {
    emailNotifications: { type: Boolean, default: true },
    paymentReminder: { type: Boolean, default: true },
    callNotifications: { type: Boolean, default: false },
    darkMode: { type: Boolean, default: false },
    language: { type: String, default: 'English' },
    timezone: { type: String, default: 'UTC' }
  }
});

// Update the updatedAt field on save
adminSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

export default mongoose.model('Admin', adminSchema);
