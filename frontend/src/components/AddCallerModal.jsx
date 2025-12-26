import React, { useState, useEffect } from "react";
import "./AddCallerModal.css";
import API_BASE_URL from "../config/api";
import { showSuccess } from "./Notifications";

function AddCallerModal({ isOpen, onClose, onSuccess }) {
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

  // Fetch next available callerId when modal opens
  useEffect(() => {
    const fetchNextCallerId = async () => {
      if (!isOpen) return;
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_BASE_URL}/callers/next-id`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.nextCallerId) {
          setFormData(prev => ({ ...prev, callerId: data.nextCallerId }));
        }
      } catch (err) {
        // fallback: leave blank
      }
    };
    fetchNextCallerId();
  }, [isOpen]);
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
      setError("Caller name is required");
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
        showSuccess('Caller added successfully');
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
        setError(result.message || 'Failed to add Caller');
      }
    } catch (err) {
      setError(err.message || 'Error adding Caller');
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
          <h2>Add New Caller</h2>
          <button className="close-btn" onClick={onClose}>
            <i className="bi bi-x"></i>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          {error && <div className="error-message">{error}</div>}

          <div className="form-group">
            <label htmlFor="name">Caller Name *</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="Enter Caller Name"
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
              readOnly
              placeholder="Auto-generated Caller ID"
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
              title="Maximum number of customers that can be assigned in a single request"
            />
            <small style={{ color: '#666', fontSize: '12px', marginTop: '4px', display: 'block' }}>
              Maximum customers per request (1-100)
            </small>
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
              {loading ? "Adding..." : "Add Caller"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddCallerModal;
