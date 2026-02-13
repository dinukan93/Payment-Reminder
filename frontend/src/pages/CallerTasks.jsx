import React, { useState, useEffect } from "react";
import { toast } from 'react-toastify';
import "./CallerTasks.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import ShowCustomerDetailsModal from "../components/ShowCustomerDetailsModal";
import { secureFetch } from "../utils/api";

function CallerTasks() {
  const [allCustomers, setAllCustomers] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load customers assigned to the logged-in caller
  const loadCustomers = async () => {
    try {
      // Get logged-in user info
      const userData = JSON.parse(localStorage.getItem('userData') || '{}');
      const callerId = userData.id;

      if (!callerId) {
        setLoading(false);
        return;
      }

      // Fetch customers assigned to this caller
      const response = await secureFetch(`/api/customers?callerId=${callerId}`);
      const data = await response.json();

      if (data.success) {
        setAllCustomers(data.data);
        setFilteredCustomers(data.data);
      }
    } catch (error) {
      // Error handling
    } finally {
      setLoading(false);
    }
  };

  // Load customers on mount
  useEffect(() => {
    loadCustomers();

    // Poll for updates every 5 seconds
    const interval = setInterval(loadCustomers, 4000);

    return () => clearInterval(interval);
  }, []);

  // Filter customers based on status and search
  useEffect(() => {
    let filtered = allCustomers;

    // Apply status filter (case-insensitive)
    if (statusFilter !== "ALL") {
      filtered = filtered.filter(c =>
        (c.status || "").toUpperCase() === statusFilter.toUpperCase()
      );
    }

    // Apply search filter
    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      filtered = filtered.filter(c =>
        (c.name || "").toLowerCase().includes(lowerSearch) ||
        (c.accountNumber || "").includes(searchTerm) ||
        (c.contactNumber || "").includes(searchTerm)
      );
    }

    setFilteredCustomers(filtered);
  }, [statusFilter, searchTerm, allCustomers]);

  const handleViewDetails = (customer) => {
    setSelectedCustomer(customer);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedCustomer(null);
  };

  const handleSaveCustomerDetails = async (customerId, data) => {
    try {
      const { callOutcome, customerResponse, paymentMade, promisedDate } = data;


      const response = await secureFetch(`/api/customers/${customerId}/contact`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          callOutcome,
          customerResponse,
          paymentMade,
          promisedDate
        })
      });

      const result = await response.json();

      if (result.success) {

        handleCloseModal();

        await loadCustomers();
      } else {
        toast.error('Failed to save: ' + result.message);
      }
    } catch (error) {
      toast.error('Failed to save customer details. Please try again.');
    }
  };

  const getStatusBadgeClass = (status) => {
    if (!status) return "";
    const s = status.toUpperCase();
    switch (s) {
      case "COMPLETED":
        return "status-completed";
      case "PENDING":
        return "status-pending";
      case "OVERDUE":
        return "status-overdue";
      default:
        return "";
    }
  };

  const getPriorityClass = (daysOverdue) => {
    const days = parseInt(daysOverdue);
    if (days >= 30) return "priority-high";
    if (days >= 15) return "priority-medium";
    return "priority-low";
  };

  return (
    <div className="caller-tasks">
      <div className="caller-tasks-header">
        <div>
          <h1>My Tasks</h1>
          <p className="tasks-subtitle">Manage your assigned customers and track payment status</p>
        </div>
      </div>

      {/* Filters Section */}
      <div className="tasks-filters">
        <div className="search-box">
          <i className="bi bi-search"></i>
          <input
            type="text"
            placeholder="Search by name, account, or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button className="clear-search" onClick={() => setSearchTerm("")}>
              <i className="bi bi-x"></i>
            </button>
          )}
        </div>

        <div className="status-filters">
          <button
            className={`filter-btn ${statusFilter === "ALL" ? "active" : ""}`}
            onClick={() => setStatusFilter("ALL")}
          >
            All
          </button>
          <button
            className={`filter-btn ${statusFilter === "OVERDUE" ? "active" : ""}`}
            onClick={() => setStatusFilter("OVERDUE")}
          >
            Not Contacted
          </button>
          <button
            className={`filter-btn ${statusFilter === "PENDING" ? "active" : ""}`}
            onClick={() => setStatusFilter("PENDING")}
          >
            Pending
          </button>
          <button
            className={`filter-btn ${statusFilter === "COMPLETED" ? "active" : ""}`}
            onClick={() => setStatusFilter("COMPLETED")}
          >
            Completed
          </button>
        </div>
      </div>

      {/* Customer Cards Grid */}
      <div className="tasks-grid">
        {loading ? (
          <div className="loading-container" key="loading">
            <div className="loading-content">
              <div className="spinner"></div>
              <h3>Loading Tasks</h3>
              <p>Please wait while we fetch your assigned customers...</p>
            </div>
          </div>
        ) : filteredCustomers.length > 0 ? (
          filteredCustomers.map((customer) => (
            <div key={customer.id || customer._id} className={`task-card ${getPriorityClass(customer.daysOverdue)}`}>
              <div className="task-card-header">
                <div className="customer-info">
                  <h3>{customer.name}</h3>
                  <span className="account-number">
                    Account Number: {customer.accountNumber}
                  </span>
                </div>
                <span className={`status-badge ${getStatusBadgeClass(customer.status)}`}>
                  {(customer.status || "").toUpperCase() === "OVERDUE" ? "NOT CONTACTED" : customer.status}
                </span>
              </div>

              <div className="task-card-body">
                <div className="info-row">
                  <span className="info-label">Contact:</span>
                  <span>{customer.contactNumber}</span>
                </div>

                <div className="info-row amount-row">
                  <span className="info-label">Amount:</span>
                  <span className="amount">{customer.amountOverdue}</span>
                </div>

                <div className="info-row">
                  <span className="info-label">Days Overdue:</span>
                  <span className={`days-overdue ${getPriorityClass(customer.daysOverdue)}`}>
                    {customer.daysOverdue} days
                  </span>
                </div>

                {customer.contactHistory && customer.contactHistory.length > 0 && (
                  <>
                    <div className="last-contact">
                      <i className="bi bi-clock-history"></i>
                      <span>Last contacted: {customer.contactHistory[customer.contactHistory.length - 1].contactDate}</span>
                    </div>

                    {customer.contactHistory[customer.contactHistory.length - 1].promisedDate && (
                      <div className="promised-date">
                        <i className="bi bi-calendar-check"></i>
                        <span>Promised to pay: {customer.contactHistory[customer.contactHistory.length - 1].promisedDate}</span>
                      </div>
                    )}
                  </>
                )}

                {customer.response && customer.status !== "OVERDUE" && (
                  <div className="customer-response">
                    <span className="response-label">Latest Response:</span>
                    <p>"{customer.response}"</p>
                  </div>
                )}
              </div>

              <div className="task-card-actions">
                <button
                  className="btn-details"
                  onClick={() => handleViewDetails(customer)}
                >
                  View Details
                </button>
                <a
                  href={`tel:${(customer.contactNumber || "").replace(/\s/g, "")}`}
                  className="btn-call"
                >
                  Call Customer
                </a>
              </div>
            </div>
          ))
        ) : (
          <div className="no-customers" key="no-customers">
            <h3>No customers found</h3>
            <p>
              {searchTerm || statusFilter !== "ALL"
                ? "Try adjusting your filters"
                : "You have no assigned customers"}
            </p>
          </div>
        )}
      </div>

      {/* Customer Details Modal */}
      {selectedCustomer && (
        <ShowCustomerDetailsModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          customer={selectedCustomer}
          onSave={handleSaveCustomerDetails}
        />
      )}
    </div>
  );
}

export default CallerTasks;
