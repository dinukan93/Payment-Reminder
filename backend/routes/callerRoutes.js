const express = require('express');
const router = express.Router();
const {
  getAllCallers,
  getCallerById,
  createCaller,
  updateCaller,
  deleteCaller,
  getAvailableCallers,
  updateCallerWorkload
} = require('../controllers/callerController');

// @route   GET /api/callers
// @desc    Get all callers
// @access  Public
router.get('/', getAllCallers);

// @route   GET /api/callers/available
// @desc    Get available callers
// @access  Public
router.get('/available', getAvailableCallers);

// @route   GET /api/callers/:id
// @desc    Get caller by ID
// @access  Public
router.get('/:id', getCallerById);

// @route   POST /api/callers
// @desc    Create new caller
// @access  Public
router.post('/', createCaller);

// @route   PUT /api/callers/:id
// @desc    Update caller
// @access  Public
router.put('/:id', updateCaller);

// @route   PUT /api/callers/:id/workload
// @desc    Update caller workload
// @access  Public
router.put('/:id/workload', updateCallerWorkload);

// @route   DELETE /api/callers/:id
// @desc    Delete caller
// @access  Public
router.delete('/:id', deleteCaller);

module.exports = router;
