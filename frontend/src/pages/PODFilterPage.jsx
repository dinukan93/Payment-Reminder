import React, { useState } from "react";
import PODFilterComponent from "../components/PODFilterComponent";
import "./PODFilterPage.css";

function PODFilterPage() {
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  return (
    <div className="pod-filter-page">
      <div className="page-header">
        <h1>POD Lapsed Report Processing</h1>
        <p>Manual Process for POD Lapsed Report - 2025</p>
      </div>

      <div className="page-content">
        <div className="info-card">
          <h2>About This Tool</h2>
          <p>
            This tool processes the Payment on Demand (POD) Lapsed Report according to the 
            manual process guidelines for 2025. It automates the following steps:
          </p>
          
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
            <h3>File Requirements</h3>
            <ul>
              <li><strong>Main Excel File:</strong> Must contain columns for Customer Type, Product Status, Total Outstanding, Credit Class, Last Bill Value, SLT SUB SEGMENT, Product Label, Arrears, Region, and Account Number</li>
              <li><strong>Exclusion Files (Optional):</strong> Should contain Account Number column to identify accounts to exclude</li>
              <li><strong>Format:</strong> .xlsx or .xls files only</li>
            </ul>
          </div>
        </div>

        <div className="action-card">
          <button 
            className="start-filter-btn"
            onClick={() => setIsFilterOpen(true)}
          >
            <i className="fas fa-filter"></i>
            Start Filtering Process
          </button>
        </div>
      </div>

      <PODFilterComponent 
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
      />
    </div>
  );
}

export default PODFilterPage;
