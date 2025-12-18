import Customer from '../models/Customer.js';

// @desc    Get all customers
// @route   GET /api/customers?callerId=xxx
// @access  Authenticated (RTOM filtered for admins)
const getAllCustomers = async (req, res) => {
  try {
    const { callerId } = req.query;
    const userRole = req.user?.role || '';
    const userRtom = req.user?.rtom || '';
    const query = {};
    
    console.log('=== GET CUSTOMERS ===');
    console.log('User Role:', userRole);
    console.log('User RTOM:', userRtom);
    console.log('callerId from query:', callerId);
    
    // Filter by RTOM if user is admin or caller (not superadmin/uploader)
    if ((userRole === 'admin' || userRole === 'caller') && userRtom) {
      query.rtom = userRtom;
      console.log('Filtering by RTOM:', userRtom);
    }
    
    // Filter by callerId if provided (supports both MongoDB _id and callerId string)
    if (callerId) {
      // Try to find caller by MongoDB _id or callerId to get the ObjectId
      const Caller = (await import('../models/Caller.js')).default;
      const caller = await Caller.findById(callerId).catch(() => null) || 
                     await Caller.findOne({ callerId });
      
      console.log('Found caller:', caller ? caller.name : 'NOT FOUND');
      
      if (caller) {
        query.assignedTo = caller._id;
        console.log('Querying customers with assignedTo:', caller._id);
      } else {
        // If caller not found, return empty array
        console.log('Caller not found, returning empty array');
        return res.status(200).json({
          success: true,
          count: 0,
          data: []
        });
      }
    }
    
    const customers = await Customer.find(query).populate('assignedTo', 'name callerId');
    console.log('Found', customers.length, 'customers');
    console.log('=== END GET CUSTOMERS ===');
    
    res.status(200).json({
      success: true,
      count: customers.length,
      data: customers
    });
  } catch (error) {
    console.error('Error in getAllCustomers:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching customers',
      error: error.message
    });
  }
};

// @desc    Get customer by ID
// @route   GET /api/customers/:id
// @access  Public
const getCustomerById = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id).populate('assignedTo', 'name callerId');
    
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    res.status(200).json({
      success: true,
      data: customer
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching customer',
      error: error.message
    });
  }
};

// @desc    Get customers by status
// @route   GET /api/customers/status/:status
// @access  Public
const getCustomersByStatus = async (req, res) => {
  try {
    const { status } = req.params;
    const customers = await Customer.find({ status }).populate('assignedTo', 'name callerId');
    
    res.status(200).json({
      success: true,
      count: customers.length,
      data: customers
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching customers',
      error: error.message
    });
  }
};

// @desc    Get customers assigned to a specific caller
// @route   GET /api/customers/assigned/:callerId
// @access  Public
const getAssignedCustomers = async (req, res) => {
  try {
    const { callerId } = req.params;
    const customers = await Customer.find({ assignedTo: callerId }).populate('assignedTo', 'name callerId');
    
    res.status(200).json({
      success: true,
      count: customers.length,
      data: customers
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching assigned customers',
      error: error.message
    });
  }
};

// @desc    Create new customer
// @route   POST /api/customers
// @access  Public
const createCustomer = async (req, res) => {
  try {
    const customer = await Customer.create(req.body);
    
    res.status(201).json({
      success: true,
      data: customer
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error creating customer',
      error: error.message
    });
  }
};

// @desc    Update customer
// @route   PUT /api/customers/:id
// @access  Public
const updateCustomer = async (req, res) => {
  try {
    const customer = await Customer.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    res.status(200).json({
      success: true,
      data: customer
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error updating customer',
      error: error.message
    });
  }
};

// @desc    Update customer contact history
// @route   PUT /api/customers/:id/contact
// @access  Public
const updateCustomerContact = async (req, res) => {
  try {
    const { callOutcome, customerResponse, paymentMade, promisedDate } = req.body;
    
    // Log the request for debugging
    console.log('Update contact request:', {
      id: req.params.id,
      body: req.body
    });
    
    const customer = await Customer.findById(req.params.id).populate('assignedTo');

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    // Format current date as DD/MM/YYYY
    const today = new Date();
    const dateString = `${String(today.getDate()).padStart(2, '0')}/${String(today.getMonth() + 1).padStart(2, '0')}/${today.getFullYear()}`;

    // Add to contact history with correct field names matching the schema
    customer.contactHistory.push({
      contactDate: dateString,
      outcome: callOutcome,
      remark: customerResponse,
      crmAction: '',
      customerFeedback: '',
      creditAction: '',
      retriedCount: customer.contactHistory.length, // Track retry count
      promisedDate: promisedDate || '',
      paymentMade: paymentMade || false,
      contactedBy: customer.assignedTo ? customer.assignedTo._id : null
    });

    // Update status based on payment status and promised date
    if (paymentMade) {
      // Payment made → COMPLETED
      customer.status = 'COMPLETED';
    } else {
      // Contacted but payment not made → PENDING (regardless of promised date)
      customer.status = 'PENDING';
    }

    // Update response fields
    customer.response = customerResponse;
    customer.previousResponse = customerResponse;

    await customer.save();

    console.log('Customer updated successfully:', {
      id: customer._id,
      status: customer.status,
      paymentMade,
      promisedDate,
      assignedTo: customer.assignedTo ? customer.assignedTo._id : 'NOT ASSIGNED',
      assignedToName: customer.assignedTo ? customer.assignedTo.name : 'NOT ASSIGNED'
    });

    // Check if this customer belongs to a request and update request progress
    if (customer.assignedTo) {
      const Request = (await import('../models/Request.js')).default;
      const Caller = (await import('../models/Caller.js')).default;
      
      // Find active (ACCEPTED) requests for this caller
      const activeRequests = await Request.find({
        caller: customer.assignedTo._id,
        status: 'ACCEPTED'
      });

      for (const request of activeRequests) {
        // Check if this customer is in the request
        const isInRequest = request.customers.some(c => 
          c.customerId.toString() === customer._id.toString()
        );

        if (isInRequest) {
          // Count how many customers from this request have COMPLETED payment
          const requestCustomerIds = request.customers.map(c => c.customerId.toString());
          const Customer = (await import('../models/Customer.js')).default;
          
          // Count contacted customers for tracking
          const contactedCustomers = await Customer.countDocuments({
            _id: { $in: requestCustomerIds },
            contactHistory: { $exists: true, $ne: [] }
          });

          // Count COMPLETED customers (payment made)
          const completedCustomers = await Customer.countDocuments({
            _id: { $in: requestCustomerIds },
            status: 'COMPLETED'
          });

          // Update request contacted count
          request.customersContacted = contactedCustomers;

          // Only mark request as completed when ALL customers have made payment (COMPLETED status)
          if (completedCustomers >= request.customersSent) {
            request.status = 'COMPLETED';
            request.isCompleted = true;

            // Keep customers assigned so they show in caller's completed section
            // Do NOT unassign customers - they stay assigned with COMPLETED status
            
            // Update caller status (keep customers assigned but update task status)
            const caller = await Caller.findById(customer.assignedTo._id);
            if (caller) {
              // Check if caller has any PENDING customers left
              const pendingCount = await Customer.countDocuments({
                assignedTo: caller._id,
                status: { $in: ['PENDING', 'OVERDUE'] }
              });
              
              // Update caller status based on pending work
              if (pendingCount === 0) {
                caller.taskStatus = 'IDLE';
              }
              
              await caller.save();
              console.log(`Request ${request.taskId} completed. All ${request.customersSent} customers paid. Customers remain assigned to ${caller.name}.`);
            }
          }

          await request.save();
          console.log(`Request ${request.taskId} progress: ${contactedCustomers}/${request.customersSent} contacted, ${completedCustomers}/${request.customersSent} paid`);
        }
      }
    }

    // Re-fetch customer with populated assignedTo to ensure we return complete data
    const updatedCustomer = await Customer.findById(customer._id).populate('assignedTo', 'name callerId');

    res.status(200).json({
      success: true,
      data: updatedCustomer
    });
  } catch (error) {
    console.error('Error updating customer contact:', error);
    res.status(400).json({
      success: false,
      message: 'Error updating customer contact',
      error: error.message
    });
  }
};

// @desc    Delete customer
// @route   DELETE /api/customers/:id
// @access  Public
const deleteCustomer = async (req, res) => {
  try {
    const customer = await Customer.findByIdAndDelete(req.params.id);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Customer deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting customer',
      error: error.message
    });
  }
};

export {
  getAllCustomers,
  getCustomerById,
  getCustomersByStatus,
  getAssignedCustomers,
  createCustomer,
  updateCustomer,
  updateCustomerContact,
  deleteCustomer
};
