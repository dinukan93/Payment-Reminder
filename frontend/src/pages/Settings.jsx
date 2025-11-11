import React, { useState, useEffect } from 'react';
import './Settings.css';
import { FaUser, FaBell, FaShieldAlt, FaCog, FaSave, FaEnvelope, FaPhone, FaMoon, FaSun } from 'react-icons/fa';

const Settings = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [preferences, setPreferences] = useState({
    emailNotifications: true,
    paymentReminder: true,
    callNotifications: false,
    darkMode: false,
    language: 'English',
    timezone: 'UTC'
  });

  // Apply dark mode to the entire document
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
  };

  const handlePreferenceChange = (name, value) => {
    setPreferences(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Settings saved:', { formData, preferences });
    // Add your save logic here
    alert('Settings saved successfully!');
  };

  return (
    <div className={`settings-container ${preferences.darkMode ? 'dark-mode' : ''}`}>
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

            <div className="section-divider"></div>
            
            <div className="save-profile-section">
                <button type="button" className="save-profile-button">
                    <FaSave className="save-icon" />
                        Save Profile
                </button>
            </div>
            
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
                  </select>
                </div>
              </div>

              <div className="preference-item">
                <div className="preference-content">
                  <label className="preference-label bold-label">Dark Mode :-</label>
                  <div className="preference-option">
                    <div className="dark-mode-toggle">
                      {preferences.darkMode ? (
                        <FaSun className="dark-mode-icon" />
                      ) : (
                        <FaMoon className="dark-mode-icon" />
                      )}
                      <p className="preference-description">
                        {preferences.darkMode ? 'Light mode theme' : 'Dark mode theme'}
                      </p>
                      <label className="toggle-switch">
                        <input
                          type="checkbox"
                          checked={preferences.darkMode}
                          onChange={(e) => handlePreferenceChange('darkMode', e.target.checked)}
                        />
                        <span className="toggle-slider"></span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>

        <button type="submit" className="save-button">
          Save All Settings
        </button>
      </form>
    </div>
  );
};

export default Settings;