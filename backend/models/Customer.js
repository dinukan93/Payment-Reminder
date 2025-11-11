const mongoose = require('mongoose');

const contactHistorySchema = new mongoose.Schema({
  date: {
    type: String,
    required: true
  },
  outcome: {
    type: String,
    required: true,
    enum: ['Spoke to Customer', 'Left Voicemail', 'No Answer', 'Wrong Number', 'Customer Refused']
  },
  response: {
    type: String,
    required: true
  },
  promisedDate: {
    type: String
  },
  paymentMade: {
    type: Boolean,
    default: false
  }
}, { _id: false });

const customerSchema = new mongoose.Schema({
  accountNumber: {
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
  contactNumber: {
    type: String,
    required: true,
    trim: true
  },
  amountOverdue: {
    type: String,
    required: true
  },
  daysOverdue: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['OVERDUE', 'PENDING', 'COMPLETED', 'UNASSIGNED'],
    default: 'UNASSIGNED'
  },
  response: {
    type: String,
    default: 'Not Contacted Yet'
  },
  previousResponse: {
    type: String,
    default: 'No previous contact'
  },
  contactHistory: [contactHistorySchema],
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Caller',
    default: null
  },
  assignedDate: {
    type: String
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
customerSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Customer', customerSchema);
