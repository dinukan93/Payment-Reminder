import React, { useState, useEffect } from "react";
import "./ShowCustomerDetailsModal.css";
import "bootstrap-icons/font/bootstrap-icons.css";

function ShowCustomerDetailsModal({ isOpen, onClose, customer, onSave }) {
  const [callOutcome, setCallOutcome] = useState("Spoke to Customer");
  const [customerResponse, setCustomerResponse] = useState("");
  const [paymentMade, setPaymentMade] = useState(false);
  const [promisedDate, setPromisedDate] = useState("");
  const [showAllResponses, setShowAllResponses] = useState(false);

  // Reset form when modal opens with new customer
  useEffect(() => {
    if (isOpen && customer) {
      setCallOutcome("Spoke to Customer");
      setCustomerResponse("");
      setPaymentMade(false);
      setPromisedDate("");
      setShowAllResponses(false);
    }
  }, [isOpen, customer]);

  // Convert DD/MM/YYYY to YYYY-MM-DD for date input
  const convertToInputFormat = (dateStr) => {
    if (!dateStr || dateStr.length !== 10) return "";
    const [day, month, year] = dateStr.split('/');
    return `${year}-${month}-${day}`;
  };

  // Convert YYYY-MM-DD to DD/MM/YYYY for storage
  const convertFromInputFormat = (dateStr) => {
    if (!dateStr) return "";
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
  };

  if (!isOpen || !customer) return null;

  // Get the most recent response
  const getLatestResponse = () => {
    if (customer.contactHistory && customer.contactHistory.length > 0) {
      return customer.contactHistory[customer.contactHistory.length - 1].response;
    }
    return customer.previousResponse || "No previous contact";
  };

  const handleSave = () => {
    // Validate that customerResponse is not empty
    if (!customerResponse || customerResponse.trim() === '') {
      alert('Please enter a customer response before saving.');
      return;
    }
    
    if (onSave) {
      onSave(customer.id, {
        callOutcome,
        customerResponse,
        paymentMade,
        promisedDate: promisedDate,
      });
    }
  };

  const handleOverlayClick = (e) => {
    if (e.target.className === "modal-overlay") {
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-content">
        <div className="modal-header">
          <h2>Customer Details</h2>
          <button className="modal-close" onClick={onClose}>
            <i className="bi bi-x-lg"></i>
          </button>
        </div>

        <div className="modal-body">
          <div className="modal-left">
            <div className="customer-info-cards">
              <div className="info-card contact-card">
                <div className="card-label">Contact Number</div>
                <div className="card-value">{customer.contactNumber}</div>
              </div>
              <div className="info-card amount-card">
                <div className="card-label">Amount Overdue</div>
                <div className="card-value">{customer.amountOverdue}</div>
              </div>
              <div className="info-card days-card">
                <div className="card-label">Days Overdue</div>
                <div className="card-value">{customer.daysOverdue}</div>
              </div>
            </div>

            <div className="customer-name-section">
              <h3>{customer.name}</h3>
              <div className="account-number-display">
                <i className="bi bi-person-badge"></i>
                Account Number: {customer.accountNumber}
              </div>
              
              {!showAllResponses ? (
                <>
                  <div className="previous-response">
                    <span className="response-label">Previous Response:</span>{" "}
                    <span className="response-text">{getLatestResponse()}</span>
                  </div>
                  {customer.contactHistory && customer.contactHistory.length > 0 && (
                    <button 
                      className="show-all-responses"
                      onClick={() => setShowAllResponses(true)}
                    >
                      <i className="bi bi-three-dots"></i>
                      Show all Responses ({customer.contactHistory.length})
                    </button>
                  )}
                </>
              ) : (
                <>
                  <div className="all-responses-section">
                    <div className="responses-header">
                      <h4>All Responses</h4>
                      <button 
                        className="hide-responses-btn"
                        onClick={() => setShowAllResponses(false)}
                      >
                        <i className="bi bi-x-lg"></i>
                      </button>
                    </div>
                    <div className="responses-list">
                      {customer.contactHistory && customer.contactHistory.length > 0 ? (
                        customer.contactHistory.map((contact, index) => (
                          <div key={index} className="response-item">
                            <div className="response-date">
                              <i className="bi bi-calendar3"></i>
                              {contact.date}
                            </div>
                            <div className="response-outcome">
                              <strong>Outcome:</strong> {contact.outcome}
                            </div>
                            <div className="response-text-full">
                              <strong>Response:</strong> {contact.response}
                            </div>
                            {contact.promisedDate && (
                              <div className="response-promised">
                                <i className="bi bi-clock-history"></i>
                                Promised: {contact.promisedDate}
                              </div>
                            )}
                            {contact.paymentMade && (
                              <div className="response-payment">
                                <i className="bi bi-check-circle-fill"></i>
                                Payment Made
                              </div>
                            )}
                          </div>
                        ))
                      ) : (
                        <div className="no-responses">No contact history available</div>
                      )}
                    </div>
                  </div>
                  <button 
                    className="show-all-responses"
                    onClick={() => setShowAllResponses(false)}
                  >
                    <i className="bi bi-chevron-up"></i>
                    Hide Responses
                  </button>
                </>
              )}
            </div>

            <div className="timeline-container">
              <div className="timeline-item">
                <div className="timeline-dot green"></div>
                <div className="timeline-line green"></div>
              </div>
              <div className="timeline-item">
                <div className="timeline-dot green"></div>
                <div className="timeline-line green"></div>
              </div>
              <div className="timeline-item">
                <div className="timeline-dot green"></div>
                <div className="timeline-line blue"></div>
              </div>
              <div className="timeline-item">
                <div className="timeline-dot blue"></div>
              </div>
            </div>
          </div>

          <div className="modal-right">
            <div className="form-section">
              <div className="form-group">
                <label>Call Outcome</label>
                <select 
                  value={callOutcome} 
                  onChange={(e) => setCallOutcome(e.target.value)}
                  className="form-select"
                >
                  <option>Spoke to Customer</option>
                  <option>No Answer</option>
                  <option>Left Voicemail</option>
                  <option>Wrong Number</option>
                  <option>Customer Refused</option>
                </select>
              </div>

              <div className="form-group">
                <label>Customer Response</label>
                <div className="input-wrapper">
                  <input
                    type="text"
                    placeholder="(Type Here)"
                    value={customerResponse}
                    onChange={(e) => setCustomerResponse(e.target.value)}
                    className="form-input"
                  />
                  {customerResponse && (
                    <button 
                      className="clear-button"
                      onClick={() => setCustomerResponse("")}
                    >
                      <i className="bi bi-x-circle-fill"></i>
                    </button>
                  )}
                </div>
                <span className="supporting-text">Supporting text</span>
              </div>

              <div className="form-group toggle-group">
                <label>Customer Claims The Payment Was Made</label>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={paymentMade}
                    onChange={(e) => setPaymentMade(e.target.checked)}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>

              <div className="form-group">
                <label>Promised To Pay Date:</label>
                <input
                  type="date"
                  value={convertToInputFormat(promisedDate)}
                  onChange={(e) => setPromisedDate(convertFromInputFormat(e.target.value))}
                  className="form-input date-input"
                />
                {promisedDate && (
                  <span className="date-display">{promisedDate}</span>
                )}
              </div>

              <button className="save-button" onClick={handleSave}>
                Save
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ShowCustomerDetailsModal;
