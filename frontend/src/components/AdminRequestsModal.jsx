import React, { useState, useEffect } from "react";
import "./AdminRequestsModal.css";
import "bootstrap-icons/font/bootstrap-icons.css";

function AdminRequestsModal({ isOpen, onClose, onAccept, onDecline, onRequestProcessed }) {
  const [requests, setRequests] = useState([]);
  const [requestId, setRequestId] = useState(null);

  // Initialize sample admin requests data when modal opens
  useEffect(() => {
    if (isOpen) {
      console.log('AdminRequestsModal opened, checking localStorage...');
      
      // Check for pending request from localStorage
      const storedRequest = localStorage.getItem('pendingAdminRequest');
      console.log('Stored request:', storedRequest);
      
      if (storedRequest) {
        try {
          const parsedRequest = JSON.parse(storedRequest);
          console.log('Parsed request:', parsedRequest);
          setRequests(parsedRequest.customers);
          setRequestId(parsedRequest.requestId);
        } catch (error) {
          console.error('Error parsing stored request:', error);
        }
      } else {
        console.log('No stored request found, using sample data');
        // Sample admin requests data 
        const sampleRequests = [
          {
            id: 1,
            accountNumber: "1001234582",
            name: "Kamal Perera",
            contactNumber: "077-1234567",
            amountOverdue: "Rs.3500",
            daysOverdue: "25",
            date: "02/11/2025",
            sentBy: "Admin",
            sentDate: "02/11/2025"
          },
          {
            id: 2,
            accountNumber: "1001234583",
            name: "Nimal Silva",
            contactNumber: "071-9876543",
            amountOverdue: "Rs.4200",
            daysOverdue: "18",
            date: "02/11/2025",
            sentBy: "Admin",
            sentDate: "02/11/2025"
          },
          {
            id: 3,
            accountNumber: "1001234584",
            name: "Saman Fernando",
            contactNumber: "076-5555444",
            amountOverdue: "Rs.2800",
            daysOverdue: "30",
            date: "02/11/2025",
            sentBy: "Admin",
            sentDate: "02/11/2025"
          }
        ];
        setRequests(sampleRequests);
        setRequestId(null);
      }
    }
  }, [isOpen]);

  const handleAcceptAll = () => {
    // Convert all requests to customer data
    const allCustomersData = requests.map((request, index) => ({
      id: Date.now() + index, // Ensure unique IDs
      accountNumber: request.accountNumber,
      name: request.name,
      contactNumber: request.contactNumber,
      amountOverdue: request.amountOverdue,
      daysOverdue: request.daysOverdue,
      date: request.date,
      status: "OVERDUE",
      response: "Not Contacted Yet",
      previousResponse: "No previous contact",
      contactHistory: []
    }));
    
    // Call parent handler with all customers at once
    onAccept(allCustomersData);
    
    // Update request status in localStorage to ACCEPTED
    if (requestId) {
      const requestResponse = {
        requestId: requestId,
        status: 'ACCEPTED',
        respondedDate: new Date().toLocaleString('en-GB', { 
          day: '2-digit', 
          month: '2-digit', 
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          hour12: true 
        }),
        reason: null
      };
      localStorage.setItem('callerRequestResponse', JSON.stringify(requestResponse));
      localStorage.removeItem('pendingAdminRequest');
    }
    
    // Clear all requests
    setRequests([]);
    
    // Notify parent that request is processed
    if (onRequestProcessed) onRequestProcessed();
  };

  const handleDeclineAll = () => {
    // Decline all requests
    requests.forEach(request => {
      onDecline(request.id);
    });
    
    // Update request status in localStorage to DECLINED
    if (requestId) {
      const requestResponse = {
        requestId: requestId,
        status: 'DECLINED',
        respondedDate: new Date().toLocaleString('en-GB', { 
          day: '2-digit', 
          month: '2-digit', 
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          hour12: true 
        }),
        reason: 'Too many customers assigned already' // Default reason, can be customized
      };
      localStorage.setItem('callerRequestResponse', JSON.stringify(requestResponse));
      localStorage.removeItem('pendingAdminRequest');
    }
    
    // Clear all requests
    setRequests([]);
    
    // Notify parent that request is processed
    if (onRequestProcessed) onRequestProcessed();
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
          {requests.length > 0 ? (
            <div className="requests-summary-card">
              <div className="summary-header">
                <i className="bi bi-envelope-open"></i>
                <h3>New Customer Assignment from Admin</h3>
              </div>
              
              <div className="summary-details">
                <div className="detail-item">
                  <span className="detail-label">Total Customers:</span>
                  <span className="detail-value">{requests.length}</span>
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
                >
                  <i className="bi bi-x-circle"></i>
                  Decline
                </button>
                <button 
                  className="accept-all-btn"
                  onClick={handleAcceptAll}
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
