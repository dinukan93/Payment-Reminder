import mongoose from 'mongoose';

const requestSchema = new mongoose.Schema({
  taskId: {
    type: String,
    required: true,
    unique: true,
    index: true
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
  customersContacted: {
    type: Number,
    default: 0
  },
  sentDate: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['PENDING', 'ACCEPTED', 'DECLINED', 'COMPLETED'],
    default: 'PENDING'
  },
  isCompleted: {
    type: Boolean,
    default: false
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
  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: false
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

export default mongoose.model('Request', requestSchema);
