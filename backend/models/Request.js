const mongoose = require('mongoose');

const requestSchema = new mongoose.Schema({
  requestId: {
    type: String,
    required: true,
    unique: true
  },
  callerName: {
    type: String,
    required: true
  },
  callerId: {
    type: String,
    required: true
  },
  caller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Caller',
    required: true
  },
  customers: [{
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer'
    },
    accountNumber: String,
    name: String,
    contactNumber: String,
    amountOverdue: String,
    daysOverdue: String
  }],
  customersSent: {
    type: Number,
    required: true
  },
  sentDate: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['PENDING', 'ACCEPTED', 'DECLINED'],
    default: 'PENDING'
  },
  respondedDate: {
    type: String
  },
  respondedAt: {
    type: Date
  },
  reason: {
    type: String
  },
  declineReason: {
    type: String
  },
  sentBy: {
    type: String,
    default: 'Admin'
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
requestSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Request', requestSchema);
