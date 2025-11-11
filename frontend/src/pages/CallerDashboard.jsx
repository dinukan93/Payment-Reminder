import React, { useState, useEffect, useMemo } from "react";
import "./CallerDashboard.css";
import DashboardStats from "../components/DashboardStats";
import ContactedCustomersTable from "../components/ContactedCustomersTable";
import OverduePaymentsTable from "../components/OverduePaymentsTable";
import UserProfile from "../components/UserProfile";
import API_BASE_URL from "../config/api";

function CallerDashboard() {
  // Helper function to format date as DD/MM/YYYY
  const formatDate = (date) => {
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };

  // State management
  const [contactedCustomers, setContactedCustomers] = useState([]);
  const [overduePayments, setOverduePayments] = useState([]);
  const [stats, setStats] = useState([
    { type: "customers", value: "0", label: "Total Customers", color: "#4d99c0ff" },
    { type: "contacted", value: "0", label: "Customers Contacted", color: "#4d99c0ff" },
    { type: "completed", value: "0", label: "Payments Completed", color: "#4d99c0ff" },
    { type: "pending", value: "0", label: "Pending Payments", color: "#4d99c0ff" },
  ]);

  // Fetch customers from backend API
  const fetchCustomers = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/customers`);
      const data = await response.json();
      
      if (data.success && data.data) {
        // Separate customers by status
        const contacted = data.data.filter(c => c.status === 'PENDING' || c.status === 'COMPLETED');
        const overdue = data.data.filter(c => c.status === 'OVERDUE');
        
        // Map MongoDB _id to id for frontend compatibility
        const formattedContacted = contacted.map(c => ({ ...c, id: c._id }));
        const formattedOverdue = overdue.map(c => ({ ...c, id: c._id }));
        
        setContactedCustomers(formattedContacted);
        setOverduePayments(formattedOverdue);
        updateStats(formattedContacted, formattedOverdue);
      }
    } catch (error) {
      console.error('Error fetching customers from backend:', error);
      alert('Failed to load customer data. Please check if the backend server is running.');
    }
  };

  // Initialize by fetching from backend
  useEffect(() => {
    fetchCustomers();
  }, []);

  // Update statistics based on data
  const updateStats = (contacted, overdue) => {
    const totalCustomers = contacted.length + overdue.length;
    const contactedCount = contacted.length;
    const completedCount = contacted.filter(c => c.status === "COMPLETED").length;
    const pendingCount = contacted.filter(c => c.status === "PENDING").length + overdue.length;

    setStats([
      { type: "customers", value: totalCustomers.toString(), label: "Total Customers", color: "#90e4f7ff" },
      { type: "contacted", value: contactedCount.toString(), label: "Customers Contacted", color: "#90e4f7ff" },
      { type: "completed", value: completedCount.toString(), label: "Payments Completed", color: "#90e4f7ff" },
      { type: "pending", value: pendingCount.toString(), label: "Pending Payments", color: "#90e4f7ff" },
    ]);
  };

  // Handle accepting customer request from admin
  const handleAcceptRequest = async () => {
    // After accepting requests via API, refetch all customers from backend
    console.log('Requests accepted, refetching customers from database...');
    await fetchCustomers();
  };

  // Handle saving customer details from modal
  const handleSaveCustomerDetails = async (accountNumber, data) => {
    const { callOutcome, customerResponse, paymentMade, promisedDate } = data;
    
    console.log('handleSaveCustomerDetails called with:', { accountNumber, data });
    
    // Check if customer is in overdue list
    const overdueCustomer = overduePayments.find(p => p.id === accountNumber);
    const existingCustomer = overdueCustomer || contactedCustomers.find(c => c.id === accountNumber);
    
    if (!existingCustomer) {
      console.error('Customer not found');
      return;
    }
    
    console.log('Found customer:', existingCustomer);
    
    try {
      const requestBody = {
        callOutcome,
        customerResponse,
        paymentMade,
        promisedDate
      };
      
      console.log('Sending request to backend:', {
        url: `${API_BASE_URL}/customers/${existingCustomer._id}/contact`,
        body: requestBody
      });
      
      // Save to backend API using the contact endpoint
      const response = await fetch(`${API_BASE_URL}/customers/${existingCustomer._id}/contact`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });
      
      const result = await response.json();
      console.log('Backend response:', result);
      
      if (result.success) {
        console.log('Customer updated successfully in database');
        
        // Refetch all customers from backend to get the latest data
        await fetchCustomers();
      } else {
        console.error('Failed to update customer:', result.message);
      }
    } catch (error) {
      console.error('Error saving customer details to backend:', error);
      alert('Failed to save customer details. Please try again.');
    }
  };

  // Get completed payments from contacted customers
  const getCompletedPayments = () => {
    return contactedCustomers
      .filter(customer => customer.status === "COMPLETED")
      .map(customer => ({
        name: customer.name,
        date: customer.date,
        accountNumber: customer.accountNumber
      }));
  };

  // Calculate weekly calls based on contact history (Monday to Sunday)
  // Using useMemo to recalculate when contactedCustomers changes
  const weeklyCalls = useMemo(() => {
    const calls = [0, 0, 0, 0, 0, 0, 0]; // Mon, Tue, Wed, Thu, Fri, Sat, Sun
    const today = new Date();
    today.setHours(23, 59, 59, 999); // Set to end of today
    
    // Get the start of the week (7 days ago from today)
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(today.getDate() - 6); 
    sevenDaysAgo.setHours(0, 0, 0, 0);

    // Count calls from contacted customers' contact history
    contactedCustomers.forEach(customer => {
      if (customer.contactHistory && customer.contactHistory.length > 0) {
        customer.contactHistory.forEach(contact => {
          // Parse contact date (DD/MM/YYYY format)
          const [day, month, year] = contact.date.split('/');
          const contactDate = new Date(year, month - 1, day);
          contactDate.setHours(12, 0, 0, 0); 
          
          // Check if contact is within last 7 days
          if (contactDate >= sevenDaysAgo && contactDate <= today) {
            const dayOfWeek = contactDate.getDay(); // 0 = Sunday, 6 = Saturday
            // Convert to Monday-first format: Mon=0, Tue=1, ..., Sun=6
            const mondayFirstIndex = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
            calls[mondayFirstIndex]++;
          }
        });
      }
    });

    return calls;
  }, [contactedCustomers]); 

  const userData = {
    name: "Caller",
    avatar: "https://via.placeholder.com/80",
    weeklyCalls: weeklyCalls,
    completedPayments: getCompletedPayments(),
  };

  // Get all customers with promised payment dates (excluding completed payments)
  // Using useMemo to ensure it recalculates when contactedCustomers changes
  const promisedPayments = useMemo(() => {
    const paymentsWithDates = [];
    
    contactedCustomers.forEach(customer => {
      // Only include customers with PENDING status (not COMPLETED)
      if (customer.status === "PENDING" && customer.contactHistory && customer.contactHistory.length > 0) {
        const latestContact = customer.contactHistory[customer.contactHistory.length - 1];
        if (latestContact.promisedDate) {
          paymentsWithDates.push({
            accountNumber: customer.accountNumber,
            name: customer.name,
            contactNumber: customer.contactNumber,
            amountOverdue: customer.amountOverdue,
            promisedDate: latestContact.promisedDate,
          });
        }
      }
    });
    
    return paymentsWithDates;
  }, [contactedCustomers]);

  return (
    <div className="caller-dashboard">
      <div className="dashboard-header">
        <h1>Caller Dashboard</h1>
         <p className="tasks-subtitle">Overview</p>
      </div>

      <div className="dashboard-layout">
        <div className="dashboard-main">
          <DashboardStats stats={stats} />
          <ContactedCustomersTable 
            customers={contactedCustomers} 
            onSaveDetails={handleSaveCustomerDetails}
          />
          <OverduePaymentsTable 
            payments={overduePayments} 
            onSaveDetails={handleSaveCustomerDetails}
          />
        </div>
        
        <div className="dashboard-sidebar">
          <UserProfile 
            user={userData} 
            promisedPayments={promisedPayments}
            onAcceptRequest={handleAcceptRequest}
          />
        </div>
      </div>
    </div>
  );
}

export default CallerDashboard;
