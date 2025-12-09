import React, { useState, useEffect } from 'react';
import "./CallerStatisticsTable.css";
import API_BASE_URL from "../config/api";

function CallerStatisticsTable() {
  const [statistics, setStatistics] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStatistics();
  }, []);

  const fetchStatistics = async () => {
    try {
      setLoading(true);
      // Fetch all callers
      const callersResponse = await fetch(`${API_BASE_URL}/api/callers`);
      const callersResult = await callersResponse.json();
      
      if (callersResult.success && callersResult.data) {
        // Fetch all customers
        const customersResponse = await fetch(`${API_BASE_URL}/api/customers`);
        const customersResult = await customersResponse.json();
        
        if (customersResult.success && customersResult.data) {
          // Calculate statistics for each caller
          const stats = callersResult.data.map(caller => {
            // Get customers assigned to this caller
            const assignedCustomers = customersResult.data.filter(
              c => c.assignedTo && c.assignedTo._id === caller._id
            );
            
            // Count total calls from contact history
            let totalCalls = 0;
            let successful = 0;
            let pending = 0;
            let failed = 0;
            
            assignedCustomers.forEach(customer => {
              if (customer.contactHistory && customer.contactHistory.length > 0) {
                totalCalls += customer.contactHistory.length;
                
                // Count by outcome
                customer.contactHistory.forEach(contact => {
                  if (contact.outcome === 'Spoke to Customer') {
                    successful++;
                  } else if (contact.outcome === 'No Answer' || contact.outcome === 'Left Voicemail') {
                    pending++;
                  } else {
                    failed++;
                  }
                });
              }
            });
            
            // Count completed payments
            const completedCount = assignedCustomers.filter(c => c.status === 'COMPLETED').length;
            
            return {
              Caller: caller.name,
              CallerId: caller.callerId,
              Total_Calls: totalCalls,
              Successful: successful,
              Pending: pending,
              Failed: failed,
              Completed: completedCount
            };
          });
          
          setStatistics(stats);
        }
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching statistics:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="table-card">
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
          <p>Loading statistics...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="table-card">
        <table className="statistics-table">
          <thead>
            <tr>
              <th>Caller</th>
              <th>Caller ID</th>
              <th>Total Calls</th>
              <th>Successful</th>
              <th>Pending</th>
              <th>Failed</th>
              <th>Completed</th>
            </tr>
          </thead>
          <tbody>
            {statistics.length > 0 ? (
              statistics.map((item) => (
                <tr key={item.CallerId}>
                  <td>{item.Caller}</td>
                  <td>{item.CallerId}</td>
                  <td>{item.Total_Calls}</td>
                  <td style={{ color: '#4CAF50', fontWeight: 'bold' }}>{item.Successful}</td>
                  <td style={{ color: '#FF9800', fontWeight: 'bold' }}>{item.Pending}</td>
                  <td style={{ color: '#f44336', fontWeight: 'bold' }}>{item.Failed}</td>
                  <td style={{ color: '#2196F3', fontWeight: 'bold' }}>{item.Completed}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
                  <i className="bi bi-inbox" style={{ fontSize: '48px', display: 'block', marginBottom: '10px' }}></i>
                  No statistics available
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}

export default CallerStatisticsTable;