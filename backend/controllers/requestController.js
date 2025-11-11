const Request = require('../models/Request');
const Customer = require('../models/Customer');
const Caller = require('../models/Caller');

// @desc    Get all requests
// @route   GET /api/requests
// @access  Public
const getAllRequests = async (req, res) => {
  try {
    const requests = await Request.find()
      .populate('caller', 'name callerId')
      .populate('customers.customerId', 'accountNumber name contactNumber');
    
    res.status(200).json({
      success: true,
      count: requests.length,
      data: requests
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching requests',
      error: error.message
    });
  }
};

// @desc    Get pending requests
// @route   GET /api/requests/pending
// @access  Public
const getPendingRequests = async (req, res) => {
  try {
    const requests = await Request.find({ status: 'PENDING' })
      .populate('caller', 'name callerId')
      .populate('customers.customerId');
    
    res.status(200).json({
      success: true,
      count: requests.length,
      data: requests
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching pending requests',
      error: error.message
    });
  }
};

// @desc    Get requests by caller ID
// @route   GET /api/requests/caller/:callerId
// @access  Public
const getRequestsByCallerId = async (req, res) => {
  try {
    const { callerId } = req.params;
    const requests = await Request.find({ callerId })
      .populate('caller', 'name callerId')
      .populate('customers.customerId');
    
    res.status(200).json({
      success: true,
      count: requests.length,
      data: requests
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching caller requests',
      error: error.message
    });
  }
};

// @desc    Get request by ID
// @route   GET /api/requests/:id
// @access  Public
const getRequestById = async (req, res) => {
  try {
    const request = await Request.findById(req.params.id)
      .populate('caller', 'name callerId')
      .populate('customers.customerId');
    
    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Request not found'
      });
    }

    res.status(200).json({
      success: true,
      data: request
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching request',
      error: error.message
    });
  }
};

// @desc    Create new request (admin assigns customers to caller)
// @route   POST /api/requests
// @access  Public
const createRequest = async (req, res) => {
  try {
    const { callerName, callerId, customers } = req.body;

    // Find the caller
    const caller = await Caller.findOne({ callerId });
    if (!caller) {
      return res.status(404).json({
        success: false,
        message: 'Caller not found'
      });
    }

    // Format current date as DD/MM/YYYY
    const today = new Date();
    const dateString = `${String(today.getDate()).padStart(2, '0')}/${String(today.getMonth() + 1).padStart(2, '0')}/${today.getFullYear()}`;

    // Create request
    const request = await Request.create({
      requestId: Date.now().toString(),
      callerName,
      callerId,
      caller: caller._id,
      customers: customers.map(c => ({
        customerId: c.customerId || c.id,
        accountNumber: c.accountNumber,
        name: c.name,
        contactNumber: c.contactNumber,
        amountOverdue: c.amountOverdue,
        daysOverdue: c.daysOverdue
      })),
      customersSent: customers.length,
      sentDate: dateString,
      status: 'PENDING',
      sentBy: 'Admin'
    });

    res.status(201).json({
      success: true,
      data: request
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error creating request',
      error: error.message
    });
  }
};

// @desc    Update request
// @route   PUT /api/requests/:id
// @access  Public
const updateRequest = async (req, res) => {
  try {
    const request = await Request.findById(req.params.id);

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Request not found'
      });
    }

    // If the request is being declined, unassign all customers
    if (req.body.status === 'DECLINED') {
      // Unassign all customers from this request
      for (const customerData of request.customers) {
        const customer = await Customer.findById(customerData.customerId);
        
        if (customer) {
          // Remove assignment
          customer.assignedTo = null;
          customer.assignedDate = null;
          customer.status = 'UNASSIGNED';
          await customer.save();
        }
      }

      // Update the caller's assigned customers list
      if (request.callerId) {
        const caller = await Caller.findOne({ callerId: request.callerId });
        if (caller) {
          // Remove these customers from caller's assignedCustomers
          const customerIds = request.customers.map(c => c.customerId.toString());
          caller.assignedCustomers = caller.assignedCustomers.filter(
            id => !customerIds.includes(id.toString())
          );
          caller.currentLoad = caller.assignedCustomers.length;
          
          // Update caller status if no customers assigned
          if (caller.assignedCustomers.length === 0) {
            caller.taskStatus = 'AVAILABLE';
          }
          
          await caller.save();
        }
      }
    }

    // If the request is being accepted, assign customers
    if (req.body.status === 'ACCEPTED') {
      // Format current date as DD/MM/YYYY
      const today = new Date();
      const dateString = `${String(today.getDate()).padStart(2, '0')}/${String(today.getMonth() + 1).padStart(2, '0')}/${today.getFullYear()}`;

      // Find the caller
      const caller = await Caller.findOne({ callerId: request.callerId });
      
      if (caller) {
        // Update customers - assign them to the caller
        for (const customerData of request.customers) {
          let customer = await Customer.findById(customerData.customerId);
          
          if (!customer) {
            // If customer doesn't exist in DB, create them
            customer = await Customer.create({
              accountNumber: customerData.accountNumber,
              name: customerData.name,
              contactNumber: customerData.contactNumber,
              amountOverdue: customerData.amountOverdue,
              daysOverdue: customerData.daysOverdue,
              status: 'OVERDUE',
              assignedTo: caller._id,
              assignedDate: dateString,
              response: 'Not Contacted Yet',
              previousResponse: 'No previous contact',
              contactHistory: []
            });
          } else {
            // Update existing customer
            customer.assignedTo = caller._id;
            customer.assignedDate = dateString;
            customer.status = 'OVERDUE';
            await customer.save();
          }

          // Add customer to caller's assignedCustomers
          if (!caller.assignedCustomers.includes(customer._id)) {
            caller.assignedCustomers.push(customer._id);
          }
        }

        // Update caller workload
        caller.currentLoad = caller.assignedCustomers.length;
        caller.taskStatus = 'ONGOING';
        await caller.save();
      }
    }

    // Update the request with new data
    Object.assign(request, req.body);
    await request.save();

    const updatedRequest = await Request.findById(req.params.id)
      .populate('caller', 'name callerId');

    res.status(200).json({
      success: true,
      data: updatedRequest
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error updating request',
      error: error.message
    });
  }
};

// @desc    Accept request
// @route   PUT /api/requests/:id/accept
// @access  Public
const acceptRequest = async (req, res) => {
  try {
    const request = await Request.findById(req.params.id);

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Request not found'
      });
    }

    // Format current date as DD/MM/YYYY
    const today = new Date();
    const dateString = `${String(today.getDate()).padStart(2, '0')}/${String(today.getMonth() + 1).padStart(2, '0')}/${today.getFullYear()}`;

    // Update request status
    request.status = 'ACCEPTED';
    request.respondedDate = dateString;
    await request.save();

    // Find the caller
    const caller = await Caller.findOne({ callerId: request.callerId });
    
    if (caller) {
      // Update customers - assign them to the caller and set status to OVERDUE
      for (const customerData of request.customers) {
        let customer = await Customer.findById(customerData.customerId);
        
        if (!customer) {
          // If customer doesn't exist in DB, create them
          customer = await Customer.create({
            accountNumber: customerData.accountNumber,
            name: customerData.name,
            contactNumber: customerData.contactNumber,
            amountOverdue: customerData.amountOverdue,
            daysOverdue: customerData.daysOverdue,
            status: 'OVERDUE',
            assignedTo: caller._id,
            assignedDate: dateString,
            response: 'Not Contacted Yet',
            previousResponse: 'No previous contact',
            contactHistory: []
          });
        } else {
          // Update existing customer
          customer.assignedTo = caller._id;
          customer.assignedDate = dateString;
          customer.status = 'OVERDUE';
          await customer.save();
        }

        // Add customer to caller's assignedCustomers
        if (!caller.assignedCustomers.includes(customer._id)) {
          caller.assignedCustomers.push(customer._id);
        }
      }

      // Update caller workload
      caller.currentLoad = caller.assignedCustomers.length;
      caller.taskStatus = 'ONGOING';
      await caller.save();
    }

    res.status(200).json({
      success: true,
      message: 'Request accepted successfully',
      data: request
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error accepting request',
      error: error.message
    });
  }
};

// @desc    Decline request
// @route   PUT /api/requests/:id/decline
// @access  Public
const declineRequest = async (req, res) => {
  try {
    const { reason } = req.body;
    const request = await Request.findById(req.params.id);

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Request not found'
      });
    }

    // Format current date as DD/MM/YYYY
    const today = new Date();
    const dateString = `${String(today.getDate()).padStart(2, '0')}/${String(today.getMonth() + 1).padStart(2, '0')}/${today.getFullYear()}`;

    // Update request status
    request.status = 'DECLINED';
    request.respondedDate = dateString;
    request.reason = reason || 'No reason provided';
    await request.save();

    res.status(200).json({
      success: true,
      message: 'Request declined successfully',
      data: request
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error declining request',
      error: error.message
    });
  }
};

module.exports = {
  getAllRequests,
  getPendingRequests,
  getRequestsByCallerId,
  getRequestById,
  createRequest,
  updateRequest,
  acceptRequest,
  declineRequest
};
