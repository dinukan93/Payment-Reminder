const Customer = require('../models/Customer');

// @desc    Get all customers
// @route   GET /api/customers
// @access  Public
const getAllCustomers = async (req, res) => {
  try {
    const customers = await Customer.find().populate('assignedTo', 'name callerId');
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
    
    const customer = await Customer.findById(req.params.id);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    // Format current date as DD/MM/YYYY
    const today = new Date();
    const dateString = `${String(today.getDate()).padStart(2, '0')}/${String(today.getMonth() + 1).padStart(2, '0')}/${today.getFullYear()}`;

    // Add to contact history
    customer.contactHistory.push({
      date: dateString,
      outcome: callOutcome,
      response: customerResponse,
      promisedDate: promisedDate || '',
      paymentMade: paymentMade || false
    });

    // Update status and response
    customer.status = paymentMade ? 'COMPLETED' : 'PENDING';
    customer.response = customerResponse;
    customer.previousResponse = customerResponse;

    await customer.save();

    res.status(200).json({
      success: true,
      data: customer
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

module.exports = {
  getAllCustomers,
  getCustomerById,
  getCustomersByStatus,
  getAssignedCustomers,
  createCustomer,
  updateCustomer,
  updateCustomerContact,
  deleteCustomer
};
