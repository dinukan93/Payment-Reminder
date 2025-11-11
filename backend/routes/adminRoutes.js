const express = require('express');
const router = express.Router();
const {
  getDashboardStats,
  getAssignedCallers,
  getUnassignedCallers,
  getSentRequests,
  getWeeklyCalls,
  getCompletedPayments,
  getCallerDetails
} = require('../controllers/adminController');

// Dashboard statistics
router.get('/stats', getDashboardStats);

// Caller management
router.get('/assigned-callers', getAssignedCallers);
router.get('/unassigned-callers', getUnassignedCallers);
router.get('/callers/:id/details', getCallerDetails);

// Requests tracking
router.get('/sent-requests', getSentRequests);

// Analytics
router.get('/weekly-calls', getWeeklyCalls);
router.get('/completed-payments', getCompletedPayments);

module.exports = router;
