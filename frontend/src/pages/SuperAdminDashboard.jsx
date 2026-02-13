import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import './SuperAdminDashboard.css';
import { secureFetch } from '../utils/api';
import { ALL_REGIONS, getRtomsForRegion, ALL_RTOMS, getRegionForRtom } from '../config/regionConfig';

function SuperAdminDashboard() {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState(null);
  const [formData, setFormData] = useState({
    adminId: '',
    name: '',
    email: '',
    phone: '',
    password: '',
    role: 'admin',
    region: '',
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
    fetchAdmins();
  }, []);

  const fetchAdmins = async () => {
    try {
      const response = await secureFetch(`/api/superadmin/admins`);

      if (!response.ok) {
        throw new Error('Failed to fetch admins');
      }

      const result = await response.json();
      setAdmins(result.data || []);
    } catch (error) {
      toast.error('Failed to load admins');
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
    if (!formData.adminId || !formData.name || !formData.email || !formData.role) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (formData.role === 'region_admin' && !formData.region) {
      toast.error('Region is required for region admin role');
      return;
    }

    if ((formData.role === 'rtom_admin' || formData.role === 'supervisor') && !formData.rtom) {
      toast.error('RTOM is required for RTOM admin and supervisor roles');
      return;
    }

    if (!editingAdmin && !formData.password) {
      toast.error('Password is required for new admins');
      return;
    }

    try {
      const url = editingAdmin
        ? `/api/superadmin/admins/${editingAdmin._id}`
        : `/api/superadmin/admins`;

      const method = editingAdmin ? 'PUT' : 'POST';

      const response = await secureFetch(url, {
        method,
        body: JSON.stringify(formData)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to save admin');
      }

      toast.success(result.message);
      setShowModal(false);
      resetForm();
      fetchAdmins();
    } catch (error) {
      toast.error(error.message || 'Failed to save admin');
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
      role: admin.role,
      region: admin.region || '',
      rtom: admin.rtom || ''
    });

    // Set available RTOMs if region is selected
    if (admin.region) {
      setAvailableRtoms(getRtomsForRegion(admin.region));
    }

    setShowModal(true);
  };

  const handleDelete = async (adminId) => {
    if (!window.confirm('Are you sure you want to delete this admin?')) {
      return;
    }

    try {
      const response = await secureFetch(`/api/superadmin/admins/${adminId}`, {
        method: 'DELETE'
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to delete admin');
      }

      toast.success(result.message);
      fetchAdmins();
    } catch (error) {
      toast.error(error.message || 'Failed to delete admin');
    }
  };

  const resetForm = () => {
    setFormData({
      adminId: '',
      name: '',
      email: '',
      phone: '',
      password: '',
      role: 'admin',
      region: '',
      rtom: ''
    });
    setAvailableRtoms([]);
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
        <h1>Admin Management</h1>
        <button
          className="btn-primary"
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
        >
          + Add Admin
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
              <th>Role</th>
              <th>Region</th>
              <th>RTOM</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {admins.length === 0 ? (
              <tr>
                <td colSpan="8" className="no-data">No admins found</td>
              </tr>
            ) : (
              admins.map(admin => (
                <tr key={admin._id}>
                  <td>{admin.adminId}</td>
                  <td>{admin.name}</td>
                  <td>{admin.email}</td>
                  <td>{admin.phone || '-'}</td>
                  <td>
                    <span className={`role-badge role-${admin.role}`}>
                      {admin.role}
                    </span>
                  </td>
                  <td>{admin.region || '-'}</td>
                  <td>{admin.rtom || '-'}</td>
                  <td>
                    <span className={`status-badge ${admin.isVerified ? 'verified' : 'pending'}`}>
                      {admin.isVerified ? 'Verified' : 'Pending'}
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
                        onClick={() => handleDelete(admin._id)}
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
              <h2>{editingAdmin ? 'Edit Admin' : 'Add New Admin'}</h2>
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
                <label>Role *</label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={(e) => {
                    handleInputChange(e);
                    // Reset region/rtom when role changes
                    setFormData(prev => ({ ...prev, region: '', rtom: '' }));
                    setAvailableRtoms([]);
                  }}
                  required
                >
                  <option value="admin">Admin</option>
                  <option value="region_admin">Region Admin</option>
                  <option value="rtom_admin">RTOM Admin</option>
                  <option value="supervisor">Supervisor</option>
                  <option value="uploader">Uploader</option>
                </select>
              </div>

              {formData.role === 'region_admin' && (
                <div className="form-group">
                  <label>Region *</label>
                  <select
                    name="region"
                    value={formData.region}
                    onChange={(e) => {
                      handleInputChange(e);
                      setAvailableRtoms(getRtomsForRegion(e.target.value));
                      setFormData(prev => ({ ...prev, rtom: '' }));
                    }}
                    required
                  >
                    <option value="">Select Region</option>
                    {ALL_REGIONS.map(region => (
                      <option key={region} value={region}>{region}</option>
                    ))}
                  </select>
                </div>
              )}

              {(formData.role === 'rtom_admin' || formData.role === 'supervisor') && (
                <>
                  <div className="form-group">
                    <label>RTOM *</label>
                    <select
                      name="rtom"
                      value={formData.rtom}
                      onChange={(e) => {
                        handleInputChange(e);
                        // Auto-assign region based on RTOM selection
                        const selectedRtom = e.target.value;
                        const region = getRegionForRtom(selectedRtom);
                        if (region) {
                          setFormData(prev => ({ ...prev, region: region }));
                        }
                      }}
                      required
                    >
                      <option value="">Select RTOM</option>
                      {ALL_RTOMS.map(rtom => (
                        <option key={rtom.code} value={rtom.code}>
                          {rtom.display}
                        </option>
                      ))}
                    </select>
                  </div>

                  {formData.rtom && formData.region && (
                    <div className="form-group">
                      <label>Region (Auto-assigned)</label>
                      <input
                        type="text"
                        value={formData.region}
                        disabled
                        style={{ backgroundColor: '#f5f5f5', cursor: 'not-allowed' }}
                      />
                    </div>
                  )}
                </>
              )}

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

export default SuperAdminDashboard;
