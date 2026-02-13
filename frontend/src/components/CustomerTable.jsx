import React, { useState, useEffect } from "react";
import "./CustomerTable.css";
import { secureFetch } from "../utils/api";
import EditCustomerModal from "./EditCustomerModal";
import { showSuccess, showError, showWarning } from "./Notifications";

function CustomerTable({ refreshTrigger, searchFilter = {} }) {
  const [customers, setCustomers] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState(null);

  useEffect(() => {
    fetchCustomers();
  }, [refreshTrigger]);

  useEffect(() => {
    applyFilters();
  }, [customers, searchFilter]);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const response = await secureFetch(`/api/customers`);
      const result = await response.json();
      if (result.success && result.data) {
        // Show all customers including COMPLETED
        setCustomers(result.data);
      }
      setLoading(false);
    } catch (error) {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...customers];
    const { searchTerm = "", filterType = "All" } = searchFilter;

    // Apply search filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(c =>
        c.CUSTOMER_NAME?.toLowerCase().includes(term) ||
        c.ACCOUNT_NUM?.toLowerCase().includes(term) ||
        c.MOBILE_CONTACT_TEL?.toLowerCase().includes(term) ||
        c.EMAIL_ADDRESS?.toLowerCase().includes(term)
      );
    }

    // Apply status filter
    if (filterType !== "All") {
      filtered = filtered.filter(c => c.status === filterType.toUpperCase());
    }

    setFilteredCustomers(filtered);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const handleEdit = (customer) => {
    setSelectedCustomer(customer);
    setShowEditModal(true);
  };

  const handleEditClose = () => {
    setShowEditModal(false);
    setSelectedCustomer(null);
  };

  const handleEditSave = (updatedCustomer) => {
    setCustomers(customers.map(c => c._id === updatedCustomer._id ? updatedCustomer : c));
    showSuccess('Customer updated successfully');
  };

  const handleDelete = async (customer) => {
    if (deleteConfirmation === customer._id) {
      // Second click - proceed with delete
      setDeleteConfirmation(null);
      try {
        const response = await secureFetch(`/api/customers/${customer._id}`, {
          method: 'DELETE'
        });
        if (response.ok) {
          showSuccess('Customer deleted successfully');
          fetchCustomers(); // Refresh the list
        } else {
          showError('Failed to delete customer');
        }
      } catch (error) {
        showError('Error deleting customer');
      }
    } else {
      // First click - show confirmation toast
      setDeleteConfirmation(customer._id);
      showWarning(`Click delete again to confirm deletion of ${customer.name}`);

      // Reset confirmation after 3 seconds
      setTimeout(() => setDeleteConfirmation(null), 3000);
    }
  };

  if (loading) {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(255,255,255,0.7)',
        zIndex: 9999
      }}>
        <div style={{
          width: '48px',
          height: '48px',
          border: '4px solid #f3f3f3',
          borderTop: '4px solid #1488ee',
          borderRadius: '50%',
          marginBottom: '20px',
          animation: 'spin 1s linear infinite'
        }}></div>
        <p>Loading customers...</p>
      </div>
    );
  }

  return (
    <>
      <div className="table-card" style={{ overflowX: 'auto', width: '100%', border: 'none' }}>
        <table className="custom-table" style={{ minWidth: '1200px' }}>
          <thead>
            <tr>
              <th>Account Number</th>
              <th>Customer Name</th>
              <th>Region</th>
              <th>RTOM</th>
              <th>Product</th>
              <th>Medium</th>
              <th>Latest Bill</th>
              <th>New Arrears</th>
              <th>Credit Score</th>
              <th>Credit Class</th>
              <th>Contact Number</th>
              <th>Mobile Contact</th>
              <th>Email</th>
              <th>Bill Handling</th>
              <th>Account Manager</th>
              <th>Sales Person</th>
              <th>Caller</th>
              <th>Assignment Type</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredCustomers.length > 0 ? (
              filteredCustomers.map((customer) => (
                <tr key={customer.id}>
                  <td>{customer.ACCOUNT_NUM}</td>
                  <td>{customer.CUSTOMER_NAME}</td>
                  <td>{customer.REGION || '-'}</td>
                  <td>{customer.RTOM || '-'}</td>
                  <td>{customer.PRODUCT_LABEL || '-'}</td>
                  <td>{customer.MEDIUM || '-'}</td>
                  <td>{customer.LATEST_BILL_MNY || '0'}</td>
                  <td>{customer.NEW_ARREARS || '0'}</td>
                  <td>{customer.CREDIT_SCORE || '0'}</td>
                  <td>{customer.CREDIT_CLASS_NAME || '-'}</td>
                  <td>{customer.MOBILE_CONTACT_TEL || '-'}</td>
                  <td>{customer.MOBILE_CONTACT_TEL || '-'}</td>
                  <td>{customer.EMAIL_ADDRESS || '-'}</td>
                  <td>{customer.BILL_HANDLING_CODE_NAME || '-'}</td>
                  <td>{customer.ACCOUNT_MANAGER || '-'}</td>
                  <td>{customer.SALES_PERSON || '-'}</td>
                  <td>{customer.assigned_caller ? customer.assigned_caller.name : 'Unassigned'}</td>
                  <td>{customer.assignment_type || '-'}</td>
                  <td className="status">
                    <span className={`status-badge ${(customer.status || '').toLowerCase()}`}>
                      {customer.status}
                    </span>
                  </td>
                  <td>
                    <button
                      onClick={() => handleEdit(customer)}
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
                      onClick={() => handleDelete(customer)}
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
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="20" style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
                  <i className="bi bi-inbox" style={{ fontSize: '48px', display: 'block', marginBottom: '10px' }}></i>
                  {searchFilter.searchTerm ? 'No customers match your search' : 'No customers found'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <EditCustomerModal
        show={showEditModal}
        customer={selectedCustomer}
        onClose={handleEditClose}
        onSave={handleEditSave}
      />
    </>
  );
}

export default CustomerTable;
