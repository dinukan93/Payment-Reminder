import React, { useState, useEffect, useRef } from "react";
import "./Settings.css";
import { useTheme } from "../context/ThemeContext";
import {
  FaUser,
  FaBell,
  FaShieldAlt,
  FaCog,
  FaSave,
  FaEnvelope,
  FaPhone,
  FaMoon,
  FaSun,
} from "react-icons/fa";
import { toast } from "react-toastify";
import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";
import { secureFetch } from "../utils/api";

const Settings = () => {
  const { darkMode, toggleDarkMode } = useTheme();

  const [formData, setFormData] = useState({
    callerId: "",
    name: "",
    email: "",
    phone: "",
    avatar: "", // base64 or url
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // For image preview
  const [avatarPreview, setAvatarPreview] = useState("");
  const fileInputRef = useRef();

  const [loadingImage, setLoadingImage] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [loadingPassword, setLoadingPassword] = useState(false);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const [loadingSystem, setLoadingSystem] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [preferences, setPreferences] = useState({
    emailNotifications: false,
    paymentReminder: false,
    callNotifications: false,
    language: "English",
    timezone: "UTC",
    darkMode: false,
  });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await secureFetch("/api/settings", {
          method: "GET",
        });
        const data = await res.json();

        if (!res.ok) throw new Error(data.error || "Failed to load settings");

        // Data load successful

        // Set profile data
        setFormData((prev) => ({
          ...prev,
          callerId: data.callerId || "",
          name: data.name || "",
          email: data.email || "",
          phone: data.phone || "",
          avatar: data.avatar || "",
        }));

        // Set avatar preview if available
        if (data.avatar) {
          setAvatarPreview(data.avatar);
        }

        // Set preferences
        if (data.preferences) {
          setPreferences({
            emailNotifications: data.preferences.emailNotifications || false,
            paymentReminder: data.preferences.paymentReminder || false,
            callNotifications: data.preferences.callNotifications || false,
            language: data.preferences.language || "English",
            timezone: data.preferences.timezone || "UTC",
            darkMode: darkMode, // Use context value
          });
        }
      } catch (err) {
        // Fail silenty or show notifications already handled
        toast.error(err.message || "Failed to load settings");
      }
    };

    fetchSettings();
  }, [darkMode]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Handle image upload
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image size must be less than 5MB");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => ({ ...prev, avatar: reader.result }));
        setAvatarPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Save profile image
  const saveProfileImage = async () => {
    try {
      setLoadingImage(true);
      const res = await secureFetch("/api/settings/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatar: formData.avatar }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.msg || "Failed to save profile image");
      toast.success(data.msg || "Profile image updated successfully!");

      // Update localStorage
      const userData = JSON.parse(localStorage.getItem("userData") || "{}");
      localStorage.setItem(
        "userData",
        JSON.stringify({ ...userData, avatar: formData.avatar }),
      );
      window.dispatchEvent(new Event("storage"));
    } catch (err) {
      toast.error(err.message || "Failed to save profile image");
    } finally {
      setLoadingImage(false);
    }
  };

  // Remove profile image
  const removeProfileImage = async () => {
    try {
      setLoadingImage(true);
      const res = await secureFetch("/api/settings/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatar: "" }),
      });
      const data = await res.json();

      if (!res.ok)
        throw new Error(data.msg || "Failed to remove profile image");

      setFormData((prev) => ({ ...prev, avatar: "" }));
      setAvatarPreview("");

      const userData = JSON.parse(localStorage.getItem("userData") || "{}");
      localStorage.setItem(
        "userData",
        JSON.stringify({ ...userData, avatar: "" }),
      );
      window.dispatchEvent(new Event("storage"));

      toast.success("Profile image removed");
    } catch (err) {
      toast.error(err.message || "Failed to remove profile image");
    } finally {
      setLoadingImage(false);
    }
  };

  // Update profile information
  const updateProfileInfo = async () => {
    try {
      if (!formData.name?.trim()) {
        toast.error("Name is required");
        return;
      }
      if (!formData.email?.trim()) {
        toast.error("Email is required");
        return;
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        toast.error("Please enter a valid email address");
        return;
      }

      setLoadingProfile(true);
      const res = await secureFetch("/api/settings/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name.trim(),
          email: formData.email.trim().toLowerCase(),
          phone: formData.phone.trim(),
        }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.msg || "Failed to update profile");
      toast.success(data.msg || "Profile updated successfully!");

      // Update localStorage
      const userData = JSON.parse(localStorage.getItem("userData") || "{}");
      localStorage.setItem(
        "userData",
        JSON.stringify({
          ...userData,
          name: formData.name.trim(),
          email: formData.email.trim().toLowerCase(),
          phone: formData.phone.trim(),
        }),
      );
      window.dispatchEvent(new Event("storage"));
    } catch (err) {
      toast.error(err.message || "Failed to update profile");
    } finally {
      setLoadingProfile(false);
    }
  };

  // Change password
  const changePassword = async () => {
    try {
      if (
        !formData.currentPassword ||
        !formData.newPassword ||
        !formData.confirmPassword
      ) {
        toast.error("All password fields are required.");
        return;
      }
      if (formData.newPassword !== formData.confirmPassword) {
        toast.error("New passwords do not match.");
        return;
      }
      if (formData.newPassword.length < 6) {
        toast.error("New password must be at least 6 characters long.");
        return;
      }

      setLoadingPassword(true);
      const res = await secureFetch("/api/settings/password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword,
          newPassword_confirmation: formData.confirmPassword,
        }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.msg || "Failed to change password");
      toast.success(data.msg || "Password changed successfully!");
      setFormData((prev) => ({
        ...prev,
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      }));
    } catch (err) {
      toast.error(err.message || "Failed to change password");
    } finally {
      setLoadingPassword(false);
    }
  };

  const handlePreferenceChange = (name, value) => {
    setPreferences((prev) => ({ ...prev, [name]: value }));
  };

  // Handle dark mode toggle
  const handleDarkModeToggle = () => {
    const newDarkMode = !darkMode;
    toggleDarkMode();
    setPreferences((prev) => ({ ...prev, darkMode: newDarkMode }));
  };

  // Save notification preferences
  const saveNotificationPreferences = async () => {
    try {
      setLoadingNotifications(true);
      const { emailNotifications, paymentReminder, callNotifications } =
        preferences;
      const res = await secureFetch("/api/settings/preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          emailNotifications,
          paymentReminder,
          callNotifications,
        }),
      });
      const data = await res.json();

      if (!res.ok)
        throw new Error(
          data.msg || "Failed to update notification preferences",
        );
      toast.success(data.msg || "Notification preferences saved successfully!");
    } catch (err) {
      toast.error(err.message || "Failed to update notification preferences");
    } finally {
      setLoadingNotifications(false);
    }
  };

  // Save system preferences
  const saveSystemPreferences = async () => {
    try {
      setLoadingSystem(true);
      const { language, timezone } = preferences;
      const res = await secureFetch("/api/settings/preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ language, timezone }),
      });
      const data = await res.json();

      if (!res.ok)
        throw new Error(data.msg || "Failed to update system preferences");
      toast.success(data.msg || "System preferences saved successfully!");
    } catch (err) {
      toast.error(err.message || "Failed to update system preferences");
    } finally {
      setLoadingSystem(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    toast.info("All local changes are saved individually per section.");
  };

  return (
    <div className={`settings-container ${darkMode ? "dark-mode" : ""}`}>
      {/* Header */}
      <div className="settings-header">
        <div className="header-content">
          <FaCog className="header-icon" />
          <div className="header-text">
            <h1 className="settings-title">Settings</h1>
            <p className="settings-subtitle">
              Manage your account settings and preferences
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="settings-form">
        {/* First Row: Profile + Notifications */}
        <div className="settings-row">
          <section className="settings-section">
            <div className="section-header">
              <FaUser className="section-icon" />
              <h2 className="section-title">Profile Settings</h2>
            </div>
            <p className="section-description">
              Update your personal information
            </p>

            {/* Caller ID */}
            <div className="form-group">
              <label className="form-label bold-label">Caller ID :-</label>
              <input
                type="text"
                name="callerId"
                value={formData.callerId || ""}
                disabled
                className="form-input"
                placeholder="Caller ID"
              />
            </div>

            {/* Profile Image */}
            <div
              className="form-group"
              style={{ textAlign: "center", marginBottom: 18 }}
            >
              <label
                className="form-label bold-label"
                style={{ display: "block", marginBottom: 8 }}
              >
                Profile Image
              </label>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                }}
              >
                <img
                  src={avatarPreview || "/default-avatar.png"}
                  alt="Profile Preview"
                  style={{
                    width: 90,
                    height: 90,
                    borderRadius: "50%",
                    objectFit: "cover",
                    marginBottom: 8,
                    border: "2px solid #eee",
                  }}
                />
                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  style={{ display: "none" }}
                  onChange={handleImageChange}
                />
                <button
                  type="button"
                  className="upload-image-btn"
                  style={{ marginBottom: 8 }}
                  onClick={() =>
                    fileInputRef.current && fileInputRef.current.click()
                  }
                  disabled={loadingImage}
                >
                  {loadingImage ? "Uploading..." : "Choose Image"}
                </button>
                {avatarPreview && formData.avatar && (
                  <>
                    <button
                      type="button"
                      className="save-button"
                      style={{
                        marginBottom: 8,
                        padding: "8px 20px",
                        fontSize: "0.9em",
                      }}
                      onClick={saveProfileImage}
                      disabled={loadingImage}
                    >
                      {loadingImage ? "Saving..." : "Save Image"}
                    </button>
                    <button
                      type="button"
                      className="remove-image-btn"
                      style={{
                        color: "#d00",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        fontSize: "0.95em",
                      }}
                      onClick={removeProfileImage}
                      disabled={loadingImage}
                    >
                      Remove Image
                    </button>
                  </>
                )}
              </div>
            </div>

            <div className="section-divider"></div>

            {/* Name, Email, Phone */}
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
              disabled={loadingProfile}
              style={{ marginTop: 12, width: "100%" }}
            >
              {loadingProfile ? "Saving..." : "Save Profile Info"}
            </button>
            <div className="section-divider"></div>
          </section>

          {/* Notifications Section */}
          <section className="settings-section">
            <div className="section-header">
              <FaBell className="section-icon" />
              <h2 className="section-title">Notifications</h2>
            </div>
            <p className="section-description">
              Manage your notification preferences
            </p>

            <div className="toggle-group">
              <div className="toggle-item">
                <div className="toggle-content">
                  <div className="toggle-header">
                    <FaEnvelope className="toggle-icon" />
                    <label className="toggle-label bold-label">
                      Email Notifications
                    </label>
                  </div>
                  <p className="toggle-description">Receive email updates</p>
                </div>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={preferences.emailNotifications}
                    onChange={(e) =>
                      handlePreferenceChange(
                        "emailNotifications",
                        e.target.checked,
                      )
                    }
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
                  <p className="toggle-description">
                    Get notified about overdue payments
                  </p>
                </div>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={preferences.paymentReminder}
                    onChange={(e) =>
                      handlePreferenceChange(
                        "paymentReminder",
                        e.target.checked,
                      )
                    }
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
                  <p className="toggle-description">
                    Alerts for new customer call
                  </p>
                </div>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={preferences.callNotifications}
                    onChange={(e) =>
                      handlePreferenceChange(
                        "callNotifications",
                        e.target.checked,
                      )
                    }
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>
            </div>

            <button
              type="button"
              className="save-button"
              onClick={saveNotificationPreferences}
              disabled={loadingNotifications}
              style={{ marginTop: 12, width: "100%" }}
            >
              {loadingNotifications
                ? "Saving..."
                : "Save Notification Preferences"}
            </button>
          </section>
        </div>

        {/* Second Row: Security + System Preferences */}
        <div className="settings-row">
          <section className="settings-section">
            <div className="section-header">
              <FaShieldAlt className="section-icon" />
              <h2 className="section-title">Security</h2>
            </div>
            <p className="section-description">Manage your security settings</p>

            <div className="form-group">
              <label className="form-label bold-label">
                Current Password :-
              </label>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <input
                  type={showPassword ? "text" : "password"}
                  name="currentPassword"
                  value={formData.currentPassword}
                  onChange={handleInputChange}
                  className="form-input"
                  placeholder="Enter current password"
                  style={{ flex: 1 }}
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: 0,
                    color: "#0066cc",
                    display: "flex",
                    alignItems: "center",
                  }}
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? (
                    <AiOutlineEyeInvisible size={20} />
                  ) : (
                    <AiOutlineEye size={20} />
                  )}
                </button>
              </div>
            </div>

            <div className="section-divider"></div>

            <div className="form-group">
              <label className="form-label bold-label">New Password :-</label>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <input
                  type={showNewPassword ? "text" : "password"}
                  name="newPassword"
                  value={formData.newPassword}
                  onChange={handleInputChange}
                  className="form-input"
                  placeholder="Enter new password"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: 0,
                    color: "#0066cc",
                    display: "flex",
                    alignItems: "center",
                  }}
                  aria-label="Toggle password visibility"
                >
                  {showNewPassword ? (
                    <AiOutlineEyeInvisible size={20} />
                  ) : (
                    <AiOutlineEye size={20} />
                  )}
                </button>
              </div>
            </div>

            <div className="section-divider"></div>

            <div className="form-group">
              <label className="form-label bold-label">
                Confirm New Password :-
              </label>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className="form-input"
                  placeholder="Confirm new password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: 0,
                    color: "#0066cc",
                    display: "flex",
                    alignItems: "center",
                  }}
                  aria-label="Toggle password visibility"
                >
                  {showConfirmPassword ? (
                    <AiOutlineEyeInvisible size={20} />
                  ) : (
                    <AiOutlineEye size={20} />
                  )}
                </button>
              </div>
            </div>

            <button
              type="button"
              className="save-button"
              onClick={changePassword}
              disabled={loadingPassword}
              style={{ marginTop: 12, width: "100%" }}
            >
              {loadingPassword ? "Changing..." : "Change Password"}
            </button>
            <div className="section-divider"></div>
          </section>

          <section className="settings-section">
            <div className="section-header">
              <FaCog className="section-icon" />
              <h2 className="section-title">System Preferences</h2>
            </div>

            <div className="preference-group">
              <div className="preference-item">
                <label className="preference-label bold-label">
                  Language :-
                </label>
                <div className="preference-option">
                  <select
                    className="preference-select"
                    value={preferences.language}
                    onChange={(e) =>
                      handlePreferenceChange("language", e.target.value)
                    }
                  >
                    <option value="English">English</option>
                    <option value="Sinhala">Sinhala</option>
                    <option value="Tamil">Tamil</option>
                  </select>
                </div>
              </div>

              <div className="preference-item">
                <label className="preference-label bold-label">
                  Timezone :-
                </label>
                <div className="preference-option">
                  <select
                    className="preference-select"
                    value={preferences.timezone}
                    onChange={(e) =>
                      handlePreferenceChange("timezone", e.target.value)
                    }
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
                  <label className="preference-label bold-label">
                    Dark Mode :-
                  </label>
                  <div className="preference-option">
                    <div className="dark-mode-toggle">
                      {darkMode ? (
                        <FaSun className="dark-mode-icon" />
                      ) : (
                        <FaMoon className="dark-mode-icon" />
                      )}
                      <p className="preference-description">
                        {darkMode ? "Light mode theme" : "Dark mode theme"}
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
              disabled={loadingSystem}
              style={{ marginTop: 12, width: "100%" }}
            >
              {loadingSystem ? "Saving..." : "Save System Preferences"}
            </button>
          </section>
        </div>
      </form>
    </div>
  );
};

export default Settings;
