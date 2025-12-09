import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import './Settings.css';
import { useTheme } from "../context/ThemeContext";
import { FaUser, FaBell, FaShieldAlt, FaCog, FaSave, FaEnvelope, FaPhone, FaMoon, FaSun } from 'react-icons/fa';
import API_BASE_URL from "../config/api";

const Settings = () => {
  const { darkMode, toggleDarkMode } = useTheme();
  const [formData, setFormData] = useState({
    callerId: '',
    name: '',
    email: '',
    phone: '',
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
    emailNotifications: false,
    paymentReminder: false,
    callNotifications: false,
    language: 'English',
    timezone: 'UTC',
    darkMode: false
  });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(`${API_BASE_URL}/api/settings`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        // Set profile data
        setFormData(prev => ({
          ...prev,
          callerId: res.data.callerId || '',
          name: res.data.name || '',
          email: res.data.email || '',
          phone: res.data.phone || '',
          avatar: res.data.avatar || '',
        }));

        // Set avatar preview if available
        if (res.data.avatar) {
          setAvatarPreview(res.data.avatar);
        }

        // Set preferences (flat structure)
        if (res.data.preferences) {
          setPreferences({
            emailNotifications: res.data.preferences.emailNotifications || false,
            paymentReminder: res.data.preferences.paymentReminder || false,
            callNotifications: res.data.preferences.callNotifications || false,
            language: res.data.preferences.language || 'English',
            timezone: res.data.preferences.timezone || 'UTC',
            darkMode: res.data.preferences.darkMode || false
          });
        }
      } catch (err) {
        console.error('Failed to load settings', err);
        setError('Failed to load settings');
      }
    };
    fetchSettings();
  }, []);

  // Load profile from localStorage on mount
  useEffect(() => {
    if (preferences.darkMode) {
      document.documentElement.setAttribute('data-theme', 'dark');
      document.body.classList.add('dark-mode');
    } else {
      document.documentElement.setAttribute('data-theme', 'light');
      document.body.classList.remove('dark-mode');
    }
  }, [preferences.darkMode]);

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
      setLoading(true);
      setError('');
      setMessage('');

      const token = localStorage.getItem('token');
      const res = await axios.put(
        `${API_BASE_URL}/api/settings/profile`,
        { avatar: formData.avatar },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setMessage('Profile image updated successfully!');

      // Update localStorage
      const userData = JSON.parse(localStorage.getItem('userData') || '{}');
      localStorage.setItem('userData', JSON.stringify({ ...userData, avatar: formData.avatar }));
      window.dispatchEvent(new Event('storage'));
    } catch (err) {
      console.error('Save profile image error:', err);
      setError(err.response?.data?.msg || 'Failed to save profile image');
    } finally {
      setLoading(false);
    }
  };

  // Remove profile image (clear avatar on server and update local state/storage)
  const removeProfileImage = async () => {
    try {
      setLoading(true);
      setError('');
      setMessage('');

      const token = localStorage.getItem('token');
      await axios.put(
        `${API_BASE_URL}/api/settings/profile`,
        { avatar: '' },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Clear local state and localStorage
      setFormData(prev => ({ ...prev, avatar: '' }));
      setAvatarPreview('');
      const userData = JSON.parse(localStorage.getItem('userData') || '{}');
      localStorage.setItem('userData', JSON.stringify({ ...userData, avatar: '' }));
      window.dispatchEvent(new Event('storage'));

      setMessage('Profile image removed');
    } catch (err) {
      console.error('Remove profile image error:', err);
      setError(err.response?.data?.msg || 'Failed to remove profile image');
    } finally {
      setLoading(false);
    }
  };

  // Update profile information (name, email, phone)
  const updateProfileInfo = async () => {
    try {
      // Validation
      if (!formData.name || !formData.name.trim()) {
        setError('Name is required');
        return;
      }
      if (!formData.email || !formData.email.trim()) {
        setError('Email is required');
        return;
      }
      // Basic email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        setError('Please enter a valid email address');
        return;
      }

      setLoading(true);
      setError('');
      setMessage('');

      const token = localStorage.getItem('token');
      const res = await axios.put(
        `${API_BASE_URL}/api/settings/profile`,
        {
          name: formData.name.trim(),
          email: formData.email.trim().toLowerCase(),
          phone: formData.phone.trim(),
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setMessage(res.data.msg || 'Profile updated successfully!');

      // Update localStorage
      const userData = JSON.parse(localStorage.getItem('userData') || '{}');
      localStorage.setItem('userData', JSON.stringify({
        ...userData,
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim(),
      }));
      window.dispatchEvent(new Event('storage'));
    } catch (err) {
      console.error('Update profile info error:', err);
      setError(err.response?.data?.msg || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  // Change password
  const changePassword = async () => {
    try {
      if (!formData.currentPassword || !formData.newPassword || !formData.confirmPassword) {
        setError('All password fields are required.');
        return;
      }
      if (formData.newPassword !== formData.confirmPassword) {
        setError('New passwords do not match.');
        return;
      }
      if (formData.newPassword.length < 6) {
        setError('New password must be at least 6 characters long.');
        return;
      }

      setLoading(true);
      setError('');
      setMessage('');

      const token = localStorage.getItem('token');
      const res = await axios.put(
        `${API_BASE_URL}/api/settings/password`,
        {
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setMessage(res.data.msg || 'Password changed successfully!');
      setFormData(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }));
    } catch (err) {
      console.error('Change password error:', err);
      setError(err.response?.data?.msg || 'Failed to change password');
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

  // Handle dark mode toggle
  const handleDarkModeToggle = () => {
    const newDarkMode = !darkMode;
    toggleDarkMode(); // Update theme context
    setPreferences(prev => ({
      ...prev,
      darkMode: newDarkMode
    }));
  };

  // Save preferences
  const saveNotificationPreferences = async () => {
    try {
      setLoading(true);
      setError('');
      setMessage('');

      const { emailNotifications, paymentReminder, callNotifications } = preferences;
      const token = localStorage.getItem('token');
      await axios.put(
        `${API_BASE_URL}/api/settings/preferences?type=notification`,
        { emailNotifications, paymentReminder, callNotifications },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setMessage('Notification preferences saved successfully!');
    } catch (err) {
      console.error("Failed to update preferences:", err);
      setError(err.response?.data?.msg || 'Failed to update notification preferences');
    } finally {
      setLoading(false);
    }
  };

  const saveSystemPreferences = async () => {
    try {
      setLoading(true);
      setError('');
      setMessage('');

      const { language, timezone, darkMode } = preferences;
      const token = localStorage.getItem('token');
      await axios.put(
        `${API_BASE_URL}/api/settings/preferences?type=system`,
        { language, timezone, darkMode },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setMessage('System preferences saved successfully!');
    } catch (err) {
      console.error("Failed to update preferences:", err);
      setError(err.response?.data?.msg || 'Failed to update system preferences');
    } finally {
      setLoading(false);
    }
  }

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
                >
                  {loading ? 'Uploading...' : 'Choose Image'}
                </button>
                {avatarPreview && formData.avatar && (
                  <>
                    <button
                      type="button"
                      className="save-button"
                      style={{ marginBottom: 8, padding: '8px 20px', fontSize: '0.9em' }}
                      onClick={saveProfileImage}
                      disabled={loading}
                    >
                      {loading ? 'Saving...' : 'Save Image'}
                    </button>
                    <button
                      type="button"
                      className="remove-image-btn"
                      style={{ color: '#d00', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.95em' }}
                      onClick={removeProfileImage}
                      disabled={loading}
                    >Remove Image</button>
                  </>
                )}
              </div>
            </div>

            <div className="section-divider"></div>

            {/* Full Name */}
            <div className="form-group">
              <label className="form-label bold-label">Full Name :-</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="form-input"
                placeholder="Enter your name"
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
                name="phone"
                value={formData.phone}
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
              onClick={saveNotificationPreferences}
              disabled={loading}
              style={{ marginTop: 12, width: '100%' }}
            >
              {loading ? 'Saving...' : 'Save Notification Preferences'}
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
                          onChange={handleDarkModeToggle}
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
              onClick={saveSystemPreferences}
              disabled={loading}
              style={{ marginTop: 12, width: '100%' }}
            >
              {loading ? 'Saving...' : 'Save System Preferences'}
            </button>
          </section>
        </div>
      </form>
    </div>
  );
};

export default Settings;