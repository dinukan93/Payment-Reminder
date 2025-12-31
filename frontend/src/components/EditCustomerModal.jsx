import React, { useState, useEffect } from 'react';
import './EditCustomerModal.css';
import API_BASE_URL from '../config/api';
import { secureFetch } from '../utils/api';
import { ALL_REGIONS, getRtomsForRegion } from '../config/regionConfig';

function EditCustomerModal({ show, customer, onClose, onSave }) {
  const [formData, setFormData] = useState({
    accountNumber: '',
    name: '',
    region: '',
    rtom: '',
    productLabel: '',
    medium: '',
    latestBillAmount: '',
    newArrears: '',
    amountOverdue: '',
    daysOverdue: '',
    contactNumber: '',
    mobileContactTel: '',
    emailAddress: '',
    creditScore: '',
    creditClassName: '',
    billHandlingCodeName: '',
    accountManager: '',
    salesPerson: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [availableRtoms, setAvailableRtoms] = useState([]);

  useEffect(() => {
    if (customer) {
      setFormData({
        accountNumber: customer.accountNumber || '',
        name: customer.name || '',
        region: customer.region || '',
        rtom: customer.rtom || '',
        productLabel: customer.productLabel || '',
        medium: customer.medium || '',
        latestBillAmount: customer.latestBillAmount || '',
        newArrears: customer.newArrears || '',
        amountOverdue: customer.amountOverdue || '',
        daysOverdue: customer.daysOverdue || '',
        contactNumber: customer.contactNumber || '',
        mobileContactTel: customer.mobileContactTel || '',
        emailAddress: customer.emailAddress || '',
        creditScore: customer.creditScore || '',
        creditClassName: customer.creditClassName || '',
        billHandlingCodeName: customer.billHandlingCodeName || '',
        accountManager: customer.accountManager || '',
        salesPerson: customer.salesPerson || ''
      });
      // Update available RTOMs based on customer's region
      if (customer.region) {
        setAvailableRtoms(getRtomsForRegion(customer.region));
      }
      setError('');
    }
  }, [customer, show]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Update available RTOMs when region changes
    if (name === 'region') {
      const rtoms = getRtomsForRegion(value);
      setAvailableRtoms(rtoms);
      // Clear RTOM if it's not in the new region's RTOMs
      if (!rtoms.includes(formData.rtom)) {
        setFormData(prev => ({
          ...prev,
          rtom: ''
        }));
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.accountNumber.trim() || !formData.name.trim()) {
      setError('Account Number and Name are required');
      return;
    }

    setLoading(true);
    try {
      const response = await secureFetch(`/customers/${customer._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to update customer');
      }

      const result = await response.json();
      onSave(result.data);
      onClose();
    } catch (err) {
      setError(err.message || 'Error updating customer');
      console.error('Error updating customer:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!show) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content edit-customer-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Edit Customer</h2>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="edit-customer-form">
          {error && <div className="error-message">{error}</div>}

          <div className="form-row">
            <div className="form-group">
              <label>Account Number *</label>
              <input
                type="text"
                name="accountNumber"
                value={formData.accountNumber}
                onChange={handleChange}
                placeholder="Account number"
                required
              />
            </div>
            <div className="form-group">
              <label>Customer Name *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Customer name"
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Region</label>
              <select
                name="region"
                value={formData.region}
                onChange={handleChange}
              >
                <option value="">Select Region</option>
                {ALL_REGIONS.map(region => (
                  <option key={region} value={region}>{region}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>RTOM</label>
              <select
                name="rtom"
                value={formData.rtom}
                onChange={handleChange}
                disabled={!formData.region || availableRtoms.length === 0}
              >
                <option value="">Select RTOM</option>
                {availableRtoms.map(rtom => (
                  <option key={rtom} value={rtom}>{rtom}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Product Label</label>
              <input
                type="text"
                name="productLabel"
                value={formData.productLabel}
                onChange={handleChange}
                placeholder="Product label"
              />
            </div>
            <div className="form-group">
              <label>Medium</label>
              <input
                type="text"
                name="medium"
                value={formData.medium}
                onChange={handleChange}
                placeholder="Medium"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Latest Bill Amount</label>
              <input
                type="number"
                name="latestBillAmount"
                value={formData.latestBillAmount}
                onChange={handleChange}
                placeholder="0"
              />
            </div>
            <div className="form-group">
              <label>New Arrears</label>
              <input
                type="number"
                name="newArrears"
                value={formData.newArrears}
                onChange={handleChange}
                placeholder="0"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Amount Overdue</label>
              <input
                type="number"
                name="amountOverdue"
                value={formData.amountOverdue}
                onChange={handleChange}
                placeholder="0"
              />
            </div>
            <div className="form-group">
              <label>Days Overdue</label>
              <input
                type="number"
                name="daysOverdue"
                value={formData.daysOverdue}
                onChange={handleChange}
                placeholder="0"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Contact Number</label>
              <input
                type="tel"
                name="contactNumber"
                value={formData.contactNumber}
                onChange={handleChange}
                placeholder="Contact number"
              />
            </div>
            <div className="form-group">
              <label>Mobile Contact</label>
              <input
                type="tel"
                name="mobileContactTel"
                value={formData.mobileContactTel}
                onChange={handleChange}
                placeholder="Mobile contact"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Email Address</label>
              <input
                type="email"
                name="emailAddress"
                value={formData.emailAddress}
                onChange={handleChange}
                placeholder="email@example.com"
              />
            </div>
            <div className="form-group">
              <label>Credit Score</label>
              <input
                type="number"
                name="creditScore"
                value={formData.creditScore}
                onChange={handleChange}
                placeholder="Credit score"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Credit Class Name</label>
              <input
                type="text"
                name="creditClassName"
                value={formData.creditClassName}
                onChange={handleChange}
                placeholder="Credit class"
              />
            </div>
            <div className="form-group">
              <label>Bill Handling Code</label>
              <input
                type="text"
                name="billHandlingCodeName"
                value={formData.billHandlingCodeName}
                onChange={handleChange}
                placeholder="Bill handling code"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Account Manager</label>
              <input
                type="text"
                name="accountManager"
                value={formData.accountManager}
                onChange={handleChange}
                placeholder="Account manager"
              />
            </div>
            <div className="form-group">
              <label>Sales Person</label>
              <input
                type="text"
                name="salesPerson"
                value={formData.salesPerson}
                onChange={handleChange}
                placeholder="Sales person"
              />
            </div>
          </div>

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

export default EditCustomerModal;
