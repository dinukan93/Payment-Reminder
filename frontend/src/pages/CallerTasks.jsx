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

  // Load customers from localStorage (or API in future)
  const loadCustomers = () => {
    const contactedStr = localStorage.getItem('contactedCustomers');
    const overdueStr = localStorage.getItem('overduePayments');
    
    let customers = [];
    
    if (contactedStr) {
      const contacted = JSON.parse(contactedStr);
      customers = [...customers, ...contacted];
    }
    
    if (overdueStr) {
      const overdue = JSON.parse(overdueStr);
      customers = [...customers, ...overdue];
    }

    // If no data, use sample data
    if (customers.length === 0) {
      const today = new Date();
      const todayString = `${String(today.getDate()).padStart(2, '0')}/${String(today.getMonth() + 1).padStart(2, '0')}/${today.getFullYear()}`;
      
      customers = [
        {
          id: 1,
          accountNumber: "1001",
          name: "Kumar Singh",
          date: todayString,
          status: "PENDING",
          response: "Will Be Paid Next Week",
          contactNumber: "070 454 5457",
          amountOverdue: "Rs.2000",
          daysOverdue: "16",
          previousResponse: "Said would pay last Friday",
          contactHistory: [
            { 
              date: todayString, 
              outcome: "Spoke to Customer", 
              response: "Said would pay last Friday", 
              promisedDate: todayString,
              paymentMade: false 
            }
          ]
        },
        {
          id: 2,
          accountNumber: "1002",
          name: "Ravi Kumar",
          date: todayString,
          status: "COMPLETED",
          response: "Payment Will Be Done After The Call",
          contactNumber: "070 123 4567",
          amountOverdue: "Rs.1500",
          daysOverdue: "8",
          previousResponse: "Will pay after receiving salary",
          contactHistory: [
            { 
              date: todayString, 
              outcome: "Spoke to Customer", 
              response: "Will pay after receiving salary", 
              promisedDate: todayString,
              paymentMade: true 
            }
          ]
        },
        {
          id: 3,
          accountNumber: "1003",
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

  // Load customers on mount
  useEffect(() => {
    loadCustomers();
    
    // Poll for updates every 5 seconds
    const interval = setInterval(loadCustomers, 5000);
    
    return () => clearInterval(interval);
  }, []);

  // Filter customers based on status and search
  useEffect(() => {
    let filtered = allCustomers;

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
  }, [statusFilter, searchTerm, allCustomers]);

  const handleViewDetails = (customer) => {
    setSelectedCustomer(customer);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedCustomer(null);
  };

  const handleSaveCustomerDetails = (accountNumber, data) => {
    const { callOutcome, customerResponse, paymentMade, promisedDate } = data;
    
    // Format current date as DD/MM/YYYY
    const today = new Date();
    const todayString = `${String(today.getDate()).padStart(2, '0')}/${String(today.getMonth() + 1).padStart(2, '0')}/${today.getFullYear()}`;
    
    // Update customer in allCustomers
    const updatedCustomers = allCustomers.map(customer => {
      if (customer.id === accountNumber) {
        return {
          ...customer,
          status: paymentMade ? "COMPLETED" : "PENDING",
          response: customerResponse,
          previousResponse: customerResponse,
          contactHistory: [
            ...(customer.contactHistory || []),
            {
              date: todayString,
              outcome: callOutcome,
              response: customerResponse,
              promisedDate: promisedDate,
              paymentMade: paymentMade
            }
          ]
        };
      }
      return customer;
    });
    
    // Update allCustomers state
    setAllCustomers(updatedCustomers);
    
    // Save to localStorage
    const contactedCustomers = updatedCustomers.filter(c => c.status === "PENDING" || c.status === "COMPLETED");
    const overduePayments = updatedCustomers.filter(c => c.status === "OVERDUE");
    
    localStorage.setItem('contactedCustomers', JSON.stringify(contactedCustomers));
    localStorage.setItem('overduePayments', JSON.stringify(overduePayments));
    
    console.log("Customer details saved:", accountNumber, data);
    handleCloseModal();
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
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
        {filteredCustomers.length > 0 ? (
          filteredCustomers.map((customer) => (
            <div key={customer.id} className={`task-card ${getPriorityClass(customer.daysOverdue)}`}>
              <div className="task-card-header">
                <div className="customer-info">
                  <h3>{customer.name}</h3>
                  <span className="account-number">
                    Account Number: {customer.accountNumber}
                  </span>
                </div>
                <span className={`status-badge ${getStatusBadgeClass(customer.status)}`}>
                  {customer.status === "OVERDUE" ? "NOT CONTACTED" : customer.status}
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

                {customer.response && customer.status !== "OVERDUE" && (
                  <div className="customer-response">
                    <span className="response-label">Latest Response:</span>
                    <p>"{customer.response}"</p>
                  </div>
                )}

                {customer.contactHistory && customer.contactHistory.length > 0 && (
                  <div className="last-contact">
                    <span>Last contact: {customer.contactHistory[customer.contactHistory.length - 1].date}</span>
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
                  href={`tel:${customer.contactNumber.replace(/\s/g, '')}`}
                  className="btn-call"
                >
                  Call Customer
                </a>
              </div>
            </div>
          ))
        ) : (
          <div className="no-customers">
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
