import React, { useState } from "react";
import "./customerManagement.css";
import CustomerTable from "../components/CustomerTable";
import "../components/CustomerTable.css";
import SearchBar from "../components/SearchBar";
import "../components/SearchBar.css";
import AddCustomerModal from "../components/AddCustomerModal";
import { showSuccess } from "../components/Notifications";

function CustomerManagement() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [searchFilter, setSearchFilter] = useState({ searchTerm: "", filterType: "All" });

  const handleAddClick = () => {
    setShowAddModal(true);
  };

  const handleAddSuccess = () => {
    showSuccess("Customer added successfully!");
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
      <div className="title">Customer Management</div>
      <hr />
      <SearchBar 
        onAddClick={handleAddClick}
        onSearch={handleSearch}
        onFilterChange={handleFilterChange}
        searchPlaceholder="Search by name, account number, or contact..."
      />
      <AddCustomerModal 
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={handleAddSuccess}
      />
      <div className="customer-container">
        <CustomerTable 
          refreshTrigger={refreshTrigger}
          searchFilter={searchFilter}
        />
      </div>
    </>
  );
}

export default CustomerManagement;
