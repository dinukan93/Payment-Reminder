import React from "react";
import Logo from "../assets/logo_11.png";
import "./sideBar.css";

export default function Sidebar() {
  return (
    <>
      <div className="sidebar">
        <div className="sidebar-logo">
          <img src={Logo} alt="App Logo" />
        </div>

        <nav className="sidebar-menu">
          <h4>Overview</h4>
          <ul>
            <li>Dashboard</li>
            <li>Customers</li>
            <li>Employees</li>
            <li>Report</li>
          </ul>
        </nav>
        <div className="sidebar-end">
          <ul>
            <li>Settings</li>
            <li>Logout</li>
          </ul>
        </div>
      </div>
    </>
  );
}
