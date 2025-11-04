import React, { useState } from "react";
import "./AdminShowCustomerDetailsModal.css";
import "bootstrap-icons/font/bootstrap-icons.css";

function AdminShowCustomerDetailsModal({ isOpen, onClose, customer, onSave }) {
  const [callOutcome, setCallOutcome] = useState("");
  const [customerResponse, setCustomerResponse] = useState("");
  const [promisedDate, setPromisedDate] = useState("");
  const [paymentMade, setPaymentMade] = useState(false);

  if (!isOpen || !customer) return null;

  const handleSave = () => {
    if (!callOutcome || !customerResponse) {
      alert("Please fill in all required fields");
      return;
    }

    onSave(customer.id, {
      callOutcome,
      customerResponse,
      promisedDate,
      paymentMade,
    });

    // Reset form
    setCallOutcome("");
    setCustomerResponse("");
    setPromisedDate("");
    setPaymentMade(false);
    onClose();
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="admin-customer-modal-overlay" onClick={handleOverlayClick}>
      <div className="admin-customer-modal-content">
        <div className="admin-customer-modal-header">
          <h2>
            <i className="bi bi-person-badge"></i> Customer Details
          </h2>
          <button className="admin-customer-close-btn" onClick={onClose}>
            <i className="bi bi-x-lg"></i>
          </button>
        </div>

        <div className="admin-customer-modal-body">
          {/* Customer Information */}
          <div className="admin-customer-info-grid">
            <div className="admin-customer-info-item">
              <label>Account Number</label>
              <span>{customer.accountNumber}</span>
            </div>
            <div className="admin-customer-info-item">
              <label>Customer Name</label>
              <span>{customer.name}</span>
            </div>
            <div className="admin-customer-info-item">
              <label>Contact Number</label>
              <span>{customer.contactNumber}</span>
            </div>
            <div className="admin-customer-info-item">
              <label>Amount Overdue</label>
              <span className="admin-customer-amount">{customer.amountOverdue}</span>
            </div>
            <div className="admin-customer-info-item">
              <label>Days Overdue</label>
              <span className="admin-customer-days">{customer.daysOverdue} days</span>
            </div>
            <div className="admin-customer-info-item">
              <label>Previous Response</label>
              <span>{customer.previousResponse || "No previous response"}</span>
            </div>
          </div>

          {/* Contact History */}
          {customer.contactHistory && customer.contactHistory.length > 0 && (
            <div className="admin-customer-history">
              <h3>Contact History</h3>
              <div className="admin-customer-history-list">
                {customer.contactHistory.map((contact, index) => (
                  <div key={index} className="admin-customer-history-item">
                    <div className="admin-customer-history-header">
                      <span className="admin-customer-history-date">
                        <i className="bi bi-calendar"></i> {contact.date}
                      </span>
                      <span className={`admin-customer-history-outcome ${contact.paymentMade ? 'paid' : 'pending'}`}>
                        {contact.paymentMade ? (
                          <><i className="bi bi-check-circle-fill"></i> Payment Made</>
                        ) : (
                          <><i className="bi bi-clock-fill"></i> Pending</>
                        )}
                      </span>
                    </div>
                    <p><strong>Outcome:</strong> {contact.outcome}</p>
                    <p><strong>Response:</strong> {contact.response}</p>
                    {contact.promisedDate && (
                      <p><strong>Promised Date:</strong> {contact.promisedDate}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Call Details Form */}
          <div className="admin-customer-form">
            <h3>Add Contact Details</h3>
            
            <div className="admin-customer-form-group">
              <label htmlFor="callOutcome">
                Call Outcome <span className="admin-customer-required">*</span>
              </label>
              <select
                id="callOutcome"
                value={callOutcome}
                onChange={(e) => setCallOutcome(e.target.value)}
                className="admin-customer-select"
              >
                <option value="">Select outcome...</option>
                <option value="Spoke to Customer">Spoke to Customer</option>
                <option value="Left Voicemail">Left Voicemail</option>
                <option value="No Answer">No Answer</option>
                <option value="Wrong Number">Wrong Number</option>
                <option value="Phone Off">Phone Off</option>
              </select>
            </div>

            <div className="admin-customer-form-group">
              <label htmlFor="customerResponse">
                Customer Response <span className="admin-customer-required">*</span>
              </label>
              <textarea
                id="customerResponse"
                value={customerResponse}
                onChange={(e) => setCustomerResponse(e.target.value)}
                className="admin-customer-textarea"
                rows="4"
                placeholder="Enter customer's response..."
              />
            </div>

            <div className="admin-customer-form-group">
              <label htmlFor="promisedDate">Promised Payment Date</label>
              <input
                type="date"
                id="promisedDate"
                value={promisedDate}
                onChange={(e) => setPromisedDate(e.target.value)}
                className="admin-customer-input"
              />
            </div>

            <div className="admin-customer-form-group admin-customer-checkbox-group">
              <label>
                <input
                  type="checkbox"
                  checked={paymentMade}
                  onChange={(e) => setPaymentMade(e.target.checked)}
                  className="admin-customer-checkbox"
                />
                <span>Payment Made</span>
              </label>
            </div>
          </div>
        </div>

        <div className="admin-customer-modal-footer">
          <button className="admin-customer-cancel-btn" onClick={onClose}>
            Cancel
          </button>
          <button className="admin-customer-save-btn" onClick={handleSave}>
            <i className="bi bi-save"></i> Save Details
          </button>
        </div>
      </div>
    </div>
  );
}

export default AdminShowCustomerDetailsModal;
