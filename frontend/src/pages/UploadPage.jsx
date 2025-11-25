import React, { useRef, useState } from "react";
import "./UploadPage.css";
import { MdOutlineFileUpload } from "react-icons/md";

const humanFileSize = (size) => {
  if (size === 0) return "0 B";
  const i = Math.floor(Math.log(size) / Math.log(1024));
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  return (size / Math.pow(1024, i)).toFixed(i ? 1 : 0) + " " + sizes[i];
};

const UploadPage = () => {
  const [files, setFiles] = useState([]);
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef(null);

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
      status: f.size <= maxBytes ? "completed" : "error",
      error: f.size <= maxBytes ? null : `File too large (max 60MB).`,
      progress: f.size <= maxBytes ? 100 : 0,
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
  };

  return (
    <>
      <div className="title">Upload File</div>
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

        {files.length > 0 && (
          <div className="file-list-header">
            <button 
              type="button" 
              className="delete-all-btn" 
              onClick={deleteAllFiles}
              title="Delete all files"
            >
              Delete All
            </button>
          </div>
        )}

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
                      {uploadedReadable} of {f.readableSize} •{" "}
                      {f.error ? <span className="error">{f.error}</span> : <span className="muted">{f.progress}%</span>}
                    </div>
                  </div>
                </div>

                <div className="file-right">
                  {f.status === "completed" ? (
                    <div className="status completed">✔ Completed</div>
                  ) : (
                    <div className="status error">⚠ {f.error || "Error"}</div>
                  )}
                  <button
                    className="remove-btn"
                    onClick={() => removeFile(f.id)}
                    title="Remove"
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
      </div>
    </>
  );
};

export default UploadPage;
