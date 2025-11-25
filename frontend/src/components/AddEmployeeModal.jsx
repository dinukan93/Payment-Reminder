import React, { useState } from "react";
import "./AddEmployeeModal.css";
import API_BASE_URL from "../config/api";

function AddEmployeeModal({ isOpen, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    callerId: "",
    email: "",
    phone: "",
    password: "",
    maxLoad: 20,
    status: "AVAILABLE"
  });
  const [error, setError] = useState("");

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === "maxLoad" ? parseInt(value) || 20 : value
    }));
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Validation
    if (!formData.name.trim()) {
      setError("Employee name is required");
      return;
    }
    if (!formData.callerId.trim()) {
      setError("Caller ID is required");
      return;
    }

    if (!formData.password || formData.password.length < 6) {
      setError("Password is required (min 6 characters)");
      return;
    }
    if (formData.maxLoad < 1 || formData.maxLoad > 100) {
      setError("Max load must be between 1 and 100");
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      const response = await fetch(`${API_BASE_URL}/callers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const result = await response.json();

      if (response.ok && result.success) {
        alert('Employee added successfully');
        setFormData({
          name: "",
          callerId: "",
          email: "",
          phone: "",
          password: "",
          maxLoad: 20,
          status: "ACTIVE"
        });
        onSuccess();
        onClose();
      } else {
        setError(result.message || 'Failed to add employee');
      }
    } catch (err) {
      setError(err.message || 'Error adding employee');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Add New Employee</h2>
          <button className="close-btn" onClick={onClose}>
            <i className="bi bi-x"></i>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          {error && <div className="error-message">{error}</div>}

          <div className="form-group">
            <label htmlFor="name">Employee Name *</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="Enter employee name"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="callerId">Caller ID *</label>
            <input
              type="text"
              id="callerId"
              name="callerId"
              value={formData.callerId}
              onChange={handleInputChange}
              placeholder="Enter caller ID"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="Enter email address"
            />
          </div>

          <div className="form-group">
            <label htmlFor="phone">Phone</label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              placeholder="Enter phone number"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password *</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              placeholder="Enter password"
              required
              minLength={6}
            />
          </div>
          <div className="form-group">
            <label htmlFor="maxLoad">Max Load</label>
            <input
              type="number"
              id="maxLoad"
              name="maxLoad"
              value={formData.maxLoad}
              onChange={handleInputChange}
              min="1"
              max="100"
            />
          </div>

          <div className="form-group">
            <label htmlFor="status">Status</label>
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleInputChange}
            >
              <option value="AVAILABLE">Available</option>
              <option value="BUSY">Busy</option>
              <option value="OFFLINE">Offline</option>
            </select>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-cancel" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-submit" disabled={loading}>
              {loading ? "Adding..." : "Add Employee"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddEmployeeModal;
