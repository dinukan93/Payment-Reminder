import React from "react";
import "./DashboardStats.css";
import "bootstrap-icons/font/bootstrap-icons.css";

function DashboardStats({ stats }) {
  const getIcon = (type) => {
    switch (type) {
      case "customers":
        return "bi-people";
      case "contacted":
        return "bi-telephone";
      case "completed":
        return "bi-credit-card";
      case "pending":
        return "bi-clock";
      default:
        return "bi-circle";
    }
  };

  return (
    <div className="dashboard-stats">
      {stats.map((stat, index) => (
        <div key={index} className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: stat.color }}>
            <i className={`bi ${getIcon(stat.type)}`}></i>
          </div>
          <div className="stat-details">
            <h3>{stat.value}</h3>
            <p>{stat.label}</p>
          </div>
          <div className="stat-menu">
            <i className="bi bi-three-dots-vertical"></i>
          </div>
        </div>
      ))}
    </div>
  );
}

export default DashboardStats;
