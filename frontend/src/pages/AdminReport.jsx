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
import { secureFetch } from "../utils/api";
import { useTheme } from '../context/ThemeContext';
import { showError } from '../components/Notifications';
import logger from '../utils/logger';

function AdminReport() {
  const { darkMode } = useTheme();
  // State for dropdown selection per caller row
  const [reportDropdownState, setReportDropdownState] = useState({});
  const [stats, setStats] = useState({
    totalCalls: 0,
    successfulCalls: 0,
    totalPayments: 0,
    pendingPayments: 0,
    activeCallers: 0,
    completedRequests: 0
  });
  const [completedRequests, setCompletedRequests] = useState([]);
  const [performanceReports, setPerformanceReports] = useState([]);
  const [allCallers, setAllCallers] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCallerId, setSelectedCallerId] = useState('');
  const [selectedReportId, setSelectedReportId] = useState('');


  // Fetch all performance reports submitted by callers
  const fetchPerformanceReports = async () => {
    try {
      const response = await secureFetch(`/api/reports`);
      const result = await response.json();
      if (result.success && result.data) {
        setPerformanceReports(result.data);
      }
    } catch (error) {
      logger.error('Error fetching performance reports:', error);
    }
  };

  // Fetch all callers for report list
  const fetchAllCallers = async () => {
    try {
      logger.info('Fetching all callers...');
      const response = await secureFetch(`/api/callers`);
      const result = await response.json();
      logger.info('Callers response summary loaded');

      // Handle both array response and {success, data} response
      if (Array.isArray(result)) {
        setAllCallers(result);
      } else if (result.success && result.data) {
        setAllCallers(result.data);
      } else {
        logger.error('Unexpected callers response format:', result);
      }
    } catch (error) {
      logger.error('Error fetching callers:', error);
    }
  };

  useEffect(() => {
    fetchReportData();
    fetchCompletedRequests();
    fetchPendingRequests();
    fetchPerformanceReports();
    fetchAllCallers();
  }, []);

  // Set default selected caller and report when reports change
  useEffect(() => {
    if (performanceReports.length > 0) {
      // Get unique caller IDs from reports
      const uniqueCallerIds = [...new Set(performanceReports.map(r => r.caller?._id).filter(Boolean))];
      if (uniqueCallerIds.length > 0) {
        setSelectedCallerId(uniqueCallerIds[0]);
      } else {
        setSelectedCallerId('');
      }
    } else {
      setSelectedCallerId('');
    }
  }, [performanceReports]);

  // Set default selected report for selected caller
  useEffect(() => {
    if (selectedCallerId) {
      const callerReports = performanceReports.filter(r => r.caller && r.caller._id === selectedCallerId);
      if (callerReports.length > 0) {
        // Most recent
        const sorted = callerReports.sort((a, b) => new Date(b.generatedDate) - new Date(a.generatedDate));
        setSelectedReportId(sorted[0].reportId);
      } else {
        setSelectedReportId('');
      }
    } else {
      setSelectedReportId('');
    }
  }, [selectedCallerId, performanceReports]);

  const fetchReportData = async () => {
    try {
      setLoading(true);

      // Fetch all customers to calculate statistics
      const customersResponse = await secureFetch(`/api/customers`);
      const customersResult = await customersResponse.json();

      // Fetch all callers to get active caller count
      const callersResponse = await secureFetch(`/api/callers`);
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
          completedRequests: 0
        });
      }

      setLoading(false);
    } catch (error) {
      setLoading(false);
    }
  };

  const fetchCompletedRequests = async () => {
    try {
      const response = await secureFetch(`/api/requests?status=COMPLETED`);
      const result = await response.json();

      if (result.success && result.data) {
        setCompletedRequests(result.data);
        setStats(prev => ({
          ...prev,
          completedRequests: result.data.length
        }));
      }
    } catch (error) {
      // Error handling
    }
  };

  const fetchPendingRequests = async () => {
    try {
      const response = await secureFetch(`/api/requests?status=ACCEPTED`);
      const result = await response.json();

      // Handle both array response and {success, data} response
      if (Array.isArray(result)) {
        setPendingRequests(result);
      } else if (result.success && result.data) {
        setPendingRequests(result.data);
      }
    } catch (error) {
      // Error handling
    }
  };


  // Download selected report for selected caller as CSV
  const handleDownloadExcel = () => {
    if (!performanceReports.length) {
      showError('No performance reports to download.');
      return;
    }
    if (!selectedCallerId) {
      showError('Please select a caller.');
      return;
    }
    if (!selectedReportId) {
      showError('Please select a report.');
      return;
    }
    const report = performanceReports.find(r => r.reportId === selectedReportId && r.caller && r.caller._id === selectedCallerId);
    if (!report) {
      showError('Selected report not found.');
      return;
    }
    const rows = getReportRows(report);
    if (!rows.length) {
      showError('No customer analytics found in selected report.');
      return;
    }
    downloadRowsAsCSV(rows, `performance_report_${report.reportId}.csv`);
  };

  // Download a single report as CSV
  const handleDownloadSingleReport = (report) => {
    const rows = getReportRows(report);
    if (!rows.length) {
      showError('No customer analytics found in this report.');
      return;
    }
    downloadRowsAsCSV(rows, `performance_report_${report.reportId}.csv`);
  };

  // Helper: get all rows for a report
  function getReportRows(report) {
    let rows = [];
    if (Array.isArray(report.customerDetails) && report.customerDetails.length > 0) {
      report.customerDetails.forEach(cust => {
        if (Array.isArray(cust.responses) && cust.responses.length > 0) {
          cust.responses.forEach(resp => {
            rows.push({
              reportId: report.reportId,
              callerName: report.caller?.name || '-',
              reportType: report.reportType,
              generatedDate: report.generatedDate,
              taskId: cust.taskId,
              accountNumber: cust.accountNumber,
              name: cust.name,
              contactNumber: cust.contactNumber,
              status: cust.status,
              payment: cust.payment,
              amountOverdue: cust.amountOverdue,
              daysOverdue: cust.daysOverdue,
              totalContacts: cust.totalContacts,
              responseDate: resp.date,
              responseOutcome: resp.outcome,
              responseRemark: resp.remark,
              responsePromisedDate: resp.promisedDate
            });
          });
        } else {
          rows.push({
            reportId: report.reportId,
            callerName: report.caller?.name || '-',
            reportType: report.reportType,
            generatedDate: report.generatedDate,
            taskId: cust.taskId,
            accountNumber: cust.accountNumber,
            name: cust.name,
            contactNumber: cust.contactNumber,
            status: cust.status,
            payment: cust.payment,
            amountOverdue: cust.amountOverdue,
            daysOverdue: cust.daysOverdue,
            totalContacts: cust.totalContacts,
            responseDate: '',
            responseOutcome: '',
            responseRemark: '',
            responsePromisedDate: ''
          });
        }
      });
    }
    return rows;
  }

  // Helper: download rows as CSV
  function downloadRowsAsCSV(rows, filename) {
    const headers = [
      'Report ID', 'Caller Name', 'Type', 'Date', 'Task ID', 'Account Number', 'Customer Name', 'Contact Number', 'Status', 'Payment', 'Amount Overdue', 'Days Overdue', 'Total Contacts', 'Response Date', 'Response Outcome', 'Response Remark', 'Response Promised Date'
    ];
    const csvRows = rows.map(row => [
      row.reportId,
      row.callerName,
      row.reportType,
      new Date(row.generatedDate).toLocaleString(),
      row.taskId,
      row.accountNumber,
      row.name,
      row.contactNumber,
      row.status,
      row.payment,
      row.amountOverdue,
      row.daysOverdue,
      row.totalContacts,
      row.responseDate,
      row.responseOutcome,
      row.responseRemark,
      row.responsePromisedDate
    ]);
    const csvContent = [headers, ...csvRows]
      .map(row => row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

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
              <div className='requests-table' style={{ maxHeight: 340, overflowY: 'auto', minWidth: 0 }}>
                <table style={{ minWidth: 900 }}>
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
                      const progress = request.customers_sent > 0
                        ? Math.round((request.customers_contacted / request.customers_sent) * 100)
                        : 0;
                      return (
                        <tr key={request.id || request.task_id}>
                          <td style={{ fontFamily: 'monospace', fontSize: '0.9em' }}>{request.task_id}</td>
                          <td>{request.caller?.name || request.caller_name}</td>
                          <td>{new Date(request.sent_date).toLocaleDateString()}</td>
                          <td>{request.customers_sent}</td>
                          <td>{request.customers_contacted}</td>
                          <td>
                            <div className="progress-bar-container">
                              <div className="progress-bar-fill" style={{ width: `${progress}%` }}></div>
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
              <div className='requests-table' style={{ maxHeight: 340, overflowY: 'auto', minWidth: 0 }}>
                <table style={{ minWidth: 900 }}>
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
                      <tr key={request.id || request.task_id}>
                        <td style={{ fontFamily: 'monospace', fontSize: '0.9em' }}>{request.task_id}</td>
                        <td>{request.caller?.name || request.caller_name}</td>
                        <td>{new Date(request.sent_date).toLocaleDateString()}</td>
                        <td>{request.customers_sent}</td>
                        <td>{request.customers_contacted}</td>
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

          {/* Report List Section - Show all reports that are sent */}
          <div className='report-list-section' >
            <h3 style={{ marginBottom: '15px' }}>Performance Reports</h3>
            <div style={{ maxHeight: 340, overflow: 'auto', minWidth: 0 }}>
              <table style={{ width: '100%', minWidth: 900, borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: darkMode ? '#2d3748' : '#e9ecef' }}>
                    <th style={{ padding: '8px', border: darkMode ? '1px solid #4a5568' : '1px solid #ddd' }}>Caller</th>
                    <th style={{ padding: '8px', border: darkMode ? '1px solid #4a5568' : '1px solid #ddd' }}>Caller ID</th>
                    <th style={{ padding: '8px', border: darkMode ? '1px solid #4a5568' : '1px solid #ddd' }}>Report ID</th>
                    <th style={{ padding: '8px', border: darkMode ? '1px solid #4a5568' : '1px solid #ddd' }}>Sent</th>
                    <th style={{ padding: '8px', border: darkMode ? '1px solid #4a5568' : '1px solid #ddd' }}>Download</th>
                  </tr>
                </thead>
                <tbody>
                  {performanceReports.length > 0 ? (
                    // Group reports by caller
                    (() => {
                      // Extract unique callers from reports
                      const callerMap = new Map();
                      performanceReports.forEach(report => {
                        if (report.caller) {
                          const callerId = report.caller.callerId || report.caller._id;
                          if (!callerMap.has(callerId)) {
                            callerMap.set(callerId, {
                              name: report.caller.name,
                              callerId: callerId,
                              _id: report.caller._id
                            });
                          }
                        }
                      });

                      const uniqueCallers = Array.from(callerMap.values());

                      return uniqueCallers.map((caller, idx) => {
                        const callerId = caller.callerId || caller._id;
                        const callerReports = performanceReports.filter(r =>
                          r.caller && String(r.caller.callerId || r.caller._id) === String(callerId)
                        );

                        if (callerReports.length === 1) {
                          const report = callerReports[0];
                          return (
                            <tr key={report._id || `${callerId}-0`}>
                              <td style={{ padding: '8px', border: '1px solid #ddd' }}>{caller.name}</td>
                              <td style={{ padding: '8px', border: '1px solid #ddd', fontFamily: 'monospace', fontSize: '0.95em' }}>{callerId}</td>
                              <td style={{ padding: '8px', border: '1px solid #ddd', fontFamily: 'monospace', fontSize: '0.95em' }}>{report.reportId || '-'}</td>
                              <td style={{ padding: '8px', border: '1px solid #ddd', color: '#28a745', fontWeight: 500 }}>Submitted</td>
                              <td style={{ padding: '8px', border: '1px solid #ddd' }}>
                                <button onClick={() => handleDownloadSingleReport(report)} style={{ padding: '4px 14px', background: '#1488ee', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.95em' }}>Download</button>
                              </td>
                            </tr>
                          );
                        } else {
                          // Multiple reports: show dropdown
                          if (!reportDropdownState[callerId]) {
                            const sorted = [...callerReports].sort((a, b) => new Date(b.generatedDate) - new Date(a.generatedDate));
                            setReportDropdownState(prev => ({ ...prev, [callerId]: sorted[0].reportId }));
                            return null;
                          }
                          const selectedReportId = reportDropdownState[callerId];
                          const sortedReports = [...callerReports].sort((a, b) => new Date(b.generatedDate) - new Date(a.generatedDate));
                          return (
                            <tr key={callerId}>
                              <td style={{ padding: '8px', border: '1px solid #ddd' }}>{caller.name}</td>
                              <td style={{ padding: '8px', border: '1px solid #ddd', fontFamily: 'monospace', fontSize: '0.95em' }}>{callerId}</td>
                              <td style={{ padding: '8px', border: '1px solid #ddd' }}>
                                <select
                                  value={selectedReportId}
                                  onChange={e => setReportDropdownState(prev => ({ ...prev, [callerId]: e.target.value }))}
                                  style={{ padding: '4px 10px', fontSize: '0.95em', borderRadius: '4px', border: '1px solid #bbb' }}
                                >
                                  {sortedReports.map(report => (
                                    <option key={report.reportId} value={report.reportId}>
                                      {report.reportId} ({new Date(report.generatedDate).toLocaleString()})
                                    </option>
                                  ))}
                                </select>
                              </td>
                              <td style={{ padding: '8px', border: '1px solid #ddd', color: '#28a745', fontWeight: 500 }}>Submitted</td>
                              <td style={{ padding: '8px', border: '1px solid #ddd' }}>
                                <button
                                  onClick={() => {
                                    const report = callerReports.find(r => r.reportId === selectedReportId);
                                    if (report) handleDownloadSingleReport(report);
                                  }}
                                  style={{ padding: '4px 14px', background: '#1488ee', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.95em' }}
                                >
                                  Download
                                </button>
                              </td>
                            </tr>
                          );
                        }
                      });
                    })()
                  ) : (
                    <tr>
                      <td colSpan="5" style={{ padding: '20px', textAlign: 'center', color: '#999' }}>
                        No performance reports submitted yet
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
          {/* Download All Reports as Excel Button */}
          <div style={{ textAlign: 'center', margin: '30px 0' }}>
            <button
              className='download-excel'
              onClick={() => {
                if (!performanceReports.length) {
                  showError('No performance reports to download.');
                  return;
                }
                // Gather all rows from all reports
                let allRows = [];
                performanceReports.forEach(report => {
                  const rows = getReportRows(report);
                  if (rows.length) allRows = allRows.concat(rows);
                });
                if (!allRows.length) {
                  showError('No customer analytics found in any report.');
                  return;
                }
                downloadRowsAsCSV(allRows, 'all_performance_reports.csv');
              }}
              style={{ fontSize: '1.1em', padding: '10px 30px', background: '#1488ee', color: '#fff', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
            >
              Download All Reports as Excel
            </button>
          </div>
        </>
      )
      }
    </>
  );
}

export default AdminReport;
