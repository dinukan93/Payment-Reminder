import React, { useState, useEffect } from "react";
import "./CallerTasks.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import ShowCustomerDetailsModal from "../components/ShowCustomerDetailsModal";

function CallerTasks() {
  const [allCustomers, setAllCustomers] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Load customers from localStorage or sample data
  useEffect(() => {
    loadCustomers();
    
    // Check for updates every 5 seconds
    const interval = setInterval(loadCustomers, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadCustomers = () => {
    // Try to load from localStorage first
    const storedContactedCustomers = localStorage.getItem('contactedCustomers');
    const storedOverduePayments = localStorage.getItem('overduePayments');
    
    let customers = [];
    
    if (storedContactedCustomers && storedOverduePayments) {
      const contacted = JSON.parse(storedContactedCustomers);
      const overdue = JSON.parse(storedOverduePayments);
      customers = [...contacted, ...overdue];
    } else {
      // Sample data if no localStorage data
      const today = new Date();
      const todayString = `${String(today.getDate()).padStart(2, '0')}/${String(today.getMonth() + 1).padStart(2, '0')}/${today.getFullYear()}`;
      
      customers = [
        {
          id: 1,
          accountNumber: "1001234567",
          name: "Kumar Singh",
          date: todayString,
          status: "PENDING",
          response: "Will Be Paid Next Week",
          contactNumber: "070 454 5457",
          amountOverdue: "Rs.2000",
          daysOverdue: "16",
          previousResponse: "Said would pay last Friday",
          contactHistory: []
        },
        {
          id: 2,
          accountNumber: "1001234568",
          name: "Ravi Kumar",
          date: todayString,
          status: "COMPLETED",
          response: "Payment Completed",
          contactNumber: "070 123 4567",
          amountOverdue: "Rs.1500",
          daysOverdue: "8",
          previousResponse: "Paid after salary",
          contactHistory: []
        },
        {
          id: 3,
          accountNumber: "1001234569",
          name: "Ash Kumar",
          date: todayString,
          status: "OVERDUE",
          response: "Not Contacted Yet",
          contactNumber: "070 789 4561",
          amountOverdue: "Rs.3500",
          daysOverdue: "22",
          previousResponse: "No previous contact",
          contactHistory: []
        }
      ];
    }
    
    setAllCustomers(customers);
    setFilteredCustomers(customers);
  };

  // Filter customers based on search and status
  useEffect(() => {
    let filtered = [...allCustomers];
    
    // Apply status filter
    if (statusFilter !== "ALL") {
      filtered = filtered.filter(c => c.status === statusFilter);
    }
    
    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(c => 
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.accountNumber.includes(searchTerm) ||
        c.contactNumber.includes(searchTerm)
      );
    }
    
    setFilteredCustomers(filtered);
  }, [searchTerm, statusFilter, allCustomers]);

  const handleViewDetails = (customer) => {
    setSelectedCustomer(customer);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedCustomer(null);
  };

  const handleSaveDetails = (customerId, data) => {
    console.log("Customer details saved:", customerId, data);
    // Reload customers after save
    setTimeout(loadCustomers, 500);
    handleCloseModal();
  };

  const getStatusBadgeClass = (status) => {
    switch(status) {
      case "COMPLETED": return "status-completed";
      case "PENDING": return "status-pending";
      case "OVERDUE": return "status-overdue";
      default: return "";
    }
  };

  const stats = {
    total: allCustomers.length,
    completed: allCustomers.filter(c => c.status === "COMPLETED").length,
    pending: allCustomers.filter(c => c.status === "PENDING").length,
    overdue: allCustomers.filter(c => c.status === "OVERDUE").length
  };

  return (
    <div className="caller-tasks">
      <div className="tasks-header">
        <div className="header-content">
          <h1>My Tasks</h1>
          <p className="header-subtitle">All customers assigned to you</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="tasks-stats">
        <div className="stat-card total">
          <div className="stat-icon">
            <i className="bi bi-list-check"></i>
          </div>
          <div className="stat-details">
            <h3>{stats.total}</h3>
            <p>Total Assigned</p>
          </div>
        </div>
        
        <div className="stat-card completed">
          <div className="stat-icon">
            <i className="bi bi-check-circle-fill"></i>
          </div>
          <div className="stat-details">
            <h3>{stats.completed}</h3>
            <p>Completed</p>
          </div>
        </div>
        
        <div className="stat-card pending">
          <div className="stat-icon">
            <i className="bi bi-clock-fill"></i>
          </div>
          <div className="stat-details">
            <h3>{stats.pending}</h3>
            <p>Pending</p>
          </div>
        </div>
        
        <div className="stat-card overdue">
          <div className="stat-icon">
            <i className="bi bi-exclamation-circle-fill"></i>
          </div>
          <div className="stat-details">
            <h3>{stats.overdue}</h3>
            <p>Not Contacted</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="tasks-filters">
        <div className="search-box">
          <i className="bi bi-search"></i>
          <input
            type="text"
            placeholder="Search by name, account number, or phone..."
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
            All ({stats.total})
          </button>
          <button 
            className={`filter-btn ${statusFilter === "OVERDUE" ? "active" : ""}`}
            onClick={() => setStatusFilter("OVERDUE")}
          >
            Not Contacted ({stats.overdue})
          </button>
          <button 
            className={`filter-btn ${statusFilter === "PENDING" ? "active" : ""}`}
            onClick={() => setStatusFilter("PENDING")}
          >
            Pending ({stats.pending})
          </button>
          <button 
            className={`filter-btn ${statusFilter === "COMPLETED" ? "active" : ""}`}
            onClick={() => setStatusFilter("COMPLETED")}
          >
            Completed ({stats.completed})
          </button>
        </div>
      </div>

      {/* Customer Cards */}
      <div className="tasks-content">
        {filteredCustomers.length > 0 ? (
          <div className="customers-grid">
            {filteredCustomers.map((customer) => (
              <div key={customer.id} className={`customer-card ${customer.status.toLowerCase()}`}>
                <div className="card-header">
                  <div className="customer-info">
                    <h3>{customer.name}</h3>
                    <span className="account-number">
                      <i className="bi bi-credit-card"></i>
                      {customer.accountNumber}
                    </span>
                  </div>
                  <span className={`status-badge ${getStatusBadgeClass(customer.status)}`}>
                    {customer.status === "COMPLETED" && <i className="bi bi-check-circle-fill"></i>}
                    {customer.status === "PENDING" && <i className="bi bi-clock-fill"></i>}
                    {customer.status === "OVERDUE" && <i className="bi bi-exclamation-circle-fill"></i>}
                    {customer.status}
                  </span>
                </div>

                <div className="card-details">
                  <div className="detail-row">
                    <i className="bi bi-telephone-fill"></i>
                    <span>{customer.contactNumber}</span>
                  </div>
                  <div className="detail-row amount">
                    <i className="bi bi-currency-dollar"></i>
                    <span>{customer.amountOverdue}</span>
                  </div>
                  <div className="detail-row">
                    <i className="bi bi-calendar-x"></i>
                    <span>{customer.daysOverdue} days overdue</span>
                  </div>
                </div>

                <div className="card-response">
                  <strong>Latest Response:</strong>
                  <p>{customer.response || customer.previousResponse}</p>
                </div>

                <div className="card-actions">
                  <button 
                    className="action-btn view-details"
                    onClick={() => handleViewDetails(customer)}
                  >
                    <i className="bi bi-eye"></i>
                    View Details
                  </button>
                  <a 
                    href={`tel:${customer.contactNumber.replace(/\s/g, '')}`}
                    className="action-btn call-customer"
                  >
                    <i className="bi bi-telephone-fill"></i>
                    Call
                  </a>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="no-customers">
            <i className="bi bi-inbox"></i>
            <h3>No Customers Found</h3>
            <p>
              {searchTerm 
                ? "Try adjusting your search terms" 
                : "No customers assigned yet"}
            </p>
          </div>
        )}
      </div>

      <ShowCustomerDetailsModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        customer={selectedCustomer}
        onSave={handleSaveDetails}
      />
    </div>
  );
}

export default CallerTasks;
