import React, { useState, useEffect } from "react";
import "./CustomerTable.css";
import API_BASE_URL from "../config/api";
import EditCustomerModal from "./EditCustomerModal";

function CustomerTable({ refreshTrigger, searchFilter = {} }) {
  const [customers, setCustomers] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  useEffect(() => {
    fetchCustomers();
  }, [refreshTrigger]);

  useEffect(() => {
    applyFilters();
  }, [customers, searchFilter]);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/customers`);
      const result = await response.json();
      if (result.success && result.data) {
        // Show all customers except those marked as COMPLETED (unless they have PENDING/OVERDUE status)
        // This includes UNASSIGNED (even with assignedTo = null), PENDING, OVERDUE, and assigned customers
        const filteredData = result.data.filter(c => {
          const status = c.status || 'UNASSIGNED';
        
          return status === 'PENDING' || status === 'UNASSIGNED' || status === 'OVERDUE' || c.assignedTo;
        });
        setCustomers(filteredData);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching customers:', error);
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
        c.name?.toLowerCase().includes(term) ||
        c.accountNumber?.toLowerCase().includes(term) ||
        c.contactNumber?.toLowerCase().includes(term) ||
        c.emailAddress?.toLowerCase().includes(term)
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
    alert('Customer updated successfully');
  };

  const handleDelete = async (customer) => {
    if (window.confirm(`Are you sure you want to delete ${customer.name}?`)) {
      try {
        const response = await fetch(`${API_BASE_URL}/api/customers/${customer._id}`, {
          method: 'DELETE'
        });
        if (response.ok) {
          alert('Customer deleted successfully');
          fetchCustomers(); // Refresh the list
        } else {
          alert('Failed to delete customer');
        }
      } catch (error) {
        console.error('Error deleting customer:', error);
        alert('Error deleting customer');
      }
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
      <div className="table-card" style={{ overflowX: 'auto', width: '100%' }}>
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
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredCustomers.length > 0 ? (
              filteredCustomers.map((customer) => (
                <tr key={customer._id}>
                  <td>{customer.accountNumber}</td>
                  <td>{customer.name}</td>
                  <td>{customer.region || '-'}</td>
                  <td>{customer.rtom || '-'}</td>
                  <td>{customer.productLabel || '-'}</td>
                  <td>{customer.medium || '-'}</td>
                  <td>{customer.latestBillAmount || '0'}</td>
                  <td>{customer.newArrears || '0'}</td>
                  <td>{customer.creditScore || '0'}</td>
                  <td>{customer.creditClassName || '-'}</td>
                  <td>{customer.contactNumber || '-'}</td>
                  <td>{customer.mobileContactTel || '-'}</td>
                  <td>{customer.emailAddress || '-'}</td>
                  <td>{customer.billHandlingCodeName || '-'}</td>
                  <td>{customer.accountManager || '-'}</td>
                  <td>{customer.salesPerson || '-'}</td>
                  <td>{customer.assignedTo ? customer.assignedTo.name : 'Unassigned'}</td>
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
                <td colSpan="19" style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
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
