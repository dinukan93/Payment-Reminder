import React, { useState } from "react";
import "./AdminSentRequestsModal.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import API_BASE_URL from "../config/api";
import { showSuccess, showError } from "./Notifications";

function AdminSentRequestsModal({ isOpen, onClose, sentRequests = [], onRequestCancelled }) {
  const [expandedRequestId, setExpandedRequestId] = useState(null);
  const [cancellingRequestId, setCancellingRequestId] = useState(null);

  if (!isOpen) return null;

  const toggleExpand = (requestId) => {
    setExpandedRequestId(expandedRequestId === requestId ? null : requestId);
  };

  const handleCancelRequest = async (requestId) => {
    if (cancellingRequestId) return; // Prevent multiple clicks

    if (!window.confirm("Are you sure you want to cancel this request? The customers will be unassigned from the caller.")) {
      return;
    }

    setCancellingRequestId(requestId);

    try {
      const response = await secureFetch(`/api/requests/${requestId}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const result = await response.json();

      if (result.success) {
        showSuccess("Request cancelled successfully");
        if (onRequestCancelled) {
          onRequestCancelled(requestId);
        }
      } else {
        showError(result.message || "Failed to cancel request");
      }
    } catch (error) {
      console.error('Error cancelling request:', error);
      showError("Error cancelling request");
    } finally {
      setCancellingRequestId(null);
    }
  };

  return (
    <div className="admin-sent-requests-modal-overlay" onClick={onClose}>
      <div className="admin-sent-requests-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="admin-sent-requests-modal-header">
          <h2>
            <i className="bi bi-envelope-open"></i> Sent Requests Status
          </h2>
          <button className="admin-sent-requests-close-btn" onClick={onClose}>
            <i className="bi bi-x-lg"></i>
          </button>
        </div>

        <div className="admin-sent-requests-modal-body">
          {sentRequests.length > 0 ? (
            <div className="admin-sent-requests-table-container">
              <div className="admin-sent-requests-list">
                {sentRequests.map((request) => (
                  <div key={request.id} className={`admin-sent-request-card ${request.status.toLowerCase()}`}>
                    <div className="admin-sent-request-header" onClick={() => toggleExpand(request.id)}>
                      <div className="admin-sent-request-main-info">
                        <div className="admin-sent-caller-info">
                          <strong>{request.callerName}</strong>
                          <span className="admin-sent-caller-id">ID: {request.callerId}</span>
                        </div>
                        <div className="admin-sent-request-meta">
                          <span className="admin-sent-customers-count">
                            <i className="bi bi-people-fill"></i>
                            {request.customersSent} customers
                          </span>
                          <span className="admin-sent-date">
                            <i className="bi bi-calendar3"></i>
                            {request.sentDate}
                          </span>
                          <span className={`admin-sent-status-badge ${request.status.toLowerCase()}`}>
                            {request.status === "ACCEPTED" && (
                              <><i className="bi bi-check-circle-fill"></i> ACCEPTED</>
                            )}
                            {request.status === "DECLINED" && (
                              <><i className="bi bi-x-circle-fill"></i> DECLINED</>
                            )}
                            {request.status === "PENDING" && (
                              <><i className="bi bi-hourglass-split"></i> PENDING</>
                            )}
                            {request.status === "CANCELLED" && (
                              <><i className="bi bi-ban"></i> CANCELLED</>
                            )}
                          </span>
                        </div>
                      </div>
                      <div className="admin-sent-request-actions">
                        {request.status === "PENDING" && (
                          <button
                            className="admin-cancel-request-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCancelRequest(request.id);
                            }}
                            disabled={cancellingRequestId === request.id}
                            title="Cancel this request"
                          >
                            <i className="bi bi-x-circle"></i>
                            {cancellingRequestId === request.id ? 'Cancelling...' : 'Cancel'}
                          </button>
                        )}
                        <button className="admin-sent-expand-btn">
                          <i className={`bi bi-chevron-${expandedRequestId === request.id ? 'up' : 'down'}`}></i>
                        </button>
                      </div>
                    </div>

                    {expandedRequestId === request.id && (
                      <div className="admin-sent-request-details">
                        <div className="admin-sent-response-section">
                          <h4>Response Details</h4>
                          {request.status === "PENDING" ? (
                            <div className="admin-sent-waiting-message">
                              <i className="bi bi-hourglass-split"></i>
                              <span>Waiting for caller's response...</span>
                            </div>
                          ) : (
                            <div className="admin-sent-response-info">
                              <div className="admin-sent-response-time">
                                <i className="bi bi-clock-fill"></i>
                                <span>Responded on: {request.respondedDate}</span>
                              </div>
                              {request.reason && (
                                <div className="admin-sent-reason-box">
                                  <i className="bi bi-info-circle-fill"></i>
                                  <span><strong>Reason:</strong> {request.reason}</span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        <div className="admin-sent-customers-section">
                          <h4>
                            <i className="bi bi-list-ul"></i> Customers Assigned ({request.customers?.length || request.customersSent || 0})
                          </h4>
                          {request.customers && request.customers.length > 0 ? (
                            <div className="admin-sent-customers-table">
                              <table>
                                <thead>
                                  <tr>
                                    <th>Account Number</th>
                                    <th>Customer Name</th>
                                    <th>Amount Overdue</th>
                                    <th>Days Overdue</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {request.customers.map((customer) => (
                                    <tr key={customer.id}>
                                      <td>{customer.accountNumber}</td>
                                      <td>{customer.name}</td>
                                      <td className="admin-sent-amount">{customer.amountOverdue}</td>
                                      <td className="admin-sent-days">{customer.daysOverdue} days</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          ) : (
                            <div className="admin-empty-state">
                              <p>Customer details not available. {request.customersSent} customers were assigned.</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="admin-empty-state">
              <i className="bi bi-inbox"></i>
              <h3>No Requests Sent</h3>
              <p>You haven't sent any customer lists to callers yet.</p>
            </div>
          )}
        </div>

        <div className="admin-sent-requests-modal-footer">
          <div className="admin-sent-summary">
            <span className="admin-sent-summary-item">
              <i className="bi bi-hourglass-split"></i>
              Pending: {sentRequests.filter(r => r.status === "PENDING").length}
            </span>
            <span className="admin-sent-summary-item">
              <i className="bi bi-check-circle-fill"></i>
              Accepted: {sentRequests.filter(r => r.status === "ACCEPTED").length}
            </span>
            <span className="admin-sent-summary-item">
              <i className="bi bi-x-circle-fill"></i>
              Declined: {sentRequests.filter(r => r.status === "DECLINED").length}
            </span>
            <span className="admin-sent-summary-item">
              <i className="bi bi-ban"></i>
              Cancelled: {sentRequests.filter(r => r.status === "CANCELLED").length}
            </span>
          </div>
          <button className="admin-close-modal-btn" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default AdminSentRequestsModal;
