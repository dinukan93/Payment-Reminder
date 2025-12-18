import Caller from '../models/Caller.js';
import Customer from '../models/Customer.js';
import Request from '../models/Request.js';

// @desc    Get dashboard statistics
// @route   GET /api/admin/stats
// @access  Public
const getDashboardStats = async (req, res) => {
  try {
    const adminRtom = req.user?.rtom || '';
    const rtomFilter = adminRtom ? { rtom: adminRtom } : {};
    
    const totalCustomers = await Customer.countDocuments(rtomFilter);
    const assignedCallers = await Caller.countDocuments({ ...rtomFilter, taskStatus: { $in: ['ONGOING', 'COMPLETED'] } });
    const unassignedCallers = await Caller.countDocuments({ ...rtomFilter, taskStatus: 'IDLE' });
    
    // Get customers contacted from ACCEPTED requests only (those with contactHistory and assigned to someone)
    const customersContacted = await Customer.countDocuments({
      ...rtomFilter,
      contactHistory: { $exists: true, $ne: [] },
      assignedTo: { $exists: true, $ne: null }
    });
    
    // Get completed payments
    const paymentsCompleted = await Customer.countDocuments({ ...rtomFilter, status: 'COMPLETED' });
    
    // Get pending payments
    const pendingPayments = await Customer.countDocuments({ 
      ...rtomFilter,
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
    const adminRtom = req.user?.rtom || '';
    const rtomFilter = adminRtom ? { rtom: adminRtom } : {};
    
    const assignedCallers = await Caller.find({ 
      ...rtomFilter,
      taskStatus: { $in: ['ONGOING', 'COMPLETED'] } 
    })
    .select('name callerId taskStatus customersContacted currentLoad maxLoad assignedCustomers');

    const formattedCallers = await Promise.all(assignedCallers.map(async caller => {
      // Get active request for this caller to find taskId and customer count
      const activeRequest = await Request.findOne({ 
        caller: caller._id,
        isCompleted: false 
      }).select('taskId customersSent').lean();
      
      // Get customers from the current active task only
      let completedCount = 0;
      let totalAssigned = 0;
      
      if (activeRequest && activeRequest.taskId) {
        // Get customers assigned to this caller with the current task ID
        const taskCustomers = await Customer.find({ 
          ...rtomFilter,
          assignedTo: caller._id,
          taskId: activeRequest.taskId
        }).select('status').lean();
        
        totalAssigned = taskCustomers.length;
        completedCount = taskCustomers.filter(c => c.status === 'COMPLETED').length;
      }
      
      return {
        id: caller._id,
        name: caller.name,
        callerId: caller.callerId,
        task: activeRequest ? activeRequest.taskId : 'N/A',
        taskStatus: caller.taskStatus,
        customersContacted: `${completedCount}/${totalAssigned}`,
        currentLoad: caller.currentLoad,
        maxLoad: caller.maxLoad
      };
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
    const adminRtom = req.user?.rtom || '';
    const rtomFilter = adminRtom ? { rtom: adminRtom } : {};
    
    const unassignedCallers = await Caller.find({ 
      ...rtomFilter,
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
    // Filter by adminId if provided in query (for logged-in admin)
    const filter = req.query.adminId ? { adminId: req.query.adminId } : {};
    
    const requests = await Request.find(filter)
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
    const adminRtom = req.user?.rtom || '';
    const rtomFilter = adminRtom ? { rtom: adminRtom } : {};
    
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(today.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);


    // Get all customers with contact history, including COMPLETED
    const customers = await Customer.find({
      ...rtomFilter,
      contactHistory: { $exists: true, $ne: [] }
    });

    const weeklyCalls = [0, 0, 0, 0, 0, 0, 0]; // Mon-Sun

    customers.forEach(customer => {
      if (customer.contactHistory && customer.contactHistory.length > 0) {
        customer.contactHistory.forEach(contact => {
          // Parse contactDate field (DD/MM/YYYY format)
          if (!contact.contactDate) return;
          let contactDate;
          if (contact.contactDate.includes('/')) {
            const [day, month, year] = contact.contactDate.split('/');
            contactDate = new Date(year, month - 1, day);
          } else {
            contactDate = new Date(contact.contactDate);
          }
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
    const adminRtom = req.user?.rtom || '';
    const rtomFilter = adminRtom ? { rtom: adminRtom } : {};
    
    const limit = parseInt(req.query.limit) || 10;
    
    const completedCustomers = await Customer.find({ 
      ...rtomFilter,
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
    console.log('=== GET CALLER DETAILS ===');
    console.log('Caller ID:', req.params.id);
    
    // Try to find caller by MongoDB _id first, then by callerId string
    let caller = await Caller.findById(req.params.id).select('-password').catch(() => null);
    
    if (!caller) {
      // If not found by _id, try finding by callerId field
      console.log('Not found by _id, trying callerId field...');
      caller = await Caller.findOne({ callerId: req.params.id }).select('-password');
    }
    
    console.log('Caller found:', caller ? caller.name : 'NOT FOUND');

    if (!caller) {
      return res.status(404).json({
        success: false,
        message: 'Caller not found'
      });
    }

    // Find all active (non-completed) requests for this caller
    console.log('Fetching active requests for caller ID:', caller._id);
    const activeRequests = await Request.find({ 
      caller: caller._id,
      isCompleted: false 
    }).select('taskId customers').lean();
    
    console.log('Found', activeRequests.length, 'active requests');
    console.log('Active task IDs:', activeRequests.map(r => r.taskId).join(', '));

    // Extract customer IDs and task IDs from active requests
    const activeCustomerIds = new Set();
    const activeTaskIds = new Set();
    
    activeRequests.forEach(request => {
      if (request.taskId) {
        activeTaskIds.add(request.taskId);
      }
      request.customers.forEach(customer => {
        if (customer.customerId) {
          activeCustomerIds.add(customer.customerId.toString());
        }
      });
    });

    console.log('Active customer IDs count:', activeCustomerIds.size);
    console.log('Active task IDs:', Array.from(activeTaskIds).join(', '));

    // Fetch customers using taskId for better performance and accuracy
    const adminRtom = req.user?.rtom || '';
    const rtomFilter = adminRtom ? { rtom: adminRtom } : {};
    
    const assignedCustomers = await Customer.find({ 
      ...rtomFilter,
      assignedTo: caller._id,
      taskId: { $in: Array.from(activeTaskIds) }
    })
      .select('accountNumber name contactNumber amountOverdue daysOverdue status contactHistory taskId')
      .lean();
    
    console.log('Found', assignedCustomers.length, 'customers from active requests');

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
        assignedCustomers: assignedCustomers
      }
    });
  } catch (error) {
    console.error('Error in getCallerDetails:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching caller details',
      error: error.message
    });
  }
};

export {
  getDashboardStats,
  getAssignedCallers,
  getUnassignedCallers,
  getSentRequests,
  getWeeklyCalls,
  getCompletedPayments,
  getCallerDetails
};
