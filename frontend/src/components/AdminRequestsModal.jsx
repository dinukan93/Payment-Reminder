import React, { useState, useEffect } from "react";
import "./AdminRequestsModal.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import API_BASE_URL from "../config/api";

function AdminRequestsModal({ isOpen, onClose, onAccept, onDecline, onRequestProcessed, callerId }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [expandedRequests, setExpandedRequests] = useState({});

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
      const response = await fetch(`${API_BASE_URL}/api/requests?callerId=${callerId}&status=PENDING`);
      
      if (response.ok) {
        const result = await response.json();
        const data = result.data || result; // Handle both nested and flat response
        
        console.log('AdminRequestsModal - Received requests:', data);
        
        if (data && data.length > 0) {
          setRequests(data.map(req => ({
            id: req.requestId || req._id,
            customers: req.customers,
            customerCount: req.customers.length,
            sentDate: req.sentDate,
            callerName: req.callerName,
            callerId: req.callerId,
            sentBy: req.sentBy
          })));
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
      const response = await fetch(`${API_BASE_URL}/api/requests/${request.id}`, {
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
        
        alert('Request accepted successfully!');
      } else {
        alert('Failed to accept request. Please try again.');
      }
    } catch (error) {
      console.error('Error accepting request:', error);
      alert('Failed to accept request. Please try again.');
    }
  };

  const handleDeclineRequest = async (requestId) => {
    const request = requests.find(r => r.id === requestId);
    if (!request) return;
    
    const reason = prompt("Please provide a reason for declining:");
    
    if (!reason) return;
    
    try {
      // Update request status in backend
      const response = await fetch(`${API_BASE_URL}/api/requests/${request.id}`, {
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
        // Decline the request
        onDecline(request.id);
        
        // Remove this request from the list
        setRequests(requests.filter(r => r.id !== requestId));
        
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
            <div className="requests-list">
              {requests.map((request, index) => (
                <div key={request.id} className="requests-summary-card">
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
                          {request.customers.slice(0, 3).map((customer, idx) => (
                            <li key={idx}>
                              {customer.name} - {customer.accountNumber}
                            </li>
                          ))}
                          {request.customers.length > 3 && (
                            <li className="more-customers">
                              +{request.customers.length - 3} more customers
                            </li>
                          )}
                        </ul>
                      </div>

                      <div className="summary-actions">
                        <button 
                          className="decline-all-btn"
                          onClick={() => handleDeclineRequest(request.id)}
                          disabled={loading}
                        >
                          <i className="bi bi-x-circle"></i>
                          Decline
                        </button>
                        <button 
                          className="accept-all-btn"
                          onClick={() => handleAcceptRequest(request.id)}
                          disabled={loading}
                        >
                          <i className="bi bi-check-circle"></i>
                          Accept
                        </button>
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
