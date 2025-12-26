import React, { useState } from "react";
import "./CallerManagement.css";
import SearchBar from "../components/SearchBar";
import "../components/SearchBar.css";
import CallerTable from "../components/CallerTable";
import "../components/CallerTable.css";
import AddCallerModal from "../components/AddCallerModal";

function CallerManagement() {
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
      <div className="title">Caller Management</div>
      <hr />
      <SearchBar
        onAddClick={handleAddClick}
        onSearch={handleSearch}
        onFilterChange={handleFilterChange}
        searchPlaceholder="Search by name, caller ID, or email..."
      />
      <AddCallerModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={handleAddSuccess}
      />
      <div className="caller-container">
        <CallerTable
          refreshTrigger={refreshTrigger}
          searchFilter={searchFilter}
        />
      </div>
    </>
  );
}

export default CallerManagement;

