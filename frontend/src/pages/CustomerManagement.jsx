import React from "react";
import "./customerManagement.css";
import CustomerTable from "../components/CustomerTable";
import "../components/CustomerTable.css";
import SearchBar from "../components/SearchBar";
import "../components/SearchBar.css";

function CustomerManagement() {
  return (
    <>
      <div className="title">Customer management</div>
      <hr />
      <SearchBar />
      <div className="customer-container">
        <CustomerTable />
      </div>
    </>
  );
}

export default CustomerManagement;
