import React, { useState, useEffect } from "react";
import { toast } from 'react-toastify';
import "./AdminTasks.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import { secureFetch } from "../utils/api";
import { showError, showSuccess, showInfo } from "../components/Notifications";
import AutomateConfigModal from "../components/AutomateConfigModal";

function AdminTasks() {
  const [allCustomers, setAllCustomers] = useState([]);
  const [selectedCustomers, setSelectedCustomers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [availableCallers, setAvailableCallers] = useState([]);
  const [selectedCaller, setSelectedCaller] = useState("");
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showAutomateModal, setShowAutomateModal] = useState(false);
  const [selectCount, setSelectCount] = useState(10);
  const [loading, setLoading] = useState(true);
  const [isAutomating, setIsAutomating] = useState(false);

  // Load customers and callers on mount
  useEffect(() => {
    loadCustomers();
    loadCallers();
  }, []);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      const response = await secureFetch(`/api/customers`);
      if (response.ok) {
        const result = await response.json();
        // Get data from the response (could be result.data or result directly)
        const customersData = result.data || result;

        // Show all unassigned customers (not already assigned to a caller and not completed)
        const unassignedCustomers = customersData
          .filter(c => !c.assigned_to && c.status !== 'COMPLETED')
          .map(customer => ({
            id: customer.id,
            accountNumber: customer.ACCOUNT_NUM,
            name: customer.CUSTOMER_NAME,
            contactNumber: customer.MOBILE_CONTACT_TEL || "N/A",
            amountOverdue: customer.NEW_ARREARS || 0,
            daysOverdue: customer.AGE_MONTHS || 0,
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
      const response = await secureFetch(`/api/callers`);

      if (response.ok) {
        const result = await response.json();
        const callersData = Array.isArray(result) ? result : (result.data || []);

        // Map callers to the format expected by the UI
        const mappedCallers = callersData.map(caller => ({
          id: caller.callerId,
          callerId: caller.callerId,
          name: caller.name,
          status: caller.status || 'ACTIVE',
          taskId: null,
          completedInTask: caller.currentLoad || 0,
          totalInTask: caller.maxLoad || 20
        }));

        // Filter out OFFLINE/disabled callers - they should not receive assignments
        const enabledCallers = mappedCallers.filter(caller =>
          caller.status !== 'OFFLINE' && caller.status !== 'DISABLED'
        );

        setAvailableCallers(enabledCallers);
        console.log(`Loaded ${enabledCallers.length} enabled callers (filtered from ${mappedCallers.length} total)`);
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
      showError("Please enter a valid number");
      return;
    }

    const customersToSelect = filteredCustomers.slice(0, count);
    setSelectedCustomers(customersToSelect.map(c => c.id));
  };

  const handleAssignClick = () => {
    if (selectedCustomers.length === 0) {
      showError("Please select at least one customer");
      return;
    }
    setShowAssignModal(true);
  };

  const handleConfirmAssign = async () => {
    if (!selectedCaller) {
      showError("Please select a caller");
      return;
    }

    const caller = availableCallers.find(c => c.id === selectedCaller);
    const selectedCustomerData = allCustomers.filter(c => selectedCustomers.includes(c.id));

    // Always use caller.callerId for backend, not MongoDB _id
    const callerIdToSend = caller.callerId || caller.id;

    // Send request to backend
    await sendRequestToCaller(caller.name, callerIdToSend, selectedCustomerData);

    // Remove assigned customers from list
    setAllCustomers(allCustomers.filter(c => !selectedCustomers.includes(c.id)));
    setSelectedCustomers([]);
    setSelectedCaller("");
    setShowAssignModal(false);

    toast.success(`Successfully assigned ${selectedCustomerData.length} customer(s) to ${caller.name}`);
  };

  const sendRequestToCaller = async (callerName, callerId, customers) => {
    try {
      // Find the caller's numeric ID from the callers list
      const caller = availableCallers.find(c => c.callerId === callerId || c.id === callerId);

      if (!caller) {
        console.error('Caller not found:', callerId);
        toast.error('Failed to find caller. Please try again.');
        return;
      }

      // Get the numeric caller ID from the database
      const response = await secureFetch(`/api/callers`);
      if (!response.ok) {
        throw new Error('Failed to fetch caller details');
      }

      const callersData = await response.json();
      const callersArray = Array.isArray(callersData) ? callersData : (callersData.data || []);
      const callerFromDB = callersArray.find(c => c.callerId === callerId);

      if (!callerFromDB) {
        console.error('Caller not found in database:', callerId);
        toast.error('Failed to find caller in database. Please try again.');
        return;
      }

      const requestData = {
        caller_id: callerFromDB.id, // Use numeric ID from database
        customer_ids: customers.map(c => c.id) // Array of customer IDs
      };

      // Debug: log callerId and requestData
      console.log('Sending request to backend with caller_id:', callerFromDB.id);
      console.log('Request payload:', requestData);

      // Save request to backend
      const createResponse = await secureFetch(`/api/requests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData)
      });

      if (createResponse.ok) {
        console.log('Request sent to caller:', callerName);
      } else {
        const errorData = await createResponse.json();
        console.error('Failed to save request to backend:', errorData);
        toast.error(errorData.message || 'Failed to send request. Please try again.');
      }
    } catch (error) {
      console.error('Error sending request to caller:', error);
      toast.error('Failed to send request. Please try again.');
    }
  };

  const handleAutomateClick = () => {
    setShowAutomateModal(true);
  };

  const handleAutomateConfirm = async (selectedCallerIds) => {
    if (isAutomating) return;

    setShowAutomateModal(false);
    setIsAutomating(true);
    showInfo("Starting automated customer assignment...");

    try {
      const response = await secureFetch(`/api/auto-assign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          caller_ids: selectedCallerIds
        })
      });

      const result = await response.json();

      if (result.success) {
        const { assigned_count, remaining_count, assignments } = result.data;

        // Build detailed message
        let message = `✅ Successfully assigned ${assigned_count} customer(s) to ${assignments.length} caller(s)`;

        if (remaining_count > 0) {
          message += `\n⚠️ ${remaining_count} customer(s) could not be assigned (no available capacity)`;
        }

        showSuccess(message);
        loadCustomers(); // Refresh the customer list
      } else {
        showError(result.message || "Failed to auto-assign customers");
      }
    } catch (error) {
      console.error('Error during auto-assignment:', error);
      showError("Error during automated assignment");
    } finally {
      setIsAutomating(false);
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
        <button className="automate-button" onClick={handleAutomateClick} title="Auto-assign customers to callers based on capacity">
          <i className="bi bi-magic"></i>
          Automate
        </button>
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
                        {caller.taskId && caller.taskId !== 'N/A' && (
                          <span className="task-id">Task: {caller.taskId}</span>
                        )}
                      </div>
                      <div className="caller-load">
                        <div className="load-bar">
                          <div
                            className="load-fill"
                            style={{ width: caller.totalInTask > 0 ? `${(caller.completedInTask / caller.totalInTask) * 100}%` : '0%' }}
                          ></div>
                        </div>
                        <span className="load-text">
                          {caller.completedInTask}/{caller.totalInTask} completed
                        </span>
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

      <AutomateConfigModal
        isOpen={showAutomateModal}
        onClose={() => setShowAutomateModal(false)}
        onConfirm={handleAutomateConfirm}
      />
    </div>
  );
}

export default AdminTasks;
