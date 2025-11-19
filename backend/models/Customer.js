import mongoose from 'mongoose';

const contactHistorySchema = new mongoose.Schema({
  contactDate: {
    type: String,
    required: true
  },
  outcome: {
    type: String,
    required: true,
    enum: ['Spoke to Customer', 'Left Voicemail', 'No Answer', 'Wrong Number', 'Customer Refused']
  },
  remark: {
    type: String,
    required: true
  },
  crmAction: {
    type: String,
    default: ''
  },
  customerFeedback: {
    type: String,
    default: ''
  },
  creditAction: {
    type: String,
    default: ''
  },
  retriedCount: {
    type: Number,
    default: 0
  },
  promisedDate: {
    type: String
  },
  paymentMade: {
    type: Boolean,
    default: false
  },
  contactedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Caller',
    default: null
  }
}, { _id: false });

const customerSchema = new mongoose.Schema({
  // Basic Identity
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
  region: {
    type: String,
    trim: true,
    default: ''
  },
  rtom: {
    type: String,
    trim: true,
    default: ''
  },
  
  // Product & Service Details
  productLabel: {
    type: String,
    trim: true,
    default: ''
  },
  medium: {
    type: String,
    trim: true,
    default: ''
  },
  
  // Billing Information
  latestBillAmount: {
    type: Number,
    default: 0
  },
  newArrears: {
    type: Number,
    default: 0
  },
  amountOverdue: {
    type: String,
    required: true
  },
  daysOverdue: {
    type: String,
    required: true
  },
  nextBillDate: {
    type: Date,
    default: null
  },
  ageMonths: {
    type: Number,
    default: 0
  },
  
  // Contact Information
  mobileContactTel: {
    type: String,
    trim: true,
    default: ''
  },
  contactNumber: {
    type: String,
    required: true,
    trim: true
  },
  emailAddress: {
    type: String,
    trim: true,
    lowercase: true,
    default: ''
  },
  mobileNoConfirmation: {
    type: Boolean,
    default: false
  },
  
  // Credit Information
  creditScore: {
    type: Number,
    default: 0
  },
  creditClassName: {
    type: String,
    trim: true,
    default: ''
  },
  billHandlingCodeName: {
    type: String,
    trim: true,
    default: ''
  },
  
  // Management & Assignment
  accountManager: {
    type: String,
    trim: true,
    default: ''
  },
  salesPerson: {
    type: String,
    trim: true,
    default: ''
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Caller',
    default: null
  },
  assignedDate: {
    type: String
  },
  taskId: {
    type: String,
    default: null,
    index: true
  },
  
  // Status & History
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
  
  // Timestamps
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

export default mongoose.model('Customer', customerSchema);
