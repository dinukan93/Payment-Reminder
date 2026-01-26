import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./DisplayDataPage.css";

const DisplayDataPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const rowsPerPage = 20;

  useEffect(() => {
    
    if (location.state?.data) {
      setData(location.state.data);
    } else {
      
      navigate("/upload");
    }
  }, [location, navigate]);

  if (!data) {
    return (
      <div className="display-container">
        <div className="loading">Loading data...</div>
      </div>
    );
  }

  const { headers, rows, fileName, totalRows } = data;

  // Filter rows based on search term
  const filteredRows = rows.filter(row => {
    return headers.some(header => {
      const value = row[header];
      return value && value.toString().toLowerCase().includes(searchTerm.toLowerCase());
    });
  });

  // Pagination
  const totalPages = Math.ceil(filteredRows.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const currentRows = filteredRows.slice(startIndex, endIndex);

  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  const goBackToUpload = () => {
    navigate("/upload");
  };

  return (
    <>
      <div className="display-header">
        <div>
          <div className="title">Uploaded Excel Data</div>
          <div className="file-info">
            <span className="file-name-badge">{fileName}</span>
            <span className="total-rows">Total Rows: {totalRows}</span>
          </div>
        </div>
        <button className="back-btn" onClick={goBackToUpload}>
          ← Back to Upload
        </button>
      </div>
      <hr />

      <div className="display-container">
        <div className="controls">
          <input
            type="text"
            className="search-input"
            placeholder="Search in table..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1); 
            }}
          />
          <div className="showing-info">
            Showing {startIndex + 1} - {Math.min(endIndex, filteredRows.length)} of {filteredRows.length} rows
          </div>
        </div>

        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th className="row-number-header">#</th>
                {headers.map((header, index) => (
                  <th key={index}>{header}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {currentRows.length === 0 ? (
                <tr>
                  <td colSpan={headers.length + 1} className="no-data">
                    {searchTerm ? "No matching records found" : "No data available"}
                  </td>
                </tr>
              ) : (
                currentRows.map((row, rowIndex) => (
                  <tr key={rowIndex}>
                    <td className="row-number">{startIndex + rowIndex + 1}</td>
                    {headers.map((header, colIndex) => (
                      <td key={colIndex}>
                        {row[header] !== null && row[header] !== undefined 
                          ? row[header].toString() 
                          : "-"}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="pagination">
            <button
              className="page-btn"
              onClick={handlePrevPage}
              disabled={currentPage === 1}
            >
              Previous
            </button>
            <span className="page-info">
              Page {currentPage} of {totalPages}
            </span>
            <button
              className="page-btn"
              onClick={handleNextPage}
              disabled={currentPage === totalPages}
            >
              Next
            </button>
          </div>
        )}
      </div>
    </>
  );
};

export default DisplayDataPage;
