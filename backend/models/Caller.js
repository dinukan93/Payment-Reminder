const mongoose = require('mongoose');

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
  password: {
    type: String,
    required: true
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
  }
});

// Update the updatedAt field on save
callerSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Caller', callerSchema);
