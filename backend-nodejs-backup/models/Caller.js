import mongoose from 'mongoose';

const callerSchema = new mongoose.Schema({
  callerId: {
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
    required: false
  },
  googleId: {
    type: String,
    sparse: true
  },
  avatar: {
    type: String
  },
  role: {
    type: String,
    enum: ['admin', 'caller', 'uploader'],
    default: 'caller'
  },
  rtom: {
    type: String,
    trim: true,
    default: ''
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
  status: {
    type: String,
    enum: ['AVAILABLE', 'BUSY', 'OFFLINE'],
    default: 'AVAILABLE'
  },
  currentLoad: {
    type: Number,
    default: 0
  },
  maxLoad: {
    type: Number,
    default: 20
  },
  assignedCustomers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer'
  }],
  taskStatus: {
    type: String,
    enum: ['ONGOING', 'COMPLETED', 'IDLE'],
    default: 'IDLE'
  },
  customersContacted: {
    type: String,
    default: '0/0'
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
callerSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

export default mongoose.model('Caller', callerSchema);
