import React, { useState, useEffect } from 'react';
import "../components/SearchBar.css";
import "./Report.css";
import { LuPhoneCall } from "react-icons/lu";
import { MdVerified } from "react-icons/md";
import { BsCashCoin } from "react-icons/bs";
import { IoIosWarning } from "react-icons/io";
import { FaUserCheck } from "react-icons/fa";
import { MdPendingActions } from "react-icons/md";
import CallerStatisticsTable from '../components/CallerStatisticsTable';
import API_BASE_URL from "../config/api";

function AdminReport() {
  const [stats, setStats] = useState({
    totalCalls: 0,
    successfulCalls: 0,
    totalPayments: 0,
    pendingPayments: 0,
    activeCallers: 0,
    completedRequests: 0
  });
  const [completedRequests, setCompletedRequests] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReportData();
    fetchCompletedRequests();
    fetchPendingRequests();
  }, []);

  const fetchReportData = async () => {
    try {
      setLoading(true);
      
      // Fetch all customers to calculate statistics
      const customersResponse = await fetch(`${API_BASE_URL}/customers`);
      const customersResult = await customersResponse.json();
      
      // Fetch all callers to get active caller count
      const callersResponse = await fetch(`${API_BASE_URL}/callers`);
      const callersResult = await callersResponse.json();
      
      if (customersResult.success && customersResult.data) {
        const customers = customersResult.data;
        
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
        
        // Count active callers (those with ongoing tasks)
        const activeCallers = callersResult.success && callersResult.data 
          ? callersResult.data.filter(c => c.taskStatus === 'ONGOING').length 
          : 0;
        
        setStats({
          totalCalls,
          successfulCalls,
          totalPayments,
          pendingPayments,
          activeCallers,
          completedRequests: 0 // Will be updated by fetchCompletedRequests
        });
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching report data:', error);
      setLoading(false);
    }
  };

  const fetchCompletedRequests = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/requests/completed`);
      const result = await response.json();
      
      if (result.success && result.data) {
        setCompletedRequests(result.data);
        setStats(prev => ({
          ...prev,
          completedRequests: result.data.length
        }));
      }
    } catch (error) {
      console.error('Error fetching completed requests:', error);
    }
  };

  const fetchPendingRequests = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/requests?status=ACCEPTED`);
      const result = await response.json();
      
      if (result.success && result.data) {
        setPendingRequests(result.data);
      }
    } catch (error) {
      console.error('Error fetching pending requests:', error);
    }
  };

  const handleDownloadPDF = () => {
    alert('PDF download feature - Coming soon!');
    // TODO: Implement PDF generation
  };

  const handleDownloadExcel = () => {
    alert('Excel download feature - Coming soon!');
    // TODO: Implement Excel generation
  };

  return (
    <>
      <div className="title">Admin Report - System Overview</div>
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
              <MdVerified className='verified-icon' />
            </div>
            <div className="total-payments">
              <h4>Total Payments</h4>
              <h3>{stats.totalPayments}</h3>
              <BsCashCoin className='totalpay-icon' />
            </div>
            <div className="pending-payments">
              <h4>Pending Payments</h4>
              <h3>{stats.pendingPayments}</h3>
              <IoIosWarning className='pending-icon' />
            </div>
            <div className="active-callers">
              <h4>Active Callers</h4>
              <h3>{stats.activeCallers}</h3>
              <FaUserCheck className='active-icon' />
            </div>
            <div className="completed-requests-widget">
              <h4>Completed Requests</h4>
              <h3>{stats.completedRequests}</h3>
              <MdPendingActions className='completed-icon' />
            </div>
          </div>
          
          <div className='caller-statistics'>
            <CallerStatisticsTable />
          </div>

          <div className='requests-overview'>
            <h3>Ongoing Requests</h3>
            {pendingRequests.length > 0 ? (
              <div className='requests-table'>
                <table>
                  <thead>
                    <tr>
                      <th>Task ID</th>
                      <th>Caller Name</th>
                      <th>Sent Date</th>
                      <th>Customers Sent</th>
                      <th>Customers Contacted</th>
                      <th>Progress</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingRequests.map((request) => {
                      const progress = request.customersSent > 0 
                        ? Math.round((request.customersContacted / request.customersSent) * 100) 
                        : 0;
                      return (
                        <tr key={request._id}>
                          <td style={{ fontFamily: 'monospace', fontSize: '0.9em' }}>{request.taskId}</td>
                          <td>{request.caller?.name || request.callerName}</td>
                          <td>{request.sentDate}</td>
                          <td>{request.customersSent}</td>
                          <td>{request.customersContacted}</td>
                          <td>
                            <div className="progress-bar-container">
                              <div 
                                className="progress-bar-fill" 
                                style={{ width: `${progress}%` }}
                              ></div>
                              <span className="progress-text">{progress}%</span>
                            </div>
                          </td>
                          <td>
                            <span className='status-badge accepted'>
                              {request.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <p style={{ textAlign: 'center', color: '#999', padding: '20px' }}>
                No ongoing requests
              </p>
            )}
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
            <select name="reportType" className='report-type'>
              <option>Daily Report</option>
              <option>Weekly Report</option>
              <option>Monthly Report</option>
            </select>
            <button className='download-pdf' onClick={handleDownloadPDF}>PDF</button>
            <button className='download-excel' onClick={handleDownloadExcel}>Excel</button>
          </div>
        </>
      )}
    </>
  );
}

export default AdminReport;
