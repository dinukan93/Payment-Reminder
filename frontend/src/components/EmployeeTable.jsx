import React, { useState, useEffect } from "react";
import "./EmployeeTable.css";
import API_BASE_URL from "../config/api";
import EditEmployeeModal from "./EditEmployeeModal";
import TaskHistoryModal from "./TaskHistoryModal";

function EmployeeTable({ refreshTrigger, searchFilter = {} }) {
  const [callers, setCallers] = useState([]);
  const [filteredCallers, setFilteredCallers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedCaller, setSelectedCaller] = useState(null);

  useEffect(() => {
    fetchCallers();
  }, [refreshTrigger]);

  useEffect(() => {
    applyFilters();
  }, [callers, searchFilter]);

  const fetchCallers = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/callers`);
      const result = await response.json();
      
      if (result.success && result.data) {
        setCallers(result.data);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching callers:', error);
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...callers];
    const { searchTerm = "", filterType = "All" } = searchFilter;

    // Apply search filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(c =>
        c.name?.toLowerCase().includes(term) ||
        c.callerId?.toLowerCase().includes(term) ||
        c.email?.toLowerCase().includes(term) ||
        c.phone?.toLowerCase().includes(term)
      );
    }

    // Apply status filter
    if (filterType !== "All") {
      filtered = filtered.filter(c => c.status === filterType.toUpperCase());
    }

    setFilteredCallers(filtered);
  };

  const handleShowHistory = (caller) => {
    setSelectedCaller(caller);
    setShowHistoryModal(true);
  };

  const handleEdit = (caller) => {
    setSelectedCaller(caller);
    setShowEditModal(true);
  };

  const handleEditClose = () => {
    setShowEditModal(false);
    setSelectedCaller(null);
  };

  const handleEditSave = (updatedCaller) => {
    setCallers(callers.map(c => c._id === updatedCaller._id ? updatedCaller : c));
    alert('Employee updated successfully');
  };

  const handleHistoryClose = () => {
    setShowHistoryModal(false);
    setSelectedCaller(null);
  };

  const handleDelete = async (caller) => {
    if (window.confirm(`Are you sure you want to delete ${caller.name}?`)) {
      try {
        const response = await fetch(`${API_BASE_URL}/api/callers/${caller._id}`, {
          method: 'DELETE'
        });
        
        if (response.ok) {
          alert('Caller deleted successfully');
          fetchCallers(); // Refresh the list
        } else {
          alert('Failed to delete caller');
        }
      } catch (error) {
        console.error('Error deleting caller:', error);
        alert('Error deleting caller');
      }
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
          <p>Loading callers...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="table-card">
        <table className="employee-table">
          <thead>
            <tr>
              <th>Caller</th>
              <th>Caller ID</th>
              <th>Customers</th>
              <th>Status</th>
              <th>Task Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredCallers.length > 0 ? (
              filteredCallers.map((caller) => (
                <tr key={caller._id}>
                  <td>{caller.name}</td>
                  <td>{caller.callerId}</td>
                  <td>{caller.currentLoad || 0}/{caller.maxLoad || 20}</td>
                  <td className="status">
                    <span className={`status-badge ${(caller.status || '').toLowerCase()}`}>
                      {caller.status || 'N/A'}
                    </span>
                  </td>
                  <td className="status">
                    <span className={`status-badge ${(caller.taskStatus || '').toLowerCase()}`}>
                      {caller.taskStatus || 'IDLE'}
                    </span>
                  </td>
                  <td>
                    <button 
                      onClick={() => handleShowHistory(caller)}
                      style={{ 
                        background: 'none', 
                        border: 'none', 
                        cursor: 'pointer',
                        marginRight: '10px',
                        color: '#1488ee',
                        fontSize: '18px'
                      }}
                      title="Show History"
                    >
                      <i className="bi bi-clock-history"></i>
                    </button>
                    <button 
                      onClick={() => handleEdit(caller)}
                      style={{ 
                        background: 'none', 
                        border: 'none', 
                        cursor: 'pointer',
                        marginRight: '10px',
                        color: '#4CAF50',
                        fontSize: '18px'
                      }}
                      title="Edit"
                    >
                      <i className="bi bi-pencil-square"></i>
                    </button>
                    <button 
                      onClick={() => handleDelete(caller)}
                      style={{ 
                        background: 'none', 
                        border: 'none', 
                        cursor: 'pointer',
                        color: '#f44336',
                        fontSize: '18px'
                      }}
                      title="Delete"
                    >
                      <i className="bi bi-trash-fill"></i>
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
                  <i className="bi bi-inbox" style={{ fontSize: '48px', display: 'block', marginBottom: '10px' }}></i>
                  {searchFilter?.searchTerm ? 'No callers match your search' : 'No callers found'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <EditEmployeeModal 
        show={showEditModal}
        caller={selectedCaller}
        onClose={handleEditClose}
        onSave={handleEditSave}
      />

      <TaskHistoryModal 
        show={showHistoryModal}
        caller={selectedCaller}
        onClose={handleHistoryClose}
      />
    </>
  );
}

export default EmployeeTable;
