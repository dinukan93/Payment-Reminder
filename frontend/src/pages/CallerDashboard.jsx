import React, { useState, useEffect, useMemo } from "react";
import { toast } from 'react-toastify';
import "./CallerDashboard.css";
import DashboardStats from "../components/DashboardStats";
import ContactedCustomersTable from "../components/ContactedCustomersTable";
import OverduePaymentsTable from "../components/OverduePaymentsTable";
import UserProfile from "../components/UserProfile";
import API_BASE_URL from "../config/api";
import { secureFetch } from "../utils/api";

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
  const [completedCustomers, setCompletedCustomers] = useState([]);
  const fetchCustomers = async () => {
    try {
      // Get the logged-in user's ID
      const userData = JSON.parse(localStorage.getItem('userData') || '{}');
      const callerId = userData.id;
      if (!callerId) {
        console.error('No caller ID found in localStorage');
        return;
      }
      const response = await secureFetch(`/customers?callerId=${callerId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      if (data.success && data.data) {
        // Separate customers by status
        const contacted = data.data.filter(c =>
          c.status === 'PENDING' &&
          c.contactHistory &&
          c.contactHistory.length > 0
        );
        const overdue = data.data.filter(c =>
          c.status === 'OVERDUE' ||
          (c.status === 'PENDING' && (!c.contactHistory || c.contactHistory.length === 0))
        );
        const completed = data.data.filter(c => c.status === 'COMPLETED');
        // Map MongoDB _id to id for frontend compatibility
        const formattedContacted = contacted.map(c => ({ ...c, id: c._id }));
        const formattedOverdue = overdue.map(c => ({ ...c, id: c._id }));
        const formattedCompleted = completed.map(c => ({ ...c, id: c._id }));
        setContactedCustomers(formattedContacted);
        setOverduePayments(formattedOverdue);
        setCompletedCustomers(formattedCompleted);
        // Update stats with completed count from all data
        const completedCount = completed.length;
        updateStats(formattedContacted, formattedOverdue, completedCount);
      }
    } catch (error) {
      console.error('Error fetching customers from backend:', error);
      toast.error('Failed to load customer data. Please check if the backend server is running.');
    }
  };

  // Initialize by fetching from backend
  useEffect(() => {
    fetchCustomers();
  }, []);

  // Update statistics based on data
  const updateStats = (contacted, overdue, completedCount = 0) => {
    // Get all assigned customers (excluding COMPLETED)
    const allActiveCustomers = contacted.length + overdue.length;

    // Only count customers with contact history as "contacted"
    const contactedCount = contacted.length;

    const pendingCount = contacted.length + overdue.length;

    setStats([
      { type: "customers", value: allActiveCustomers.toString(), label: "Total Customers", color: "#90e4f7ff" },
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

    console.log('=== SAVING CUSTOMER DETAILS (CallerDashboard) ===');
    console.log('Account/ID:', accountNumber);
    console.log('Data:', data);

    // Check if customer is in overdue list
    const overdueCustomer = overduePayments.find(p => p.id === accountNumber);
    const existingCustomer = overdueCustomer || contactedCustomers.find(c => c.id === accountNumber);

    if (!existingCustomer) {
      console.error('Customer not found');
      toast.error('Customer not found');
      return;
    }

    console.log('Found customer:', existingCustomer.name, 'ID:', existingCustomer._id);

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
      const response = await secureFetch(`/customers/${existingCustomer._id}/contact`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      const result = await response.json();
      console.log('Backend response:', result);

      if (result.success) {
        console.log(' Customer updated successfully in database');

        // Refetch all customers from backend to get the latest data
        await fetchCustomers();
        console.log(' Customers refreshed from database');
      } else {
        console.error(' Failed to update customer:', result.message);
        toast.error('Failed to save: ' + result.message);
      }
    } catch (error) {
      console.error(' Error saving customer details to backend:', error);
      toast.error('Failed to save customer details. Please try again.');
    }
  };

  // Get completed payments for this caller
  const getCompletedPayments = () => {
    // Show all completed customers assigned to this caller
    return completedCustomers.map(customer => ({
      accountNumber: customer.accountNumber,
      name: customer.name,
      contactNumber: customer.contactNumber,
      amountPaid: customer.amountPaid || customer.amountOverdue || '-',
      paymentDate: customer.paymentDate || (customer.contactHistory && customer.contactHistory.length > 0
        ? (customer.contactHistory.find(h => h.paymentMade) ? customer.contactHistory.find(h => h.paymentMade).date : '-')
        : '-')
    }));
  };

  // Calculate weekly calls based on contact history (Monday to Sunday)
  // Use all assigned customers, including COMPLETED, for weekly calls
  const weeklyCalls = useMemo(() => {
    const calls = [0, 0, 0, 0, 0, 0, 0]; // Mon, Tue, Wed, Thu, Fri, Sat, Sun
    const today = new Date();
    today.setHours(23, 59, 59, 999); // Set to end of today
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(today.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    // Get all assigned customers from backend data (contacted, overdue, and completed)
    const allAssignedCustomers = [
      ...contactedCustomers,
      ...overduePayments,
      ...completedCustomers
    ];

    allAssignedCustomers.forEach(customer => {
      if (customer.contactHistory && customer.contactHistory.length > 0) {
        customer.contactHistory.forEach(contact => {
          if (!contact.contactDate) return;
          let contactDate;
          if (contact.contactDate.includes('/')) {
            const [day, month, year] = contact.contactDate.split('/');
            contactDate = new Date(year, month - 1, day);
          } else {
            contactDate = new Date(contact.contactDate);
          }
          contactDate.setHours(12, 0, 0, 0);
          if (contactDate >= sevenDaysAgo && contactDate <= today) {
            const dayOfWeek = contactDate.getDay(); // 0 = Sunday, 6 = Saturday
            const mondayFirstIndex = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
            calls[mondayFirstIndex]++;
          }
        });
      }
    });
    return calls;
  }, [contactedCustomers, overduePayments, completedCustomers]);

  // Get user data from localStorage
  const storedUserData = JSON.parse(localStorage.getItem('userData') || '{}');

  const userData = {
    name: storedUserData.name || "Caller",
    avatar: storedUserData.avatar,
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
