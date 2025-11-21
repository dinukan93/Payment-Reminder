import React, { useState } from "react";
import "./AddCustomerModal.css";
import API_BASE_URL from "../config/api";
import { ALL_REGIONS, getRtomsForRegion } from "../config/regionConfig";

function AddCustomerModal({ isOpen, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    accountNumber: "",
    name: "",
    region: "",
    rtom: "",
    productLabel: "",
    medium: "",
    latestBillAmount: 0,
    newArrears: 0,
    amountOverdue: "0",
    daysOverdue: "0",
    contactNumber: "",
    mobileContactTel: "",
    emailAddress: "",
    creditScore: 0,
    creditClassName: "",
    billHandlingCodeName: "",
    accountManager: "",
    salesPerson: ""
  });
  const [error, setError] = useState("");
  const [availableRtoms, setAvailableRtoms] = useState([]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: ["latestBillAmount", "newArrears", "creditScore"].includes(name)
        ? parseFloat(value) || 0
        : value
    }));
    setError("");

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
    setError("");

    // Validation
    if (!formData.accountNumber.trim()) {
      setError("Account Number is required");
      return;
    }
    if (!formData.name.trim()) {
      setError("Customer Name is required");
      return;
    }
    if (!formData.contactNumber.trim()) {
      setError("Contact Number is required");
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      const response = await fetch(`${API_BASE_URL}/customers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const result = await response.json();

      if (response.ok && result.success) {
        alert('Customer added successfully');
        setFormData({
          accountNumber: "",
          name: "",
          region: "",
          rtom: "",
          productLabel: "",
          medium: "",
          latestBillAmount: 0,
          newArrears: 0,
          amountOverdue: "0",
          daysOverdue: "0",
          contactNumber: "",
          mobileContactTel: "",
          emailAddress: "",
          creditScore: 0,
          creditClassName: "",
          billHandlingCodeName: "",
          accountManager: "",
          salesPerson: ""
        });
        onSuccess();
        onClose();
      } else {
        setError(result.message || 'Failed to add customer');
      }
    } catch (err) {
      setError(err.message || 'Error adding customer');
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
          <h2>Add New Customer</h2>
          <button className="close-btn" onClick={onClose}>
            <i className="bi bi-x"></i>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          {error && <div className="error-message">{error}</div>}

          <div className="form-columns">
            <div className="form-column">
              <div className="form-group">
                <label htmlFor="accountNumber">Account Number *</label>
                <input
                  type="text"
                  id="accountNumber"
                  name="accountNumber"
                  value={formData.accountNumber}
                  onChange={handleInputChange}
                  placeholder="Enter account number"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="name">Customer Name *</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Enter customer name"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="region">Region</label>
                <select
                  id="region"
                  name="region"
                  value={formData.region}
                  onChange={handleInputChange}
                >
                  <option value="">Select Region</option>
                  {ALL_REGIONS.map(region => (
                    <option key={region} value={region}>{region}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="rtom">RTOM</label>
                <select
                  id="rtom"
                  name="rtom"
                  value={formData.rtom}
                  onChange={handleInputChange}
                  disabled={!formData.region || availableRtoms.length === 0}
                >
                  <option value="">Select RTOM</option>
                  {availableRtoms.map(rtom => (
                    <option key={rtom} value={rtom}>{rtom}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="productLabel">Product Label</label>
                <input
                  type="text"
                  id="productLabel"
                  name="productLabel"
                  value={formData.productLabel}
                  onChange={handleInputChange}
                  placeholder="Enter product label"
                />
              </div>

              <div className="form-group">
                <label htmlFor="medium">Medium</label>
                <input
                  type="text"
                  id="medium"
                  name="medium"
                  value={formData.medium}
                  onChange={handleInputChange}
                  placeholder="Enter medium"
                />
              </div>

              <div className="form-group">
                <label htmlFor="latestBillAmount">Latest Bill Amount</label>
                <input
                  type="number"
                  id="latestBillAmount"
                  name="latestBillAmount"
                  value={formData.latestBillAmount}
                  onChange={handleInputChange}
                  placeholder="0"
                  step="0.01"
                />
              </div>

              <div className="form-group">
                <label htmlFor="newArrears">New Arrears</label>
                <input
                  type="number"
                  id="newArrears"
                  name="newArrears"
                  value={formData.newArrears}
                  onChange={handleInputChange}
                  placeholder="0"
                  step="0.01"
                />
              </div>
            </div>

            <div className="form-column">
              <div className="form-group">
                <label htmlFor="amountOverdue">Amount Overdue</label>
                <input
                  type="text"
                  id="amountOverdue"
                  name="amountOverdue"
                  value={formData.amountOverdue}
                  onChange={handleInputChange}
                  placeholder="0"
                />
              </div>

              <div className="form-group">
                <label htmlFor="daysOverdue">Days Overdue</label>
                <input
                  type="text"
                  id="daysOverdue"
                  name="daysOverdue"
                  value={formData.daysOverdue}
                  onChange={handleInputChange}
                  placeholder="0"
                />
              </div>

              <div className="form-group">
                <label htmlFor="contactNumber">Contact Number *</label>
                <input
                  type="tel"
                  id="contactNumber"
                  name="contactNumber"
                  value={formData.contactNumber}
                  onChange={handleInputChange}
                  placeholder="Enter contact number"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="mobileContactTel">Mobile Contact</label>
                <input
                  type="tel"
                  id="mobileContactTel"
                  name="mobileContactTel"
                  value={formData.mobileContactTel}
                  onChange={handleInputChange}
                  placeholder="Enter mobile contact"
                />
              </div>

              <div className="form-group">
                <label htmlFor="emailAddress">Email Address</label>
                <input
                  type="email"
                  id="emailAddress"
                  name="emailAddress"
                  value={formData.emailAddress}
                  onChange={handleInputChange}
                  placeholder="Enter email address"
                />
              </div>

              <div className="form-group">
                <label htmlFor="creditScore">Credit Score</label>
                <input
                  type="number"
                  id="creditScore"
                  name="creditScore"
                  value={formData.creditScore}
                  onChange={handleInputChange}
                  placeholder="0"
                />
              </div>

              <div className="form-group">
                <label htmlFor="creditClassName">Credit Class</label>
                <input
                  type="text"
                  id="creditClassName"
                  name="creditClassName"
                  value={formData.creditClassName}
                  onChange={handleInputChange}
                  placeholder="Enter credit class"
                />
              </div>

              <div className="form-group">
                <label htmlFor="billHandlingCodeName">Bill Handling Code</label>
                <input
                  type="text"
                  id="billHandlingCodeName"
                  name="billHandlingCodeName"
                  value={formData.billHandlingCodeName}
                  onChange={handleInputChange}
                  placeholder="Enter bill handling code"
                />
              </div>

              <div className="form-group">
                <label htmlFor="accountManager">Account Manager</label>
                <input
                  type="text"
                  id="accountManager"
                  name="accountManager"
                  value={formData.accountManager}
                  onChange={handleInputChange}
                  placeholder="Enter account manager"
                />
              </div>

              <div className="form-group">
                <label htmlFor="salesPerson">Sales Person</label>
                <input
                  type="text"
                  id="salesPerson"
                  name="salesPerson"
                  value={formData.salesPerson}
                  onChange={handleInputChange}
                  placeholder="Enter sales person"
                />
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-cancel" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-submit" disabled={loading}>
              {loading ? "Adding..." : "Add Customer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddCustomerModal;
