const Caller = require('../models/Caller');
const bcrypt = require('bcryptjs');

// @desc    Get all callers
// @route   GET /api/callers
// @access  Public
const getAllCallers = async (req, res) => {
  try {
    const callers = await Caller.find().select('-password').populate('assignedCustomers');
    res.status(200).json({
      success: true,
      count: callers.length,
      data: callers
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching callers',
      error: error.message
    });
  }
};

// @desc    Get available callers
// @route   GET /api/callers/available
// @access  Public
const getAvailableCallers = async (req, res) => {
  try {
    const callers = await Caller.find({ status: 'AVAILABLE' }).select('-password');
    res.status(200).json({
      success: true,
      count: callers.length,
      data: callers
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching available callers',
      error: error.message
    });
  }
};

// @desc    Get caller by ID
// @route   GET /api/callers/:id
// @access  Public
const getCallerById = async (req, res) => {
  try {
    const caller = await Caller.findById(req.params.id).select('-password').populate('assignedCustomers');
    
    if (!caller) {
      return res.status(404).json({
        success: false,
        message: 'Caller not found'
      });
    }

    res.status(200).json({
      success: true,
      data: caller
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching caller',
      error: error.message
    });
  }
};

// @desc    Create new caller
// @route   POST /api/callers
// @access  Public
const createCaller = async (req, res) => {
  try {
    const { name, email, password, callerId } = req.body;

    // Check if caller already exists
    const existingCaller = await Caller.findOne({ $or: [{ email }, { callerId }] });
    if (existingCaller) {
      return res.status(400).json({
        success: false,
        message: 'Caller with this email or ID already exists'
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const caller = await Caller.create({
      ...req.body,
      password: hashedPassword
    });

    // Remove password from response
    const callerResponse = caller.toObject();
    delete callerResponse.password;

    res.status(201).json({
      success: true,
      data: callerResponse
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error creating caller',
      error: error.message
    });
  }
};

// @desc    Update caller
// @route   PUT /api/callers/:id
// @access  Public
const updateCaller = async (req, res) => {
  try {
    // If password is being updated, hash it
    if (req.body.password) {
      const salt = await bcrypt.genSalt(10);
      req.body.password = await bcrypt.hash(req.body.password, salt);
    }

    const caller = await Caller.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).select('-password');

    if (!caller) {
      return res.status(404).json({
        success: false,
        message: 'Caller not found'
      });
    }

    res.status(200).json({
      success: true,
      data: caller
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error updating caller',
      error: error.message
    });
  }
};

// @desc    Update caller workload
// @route   PUT /api/callers/:id/workload
// @access  Public
const updateCallerWorkload = async (req, res) => {
  try {
    const { currentLoad, customersContacted } = req.body;
    
    const caller = await Caller.findById(req.params.id);

    if (!caller) {
      return res.status(404).json({
        success: false,
        message: 'Caller not found'
      });
    }

    if (currentLoad !== undefined) {
      caller.currentLoad = currentLoad;
    }
    if (customersContacted !== undefined) {
      caller.customersContacted = customersContacted;
    }

    // Update task status based on workload
    if (caller.currentLoad === 0) {
      caller.taskStatus = 'IDLE';
    } else if (caller.currentLoad < caller.maxLoad) {
      caller.taskStatus = 'ONGOING';
    } else {
      caller.taskStatus = 'COMPLETED';
    }

    await caller.save();

    res.status(200).json({
      success: true,
      data: caller
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error updating caller workload',
      error: error.message
    });
  }
};

// @desc    Delete caller
// @route   DELETE /api/callers/:id
// @access  Public
const deleteCaller = async (req, res) => {
  try {
    const caller = await Caller.findByIdAndDelete(req.params.id);

    if (!caller) {
      return res.status(404).json({
        success: false,
        message: 'Caller not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Caller deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting caller',
      error: error.message
    });
  }
};

module.exports = {
  getAllCallers,
  getAvailableCallers,
  getCallerById,
  createCaller,
  updateCaller,
  updateCallerWorkload,
  deleteCaller
};
