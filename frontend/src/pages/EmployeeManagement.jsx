import React, { useState } from "react";
import "./EmployeeManagement.css";
import SearchBar from "../components/SearchBar";
import "../components/SearchBar.css";
import EmployeeTable from "../components/EmployeeTable";
import "../components/EmployeeTable.css";
import AddEmployeeModal from "../components/AddEmployeeModal";

function EmployeeManagement() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [searchFilter, setSearchFilter] = useState({ searchTerm: "", filterType: "All" });

  const handleAddClick = () => {
    setShowAddModal(true);
  };

  const handleAddSuccess = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const handleSearch = (searchTerm) => {
    setSearchFilter(prev => ({ ...prev, searchTerm }));
  };

  const handleFilterChange = (filterType) => {
    setSearchFilter(prev => ({ ...prev, filterType }));
  };

  return (
    <>
      <div className="title">Employee management</div>
      <hr />
      <SearchBar 
        onAddClick={handleAddClick}
        onSearch={handleSearch}
        onFilterChange={handleFilterChange}
        searchPlaceholder="Search by name, caller ID, or email..."
      />
      <AddEmployeeModal 
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={handleAddSuccess}
      />
      <div className="employee-container">
        <EmployeeTable 
          refreshTrigger={refreshTrigger}
          searchFilter={searchFilter}
        />
      </div>
    </>
  );
}

export default EmployeeManagement;
