import React, { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./UploadPage.css";
import { MdOutlineFileUpload } from "react-icons/md";
import API_BASE_URL from "../config/api";

const humanFileSize = (size) => {
  if (size === 0) return "0 B";
  const i = Math.floor(Math.log(size) / Math.log(1024));
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  return (size / Math.pow(1024, i)).toFixed(i ? 1 : 0) + " " + sizes[i];
};

const UploadPage = () => {
  const [files, setFiles] = useState([]);
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [excelData, setExcelData] = useState(() => {
    // Load from localStorage on mount
    const saved = localStorage.getItem('uploadedExcelData');
    return saved ? JSON.parse(saved) : null;
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const inputRef = useRef(null);
  const navigate = useNavigate();
  const rowsPerPage = 20;

  // Save excelData to localStorage whenever it changes
  React.useEffect(() => {
    console.log('Excel Data State Changed:', excelData);
    if (excelData) {
      localStorage.setItem('uploadedExcelData', JSON.stringify(excelData));
    } else {
      localStorage.removeItem('uploadedExcelData');
    }
  }, [excelData]);

  const handleFiles = (fileList) => {
    const accepted = Array.from(fileList).filter((f) =>
      /\.(xlsx|xls|csv)$/i.test(f.name)
    );
    const maxBytes = 60 * 1024 * 1024; // 60MB (matches UI)
    const newFiles = accepted.map((f) => ({
      id: `${f.name}-${f.size}-${Date.now()}`,
      file: f,
      name: f.name,
      size: f.size,
      readableSize: humanFileSize(f.size),
      status: f.size <= maxBytes ? "ready" : "error",
      error: f.size <= maxBytes ? null : `File too large (max 60MB).`,
      progress: 0,
    }));
    setFiles((prev) => [...newFiles, ...prev]);
  };

  const onDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer?.files?.length) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const onDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
  };

  const onDragEnter = (e) => {
    e.preventDefault();
    setDragActive(true);
  };

  const onDragLeave = (e) => {
    // only turn off when leaving the dropzone (not children)
    if (e.currentTarget === e.target) setDragActive(false);
  };

  const onPick = () => inputRef.current && inputRef.current.click();

  const onInputChange = (e) => {
    if (e.target.files?.length) handleFiles(e.target.files);
    e.target.value = null; // reset
  };

  const removeFile = (id) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const deleteAllFiles = () => {
    setFiles([]);
    setExcelData(null);
    setSearchTerm("");
    setCurrentPage(1);
    localStorage.removeItem('uploadedExcelData');
  };

  const analyzeAndImport = async () => {
    if (!files.find(f => f.status === 'completed')) {
      alert('Please upload a file first');
      return;
    }

    const completedFile = files.find(f => f.status === 'completed');
    if (!completedFile) return;

    try {
      setImporting(true);

      const formData = new FormData();
      formData.append('file', completedFile.file);

      const token = localStorage.getItem('token');
      console.log('Importing to database...');
      
      const response = await fetch(`${API_BASE_URL}/upload/import-customers`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const result = await response.json();
      console.log('Import result:', result);

      if (response.ok && result.success) {
        alert(`Successfully imported ${result.data.imported} customers! (${result.data.duplicates || 0} duplicates skipped)`);
        
        // Clear the upload data
        deleteAllFiles();
        
        // Navigate to customers page
        setTimeout(() => {
          navigate('/customers');
        }, 500);
      } else {
        throw new Error(result.message || 'Import failed');
      }
    } catch (error) {
      console.error('Import error:', error);
      alert(`Import failed: ${error.message}`);
    } finally {
      setImporting(false);
    }
  };

  const uploadFile = async (fileItem) => {
    if (fileItem.status === 'error') return;

    try {
      setUploading(true);
      
      // Update status to uploading
      setFiles(prev => prev.map(f => 
        f.id === fileItem.id ? { ...f, status: 'uploading', progress: 0 } : f
      ));

      const formData = new FormData();
      formData.append('file', fileItem.file);

      const token = localStorage.getItem('token');
      console.log('Uploading to:', `${API_BASE_URL}/upload/parse`);
      
      const response = await fetch(`${API_BASE_URL}/upload/parse`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      console.log('Response status:', response.status);
      const result = await response.json();
      console.log('Response data:', result);

      if (response.ok && result.success) {
        console.log('Excel data received:', result.data);
        
        // Update status to completed
        setFiles(prev => prev.map(f => 
          f.id === fileItem.id ? { ...f, status: 'completed', progress: 100 } : f
        ));

        // Display data on the same page
        setExcelData(result.data);
        setCurrentPage(1);
        setSearchTerm("");
        
        console.log('Excel data state updated');
      } else {
        throw new Error(result.message || 'Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      setFiles(prev => prev.map(f => 
        f.id === fileItem.id ? { 
          ...f, 
          status: 'error', 
          error: error.message || 'Upload failed',
          progress: 0 
        } : f
      ));
    } finally {
      setUploading(false);
    }
  };

  // Filter and paginate Excel data
  let filteredRows = [];
  let totalPages = 0;
  let currentRows = [];
  
  if (excelData) {
    const { headers, rows } = excelData;
    filteredRows = rows.filter(row => {
      return headers.some(header => {
        const value = row[header];
        return value && value.toString().toLowerCase().includes(searchTerm.toLowerCase());
      });
    });
    totalPages = Math.ceil(filteredRows.length / rowsPerPage);
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    currentRows = filteredRows.slice(startIndex, endIndex);
  }

  return (
    <>
      <div className="upload-header">
        <div className="title">Upload File</div>
      </div>
      <hr />
      <div
        className="upload-container"
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragEnter={onDragEnter}
        onDragLeave={onDragLeave}
      >
        <div
          className={`dropzone ${dragActive ? "drag-active" : ""}`}
          onClick={onPick}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={onInputChange}
            style={{ display: "none" }}
            multiple
          />
          <div className="drop-inner">
            
            <MdOutlineFileUpload size={48} />
            <p className="drop-text">Choose a file or drag &amp; drop it here</p>
            <p className="drop-sub">excel up to 60MB</p>
            <button type="button" className="browse-btn"  aria-label="Browse File">Browse File</button>
          </div>
        </div>

        <div className="separator" />



        <div className="file-list">
          {files.length === 0 && (
            <div className="empty-note">No files uploaded yet.</div>
          )}
          {files.map((f) => {
            const uploadedBytes = Math.round((f.progress / 100) * f.size);
            const uploadedReadable = humanFileSize(uploadedBytes);
            return (
              <div className="file-item" key={f.id}>
                <div className="file-left">
                  <div className="file-icon" aria-hidden>
                    <svg width="36" height="44" viewBox="0 0 24 24" fill="none">
                      <path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" stroke="#cfd8df" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M14 3v6h6" stroke="#cfd8df" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <div className="file-meta">
                    <div className="file-name">{f.name}</div>
                    <div className="file-size">
                      {f.readableSize}
                      {f.status === "uploading" && ` • ${f.progress}%`}
                      {f.error && <span className="error"> • {f.error}</span>}
                    </div>
                  </div>
                </div>

                <div className="file-right">
                  {f.status === "completed" ? (
                    <div className="status completed">✔ Uploaded</div>
                  ) : f.status === "uploading" ? (
                    <div className="status uploading">⟳ Uploading...</div>
                  ) : f.status === "error" ? (
                    <div className="status error">⚠ {f.error || "Error"}</div>
                  ) : f.status === "ready" ? (
                    <button
                      className="upload-btn"
                      onClick={() => uploadFile(f)}
                      disabled={uploading}
                      title="Upload to server"
                    >
                      Upload
                    </button>
                  ) : null}
                  <button
                    className="remove-btn"
                    onClick={() => removeFile(f.id)}
                    title="Remove"
                    disabled={f.status === "uploading"}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                      <path d="M3 6h18" stroke="#222" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M8 6v12a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2V6" stroke="#222" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M10 11v6M14 11v6" stroke="#222" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Display Excel Data */}
        {excelData && (
          <>
            <div className="separator" />
            <div className="excel-data-section">
              <div className="data-header">
                <div>
                  <h3 className="data-title">Excel Data Preview</h3>
                  <div className="file-info">
                    <span className="file-name-badge">{excelData.fileName}</span>
                    <span className="total-rows">Total Rows: {excelData.totalRows}</span>
                  </div>
                </div>
                <div className="data-actions">
                  <button 
                    className="analyze-btn" 
                    onClick={analyzeAndImport}
                    disabled={importing}
                    title="Import data to database and view in customers page"
                  >
                    {importing ? '⟳ Importing...' : 'Import'}
                  </button>
                  <button 
                    className="clear-data-btn" 
                    onClick={deleteAllFiles}
                    title="Clear all files and data"
                  >
                    Clear All
                  </button>
                </div>
              </div>

              <div className="data-controls">
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
                  Showing {((currentPage - 1) * rowsPerPage) + 1} - {Math.min(currentPage * rowsPerPage, filteredRows.length)} of {filteredRows.length} rows
                </div>
              </div>

              <div className="table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th className="row-number-header">#</th>
                      {excelData.headers.map((header, index) => (
                        <th key={index}>{header}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {currentRows.length === 0 ? (
                      <tr>
                        <td colSpan={excelData.headers.length + 1} className="no-data">
                          {searchTerm ? "No matching records found" : "No data available"}
                        </td>
                      </tr>
                    ) : (
                      currentRows.map((row, rowIndex) => (
                        <tr key={rowIndex}>
                          <td className="row-number">{((currentPage - 1) * rowsPerPage) + rowIndex + 1}</td>
                          {excelData.headers.map((header, colIndex) => (
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
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </button>
                  <span className="page-info">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    className="page-btn"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </>
  );
};

export default UploadPage;
