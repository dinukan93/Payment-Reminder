import React, { useState, useEffect, useRef } from 'react';
import './Settings.css';
import { FaUser, FaBell, FaShieldAlt, FaCog, FaSave, FaEnvelope, FaPhone, FaMoon, FaSun } from 'react-icons/fa';
import { useTheme } from '../context/ThemeContext';
import API_BASE_URL from '../config/api';

const Settings = () => {
  const { darkMode, toggleDarkMode } = useTheme();
  const [formData, setFormData] = useState({
    callerId: '',
    fullName: '',
    email: '',
    phoneNumber: '',
    avatar: '', // base64 or url
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // For image preview
  const [avatarPreview, setAvatarPreview] = useState('');
  const fileInputRef = useRef();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const [preferences, setPreferences] = useState({
    emailNotifications: true,
    paymentReminder: true,
    callNotifications: false,
    language: 'English',
    timezone: 'UTC'
  });

  // Load profile from localStorage on mount
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        // Try to get token from localStorage (if you use JWT auth)
        const userData = JSON.parse(localStorage.getItem('userData') || '{}');
        let callerId = userData.callerId || userData.adminId || '';
        let token = userData.token;
        let role = userData.role;
        let headers = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;

        // Fetch latest profile from backend
        const res = await fetch(`${API_BASE_URL}/users/profile`, { headers });
        if (res.ok) {
          const data = await res.json();
          const user = data.user || {};
          // Update localStorage and state
          localStorage.setItem('userData', JSON.stringify({ ...userData, ...user }));
          setFormData(prev => ({
            ...prev,
            callerId: user.callerId || user.adminId || '',
            fullName: user.name || '',
            email: user.email || '',
            phoneNumber: user.phone || '',
            avatar: user.avatar || '',
          }));
          setAvatarPreview(user.avatar || '');
        } else {
          // fallback to localStorage if backend fails
          setFormData(prev => ({
            ...prev,
            callerId: callerId,
            fullName: userData.name || '',
            email: userData.email || '',
            phoneNumber: userData.phoneNumber || '',
            avatar: userData.avatar || '',
          }));
          setAvatarPreview(userData.avatar || '');
        }
        // Load preferences from localStorage if available
        const savedPreferences = JSON.parse(localStorage.getItem('preferences') || '{}');
        if (Object.keys(savedPreferences).length > 0) {
          setPreferences(savedPreferences);
        }
      } catch (err) {
        // fallback to localStorage if error
        const userData = JSON.parse(localStorage.getItem('userData') || '{}');
        setFormData(prev => ({
          ...prev,
          callerId: userData.callerId || userData.adminId || '',
          fullName: userData.name || '',
          email: userData.email || '',
          phoneNumber: userData.phoneNumber || '',
          avatar: userData.avatar || '',
        }));
        setAvatarPreview(userData.avatar || '');
      }
    };
    fetchProfile();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
  };

  // Handle image upload
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Check file size (limit to 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('Image size must be less than 5MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, avatar: reader.result }));
        setAvatarPreview(reader.result);
        setError('');
      };
      reader.readAsDataURL(file);
    }
  };

  // Save profile image
  const saveProfileImage = async () => {
    try {
      if (!formData.callerId) {
        throw new Error('Caller ID is missing. Please refresh the page and try again.');
      }
      setLoading(true);
      setError('');
      setMessage('');

      const userData = JSON.parse(localStorage.getItem('userData') || '{}');
      const updatedUser = {
        callerId: userData.role === 'admin' ? undefined : formData.callerId,
        adminId: userData.role === 'admin' ? formData.callerId : undefined,
        avatar: formData.avatar,
      };
      // Remove undefined keys
      Object.keys(updatedUser).forEach(key => updatedUser[key] === undefined && delete updatedUser[key]);

      console.log('Sending profile image update payload:', updatedUser);
      const res = await fetch(`${API_BASE_URL}/users/profile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedUser)
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || `Server error: ${res.status}`);
      }
      // Save to localStorage as well
      localStorage.setItem('userData', JSON.stringify({ ...userData, avatar: formData.avatar }));
      setMessage('Profile image updated successfully!');
      window.dispatchEvent(new Event('storage'));
    } catch (err) {
      console.error('Save profile image error:', err);
      setError('Failed to save profile image: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Update profile information (name, email, phone)
  const updateProfileInfo = async () => {
    try {
      if (!formData.callerId) {
        throw new Error('Caller ID is missing.');
      }
      setLoading(true);
      setError('');
      setMessage('');

      const userData = JSON.parse(localStorage.getItem('userData') || '{}');
      const updatedUser = {
        callerId: userData.role === 'admin' ? undefined : formData.callerId,
        adminId: userData.role === 'admin' ? formData.callerId : undefined,
        name: formData.fullName,
        email: formData.email,
        phoneNumber: formData.phoneNumber,
        avatar: formData.avatar // Always send avatar with profile info
      };
      // Remove undefined keys
      Object.keys(updatedUser).forEach(key => updatedUser[key] === undefined && delete updatedUser[key]);

      console.log('Sending profile info update payload:', updatedUser);
      const res = await fetch(`${API_BASE_URL}/users/profile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedUser)
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || `Server error: ${res.status}`);
      }
      // Save to localStorage as well
      localStorage.setItem('userData', JSON.stringify({ 
        ...userData, 
        name: formData.fullName,
        email: formData.email,
        phoneNumber: formData.phoneNumber,
        avatar: formData.avatar
      }));
      setMessage('Profile information updated successfully!');
      window.dispatchEvent(new Event('storage'));
    } catch (err) {
      console.error('Update profile info error:', err);
      setError('Failed to update profile: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Change password
  const changePassword = async () => {
    try {
      if (!formData.currentPassword || !formData.newPassword || !formData.confirmPassword) {
        throw new Error('All password fields are required.');
      }
      if (formData.newPassword !== formData.confirmPassword) {
        throw new Error('New passwords do not match.');
      }
      if (formData.newPassword.length < 6) {
        throw new Error('New password must be at least 6 characters long.');
      }

      setLoading(true);
      setError('');
      setMessage('');

      const res = await fetch(`${API_BASE_URL}/api/auth/change-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword
        })
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to change password');
      }

      setMessage('Password changed successfully!');
      setFormData(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }));
    } catch (err) {
      console.error('Change password error:', err);
      setError('Failed to change password: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePreferenceChange = (name, value) => {
    setPreferences(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
  };

  // Save preferences
  const savePreferences = () => {
    try {
      localStorage.setItem('preferences', JSON.stringify(preferences));
      setMessage('Preferences saved successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setError('Failed to save preferences: ' + err.message);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Settings saved:', { formData, preferences });
    setMessage('All settings saved successfully!');
  };

  return (
    <div className={`settings-container ${darkMode ? 'dark-mode' : ''}`}>
      {/* Header with Settings Icon - Left Aligned */}
      <div className="settings-header">
        <div className="header-content">
          <FaCog className="header-icon" />
          <div className="header-text">
            <h1 className="settings-title">Settings</h1>
            <p className="settings-subtitle">Manage your account settings and preferences</p>
          </div>
        </div>
      </div>

      {/* Alert Messages */}
      {message && (
        <div style={{
          padding: '12px 16px',
          marginBottom: '16px',
          backgroundColor: '#d4edda',
          color: '#155724',
          border: '1px solid #c3e6cb',
          borderRadius: '4px'
        }}>
          {message}
        </div>
      )}
      {error && (
        <div style={{
          padding: '12px 16px',
          marginBottom: '16px',
          backgroundColor: '#f8d7da',
          color: '#721c24',
          border: '1px solid #f5c6cb',
          borderRadius: '4px'
        }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="settings-form">
        {/* First Row: Profile Settings + Notifications */}
        <div className="settings-row">
          {/* Profile Settings Section - Left Aligned */}
          <section className="settings-section">
            <div className="section-header">
              <FaUser className="section-icon" />
              <h2 className="section-title">Profile Settings</h2>
            </div>
            <p className="section-description">Update your personal information</p>

            {/* Caller ID */}
            <div className="form-group">
              <label className="form-label bold-label">Caller ID :-</label>
              <input
                type="text"
                name="callerId"
                value={formData.callerId || ''}
                disabled
                className="form-input"
                placeholder="Caller ID"
              />
            </div>

            {/* Profile Image Upload */}
            <div className="form-group" style={{ textAlign: 'center', marginBottom: 18 }}>
              <label className="form-label bold-label" style={{ display: 'block', marginBottom: 8 }}>Profile Image</label>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <img
                  src={avatarPreview || '/default-avatar.png'}
                  alt="Profile Preview"
                  style={{ width: 90, height: 90, borderRadius: '50%', objectFit: 'cover', marginBottom: 8, border: '2px solid #eee' }}
                />
                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  style={{ display: 'none' }}
                  onChange={handleImageChange}
                />
                <button
                  type="button"
                  className="upload-image-btn"
                  style={{ marginBottom: 8 }}
                  onClick={() => fileInputRef.current && fileInputRef.current.click()}
                  disabled={loading}
                >Upload Image</button>
                {avatarPreview && (
                  <button
                    type="button"
                    className="remove-image-btn"
                    style={{ color: '#d00', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.95em' }}
                    onClick={() => { setFormData(prev => ({ ...prev, avatar: '' })); setAvatarPreview(''); }}
                    disabled={loading}
                  >Remove Image</button>
                )}
              </div>
            </div>

            {/* Full Name */}
            <div className="form-group">
              <label className="form-label bold-label">Full Name :-</label>
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleInputChange}
                className="form-input"
                placeholder="Enter your full name"
              />
            </div>

            {/* Email */}
            <div className="form-group">
              <label className="form-label">Email :-</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="form-input"
                placeholder="Enter your email"
              />
            </div>

            {/* Phone Number */}
            <div className="form-group">
              <label className="form-label bold-label">Phone Number :-</label>
              <input
                type="tel"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleInputChange}
                className="form-input"
                placeholder="Enter your phone number"
              />
            </div>

            <button
              type="button"
              className="save-button"
              onClick={updateProfileInfo}
              disabled={loading}
              style={{ marginTop: 12, width: '100%' }}
            >
              {loading ? 'Saving...' : 'Save Profile Info'}
            </button>

            <div className="section-divider"></div>
          </section>

          {/* Notifications Section */}
          <section className="settings-section">
            <div className="section-header">
              <FaBell className="section-icon" />
              <h2 className="section-title">Notifications</h2>
            </div>
            <p className="section-description">Manage your notification preferences</p>

            <div className="toggle-group">
              <div className="toggle-item">
                <div className="toggle-content">
                  <div className="toggle-header">
                    <FaEnvelope className="toggle-icon" />
                    <label className="toggle-label bold-label">Email Notifications</label>
                  </div>
                  <p className="toggle-description">Receive email updates</p>
                </div>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={preferences.emailNotifications}
                    onChange={(e) => handlePreferenceChange('emailNotifications', e.target.checked)}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>

              <div className="section-divider"></div>

              <div className="toggle-item">
                <div className="toggle-content">
                  <div className="toggle-header">
                    <FaBell className="toggle-icon" />
                    <h3 className="toggle-title">Payment Reminder</h3>
                  </div>
                  <p className="toggle-description">Get notified about overdue payments</p>
                </div>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={preferences.paymentReminder}
                    onChange={(e) => handlePreferenceChange('paymentReminder', e.target.checked)}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>

              <div className="section-divider"></div>

              <div className="toggle-item">
                <div className="toggle-content">
                  <div className="toggle-header">
                    <FaPhone className="toggle-icon" />
                    <h3 className="toggle-title">Call Notifications</h3>
                  </div>
                  <p className="toggle-description">Alerts for new customer call</p>
                </div>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={preferences.callNotifications}
                    onChange={(e) => handlePreferenceChange('callNotifications', e.target.checked)}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>
            </div>

            <button
              type="button"
              className="save-button"
              onClick={savePreferences}
              style={{ marginTop: 12, width: '100%' }}
            >
              Save Notification Preferences
            </button>
          </section>
        </div>

        {/* Second Row: Security + System Preferences */}
        <div className="settings-row">
          {/* Security Section */}
          <section className="settings-section">
            <div className="section-header">
              <FaShieldAlt className="section-icon" />
              <h2 className="section-title">Security</h2>
            </div>
            <p className="section-description">Manage your security settings</p>

            <div className="form-group">
              <label className="form-label bold-label">Current Password :-</label>
              <input
                type="password"
                name="currentPassword"
                value={formData.currentPassword}
                onChange={handleInputChange}
                className="form-input"
                placeholder="Enter current password"
              />
            </div>

            <div className="section-divider"></div>

            <div className="form-group">
              <label className="form-label bold-label">New Password :-</label>
              <input
                type="password"
                name="newPassword"
                value={formData.newPassword}
                onChange={handleInputChange}
                className="form-input"
                placeholder="Enter new password"
              />
            </div>

            <div className="form-group">
              <label className="form-label bold-label">Confirm New Password :-</label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                className="form-input"
                placeholder="Confirm new password"
              />
            </div>

            <button
              type="button"
              className="save-button"
              onClick={changePassword}
              disabled={loading}
              style={{ marginTop: 12, width: '100%' }}
            >
              {loading ? 'Changing...' : 'Change Password'}
            </button>

            <div className="section-divider"></div>
          </section>

          {/* System Preferences Section */}
          <section className="settings-section">
            <div className="section-header">
              <FaCog className="section-icon" />
              <h2 className="section-title">System Preferences</h2>
            </div>

            <div className="preference-group">
              <div className="preference-item">
                <label className="preference-label bold-label">Language :-</label>
                <div className="preference-option">
                  <select
                    className="preference-select"
                    value={preferences.language}
                    onChange={(e) => handlePreferenceChange('language', e.target.value)}
                  >
                    <option value="English">English</option>
                    <option value="Spanish">Spanish</option>
                    <option value="French">French</option>
                  </select>
                </div>
              </div>

              <div className="preference-item">
                <label className="preference-label bold-label">Timezone :-</label>
                <div className="preference-option">
                  <select
                    className="preference-select"
                    value={preferences.timezone}
                    onChange={(e) => handlePreferenceChange('timezone', e.target.value)}
                  >
                    <option value="UTC">UTC</option>
                    <option value="EST">EST</option>
                    <option value="PST">PST</option>
                    <option value="IST">IST</option>
                    <option value="GMT">GMT</option>
                  </select>
                </div>
              </div>

              <div className="preference-item">
                <div className="preference-content">
                  <label className="preference-label bold-label">Dark Mode :-</label>
                  <div className="preference-option">
                    <div className="dark-mode-toggle">
                      {darkMode ? (
                        <FaSun className="dark-mode-icon" />
                      ) : (
                        <FaMoon className="dark-mode-icon" />
                      )}
                      <p className="preference-description">
                        {darkMode ? 'Light mode theme' : 'Dark mode theme'}
                      </p>
                      <label className="toggle-switch">
                        <input
                          type="checkbox"
                          checked={darkMode}
                          onChange={toggleDarkMode}
                        />
                        <span className="toggle-slider"></span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <button
              type="button"
              className="save-button"
              onClick={savePreferences}
              style={{ marginTop: 12, width: '100%' }}
            >
              Save System Preferences
            </button>
          </section>
        </div>
      </form>
    </div>
  );
};

export default Settings;