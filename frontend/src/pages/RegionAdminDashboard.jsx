import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./AdminDashboard.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import API_BASE_URL from "../config/api";
import RtomAdminModal from "../components/RtomAdminModal";
import { showSuccess, showError } from "../components/Notifications";

export default function RegionAdminDashboard() {
  const [rtomAdmins, setRtomAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState(null);

  const navigate = useNavigate();

  const fetchDashboardData = async (showLoading = true) => {
    if (showLoading) {
      setLoading(true);
    }
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/region-admin/rtom-admins`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });
      const data = await response.json();
      if (data.success) {
        setRtomAdmins(data.data);
      } else {
        setError(data.message || 'Failed to fetch RTOM Admins');
      }
    } catch (err) {
      setError('Error fetching RTOM Admins');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleAddAdmin = () => {
    setSelectedAdmin(null);
    setIsModalOpen(true);
  };

  const handleEditAdmin = (admin) => {
    setSelectedAdmin(admin);
    setIsModalOpen(true);
  };

  const handleDeleteAdmin = async (admin) => {
    if (!window.confirm(`Are you sure you want to delete ${admin.name}?`)) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/region-admin/rtom-admins/${admin.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (data.success) {
        showSuccess(data.message || 'RTOM admin deleted successfully');
        fetchDashboardData(false);
      } else {
        showError(data.message || 'Failed to delete RTOM admin');
      }
    } catch (err) {
      showError('Network error. Please try again.');
      console.error('Error:', err);
    }
  };

  const handleToggleStatus = async (admin) => {
    const newStatus = admin.status === 'active' ? 'inactive' : 'active';
    const action = newStatus === 'active' ? 'enable' : 'disable';

    if (!window.confirm(`Are you sure you want to ${action} ${admin.name}?`)) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/region-admin/rtom-admins/${admin.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });

      const data = await response.json();

      if (data.success) {
        showSuccess(`RTOM admin ${action}d successfully`);
        fetchDashboardData(false);
      } else {
        showError(data.message || `Failed to ${action} RTOM admin`);
      }
    } catch (err) {
      showError('Network error. Please try again.');
      console.error('Error:', err);
    }
  };

  const handleModalSuccess = (message) => {
    showSuccess(message);
    fetchDashboardData(false);
  };

  return (
    <div className="admin-dashboard">
      <div className="admin-dashboard-header">
        <h1>Region Admin Dashboard</h1>
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
          <p>Loading...</p>
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
        <div style={{ padding: '20px' }}>
          {/* RTOM Admins Table */}
          <div className="admin-assigned-callers-section">
            <div className="admin-section-header">
              <h3>RTOM Admins in Your Region</h3>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  className="admin-action-button"
                  onClick={handleAddAdmin}
                  style={{ background: '#1488eeff', color: 'white', padding: '8px 16px' }}
                >
                  <i className="bi bi-plus-lg" style={{ marginRight: '5px' }}></i>
                  Add RTOM Admin
                </button>
                <button className="admin-see-all" onClick={() => fetchDashboardData(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#1488eeff', fontWeight: '500' }}>
                  <i className="bi bi-arrow-clockwise" style={{ marginRight: '5px' }}></i>
                  Refresh
                </button>
              </div>
            </div>
            <div className="admin-table-scroll">
              <table className="admin-callers-table">
                <thead>
                  <tr>
                    <th>ADMIN ID</th>
                    <th>NAME & EMAIL</th>
                    <th>PHONE</th>
                    <th>RTOM</th>
                    <th>STATUS</th>
                    <th>CALLERS</th>
                    <th>CUSTOMERS CONTACTED</th>
                    <th>CREATED AT</th>
                    <th>ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {rtomAdmins.length === 0 ? (
                    <tr>
                      <td colSpan="9" style={{ textAlign: 'center', padding: '20px', color: '#999' }}>
                        No RTOM Admins found for your region.
                      </td>
                    </tr>
                  ) : (
                    rtomAdmins.map((admin) => (
                      <tr key={admin.id}>
                        <td>
                          <span style={{
                            fontFamily: 'monospace',
                            fontSize: '0.9em',
                            padding: '4px 8px',
                            backgroundColor: '#f0f0f0',
                            borderRadius: '4px',
                            color: '#333'
                          }}>
                            {admin.adminId}
                          </span>
                        </td>
                        <td>
                          <div className="admin-caller-info">
                            <strong>{admin.name}</strong>
                            <span className="admin-caller-id">{admin.email}</span>
                          </div>
                        </td>
                        <td>
                          <span style={{ fontSize: '13px', color: '#666' }}>
                            {admin.phone || 'N/A'}
                          </span>
                        </td>
                        <td>
                          <span style={{
                            fontFamily: 'monospace',
                            fontSize: '0.9em',
                            padding: '4px 8px',
                            backgroundColor: '#e3f2fd',
                            borderRadius: '4px',
                            color: '#1976d2',
                            fontWeight: '600'
                          }}>
                            {admin.rtom}
                          </span>
                        </td>
                        <td>
                          <span style={{
                            padding: '4px 8px',
                            borderRadius: '4px',
                            fontSize: '0.85em',
                            fontWeight: '600',
                            backgroundColor: admin.status === 'active' ? '#d4edda' : '#f8d7da',
                            color: admin.status === 'active' ? '#155724' : '#721c24'
                          }}>
                            {admin.status === 'active' ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td>
                          <span style={{ fontWeight: '600', color: '#1488eeff' }}>
                            {admin.callers_count || 0}
                          </span>
                        </td>
                        <td>
                          <span style={{ fontWeight: '600', color: '#2e7d32' }}>
                            {admin.customers_contacted || 0}
                          </span>
                        </td>
                        <td>
                          <span style={{ fontSize: '13px', color: '#666' }}>
                            {admin.created_at ? new Date(admin.created_at).toLocaleDateString() : 'N/A'}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                              className="admin-action-button"
                              onClick={() => handleToggleStatus(admin)}
                              style={{
                                padding: '6px 12px',
                                fontSize: '11px',
                                background: admin.status === 'active' ? '#ffc107' : '#28a745',
                                color: 'white'
                              }}
                              title={admin.status === 'active' ? 'Disable RTOM Admin' : 'Enable RTOM Admin'}
                            >
                              <i className={admin.status === 'active' ? 'bi bi-pause-circle' : 'bi bi-play-circle'}></i>
                            </button>
                            <button
                              className="admin-action-button"
                              onClick={() => handleEditAdmin(admin)}
                              style={{ padding: '6px 12px', fontSize: '11px' }}
                              title="Edit RTOM Admin"
                            >
                              <i className="bi bi-pencil"></i>
                            </button>
                            <button
                              className="admin-action-button"
                              onClick={() => handleDeleteAdmin(admin)}
                              style={{ padding: '6px 12px', fontSize: '11px', background: '#fee', color: '#c00' }}
                              title="Delete RTOM Admin"
                            >
                              <i className="bi bi-trash"></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* RTOM Admin Modal */}
      <RtomAdminModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        admin={selectedAdmin}
        onSuccess={handleModalSuccess}
      />
    </div>
  );
}
