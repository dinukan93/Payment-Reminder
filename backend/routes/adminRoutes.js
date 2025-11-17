import express from 'express';
import { getDashboardStats, getAssignedCallers, getUnassignedCallers, getSentRequests, getWeeklyCalls, getCompletedPayments, getCallerDetails } from '../controllers/adminController.js';

const router = express.Router();

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

export default router;
