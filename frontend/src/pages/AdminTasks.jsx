import React, { useState, useEffect } from "react";
import "./AdminTasks.css";
import "bootstrap-icons/font/bootstrap-icons.css";

function AdminTasks() {
  const [allCustomers, setAllCustomers] = useState([]);
  const [selectedCustomers, setSelectedCustomers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [availableCallers, setAvailableCallers] = useState([]);
  const [selectedCaller, setSelectedCaller] = useState("");
  const [showAssignModal, setShowAssignModal] = useState(false);

  // Load customers and callers on mount
  useEffect(() => {
    loadCustomers();
    loadCallers();
  }, []);

  const loadCustomers = () => {
    // Sample customer data - this would come from backend
    const customers = [
      { id: 1, accountNumber: "1001234590", name: "Anil Perera", contactNumber: "077-1234567", amountOverdue: "Rs.5,000", daysOverdue: 25, status: "UNASSIGNED" },
      { id: 2, accountNumber: "1001234591", name: "Sunil Fernando", contactNumber: "071-2345678", amountOverdue: "Rs.3,500", daysOverdue: 18, status: "UNASSIGNED" },
      { id: 3, accountNumber: "1001234592", name: "Kamala Silva", contactNumber: "076-3456789", amountOverdue: "Rs.7,200", daysOverdue: 40, status: "UNASSIGNED" },
      { id: 4, accountNumber: "1001234593", name: "Nimal Rajapakse", contactNumber: "070-4567890", amountOverdue: "Rs.4,800", daysOverdue: 30, status: "UNASSIGNED" },
      { id: 5, accountNumber: "1001234594", name: "Saman Wickramasinghe", contactNumber: "077-5678901", amountOverdue: "Rs.6,100", daysOverdue: 35, status: "UNASSIGNED" },
      { id: 6, accountNumber: "1001234595", name: "Kumari Jayawardena", contactNumber: "071-6789012", amountOverdue: "Rs.2,900", daysOverdue: 15, status: "UNASSIGNED" },
      { id: 7, accountNumber: "1001234596", name: "Rohan De Silva", contactNumber: "076-7890123", amountOverdue: "Rs.8,500", daysOverdue: 50, status: "UNASSIGNED" },
      { id: 8, accountNumber: "1001234597", name: "Dilani Gunasekara", contactNumber: "070-8901234", amountOverdue: "Rs.5,600", daysOverdue: 28, status: "UNASSIGNED" },
      { id: 9, accountNumber: "1001234598", name: "Prasad Mendis", contactNumber: "077-9012345", amountOverdue: "Rs.4,200", daysOverdue: 22, status: "UNASSIGNED" },
      { id: 10, accountNumber: "1001234599", name: "Sandya Amarasinghe", contactNumber: "071-0123456", amountOverdue: "Rs.7,800", daysOverdue: 45, status: "UNASSIGNED" },
      { id: 11, accountNumber: "1001234600", name: "Chathura Bandara", contactNumber: "076-1234567", amountOverdue: "Rs.3,300", daysOverdue: 20, status: "UNASSIGNED" },
      { id: 12, accountNumber: "1001234601", name: "Malini Wijesinghe", contactNumber: "070-2345678", amountOverdue: "Rs.6,700", daysOverdue: 38, status: "UNASSIGNED" },
    ];
    
    setAllCustomers(customers);
    setFilteredCustomers(customers);
  };

  const loadCallers = () => {
    // Sample caller data - this would come from backend
    const callers = [
      { id: "2313", name: "Ravi Kumar", status: "AVAILABLE", currentLoad: 5, maxLoad: 20 },
      { id: "2314", name: "Ash Kumar", status: "AVAILABLE", currentLoad: 8, maxLoad: 20 },
      { id: "2315", name: "Priya Singh", status: "AVAILABLE", currentLoad: 3, maxLoad: 20 },
      { id: "2331", name: "Kumar Singh", status: "AVAILABLE", currentLoad: 10, maxLoad: 20 },
      { id: "2332", name: "Sita Devi", status: "AVAILABLE", currentLoad: 0, maxLoad: 20 },
    ];
    
    setAvailableCallers(callers);
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

  const handleAssignClick = () => {
    if (selectedCustomers.length === 0) {
      alert("Please select at least one customer");
      return;
    }
    setShowAssignModal(true);
  };

  const handleConfirmAssign = () => {
    if (!selectedCaller) {
      alert("Please select a caller");
      return;
    }

    const caller = availableCallers.find(c => c.id === selectedCaller);
    const selectedCustomerData = allCustomers.filter(c => selectedCustomers.includes(c.id));
    
    // Send request to caller
    sendRequestToCaller(caller.name, caller.id, selectedCustomerData);
    
    // Remove assigned customers from list
    setAllCustomers(allCustomers.filter(c => !selectedCustomers.includes(c.id)));
    setSelectedCustomers([]);
    setSelectedCaller("");
    setShowAssignModal(false);
    
    alert(`Successfully assigned ${selectedCustomerData.length} customer(s) to ${caller.name}`);
  };

  const sendRequestToCaller = (callerName, callerId, customers) => {
    const newRequestId = Date.now();
    const today = new Date();
    const todayString = `${String(today.getDate()).padStart(2, '0')}/${String(today.getMonth() + 1).padStart(2, '0')}/${today.getFullYear()}`;
    
    const requestData = {
      requestId: newRequestId,
      callerName: callerName,
      callerId: callerId,
      customers: customers.map((customer, index) => ({
        id: index + 1,
        accountNumber: customer.accountNumber,
        name: customer.name,
        contactNumber: customer.contactNumber,
        amountOverdue: customer.amountOverdue,
        daysOverdue: customer.daysOverdue,
        date: todayString,
        sentBy: "Admin",
        sentDate: todayString
      })),
      sentDate: todayString
    };
    
    localStorage.setItem('pendingAdminRequest', JSON.stringify(requestData));
    console.log('✅ Request sent to caller:', callerName, requestData);
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
