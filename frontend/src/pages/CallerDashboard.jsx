import React, { useState, useEffect, useMemo } from "react";
import "./CallerDashboard.css";
import DashboardStats from "../components/DashboardStats";
import ContactedCustomersTable from "../components/ContactedCustomersTable";
import OverduePaymentsTable from "../components/OverduePaymentsTable";
import UserProfile from "../components/UserProfile";

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

  // Initialize with sample data
  useEffect(() => {
    // Check if data exists in localStorage
    const storedContacted = localStorage.getItem('contactedCustomers');
    const storedOverdue = localStorage.getItem('overduePayments');
    
    if (storedContacted && storedOverdue) {
      // Load from localStorage if available
      const contacted = JSON.parse(storedContacted);
      const overdue = JSON.parse(storedOverdue);
      setContactedCustomers(contacted);
      setOverduePayments(overdue);
      updateStats(contacted, overdue);
    } else {
      // Simulate loading data from backend
      const today = new Date();
      const todayString = `${String(today.getDate()).padStart(2, '0')}/${String(today.getMonth() + 1).padStart(2, '0')}/${today.getFullYear()}`;
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowString = `${String(tomorrow.getDate()).padStart(2, '0')}/${String(tomorrow.getMonth() + 1).padStart(2, '0')}/${tomorrow.getFullYear()}`;
      
      // Get dates from this week for call history
      // Today is the current date (for calls made today)
      const callDate1 = new Date(today); // Today
      const callDate1String = `${String(callDate1.getDate()).padStart(2, '0')}/${String(callDate1.getMonth() + 1).padStart(2, '0')}/${callDate1.getFullYear()}`;
      
      // Yesterday
      const callDate2 = new Date(today);
      callDate2.setDate(today.getDate() - 1);
      const callDate2String = `${String(callDate2.getDate()).padStart(2, '0')}/${String(callDate2.getMonth() + 1).padStart(2, '0')}/${callDate2.getFullYear()}`;

      const initialContactedCustomers = [
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
              date: callDate1String, 
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
              date: callDate2String, 
              outcome: "Spoke to Customer", 
              response: "Will pay after receiving salary", 
              promisedDate: tomorrowString,
              paymentMade: true 
            }
          ]
        },
      ];

      const initialOverduePayments = [
        {
          id: 3,
          accountNumber: "1003",
          name: "Kumar Singh",
          date: todayString,
          status: "OVERDUE",
          response: "Not Contacted Yet",
          contactNumber: "070 454 5457",
          amountOverdue: "Rs.2000",
          daysOverdue: "16",
          previousResponse: "No previous contact",
          contactHistory: []
        },
        {
          id: 4,
          accountNumber: "1004",
          name: "Ash Kumar",
          date: todayString,
          status: "OVERDUE",
          response: "Not Contacted Yet",
          contactNumber: "070 789 4561",
          amountOverdue: "Rs.3500",
          daysOverdue: "22",
          previousResponse: "No previous contact",
          contactHistory: []
        },
        {
          id: 5,
          accountNumber: "1005",
          name: "Priya Singh",
          date: todayString,
          status: "OVERDUE",
          response: "Not Contacted Yet",
          contactNumber: "070 456 7890",
          amountOverdue: "Rs.1800",
          daysOverdue: "12",
          previousResponse: "No previous contact",
          contactHistory: []
        },
      ];

      setContactedCustomers(initialContactedCustomers);
      setOverduePayments(initialOverduePayments);
      updateStats(initialContactedCustomers, initialOverduePayments);
      
      // Save to localStorage
      localStorage.setItem('contactedCustomers', JSON.stringify(initialContactedCustomers));
      localStorage.setItem('overduePayments', JSON.stringify(initialOverduePayments));
    }
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
  const handleAcceptRequest = (customersData) => {
    // customersData can be a single customer object or an array of customers
    const customersArray = Array.isArray(customersData) ? customersData : [customersData];
    
    // Add all accepted customers with OVERDUE status
    const customersWithOverdueStatus = customersArray.map(customer => ({
      ...customer,
      status: "OVERDUE"
    }));
    
    // Add to overdue payments list (they will be OVERDUE until contacted)
    setOverduePayments(prevOverduePayments => {
      const newOverduePayments = [...prevOverduePayments, ...customersWithOverdueStatus];
      // Update stats with the new data
      updateStats(contactedCustomers, newOverduePayments);
      // Save to localStorage so CallerTasks can see the new customers
      localStorage.setItem('overduePayments', JSON.stringify(newOverduePayments));
      console.log(`${customersArray.length} customer(s) added from admin request`);
      
      // Save to localStorage for Tasks page
      localStorage.setItem('overduePayments', JSON.stringify(newOverduePayments));
      
      return newOverduePayments;
    });
  };

  // Handle saving customer details from modal
  const handleSaveCustomerDetails = (accountNumber, data) => {
    const { callOutcome, customerResponse, paymentMade, promisedDate } = data;
    
    // Check if customer is in overdue list
    const overdueCustomer = overduePayments.find(p => p.id === accountNumber);
    
    if (overdueCustomer) {
      
      // status from OVERDUE to PENDING or COMPLETED
      const updatedCustomer = {
        ...overdueCustomer,
        status: paymentMade ? "COMPLETED" : "PENDING",
        response: customerResponse,
        previousResponse: customerResponse,
        contactHistory: [
          ...overdueCustomer.contactHistory,
          {
            date: formatDate(new Date()),
            outcome: callOutcome,
            response: customerResponse,
            promisedDate: promisedDate,
            paymentMade: paymentMade
          }
        ]
      };

      // Remove from overdue (status is no longer OVERDUE)
      const newOverduePayments = overduePayments.filter(p => p.id !== accountNumber);
      
      // Add to contacted (status is now PENDING or COMPLETED)
      const newContactedCustomers = [...contactedCustomers, updatedCustomer];

      setOverduePayments(newOverduePayments);
      setContactedCustomers(newContactedCustomers);
      updateStats(newContactedCustomers, newOverduePayments);
      
      // Save to localStorage
      localStorage.setItem('contactedCustomers', JSON.stringify(newContactedCustomers));
      localStorage.setItem('overduePayments', JSON.stringify(newOverduePayments));
    } else {
      // Update existing contacted customer (already PENDING or COMPLETED)
      const newContactedCustomers = contactedCustomers.map(c => {
        if (c.id === accountNumber) {
          const updated = {
            ...c,
            status: paymentMade ? "COMPLETED" : "PENDING",
            response: customerResponse,
            previousResponse: customerResponse,
            contactHistory: [
              ...c.contactHistory,
              {
                date: formatDate(new Date()),
                outcome: callOutcome,
                response: customerResponse,
                promisedDate: promisedDate,
                paymentMade: paymentMade
              }
            ]
          };
          return updated;
        }
        return c;
      });

      setContactedCustomers(newContactedCustomers);
      updateStats(newContactedCustomers, overduePayments);
      
      // Save to localStorage
      localStorage.setItem('contactedCustomers', JSON.stringify(newContactedCustomers));
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
