import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import './SuperAdminDashboard.css'; // Reuse SuperAdmin styles
import { secureFetch } from '../utils/api';

function RTOMAdminDashboard() {
  const [supervisors, setSupervisors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingSupervisor, setEditingSupervisor] = useState(null);
  const [currentRtom, setCurrentRtom] = useState('');
  const [currentRegion, setCurrentRegion] = useState('');
  const [formData, setFormData] = useState({
    adminId: '',
    name: '',
    email: '',
    phone: '',
    password: ''
  });

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
    // Get current user's RTOM and region
    const userData = JSON.parse(localStorage.getItem('userData') || '{}');
    if (userData.rtom) {
      setCurrentRtom(userData.rtom);
    }
    if (userData.region) {
      setCurrentRegion(userData.region);
    }
    fetchSupervisors();
  }, []);

  const fetchSupervisors = async () => {
    try {
      const response = await secureFetch(`/api/rtom-admin/supervisors`);

      if (!response.ok) {
        throw new Error('Failed to fetch supervisors');
      }

      const result = await response.json();
      setSupervisors(result.data || []);
    } catch (error) {
      toast.error(error.message || 'Failed to load supervisors');
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
    if (!formData.adminId || !formData.name || !formData.email) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (!editingSupervisor && !formData.password) {
      toast.error('Password is required for new supervisors');
      return;
    }

    try {
      const url = editingSupervisor
        ? `/api/rtom-admin/supervisors/${editingSupervisor.id}`
        : `/api/rtom-admin/supervisors`;

      const method = editingSupervisor ? 'PUT' : 'POST';

      const payload = {
        ...formData,
        role: 'supervisor',
        rtom: currentRtom,
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
        throw new Error(result.message || 'Failed to save supervisor');
      }

      toast.success(result.message || 'Supervisor saved successfully');
      setShowModal(false);
      resetForm();
      fetchSupervisors();
    } catch (error) {
      toast.error(error.message || 'Failed to save supervisor');
    }
  };

  const handleEdit = (supervisor) => {
    setEditingSupervisor(supervisor);
    setFormData({
      adminId: supervisor.adminId,
      name: supervisor.name,
      email: supervisor.email,
      phone: supervisor.phone || '',
      password: ''
    });
    setShowModal(true);
  };

  const handleDelete = async (supervisorId) => {
    if (!window.confirm('Are you sure you want to delete this supervisor?')) {
      return;
    }

    try {
      const response = await secureFetch(`/api/rtom-admin/supervisors/${supervisorId}`, {
        method: 'DELETE'
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to delete supervisor');
      }

      toast.success(result.message || 'Supervisor deleted successfully');
      fetchSupervisors();
    } catch (error) {
      toast.error(error.message || 'Failed to delete supervisor');
    }
  };

  const resetForm = () => {
    setFormData({
      adminId: '',
      name: '',
      email: '',
      phone: '',
      password: ''
    });
    setEditingSupervisor(null);
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
        <h1>Supervisor Management - {currentRtom} RTOM ({currentRegion} Region)</h1>
        <button
          className="btn-primary"
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
        >
          + Add Supervisor
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
            {supervisors.length === 0 ? (
              <tr>
                <td colSpan="8" className="no-data">No supervisors found in your RTOM</td>
              </tr>
            ) : (
              supervisors.map(supervisor => (
                <tr key={supervisor.id}>
                  <td>{supervisor.adminId}</td>
                  <td>{supervisor.name}</td>
                  <td>{supervisor.email}</td>
                  <td>{supervisor.phone || '-'}</td>
                  <td>{supervisor.rtom || '-'}</td>
                  <td>{supervisor.region || '-'}</td>
                  <td>
                    <span className={`status-badge ${supervisor.status === 'active' ? 'verified' : 'pending'}`}>
                      {supervisor.status || 'active'}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button
                        className="btn-edit"
                        onClick={() => handleEdit(supervisor)}
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
                        onClick={() => handleDelete(supervisor.id)}
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
              <h2>{editingSupervisor ? 'Edit Supervisor' : 'Add New Supervisor'}</h2>
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
                  disabled={editingSupervisor}
                  required
                  placeholder="e.g., SUP-COLOMBO-001"
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
                  placeholder="e.g., John Supervisor"
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
                  placeholder="e.g., supervisor@slt.lk"
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
                <label>Password {!editingSupervisor && '*'}</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  required={!editingSupervisor}
                  placeholder={editingSupervisor ? 'Leave blank to keep current' : ''}
                />
              </div>

              <div className="form-group">
                <label>RTOM (Auto-assigned)</label>
                <input
                  type="text"
                  value={currentRtom}
                  disabled
                  style={{ backgroundColor: '#f5f5f5', cursor: 'not-allowed' }}
                />
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
                  {editingSupervisor ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default RTOMAdminDashboard;
