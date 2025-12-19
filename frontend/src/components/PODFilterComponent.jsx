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
    arrearsMin: 3000,
    arrearsMax: 10000,
    callCenterStaffLimit: 30000,
    ccLimit: 5000,
    staffLimit: 3000
  });

  const steps = [
    "Upload Main Excel",
    "Initial Filtration",
    "Credit Class Check",
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

  // Step 1: Initial Filtration - Customer Type: Medium – COPPER & FTTH, Product Status: OK (Voice), Total Outstanding > 2,400
  const applyInitialFiltration = (data) => {
    setCurrentStep(1);
    
    if (data.length > 0) {
      console.log('Sample row columns:', Object.keys(data[0]));
      console.log('Sample row data:', data[0]);
    }
    
    const filtered = [];
    const excludedRecords = [];
    
    data.forEach(row => {
      const medium = String(row['MEDIUM'] || row['medium'] || '');
      const productStatus = String(row['LATEST_PRODUCT_STATUS'] || row['PRODUCT_STATUS'] || row['product_status'] || row['Product Status'] || '');
      
      // Find arrears column (handles date suffix like W_ARREARS_20251022)
      const arrearsKey = Object.keys(row).find(key => 
        key.toUpperCase().includes('ARREARS')
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
      
      if (data.indexOf(row) < 5) {
        console.log(`\n=== Row ${data.indexOf(row)} Details ===`);
        console.log('Raw values:', { medium, productStatus, arrearsKey, totalOutstanding });
        console.log('Uppercase:', { mediumUpper, productStatusUpper });
        console.log('Checks:', {
          'Medium is COPPER/FTTH': isMediumCopperOrFTTH,
          'isOK': isOK,
          'meetsOutstanding': meetsOutstanding,
          'PASSES': isMediumCopperOrFTTH && isOK && meetsOutstanding
        });
      }
      
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
    
    console.log(`Initial Filtration: ${data.length} → ${filtered.length} records (${excludedRecords.length} excluded)`);
    return { filtered, excludedRecords };
  };

  // Step 2: Credit Class Check - Separate VIP from others
  const applyCreditClassCheck = (data) => {
    setCurrentStep(2);
    
    const vipRecords = [];
    const nonVipRecords = [];
    
    data.forEach(row => {
      const creditClass = String(row['CREDIT_CLASS_NAME'] || row['credit_class_name'] || row['Credit Class'] || '');
      const creditClassUpper = creditClass.toUpperCase();
      
      // Check if VIP (includes VIP, VIP - Low, VIP - Medium, Domestic Interconnect, etc.)
      const isVIP = creditClassUpper === 'VIP' || 
                    creditClassUpper.includes('VIP') || 
                    creditClassUpper.includes('DOMESTIC INTERCONNECT');
      
      if (isVIP) {
        vipRecords.push({ ...row, classification: 'VIP', path: 'VIP Path' });
      } else {
        nonVipRecords.push({ ...row, classification: 'Other Credit Classes', path: 'Non-VIP Path' });
      }
    });
    
    console.log(`Credit Class Check: ${vipRecords.length} VIP, ${nonVipRecords.length} Non-VIP`);
    return { vipRecords, nonVipRecords };
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
          const accountNumber = row['ACCOUNT_NUM'] ||
                               row['Account Number'] || 
                               row['account_number'] || 
                               row['AccountNumber'] || 
                               row['Account_Number'];
          if (accountNumber) {
            excludedAccounts.add(accountNumber.toString());
          }
        });
      } catch (error) {
        console.error(`Error reading exclusion file ${file.name}:`, error);
      }
    }

    // Filter out excluded accounts
    return data.filter(row => {
      const accountNumber = (row['ACCOUNT_NUM'] ||
                            row['Account Number'] || 
                            row['account_number'] || 
                            row['AccountNumber'] || 
                            row['Account_Number'] || '').toString();
      return !excludedAccounts.has(accountNumber);
    });
  };

  // Step 4: Enterprise Path - Last Bill > 5,000 with specific segments
  const applyEnterprisePath = (data) => {
    setCurrentStep(4);
    
    const enterpriseGovRecords = [];
    const enterpriseLargeRecords = [];
    const enterpriseMediumRecords = [];
    const smeRecords = [];
    const wholesalesRecords = [];
    const remainingRecords = [];
    
    data.forEach((row, index) => {
      // Find bill column (handles spaces in column names)
      const billKey = Object.keys(row).find(key => 
        key.trim().toUpperCase().includes('BILL') && key.trim().toUpperCase().includes('MNY')
      );
      
      if (index === 0) {
        console.log('Found bill column:', billKey);
        console.log('Bill value:', row[billKey]);
      }
      
      const lastBillValue = parseFloat(String(row[billKey] || 0).replace(/,/g, ''));
      const subSegment = String(row['SLT_GL_SUB_SEGMENT']  || '');
      const subSegmentUpper = subSegment.toUpperCase();
      
      // Log first few records to debug
      if (index < 5) {
        console.log(`\n=== Enterprise Check Row ${index} ===`);
        console.log('Raw Bill Value from row:', row['LATEST_BILL_MNY']);
        console.log('Parsed Bill Value:', lastBillValue);
        console.log('Sub Segment:', subSegment);
        console.log('Bill > 5000:', lastBillValue > 5000);
      }
      
      // Check bill value first
      if (lastBillValue > 5000) {
        // Categorize by segment type
        if (subSegmentUpper.includes('GOVERNMENT') || subSegmentUpper.includes('INST')) {
          console.log(`→ Categorized as Enterprise Gov: ${subSegment}`);
          enterpriseGovRecords.push({ 
            ...row, 
            path: 'Enterprise - Government Institutions',
            assignedTo: 'Enterprise Gov',
            enterpriseType: 'Government Institutions',
            lastBillValue 
          });
        } else if (subSegmentUpper.includes('LARGE')) {
          console.log(`→ Categorized as Enterprise Large: ${subSegment}`);
          enterpriseLargeRecords.push({ 
            ...row, 
            path: 'Enterprise - Large',
            assignedTo: 'Enterprise Large',
            enterpriseType: 'Large',
            lastBillValue 
          });
        } else if (subSegmentUpper.includes('MEDIUM')) {
          console.log(`→ Categorized as Enterprise Medium: ${subSegment}`);
          enterpriseMediumRecords.push({ 
            ...row, 
            path: 'Enterprise - Medium',
            assignedTo: 'Enterprise Medium',
            enterpriseType: 'Medium',
            lastBillValue 
          });
        } else if (subSegmentUpper.includes('SME')) {
          console.log(`→ Categorized as SME: ${subSegment}`);
          smeRecords.push({ 
            ...row, 
            path: 'SME',
            assignedTo: 'SME',
            enterpriseType: 'SME',
            lastBillValue 
          });
        } else if (subSegmentUpper.includes('WHOLESALE')) {
          console.log(`→ Categorized as Wholesales: ${subSegment}`);
          wholesalesRecords.push({ 
            ...row, 
            path: 'Wholesales',
            assignedTo: 'Wholesales',
            enterpriseType: 'Wholesales',
            lastBillValue 
          });
        } else {
          console.log(`→ Not categorized (remaining): ${subSegment}`);
          remainingRecords.push({ ...row, lastBillValue });
        }
      } else {
        remainingRecords.push({ ...row, lastBillValue });
      }
    });
    
    const totalEnterprise = enterpriseGovRecords.length + enterpriseLargeRecords.length + 
                           enterpriseMediumRecords.length + wholesalesRecords.length;
    console.log(`Enterprise Path: ${totalEnterprise} enterprise (Gov: ${enterpriseGovRecords.length}, Large: ${enterpriseLargeRecords.length}, Medium: ${enterpriseMediumRecords.length}, Wholesales: ${wholesalesRecords.length}), ${smeRecords.length} SME, ${remainingRecords.length} remaining`);
    
    return { 
      enterpriseGovRecords, 
      enterpriseLargeRecords, 
      enterpriseMediumRecords,
      smeRecords, 
      wholesalesRecords,
      remainingRecords 
    };
  };

  // Step 5: Retail/Micro FTTH Path - Assignment based on bill value and arrears
  const applyRetailMicroPath = (data) => {
    setCurrentStep(5);
    
    console.log(`Using configuration: Arrears Range ${config.arrearsMin}-${config.arrearsMax}, Limits: Staff=${config.callCenterStaffLimit}, CC=${config.ccLimit}, Staff=${config.staffLimit}`);
    
    return data.map(row => {
      const medium = String(row['MEDIUM'] || row['medium'] || '');
      const subSegment = String(row['SLT_GL_SUB_SEGMENT'] || row['slt_gl_sub_segment'] || '');
      
      // Use lastBillValue if available, otherwise find bill column dynamically
      let billValue = row.lastBillValue;
      if (!billValue) {
        const billKey = Object.keys(row).find(key => 
          key.trim().toUpperCase().includes('BILL') && key.trim().toUpperCase().includes('MNY')
        );
        billValue = parseFloat(String(row[billKey] || 0).replace(/,/g, ''));
      }
      
      // Find arrears column (handles date suffix)
      const arrearsKey = Object.keys(row).find(key => 
        key.toUpperCase().startsWith('NEW_ARREARS')  
        
      );
      const arrears = parseFloat(String(row[arrearsKey] || 0).replace(/,/g, ''));
      
      const region = String(row['REGION'] || row['region'] || 'Unknown');
      
      // Only process FTTH with Retail or Micro Business
      const isFTTH = medium.toUpperCase().includes('FTTH');
      const isRetailOrMicro = subSegment.includes('Retail') || subSegment.includes('Micro Business');
      
      if (!isFTTH || !isRetailOrMicro) {
        return { ...row, assignedTo: 'Not Processed', path: 'Excluded' };
      }
      
      // Bill Value Over 5,000 → Region (Billing Center)
      if (billValue > 5000) {
        return { 
          ...row, 
          assignedTo: `Region - ${region} (Billing Center)`,
          path: 'Retail/Micro - High Bill Value',
          billValue,
          arrears
        };
      }
      
      // Bill Value < 5,000: Check arrears
      if (arrears > config.arrearsMin && arrears < config.arrearsMax) {
        // Distribute based on configured limits
        const totalAccounts = config.callCenterStaffLimit + config.ccLimit + config.staffLimit;
        const rand = Math.random();
        
        if (rand < config.callCenterStaffLimit / totalAccounts) {
          return { 
            ...row, 
            assignedTo: 'Call Center Staff',
            accountLimit: `${config.callCenterStaffLimit} Accounts`,
            path: 'Retail/Micro - Call Center',
            billValue,
            arrears
          };
        } else if (rand < (config.callCenterStaffLimit + config.ccLimit) / totalAccounts) {
          return { 
            ...row, 
            assignedTo: 'CC',
            accountLimit: `${config.ccLimit} Accounts`,
            path: 'Retail/Micro - Call Center',
            billValue,
            arrears
          };
        } else {
          return { 
            ...row, 
            assignedTo: 'Staff',
            accountLimit: `${config.staffLimit} Accounts`,
            path: 'Retail/Micro - Call Center',
            billValue,
            arrears
          };
        }
      } else {
        // Arrears outside range → Region (Billing Center)
        return { 
          ...row, 
          assignedTo: `Region - ${region} (Billing Center)`,
          path: 'Retail/Micro - Out of Range',
          billValue,
          arrears
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
      
      // Step 1: Initial Filtration
      const { filtered: filteredData, excludedRecords } = applyInitialFiltration(mainData);
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Step 2: Credit Class Check - Separate VIP from Non-VIP
      const { vipRecords, nonVipRecords } = applyCreditClassCheck(filteredData);
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Step 3: Apply Exclusions (only to non-VIP)
      let nonVipAfterExclusion = await applyExclusions(nonVipRecords);
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Step 4: Enterprise Path (Bill > 5000 with specific segments)
      const { enterpriseGovRecords, enterpriseLargeRecords, enterpriseMediumRecords, smeRecords, wholesalesRecords, remainingRecords } = applyEnterprisePath(nonVipAfterExclusion);
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Combine all enterprise records
      const allEnterpriseRecords = [
        ...enterpriseGovRecords,
        ...enterpriseLargeRecords,
        ...enterpriseMediumRecords,
        ...wholesalesRecords
      ];
      
      // Step 5: Retail/Micro FTTH Path (remaining records)
      const retailMicroRecords = applyRetailMicroPath(remainingRecords);
      
      // Combine all processed data
      const allProcessedData = [
        ...vipRecords,
        ...allEnterpriseRecords,
        ...retailMicroRecords
      ];
      
      // Calculate statistics
      const stats = {
        totalRecords: mainData.length,
        excludedAtStart: excludedRecords.length,
        afterInitialFiltration: filteredData.length,
        vipRecords: vipRecords.length,
        nonVipRecords: nonVipRecords.length,
        afterExclusion: nonVipAfterExclusion.length,
        enterpriseGov: enterpriseGovRecords.length,
        enterpriseLarge: enterpriseLargeRecords.length,
        enterpriseMedium: enterpriseMediumRecords.length,
        sme: smeRecords.length,
        wholesales: wholesalesRecords.length,
        totalEnterprise: allEnterpriseRecords.length,
        callCenterStaff: retailMicroRecords.filter(r => r.assignedTo === 'Call Center Staff').length,
        cc: retailMicroRecords.filter(r => r.assignedTo === 'CC').length,
        staff: retailMicroRecords.filter(r => r.assignedTo === 'Staff').length,
        regionAssigned: retailMicroRecords.filter(r => r.assignedTo?.includes('Region')).length
      };
      
      setResults({
        allData: allProcessedData,
        vipData: vipRecords,
        enterpriseGovData: enterpriseGovRecords,
        enterpriseLargeData: enterpriseLargeRecords,
        enterpriseMediumData: enterpriseMediumRecords,
        smeData: smeRecords,
        wholesalesData: wholesalesRecords,
        retailMicroData: retailMicroRecords,
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
    
    showSuccess(`${type.toUpperCase()} results downloaded successfully`);
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
            <h3>3. Configure Thresholds & Limits</h3>
            <p className="config-description">
              Configure arrears ranges and account distribution limits for call center assignments. 
              Records with arrears between {config.arrearsMin} and {config.arrearsMax} will be distributed across call centers.
            </p>
            
            <div className="config-section">
              <h4>Arrears Range</h4>
              <div className="config-grid">
                <div className="config-item">
                  <label>Minimum Arrears (Rs.):</label>
                  <input 
                    type="number" 
                    value={config.arrearsMin}
                    onChange={(e) => setConfig({...config, arrearsMin: parseFloat(e.target.value)})}
                    placeholder="e.g., 3000"
                  />
                  <span className="config-hint">Lower threshold for call center assignment</span>
                </div>
                <div className="config-item">
                  <label>Maximum Arrears (Rs.):</label>
                  <input 
                    type="number" 
                    value={config.arrearsMax}
                    onChange={(e) => setConfig({...config, arrearsMax: parseFloat(e.target.value)})}
                    placeholder="e.g., 10000"
                  />
                  <span className="config-hint">Upper threshold for call center assignment</span>
                </div>
              </div>
            </div>

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
                  <label>CC Limit:</label>
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
                  Retail/Micro Only
                </button>
                <button className="download-btn" onClick={() => downloadResults('excluded')}>
                  <i className="fas fa-ban"></i>
                  Excluded (SU) Only
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
              </div>

              <div className="assignment-summary">
                <h4>Enterprise Breakdown (Bill {'>'} 5,000)</h4>
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
                <h4>Assignment Distribution (Retail/Micro FTTH)</h4>
                <div className="assignment-grid">
                  <div className="assignment-item">
                    <span>Call Center Staff:</span>
                    <strong>{results.stats.callCenterStaff}</strong>
                  </div>
                  <div className="assignment-item">
                    <span>CC:</span>
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
                  <li><strong>Retail/Micro Only:</strong> FTTH Retail/Micro Business assignments</li>
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
