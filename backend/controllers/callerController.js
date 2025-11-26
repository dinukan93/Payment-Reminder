import Caller from '../models/Caller.js';
import bcrypt from 'bcryptjs';

// @desc    Get all callers
// @route   GET /api/callers
// @access  Public
const getAllCallers = async (req, res) => {
  try {
    const callers = await Caller.find().select('-password').populate('assignedCustomers');
    res.status(200).json({
      success: true,
      count: callers.length,
      data: callers
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching callers',
      error: error.message
    });
  }
};

// @desc    Get available callers
// @route   GET /api/callers/available
// @access  Public
const getAvailableCallers = async (req, res) => {
  try {
    const callers = await Caller.find({ status: 'AVAILABLE' }).select('-password');
    res.status(200).json({
      success: true,
      count: callers.length,
      data: callers
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching available callers',
      error: error.message
    });
  }
};

// @desc    Get caller by ID
// @route   GET /api/callers/:id
// @access  Public
const getCallerById = async (req, res) => {
  try {
    const caller = await Caller.findById(req.params.id).select('-password').populate('assignedCustomers');
    
    if (!caller) {
      return res.status(404).json({
        success: false,
        message: 'Caller not found'
      });
    }

    res.status(200).json({
      success: true,
      data: caller
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching caller',
      error: error.message
    });
  }
};

// @desc    Create new caller
// @route   POST /api/callers
// @access  Public
const createCaller = async (req, res) => {
  try {
    const { name, email, password, callerId } = req.body;

    // Check if caller already exists
    const existingCaller = await Caller.findOne({ $or: [{ email }, { callerId }] });
    if (existingCaller) {
      return res.status(400).json({
        success: false,
        message: 'Caller with this email or ID already exists'
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const caller = await Caller.create({
      ...req.body,
      password: hashedPassword
    });

    // Remove password from response
    const callerResponse = caller.toObject();
    delete callerResponse.password;

    res.status(201).json({
      success: true,
      data: callerResponse
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error creating caller',
      error: error.message
    });
  }
};

// @desc    Update caller
// @route   PUT /api/callers/:id
// @access  Public
const updateCaller = async (req, res) => {
  try {
    // If password is being updated, hash it
    if (req.body.password) {
      const salt = await bcrypt.genSalt(10);
      req.body.password = await bcrypt.hash(req.body.password, salt);
    }

    const caller = await Caller.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).select('-password');

    if (!caller) {
      return res.status(404).json({
        success: false,
        message: 'Caller not found'
      });
    }

    res.status(200).json({
      success: true,
      data: caller
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error updating caller',
      error: error.message
    });
  }
};

// @desc    Update caller workload
// @route   PUT /api/callers/:id/workload
// @access  Public
const updateCallerWorkload = async (req, res) => {
  try {
    const { currentLoad, customersContacted } = req.body;
    
    const caller = await Caller.findById(req.params.id);

    if (!caller) {
      return res.status(404).json({
        success: false,
        message: 'Caller not found'
      });
    }

    if (currentLoad !== undefined) {
      caller.currentLoad = currentLoad;
    }
    if (customersContacted !== undefined) {
      caller.customersContacted = customersContacted;
    }

    // Update task status based on workload
    if (caller.currentLoad === 0) {
      caller.taskStatus = 'IDLE';
    } else if (caller.currentLoad < caller.maxLoad) {
      caller.taskStatus = 'ONGOING';
    } else {
      caller.taskStatus = 'COMPLETED';
    }

    await caller.save();

    res.status(200).json({
      success: true,
      data: caller
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error updating caller workload',
      error: error.message
    });
  }
};

// @desc    Delete caller
// @route   DELETE /api/callers/:id
// @access  Public
const deleteCaller = async (req, res) => {
  try {
    const caller = await Caller.findByIdAndDelete(req.params.id);

    if (!caller) {
      return res.status(404).json({
        success: false,
        message: 'Caller not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Caller deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting caller',
      error: error.message
    });
  }
};

// @desc    Generate and send performance report to admin
// @route   POST /api/callers/:id/report
// @access  Public
const generatePerformanceReport = async (req, res) => {
  try {
    const callerId = req.params.id;
    const { reportType = 'daily' } = req.body; // daily, weekly, monthly
    
    const Caller = (await import('../models/Caller.js')).default;
    const Customer = (await import('../models/Customer.js')).default;
    const Request = (await import('../models/Request.js')).default;
    
    const caller = await Caller.findById(callerId);
    if (!caller) {
      return res.status(404).json({
        success: false,
        message: 'Caller not found'
      });
    }
    
    // Get all customers assigned to this caller
    const customers = await Customer.find({ assignedTo: callerId });
    
    // Calculate statistics
    const totalCustomers = customers.length;
    const completedPayments = customers.filter(c => c.status === 'COMPLETED').length;
    const pendingPayments = customers.filter(c => c.status === 'PENDING').length;
    const overdueCustomers = customers.filter(c => c.status === 'OVERDUE').length;
    
    // Calculate call statistics
    let totalCalls = 0;
    let successfulCalls = 0;
    let failedCalls = 0;
    const callOutcomes = {};
    
    customers.forEach(customer => {
      if (customer.contactHistory && customer.contactHistory.length > 0) {
        customer.contactHistory.forEach(contact => {
          totalCalls++;
          
          if (contact.outcome === 'Spoke to Customer') {
            successfulCalls++;
          } else {
            failedCalls++;
          }
          
          // Count outcome types
          callOutcomes[contact.outcome] = (callOutcomes[contact.outcome] || 0) + 1;
        });
      }
    });
    
    // Get completed requests
    const completedRequests = await Request.find({
      caller: callerId,
      status: 'COMPLETED'
    });
    
    // Get ongoing requests
    const ongoingRequests = await Request.find({
      caller: callerId,
      status: 'ACCEPTED'
    });
    
    // Calculate success rate
    const successRate = totalCalls > 0 ? ((successfulCalls / totalCalls) * 100).toFixed(2) : 0;
    const completionRate = totalCustomers > 0 ? ((completedPayments / totalCustomers) * 100).toFixed(2) : 0;
    
    // Prepare detailed customer list with all contact history as responses
    const customerDetails = customers.map(customer => {
      const latestContact = customer.contactHistory && customer.contactHistory.length > 0
        ? customer.contactHistory[customer.contactHistory.length - 1]
        : null;
      return {
        taskId: customer.taskId || '',
        accountNumber: customer.accountNumber,
        name: customer.name,
        contactNumber: customer.contactNumber,
        amountOverdue: customer.amountOverdue,
        daysOverdue: customer.daysOverdue,
        status: customer.status,
        payment: customer.status === 'COMPLETED' ? 'Paid' : 'Unpaid',
        lastContactDate: latestContact?.contactDate || 'Not contacted',
        lastContactOutcome: latestContact?.outcome || 'N/A',
        lastResponse: latestContact?.remark || 'N/A',
        promisedDate: latestContact?.promisedDate || 'N/A',
        totalContacts: customer.contactHistory?.length || 0,
        responses: (customer.contactHistory || []).map(ch => ({
          date: ch.contactDate,
          outcome: ch.outcome,
          remark: ch.remark,
          promisedDate: ch.promisedDate
        }))
      };
    });
    
    // Generate report object
    const report = {
      reportId: `RPT-${Date.now()}`,
      reportType,
      generatedDate: new Date().toISOString(),
      caller: {
        id: caller._id,
        name: caller.name,
        callerId: caller.callerId,
        email: caller.email
      },
      summary: {
        totalCustomersAssigned: totalCustomers,
        completedPayments,
        pendingPayments,
        overdueCustomers,
        totalCalls,
        successfulCalls,
        failedCalls,
        successRate: `${successRate}%`,
        completionRate: `${completionRate}%`
      },
      callStatistics: {
        totalCalls,
        successfulCalls,
        failedCalls,
        callOutcomeBreakdown: callOutcomes
      },
      requestsCompleted: completedRequests.length,
      requestsOngoing: ongoingRequests.length,
      completedRequestsList: completedRequests.map(req => ({
        taskId: req.taskId,
        sentDate: req.sentDate,
        customersSent: req.customersSent,
        customersContacted: req.customersContacted,
        completedDate: req.updatedAt
      })),
      customerDetails: customerDetails.sort((a, b) => {
        // Sort by status: COMPLETED, PENDING, OVERDUE
        const statusOrder = { 'COMPLETED': 0, 'PENDING': 1, 'OVERDUE': 2 };
        return statusOrder[a.status] - statusOrder[b.status];
      })
    };
    
    // Save the report to the database so admin can access it
    const Report = (await import('../models/Report.js')).default;
    await Report.create(report);

    console.log(`Performance report generated and saved for ${caller.name} (${reportType})`);
    res.status(200).json({
      success: true,
      message: 'Performance report generated and saved successfully',
      data: report
    });
  } catch (error) {
    console.error('Error generating performance report:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating performance report',
      error: error.message
    });
  }
};

export {
  getAllCallers,
  getAvailableCallers,
  getCallerById,
  createCaller,
  updateCaller,
  updateCallerWorkload,
  deleteCaller,
  generatePerformanceReport
};
