import React, { useState, useEffect } from "react";
import "./AdminRequestsModal.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import API_BASE_URL from "../config/api";

function AdminRequestsModal({ isOpen, onClose, onAccept, onDecline, onRequestProcessed, callerId }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch pending requests from MongoDB when modal opens
  useEffect(() => {
    if (isOpen && callerId) {
      fetchPendingRequests();
    }
  }, [isOpen, callerId]);

  const fetchPendingRequests = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_BASE_URL}/requests?callerId=${callerId}&status=PENDING`);
      
      if (response.ok) {
        const data = await response.json();
        
        if (data && data.length > 0) {
          setRequests(data.map(req => ({
            id: req.requestId || req._id,
            customers: req.customers,
            customerCount: req.customers.length,
            sentDate: req.sentDate,
            callerName: req.callerName,
            callerId: req.callerId
          })));
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

  const handleAcceptAll = async () => {
    if (requests.length === 0) return;
    
    const request = requests[0];
    
    try {
      // Update request status in backend
      const response = await fetch(`${API_BASE_URL}/requests/${request.id}`, {
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
        
        // Clear all requests
        setRequests([]);
        
        // Notify parent that request is processed
        if (onRequestProcessed) onRequestProcessed();
        
        alert('Request accepted successfully!');
      } else {
        alert('Failed to accept request. Please try again.');
      }
    } catch (error) {
      console.error('Error accepting request:', error);
      alert('Failed to accept request. Please try again.');
    }
  };

  const handleDeclineAll = async () => {
    if (requests.length === 0) return;
    
    const request = requests[0];
    const reason = prompt("Please provide a reason for declining:");
    
    if (!reason) return;
    
    try {
      // Update request status in backend
      const response = await fetch(`${API_BASE_URL}/requests/${request.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'DECLINED',
          respondedAt: new Date().toISOString(),
          declineReason: reason
        })
      });

      if (response.ok) {
        // Decline all requests
        onDecline(request.id);
        
        // Clear all requests
        setRequests([]);
        
        // Notify parent that request is processed
        if (onRequestProcessed) onRequestProcessed();
        
        alert('Request declined successfully!');
      } else {
        alert('Failed to decline request. Please try again.');
      }
    } catch (error) {
      console.error('Error declining request:', error);
      alert('Failed to decline request. Please try again.');
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
            <div className="requests-summary-card">
              <div className="summary-header">
                <i className="bi bi-envelope-open"></i>
                <h3>New Customer Assignment from Admin</h3>
              </div>
              
              <div className="summary-details">
                <div className="detail-item">
                  <span className="detail-label">Total Requests:</span>
                  <span className="detail-value">{requests.length}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Total Customers:</span>
                  <span className="detail-value">
                    {requests.reduce((sum, req) => sum + (req.customerCount || 0), 0)}
                  </span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Date:</span>
                  <span className="detail-value">{requests[0].sentDate}</span>
                </div>
              </div>

              <div className="summary-actions">
                <button 
                  className="decline-all-btn"
                  onClick={handleDeclineAll}
                  disabled={loading}
                >
                  <i className="bi bi-x-circle"></i>
                  Decline
                </button>
                <button 
                  className="accept-all-btn"
                  onClick={handleAcceptAll}
                  disabled={loading}
                >
                  <i className="bi bi-check-circle"></i>
                  Accept
                </button>
              </div>
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
