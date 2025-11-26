import bcrypt from 'bcryptjs';
import getUserModel from '../utils/getUserModel.js';

export const getSettings = async (req, res) => {
  try {
    console.log('\n GET SETTINGS REQUEST');
    const { id, role } = req.user;

    console.log('User ID:', id);
    console.log('Role:', role);

    const Model = getUserModel(role);
    if (!Model) {
      return res.status(400).json({ msg: 'Invalid user role' });
    }

    const user = await Model.findById(id).select('-password');

    if (!user) {
      console.log(' User not found');
      return res.status(404).json({ msg: 'User not found' });
    }

    console.log('USER FOUND IN DATABASE');
  console.log('Name:', user.name);
  console.log('Email:', user.email);
  console.log('Phone:', user.phone);
    console.log('Preferences:', user.preferences);

    res.json({
      callerId: user.callerId || user.adminId || id,
      name: user.name,
      email: user.email,
      phone: user.phone || '',
      avatar: user.avatar || '',
      preferences: user.preferences || { notification: {}, system: {} }
    });

  } catch (err) {
    console.error(' GET SETTINGS ERROR:', err);
    res.status(500).json({ msg: 'Server error' });
  }
};

export const updateProfile = async (req, res) => {
  try {
  const { name, email, phone, avatar } = req.body;
    const { id, role } = req.user;

    console.log('\n UPDATE PROFILE REQUEST');
    console.log('User ID:', id);
    console.log('Role:', role);

    const Model = getUserModel(role);
    if (!Model) {
      return res.status(400).json({ msg: 'Invalid user role' });
    }

    // Check if email is being updated and if it's already in use
    if (email) {
      const existingUser = await Model.findOne({
        email: email.toLowerCase(),
        _id: { $ne: id }
      });

      if (existingUser) {
        console.log(' Email already in use by another user');
        return res.status(400).json({ msg: 'Email already in use' });
      }
    }

    // Build update object
    const updateData = {};
  if (name !== undefined) updateData.name = name?.trim();
    if (email !== undefined) updateData.email = email?.toLowerCase()?.trim();
  if (phone !== undefined) updateData.phone = phone?.trim() || '';
    if (avatar !== undefined) updateData.avatar = avatar;

    const updatedUser = await Model.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select('-password');

    if (!updatedUser) {
      return res.status(404).json({ msg: 'User not found' });
    }

    console.log(' PROFILE UPDATED IN DATABASE');
  console.log('Name:', updatedUser.name);
  console.log('Email:', updatedUser.email);
  console.log('Phone:', updatedUser.phone);

    res.json({
      msg: 'Profile updated successfully',
      user: {
        name: updatedUser.name,
        email: updatedUser.email,
        phone: updatedUser.phone,
        avatar: updatedUser.avatar
      }
    });

  } catch (err) {
    console.error(' UPDATE PROFILE ERROR:', err);
    res.status(500).json({ msg: 'Failed to update profile' });
  }
};

export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const { id, role } = req.user;

    console.log('\n CHANGE PASSWORD REQUEST');
    console.log('User ID:', id);
    console.log('Role:', role);

    const Model = getUserModel(role);
    if (!Model) return res.status(400).json({ msg: 'Invalid user role' });

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ msg: 'Please provide both passwords' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ msg: 'Password must be at least 6 characters' });
    }

    const user = await Model.findById(id);
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ msg: 'Current password is incorrect' });
    }

    user.password = await bcrypt.hash(newPassword, 12);
    await user.save();

    console.log('PASSWORD CHANGED SUCCESSFULLY');

    res.json({ msg: 'Password changed successfully' });

  } catch (err) {
    console.error(' CHANGE PASSWORD ERROR:', err);
    res.status(500).json({ msg: 'Server error' });
  }
};

export const updatePreferences = async (req, res) => {
  try {
    const { id, role } = req.user;
    const { type } = req.query;

    console.log('\n UPDATE PREFERENCES REQUEST');
    console.log('User ID:', id);
    console.log('Role:', role);
    console.log('Type:', type);
    console.log('New Preferences:', req.body);

    const Model = getUserModel(role);
    if (!Model) {
      return res.status(400).json({ msg: 'Invalid user role' });
    }

    // Validate preference type
    if (!type || !['notification', 'system'].includes(type)) {
      return res.status(400).json({ msg: 'Invalid type. Must be "notification" or "system"' });
    }

    // Validate that we have preference data to update
    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({ msg: 'No preferences provided' });
    }

    // Build update object for flat preferences structure
    const updateFields = {};
    Object.keys(req.body).forEach(key => {
      updateFields[`preferences.${key}`] = req.body[key];
    });

    const updatedUser = await Model.findByIdAndUpdate(
      id,
      { $set: updateFields },
      { new: true, runValidators: true }
    ).select('preferences');

    if (!updatedUser) {
      return res.status(404).json({ msg: 'User not found' });
    }

    console.log(' PREFERENCES UPDATED IN DATABASE');
    console.log('Updated Preferences:', updatedUser.preferences);

    res.json({
      msg: 'Preferences updated successfully',
      preferences: updatedUser.preferences
    });

  } catch (err) {
    console.error(' UPDATE PREFERENCES ERROR:', err);
    res.status(500).json({ msg: 'Failed to update preferences' });
  }
};