import React, { useState } from "react";
import PODFilterComponent from "../components/PODFilterComponent";
import "./PODFilterPage.css";

function PODFilterPage() {
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  return (
    <div className="pod-filter-page">
      <div className="title">POD Lapsed Report Processing</div>
      <hr />

      <div className="page-content">
        <div className="info-card">
          <div className="steps-info">
            <div className="step-info">
              <div className="step-icon">1</div>
              <div className="step-content">
                <h3>Initial Filtration</h3>
                <p>Filters customers by Medium - COPPER & FTTH, Product Status OK (Voice), and Total Outstanding &gt; 2,400</p>
              </div>
            </div>

            <div className="step-info">
              <div className="step-icon">2</div>
              <div className="step-content">
                <h3>Credit Class Check</h3>
                <p>Classifies records as VIP or Other Credit Classes based on credit class status</p>
              </div>
            </div>

            <div className="step-info">
              <div className="step-icon">3</div>
              <div className="step-content">
                <h3>Exclusions</h3>
                <p>Removes Special Exclusions and Bulk SU FTTH No List accounts (End & Mid Cycle)</p>
              </div>
            </div>

            <div className="step-info">
              <div className="step-icon">4</div>
              <div className="step-content">
                <h3>SLT Sub Segment Classification</h3>
                <p>Categorizes based on bill value and sub-segment (Enterprise, Retail, Micro Business)</p>
              </div>
            </div>

            <div className="step-info">
              <div className="step-icon">5</div>
              <div className="step-content">
                <h3>Bill Value Assignment</h3>
                <p>Assigns accounts to appropriate teams based on bill value and arrears amount</p>
              </div>
            </div>
          </div>

          <div className="requirements-section">
            <ul>
              <li><strong>Format:</strong> .xlsx or .xls files only</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="action-card">
        <button
          className="start-filter-btn"
          onClick={() => setIsFilterOpen(true)}
        >
          <i className="bi bi-funnel-fill"></i>
          Start Filtering Process
        </button>
      </div>

      <PODFilterComponent
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
      />
    </div>
  );
}

export default PODFilterPage;
