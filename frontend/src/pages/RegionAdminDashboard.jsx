import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import './SuperAdminDashboard.css'; // Reuse SuperAdmin styles
import { secureFetch } from '../utils/api';
import { getRtomsForRegion } from '../config/regionConfig';

function RegionAdminDashboard() {
  const [rtomAdmins, setRtomAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState(null);
  const [currentRegion, setCurrentRegion] = useState('');
  const [formData, setFormData] = useState({
    adminId: '',
    name: '',
    email: '',
    phone: '',
    password: '',
    rtom: ''
  });
  const [availableRtoms, setAvailableRtoms] = useState([]);

  // Fetch user profile to get full info (PII) securely after login
  const fetchUserProfile = async () => {
    try {
      const res = await secureFetch('/api/me');
      const data = await res.json();
      if (res.ok && data.user) {
        localStorage.setItem('userData', JSON.stringify(data.user));
      }
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
    }
  };

  useEffect(() => {
    fetchUserProfile();
    // Get current user's region
    const userData = JSON.parse(localStorage.getItem('userData') || '{}');
    if (userData.region) {
      setCurrentRegion(userData.region);
      setAvailableRtoms(getRtomsForRegion(userData.region));
    }
    fetchRtomAdmins();
  }, []);

  const fetchRtomAdmins = async () => {
    try {
      const response = await secureFetch(`/api/region-admin/rtom-admins`);

      if (!response.ok) {
        throw new Error('Failed to fetch RTOM admins');
      }

      const result = await response.json();
      setRtomAdmins(result.data || []);
    } catch (error) {
      toast.error(error.message || 'Failed to load RTOM admins');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.adminId || !formData.name || !formData.email || !formData.rtom) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (!editingAdmin && !formData.password) {
      toast.error('Password is required for new RTOM admins');
      return;
    }

    try {
      const url = editingAdmin
        ? `/api/region-admin/rtom-admins/${editingAdmin.id}`
        : `/api/region-admin/rtom-admins`;

      const method = editingAdmin ? 'PUT' : 'POST';

      const payload = {
        ...formData,
        role: 'rtom_admin',
        region: currentRegion
      };

      const response = await secureFetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to save RTOM admin');
      }

      toast.success(result.message || 'RTOM admin saved successfully');
      setShowModal(false);
      resetForm();
      fetchRtomAdmins();
    } catch (error) {
      toast.error(error.message || 'Failed to save RTOM admin');
    }
  };

  const handleEdit = (admin) => {
    setEditingAdmin(admin);
    setFormData({
      adminId: admin.adminId,
      name: admin.name,
      email: admin.email,
      phone: admin.phone || '',
      password: '',
      rtom: admin.rtom || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (adminId) => {
    if (!window.confirm('Are you sure you want to delete this RTOM admin?')) {
      return;
    }

    try {
      const response = await secureFetch(`/api/region-admin/rtom-admins/${adminId}`, {
        method: 'DELETE'
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to delete RTOM admin');
      }

      toast.success(result.message || 'RTOM admin deleted successfully');
      fetchRtomAdmins();
    } catch (error) {
      toast.error(error.message || 'Failed to delete RTOM admin');
    }
  };

  const resetForm = () => {
    setFormData({
      adminId: '',
      name: '',
      email: '',
      phone: '',
      password: '',
      rtom: ''
    });
    setEditingAdmin(null);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    resetForm();
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="superadmin-dashboard">
      <div className="dashboard-header">
        <h1>RTOM Admin Management - {currentRegion} Region</h1>
        <button
          className="btn-primary"
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
        >
          + Add RTOM Admin
        </button>
      </div>

      <div className="admins-table-container">
        <table className="admins-table">
          <thead>
            <tr>
              <th>Admin ID</th>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>RTOM</th>
              <th>Region</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rtomAdmins.length === 0 ? (
              <tr>
                <td colSpan="8" className="no-data">No RTOM admins found in your region</td>
              </tr>
            ) : (
              rtomAdmins.map(admin => (
                <tr key={admin.id}>
                  <td>{admin.adminId}</td>
                  <td>{admin.name}</td>
                  <td>{admin.email}</td>
                  <td>{admin.phone || '-'}</td>
                  <td>{admin.rtom || '-'}</td>
                  <td>{admin.region || '-'}</td>
                  <td>
                    <span className={`status-badge ${admin.status === 'active' ? 'verified' : 'pending'}`}>
                      {admin.status || 'active'}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button
                        className="btn-edit"
                        onClick={() => handleEdit(admin)}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          marginRight: '10px',
                          color: '#4CAF50',
                          fontSize: '18px'
                        }}
                        title="Edit"
                      >
                        <i className="bi bi-pencil-square"></i>
                      </button>
                      <button
                        className="btn-delete"
                        onClick={() => handleDelete(admin.id)}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          color: '#f44336',
                          fontSize: '18px'
                        }}
                        title="Delete"
                      >
                        <i className="bi bi-trash-fill"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingAdmin ? 'Edit RTOM Admin' : 'Add New RTOM Admin'}</h2>
              <button className="close-btn" onClick={handleCloseModal}>×</button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Admin ID *</label>
                <input
                  type="text"
                  name="adminId"
                  value={formData.adminId}
                  onChange={handleInputChange}
                  disabled={editingAdmin}
                  required
                  placeholder="e.g., RTOM-COLOMBO"
                />
              </div>

              <div className="form-group">
                <label>Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  placeholder="e.g., Colombo RTOM Admin"
                />
              </div>

              <div className="form-group">
                <label>Email *</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  placeholder="e.g., admin.colombo@slt.lk"
                />
              </div>

              <div className="form-group">
                <label>Phone</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  pattern="0\d{9}"
                  maxLength="10"
                  placeholder="0XXXXXXXXX"
                />
              </div>

              <div className="form-group">
                <label>Password {!editingAdmin && '*'}</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  required={!editingAdmin}
                  placeholder={editingAdmin ? 'Leave blank to keep current' : ''}
                />
              </div>

              <div className="form-group">
                <label>RTOM *</label>
                <select
                  name="rtom"
                  value={formData.rtom}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Select RTOM</option>
                  {availableRtoms.map(rtom => (
                    <option key={rtom.code} value={rtom.code}>
                      {rtom.display}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Region (Auto-assigned)</label>
                <input
                  type="text"
                  value={currentRegion}
                  disabled
                  style={{ backgroundColor: '#f5f5f5', cursor: 'not-allowed' }}
                />
              </div>

              <div className="form-actions">
                <button type="button" className="btn-cancel" onClick={handleCloseModal}>
                  Cancel
                </button>
                <button type="submit" className="btn-submit">
                  {editingAdmin ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default RegionAdminDashboard;
