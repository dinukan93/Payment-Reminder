import React, { useState, useEffect } from 'react';
import "../components/SearchBar.css";
import "./Report.css";
import { LuPhoneCall } from "react-icons/lu";
import { MdVerified } from "react-icons/md";
import { BsCashCoin } from "react-icons/bs";
import { IoIosWarning } from "react-icons/io";
import { IoSend } from "react-icons/io5";
import CallerStatisticsTable from '../components/CallerStatisticsTable';
import API_BASE_URL from "../config/api";

function Report() {
  const [stats, setStats] = useState({
    totalCalls: 0,
    successfulCalls: 0,
    totalPayments: 0,
    pendingPayments: 0,
    successRate: 0,
    completionRate: 0
  });
  const [completedRequests, setCompletedRequests] = useState([]);
  const [customerDetails, setCustomerDetails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sendingReport, setSendingReport] = useState(false);
  const [reportType, setReportType] = useState('daily');

  useEffect(() => {
    fetchReportData();
    fetchCompletedRequests();
  }, []);

  const fetchReportData = async () => {
    try {
      setLoading(true);
      
      // Get logged-in caller ID
      const userData = JSON.parse(localStorage.getItem('userData') || '{}');
      const callerId = userData.id;
      
      // Fetch only this caller's customers
      const response = await fetch(`${API_BASE_URL}/api/customers?callerId=${callerId}`);
      const result = await response.json();
      
      if (result.success && result.data) {
        const customers = result.data;
        
        // Calculate total calls from all contact histories
        let totalCalls = 0;
        let successfulCalls = 0;
        
        customers.forEach(customer => {
          if (customer.contactHistory && customer.contactHistory.length > 0) {
            totalCalls += customer.contactHistory.length;
            
            // Count successful calls (Spoke to Customer)
            customer.contactHistory.forEach(contact => {
              if (contact.outcome === 'Spoke to Customer') {
                successfulCalls++;
              }
            });
          }
        });
        
        // Count payments
        const totalPayments = customers.filter(c => c.status === 'COMPLETED').length;
        const pendingPayments = customers.filter(c => c.status === 'PENDING').length;
        
        // Calculate rates
        const successRate = totalCalls > 0 ? ((successfulCalls / totalCalls) * 100).toFixed(1) : 0;
        const totalCustomers = customers.length;
        const completionRate = totalCustomers > 0 ? ((totalPayments / totalCustomers) * 100).toFixed(1) : 0;
        
        setStats({
          totalCalls,
          successfulCalls,
          totalPayments,
          pendingPayments,
          successRate,
          completionRate
        });
        
        // Prepare detailed customer list
        const details = customers.map(customer => {
          const latestContact = customer.contactHistory && customer.contactHistory.length > 0
            ? customer.contactHistory[customer.contactHistory.length - 1]
            : null;
          // Include all analytics for each customer
          return {
            taskId: customer.taskId || 'N/A',
            accountNumber: customer.accountNumber,
            name: customer.name,
            contactNumber: customer.contactNumber,
            amountOverdue: customer.amountOverdue,
            daysOverdue: customer.daysOverdue,
            status: customer.status,
            lastContactDate: latestContact?.contactDate || 'Not contacted',
            lastContactOutcome: latestContact?.outcome || 'N/A',
            lastResponse: latestContact?.remark || 'N/A',
            promisedDate: latestContact?.promisedDate || 'N/A',
            totalContacts: customer.contactHistory?.length || 0,
            payment: customer.status === 'COMPLETED' ? 'Paid' : 'Unpaid',
            responses: customer.contactHistory?.map(ch => ({
              date: ch.contactDate,
              outcome: ch.outcome,
              remark: ch.remark,
              promisedDate: ch.promisedDate
            })) || []
          };
        }).sort((a, b) => {
          // Sort by status: COMPLETED, PENDING, OVERDUE
          const statusOrder = { 'COMPLETED': 0, 'PENDING': 1, 'OVERDUE': 2 };
          return statusOrder[a.status] - statusOrder[b.status];
        });
        
        setCustomerDetails(details);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching report data:', error);
      setLoading(false);
    }
  };

  const fetchCompletedRequests = async () => {
    try {
      // Get logged-in caller ID
      const userData = JSON.parse(localStorage.getItem('userData') || '{}');
      const callerId = userData.id;
      
      // Fetch only this caller's completed requests
      const response = await fetch(`${API_BASE_URL}/api/requests?callerId=${callerId}&status=COMPLETED`);
      const result = await response.json();
      
      if (result.success && result.data) {
        setCompletedRequests(result.data);
      }
    } catch (error) {
      console.error('Error fetching completed requests:', error);
    }
  };

  // Download all customer analytics as CSV
  const handleDownloadExcel = () => {
    if (!customerDetails.length) {
      alert('No customer data to download.');
      return;
    }
    // Define headers for all analytics
    const headers = [
      'Task ID',
      'Account Number',
      'Customer Name',
      'Contact Number',
      'Status',
      'Payment',
      'Amount Overdue',
      'Days Overdue',
      'Total Contacts',
      'Last Contact Date',
      'Last Outcome',
      'Last Response',
      'Promised Date',
      'Responses (History)'
    ];
    const rows = customerDetails.map(cust => [
      cust.taskId,
      cust.accountNumber,
      cust.name,
      cust.contactNumber,
      cust.status,
      cust.payment,
      cust.amountOverdue,
      cust.daysOverdue,
      cust.totalContacts,
      cust.lastContactDate,
      cust.lastContactOutcome,
      cust.lastResponse,
      cust.promisedDate,
      // Flatten responses as a string
      (cust.responses && cust.responses.length > 0)
        ? cust.responses.map(r => `Date: ${r.date || ''} | Outcome: ${r.outcome || ''} | Remark: ${r.remark || ''} | Promised: ${r.promisedDate || ''}`).join(' || ')
        : ''
    ]);
    const csvContent = [headers, ...rows]
      .map(row => row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'customer_analytics_report.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleSendReportToAdmin = async () => {
    try {
      setSendingReport(true);
      // Get logged-in caller ID
      const userData = JSON.parse(localStorage.getItem('userData') || '{}');
      const callerId = userData.id;
      if (!callerId) {
        alert('Error: Caller ID not found');
        setSendingReport(false);
        return;
      }
      // Send all analytics (stats and customerDetails) in the report
      const reportPayload = {
        reportType,
        stats,
        customerDetails
      };
      const response = await fetch(`${API_BASE_URL}/api/callers/${callerId}/report`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(reportPayload)
      });
      const result = await response.json();
      if (result.success) {
        alert(`${reportType.charAt(0).toUpperCase() + reportType.slice(1)} performance report sent to admin successfully!\n\nReport ID: ${result.data.reportId}`);
        console.log(' Report generated:', result.data);
      } else {
        alert('Failed to send report: ' + result.message);
      }
      setSendingReport(false);
    } catch (error) {
      console.error('Error sending report:', error);
      alert(' Error sending report to admin');
      setSendingReport(false);
    }
  };

  return (
    <>
      <div className="title">My Performance Report</div>
      <hr />
      
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '4px solid #f3f3f3',
            borderTop: '4px solid #1488ee',
            borderRadius: '50%',
            margin: '0 auto 20px',
            animation: 'spin 1s linear infinite'
          }}></div>
          <p>Loading report data...</p>
        </div>
      ) : (
        <>
          <div className="widgets">
            <div className="total-calls">
              <h4>Total Calls</h4>
              <h3>{stats.totalCalls}</h3>
              <LuPhoneCall className='totalCall-icon' />
            </div>
            <div className="sucessful-calls">
              <h4>Successful Calls</h4>
              <h3>{stats.successfulCalls}</h3>
              <p style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>Success Rate: {stats.successRate}%</p>
              <MdVerified className='verified-icon' />
            </div>
            <div className="total-payments">
              <h4>Total Payments</h4>
              <h3>{stats.totalPayments}</h3>
              <p style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>Completion: {stats.completionRate}%</p>
              <BsCashCoin className='totalpay-icon' />
            </div>
            <div className="pending-payments">
              <h4>Pending Payments</h4>
              <h3>{stats.pendingPayments}</h3>
              <IoIosWarning className='pending-icon' />
            </div>
          </div>
          
          {/* Send Report to Admin Section */}
          <div className='send-report-section'>
            <h3>Send Performance Report to Admin</h3>
            <div className='send-report-controls'>
              <select 
                value={reportType} 
                onChange={(e) => setReportType(e.target.value)}
                className='report-type'
              >
                <option value="daily">Daily Report</option>
                <option value="weekly">Weekly Report</option>
                <option value="monthly">Monthly Report</option>
              </select>
              <button 
                className='send-report-btn' 
                onClick={handleSendReportToAdmin}
                disabled={sendingReport}
              >
                {sendingReport ? (
                  <>
                    <span className="spinner-small"></span>
                    Sending...
                  </>
                ) : (
                  <>
                    <IoSend style={{ marginRight: '8px' }} />
                    Send Report to Admin
                  </>
                )}
              </button>
            </div>
            <p className='report-note'>
              📊 This will send a detailed performance report including all customer interactions, call statistics, and completion rates to the admin.
            </p>
          </div>

          {/* Customer Details Performance Log */}
          <div className='customer-performance-log'>
            <h3>Detailed Customer Performance Log</h3>
            <div className='performance-table-container'>
              <table className='performance-table'>
                <thead>
                  <tr>
                    <th>Task ID</th>
                    <th>Account Number</th>
                    <th>Customer Name</th>
                    <th>Status</th>
                    <th>Total Contacts</th>
                    <th>Last Contact Date</th>
                    <th>Last Outcome</th>
                    <th>Last Response</th>
                    <th>Promised Date</th>
                    <th>Amount Overdue</th>
                  </tr>
                </thead>
                <tbody>
                  {customerDetails.length > 0 ? (
                    customerDetails.map((customer, index) => (
                      <tr key={index}>
                        <td>
                          <span style={{ 
                            fontSize: '0.85em', 
                            fontFamily: 'monospace',
                            color: '#666',
                            backgroundColor: '#f0f0f0',
                            padding: '2px 6px',
                            borderRadius: '3px',
                            display: 'inline-block'
                          }}>
                            {customer.taskId || 'N/A'}
                          </span>
                        </td>
                        <td>{customer.accountNumber}</td>
                        <td>{customer.name}</td>
                        <td>
                          <span className={`status-badge ${customer.status.toLowerCase()}`}>
                            {customer.status}
                          </span>
                        </td>
                        <td>{customer.totalContacts}</td>
                        <td>{customer.lastContactDate}</td>
                        <td>{customer.lastContactOutcome}</td>
                        <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {customer.lastResponse}
                        </td>
                        <td>{customer.promisedDate}</td>
                        <td>{customer.amountOverdue}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="10" style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
                        No customer data available
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
          
          <div className='completed-requests-section'>
            <h3>Completed Requests</h3>
            {completedRequests.length > 0 ? (
              <div className='requests-table'>
                <table>
                  <thead>
                    <tr>
                      <th>Task ID</th>
                      <th>Caller Name</th>
                      <th>Sent Date</th>
                      <th>Customers Sent</th>
                      <th>Customers Contacted</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {completedRequests.map((request) => (
                      <tr key={request._id}>
                        <td style={{ fontFamily: 'monospace', fontSize: '0.9em' }}>{request.taskId}</td>
                        <td>{request.caller?.name || request.callerName}</td>
                        <td>{request.sentDate}</td>
                        <td>{request.customersSent}</td>
                        <td>{request.customersContacted}</td>
                        <td>
                          <span className='status-badge completed'>
                            {request.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p style={{ textAlign: 'center', color: '#999', padding: '20px' }}>
                No completed requests yet
              </p>
            )}
          </div>

          <div className='download-section'>
            <select 
              value={reportType} 
              onChange={(e) => setReportType(e.target.value)}
              className='report-type'
            >
              <option value="daily">Daily Report</option>
              <option value="weekly">Weekly Report</option>
              <option value="monthly">Monthly Report</option>
            </select>
            <button className='download-excel' onClick={handleDownloadExcel}>Excel</button>
          </div>
        </>
      )}
    </>
  );
}

export default Report;