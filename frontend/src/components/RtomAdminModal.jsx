import React, { useState, useEffect } from "react";
import { toast } from 'react-toastify';
import logger from '../utils/logger';
import "./RtomAdminModal.css";
import API_BASE_URL from "../config/api";

export default function RtomAdminModal({ isOpen, onClose, admin, onSuccess }) {
    const [formData, setFormData] = useState({
        adminId: "",
        name: "",
        email: "",
        phone: "",
        password: "",
        rtom: ""
    });
    const [availableRtoms, setAvailableRtoms] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Fetch available RTOMs when modal opens
    useEffect(() => {
        if (isOpen) {
            fetchAvailableRtoms();

            // If editing, populate form with admin data
            if (admin) {
                setFormData({
                    adminId: admin.adminId || "",
                    name: admin.name || "",
                    email: admin.email || "",
                    phone: admin.phone || "",
                    password: "", // Never pre-fill password
                    rtom: admin.rtom || ""
                });
            } else {
                // Reset form for new admin
                setFormData({
                    adminId: "",
                    name: "",
                    email: "",
                    phone: "",
                    password: "",
                    rtom: ""
                });
            }
            setError(null);
        }
    }, [isOpen, admin]);

    const fetchAvailableRtoms = async () => {
        try {
            const response = await secureFetch('/region-admin/available-rtoms');
            const data = await response.json();
            logger.info('RTOMs response:', data);
            if (data.success) {
                setAvailableRtoms(data.data);
                logger.info('Available RTOMs:', data.data);
            } else {
                logger.error('Failed to fetch RTOMs:', data.message);
                setError(data.message || 'Failed to load RTOMs');
                toast.error(data.message || 'Failed to load RTOMs');
            }
        } catch (err) {
            logger.error('Error fetching RTOMs:', err);
            setError('Failed to load RTOMs. Please try again.');
            toast.error('Failed to load RTOMs. Please try again.');
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const response = await secureFetch(url, {
                method,
                body: JSON.stringify(payload)
            });

            const data = await response.json();

            if (data.success) {
                onSuccess(data.message || (admin ? 'RTOM admin updated successfully' : 'RTOM admin created successfully'));
                onClose();
            } else {
                setError(data.message || 'Operation failed');
            }
        } catch (err) {
            setError('Network error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>{admin ? 'Edit RTOM Admin' : 'Create New RTOM Admin'}</h2>
                    <button className="modal-close" onClick={onClose}>
                        <i className="bi bi-x-lg"></i>
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="modal-body">
                        {error && (
                            <div className="error-message" style={{
                                padding: '10px',
                                marginBottom: '15px',
                                backgroundColor: '#fee',
                                color: '#c00',
                                borderRadius: '4px',
                                fontSize: '14px'
                            }}>
                                {error}
                            </div>
                        )}

                        <div className="form-group">
                            <label htmlFor="adminId">Admin ID *</label>
                            <input
                                type="text"
                                id="adminId"
                                name="adminId"
                                value={formData.adminId}
                                onChange={handleChange}
                                required
                                disabled={!!admin} // Can't change ID when editing
                                placeholder="e.g., RTOM001"
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="name">Name *</label>
                            <input
                                type="text"
                                id="name"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                required
                                placeholder="Full name"
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="email">Email *</label>
                            <input
                                type="email"
                                id="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                required
                                placeholder="email@example.com"
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="phone">Phone</label>
                            <input
                                type="tel"
                                id="phone"
                                name="phone"
                                value={formData.phone}
                                onChange={handleChange}
                                placeholder="Phone number"
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="rtom">RTOM *</label>
                            <select
                                id="rtom"
                                name="rtom"
                                value={formData.rtom}
                                onChange={handleChange}
                                required
                            >
                                <option value="">Select RTOM</option>
                                {availableRtoms.map(rtom => (
                                    <option key={rtom.code} value={rtom.code}>
                                        {rtom.code} - {rtom.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group">
                            <label htmlFor="password">
                                Password {!admin && '*'}
                                {admin && <span style={{ fontSize: '12px', color: '#666' }}> (leave blank to keep current)</span>}
                            </label>
                            <input
                                type="password"
                                id="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                required={!admin}
                                placeholder={admin ? "Leave blank to keep current password" : "Minimum 6 characters"}
                                minLength={6}
                            />
                        </div>
                    </div>

                    <div className="modal-footer">
                        <button
                            type="button"
                            className="btn-secondary"
                            onClick={onClose}
                            disabled={loading}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="btn-primary"
                            disabled={loading}
                        >
                            {loading ? 'Saving...' : (admin ? 'Update' : 'Create')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
