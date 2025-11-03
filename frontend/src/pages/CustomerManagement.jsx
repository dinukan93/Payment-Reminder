import React from "react";
import "./customerManagement.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import MyTable from "../components/CustomerTable";

function CustomerManagement() {
  return (
    <>
      <div className="title">Customer management</div>
      <hr />
      <div className="searchbar">
        <input type="text" placeholder="Search customer..." />
        <select name="payType">
          <option>All payments</option>
          <option>Pending</option>
          <option>Failed</option>
        </select>
        <button className="search-icon">
          <i class="bi bi-search"></i>
        </button>
        <button className="add-button">
          <i class="bi bi-person-add"></i>
          Add
        </button>
      </div>
      <div className="customer-list">
        <MyTable />
      </div>
    </>
  );
}

export default CustomerManagement;
