import React, { useState, useEffect } from "react";
import "./AdminDashboard.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import AdminSentRequestsModal from "../components/AdminSentRequestsModal";
import CallerDetailsModal from "../components/CallerDetailsModal";

function AdminDashboard() {
  const [isRequestsModalOpen, setIsRequestsModalOpen] = useState(false);
  const [isCallerDetailsModalOpen, setIsCallerDetailsModalOpen] = useState(false);
  const [selectedCaller, setSelectedCaller] = useState(null);

  // Check for caller responses on component mount and periodically
  useEffect(() => {
    checkForCallerResponses();
    
    // Check every 5 seconds for responses (simulating real-time updates)
    const interval = setInterval(checkForCallerResponses, 5000);
    
    return () => clearInterval(interval);
  }, []);

  const checkForCallerResponses = () => {
    const response = localStorage.getItem('callerRequestResponse');
    if (response) {
      const parsedResponse = JSON.parse(response);
      
      // Update the corresponding request in sentRequests
      setSentRequests(prevRequests => {
        const updated = prevRequests.map(request => {
          if (request.id === parsedResponse.requestId) {
            console.log(`✅ Request ${parsedResponse.requestId} status updated to ${parsedResponse.status}`);
            return {
              ...request,
              status: parsedResponse.status,
              respondedDate: parsedResponse.respondedDate,
              reason: parsedResponse.reason
            };
          }
          return request;
        });
        return updated;
      });
      
      // Clear the response from localStorage
      localStorage.removeItem('callerRequestResponse');
      
      // Show notification
      alert(`Caller has ${parsedResponse.status.toLowerCase()} the request!`);
    }
  };
  const [assignedCallers] = useState([
    {
      id: 1,
      name: "Kumar Singh",
      callerId: "2331",
      task: "ONGOING",
      customersContacted: "10/20"
    },
    {
      id: 2,
      name: "Ravi Kumar",
      callerId: "2313",
      task: "COMPLETED",
      customersContacted: "20/20"
    }
  ]);

  const [unassignedCallers] = useState([
    {
      id: 1,
      name: "Kumar Singh",
      date: "25/2/2025",
      status: "AVAILABLE",
      latestWork: "None"
    },
    {
      id: 2,
      name: "Kumar Singh",
      date: "25/2/2025",
      status: "AVAILABLE",
      latestWork: "Completed 20/20"
    },
    {
      id: 3,
      name: "Kumar Singh",
      date: "25/2/2025",
      status: "AVAILABLE",
      latestWork: "Completed 40/40"
    }
  ]);

  const [sentRequests, setSentRequests] = useState([
    {
      id: 1,
      callerName: "Ravi Kumar",
      callerId: "2313",
      customersSent: 3,
      sentDate: "01/11/2025",
      status: "ACCEPTED",
      respondedDate: "01/11/2025 10:30 AM",
      customers: [
        { id: 1, accountNumber: "1001234567", name: "John Doe", amountOverdue: "Rs.5,000", daysOverdue: 45 },
        { id: 2, accountNumber: "1001234568", name: "Jane Smith", amountOverdue: "Rs.3,500", daysOverdue: 30 },
        { id: 3, accountNumber: "1001234569", name: "Bob Johnson", amountOverdue: "Rs.7,200", daysOverdue: 60 }
      ]
    },
    {
      id: 2,
      callerName: "Ash Kumar",
      callerId: "2314",
      customersSent: 4,
      sentDate: "02/11/2025",
      status: "DECLINED",
      respondedDate: "02/11/2025 02:15 PM",
      reason: "Too many customers assigned already",
      customers: [
        { id: 4, accountNumber: "1001234570", name: "Alice Brown", amountOverdue: "Rs.4,800", daysOverdue: 25 },
        { id: 5, accountNumber: "1001234571", name: "Charlie Wilson", amountOverdue: "Rs.6,100", daysOverdue: 50 },
        { id: 6, accountNumber: "1001234572", name: "Diana Moore", amountOverdue: "Rs.2,900", daysOverdue: 20 },
        { id: 7, accountNumber: "1001234573", name: "Edward Taylor", amountOverdue: "Rs.8,500", daysOverdue: 70 }
      ]
    },
    {
      id: 3,
      callerName: "Priya Singh",
      callerId: "2315",
      customersSent: 5,
      sentDate: "03/11/2025",
      status: "PENDING",
      respondedDate: null,
      customers: [
        { id: 8, accountNumber: "1001234574", name: "Frank Miller", amountOverdue: "Rs.5,600", daysOverdue: 35 },
        { id: 9, accountNumber: "1001234575", name: "Grace Lee", amountOverdue: "Rs.4,200", daysOverdue: 28 },
        { id: 10, accountNumber: "1001234576", name: "Henry Davis", amountOverdue: "Rs.7,800", daysOverdue: 55 },
        { id: 11, accountNumber: "1001234577", name: "Iris Martinez", amountOverdue: "Rs.3,300", daysOverdue: 22 },
        { id: 12, accountNumber: "1001234578", name: "Jack Anderson", amountOverdue: "Rs.6,700", daysOverdue: 48 }
      ]
    },
    {
      id: 4,
      callerName: "Kumar Singh",
      callerId: "2331",
      customersSent: 3,
      sentDate: "03/11/2025",
      status: "PENDING",
      respondedDate: null,
      customers: [
        { id: 13, accountNumber: "1001234579", name: "Karen Thomas", amountOverdue: "Rs.4,500", daysOverdue: 32 },
        { id: 14, accountNumber: "1001234580", name: "Leo Jackson", amountOverdue: "Rs.5,900", daysOverdue: 42 },
        { id: 15, accountNumber: "1001234581", name: "Mia White", amountOverdue: "Rs.3,100", daysOverdue: 18 }
      ]
    }
  ]);

  const pendingRequestsCount = sentRequests.filter(req => req.status === "PENDING").length;

  const stats = [
    { icon: "bi-people", value: "250", label: "Total Customers", color: "#1488eeff" },
    { icon: "bi-telephone-outbound", value: "33", label: "Assigned Callers", color: "#1488eeff" },
    { icon: "bi-telephone-inbound", value: "12", label: "Unassigned Callers", color: "#1488eeff" },
    { icon: "bi-person-check", value: "60", label: "Customers Contacted", color: "#1488eeff" },
    { icon: "bi-credit-card", value: "140", label: "Payments Completed", color: "#1488eeff" },
    { icon: "bi-clock-history", value: "50", label: "Pending Payments", color: "#1488eeff" }
  ];

  const weeklyCalls = [12, 15, 18, 20, 16, 22, 14]; // Mon - Sun
  
  const completedPayments = [
    { name: "Prashant Kumar Singh", date: "25/2/2025" },
    { name: "Prashant Kumar Singh", date: "25/2/2025" },
    { name: "Prashant Kumar Singh", date: "25/2/2025" },
    { name: "Prashant Kumar Singh", date: "25/2/2025" },
    { name: "Prashant Kumar Singh", date: "25/2/2025" }
  ];

  const handleRequestsClick = () => {
    setIsRequestsModalOpen(true);
  };

  const handleCloseRequests = () => {
    setIsRequestsModalOpen(false);
  };

  const handleShowCallerDetails = (caller) => {
    setSelectedCaller(caller);
    setIsCallerDetailsModalOpen(true);
  };

  const handleCloseCallerDetails = () => {
    setIsCallerDetailsModalOpen(false);
    setSelectedCaller(null);
  };

  /**
   * TESTING FLOW:
   * 1. In Admin Dashboard: Click "Send Test Request" button
   * 2. Request is stored in localStorage with status "PENDING"
   * 3. Switch to Caller Dashboard (CallerDashboard)
   * 4. Envelope icon will show badge with "1" notification
   * 5. Click envelope icon to open AdminRequestsModal
   * 6. Click "Accept" or "Decline" button
   * 7. Response is stored in localStorage
   * 8. Switch back to Admin Dashboard
   * 9. Within 5 seconds, status will auto-update to "ACCEPTED" or "DECLINED"
   * 10. Click envelope icon in Admin Dashboard to see updated status
   */
  
  // Function to send request to caller (for testing)
  const handleSendRequestToCaller = (callerName, callerId, customers) => {
    const newRequestId = Date.now();
    const today = new Date();
    const todayString = `${String(today.getDate()).padStart(2, '0')}/${String(today.getMonth() + 1).padStart(2, '0')}/${today.getFullYear()}`;
    
    const newRequest = {
      id: newRequestId,
      callerName: callerName,
      callerId: callerId,
      customersSent: customers.length,
      sentDate: todayString,
      status: "PENDING",
      respondedDate: null,
      customers: customers
    };
    
    // Add to sent requests
    setSentRequests(prev => [...prev, newRequest]);
    
    // Store in localStorage for caller to receive
    const requestData = {
      requestId: newRequestId,
      callerName: callerName,
      callerId: callerId,
      customers: customers.map((customer, index) => ({
        id: index + 1,
        accountNumber: customer.accountNumber,
        name: customer.name,
        contactNumber: customer.contactNumber || "N/A",
        amountOverdue: customer.amountOverdue,
        daysOverdue: customer.daysOverdue,
        date: todayString,
        sentBy: "Admin",
        sentDate: todayString
      })),
      sentDate: todayString
    };
    
    localStorage.setItem('pendingAdminRequest', JSON.stringify(requestData));
    
    console.log('✅ Request sent to caller:', callerName);
    console.log('📦 Request data stored in localStorage:', requestData);
    console.log('🔍 Verify localStorage:', localStorage.getItem('pendingAdminRequest'));
    
    alert(`Request sent to ${callerName}!\n\nSwitch to Caller Dashboard to see the request.`);
  };

  return (
    <>
    <div className="admin-dashboard">
      <div className="admin-dashboard-header">
        <h1>Admin Dashboard</h1>
      </div>

      <div className="admin-dashboard-layout">
        <div className="admin-dashboard-main">
          {/* Stats Cards */}
          <div className="admin-stats-grid">
            {stats.map((stat, index) => (
              <div key={index} className="admin-stat-card">
                <div className="admin-stat-icon" style={{ backgroundColor: stat.color }}>
                  <i className={stat.icon}></i>
                </div>
                <div className="admin-stat-details">
                  <h3>{stat.value}</h3>
                  <p>{stat.label}</p>
                </div>
                <button className="admin-stat-menu">
                  <i className="bi bi-three-dots-vertical"></i>
                </button>
              </div>
            ))}
          </div>

          {/* Assigned Callers Table */}
          <div className="admin-assigned-callers-section">
            <div className="admin-section-header">
              <h3>Assigned Callers</h3>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <button 
                  onClick={() => handleSendRequestToCaller(
                    "Test Caller", 
                    "9999", 
                    [
                      { accountNumber: "1001234585", name: "Test Customer 1", amountOverdue: "Rs.5000", daysOverdue: "20", contactNumber: "077-1111111" },
                      { accountNumber: "1001234586", name: "Test Customer 2", amountOverdue: "Rs.3000", daysOverdue: "15", contactNumber: "077-2222222" }
                    ]
                  )}
                  style={{
                    padding: '6px 12px',
                    background: '#1488ee',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: '600'
                  }}
                >
                  Send Test Request
                </button>
                <a href="#" className="admin-see-all">See All</a>
              </div>
            </div>
            <table className="admin-callers-table">
              <thead>
                <tr>
                  <th>CALLER NAME & ID</th>
                  <th>TASK</th>
                  <th>CUSTOMERS CONTACTED</th>
                  <th>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {assignedCallers.map((caller) => (
                  <tr key={caller.id}>
                    <td>
                      <div className="admin-caller-info">
                        <strong>{caller.name}</strong>
                        <span className="admin-caller-id">{caller.callerId}</span>
                      </div>
                    </td>
                    <td>
                      <span className={`admin-status-badge ${caller.task.toLowerCase()}`}>
                        {caller.task}
                      </span>
                    </td>
                    <td>{caller.customersContacted}</td>
                    <td>
                      <button 
                        className="admin-action-button" 
                        onClick={() => handleShowCallerDetails(caller)}
                      >
                        SHOW DETAILS
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Unassigned Callers Table */}
          <div className="admin-unassigned-callers-section">
            <div className="admin-section-header">
              <h3>Unassigned Callers</h3>
              <a href="#" className="admin-see-all">See All</a>
            </div>
            <table className="admin-callers-table">
              <thead>
                <tr>
                  <th>CUSTOMER NAME & OVERDUE PAYMENT DATE</th>
                  <th>PAYMENT STATUS</th>
                  <th>LATEST WORK</th>
                  <th>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {unassignedCallers.map((caller) => (
                  <tr key={caller.id}>
                    <td>
                      <div className="admin-caller-info">
                        <strong>{caller.name}</strong>
                        <span className="admin-caller-date">{caller.date}</span>
                      </div>
                    </td>
                    <td>
                      <span className="admin-status-badge available">
                        {caller.status}
                      </span>
                    </td>
                    <td>{caller.latestWork}</td>
                    <td>
                      <button className="admin-action-button assign">ASSIGN WORK</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Sent Requests Table */}
          <div className="admin-sent-requests-section">
            <div className="admin-section-header">
              <h3>Sent Requests Status</h3>
              <a href="#" className="admin-see-all">See All</a>
            </div>
            <table className="admin-callers-table">
              <thead>
                <tr>
                  <th>CALLER NAME & ID</th>
                  <th>CUSTOMERS SENT</th>
                  <th>SENT DATE</th>
                  <th>STATUS</th>
                  <th>RESPONDED</th>
                </tr>
              </thead>
              <tbody>
                {sentRequests.map((request) => (
                  <tr key={request.id}>
                    <td>
                      <div className="admin-caller-info">
                        <strong>{request.callerName}</strong>
                        <span className="admin-caller-id">{request.callerId}</span>
                      </div>
                    </td>
                    <td>{request.customersSent} customers</td>
                    <td>{request.sentDate}</td>
                    <td>
                      <span className={`admin-status-badge ${request.status.toLowerCase()}`}>
                        {request.status}
                      </span>
                    </td>
                    <td>
                      {request.status === "PENDING" ? (
                        <span style={{ color: "#999", fontSize: "13px" }}>Waiting for response...</span>
                      ) : (
                        <div className="admin-response-info">
                          <span style={{ fontSize: "13px", color: "#333" }}>{request.respondedDate}</span>
                          {request.reason && (
                            <span style={{ fontSize: "12px", color: "#666", display: "block", marginTop: "4px" }}>
                              Reason: {request.reason}
                            </span>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="admin-dashboard-sidebar">
          <div className="admin-user-profile-section">
            <div className="admin-profile-header">
              <h4>Your Profile</h4>
              <button className="admin-menu-btn">
                <i className="bi bi-three-dots-vertical"></i>
              </button>
            </div>
            
            <div className="admin-profile-content">
              <div className="admin-profile-avatar">
                <img src="https://via.placeholder.com/80" alt="Admin" />
              </div>
              <h3>Good Morning, (Admin)</h3>
              
              <div className="admin-profile-actions">
                <button className="admin-icon-btn">
                  <i className="bi bi-bell"></i>
                </button>
                <button className="admin-icon-btn" onClick={handleRequestsClick}>
                  <i className="bi bi-envelope"></i>
                  {pendingRequestsCount > 0 && (
                    <span className="admin-notification-badge">{pendingRequestsCount}</span>
                  )}
                </button>
                <button className="admin-icon-btn">
                  <i className="bi bi-calendar"></i>
                  <span className="admin-notification-badge">1</span>
                </button>
              </div>
            </div>

            {/* Weekly Calls Chart */}
            <div className="admin-weekly-calls-section">
              <h4>Weekly Calls</h4>
              <div className="admin-calls-chart">
                {weeklyCalls.map((call, index) => {
                  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
                  const maxCalls = Math.max(...weeklyCalls, 1);
                  const heightPercentage = (call / maxCalls) * 100;
                  return (
                    <div key={index} className="admin-call-bar" title={`${days[index]}: ${call} calls`}>
                      <div 
                        className="admin-bar" 
                        style={{ height: `${heightPercentage}%` }}
                      ></div>
                      <span className="admin-day-label">{days[index]}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Completed Payments */}
            <div className="admin-completed-payments-section">
              <div className="admin-section-header">
                <h4>Completed Payments</h4>
                <button className="admin-add-btn">
                  <i className="bi bi-plus-circle"></i>
                </button>
              </div>
              <div className="admin-payments-list">
                {completedPayments.map((payment, index) => (
                  <div key={index} className="admin-payment-item">
                    <div className="admin-payment-info">
                      <strong>{payment.name}</strong>
                      <span className="admin-payment-date">{payment.date}</span>
                    </div>
                    <span className="admin-payment-badge">Paid</span>
                  </div>
                ))}
              </div>
              <button className="admin-see-all-btn">See All</button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <AdminSentRequestsModal
      isOpen={isRequestsModalOpen}
      onClose={handleCloseRequests}
      sentRequests={sentRequests}
    />

    <CallerDetailsModal
      isOpen={isCallerDetailsModalOpen}
      onClose={handleCloseCallerDetails}
      caller={selectedCaller}
    />
    </>
  );
}

export default AdminDashboard;
