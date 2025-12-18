import express from 'express';
import bcrypt from 'bcryptjs';
import Admin from '../models/Admin.js';
import isSuperAdmin from '../middleware/isSuperAdmin.js';

const router = express.Router();

// @route   GET /api/superadmin/admins
// @desc    Get all admins
// @access  Superadmin only
router.get('/admins', isSuperAdmin, async (req, res) => {
  try {
    const admins = await Admin.find({ role: { $in: ['admin', 'uploader'] } })
      .select('-password -token -otp -otpExpiry')
      .sort({ createdAt: -1 });
    
    res.json({ 
      success: true, 
      data: admins,
      count: admins.length
    });
  } catch (error) {
    console.error('Get admins error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching admins', 
      error: error.message 
    });
  }
});

// @route   POST /api/superadmin/admins
// @desc    Create a new admin or uploader
// @access  Superadmin only
router.post('/admins', isSuperAdmin, async (req, res) => {
  try {
    const { adminId, name, email, phone, password, role, rtom } = req.body;

    // Validation
    if (!adminId || !name || !email || !password || !role) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required fields: adminId, name, email, password, role' 
      });
    }

    if (!['admin', 'uploader'].includes(role)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Role must be either "admin" or "uploader"' 
      });
    }

    if (role === 'admin' && !rtom) {
      return res.status(400).json({ 
        success: false, 
        message: 'RTOM is required for admin role' 
      });
    }

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ 
      $or: [{ email }, { adminId }] 
    });

    if (existingAdmin) {
      return res.status(400).json({ 
        success: false, 
        message: 'Admin with this email or adminId already exists' 
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create admin
    const newAdmin = new Admin({
      adminId,
      name,
      email,
      phone: phone || '',
      password: hashedPassword,
      role,
      rtom: role === 'admin' ? rtom : undefined,
      isVerified: true // Superadmin-created admins are auto-verified
    });

    await newAdmin.save();

    // Remove sensitive data before sending response
    const adminData = newAdmin.toObject();
    delete adminData.password;
    delete adminData.token;
    delete adminData.otp;
    delete adminData.otpExpiry;

    res.status(201).json({ 
      success: true, 
      message: `${role.charAt(0).toUpperCase() + role.slice(1)} created successfully`, 
      data: adminData 
    });
  } catch (error) {
    console.error('Create admin error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error creating admin', 
      error: error.message 
    });
  }
});

// @route   PUT /api/superadmin/admins/:id
// @desc    Update an admin
// @access  Superadmin only
router.put('/admins/:id', isSuperAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone, role, rtom, isVerified } = req.body;

    const admin = await Admin.findById(id);
    if (!admin) {
      return res.status(404).json({ 
        success: false, 
        message: 'Admin not found' 
      });
    }

    // Prevent updating superadmin role
    if (admin.role === 'superadmin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Cannot modify superadmin account' 
      });
    }

    // Update fields
    if (name) admin.name = name;
    if (email) admin.email = email;
    if (phone !== undefined) admin.phone = phone;
    if (role && ['admin', 'uploader'].includes(role)) admin.role = role;
    if (rtom !== undefined) admin.rtom = rtom;
    if (isVerified !== undefined) admin.isVerified = isVerified;

    await admin.save();

    const adminData = admin.toObject();
    delete adminData.password;
    delete adminData.token;
    delete adminData.otp;
    delete adminData.otpExpiry;

    res.json({ 
      success: true, 
      message: 'Admin updated successfully', 
      data: adminData 
    });
  } catch (error) {
    console.error('Update admin error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error updating admin', 
      error: error.message 
    });
  }
});

// @route   DELETE /api/superadmin/admins/:id
// @desc    Delete an admin
// @access  Superadmin only
router.delete('/admins/:id', isSuperAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const admin = await Admin.findById(id);
    if (!admin) {
      return res.status(404).json({ 
        success: false, 
        message: 'Admin not found' 
      });
    }

    // Prevent deleting superadmin
    if (admin.role === 'superadmin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Cannot delete superadmin account' 
      });
    }

    await Admin.findByIdAndDelete(id);

    res.json({ 
      success: true, 
      message: 'Admin deleted successfully' 
    });
  } catch (error) {
    console.error('Delete admin error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error deleting admin', 
      error: error.message 
    });
  }
});

// @route   GET /api/superadmin/rtoms
// @desc    Get list of all RTOMs
// @access  Superadmin only
router.get('/rtoms', isSuperAdmin, async (req, res) => {
  try {
    const rtoms = await Admin.distinct('rtom', { role: 'admin', rtom: { $ne: null } });
    
    res.json({ 
      success: true, 
      data: rtoms 
    });
  } catch (error) {
    console.error('Get RTOMs error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching RTOMs', 
      error: error.message 
    });
  }
});

export default router;
