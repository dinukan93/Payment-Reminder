import React, { useState, useEffect } from "react";
import "./AdminTasks.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import API_BASE_URL from "../config/api";

function AdminTasks() {
  const [allCustomers, setAllCustomers] = useState([]);
  const [selectedCustomers, setSelectedCustomers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [availableCallers, setAvailableCallers] = useState([]);
  const [selectedCaller, setSelectedCaller] = useState("");
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectCount, setSelectCount] = useState(10);
  const [loading, setLoading] = useState(true);

  // Load customers and callers on mount
  useEffect(() => {
    loadCustomers();
    loadCallers();
  }, []);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/customers`);
      if (response.ok) {
        const result = await response.json();
        // Get data from the response (could be result.data or result directly)
        const customersData = result.data || result;
        
        // Show all unassigned customers (not already assigned to a caller and not completed)
        const unassignedCustomers = customersData
          .filter(c => !c.assignedTo && c.status !== 'COMPLETED')
          .map(customer => ({
            id: customer._id,
            accountNumber: customer.accountNumber,
            name: customer.name,
            contactNumber: customer.contactNumber || "N/A",
            amountOverdue: `Rs.${(customer.amountOverdue || 0).toLocaleString()}`,
            daysOverdue: customer.daysOverdue || 0,
            status: customer.status || "UNASSIGNED"
          }));
        
        setAllCustomers(unassignedCustomers);
        setFilteredCustomers(unassignedCustomers);
        console.log(`Loaded ${unassignedCustomers.length} unassigned customers`);
      } else {
        console.error('Failed to fetch customers');
      }
      setLoading(false);
    } catch (error) {
      console.error('Error loading customers:', error);
      setLoading(false);
    }
  };

  const loadCallers = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/callers`);
      if (response.ok) {
        const result = await response.json();
        // Get data from the response (could be result.data or result directly)
        const callersData = result.data || result;
        
        // Filter for AVAILABLE callers
        const availableCallersData = callersData
          .filter(c => c.status === 'AVAILABLE')
          .map(caller => ({
            id: caller.callerId,
            name: caller.name,
            status: caller.status,
            currentLoad: caller.currentLoad || 0,
            maxLoad: caller.maxLoad || 20
          }));
        
        setAvailableCallers(availableCallersData);
        console.log(`Loaded ${availableCallersData.length} available callers`);
      } else {
        console.error('Failed to fetch callers');
      }
    } catch (error) {
      console.error('Error loading callers:', error);
    }
  };

  // Filter customers based on search
  useEffect(() => {
    let filtered = allCustomers;
    
    if (searchTerm) {
      filtered = filtered.filter(c => 
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.accountNumber.includes(searchTerm) ||
        c.contactNumber.includes(searchTerm)
      );
    }
    
    setFilteredCustomers(filtered);
  }, [searchTerm, allCustomers]);

  const handleSelectCustomer = (customerId) => {
    if (selectedCustomers.includes(customerId)) {
      setSelectedCustomers(selectedCustomers.filter(id => id !== customerId));
    } else {
      setSelectedCustomers([...selectedCustomers, customerId]);
    }
  };

  const handleSelectAll = () => {
    if (selectedCustomers.length === filteredCustomers.length) {
      setSelectedCustomers([]);
    } else {
      setSelectedCustomers(filteredCustomers.map(c => c.id));
    }
  };

  const handleSelectCount = () => {
    const count = parseInt(selectCount);
    if (isNaN(count) || count <= 0) {
      alert("Please enter a valid number");
      return;
    }
    
    const customersToSelect = filteredCustomers.slice(0, count);
    setSelectedCustomers(customersToSelect.map(c => c.id));
  };

  const handleAssignClick = () => {
    if (selectedCustomers.length === 0) {
      alert("Please select at least one customer");
      return;
    }
    setShowAssignModal(true);
  };

  const handleConfirmAssign = async () => {
    if (!selectedCaller) {
      alert("Please select a caller");
      return;
    }

    const caller = availableCallers.find(c => c.id === selectedCaller);
    const selectedCustomerData = allCustomers.filter(c => selectedCustomers.includes(c.id));
    
    // Send request to backend
    await sendRequestToCaller(caller.name, caller.id, selectedCustomerData);
    
    // Remove assigned customers from list
    setAllCustomers(allCustomers.filter(c => !selectedCustomers.includes(c.id)));
    setSelectedCustomers([]);
    setSelectedCaller("");
    setShowAssignModal(false);
    
    alert(`Successfully assigned ${selectedCustomerData.length} customer(s) to ${caller.name}`);
  };

  const sendRequestToCaller = async (callerName, callerId, customers) => {
    try {
      const today = new Date();
      const todayString = `${String(today.getDate()).padStart(2, '0')}/${String(today.getMonth() + 1).padStart(2, '0')}/${today.getFullYear()}`;
      
      const requestData = {
        requestId: Date.now().toString(),
        callerName: callerName,
        callerId: callerId,
        customers: customers.map(customer => ({
          customerId: customer.id,
          accountNumber: customer.accountNumber,
          name: customer.name,
          contactNumber: customer.contactNumber,
          amountOverdue: customer.amountOverdue,
          daysOverdue: customer.daysOverdue
        })),
        customersSent: customers.length,
        sentDate: todayString,
        status: 'PENDING',
        sentBy: 'Admin'
      };
      
      // Save request to backend
      const response = await fetch(`${API_BASE_URL}/requests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData)
      });
      
      if (response.ok) {
        console.log('✅ Request sent to caller:', callerName);
      } else {
        console.error('Failed to save request to backend');
        alert('Failed to send request. Please try again.');
      }
    } catch (error) {
      console.error('Error sending request to caller:', error);
      alert('Failed to send request. Please try again.');
    }
  };

  const getSelectedCustomersData = () => {
    return allCustomers.filter(c => selectedCustomers.includes(c.id));
  };

  return (
    <div className="admin-tasks">
      <div className="admin-tasks-header">
        <div className="header-content">
          <h1>Assign Customers to Callers</h1>
          <p className="header-subtitle">Select customers and assign them to available callers</p>
        </div>
        {selectedCustomers.length > 0 && (
          <button className="assign-button" onClick={handleAssignClick}>
            <i className="bi bi-send-fill"></i>
            Assign {selectedCustomers.length} Customer{selectedCustomers.length > 1 ? 's' : ''}
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="admin-tasks-stats">
        <div className="stat-item">
          <i className="bi bi-people-fill"></i>
          <div>
            <h3>{allCustomers.length}</h3>
            <p>Total Customers</p>
          </div>
        </div>
        <div className="stat-item">
          <i className="bi bi-check-circle-fill"></i>
          <div>
            <h3>{selectedCustomers.length}</h3>
            <p>Selected</p>
          </div>
        </div>
        <div className="stat-item">
          <i className="bi bi-telephone-fill"></i>
          <div>
            <h3>{availableCallers.length}</h3>
            <p>Available Callers</p>
          </div>
        </div>
      </div>

      {/* Search and Select All */}
      <div className="admin-tasks-controls">
        <div className="search-box">
          <i className="bi bi-search"></i>
          <input
            type="text"
            placeholder="Search by name, account number, or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="selection-controls">
          <input
            type="number"
            className="select-count-input"
            value={selectCount}
            onChange={(e) => setSelectCount(e.target.value)}
            min="1"
            placeholder="Enter number"
          />
          <button 
            className="select-count-btn"
            onClick={handleSelectCount}
          >
            <i className="bi bi-check-square"></i>
            Select {selectCount}
          </button>
        </div>
        
        <button 
          className={`select-all-btn ${selectedCustomers.length === filteredCustomers.length && filteredCustomers.length > 0 ? 'active' : ''}`}
          onClick={handleSelectAll}
        >
          <i className={`bi ${selectedCustomers.length === filteredCustomers.length && filteredCustomers.length > 0 ? 'bi-check-square-fill' : 'bi-square'}`}></i>
          {selectedCustomers.length === filteredCustomers.length && filteredCustomers.length > 0 ? 'Deselect All' : 'Select All'}
        </button>
      </div>

      {/* Customer Table */}
      <div className="admin-tasks-table-container">
        <table className="admin-tasks-table">
          <thead>
            <tr>
              <th>
                <input
                  type="checkbox"
                  checked={selectedCustomers.length === filteredCustomers.length && filteredCustomers.length > 0}
                  onChange={handleSelectAll}
                />
              </th>
              <th>ACCOUNT NUMBER</th>
              <th>CUSTOMER NAME</th>
              <th>CONTACT NUMBER</th>
              <th>AMOUNT OVERDUE</th>
              <th>DAYS OVERDUE</th>
              <th>STATUS</th>
            </tr>
          </thead>
          <tbody>
            {filteredCustomers.length > 0 ? (
              filteredCustomers.map((customer) => (
                <tr 
                  key={customer.id} 
                  className={selectedCustomers.includes(customer.id) ? 'selected' : ''}
                  onClick={() => handleSelectCustomer(customer.id)}
                >
                  <td onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selectedCustomers.includes(customer.id)}
                      onChange={() => handleSelectCustomer(customer.id)}
                    />
                  </td>
                  <td className="account-number">{customer.accountNumber}</td>
                  <td className="customer-name">{customer.name}</td>
                  <td className="contact-number">{customer.contactNumber}</td>
                  <td className="amount-overdue">{customer.amountOverdue}</td>
                  <td className="days-overdue">{customer.daysOverdue} days</td>
                  <td>
                    <span className="status-badge unassigned">
                      {customer.status}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" className="no-data">
                  <i className="bi bi-inbox"></i>
                  <p>No customers found</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Assign Modal */}
      {showAssignModal && (
        <div className="modal-overlay" onClick={() => setShowAssignModal(false)}>
          <div className="assign-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>
                <i className="bi bi-send"></i>
                Assign Customers to Caller
              </h2>
              <button className="close-btn" onClick={() => setShowAssignModal(false)}>
                <i className="bi bi-x-lg"></i>
              </button>
            </div>

            <div className="modal-body">
              <div className="selected-summary">
                <h3>Selected Customers ({selectedCustomers.length})</h3>
                <div className="customer-list">
                  {getSelectedCustomersData().map((customer) => (
                    <div key={customer.id} className="customer-item">
                      <div>
                        <strong>{customer.name}</strong>
                        <span>{customer.accountNumber}</span>
                      </div>
                      <span className="amount">{customer.amountOverdue}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="caller-selection">
                <h3>Select Caller</h3>
                <div className="callers-grid">
                  {availableCallers.map((caller) => (
                    <div
                      key={caller.id}
                      className={`caller-card ${selectedCaller === caller.id ? 'selected' : ''}`}
                      onClick={() => setSelectedCaller(caller.id)}
                    >
                      <div className="caller-info">
                        <h4>{caller.name}</h4>
                        <span className="caller-id">ID: {caller.id}</span>
                      </div>
                      <div className="caller-load">
                        <div className="load-bar">
                          <div 
                            className="load-fill" 
                            style={{ width: `${(caller.currentLoad / caller.maxLoad) * 100}%` }}
                          ></div>
                        </div>
                        <span className="load-text">{caller.currentLoad}/{caller.maxLoad} customers</span>
                      </div>
                      <span className="caller-status">{caller.status}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button className="cancel-btn" onClick={() => setShowAssignModal(false)}>
                Cancel
              </button>
              <button className="confirm-btn" onClick={handleConfirmAssign}>
                <i className="bi bi-check-circle"></i>
                Confirm Assignment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminTasks;
