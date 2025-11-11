const express = require('express');
const router = express.Router();
const {
  getAllRequests,
  getRequestById,
  createRequest,
  updateRequest,
  acceptRequest,
  declineRequest,
  getRequestsByCallerId,
  getPendingRequests
} = require('../controllers/requestController');

// @route   GET /api/requests
// @desc    Get all requests
// @access  Public
router.get('/', getAllRequests);

// @route   GET /api/requests/pending
// @desc    Get pending requests
// @access  Public
router.get('/pending', getPendingRequests);

// @route   GET /api/requests/caller/:callerId
// @desc    Get requests by caller ID
// @access  Public
router.get('/caller/:callerId', getRequestsByCallerId);

// @route   GET /api/requests/:id
// @desc    Get request by ID
// @access  Public
router.get('/:id', getRequestById);

// @route   POST /api/requests
// @desc    Create new request (admin assigns customers to caller)
// @access  Public
router.post('/', createRequest);

// @route   PUT /api/requests/:id
// @desc    Update request
// @access  Public
router.put('/:id', updateRequest);

// @route   PUT /api/requests/:id/accept
// @desc    Accept request
// @access  Public
router.put('/:id/accept', acceptRequest);

// @route   PUT /api/requests/:id/decline
// @desc    Decline request
// @access  Public
router.put('/:id/decline', declineRequest);

module.exports = router;
