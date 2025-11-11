const express = require('express');
const router = express.Router();
const {
  getAllCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  getCustomersByStatus,
  getAssignedCustomers,
  updateCustomerContact
} = require('../controllers/customerController');

// @route   GET /api/customers
// @desc    Get all customers
// @access  Public
router.get('/', getAllCustomers);

// @route   GET /api/customers/status/:status
// @desc    Get customers by status
// @access  Public
router.get('/status/:status', getCustomersByStatus);

// @route   GET /api/customers/assigned/:callerId
// @desc    Get customers assigned to a specific caller
// @access  Public
router.get('/assigned/:callerId', getAssignedCustomers);

// @route   GET /api/customers/:id
// @desc    Get customer by ID
// @access  Public
router.get('/:id', getCustomerById);

// @route   POST /api/customers
// @desc    Create new customer
// @access  Public
router.post('/', createCustomer);

// @route   PUT /api/customers/:id
// @desc    Update customer
// @access  Public
router.put('/:id', updateCustomer);

// @route   PUT /api/customers/:id/contact
// @desc    Update customer contact history
// @access  Public
router.put('/:id/contact', updateCustomerContact);

// @route   DELETE /api/customers/:id
// @desc    Delete customer
// @access  Public
router.delete('/:id', deleteCustomer);

module.exports = router;
