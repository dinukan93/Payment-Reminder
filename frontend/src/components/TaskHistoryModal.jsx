import React, { useState, useEffect } from 'react';
import './TaskHistoryModal.css';
import API_BASE_URL from '../config/api';

function TaskHistoryModal({ show, caller, onClose }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (show && caller) {
      fetchTaskHistory();
    }
  }, [show, caller]);

  const fetchTaskHistory = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/requests/caller/${caller.callerId}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch task history');
      }

      const result = await response.json();
      setTasks(Array.isArray(result.data) ? result.data : result.data?.data || []);
    } catch (err) {
      setError(err.message || 'Error fetching task history');
      console.error('Error fetching task history:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadgeClass = (status) => {
    const statusMap = {
      'PENDING': 'badge-pending',
      'ACCEPTED': 'badge-accepted',
      'COMPLETED': 'badge-completed',
      'DECLINED': 'badge-declined'
    };
    return statusMap[status] || 'badge-pending';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    // Try ISO or Date object first
    let date = new Date(dateString);
    if (!isNaN(date.getTime())) {
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
    // Try DD/MM/YYYY fallback
    const parts = dateString.split(/[\/\-]/);
    if (parts.length >= 3) {
      // DD/MM/YYYY or DD-MM-YYYY
      const [dd, mm, yyyy] = parts;
      const parsed = new Date(`${yyyy}-${mm}-${dd}`);
      if (!isNaN(parsed.getTime())) {
        return parsed.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        });
      }
    }
    // Fallback: show as-is
    return dateString;
  };

  if (!show) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content task-history-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2>Task History</h2>
            <p className="employee-name">{caller?.name}</p>
          </div>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>

        <div className="task-history-content">
          {loading ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Loading task history...</p>
            </div>
          ) : error ? (
            <div className="error-state">
              <p>{error}</p>
              <button onClick={fetchTaskHistory} className="btn-retry">
                Retry
              </button>
            </div>
          ) : tasks.length === 0 ? (
            <div className="empty-state">
              <i className="bi bi-inbox"></i>
              <p>No tasks found</p>
            </div>
          ) : (
            <div className="tasks-list">
              {tasks.map(task => (
                <div key={task._id} className="task-card">
                  <div className="task-header">
                    <div className="task-info">
                      <h4>Task ID: {task.taskId}</h4>
                      <span className={`status-badge ${getStatusBadgeClass(task.status)}`}>
                        {task.status}
                      </span>
                    </div>
                    <div className="task-dates">
                      <div className="date-item">
                        <small>Sent</small>
                        <span>{formatDate(task.sentDate)}</span>
                      </div>
                      {task.respondedDate && (
                        <div className="date-item">
                          <small>Responded</small>
                          <span>{formatDate(task.respondedDate)}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="task-details">
                    <div className="detail-row">
                      <span className="detail-label">Customers Sent:</span>
                      <span className="detail-value">{task.customersSent}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Customers Contacted:</span>
                      <span className="detail-value">{task.customersContacted}</span>
                    </div>
                    {task.reason && (
                      <div className="detail-row">
                        <span className="detail-label">Reason:</span>
                        <span className="detail-value">{task.reason}</span>
                      </div>
                    )}
                    {task.declineReason && (
                      <div className="detail-row">
                        <span className="detail-label">Decline Reason:</span>
                        <span className="detail-value">{task.declineReason}</span>
                      </div>
                    )}
                  </div>

                  {task.customers && task.customers.length > 0 && (
                    <div className="task-customers">
                      <h5>Customers Assigned ({task.customers.length})</h5>
                      <div className="customers-grid">
                        {task.customers.map((customer, idx) => (
                          <div key={idx} className="customer-item">
                            <div className="customer-name">{customer.name}</div>
                            <div className="customer-details">
                              <div>Account: {customer.accountNumber}</div>
                              <div>Contact: {customer.contactNumber}</div>
                              {customer.amountOverdue && (
                                <div>Overdue: {customer.amountOverdue}</div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn-close" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}

export default TaskHistoryModal;
