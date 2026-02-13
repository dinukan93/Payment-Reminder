import React, { useState, useEffect } from 'react';
import { secureFetch } from '../utils/api';
import { showSuccess, showError } from './Notifications';
import './PODConfigSettings.css';

function PODConfigSettings({ isOpen, onClose }) {
    const [config, setConfig] = useState({
        bill_min: 3000,
        bill_max: 10000,
        call_center_staff_limit: 30000,
        cc_limit: 5000,
        staff_limit: 3000
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (isOpen) {
            fetchConfig();
        }
    }, [isOpen]);

    const fetchConfig = async () => {
        try {
            setLoading(true);
            const response = await secureFetch('/api/pod-filter-config');

            if (response.ok) {
                const data = await response.json();
                if (data.success && data.data) {
                    setConfig(data.data);
                }
            } else {
                showError('Failed to load configuration');
            }
        } catch (error) {
            showError('Error loading configuration');
        } finally {
            setLoading(false);
        }
    };

    const validateConfig = () => {
        const newErrors = {};

        if (config.bill_min < 0) {
            newErrors.bill_min = 'Minimum bill value must be positive';
        }
        if (config.bill_max <= config.bill_min) {
            newErrors.bill_max = 'Maximum must be greater than minimum';
        }
        if (config.call_center_staff_limit < 1) {
            newErrors.call_center_staff_limit = 'Must be at least 1';
        }
        if (config.cc_limit < 1) {
            newErrors.cc_limit = 'Must be at least 1';
        }
        if (config.staff_limit < 1) {
            newErrors.staff_limit = 'Must be at least 1';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSave = async () => {
        if (!validateConfig()) {
            showError('Please fix validation errors');
            return;
        }

        try {
            setSaving(true);
            const response = await secureFetch('/api/pod-filter-config', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(config)
            });

            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    showSuccess('Configuration saved successfully');
                    onClose();
                } else {
                    showError(data.message || 'Failed to save configuration');
                }
            } else {
                const data = await response.json();
                showError(data.message || 'Failed to save configuration');
            }
        } catch (error) {
            showError('Error saving configuration');
        } finally {
            setSaving(false);
        }
    };

    const handleReset = async () => {
        if (!window.confirm('Are you sure you want to reset to default values?')) {
            return;
        }

        try {
            setSaving(true);
            const response = await secureFetch('/api/pod-filter-config/reset', {
                method: 'POST'
            });

            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    setConfig(data.data);
                    showSuccess('Configuration reset to defaults');
                } else {
                    showError(data.message || 'Failed to reset configuration');
                }
            } else {
                showError('Failed to reset configuration');
            }
        } catch (error) {
            showError('Error resetting configuration');
        } finally {
            setSaving(false);
        }
    };

    const handleChange = (field, value) => {
        setConfig(prev => ({
            ...prev,
            [field]: parseInt(value) || 0
        }));
        // Clear error for this field
        if (errors[field]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[field];
                return newErrors;
            });
        }
    };

    if (!isOpen) return null;

    return (
        <div className="pod-config-modal-overlay" onClick={onClose}>
            <div className="pod-config-modal" onClick={(e) => e.stopPropagation()}>
                <div className="pod-config-header">
                    <h2>POD Filter Configuration</h2>
                    <button className="pod-config-close" onClick={onClose}>
                        <i className="bi bi-x-lg"></i>
                    </button>
                </div>

                {loading ? (
                    <div className="pod-config-loading">
                        <div className="spinner"></div>
                        <p>Loading configuration...</p>
                    </div>
                ) : (
                    <div className="pod-config-content">
                        <div className="pod-config-section">
                            <h3>Arrears Range for Call Center Assignment</h3>
                            <p className="pod-config-description">
                                Customers with arrears between these values will be assigned to call center staff
                            </p>

                            <div className="pod-config-row">
                                <div className="pod-config-field">
                                    <label>Minimum Arrears</label>
                                    <input
                                        type="number"
                                        value={config.bill_min}
                                        onChange={(e) => handleChange('bill_min', e.target.value)}
                                        className={errors.bill_min ? 'error' : ''}
                                    />
                                    {errors.bill_min && <span className="error-text">{errors.bill_min}</span>}
                                </div>

                                <div className="pod-config-field">
                                    <label>Maximum Arrears</label>
                                    <input
                                        type="number"
                                        value={config.bill_max}
                                        onChange={(e) => handleChange('bill_max', e.target.value)}
                                        className={errors.bill_max ? 'error' : ''}
                                    />
                                    {errors.bill_max && <span className="error-text">{errors.bill_max}</span>}
                                </div>
                            </div>
                        </div>

                        <div className="pod-config-section">
                            <h3>Account Limits by Assignment Type</h3>
                            <p className="pod-config-description">
                                Maximum number of accounts that can be assigned to each type
                            </p>

                            <div className="pod-config-field">
                                <label>Call Center Staff Limit</label>
                                <input
                                    type="number"
                                    value={config.call_center_staff_limit}
                                    onChange={(e) => handleChange('call_center_staff_limit', e.target.value)}
                                    className={errors.call_center_staff_limit ? 'error' : ''}
                                />
                                {errors.call_center_staff_limit && <span className="error-text">{errors.call_center_staff_limit}</span>}
                            </div>

                            <div className="pod-config-field">
                                <label>CC Limit</label>
                                <input
                                    type="number"
                                    value={config.cc_limit}
                                    onChange={(e) => handleChange('cc_limit', e.target.value)}
                                    className={errors.cc_limit ? 'error' : ''}
                                />
                                {errors.cc_limit && <span className="error-text">{errors.cc_limit}</span>}
                            </div>

                            <div className="pod-config-field">
                                <label>Staff Limit</label>
                                <input
                                    type="number"
                                    value={config.staff_limit}
                                    onChange={(e) => handleChange('staff_limit', e.target.value)}
                                    className={errors.staff_limit ? 'error' : ''}
                                />
                                {errors.staff_limit && <span className="error-text">{errors.staff_limit}</span>}
                            </div>
                        </div>

                        <div className="pod-config-actions">
                            <button
                                className="pod-config-btn pod-config-btn-reset"
                                onClick={handleReset}
                                disabled={saving}
                            >
                                <i className="bi bi-arrow-counterclockwise"></i>
                                Reset to Defaults
                            </button>
                            <div className="pod-config-actions-right">
                                <button
                                    className="pod-config-btn pod-config-btn-cancel"
                                    onClick={onClose}
                                    disabled={saving}
                                >
                                    Cancel
                                </button>
                                <button
                                    className="pod-config-btn pod-config-btn-save"
                                    onClick={handleSave}
                                    disabled={saving}
                                >
                                    {saving ? (
                                        <>
                                            <div className="spinner-small"></div>
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <i className="bi bi-check-lg"></i>
                                            Save Changes
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default PODConfigSettings;
