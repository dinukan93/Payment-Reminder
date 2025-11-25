import React from "react";
import "./CallerDetailsModal.css";
import "bootstrap-icons/font/bootstrap-icons.css";

function CallerDetailsModal({ isOpen, onClose, caller }) {
  if (!isOpen || !caller) return null;

  // Sample customer data for the caller
  const assignedCustomers = [
    {
      id: 1,
      accountNumber: "1001234567",
      name: "Prashant Kumar Singh",
      amountOverdue: "Rs.2000",
      daysOverdue: 16,
      status: "CONTACTED",
      lastContact: "03/11/2025",
      response: "Will pay next week",
      promisedDate: "10/11/2025"
    },
    {
      id: 2,
      accountNumber: "1001234568",
      name: "Ravi Sharma",
      amountOverdue: "Rs.1500",
      daysOverdue: 8,
      status: "COMPLETED",
      lastContact: "02/11/2025",
      response: "Payment completed",
      paymentDate: "02/11/2025"
    },
    {
      id: 3,
      accountNumber: "1001234569",
      name: "Ash Kumar",
      amountOverdue: "Rs.3500",
      daysOverdue: 22,
      status: "NOT_CONTACTED",
      lastContact: null,
      response: "Not yet contacted"
    },
    {
      id: 4,
      accountNumber: "1001234570",
      name: "Priya Singh",
      amountOverdue: "Rs.1800",
      daysOverdue: 12,
      status: "CONTACTED",
      lastContact: "01/11/2025",
      response: "Phone not reachable",
      promisedDate: null
    },
    {
      id: 5,
      accountNumber: "1001234571",
      name: "Kumar Patel",
      amountOverdue: "Rs.2500",
      daysOverdue: 14,
      status: "COMPLETED",
      lastContact: "03/11/2025",
      response: "Payment completed",
      paymentDate: "03/11/2025"
    }
  ];

  const completedCount = assignedCustomers.filter(c => c.status === "COMPLETED").length;
  const contactedCount = assignedCustomers.filter(c => c.status === "CONTACTED").length;
  const notContactedCount = assignedCustomers.filter(c => c.status === "NOT_CONTACTED").length;
  const totalAssigned = assignedCustomers.length;

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
          <div className="caller-details-table-container">
            <table className="caller-details-table">
              <thead>
                <tr>
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
                {assignedCustomers.map((customer) => (
                  <tr key={customer.id} className={`customer-row ${customer.status.toLowerCase()}`}>
                    <td>
                      <span className="caller-details-account">{customer.accountNumber}</span>
                    </td>
                    <td>
                      <strong>{customer.name}</strong>
                    </td>
                    <td>
                      <span className="caller-details-amount">{customer.amountOverdue}</span>
                    </td>
                    <td>
                      <span className="caller-details-days">{customer.daysOverdue} days</span>
                    </td>
                    <td>
                      <span className={`caller-details-status-badge ${customer.status.toLowerCase()}`}>
                        {customer.status === "COMPLETED" && (
                          <><i className="bi bi-check-circle-fill"></i> COMPLETED</>
                        )}
                        {customer.status === "CONTACTED" && (
                          <><i className="bi bi-telephone-fill"></i> CONTACTED</>
                        )}
                        {customer.status === "NOT_CONTACTED" && (
                          <><i className="bi bi-dash-circle-fill"></i> NOT CONTACTED</>
                        )}
                      </span>
                    </td>
                    <td>
                      <span className="caller-details-date">
                        {customer.lastContact || "-"}
                      </span>
                    </td>
                    <td>
                      <div className="caller-details-response">
                        <span>{customer.response}</span>
                        {customer.promisedDate && (
                          <small className="caller-details-promised">
                            <i className="bi bi-calendar-check"></i> Promised: {customer.promisedDate}
                          </small>
                        )}
                        {customer.paymentDate && (
                          <small className="caller-details-payment">
                            <i className="bi bi-cash-coin"></i> Paid: {customer.paymentDate}
                          </small>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="caller-details-modal-footer">
          <div className="caller-details-progress">
            <span className="caller-details-progress-label">Progress:</span>
            <div className="caller-details-progress-bar">
              <div 
                className="caller-details-progress-fill" 
                style={{ width: `${(completedCount / totalAssigned) * 100}%` }}
              >
                <span className="caller-details-progress-text">
                  {completedCount}/{totalAssigned} ({Math.round((completedCount / totalAssigned) * 100)}%)
                </span>
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
