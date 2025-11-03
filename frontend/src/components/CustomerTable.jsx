import React from "react";
import "./CustomerTable.css";

function CustomerTable() {
  const data = [
    {
      Customer: "Ravindu Fernando",
      Contact: "+94 71 888 1154",
      Caller: "Kavindu Eshan",
      Amount: 5200,
      Date: "12-10-2025",
      Status: "Pending",
    },
    {
      Customer: "Maneth Kavinda",
      Contact: "+94 70 223 9677",
      Caller: "Sandun Tharaka",
      Amount: 2900,
      Date: "19-10-2025",
      Status: "Pending",
    },
    {
      Customer: "Naduni Nimasha",
      Contact: "+94 71 574 9004",
      Caller: "Kasun Eranga",
      Amount: 4300,
      Date: "21-10-2025",
      Status: "Pending",
    },
    {
      Customer: "Sahan Tharuka",
      Contact: "+94 71 555 4567",
      Caller: "Dineth Fernando",
      Amount: 3000,
      Date: "11-10-2025",
      Status: "Pending",
    },
    {
      Customer: "Gavindu Dias",
      Contact: "+94 72 212 8099",
      Caller: "Lahiru Perera",
      Amount: 9000,
      Date: "09-10-2025",
      Status: "Pending",
    },
  ];

  return (
    <>
      <div className="table-card">
        <table className="custom-table">
          <thead>
            <tr>
              <th>Customer</th>
              <th>Contact</th>
              <th>Caller</th>
              <th>Amount</th>
              <th>Date</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {data.map((item) => (
              <tr key={item.Customer}>
                <td>{item.Customer}</td>
                <td>{item.Contact}</td>
                <td>{item.Caller}</td>
                <td>{item.Amount}</td>
                <td>{item.Date}</td>
                <td className="status">{item.Status}</td>
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

export default CustomerTable;
