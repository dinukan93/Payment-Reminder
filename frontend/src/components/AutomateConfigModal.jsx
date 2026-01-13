import React, { useState, useEffect } from "react";
import "./AutomateConfigModal.css";
import { secureFetch } from "../utils/api";
import { showError } from "./Notifications";

function AutomateConfigModal({ isOpen, onClose, onConfirm }) {
  const [callers, setCallers] = useState([]);
  const [selectedCallers, setSelectedCallers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectAll, setSelectAll] = useState(true);

  useEffect(() => {
    if (isOpen) {
      fetchAvailableCallers();
    }
  }, [isOpen]);

  const fetchAvailableCallers = async () => {
    setLoading(true);
    try {
      const response = await secureFetch(`/api/callers`);

      if (response.ok) {
        const result = await response.json();
        const callersData = result.data || result;

        // Filter for enabled callers (not OFFLINE) with available capacity
        const availableCallers = callersData.filter(c =>
          c.status !== 'OFFLINE' && c.currentLoad < c.maxLoad
        ).map(c => ({
          id: c._id || c.id,
          name: c.name,
          callerId: c.callerId,
          region: c.region,
          rtom: c.rtom,
          currentLoad: c.currentLoad || 0,
          maxLoad: c.maxLoad || 0,
          available: (c.maxLoad || 0) - (c.currentLoad || 0),
          status: c.status
        }));

        setCallers(availableCallers);
        // Select all by default
        setSelectedCallers(availableCallers.map(c => c.id));
        setSelectAll(true);
      } else {
        showError("Failed to fetch callers");
      }
    } catch (error) {
      console.error('Error fetching callers:', error);
      showError("Error fetching available callers");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedCallers([]);
      setSelectAll(false);
    } else {
      setSelectedCallers(callers.map(c => c.id));
      setSelectAll(true);
    }
  };

  const handleCallerToggle = (callerId) => {
    if (selectedCallers.includes(callerId)) {
      const newSelection = selectedCallers.filter(id => id !== callerId);
      setSelectedCallers(newSelection);
      setSelectAll(newSelection.length === callers.length);
    } else {
      const newSelection = [...selectedCallers, callerId];
      setSelectedCallers(newSelection);
      setSelectAll(newSelection.length === callers.length);
    }
  };

  const handleConfirm = () => {
    if (selectedCallers.length === 0) {
      showError("Please select at least one caller");
      return;
    }
    onConfirm(selectedCallers);
  };

  if (!isOpen) return null;

  return (
    <div className="automate-modal-overlay" onClick={onClose}>
      <div className="automate-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="automate-modal-header">
          <h2>
            <i className="bi bi-lightning-charge"></i>
            Configure Automated Assignment
          </h2>
          <button className="automate-modal-close" onClick={onClose}>
            <i className="bi bi-x-lg"></i>
          </button>
        </div>

        <div className="automate-modal-body">
          {loading ? (
            <div className="automate-loading">
              <div className="spinner"></div>
              <p>Loading available callers...</p>
            </div>
          ) : callers.length === 0 ? (
            <div className="automate-empty-state">
              <i className="bi bi-exclamation-circle"></i>
              <h3>No Available Callers</h3>
              <p>There are no callers with available capacity at the moment.</p>
            </div>
          ) : (
            <>
              <div className="automate-info">
                <i className="bi bi-info-circle"></i>
                <p>Select callers to receive automated customer assignments. Customers will be distributed based on each caller's available capacity.</p>
              </div>

              <div className="automate-select-all">
                <label className="automate-checkbox-label">
                  <input
                    type="checkbox"
                    checked={selectAll}
                    onChange={handleSelectAll}
                  />
                  <span className="checkbox-text">
                    <strong>Select All Callers</strong> ({callers.length} available)
                  </span>
                </label>
              </div>

              <div className="automate-callers-list">
                {callers.map((caller) => (
                  <div
                    key={caller.id}
                    className={`automate-caller-card ${selectedCallers.includes(caller.id) ? 'selected' : ''}`}
                    onClick={() => handleCallerToggle(caller.id)}
                  >
                    <div className="automate-caller-checkbox">
                      <input
                        type="checkbox"
                        checked={selectedCallers.includes(caller.id)}
                        onChange={() => handleCallerToggle(caller.id)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                    <div className="automate-caller-info">
                      <div className="automate-caller-name">
                        <strong>{caller.name}</strong>
                        <span className="automate-caller-id">ID: {caller.callerId}</span>
                      </div>
                      <div className="automate-caller-meta">
                        {caller.rtom && (
                          <span className="automate-caller-rtom">
                            <i className="bi bi-geo-alt"></i>
                            {caller.rtom}
                          </span>
                        )}
                        <span className="automate-caller-capacity">
                          <i className="bi bi-speedometer2"></i>
                          {caller.currentLoad} / {caller.maxLoad}
                        </span>
                        <span className="automate-caller-available">
                          <i className="bi bi-check-circle"></i>
                          {caller.available} available
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="automate-modal-footer">
          <div className="automate-summary">
            <i className="bi bi-people-fill"></i>
            <span>{selectedCallers.length} caller{selectedCallers.length !== 1 ? 's' : ''} selected</span>
          </div>
          <div className="automate-actions">
            <button className="automate-btn-cancel" onClick={onClose}>
              Cancel
            </button>
            <button
              className="automate-btn-confirm"
              onClick={handleConfirm}
              disabled={selectedCallers.length === 0 || loading}
            >
              <i className="bi bi-lightning-charge-fill"></i>
              Start Automated Assignment
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AutomateConfigModal;
