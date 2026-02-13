import React, { useState, useEffect } from "react";
import "./UserProfile.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import PaymentCalendar from "./PaymentCalendar";
import AdminRequestsModal from "./AdminRequestsModal";
import API_BASE_URL from "../config/api";
import { secureFetch } from "../utils/api";
import logger from "../utils/logger";

function UserProfile({ user, promisedPayments = [], onAcceptRequest }) {
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [isRequestsModalOpen, setIsRequestsModalOpen] = useState(false);
  const [todayPaymentsCount, setTodayPaymentsCount] = useState(0);
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);

  // Check for pending requests from MongoDB
  useEffect(() => {
    const checkPendingRequests = async () => {
      try {
        const userData = JSON.parse(localStorage.getItem('userData') || '{}');
        const callerId = userData.id;


        if (!callerId) return;

        const response = await secureFetch(`/api/requests?callerId=${callerId}&status=PENDING`);

        if (response.ok) {
          const data = await response.json();
          // Handle both flat array and nested data.data format
          const requestsArray = Array.isArray(data) ? data : (data.data || []);
          const count = requestsArray.length;
          logger.info('Checking pending requests from MySQL... Found:', count);
          setPendingRequestsCount(count);
        }
      } catch (error) {
        logger.error('Error fetching pending requests:', error);
      }
    };

    checkPendingRequests();

    // Check every 10 seconds for new requests
    const interval = setInterval(checkPendingRequests, 10000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Calculate today's promised payments
    const today = new Date();
    const todayString = formatDate(today);
    const count = promisedPayments.filter(
      (payment) => payment.promisedDate === todayString
    ).length;
    setTodayPaymentsCount(count);
  }, [promisedPayments]);

  const formatDate = (date) => {
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const handleCalendarClick = () => {
    setIsCalendarOpen(true);
  };

  const handleCloseCalendar = () => {
    setIsCalendarOpen(false);
  };

  const handleRequestsClick = () => {
    setIsRequestsModalOpen(true);
  };

  const handleCloseRequests = () => {
    setIsRequestsModalOpen(false);
  };

  const handleAcceptRequest = () => {
    // Notify parent component (CallerDashboard) to refetch customers from database
    if (onAcceptRequest) {
      onAcceptRequest();
    }

  };

  const handleDeclineRequest = () => {

    // No need to refetch since nothing was added
  };

  const handleRequestProcessed = () => {
    // When all customers in a request are processed (accepted/declined), decrease count
    setPendingRequestsCount(prev => Math.max(0, prev - 1));
    setIsRequestsModalOpen(false);
  };

  return (
    <>
      <div className="user-profile-section">
        <div className="profile-header">
          <span>Your Profile</span>
          <i className="bi bi-three-dots-vertical"></i>
        </div>

        <div className="profile-card">
          <div className="profile-avatar">
            {user.avatar ? (
              <img src={user.avatar} alt={user.name} />
            ) : (
              <div className="avatar-placeholder-circle">
                {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
            )}
          </div>
          <p className="profile-greeting">Good Morning, ({user.name})</p>

          <div className="profile-actions">
            <button className="profile-action-btn">
              <i className="bi bi-bell"></i>
            </button>
            <button
              className="profile-action-btn requests-btn"
              onClick={handleRequestsClick}
            >
              <i className="bi bi-envelope"></i>
              {pendingRequestsCount > 0 && (
                <span className="notification-badge">{pendingRequestsCount}</span>
              )}
            </button>
            <button
              className="profile-action-btn calendar-btn"
              onClick={handleCalendarClick}
            >
              <i className="bi bi-calendar"></i>
              {todayPaymentsCount > 0 && (
                <span className="notification-badge">{todayPaymentsCount}</span>
              )}
            </button>
          </div>
        </div>

        <div className="weekly-calls-section">
          <h4>Weekly Calls</h4>
          <div className="calls-chart">
            {user.weeklyCalls.map((call, index) => {
              const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
              const maxCalls = Math.max(...user.weeklyCalls, 1); // Minimum 1 to avoid division by 0
              const heightPercentage = maxCalls > 0 ? (call / maxCalls) * 100 : 0;
              return (
                <div key={index} className="call-bar" title={`${days[index]}: ${call} call${call !== 1 ? 's' : ''}`}>
                  <div
                    className="bar"
                    style={{ height: `${heightPercentage}%` }}
                  ></div>
                  <span className="day-label">{days[index]}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="completed-payments-section">
          <div className="section-header">
            <h4>Completed Payments</h4>
            <button className="expand-btn">
              <i className="bi bi-plus-circle"></i>
            </button>
          </div>

          <div className="payments-list">
            {user.completedPayments && user.completedPayments.length > 0 ? (
              user.completedPayments.map((payment, index) => (
                <div key={index} className="payment-item">
                  <div className="payment-info">
                    <strong>{payment.name}</strong>
                    <span className="payment-id">Account Number: {payment.accountNumber}</span>
                    <span className="payment-date">{payment.date}</span>
                  </div>
                  <span className="payment-badge">Paid</span>
                </div>
              ))
            ) : (
              <div className="no-payments-message">
                <p>No completed payments yet</p>
              </div>
            )}
          </div>

          <button className="see-all-btn">See All</button>
        </div>
      </div>

      <PaymentCalendar
        isOpen={isCalendarOpen}
        onClose={handleCloseCalendar}
        promisedPayments={promisedPayments}
      />

      <AdminRequestsModal
        isOpen={isRequestsModalOpen}
        onClose={handleCloseRequests}
        onAccept={handleAcceptRequest}
        onDecline={handleDeclineRequest}
        onRequestProcessed={handleRequestProcessed}
        callerId={JSON.parse(localStorage.getItem('userData') || '{}').id}
      />
    </>
  );
}

export default UserProfile;
