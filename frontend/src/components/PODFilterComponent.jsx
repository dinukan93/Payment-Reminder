import React, { useState } from "react";
import "./PODFilterComponent.css";
import { showSuccess, showError } from "./Notifications";
import * as XLSX from 'xlsx';

function PODFilterComponent({ isOpen, onClose }) {
  const [mainExcel, setMainExcel] = useState(null);
  const [excludeFiles, setExcludeFiles] = useState([]);
  const [processing, setProcessing] = useState(false);
  const [results, setResults] = useState(null);
  const [currentStep, setCurrentStep] = useState(0);
  
  // Configurable thresholds
  const [config, setConfig] = useState({
    billMin: 3000,
    billMax: 10000,
    callCenterStaffLimit: 30000,
    ccLimit: 5000,
    staffLimit: 3000
  });

  const steps = [
    "Upload Main Excel",
    "VIP Separation",
    "Initial Filtration (Non-VIP)",
    "Apply Exclusions",
    "SLT Sub Segment Classification",
    "Bill Value Assignment"
  ];

  const handleMainExcelUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
        showError("Please upload a valid Excel file (.xlsx or .xls)");
        e.target.value = null; // Clear the input
        return;
      }
      setMainExcel(file);
      showSuccess("Main Excel file uploaded successfully");
    }
  };

  const handleExcludeFileUpload = (e) => {
    const files = Array.from(e.target.files);
    const validFiles = files.filter(file => 
      file.name.endsWith('.xlsx') || file.name.endsWith('.xls')
    );
    
    if (validFiles.length !== files.length) {
      showError("Some files were not Excel files and were skipped");
    }
    
    setExcludeFiles(prev => [...prev, ...validFiles]);
    showSuccess(`${validFiles.length} exclusion file(s) added`);
    e.target.value = null; // Clear the input to allow re-uploading
  };

  const removeExcludeFile = (index) => {
    setExcludeFiles(prev => prev.filter((_, i) => i !== index));
  };

  const readExcelFile = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
          const jsonData = XLSX.utils.sheet_to_json(firstSheet);
          resolve(jsonData);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  };

  // Step 1: Separate VIP Records First (with VIP-specific criteria)
  const separateVIPRecords = (data) => {
    setCurrentStep(1);
    
    const vipRecords = [];
    const nonVipRecords = [];
    const excludedVIPs = [];
    
    data.forEach((row, index) => {
      const creditClass = String(row['CREDIT_CLASS_NAME'] || row['credit_class_name'] || row['Credit Class'] || '');
      const creditClassUpper = creditClass.toUpperCase().trim();
      const productStatus = String(row['LATEST_PRODUCT_STATUS'] || '');
      const productStatusUpper = productStatus.toUpperCase().trim();
      const medium = String(row['MEDIUM'] || row['medium'] || '');
      const mediumUpper = medium.toUpperCase().trim();
      
      // Find NEW_ARREARS column for VIP check
      const arrearsKey = Object.keys(row).find(key => 
        key.toUpperCase().includes('NEW_ARREARS')
      );
      const totalOutstanding = parseFloat(String(row[arrearsKey] || 0).replace(/,/g, ''));
      
      // Check if VIP (includes VIP, VIP - Low, VIP - Medium etc.)
      const isVIP = creditClassUpper === 'VIP' || 
                    creditClassUpper.includes('VIP');
      
      // VIP Criteria: Medium is COPPER or FTTH, Product Status OK, and Outstanding > 2400
      const isMediumCopperOrFTTH = mediumUpper.includes('COPPER') || mediumUpper.includes('FTTH');
      const isOK = productStatusUpper === 'OK';
      const meetsOutstanding = totalOutstanding > 2400;
      
      if (isVIP && isMediumCopperOrFTTH && isOK && meetsOutstanding) {
        vipRecords.push({ ...row, classification: 'VIP', path: 'VIP Path' });
      } else if (isVIP && (!isMediumCopperOrFTTH || !isOK || !meetsOutstanding)) {
        // VIP records that don't meet criteria
        excludedVIPs.push({ 
          ...row, 
          exclusionReason: !isMediumCopperOrFTTH ? 'Medium not COPPER/FTTH' :
                          !isOK ? 'Product Status not OK (SU)' : 
                          'Outstanding <= 2400'
        });
      } else if (!isVIP) {
        // Non-VIP records pass through for standard filtration
        nonVipRecords.push(row);
      }
    });
    
    // Comprehensive status breakdown for all VIP records found
    let totalVIPsFound = 0;
    let vipWithOKStatus = 0;
    let vipWithSUStatus = 0;
    let vipWithOtherStatus = 0;
    let vipCopperFTTH = 0;
    let vipNotCopperFTTH = 0;
    let vipOver2400 = 0;
    let vipUnder2400 = 0;
    
    // VIPs meeting medium + outstanding criteria (regardless of status)
    let vipMeetingMediumAndOutstanding = 0;
    let vipMeetingMediumAndOutstanding_OK = 0;
    let vipMeetingMediumAndOutstanding_SU = 0;
    let vipMeetingMediumAndOutstanding_Other = 0;
    
    data.forEach(row => {
      const creditClass = String(row['CREDIT_CLASS_NAME'] || row['credit_class_name'] || row['Credit Class'] || '');
      const creditClassUpper = creditClass.toUpperCase().trim();
      const productStatus = String(row['LATEST_PRODUCT_STATUS'] || '');
      const productStatusUpper = productStatus.toUpperCase().trim();
      const medium = String(row['MEDIUM'] || row['medium'] || '');
      const mediumUpper = medium.toUpperCase().trim();
      
      const arrearsKey = Object.keys(row).find(key => 
        key.toUpperCase().includes('NEW_ARREARS')
      );
      const totalOutstanding = parseFloat(String(row[arrearsKey] || 0).replace(/,/g, ''));
      
      const isVIP = creditClassUpper === 'VIP' || 
                    creditClassUpper.includes('VIP')
                 ;
      
      if (isVIP) {
        totalVIPsFound++;
        
        if (productStatusUpper === 'OK') vipWithOKStatus++;
        else if (productStatusUpper === 'SU') vipWithSUStatus++;
        else vipWithOtherStatus++;
        
        const isCopperFTTH = mediumUpper.includes('COPPER') || mediumUpper.includes('FTTH');
        const isOver2400 = totalOutstanding > 2400;
        
        if (isCopperFTTH) vipCopperFTTH++;
        else vipNotCopperFTTH++;
        
        if (isOver2400) vipOver2400++;
        else vipUnder2400++;
        
        // Check if VIP meets medium + outstanding criteria
        if (isCopperFTTH && isOver2400) {
          vipMeetingMediumAndOutstanding++;
          if (productStatusUpper === 'OK') vipMeetingMediumAndOutstanding_OK++;
          else if (productStatusUpper === 'SU') vipMeetingMediumAndOutstanding_SU++;
          else vipMeetingMediumAndOutstanding_Other++;
        }
      }
    });
    
    // Count VIP records by status for debugging
    const vipOKCount = vipRecords.filter(r => {
      const status = String(r['LATEST_PRODUCT_STATUS'] || '').toUpperCase().trim();
      return status === 'OK';
    }).length;
    const vipSUCount = vipRecords.filter(r => {
      const status = String(r['LATEST_PRODUCT_STATUS'] || '').toUpperCase().trim();
      return status === 'SU';
    }).length;
    
    return { vipRecords, nonVipRecords };
  };

  // Step 2: Initial Filtration - Customer Type: Medium – COPPER & FTTH, Product Status: OK (Voice), Total Outstanding > 2,400
  const applyInitialFiltration = (data) => {
    setCurrentStep(2);
    
    const filtered = [];
    const excludedRecords = [];
    
    data.forEach(row => {
      const medium = String(row['MEDIUM'] || row['medium'] || '');
      const productStatus = String(row['LATEST_PRODUCT_STATUS'] || '');
      
      // Find NEW_ARREARS column (handles date suffix like NEW_ARREARS_20251022)
      const arrearsKey = Object.keys(row).find(key => 
        key.toUpperCase().includes('NEW_ARREARS')
      );
      const totalOutstanding = parseFloat(String(row[arrearsKey] || 0).replace(/,/g, ''));
      
      const mediumUpper = medium.toUpperCase();
      const productStatusUpper = productStatus.toUpperCase();
      
      // Check Medium is COPPER or FTTH
      const isMediumCopperOrFTTH = mediumUpper.includes('COPPER') || mediumUpper.includes('FTTH');
      
      // Check Product Status: OK (not SU)
      const isOK = productStatusUpper === 'OK';
      
      // Total Outstanding > 2,400
      const meetsOutstanding = totalOutstanding > 2400;
      
      if (isMediumCopperOrFTTH && isOK && meetsOutstanding) {
        filtered.push(row);
      } else {
        excludedRecords.push({ 
          ...row, 
          exclusionReason: !isMediumCopperOrFTTH ? 'Medium not COPPER/FTTH' : 
                          !isOK ? 'Product Status not OK (likely SU)' : 
                          'Arrears <= 2400'
        });
      }
    });
    
    return { filtered, excludedRecords };
  };

  // Step 3: Apply Exclusions
  const applyExclusions = async (data) => {
    setCurrentStep(3);
    
    if (excludeFiles.length === 0) {
      return data;
    }

    const excludedAccounts = new Set();

    // Read all exclusion files
    for (const file of excludeFiles) {
      try {
        const excludeData = await readExcelFile(file);
        excludeData.forEach(row => {
          const accountNumber = row['ACCOUNT_NUM'] ;
          if (accountNumber) {
            excludedAccounts.add(accountNumber.toString());
          }
        });
      } catch (error) {
        // Error reading exclusion file
      }
    }

    // Filter out excluded accounts
    return data.filter(row => {
      const accountNumber = (row['ACCOUNT_NUM']  || '').toString();
      return !excludedAccounts.has(accountNumber);
    });
  };

  // Step 4: Enterprise Path & Retail/Micro FTTH Classification
  const applyEnterprisePath = (data) => {
    setCurrentStep(4);
    
    const enterpriseGovRecords = [];
    const enterpriseLargeRecords = [];
    const enterpriseMediumRecords = [];
    const smeRecords = [];
    const wholesalesRecords = [];
    const retailMicroRecords = [];
    const remainingRecords = [];
    
    data.forEach((row, index) => {
      // Find bill column (handles spaces in column names)
      const billKey = Object.keys(row).find(key => 
        key.trim().toUpperCase().includes('BILL') && key.trim().toUpperCase().includes('MNY')
      );
      
      const lastBillValue = parseFloat(String(row[billKey] || 0).replace(/,/g, ''));
      const subSegment = String(row['SLT_GL_SUB_SEGMENT']  || '');
      const subSegmentUpper = subSegment.toUpperCase();
      const medium = String(row['MEDIUM'] || row['medium'] || '');
      const mediumUpper = medium.toUpperCase();
      const region = String(row['REGION'] || row['region'] || 'Unknown');
      
      // Check if FTTH Medium with Retail or Micro Business Segment
      // Criteria: Medium must be FTTH AND Sub-Segment must be Retail or Micro Business
      const isFTTH = mediumUpper.includes('FTTH');
      const isRetailOrMicro = subSegment.includes('Retail') || subSegment.includes('Micro Business');
      
      if (isFTTH && isRetailOrMicro) {
        // FTTH + Retail/Micro Business: Check bill value
        if (lastBillValue > 5000) {
          // Bill Value Over 5,000 → Billing Center (Region)
          retailMicroRecords.push({ 
            ...row, 
            lastBillValue,
            assignedTo: `Region - ${region} (Billing Center)`,
            path: 'Retail/Micro FTTH - High Bill Value',
            directToBillingCenter: true
          });
        } else {
          // Bill Value <= 5,000 → Goes through Call Center distribution
          retailMicroRecords.push({ ...row, lastBillValue });
        }
      } else if (lastBillValue > 5000) {
        // Check bill value for enterprise categorization
        // Categorize by segment type
        if (subSegmentUpper.includes('GOVERNMENT') || subSegmentUpper.includes('INST')) {
          enterpriseGovRecords.push({ 
            ...row, 
            path: 'Enterprise - Government Institutions',
            assignedTo: 'Enterprise Gov',
            enterpriseType: 'Government Institutions',
            lastBillValue 
          });
        } else if (subSegmentUpper.includes('LARGE')) {
          enterpriseLargeRecords.push({ 
            ...row, 
            path: 'Enterprise - Large',
            assignedTo: 'Enterprise Large',
            enterpriseType: 'Large',
            lastBillValue 
          });
        } else if (subSegmentUpper.includes('MEDIUM')) {
          enterpriseMediumRecords.push({ 
            ...row, 
            path: 'Enterprise - Medium',
            assignedTo: 'Enterprise Medium',
            enterpriseType: 'Medium',
            lastBillValue 
          });
        } else if (subSegmentUpper.includes('SME')) {
          smeRecords.push({ 
            ...row, 
            path: 'SME',
            assignedTo: 'SME',
            enterpriseType: 'SME',
            lastBillValue 
          });
        } else if (subSegmentUpper.includes('WHOLESALE')) {
          wholesalesRecords.push({
            ...row, 
            path: 'Wholesales',
            assignedTo: 'Wholesales',
            enterpriseType: 'Wholesales',
            lastBillValue 
          });
        } else {
          remainingRecords.push({ ...row, lastBillValue });
        }
      } else {
        remainingRecords.push({ ...row, lastBillValue });
      }
    });
    
    const totalEnterprise = enterpriseGovRecords.length + enterpriseLargeRecords.length + 
                           enterpriseMediumRecords.length + wholesalesRecords.length;
    
    return { 
      enterpriseGovRecords, 
      enterpriseLargeRecords, 
      enterpriseMediumRecords,
      smeRecords, 
      wholesalesRecords,
      retailMicroRecords,
      remainingRecords 
    };
  };

  // Step 5: Retail/Micro FTTH Path - Assignment based on bill value (Sequential Assignment)
  const applyRetailMicroPath = (data, configLimits) => {
    setCurrentStep(5);
    
    // Counters for sequential assignment
    let callCenterStaffCount = 0;
    let ccCount = 0;
    let staffCount = 0;
    
    return data.map(row => {
      // If already assigned to billing center (bill > 5000), skip further processing
      if (row.directToBillingCenter) {
        return row;
      }
      
      // Use lastBillValue if available, otherwise find bill column dynamically
      let billValue = row.lastBillValue;
      if (!billValue) {
        const billKey = Object.keys(row).find(key => 
          key.trim().toUpperCase().includes('BILL') && key.trim().toUpperCase().includes('MNY')
        );
        billValue = parseFloat(String(row[billKey] || 0).replace(/,/g, ''));
      }
      
      // Find LATEST_BILL_MNY column
      const billKey = Object.keys(row).find(key => 
        key.toUpperCase() === 'LATEST_BILL_MNY'
      );
      const latestBill = parseFloat(String(row[billKey] || 0).replace(/,/g, ''));
      
      const region = String(row['REGION'] || row['region'] || 'Unknown');
      
      // Find NEW_ARREARS column for checking arrears range
      const arrearsKey = Object.keys(row).find(key => 
        key.toUpperCase().includes('NEW_ARREARS')
      );
      const newArrears = parseFloat(String(row[arrearsKey] || 0).replace(/,/g, ''));
      
      // Bill Value <= 5,000: Check NEW_ARREARS (3000 < NEW_ARREARS < 10000)
      if (newArrears > 3000 && newArrears < 10000) {
        // Sequential assignment: First fill Call Center Staff, then CC, then Staff, then Billing Center
        if (callCenterStaffCount < configLimits.callCenterStaffLimit) {
          callCenterStaffCount++;
          return { 
            ...row, 
            assignedTo: 'Call Center Staff',
            accountLimit: `${configLimits.callCenterStaffLimit} Accounts`,
            assignedNumber: callCenterStaffCount,
            path: 'Retail/Micro FTTH - Call Center',
            billValue,
            latestBill,
            newArrears
          };
        } else if (ccCount < configLimits.ccLimit) {
          ccCount++;
          return { 
            ...row, 
            assignedTo: 'CC',
            accountLimit: `${configLimits.ccLimit} Accounts`,
            assignedNumber: ccCount,
            path: 'Retail/Micro FTTH - Call Center',
            billValue,
            latestBill,
            newArrears
          };
        } else if (staffCount < configLimits.staffLimit) {
          staffCount++;
          return { 
            ...row, 
            assignedTo: 'Staff',
            accountLimit: `${configLimits.staffLimit} Accounts`,
            assignedNumber: staffCount,
            path: 'Retail/Micro FTTH - Call Center',
            billValue,
            latestBill,
            newArrears
          };
        } else {
          // All call center quotas filled → Billing Center
          return { 
            ...row, 
            assignedTo: `Region - ${region} (Billing Center)`,
            path: 'Retail/Micro FTTH - Call Center Quota Full',
            billValue,
            latestBill,
            newArrears
          };
        }
      } else {
        // NEW_ARREARS outside range (<=3000 or >=10000) → Region (Billing Center)
        return { 
          ...row, 
          assignedTo: `Region - ${region} (Billing Center)`,
          path: 'Retail/Micro FTTH - Out of Arrears Range',
          billValue,
          latestBill,
          newArrears
        };
      }
    });
  };

  // Main processing function
  const processExcel = async () => {
    if (!mainExcel) {
      showError("Please upload the main Excel file");
      return;
    }

    setProcessing(true);
    setCurrentStep(0);

    try {
      const mainData = await readExcelFile(mainExcel);
      
      // Step 1: Separate VIP Records First (with VIP-specific criteria: not SU, >2400)
      const { vipRecords, nonVipRecords } = separateVIPRecords(mainData);
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Step 2: Initial Filtration (for non-VIP records only)
      const { filtered: filteredData, excludedRecords } = applyInitialFiltration(nonVipRecords);
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Step 3: Apply Exclusions (to non-VIP records)
      let nonVipAfterExclusion = await applyExclusions(filteredData);
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Step 4: Enterprise Path & Retail/Micro FTTH Classification (Bill > 5000 with segments + ALL FTTH Retail/Micro)
      const { enterpriseGovRecords, enterpriseLargeRecords, enterpriseMediumRecords, smeRecords, wholesalesRecords, retailMicroRecords: retailMicroFromStep4, remainingRecords } = applyEnterprisePath(nonVipAfterExclusion);
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Combine all enterprise records
      const allEnterpriseRecords = [
        ...enterpriseGovRecords,
        ...enterpriseLargeRecords,
        ...enterpriseMediumRecords,
        ...wholesalesRecords
      ];
      
      // Step 5: Further process Retail/Micro FTTH records (bill value assignment with config)
      const retailMicroProcessed = applyRetailMicroPath(retailMicroFromStep4, config);
      
      // Combine all processed data
      const allProcessedData = [
        ...vipRecords,
        ...allEnterpriseRecords,
        ...retailMicroProcessed
      ];
      
      // Calculate statistics
      const stats = {
        totalRecords: mainData.length,
        vipRecords: vipRecords.length,
        nonVipRecords: nonVipRecords.length,
        excludedAtStart: excludedRecords.length,
        afterInitialFiltration: filteredData.length,
        afterExclusion: nonVipAfterExclusion.length,
        enterpriseGov: enterpriseGovRecords.length,
        enterpriseLarge: enterpriseLargeRecords.length,
        enterpriseMedium: enterpriseMediumRecords.length,
        sme: smeRecords.length,
        wholesales: wholesalesRecords.length,
        totalEnterprise: allEnterpriseRecords.length,
        retailMicro: retailMicroProcessed.length,
        callCenterStaff: retailMicroProcessed.filter(r => r.assignedTo === 'Call Center Staff').length,
        cc: retailMicroProcessed.filter(r => r.assignedTo === 'CC').length,
        staff: retailMicroProcessed.filter(r => r.assignedTo === 'Staff').length,
        regionAssigned: retailMicroProcessed.filter(r => r.assignedTo?.includes('Region')).length
      };
      
      setResults({
        allData: allProcessedData,
        vipData: vipRecords,
        enterpriseGovData: enterpriseGovRecords,
        enterpriseLargeData: enterpriseLargeRecords,
        enterpriseMediumData: enterpriseMediumRecords,
        smeData: smeRecords,
        wholesalesData: wholesalesRecords,
        retailMicroData: retailMicroProcessed,
        excludedData: excludedRecords,
        stats
      });
      
      setCurrentStep(6);
      
      if (allProcessedData.length === 0) {
        showError("All records were filtered out. Check console for details.");
      } else {
        showSuccess(`Processing complete! ${allProcessedData.length} records processed.`);
      }
    } catch (error) {
      console.error("Error processing Excel:", error);
      showError("Error processing Excel file. Check console for details.");
    } finally {
      setProcessing(false);
    }
  };

  // Download results as Excel
  const downloadResults = (type = 'all') => {
    if (!results) return;

    const workbook = XLSX.utils.book_new();
    const date = new Date().toISOString().split('T')[0];
    
    if (type === 'all' || type === 'vip') {
      const vipSheet = XLSX.utils.json_to_sheet(results.vipData);
      XLSX.utils.book_append_sheet(workbook, vipSheet, "VIP Records");
    }
    
    if (type === 'all' || type === 'enterprise') {
      // Combine Enterprise Gov, Large, Medium, and Wholesales into separate sheets in one workbook
      const govSheet = XLSX.utils.json_to_sheet(results.enterpriseGovData);
      XLSX.utils.book_append_sheet(workbook, govSheet, "Enterprise-Gov");
      
      const largeSheet = XLSX.utils.json_to_sheet(results.enterpriseLargeData);
      XLSX.utils.book_append_sheet(workbook, largeSheet, "Enterprise-Large");
      
      const mediumSheet = XLSX.utils.json_to_sheet(results.enterpriseMediumData);
      XLSX.utils.book_append_sheet(workbook, mediumSheet, "Enterprise-Medium");
      
      const wholesalesSheet = XLSX.utils.json_to_sheet(results.wholesalesData);
      XLSX.utils.book_append_sheet(workbook, wholesalesSheet, "Wholesales");
    }
    
    if (type === 'all' || type === 'sme') {
      const smeSheet = XLSX.utils.json_to_sheet(results.smeData);
      XLSX.utils.book_append_sheet(workbook, smeSheet, "SME");
    }
    
    if (type === 'all' || type === 'retail') {
      const retailSheet = XLSX.utils.json_to_sheet(results.retailMicroData);
      XLSX.utils.book_append_sheet(workbook, retailSheet, "Retail-Micro");
    }
    
    if (type === 'all' || type === 'excluded') {
      const excludedSheet = XLSX.utils.json_to_sheet(results.excludedData);
      XLSX.utils.book_append_sheet(workbook, excludedSheet, "Excluded (SU)");
    }
    
    if (type === 'all') {
      const allSheet = XLSX.utils.json_to_sheet(results.allData);
      XLSX.utils.book_append_sheet(workbook, allSheet, "All Records");
    }
    
    const fileName = `POD_Report_${type}_${date}.xlsx`;
    XLSX.writeFile(workbook, fileName);
    
    showSuccess(`${type.toUpperCase()} results downloaded successfully`)``;
  };

  const reset = () => {
    setMainExcel(null);
    setExcludeFiles([]);
    setResults(null);
    setCurrentStep(0);
    
    // Clear file input values
    const mainExcelInput = document.getElementById('mainExcel');
    const excludeFilesInput = document.getElementById('excludeFiles');
    if (mainExcelInput) mainExcelInput.value = null;
    if (excludeFilesInput) excludeFilesInput.value = null;
  };

  if (!isOpen) return null;

  return (
    <div className="pod-filter-overlay">
      <div className="pod-filter-modal">
        <div className="pod-filter-header">
          <h2>POD Lapsed Report Filter - 2025</h2>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>

        <div className="pod-filter-body">
          {/* Progress Steps */}
          <div className="progress-steps">
            {steps.map((step, index) => (
              <div 
                key={index} 
                className={`step ${currentStep === index ? 'active' : ''} ${currentStep > index ? 'completed' : ''}`}
              >
                <div className="step-number">{index + 1}</div>
                <div className="step-label">{step}</div>
              </div>
            ))}
          </div>

          {/* Main Excel Upload */}
          <div className="upload-section">
            <h3>1. Upload Main Excel File</h3>
            <div className="upload-area">
              <input
                type="file"
                id="mainExcel"
                accept=".xlsx,.xls"
                onChange={handleMainExcelUpload}
                style={{ display: 'none' }}
              />
              <label htmlFor="mainExcel" className="upload-label">
                {mainExcel ? (
                  <div className="file-info">
                    <i className="fas fa-file-excel"></i>
                    <span>{mainExcel.name}</span>
                    <button 
                      className="remove-file-btn"
                      onClick={(e) => {
                        e.preventDefault();
                        setMainExcel(null);
                      }}
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <div className="upload-prompt">
                    <i className="fas fa-cloud-upload-alt"></i>
                    <p>Click to upload main Excel file</p>
                    <span>Accepted formats: .xlsx, .xls</span>
                  </div>
                )}
              </label>
            </div>
          </div>

          {/* Exclude Files Upload */}
          <div className="upload-section">
            <h3>2. Upload Exclusion Files (Optional)</h3>
            <p className="section-description">
              Upload Special Exclusions, Bulk SU FTTH No List (End Cycle & Mid Cycle)
            </p>
            <div className="upload-area">
              <input
                type="file"
                id="excludeFiles"
                accept=".xlsx,.xls"
                multiple
                onChange={handleExcludeFileUpload}
                style={{ display: 'none' }}
              />
              <label htmlFor="excludeFiles" className="upload-label-secondary">
                <i className="fas fa-plus-circle"></i>
                <span>Add Exclusion Files</span>
              </label>
            </div>

            {excludeFiles.length > 0 && (
              <div className="exclude-files-list">
                <h4>Exclusion Files ({excludeFiles.length})</h4>
                <ul>
                  {excludeFiles.map((file, index) => (
                    <li key={index}>
                      <i className="fas fa-file-excel"></i>
                      <span>{file.name}</span>
                      <button 
                        className="remove-btn"
                        onClick={() => removeExcludeFile(index)}
                      >
                        <i className="fas fa-times"></i>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Configuration Section */}
          <div className="upload-section">
            <h3>3. Configure Account Distribution Limits</h3>
            <p className="config-description">
              Configure account distribution limits for call center assignments. 
              Retail/Micro FTTH records with NEW_ARREARS between 3,000 and 10,000 will be distributed across call centers.
            </p>

            <div className="config-section">
              <h4>Account Distribution Limits</h4>
              <div className="config-grid">
                <div className="config-item">
                  <label>Call Center Staff Limit:</label>
                  <input 
                    type="number" 
                    value={config.callCenterStaffLimit}
                    onChange={(e) => setConfig({...config, callCenterStaffLimit: parseInt(e.target.value)})}
                    placeholder="e.g., 30000"
                  />
                  <span className="config-hint">Maximum accounts for Call Center Staff</span>
                </div>
                <div className="config-item">
                  <label>Call Center Limit:</label>
                  <input 
                    type="number" 
                    value={config.ccLimit}
                    onChange={(e) => setConfig({...config, ccLimit: parseInt(e.target.value)})}
                    placeholder="e.g., 5000"
                  />
                  <span className="config-hint">Maximum accounts for CC</span>
                </div>
                <div className="config-item">
                  <label>Staff Limit:</label>
                  <input 
                    type="number" 
                    value={config.staffLimit}
                    onChange={(e) => setConfig({...config, staffLimit: parseInt(e.target.value)})}
                    placeholder="e.g., 3000"
                  />
                  <span className="config-hint">Maximum accounts for Staff</span>
                </div>
              </div>
              <div className="config-summary">
                <strong>Total Capacity:</strong> {config.callCenterStaffLimit + config.ccLimit + config.staffLimit} accounts
              </div>
            </div>
          </div>

          {/* Process Button */}
          <div className="action-section">
            <button
              className="process-btn"
              onClick={processExcel}
              disabled={!mainExcel || processing}
            >
              {processing ? (
                <>
                  <i className="fas fa-spinner fa-spin"></i>
                  Processing...
                </>
              ) : (
                <>
                  <i className="fas fa-filter"></i>
                  Filter & Process
                </>
              )}
            </button>

            {results && (
              <>
                <button className="download-btn" onClick={() => downloadResults('all')}>
                  <i className="fas fa-download"></i>
                  Download All
                </button>
                <button className="download-btn" onClick={() => downloadResults('enterprise')}>
                  <i className="fas fa-building"></i>
                  Enterprise (Gov + Large + Wholesales)
                </button>
                <button className="download-btn" onClick={() => downloadResults('sme')}>
                  <i className="fas fa-briefcase"></i>
                  SME
                </button>
                <button className="download-btn" onClick={() => downloadResults('vip')}>
                  <i className="fas fa-crown"></i>
                  VIP Only
                </button>
                <button className="download-btn" onClick={() => downloadResults('retail')}>
                  <i className="fas fa-store"></i>
                  Retail/Micro (FTTH Only)
                </button>
                <button className="download-btn" onClick={() => downloadResults('excluded')}>
                  <i className="fas fa-ban"></i>
                  Excluded (SU)
                </button>
              </>
            )}

            {(mainExcel || excludeFiles.length > 0) && (
              <button className="reset-btn" onClick={reset}>
                <i className="fas fa-redo"></i>
                Reset
              </button>
            )}
          </div>

          {/* Results Summary */}
          {results && (
            <div className="results-section">
              <h3>Processing Results</h3>
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-label">Total Records</div>
                  <div className="stat-value">{results.stats.totalRecords}</div>
                </div>
                <div className="stat-card">
                  <div className="stat-label">Excluded Records</div>
                  <div className="stat-value error">{results.stats.excludedAtStart}</div>
                </div>
                <div className="stat-card">
                  <div className="stat-label">After Initial Filter</div>
                  <div className="stat-value success">{results.stats.afterInitialFiltration}</div>
                </div>
                <div className="stat-card">
                  <div className="stat-label">VIP Records</div>
                  <div className="stat-value warning">{results.stats.vipRecords}</div>
                </div>
                <div className="stat-card">
                  <div className="stat-label">Non-VIP Records</div>
                  <div className="stat-value">{results.stats.nonVipRecords}</div>
                </div>
                <div className="stat-card">
                  <div className="stat-label">After Exclusions</div>
                  <div className="stat-value">{results.stats.afterExclusion}</div>
                </div>
                <div className="stat-card">
                  <div className="stat-label">Retail/Micro (FTTH Only)</div>
                  <div className="stat-value info">{results.stats.retailMicro}</div>
                </div>
              </div>

              <div className="assignment-summary">
                <h4>Enterprise Breakdown (Bill &gt; 5,000)</h4>
                <div className="assignment-grid">
                  <div className="assignment-item">
                    <span>Enterprise - Government Inst.:</span>
                    <strong>{results.stats.enterpriseGov}</strong>
                  </div>
                  <div className="assignment-item">
                    <span>Enterprise - Large:</span>
                    <strong>{results.stats.enterpriseLarge}</strong>
                  </div>
                  <div className="assignment-item">
                    <span>Enterprise - Medium:</span>
                    <strong>{results.stats.enterpriseMedium}</strong>
                  </div>
                  <div className="assignment-item">
                    <span>Wholesales:</span>
                    <strong>{results.stats.wholesales}</strong>
                  </div>
                  <div className="assignment-item">
                    <span><strong>Total Enterprise:</strong></span>
                    <strong>{results.stats.totalEnterprise}</strong>
                  </div>
                  <div className="assignment-item">
                    <span>SME (Separate):</span>
                    <strong>{results.stats.sme}</strong>
                  </div>
                </div>
              </div>

              <div className="assignment-summary">
                <h4>Assignment Distribution (FTTH - Retail/Micro Business Only)</h4>
                <div className="assignment-grid">
                  <div className="assignment-item">
                    <span>Call Center Staff:</span>
                    <strong>{results.stats.callCenterStaff}</strong>
                  </div>
                  <div className="assignment-item">
                    <span>Call Center:</span>
                    <strong>{results.stats.cc}</strong>
                  </div>
                  <div className="assignment-item">
                    <span>Staff:</span>
                    <strong>{results.stats.staff}</strong>
                  </div>
                  <div className="assignment-item">
                    <span>Region (Billing Center):</span>
                    <strong>{results.stats.regionAssigned}</strong>
                  </div>
                </div>
              </div>
              
              <div className="export-info">
                <h4>Export Options:</h4>
                <ul>
                  <li><strong>Enterprise (Gov + Large + Medium + Wholesales):</strong> One Excel with 4 sheets - Government Institutions, Large Enterprise, Medium Enterprise, and Wholesales (all with Bill Value &gt; 5,000)</li>
                  <li><strong>SME:</strong> Separate Excel for Small & Medium Enterprises with Bill Value &gt; 5,000</li>
                  <li><strong>VIP Only:</strong> All VIP credit class records</li>
                  <li><strong>Retail/Micro (FTTH Only):</strong> Only FTTH medium with Retail or Micro Business sub-segment (all bill values)</li>
                  <li><strong>Excluded (SU) Only:</strong> Records filtered out in initial filtration (likely Suspended status)</li>
                  <li><strong>Download All:</strong> Complete processed dataset with all categories in separate sheets</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default PODFilterComponent;
