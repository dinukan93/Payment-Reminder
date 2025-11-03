import React from "react";
import "./EmployeeTable.css";

function EmployeeTable() {
  const data = [
    {
      Employee: "Kasun Eranga",
      Customers: 20,
      Status: "On Going",
      History: "Show history",
    },
    {
      Employee: "Kavindu Eshan",
      Customers: 10,
      Status: "On Going",
      History: "Show history",
    },
    {
      Employee: "Sandun Tharaka",
      Customers: 12,
      Status: "On Going",
      History: "Show history",
    },
    {
      Employee: "Dineth Fernando",
      Customers: 8,
      Status: "On Going",
      History: "Show history",
    },
    {
      Employee: "Lahiru Perera",
      Customers: 14,
      Status: "On Going",
      History: "Show history",
    },
    {
      Employee: "Thisula bandara",
      Customers: 9,
      Status: "On Going",
      History: "Show history",
    },
    {
      Employee: "Akindu Peiris",
      Customers: 11,
      Status: "On Going",
      History: "Show history",
    },
  ];
  return (
    <>
      <div className="table-card">
        <table className="employee-table">
          <thead>
            <tr>
              <th>Employee</th>
              <th>Customers</th>
              <th>Status</th>
              <th>History</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {data.map((item) => (
              <tr key={item.Employee}>
                <td>{item.Employee}</td>
                <td>{item.Customers}</td>
                <td className="status">{item.Status}</td>
                <td>{item.History}</td>
                <td>
                  <i class="bi bi-pencil-square"></i>
                  <i class="bi bi-trash-fill"></i>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

export default EmployeeTable;
