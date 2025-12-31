import React, { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./UploadPage.css";
import { MdOutlineFileUpload } from "react-icons/md";
import API_BASE_URL from "../config/api";
import { secureFetch } from "../utils/api";
import { toast } from "react-toastify";
import PODFilterComponent from "../components/PODFilterComponent";

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
    const saved = localStorage.getItem('uploadedExcelData');
    return saved ? JSON.parse(saved) : null;
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const inputRef = useRef(null);

  // Paid customers upload state
  const [paidFiles, setPaidFiles] = useState([]);
  const [paidDragActive, setPaidDragActive] = useState(false);
  const [paidData, setPaidData] = useState(() => {
    const saved = localStorage.getItem('uploadedPaidData');
    return saved ? JSON.parse(saved) : null;
  });
  const [paidUploading, setPaidUploading] = useState(false);
  const [paidImporting, setPaidImporting] = useState(false);
  const [paidCurrentPage, setPaidCurrentPage] = useState(1);
  const [paidSearchTerm, setPaidSearchTerm] = useState("");
  const paidInputRef = useRef(null);

  // Modal states
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showPaidPreviewModal, setShowPaidPreviewModal] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

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

  // Save paidData to localStorage whenever it changes
  React.useEffect(() => {
    console.log('Paid Data State Changed:', paidData);
    if (paidData) {
      localStorage.setItem('uploadedPaidData', JSON.stringify(paidData));
    } else {
      localStorage.removeItem('uploadedPaidData');
    }
  }, [paidData]);

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

  // Paid customers upload handlers
  const handlePaidFiles = (fileList) => {
    const accepted = Array.from(fileList).filter((f) =>
      /\.(xlsx|xls|csv)$/i.test(f.name)
    );
    const maxBytes = 60 * 1024 * 1024; // 60MB
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
    setPaidFiles((prev) => [...newFiles, ...prev]);
  };

  const onPaidDropZoneChange = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setPaidDragActive(false);
    if (e.dataTransfer?.files?.length) {
      handlePaidFiles(e.dataTransfer.files);
    }
  };

  const onPaidInputChange = (e) => {
    if (e.target.files?.length) handlePaidFiles(e.target.files);
    e.target.value = null;
  };

  const onPaidPickClick = () => paidInputRef.current && paidInputRef.current.click();

  const removePaidFile = (id) => {
    setPaidFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const deleteAllPaidFiles = () => {
    setPaidFiles([]);
    setPaidData(null);
    setPaidSearchTerm("");
    setPaidCurrentPage(1);
    localStorage.removeItem('uploadedPaidData');
  };

  const uploadPaidFile = async (fileItem) => {
    if (fileItem.status === 'error') return;

    try {
      setPaidUploading(true);

      setPaidFiles(prev => prev.map(f =>
        f.id === fileItem.id ? { ...f, status: 'uploading', progress: 0 } : f
      ));

      const formData = new FormData();
      formData.append('file', fileItem.file);

      const token = localStorage.getItem('token');
      console.log('Uploading paid customers file to:', `${API_BASE_URL}/upload/parse`);

      const response = await secureFetch(`/upload/parse`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      console.log('Paid Response status:', response.status);
      const result = await response.json();
      console.log('Paid Response data:', result);

      if (response.ok && result.success) {
        console.log('Paid data received:', result.data);

        setPaidFiles(prev => prev.map(f =>
          f.id === fileItem.id ? { ...f, status: 'completed', progress: 100 } : f
        ));

        setPaidData(result.data);
        setPaidCurrentPage(1);
        setPaidSearchTerm("");

        console.log('Paid data state updated');
      } else {
        const errorMsg = result.error || result.message || 'Upload failed';
        throw new Error(errorMsg);
      }
    } catch (error) {
      console.error('Paid upload error:', error);
      const errorMessage = error.message.includes('zip file')
        ? 'Invalid Excel file format. Please ensure the file is a valid .xlsx or .xls file.'
        : error.message;

      setPaidFiles(prev => prev.map(f =>
        f.id === fileItem.id ? {
          ...f,
          status: 'error',
          error: errorMessage,
          progress: 0
        } : f
      ));

      toast.error(`Upload failed: ${errorMessage}`);
    } finally {
      setPaidUploading(false);
    }
  };

  const importPaid = async () => {
    if (!paidFiles.find(f => f.status === 'completed')) {
      toast.warning('Please upload a paid customers file first');
      return;
    }

    const completedFile = paidFiles.find(f => f.status === 'completed');
    if (!completedFile) return;

    try {
      setPaidImporting(true);

      const formData = new FormData();
      formData.append('file', completedFile.file);

      const token = localStorage.getItem('token');
      console.log('Importing paid customers to database...');

      const response = await secureFetch(`/upload/mark-paid`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const result = await response.json();
      console.log('Paid import result:', result);

      if (response.ok && result.success) {
        toast.success(`Successfully marked ${result.data.marked} customers as paid! (${result.data.skipped || 0} records skipped)`);

        deleteAllPaidFiles();

        setTimeout(() => {
          navigate('/customers');
        }, 500);
      } else {
        throw new Error(result.message || 'Import failed');
      }
    } catch (error) {
      console.error('Paid import error:', error);
      toast.error(`Import failed: ${error.message}`);
    } finally {
      setPaidImporting(false);
    }
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
      toast.warning('Please upload a file first');
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

      const response = await secureFetch(`/upload/import-customers`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const result = await response.json();
      console.log('Import result:', result);

      if (response.ok && result.success) {
        toast.success(`Successfully imported ${result.data.imported} customers! (${result.data.duplicates || 0} duplicates skipped)`);

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
      toast.error(`Import failed: ${error.message}`);
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

      const response = await secureFetch(`/upload/parse`, {
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
        const errorMsg = result.error || result.message || 'Upload failed';
        throw new Error(errorMsg);
      }
    } catch (error) {
      console.error('Upload error:', error);
      const errorMessage = error.message.includes('zip file')
        ? 'Invalid Excel file format. Please ensure the file is a valid .xlsx or .xls file.'
        : error.message;

      setFiles(prev => prev.map(f =>
        f.id === fileItem.id ? {
          ...f,
          status: 'error',
          error: errorMessage,
          progress: 0
        } : f
      ));

      toast.error(`Upload failed: ${errorMessage}`);
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
        <div className="title">Upload Files</div>
      </div>
      <hr />

      {/* Two-Column Container */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', padding: '20px 0' }}>

        {/* LEFT COLUMN: NEW CUSTOMERS */}
        <div className="upload-section">
          <h2 style={{ fontSize: '18px', marginBottom: '20px', color: '#333' }}>Overdue Customers</h2>
          <div
            className={`dropzone ${dragActive ? "drag-active" : ""}`}
            onClick={onPick}
            onDrop={onDrop}
            onDragOver={onDragOver}
            onDragEnter={onDragEnter}
            onDragLeave={onDragLeave}
            style={{ backgroundColor: '#ff025647' }}
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
              <p className="drop-sub"> Overdue Customer List (up to 60MB)</p>
              <button type="button" className="browse-btn" aria-label="Browse File">Browse File</button>
            </div>
          </div>

          <div className="separator" />

          <div className="file-list">
            {files.length === 0 && (
              <div className="empty-note">No files uploaded yet.</div>
            )}
            {files.map((f) => (
              <div className="file-item" key={f.id}>
                <div className="file-left">
                  <div className="file-icon" aria-hidden>
                    <svg width="36" height="44" viewBox="0 0 24 24" fill="none">
                      <path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" stroke="#cfd8df" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M14 3v6h6" stroke="#cfd8df" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
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
                      <path d="M3 6h18" stroke="#222" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M8 6v12a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2V6" stroke="#222" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M10 11v6M14 11v6" stroke="#222" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Display Excel Data */}
          {excelData && (
            <>
              <div className="separator" />
              <div className="excel-data-section">
                <div className="data-header" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                  <div>
                    <h3 className="data-title">Preview</h3>
                    <div className="file-info">
                      <span className="file-name-badge">{excelData.fileName}</span>
                      <span className="total-rows">Total Rows: {excelData.totalRows}</span>
                    </div>
                  </div>
                  <div className="data-actions" style={{ display: 'flex', gap: '10px', alignItems: 'center', marginTop: '15px' }}>
                    <button
                      className="analyze-btn"
                      onClick={analyzeAndImport}
                      disabled={importing}
                      title="Import data to database and view in customers page"
                      style={{ minWidth: '120px', textAlign: 'center' }}
                    >
                      {importing ? '⟳ Importing...' : 'Import'}
                    </button>
                    <button
                      className="analyze-btn"
                      onClick={() => setShowPreviewModal(true)}
                      title="View data in full screen"
                      style={{ backgroundColor: '#2196F3', minWidth: '130px', textAlign: 'center' }}
                    >
                      Preview Table
                    </button>
                    <button
                      className="clear-data-btn"
                      onClick={deleteAllFiles}
                      title="Clear all files and data"
                      style={{ minWidth: '100px', textAlign: 'center' }}
                    >
                      Clear All
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* RIGHT COLUMN: PAID CUSTOMERS */}
        <div className="upload-section">
          <h2 style={{ fontSize: '18px', marginBottom: '20px', color: '#333' }}>Paid Customers</h2>
          <div
            className={`dropzone ${paidDragActive ? "drag-active" : ""}`}
            onClick={onPaidPickClick}
            onDrop={onPaidDropZoneChange}
            onDragOver={onDragOver}
            onDragEnter={(e) => { e.preventDefault(); setPaidDragActive(true); }}
            onDragLeave={(e) => { if (e.currentTarget === e.target) setPaidDragActive(false); }}
            style={{ backgroundColor: '#4cec5166' }}
          >
            <input
              ref={paidInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={onPaidInputChange}
              style={{ display: "none" }}
              multiple
            />
            <div className="drop-inner">
              <MdOutlineFileUpload size={48} />
              <p className="drop-text">Choose a file or drag &amp; drop it here</p>
              <p className="drop-sub">Paid Customer List (up to 60MB)</p>
              <button type="button" className="browse-btn" aria-label="Browse Paid File">Browse File</button>
            </div>
          </div>

          <div className="separator" />

          <div className="file-list">
            {paidFiles.length === 0 && (
              <div className="empty-note">No files uploaded yet.</div>
            )}
            {paidFiles.map((f) => (
              <div className="file-item" key={f.id}>
                <div className="file-left">
                  <div className="file-icon" aria-hidden>
                    <svg width="36" height="44" viewBox="0 0 24 24" fill="none">
                      <path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" stroke="#cfd8df" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M14 3v6h6" stroke="#cfd8df" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
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
                      onClick={() => uploadPaidFile(f)}
                      disabled={paidUploading}
                      title="Upload to server"
                    >
                      Upload
                    </button>
                  ) : null}
                  <button
                    className="remove-btn"
                    onClick={() => removePaidFile(f.id)}
                    title="Remove"
                    disabled={f.status === "uploading"}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                      <path d="M3 6h18" stroke="#222" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M8 6v12a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2V6" stroke="#222" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M10 11v6M14 11v6" stroke="#222" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Display Paid Data */}
          {paidData && (
            <>
              <div className="separator" />
              <div className="excel-data-section" style={{ backgroundColor: '#ffffffff' }}>
                <div className="data-header" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                  <div>
                    <h3 className="data-title">Preview</h3>
                    <div className="file-info">
                      <span className="file-name-badge">{paidData.fileName}</span>
                      <span className="total-rows">Total Rows: {paidData.totalRows}</span>
                    </div>
                  </div>
                  <div className="data-actions" style={{ display: 'flex', gap: '10px', alignItems: 'center', marginTop: '15px' }}>
                    <button
                      className="analyze-btn"
                      onClick={importPaid}
                      disabled={paidImporting}
                      title="Mark customers as paid in database"
                      style={{ minWidth: '120px', textAlign: 'center' }}
                    >
                      {paidImporting ? '⟳ Processing...' : 'Mark Paid'}
                    </button>
                    <button
                      className="analyze-btn"
                      onClick={() => setShowPaidPreviewModal(true)}
                      title="View data in full screen"
                      style={{ backgroundColor: '#2196F3', minWidth: '130px', textAlign: 'center' }}
                    >
                      Preview Table
                    </button>
                    <button
                      className="clear-data-btn"
                      onClick={deleteAllPaidFiles}
                      title="Clear all files and data"
                      style={{ minWidth: '100px', textAlign: 'center' }}
                    >
                      Clear All
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

      </div>

      {/* POD Filter Section */}
      <div style={{ marginTop: '40px', padding: '30px', backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)', textAlign: 'center' }}>
        <h2 style={{ fontSize: '20px', marginBottom: '10px', color: '#333' }}>POD Lapsed Report Processing</h2>
        <p style={{ color: '#666', marginBottom: '20px' }}>Filter and process POD lapsed customers for targeted collection efforts</p>
        <button
          onClick={() => setIsFilterOpen(true)}
          style={{
            padding: '14px 28px',
            backgroundColor: '#667eea',
            color: 'white',
            border: 'none',
            borderRadius: '12px',
            fontSize: '16px',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '10px',
            transition: 'all 0.3s ease'
          }}
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = '#5568d3';
            e.target.style.transform = 'translateY(-2px)';
            e.target.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.3)';
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = '#667eea';
            e.target.style.transform = 'translateY(0)';
            e.target.style.boxShadow = 'none';
          }}
        >
          <i className="bi bi-funnel-fill" style={{ fontSize: '18px' }}></i>
          Start Filtering Process
        </button>
      </div>

      <PODFilterComponent
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
      />
      {showPreviewModal && excelData && (
        <div
          className="modal-overlay"
          onClick={() => setShowPreviewModal(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px'
          }}
        >
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: 'white',
              borderRadius: '8px',
              width: '95%',
              maxWidth: '1400px',
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)'
            }}
          >
            <div style={{
              padding: '20px 30px',
              borderBottom: '1px solid #e0e0e0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '22px', color: '#333' }}>Overdue Customers Preview</h2>
                <div style={{ marginTop: '8px', fontSize: '14px', color: '#666' }}>
                  <span style={{
                    backgroundColor: '#f0f0f0',
                    padding: '4px 12px',
                    borderRadius: '4px',
                    marginRight: '10px',
                    fontWeight: '500'
                  }}>
                    {excelData.fileName}
                  </span>
                  <span>Total Rows: {excelData.totalRows}</span>
                </div>
              </div>
              <button
                onClick={() => setShowPreviewModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '28px',
                  cursor: 'pointer',
                  color: '#666',
                  padding: '0',
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                title="Close"
              >
                ×
              </button>
            </div>

            <div style={{
              padding: '20px 30px',
              overflowY: 'auto',
              flex: 1
            }}>
              <div className="data-controls" style={{ marginBottom: '20px' }}>
                <input
                  type="text"
                  className="search-input"
                  placeholder="Search in table..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table className="data-table" style={{ width: '100%' }}>
                  <thead>
                    <tr>
                      <th className="row-number-header">#</th>
                      {excelData.headers.map((header, index) => (
                        <th key={index}>{header}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      const { headers, rows } = excelData;
                      const filteredRows = rows.filter(row => {
                        if (!searchTerm.trim()) return true;
                        const searchLower = searchTerm.toLowerCase();
                        return headers.some(header => {
                          const val = row[header];
                          return val != null && val.toString().toLowerCase().includes(searchLower);
                        });
                      });

                      return filteredRows.length === 0 ? (
                        <tr>
                          <td colSpan={headers.length + 1} className="no-data">
                            {searchTerm ? "No matching records found" : "No data available"}
                          </td>
                        </tr>
                      ) : (
                        filteredRows.map((row, rowIndex) => (
                          <tr key={rowIndex}>
                            <td className="row-number">{rowIndex + 1}</td>
                            {headers.map((header, colIndex) => (
                              <td key={colIndex}>
                                {row[header] !== null && row[header] !== undefined
                                  ? row[header].toString()
                                  : "-"}
                              </td>
                            ))}
                          </tr>
                        ))
                      );
                    })()}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal for Paid Customers */}
      {showPaidPreviewModal && paidData && (
        <div
          className="modal-overlay"
          onClick={() => setShowPaidPreviewModal(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px'
          }}
        >
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: 'white',
              borderRadius: '8px',
              width: '95%',
              maxWidth: '1400px',
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)'
            }}
          >
            <div style={{
              padding: '20px 30px',
              borderBottom: '1px solid #e0e0e0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '22px', color: '#333' }}>Paid Customers Preview</h2>
                <div style={{ marginTop: '8px', fontSize: '14px', color: '#666' }}>
                  <span style={{
                    backgroundColor: '#f0f0f0',
                    padding: '4px 12px',
                    borderRadius: '4px',
                    marginRight: '10px',
                    fontWeight: '500'
                  }}>
                    {paidData.fileName}
                  </span>
                  <span>Total Rows: {paidData.totalRows}</span>
                </div>
              </div>
              <button
                onClick={() => setShowPaidPreviewModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '28px',
                  cursor: 'pointer',
                  color: '#666',
                  padding: '0',
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                title="Close"
              >
                ×
              </button>
            </div>

            <div style={{
              padding: '20px 30px',
              overflowY: 'auto',
              flex: 1
            }}>
              <div className="data-controls" style={{ marginBottom: '20px' }}>
                <input
                  type="text"
                  className="search-input"
                  placeholder="Search in table..."
                  value={paidSearchTerm}
                  onChange={(e) => setPaidSearchTerm(e.target.value)}
                />
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table className="data-table" style={{ width: '100%' }}>
                  <thead>
                    <tr>
                      <th className="row-number-header">#</th>
                      {paidData.headers.map((header, index) => (
                        <th key={index}>{header}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      const { headers, rows } = paidData;
                      const filteredRows = rows.filter(row => {
                        if (!paidSearchTerm.trim()) return true;
                        const searchLower = paidSearchTerm.toLowerCase();
                        return headers.some(header => {
                          const val = row[header];
                          return val != null && val.toString().toLowerCase().includes(searchLower);
                        });
                      });

                      return filteredRows.length === 0 ? (
                        <tr>
                          <td colSpan={headers.length + 1} className="no-data">
                            {paidSearchTerm ? "No matching records found" : "No data available"}
                          </td>
                        </tr>
                      ) : (
                        filteredRows.map((row, rowIndex) => (
                          <tr key={rowIndex}>
                            <td className="row-number">{rowIndex + 1}</td>
                            {headers.map((header, colIndex) => (
                              <td key={colIndex}>
                                {row[header] !== null && row[header] !== undefined
                                  ? row[header].toString()
                                  : "-"}
                              </td>
                            ))}
                          </tr>
                        ))
                      );
                    })()}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default UploadPage;
