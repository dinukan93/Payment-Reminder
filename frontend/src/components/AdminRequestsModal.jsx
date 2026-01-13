import React, { useState, useEffect } from "react";
import "./AdminRequestsModal.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import API_BASE_URL from "../config/api";
import { secureFetch } from "../utils/api";
import { showSuccess, showError } from "./Notifications";

function AdminRequestsModal({ isOpen, onClose, onAccept, onDecline, onRequestProcessed, callerId }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [expandedRequests, setExpandedRequests] = useState({});
  const [decliningRequestId, setDecliningRequestId] = useState(null);
  const [declineReason, setDeclineReason] = useState('');

  // Fetch pending requests from MongoDB when modal opens
  useEffect(() => {
    if (isOpen && callerId) {
      fetchPendingRequests();
    }
  }, [isOpen, callerId]);

  const fetchPendingRequests = async () => {
    setLoading(true);
    setError(null);

    console.log('AdminRequestsModal - Fetching requests for callerId:', callerId);

    try {
      const response = await secureFetch(`/api/requests?callerId=${callerId}&status=PENDING`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        const data = result.data || result; // Handle both nested and flat response

        console.log('AdminRequestsModal - Received requests:', data);


        if (data && data.length > 0) {
          setRequests(data.map(req => {
            const requestId = req.id || req.requestId || req._id;

            // Format the date properly
            let formattedDate = '';
            const dateValue = req.sent_date || req.sentDate;
            if (dateValue) {
              const date = new Date(dateValue);
              formattedDate = date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
              });
            }

            console.log('Mapping request:', {
              original: req,
              mappedId: requestId,
              sent_by: req.sent_by,
              sent_date: dateValue,
              formattedDate: formattedDate
            });

            return {
              id: requestId,
              customers: req.customers || [],
              customerCount: (req.customers || []).length,
              sentDate: formattedDate,
              callerName: req.caller_name || req.callerName,
              callerId: req.caller_id || req.callerId,
              sentBy: req.sent_by || req.sentBy || 'Admin'
            };
          }));
          // All requests collapsed by default
          setExpandedRequests({});
        } else {
          setRequests([]);
        }
      } else {
        setError('Failed to load requests. Please try again.');
        setRequests([]);
      }
    } catch (err) {
      console.error('Error loading pending requests:', err);
      setError('Failed to load requests. Please try again.');
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const toggleRequest = (requestId) => {
    setExpandedRequests(prev => ({
      ...prev,
      [requestId]: !prev[requestId]
    }));
  };

  const handleAcceptRequest = async (requestId) => {
    const request = requests.find(r => r.id === requestId);
    if (!request) return;

    try {
      // Update request status in backend
      const response = await secureFetch(`/api/requests/${request.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'ACCEPTED',
          respondedAt: new Date().toISOString()
        })
      });

      if (response.ok) {
        // Convert all customers to the format expected by CallerDashboard
        const allCustomersData = request.customers.map((customer, index) => ({
          id: customer.customerId || (Date.now() + index),
          accountNumber: customer.accountNumber,
          name: customer.name,
          contactNumber: customer.contactNumber,
          amountOverdue: customer.amountOverdue,
          daysOverdue: customer.daysOverdue,
          status: "OVERDUE",
          response: "Not Contacted Yet",
          previousResponse: "No previous contact",
          contactHistory: []
        }));

        // Call parent handler with all customers at once
        onAccept(allCustomersData);

        // Remove this request from the list
        setRequests(requests.filter(r => r.id !== requestId));

        // Notify parent that request is processed
        if (onRequestProcessed) onRequestProcessed();

        showSuccess('Request accepted successfully!');
      } else {
        showError('Failed to accept request. Please try again.');
      }
    } catch (error) {
      console.error('Error accepting request:', error);
      showError('Failed to accept request. Please try again.');
    }
  };

  const handleDeclineClick = (requestId) => {
    setDecliningRequestId(requestId);
    setDeclineReason('');
  };

  const handleCancelDecline = () => {
    setDecliningRequestId(null);
    setDeclineReason('');
  };

  const handleDeclineRequest = async (requestId) => {
    const request = requests.find(r => r.id === requestId);
    if (!request) {
      showError('Request not found');
      return;
    }

    if (!request.id) {
      console.error('Request ID is undefined:', request);
      showError('Invalid request ID. Please refresh and try again.');
      return;
    }

    if (!declineReason || declineReason.trim() === '') {
      showError('Decline reason is required');
      return;
    }

    try {
      console.log('Declining request with ID:', request.id);
      // Update request status in backend

      const response = await secureFetch(`/api/requests/${request.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'DECLINED',
          respondedAt: new Date().toISOString(),
          declineReason: declineReason.trim()
        })
      });

      const result = await response.json();

      if (result.success || response.ok) {
        showSuccess('Request declined successfully');
        // Reset declining state
        setDecliningRequestId(null);
        setDeclineReason('');
        // Refresh requests
        fetchPendingRequests();
        if (onRequestProcessed) {
          onRequestProcessed();
        }
      } else {
        showError(result.message || 'Failed to decline request');
      }
    } catch (error) {
      console.error('Error declining request:', error);
      showError('Failed to decline request. Please try again.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="admin-requests-modal-overlay" onClick={onClose}>
      <div className="admin-requests-modal" onClick={(e) => e.stopPropagation()}>
        <div className="admin-requests-header">
          <div className="header-title">
            <i className="bi bi-inbox-fill"></i>
            <h2>Admin Requests</h2>
            {requests.length > 0 && (
              <span className="requests-count">{requests.length}</span>
            )}
          </div>
          <button className="close-modal-btn" onClick={onClose}>
            <i className="bi bi-x-lg"></i>
          </button>
        </div>

        <div className="admin-requests-body">
          {loading ? (
            <div className="loading-state">
              <i className="bi bi-hourglass-split"></i>
              <p>Loading requests...</p>
            </div>
          ) : error ? (
            <div className="error-state">
              <i className="bi bi-exclamation-triangle"></i>
              <p>{error}</p>
              <button onClick={fetchPendingRequests} className="retry-btn">
                <i className="bi bi-arrow-clockwise"></i>
                Retry
              </button>
            </div>
          ) : requests.length > 0 ? (
            <div className="requests-list">
              {requests.map((request, index) => (
                <div key={request.id || index} className="requests-summary-card">
                  <div
                    className="summary-header clickable"
                    onClick={() => toggleRequest(request.id)}
                    style={{ cursor: 'pointer' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <i className="bi bi-envelope-open"></i>
                      <h3>Customer Assignment #{index + 1}</h3>
                      <span className="customer-badge">{request.customerCount} customers</span>
                    </div>
                    <i className={`bi bi-chevron-${expandedRequests[request.id] ? 'up' : 'down'}`}></i>
                  </div>

                  {expandedRequests[request.id] && (
                    <>
                      <div className="summary-details">
                        <div className="detail-item">
                          <span className="detail-label">Customers:</span>
                          <span className="detail-value">{request.customerCount}</span>
                        </div>
                        <div className="detail-item">
                          <span className="detail-label">Date:</span>
                          <span className="detail-value">{request.sentDate}</span>
                        </div>
                        <div className="detail-item">
                          <span className="detail-label">From:</span>
                          <span className="detail-value">{request.sentBy || 'Admin'}</span>
                        </div>
                      </div>

                      <div className="customer-list">
                        <h4>Customers in this request:</h4>
                        <ul>
                          {request.customers.map((customer, idx) => (
                            <li key={idx}>
                              {customer.name} - {customer.accountNumber}
                            </li>
                          ))}
                        </ul>
                      </div>


                      <div className="summary-actions">
                        {decliningRequestId === request.id ? (
                          <div className="decline-reason-section">
                            <label htmlFor={`decline-reason-${request.id}`}>
                              Reason for declining:
                            </label>
                            <textarea
                              id={`decline-reason-${request.id}`}
                              value={declineReason}
                              onChange={(e) => setDeclineReason(e.target.value)}
                              placeholder="Please provide a reason..."
                              rows="3"
                              className="decline-reason-input"
                            />
                            <div className="decline-actions">
                              <button
                                className="cancel-decline-btn"
                                onClick={handleCancelDecline}
                              >
                                Cancel
                              </button>
                              <button
                                className="confirm-decline-btn"
                                onClick={() => handleDeclineRequest(request.id)}
                                disabled={loading || !declineReason.trim()}
                              >
                                {loading ? 'Declining...' : 'Confirm Decline'}
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <button
                              className="decline-all-btn"
                              onClick={() => handleDeclineClick(request.id)}
                              disabled={loading}
                            >
                              <i className="bi bi-x-circle"></i> Decline
                            </button>
                            <button
                              className="accept-all-btn"
                              onClick={() => handleAcceptRequest(request.id)}
                              disabled={loading}
                            >
                              <i className="bi bi-check-circle"></i> Accept
                            </button>
                          </>
                        )}
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="no-requests">
              <i className="bi bi-inbox"></i>
              <h3>No Requests</h3>
              <p>You don't have any pending requests from admin</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AdminRequestsModal;
