const Caller = require('../models/Caller');
const Customer = require('../models/Customer');
const Request = require('../models/Request');

// @desc    Get dashboard statistics
// @route   GET /api/admin/stats
// @access  Public
const getDashboardStats = async (req, res) => {
  try {
    const totalCustomers = await Customer.countDocuments();
    const assignedCallers = await Caller.countDocuments({ taskStatus: { $in: ['ONGOING', 'COMPLETED'] } });
    const unassignedCallers = await Caller.countDocuments({ taskStatus: 'IDLE' });
    
    // Get customers contacted (those with contactHistory)
    const customersContacted = await Customer.countDocuments({
      contactHistory: { $exists: true, $ne: [] }
    });
    
    // Get completed payments
    const paymentsCompleted = await Customer.countDocuments({ status: 'COMPLETED' });
    
    // Get pending payments
    const pendingPayments = await Customer.countDocuments({ 
      status: { $in: ['PENDING', 'OVERDUE'] } 
    });

    res.status(200).json({
      success: true,
      totalCustomers,
      assignedCallers,
      unassignedCallers,
      customersContacted,
      paymentsCompleted,
      pendingPayments
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching dashboard stats',
      error: error.message
    });
  }
};

// @desc    Get assigned callers with details
// @route   GET /api/admin/assigned-callers
// @access  Public
const getAssignedCallers = async (req, res) => {
  try {
    const assignedCallers = await Caller.find({ 
      taskStatus: { $in: ['ONGOING', 'COMPLETED'] } 
    })
    .select('name callerId taskStatus customersContacted currentLoad maxLoad assignedCustomers')
    .populate({
      path: 'assignedCustomers',
      select: 'accountNumber name contactNumber amountOverdue status'
    });

    const formattedCallers = assignedCallers.map(caller => ({
      id: caller._id,
      name: caller.name,
      callerId: caller.callerId,
      task: caller.taskStatus,
      customersContacted: caller.customersContacted,
      currentLoad: caller.currentLoad,
      maxLoad: caller.maxLoad,
      assignedCustomers: caller.assignedCustomers
    }));

    res.status(200).json({
      success: true,
      count: formattedCallers.length,
      data: formattedCallers
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching assigned callers',
      error: error.message
    });
  }
};

// @desc    Get unassigned callers
// @route   GET /api/admin/unassigned-callers
// @access  Public
const getUnassignedCallers = async (req, res) => {
  try {
    const unassignedCallers = await Caller.find({ 
      taskStatus: 'IDLE' 
    }).select('name callerId status updatedAt');

    const formattedCallers = unassignedCallers.map(caller => {
      const date = new Date(caller.updatedAt);
      const formattedDate = `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
      
      return {
        id: caller._id,
        name: caller.name,
        callerId: caller.callerId,
        date: formattedDate,
        status: caller.status,
        latestWork: "None" // This would need historical data tracking
      };
    });

    res.status(200).json({
      success: true,
      count: formattedCallers.length,
      data: formattedCallers
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching unassigned callers',
      error: error.message
    });
  }
};

// @desc    Get sent requests with status
// @route   GET /api/admin/sent-requests
// @access  Public
const getSentRequests = async (req, res) => {
  try {
    const requests = await Request.find()
      .populate('caller', 'name callerId')
      .populate('customers', 'accountNumber name amountOverdue daysOverdue')
      .sort({ createdAt: -1 });

    const formattedRequests = requests.map(request => {
      const sentDate = new Date(request.createdAt);
      const formattedSentDate = `${String(sentDate.getDate()).padStart(2, '0')}/${String(sentDate.getMonth() + 1).padStart(2, '0')}/${sentDate.getFullYear()}`;
      
      let respondedDate = null;
      if (request.respondedAt) {
        const respDate = new Date(request.respondedAt);
        respondedDate = `${String(respDate.getDate()).padStart(2, '0')}/${String(respDate.getMonth() + 1).padStart(2, '0')}/${respDate.getFullYear()} ${String(respDate.getHours()).padStart(2, '0')}:${String(respDate.getMinutes()).padStart(2, '0')}`;
      }

      return {
        id: request._id,
        callerName: request.caller ? request.caller.name : 'Unknown',
        callerId: request.caller ? request.caller.callerId : 'Unknown',
        customersSent: request.customers.length,
        sentDate: formattedSentDate,
        status: request.status,
        respondedDate: respondedDate,
        reason: request.declineReason,
        customers: request.customers.map(customer => ({
          id: customer._id,
          accountNumber: customer.accountNumber,
          name: customer.name,
          amountOverdue: customer.amountOverdue,
          daysOverdue: customer.daysOverdue
        }))
      };
    });

    res.status(200).json({
      success: true,
      count: formattedRequests.length,
      data: formattedRequests
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching sent requests',
      error: error.message
    });
  }
};

// @desc    Get weekly calls data for all callers
// @route   GET /api/admin/weekly-calls
// @access  Public
const getWeeklyCalls = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(today.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    // Get all customers with contact history
    const customers = await Customer.find({
      'contactHistory.0': { $exists: true }
    });

    const weeklyCalls = [0, 0, 0, 0, 0, 0, 0]; // Mon-Sun

    customers.forEach(customer => {
      if (customer.contactHistory && customer.contactHistory.length > 0) {
        customer.contactHistory.forEach(contact => {
          const contactDate = new Date(contact.date);
          
          if (contactDate >= sevenDaysAgo && contactDate <= today) {
            const dayOfWeek = contactDate.getDay();
            const mondayFirstIndex = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
            weeklyCalls[mondayFirstIndex]++;
          }
        });
      }
    });

    res.status(200).json({
      success: true,
      data: weeklyCalls
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching weekly calls',
      error: error.message
    });
  }
};

// @desc    Get completed payments
// @route   GET /api/admin/completed-payments
// @access  Public
const getCompletedPayments = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    
    const completedCustomers = await Customer.find({ 
      status: 'COMPLETED' 
    })
    .select('name accountNumber updatedAt')
    .sort({ updatedAt: -1 })
    .limit(limit);

    const formattedPayments = completedCustomers.map(customer => {
      const date = new Date(customer.updatedAt);
      const formattedDate = `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
      
      return {
        name: customer.name,
        accountNumber: customer.accountNumber,
        date: formattedDate
      };
    });

    res.status(200).json({
      success: true,
      count: formattedPayments.length,
      data: formattedPayments
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching completed payments',
      error: error.message
    });
  }
};

// @desc    Get caller details with assigned customers
// @route   GET /api/admin/callers/:id/details
// @access  Public
const getCallerDetails = async (req, res) => {
  try {
    const caller = await Caller.findById(req.params.id)
      .select('-password')
      .populate({
        path: 'assignedCustomers',
        select: 'accountNumber name contactNumber amountOverdue daysOverdue status contactHistory'
      });

    if (!caller) {
      return res.status(404).json({
        success: false,
        message: 'Caller not found'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        id: caller._id,
        name: caller.name,
        callerId: caller.callerId,
        email: caller.email,
        status: caller.status,
        taskStatus: caller.taskStatus,
        currentLoad: caller.currentLoad,
        maxLoad: caller.maxLoad,
        customersContacted: caller.customersContacted,
        assignedCustomers: caller.assignedCustomers
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching caller details',
      error: error.message
    });
  }
};

module.exports = {
  getDashboardStats,
  getAssignedCallers,
  getUnassignedCallers,
  getSentRequests,
  getWeeklyCalls,
  getCompletedPayments,
  getCallerDetails
};
