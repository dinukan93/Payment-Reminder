import React, { useState, useEffect } from 'react';
import './EditCallerModal.css';
import API_BASE_URL from '../config/api';
import { secureFetch } from '../utils/api';

function EditCallerModal({ show, caller, onClose, onSave }) {
  const [formData, setFormData] = useState({
    name: '',
    callerId: '',
    email: '',
    phone: '',
    maxLoad: 20,
    status: 'AVAILABLE'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Get current user role
  const userRole = localStorage.getItem('role');
  const isSupervisor = userRole === 'supervisor';

  useEffect(() => {
    if (caller) {
      setFormData({
        name: caller.name || '',
        callerId: caller.callerId || '',
        email: caller.email || '',
        phone: caller.phone || '',
        maxLoad: caller.maxLoad || 20,
        status: caller.status || 'AVAILABLE'
      });
      setError('');
    }
  }, [caller, show]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'maxLoad' ? parseInt(value) || 0 : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.callerId.trim()) {
      setError('Name and Caller ID are required');
      return;
    }

    if (formData.maxLoad < 1 || formData.maxLoad > 100) {
      setError('Max Load must be between 1 and 100');
      return;
    }

    setLoading(true);
    try {
      const response = await secureFetch(`/callers/${caller._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to update Caller');
      }

      const result = await response.json();
      onSave(result.data);
      onClose();
    } catch (err) {
      setError(err.message || 'Error updating Caller');
      console.error('Error updating Caller:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!show) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content edit-caller-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{isSupervisor ? 'Enable/Disable Caller' : 'Edit Caller'}</h2>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="edit-caller-form">
          {error && <div className="error-message">{error}</div>}

          {/* Supervisors only see status field */}
          {isSupervisor ? (
            <div className="supervisor-edit-section">
              <p style={{ marginBottom: '20px', color: '#666' }}>
                Caller: <strong>{formData.name}</strong> ({formData.callerId})
              </p>

              <div className="form-group">
                <label>Status</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  style={{ fontSize: '16px', padding: '10px' }}
                >
                  <option value="AVAILABLE">Available</option>
                  <option value="BUSY">Busy</option>
                  <option value="OFFLINE">Offline</option>
                </select>
              </div>
            </div>
          ) : (
            <>
              {/* Full edit form for rtom_admin and other roles */}
              <div className="form-row">
                <div className="form-group">
                  <label>Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Caller Name"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Caller ID *</label>
                  <input
                    type="text"
                    name="callerId"
                    value={formData.callerId}
                    onChange={handleChange}
                    placeholder="Caller ID"
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="caller@example.com"
                  />
                </div>

                <div className="form-group">
                  <label>Phone</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="Phone number"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Max Load</label>
                  <input
                    type="number"
                    name="maxLoad"
                    value={formData.maxLoad}
                    onChange={handleChange}
                    min="1"
                    max="100"
                    placeholder="20"
                  />
                </div>

                <div className="form-group">
                  <label>Status</label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                  >
                    <option value="AVAILABLE">Available</option>
                    <option value="BUSY">Busy</option>
                    <option value="OFFLINE">Offline</option>
                  </select>
                </div>
              </div>
            </>
          )}

          <div className="modal-actions">
            <button type="button" className="btn-cancel" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-save" disabled={loading}>
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditCallerModal;
