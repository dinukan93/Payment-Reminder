import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./AdminDashboard.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import AdminSentRequestsModal from "../components/AdminSentRequestsModal";
import CallerDetailsModal from "../components/CallerDetailsModal";
import { secureFetch } from "../utils/api";
import { showSuccess } from "../components/Notifications";

function AdminDashboard() {
  const navigate = useNavigate();
  const [isRequestsModalOpen, setIsRequestsModalOpen] = useState(false);
  const [isCallerDetailsModalOpen, setIsCallerDetailsModalOpen] = useState(false);
  const [selectedCaller, setSelectedCaller] = useState(null);
  const [callerDetailsData, setCallerDetailsData] = useState(null);
  const [assignedCallers, setAssignedCallers] = useState([]);
  const [unassignedCallers, setUnassignedCallers] = useState([]);
  const [sentRequests, setSentRequests] = useState([]);
  const [stats, setStats] = useState([
    { icon: "bi-people", value: "0", label: "Total Customers", color: "#1488eeff" },
    { icon: "bi-telephone-outbound", value: "0", label: "Assigned Callers", color: "#1488eeff" },
    { icon: "bi-telephone-inbound", value: "0", label: "Unassigned Callers", color: "#1488eeff" },
    { icon: "bi-person-check", value: "0", label: "Customers Contacted", color: "#1488eeff" },
    { icon: "bi-credit-card", value: "0", label: "Payments Completed", color: "#1488eeff" },
    { icon: "bi-clock-history", value: "0", label: "Pending Payments", color: "#1488eeff" }
  ]);
  const [weeklyCalls, setWeeklyCalls] = useState([0, 0, 0, 0, 0, 0, 0]);
  const [completedPayments, setCompletedPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch all dashboard data on mount
  useEffect(() => {
    fetchDashboardData(true); // Initial load with loading screen

    // Refresh data every 30 seconds in background
    const interval = setInterval(() => fetchDashboardData(false), 30000);

    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async (showLoading = false) => {
    try {
      // Only show loading screen on initial load
      if (showLoading) {
        setLoading(true);
      }
      setError(null);

      // Fetch all data in parallel
      const [statsRes, assignedRes, weeklyRes, requestsRes] = await Promise.all([
        secureFetch(`/api/admin/dashboard-stats`),
        secureFetch(`/api/admin/assigned-callers`),
        secureFetch(`/api/admin/weekly-calls`),
        secureFetch(`/api/requests`)
      ]);

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats([
          { icon: "bi-people", value: (statsData.totalCustomers || 0).toString(), label: "Total Customers", color: "#1488eeff" },
          { icon: "bi-telephone-outbound", value: (statsData.assignedCallers || 0).toString(), label: "Assigned Callers", color: "#1488eeff" },
          { icon: "bi-telephone-inbound", value: (statsData.unassignedCallers || 0).toString(), label: "Unassigned Callers", color: "#1488eeff" },
          { icon: "bi-person-check", value: (statsData.customersContacted || 0).toString(), label: "Customers Contacted", color: "#1488eeff" },
          { icon: "bi-credit-card", value: (statsData.paymentsCompleted || 0).toString(), label: "Payments Completed", color: "#1488eeff" },
          { icon: "bi-clock-history", value: (statsData.pendingPayments || 0).toString(), label: "Pending Payments", color: "#1488eeff" }
        ]);
      }

      if (assignedRes.ok) {
        const assignedData = await assignedRes.json();
        const assignedArray = Array.isArray(assignedData) ? assignedData : (assignedData.data || []);
        setAssignedCallers(assignedArray.map(caller => ({
          id: caller._id || caller.callerId || Math.random().toString(),
          name: caller.name,
          callerId: caller.callerId,
          task: caller.taskStatus,
          customersContacted: caller.customersContacted
        })));
      }

      if (weeklyRes.ok) {
        const weeklyData = await weeklyRes.json();
        setWeeklyCalls(weeklyData.data || [0, 0, 0, 0, 0, 0, 0]);
      }

      if (requestsRes.ok) {
        const requestsData = await requestsRes.json();
        const requestsArray = Array.isArray(requestsData) ? requestsData : (requestsData.data || []);

        // Map backend fields to frontend format
        const mappedRequests = requestsArray.map(req => ({
          id: req.id,
          taskId: req.task_id,
          callerId: req.caller_id,
          callerName: req.caller_name,
          customersSent: req.customers_sent,
          sentDate: new Date(req.sent_date).toLocaleDateString(),
          status: req.status,
          respondedDate: req.responded_date ? new Date(req.responded_date).toLocaleDateString() : null,
          reason: req.reason,
          customers: req.customers || null,
          customer_ids: req.customer_ids || []
        }));

        setSentRequests(mappedRequests);
      }

      setLoading(false);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError('Failed to load dashboard data. Please check if the backend server is running.');
      setLoading(false);
    }
  };

  const pendingRequestsCount = sentRequests.filter(req => req.status === "PENDING").length;

  // Navigation handlers for stat cards
  const handleStatClick = (statLabel) => {
    switch (statLabel) {
      case "Total Customers":
        navigate('/customers');
        break;
      case "Assigned Callers":
      case "Unassigned Callers":
        navigate('/employees');
        break;
      case "Customers Contacted":
      case "Payments Completed":
      case "Pending Payments":
        navigate('/report');
        break;
      default:
        break;
    }
  };

  const handleRequestsClick = () => {
    setIsRequestsModalOpen(true);
  };

  const handleCloseRequests = () => {
    setIsRequestsModalOpen(false);
  };

  const handleRequestCancelled = (requestId) => {
    // Update the request status locally
    setSentRequests(prev =>
      prev.map(req =>
        req.id === requestId ? { ...req, status: 'CANCELLED' } : req
      )
    );
  };

  const handleShowCallerDetails = async (caller) => {
    try {
      setSelectedCaller(caller);
      setIsCallerDetailsModalOpen(true);

      // Fetch detailed caller information from backend
      const response = await secureFetch(`/api/admin/callers/${caller.id}/details`);
      if (response.ok) {
        const result = await response.json();
        setCallerDetailsData(result.data);
      } else {
        console.error('Failed to fetch caller details');
      }
    } catch (error) {
      console.error('Error fetching caller details:', error);
    }
  };

  const handleCloseCallerDetails = () => {
    setIsCallerDetailsModalOpen(false);
    setSelectedCaller(null);
    setCallerDetailsData(null);
  };



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

    console.log('Request sent to caller:', callerName);
    console.log('Request data stored in localStorage:', requestData);
    console.log('Verify localStorage:', localStorage.getItem('pendingAdminRequest'));

    showSuccess(`Request sent to ${callerName}! Switch to Caller Dashboard to see the request.`);
  };

  return (
    <>
      <div className="admin-dashboard">
        <div className="admin-dashboard-header">
          <h1>Supervisor Dashboard</h1>
        </div>

        {loading ? (
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
            <p>Loading dashboard...</p>
          </div>
        ) : error ? (
          <div style={{ textAlign: 'center', padding: '50px', fontSize: '18px', color: '#dc3545' }}>
            <i className="bi bi-exclamation-triangle" style={{ fontSize: '48px', display: 'block', marginBottom: '20px' }}></i>
            <p>{error}</p>
            <button
              onClick={() => fetchDashboardData(true)}
              style={{
                marginTop: '20px',
                padding: '10px 20px',
                background: '#1488eeff',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '16px'
              }}
            >
              <i className="bi bi-arrow-clockwise" style={{ marginRight: '8px' }}></i>
              Retry
            </button>
          </div>
        ) : (
          <div className="admin-dashboard-layout">
            <div className="admin-dashboard-main">
              {/* Stats Cards */}
              <div className="admin-stats-grid">
                {stats.map((stat, index) => (
                  <div
                    key={index}
                    className="admin-stat-card"
                    onClick={() => handleStatClick(stat.label)}
                    style={{ cursor: 'pointer' }}
                    title={`Click to view ${stat.label.toLowerCase()}`}
                  >
                    <div className="admin-stat-icon" style={{ backgroundColor: stat.color }}>
                      <i className={stat.icon}></i>
                    </div>
                    <div className="admin-stat-details">
                      <h3>{stat.value}</h3>
                      <p>{stat.label}</p>
                    </div>
                    <button
                      className="admin-stat-menu"
                      onClick={(e) => { e.stopPropagation(); fetchDashboardData(false); }}
                      title="Refresh this stat"
                    >
                      <i className="bi bi-arrow-clockwise"></i>
                    </button>
                  </div>
                ))}
              </div>

              {/* Assigned Callers Table */}
              <div className="admin-assigned-callers-section">
                <div className="admin-section-header">
                  <h3>Assigned Callers</h3>
                  <button className="admin-see-all" onClick={() => navigate('/employees')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#1488eeff', fontWeight: '500' }}>See All</button>
                </div>
                <div className="admin-table-scroll">
                  <table className="admin-callers-table">
                    <thead>
                      <tr>
                        <th>CALLER NAME & ID</th>
                        <th>TASK</th>
                        <th>TASK PROGRESS</th>
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
                            <span className="admin-task-id" style={{
                              fontFamily: 'monospace',
                              fontSize: '0.9em',
                              padding: '4px 8px',
                              backgroundColor: '#f0f0f0',
                              borderRadius: '4px',
                              color: '#333'
                            }}>
                              {caller.task || 'N/A'}
                            </span>
                          </td>
                          <td>
                            <span style={{ fontWeight: '600', color: '#2e7d32' }}>
                              {caller.customersContacted || '0/0'}
                            </span>
                          </td>
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
              </div>

              {/* Unassigned Callers Table */}
              <div className="admin-unassigned-callers-section">
                <div className="admin-section-header">
                  <h3>Unassigned Callers</h3>
                  <button className="admin-see-all" onClick={() => navigate('/employees')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#1488eeff', fontWeight: '500' }}>See All</button>
                </div>
                <div className="admin-table-scroll">
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
                              <strong>{caller.name || 'Unknown'}</strong>
                              <span className="admin-caller-date">{caller.date || 'N/A'}</span>
                            </div>
                          </td>
                          <td>
                            <span className="admin-status-badge available">
                              {caller.status || 'N/A'}
                            </span>
                          </td>
                          <td>{caller.latestWork || 'N/A'}</td>
                          <td>
                            <button className="admin-action-button assign" onClick={() => navigate('/admin/tasks')}>ASSIGN WORK</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Sent Requests Table */}
              <div className="admin-sent-requests-section">
                <div className="admin-section-header">
                  <h3>Sent Requests Status</h3>
                  <button className="admin-see-all" onClick={handleRequestsClick} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#1488eeff', fontWeight: '500' }}>See All</button>
                </div>
                <div className="admin-table-scroll">
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
                              <strong>{request.callerName || 'Unknown'}</strong>
                              <span className="admin-caller-id">{request.callerId || 'N/A'}</span>
                            </div>
                          </td>
                          <td>{request.customersSent || 0} customers</td>
                          <td>{request.sentDate || 'N/A'}</td>
                          <td>
                            <span className={`admin-status-badge ${(request.status || 'pending').toLowerCase()}`}>
                              {request.status || 'PENDING'}
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
            </div>

            {/* Right Sidebar */}
            <div className="admin-dashboard-sidebar">
              <div className="admin-user-profile-section">
                <div className="admin-profile-header">
                  <h4>Your Profile</h4>
                  <button className="admin-menu-btn" onClick={() => fetchDashboardData(false)} title="Refresh Dashboard">
                    <i className="bi bi-arrow-clockwise"></i>
                  </button>
                </div>

                <div className="admin-profile-content">
                  <div className="admin-profile-avatar">
                    <img
                      src={(() => {
                        const userData = JSON.parse(localStorage.getItem('userData') || '{}');
                        return userData.avatar || "https://ui-avatars.com/api/?name=" + encodeURIComponent(userData.name || "Admin") + "&background=1488ee&color=fff&size=80";
                      })()}
                      alt="Admin"
                    />
                  </div>
                  <h3>Good Morning, ({(() => {
                    const userData = JSON.parse(localStorage.getItem('userData') || '{}');
                    return userData.name || 'Admin';
                  })()})</h3>

                  <div className="admin-profile-actions">
                    <button className="admin-icon-btn" onClick={() => navigate('/settings')} title="Notifications">
                      <i className="bi bi-bell"></i>
                    </button>
                    <button className="admin-icon-btn" onClick={handleRequestsClick} title="View Requests">
                      <i className="bi bi-envelope"></i>
                      {pendingRequestsCount > 0 && (
                        <span className="admin-notification-badge">{pendingRequestsCount}</span>
                      )}
                    </button>
                    <button className="admin-icon-btn" onClick={() => navigate('/report')} title="Calendar & Reports">
                      <i className="bi bi-calendar"></i>
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
                    <button className="admin-add-btn" onClick={() => navigate('/customers')} title="View All Customers">
                      <i className="bi bi-eye"></i>
                    </button>
                  </div>
                  <div className="admin-payments-list">
                    {completedPayments.map((payment) => (
                      <div key={payment.id} className="admin-payment-item">
                        <div className="admin-payment-info">
                          <strong>{payment.name}</strong>
                          <span className="admin-payment-date">{payment.date}</span>
                        </div>
                        <span className="admin-payment-badge">Paid</span>
                      </div>
                    ))}
                  </div>
                  <button className="admin-see-all-btn" onClick={() => navigate('/report')}>See All Payments</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <AdminSentRequestsModal
        isOpen={isRequestsModalOpen}
        onClose={handleCloseRequests}
        sentRequests={sentRequests}
        onRequestCancelled={handleRequestCancelled}
      />

      <CallerDetailsModal
        isOpen={isCallerDetailsModalOpen}
        onClose={handleCloseCallerDetails}
        caller={selectedCaller}
        callerData={callerDetailsData}
      />
    </>
  );
}

export default AdminDashboard;
