import React from 'react'
import "./CallerStatisticsTable.css";

function CallerStatisticsTable() {
    const data = [
    {
      Employee: "Kasun Eranga",
      Total_Calls: 120,
      Successful: 99,
      Pending: 10,
      Failed: 9,
    },
    {
      Employee: "Kavindu Eshan",
      Total_Calls: 190,
      Successful: 158,
      Pending: 30,
      Failed: 2,
    },
    {
      Employee: "Sandun Tharaka",
      Total_Calls: 132,
      Successful: 100,
      Pending: 15,
      Failed: 17,
    },
    {
      Employee: "Dineth Fernando",
      Total_Calls: 178,
      Successful: 161,
      Pending: 11,
      Failed: 6,
    },
    {
      Employee: "Lahiru Perera",
      Total_Calls: 114,
      Successful: 89,
      Pending: 20,
      Failed: 5,
    },
    {
      Employee: "Akindu Peiris",
      Total_Calls: 191,
      Successful: 177,
      Pending: 10,
      Failed: 4,
    },


    ]
  return (
    <>
      <div className="table-card">
        <table className="statistics-table">
          <thead>
            <tr>
              <th>Employee</th>
              <th>Total Calls</th>
              <th>Successful</th>
              <th>Pending</th>
              <th>Failed</th>
            </tr>
          </thead>
          <tbody>
            {data.map((item) => (
              <tr key={item.Employee}>
                <td>{item.Employee}</td>
                <td>{item.Total_Calls}</td>
                <td>{item.Successful}</td>
                <td>{item.Pending}</td>
                <td>{item.Failed}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}

export default CallerStatisticsTable