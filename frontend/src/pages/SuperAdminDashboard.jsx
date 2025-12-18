import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import './SuperAdminDashboard.css';
import { API_BASE_URL } from '../config/api';

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
    rtom: ''
  });

  useEffect(() => {
    fetchAdmins();
  }, []);

  const fetchAdmins = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/superadmin/admins`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch admins');
      }

      const result = await response.json();
      setAdmins(result.data || []);
    } catch (error) {
      console.error('Error fetching admins:', error);
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

    if (formData.role === 'admin' && !formData.rtom) {
      toast.error('RTOM is required for admin role');
      return;
    }

    if (!editingAdmin && !formData.password) {
      toast.error('Password is required for new admins');
      return;
    }

    try {
      const url = editingAdmin 
        ? `${API_BASE_URL}/superadmin/admins/${editingAdmin._id}`
        : `${API_BASE_URL}/superadmin/admins`;
      
      const method = editingAdmin ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
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
      console.error('Error saving admin:', error);
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
      rtom: admin.rtom || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (adminId) => {
    if (!window.confirm('Are you sure you want to delete this admin?')) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/superadmin/admins/${adminId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to delete admin');
      }

      toast.success(result.message);
      fetchAdmins();
    } catch (error) {
      console.error('Error deleting admin:', error);
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
                  onChange={handleInputChange}
                  required
                >
                  <option value="admin">Admin</option>
                  <option value="uploader">Uploader</option>
                </select>
              </div>

              {formData.role === 'admin' && (
                <div className="form-group">
                  <label>RTOM *</label>
                  <select
                    name="rtom"
                    value={formData.rtom}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Select RTOM</option>
                    <option value="Colombo">Colombo</option>
                    <option value="Matara">Matara</option>
                    <option value="Negombo">Negombo</option>
                    <option value="Kandy">Kandy</option>
                    <option value="Kalutara">Kalutara</option>
                  </select>
                </div>
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
