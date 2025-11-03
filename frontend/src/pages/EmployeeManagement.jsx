import React from "react";
import "./EmployeeManagement.css";
import SearchBar from "../components/SearchBar";
import "../components/SearchBar.css";
import EmployeeTable from "../components/EmployeeTable";
import "../components/EmployeeTable.css";

function EmployeeManagement() {
  return (
    <>
      <div className="title">Employee management</div>
      <hr />
      <SearchBar />
      <div className="employee-container">
        <EmployeeTable />
      </div>
    </>
  );
}

export default EmployeeManagement;
