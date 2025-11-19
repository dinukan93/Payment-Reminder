import React from "react";
import "./CallerDetailsModal.css";
import "bootstrap-icons/font/bootstrap-icons.css";

function CallerDetailsModal({ isOpen, onClose, caller, callerData }) {
  if (!isOpen || !caller) return null;

  // Use real data if available, otherwise show loading
  const assignedCustomers = callerData?.assignedCustomers || [];
  const isLoading = !callerData;

  const completedCount = assignedCustomers.filter(c => c.status === "COMPLETED").length;
  const contactedCount = assignedCustomers.filter(c => 
    c.contactHistory && c.contactHistory.length > 0 && c.status !== "COMPLETED"
  ).length;
  const notContactedCount = assignedCustomers.filter(c => 
    (!c.contactHistory || c.contactHistory.length === 0) && c.status !== "COMPLETED"
  ).length;
  const totalAssigned = assignedCustomers.length;

  // Format date helper
  const formatDate = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
  };

  // Get last contact info
  const getLastContact = (customer) => {
    if (!customer.contactHistory || customer.contactHistory.length === 0) {
      return { date: null, response: "Not yet contacted" };
    }
    const lastContact = customer.contactHistory[customer.contactHistory.length - 1];
    return {
      date: formatDate(lastContact.contactDate),
      response: lastContact.remark || "Contacted"
    };
  };

  // Get customer status
  const getCustomerStatus = (customer) => {
    if (customer.status === "COMPLETED") return "COMPLETED";
    if (customer.contactHistory && customer.contactHistory.length > 0) return "CONTACTED";
    return "NOT_CONTACTED";
  };

  return (
    <div className="caller-details-modal-overlay" onClick={onClose}>
      <div className="caller-details-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="caller-details-modal-header">
          <div className="caller-details-title">
            <h2>
              <i className="bi bi-person-badge"></i> Caller Work Details
            </h2>
            <div className="caller-details-info">
              <span className="caller-details-name">{caller.name}</span>
              <span className="caller-details-id">ID: {caller.callerId}</span>
            </div>
          </div>
          <button className="caller-details-close-btn" onClick={onClose}>
            <i className="bi bi-x-lg"></i>
          </button>
        </div>

        {/* Summary Stats */}
        <div className="caller-details-summary">
          <div className="caller-summary-card">
            <div className="caller-summary-icon" style={{ backgroundColor: "#1976d2" }}>
              <i className="bi bi-list-check"></i>
            </div>
            <div className="caller-summary-details">
              <h3>{totalAssigned}</h3>
              <p>Total Assigned</p>
            </div>
          </div>
          <div className="caller-summary-card">
            <div className="caller-summary-icon" style={{ backgroundColor: "#2e7d32" }}>
              <i className="bi bi-check-circle"></i>
            </div>
            <div className="caller-summary-details">
              <h3>{completedCount}</h3>
              <p>Completed</p>
            </div>
          </div>
          <div className="caller-summary-card">
            <div className="caller-summary-icon" style={{ backgroundColor: "#f57c00" }}>
              <i className="bi bi-telephone"></i>
            </div>
            <div className="caller-summary-details">
              <h3>{contactedCount}</h3>
              <p>Contacted</p>
            </div>
          </div>
          <div className="caller-summary-card">
            <div className="caller-summary-icon" style={{ backgroundColor: "#d32f2f" }}>
              <i className="bi bi-exclamation-circle"></i>
            </div>
            <div className="caller-summary-details">
              <h3>{notContactedCount}</h3>
              <p>Not Contacted</p>
            </div>
          </div>
        </div>

        {/* Customers Table */}
        <div className="caller-details-modal-body">
          <div className="caller-details-section-header">
            <h3>Assigned Customers ({totalAssigned})</h3>
          </div>
          {isLoading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
              <div style={{
                width: '40px',
                height: '40px',
                border: '4px solid #f3f3f3',
                borderTop: '4px solid #1488ee',
                borderRadius: '50%',
                margin: '0 auto 20px',
                animation: 'spin 1s linear infinite'
              }}></div>
              <p>Loading customer details...</p>
            </div>
          ) : totalAssigned === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
              <i className="bi bi-inbox" style={{ fontSize: '48px', display: 'block', marginBottom: '10px' }}></i>
              <p>No customers assigned yet</p>
            </div>
          ) : (
            <div className="caller-details-table-container">
              <table className="caller-details-table">
                <thead>
                  <tr>
                    <th>TASK ID</th>
                    <th>ACCOUNT NUMBER</th>
                    <th>CUSTOMER NAME</th>
                    <th>AMOUNT OVERDUE</th>
                    <th>DAYS OVERDUE</th>
                    <th>STATUS</th>
                    <th>LAST CONTACT</th>
                    <th>RESPONSE</th>
                  </tr>
                </thead>
                <tbody>
                  {assignedCustomers.map((customer) => {
                    const lastContact = getLastContact(customer);
                    const customerStatus = getCustomerStatus(customer);
                    return (
                      <tr key={customer._id} className={`customer-row ${customerStatus.toLowerCase()}`}>
                        <td>
                          <span className="caller-details-task-id" style={{ 
                            fontSize: '0.85em', 
                            fontFamily: 'monospace',
                            color: '#666',
                            backgroundColor: '#f0f0f0',
                            padding: '2px 6px',
                            borderRadius: '3px'
                          }}>
                            {customer.taskId || 'N/A'}
                          </span>
                        </td>
                        <td>
                          <span className="caller-details-account">{customer.accountNumber}</span>
                        </td>
                        <td>
                          <strong>{customer.name}</strong>
                        </td>
                        <td>
                          <span className="caller-details-amount">{customer.amountOverdue || 0}</span>
                        </td>
                        <td>
                          <span className="caller-details-days">{customer.daysOverdue || 0} days</span>
                        </td>
                        <td>
                          <span className={`caller-details-status-badge ${customerStatus.toLowerCase()}`}>
                            {customerStatus === "COMPLETED" && (
                              <><i className="bi bi-check-circle-fill"></i> COMPLETED</>
                            )}
                            {customerStatus === "CONTACTED" && (
                              <><i className="bi bi-telephone-fill"></i> CONTACTED</>
                            )}
                            {customerStatus === "NOT_CONTACTED" && (
                              <><i className="bi bi-dash-circle-fill"></i> NOT CONTACTED</>
                            )}
                          </span>
                        </td>
                        <td>
                          <span className="caller-details-date">
                            {lastContact.date}
                          </span>
                        </td>
                        <td>
                          <div className="caller-details-response">
                            <span>{lastContact.response}</span>
                            {customer.contactHistory && customer.contactHistory.length > 0 && (
                              <small className="caller-details-contact-count">
                                <i className="bi bi-telephone"></i> {customer.contactHistory.length} call{customer.contactHistory.length > 1 ? 's' : ''}
                              </small>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="caller-details-modal-footer">
          <div className="caller-details-progress">
            <span className="caller-details-progress-label">Progress:</span>
            <div className="caller-details-progress-bar">
              <div 
                className="caller-details-progress-fill" 
                style={{ width: totalAssigned > 0 ? `${(completedCount / totalAssigned) * 100}%` : '0%' }}
              >
                {totalAssigned > 0 && (
                  <span className="caller-details-progress-text">
                    {completedCount}/{totalAssigned} ({Math.round((completedCount / totalAssigned) * 100)}%)
                  </span>
                )}
              </div>
            </div>
          </div>
          <button className="caller-details-close-modal-btn" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default CallerDetailsModal;
