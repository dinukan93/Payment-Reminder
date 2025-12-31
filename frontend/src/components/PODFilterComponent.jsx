import React, { useState } from "react";
import "./PODFilterComponent.css";
import { showSuccess, showError } from "./Notifications";
import { readExcelFile as readExcel, jsonToExcelBuffer } from '../utils/excelUtils';
import JSZip from 'jszip';
import API_BASE_URL from "../config/api";
import { secureFetch } from "../utils/api";
import { getRegionForRtom } from "../config/regionConfig";

function PODFilterComponent({ isOpen, onClose }) {
  const [mainExcel, setMainExcel] = useState(null);
  const [excludeFiles, setExcludeFiles] = useState([]);
  const [processing, setProcessing] = useState(false);
  const [distributing, setDistributing] = useState(false);
  const [results, setResults] = useState(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [showResultsModal, setShowResultsModal] = useState(false);

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

  // Convert Excel date serial number to YYYY-MM-DD format
  const convertExcelDate = (excelDate) => {
    if (!excelDate) return null;

    // If it's already a string date, return it
    if (typeof excelDate === 'string') return excelDate;

    // If it's a number (Excel serial date)
    if (typeof excelDate === 'number') {
      // Excel dates are days since 1900-01-01 (with leap year bug)
      const excelEpoch = new Date(1899, 11, 30); // Dec 30, 1899
      const days = Math.floor(excelDate);
      const date = new Date(excelEpoch.getTime() + days * 24 * 60 * 60 * 1000);

      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');

      return `${year}-${month}-${day}`;
    }

    return null;
  };

  const readExcelFile = async (file) => {
    try {
      const jsonData = await readExcel(file);

      // Convert date fields if needed
      const processedData = jsonData.map(row => {
        const processed = { ...row };

        // Convert RUN_DATE if it exists and is in Excel date format
        if (processed['RUN_DATE']) {
          const converted = convertExcelDate(processed['RUN_DATE']);
          if (converted) processed['RUN_DATE'] = converted;
        }

        return processed;
      });

      return processedData;
    } catch (error) {
      throw error;
    }
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
          const accountNumber = row['ACCOUNT_NUM'];
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
      const accountNumber = (row['ACCOUNT_NUM'] || '').toString();
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
      const subSegment = String(row['SLT_GL_SUB_SEGMENT'] || '');
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
      setShowResultsModal(true);

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
  const downloadResults = async (type = 'all') => {
    if (!results) return;

    const date = new Date().toISOString().split('T')[0];

    try {
      if (type === 'all') {
        // Download all files as separate Excel files in a ZIP
        const zip = new JSZip();

        if (results.vipData.length > 0) {
          const vipSheet = XLSX.utils.json_to_sheet(results.vipData);
          const vipWorkbook = XLSX.utils.book_new();
          XLSX.utils.book_append_sheet(vipWorkbook, vipSheet, "VIP Records");
          const vipBuffer = XLSX.write(vipWorkbook, { bookType: 'xlsx', type: 'array' });
          zip.file(`VIP_Records_${date}.xlsx`, vipBuffer);
        }

        if (results.enterpriseGovData.length > 0) {
          const govSheet = XLSX.utils.json_to_sheet(results.enterpriseGovData);
          const govWorkbook = XLSX.utils.book_new();
          XLSX.utils.book_append_sheet(govWorkbook, govSheet, "Enterprise-Gov");
          const govBuffer = XLSX.write(govWorkbook, { bookType: 'xlsx', type: 'array' });
          zip.file(`Enterprise_Gov_${date}.xlsx`, govBuffer);
        }

        if (results.enterpriseLargeData.length > 0) {
          const largeSheet = XLSX.utils.json_to_sheet(results.enterpriseLargeData);
          const largeWorkbook = XLSX.utils.book_new();
          XLSX.utils.book_append_sheet(largeWorkbook, largeSheet, "Enterprise-Large");
          const largeBuffer = XLSX.write(largeWorkbook, { bookType: 'xlsx', type: 'array' });
          zip.file(`Enterprise_Large_${date}.xlsx`, largeBuffer);
        }

        if (results.enterpriseMediumData.length > 0) {
          const mediumSheet = XLSX.utils.json_to_sheet(results.enterpriseMediumData);
          const mediumWorkbook = XLSX.utils.book_new();
          XLSX.utils.book_append_sheet(mediumWorkbook, mediumSheet, "Enterprise-Medium");
          const mediumBuffer = XLSX.write(mediumWorkbook, { bookType: 'xlsx', type: 'array' });
          zip.file(`Enterprise_Medium_${date}.xlsx`, mediumBuffer);
        }

        if (results.wholesalesData.length > 0) {
          const wholesalesSheet = XLSX.utils.json_to_sheet(results.wholesalesData);
          const wholesalesWorkbook = XLSX.utils.book_new();
          XLSX.utils.book_append_sheet(wholesalesWorkbook, wholesalesSheet, "Wholesales");
          const wholesalesBuffer = XLSX.write(wholesalesWorkbook, { bookType: 'xlsx', type: 'array' });
          zip.file(`Wholesales_${date}.xlsx`, wholesalesBuffer);
        }

        if (results.smeData.length > 0) {
          const smeSheet = XLSX.utils.json_to_sheet(results.smeData);
          const smeWorkbook = XLSX.utils.book_new();
          XLSX.utils.book_append_sheet(smeWorkbook, smeSheet, "SME");
          const smeBuffer = XLSX.write(smeWorkbook, { bookType: 'xlsx', type: 'array' });
          zip.file(`SME_${date}.xlsx`, smeBuffer);
        }

        if (results.retailMicroData.length > 0) {
          const retailSheet = XLSX.utils.json_to_sheet(results.retailMicroData);
          const retailWorkbook = XLSX.utils.book_new();
          XLSX.utils.book_append_sheet(retailWorkbook, retailSheet, "Retail-Micro");
          const retailBuffer = XLSX.write(retailWorkbook, { bookType: 'xlsx', type: 'array' });
          zip.file(`Retail_Micro_${date}.xlsx`, retailBuffer);
        }

        if (results.excludedData.length > 0) {
          const excludedSheet = XLSX.utils.json_to_sheet(results.excludedData);
          const excludedWorkbook = XLSX.utils.book_new();
          XLSX.utils.book_append_sheet(excludedWorkbook, excludedSheet, "Excluded (SU)");
          const excludedBuffer = XLSX.write(excludedWorkbook, { bookType: 'xlsx', type: 'array' });
          zip.file(`Excluded_SU_${date}.xlsx`, excludedBuffer);
        }

        if (results.allData.length > 0) {
          const allSheet = XLSX.utils.json_to_sheet(results.allData);
          const allWorkbook = XLSX.utils.book_new();
          XLSX.utils.book_append_sheet(allWorkbook, allSheet, "All Records");
          const allBuffer = XLSX.write(allWorkbook, { bookType: 'xlsx', type: 'array' });
          zip.file(`All_Records_${date}.xlsx`, allBuffer);
        }

        // Generate ZIP and download
        const zipContent = await zip.generateAsync({ type: 'blob' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(zipContent);
        link.download = `POD_Report_All_${date}.zip`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);

        showSuccess('All results downloaded as ZIP file successfully');
      } else {
        // Download individual file type
        const workbook = XLSX.utils.book_new();

        if (type === 'vip') {
          const vipSheet = XLSX.utils.json_to_sheet(results.vipData);
          XLSX.utils.book_append_sheet(workbook, vipSheet, "VIP Records");
        } else if (type === 'enterprise') {
          const govSheet = XLSX.utils.json_to_sheet(results.enterpriseGovData);
          XLSX.utils.book_append_sheet(workbook, govSheet, "Enterprise-Gov");
          const largeSheet = XLSX.utils.json_to_sheet(results.enterpriseLargeData);
          XLSX.utils.book_append_sheet(workbook, largeSheet, "Enterprise-Large");
          const mediumSheet = XLSX.utils.json_to_sheet(results.enterpriseMediumData);
          XLSX.utils.book_append_sheet(workbook, mediumSheet, "Enterprise-Medium");
          const wholesalesSheet = XLSX.utils.json_to_sheet(results.wholesalesData);
          XLSX.utils.book_append_sheet(workbook, wholesalesSheet, "Wholesales");
        } else if (type === 'sme') {
          const smeSheet = XLSX.utils.json_to_sheet(results.smeData);
          XLSX.utils.book_append_sheet(workbook, smeSheet, "SME");
        } else if (type === 'retail') {
          const retailSheet = XLSX.utils.json_to_sheet(results.retailMicroData);
          XLSX.utils.book_append_sheet(workbook, retailSheet, "Retail-Micro");
        } else if (type === 'excluded') {
          const excludedSheet = XLSX.utils.json_to_sheet(results.excludedData);
          XLSX.utils.book_append_sheet(workbook, excludedSheet, "Excluded (SU)");
        }

        const fileName = `POD_Report_${type}_${date}.xlsx`;
        XLSX.writeFile(workbook, fileName);

        showSuccess(`${type.toUpperCase()} results downloaded successfully`);
      }
    } catch (error) {
      console.error('Error downloading results:', error);
      showError('Error downloading results. Please try again.');
    }
  };

  // Distribute filtered data to regions and RTOMs
  const distributeToRegionsAndRtoms = async () => {
    console.log('Distribution triggered. Results:', results);

    if (!results || !results.allData) {
      showError("No data available to distribute. Please run filtration first.");
      console.error('No results or allData:', { results, hasAllData: results?.allData });
      return;
    }

    if (!results.allData.length) {
      showError("No data to distribute. The filtered data is empty.");
      console.error('Empty allData array');
      return;
    }

    setDistributing(true);

    try {
      // Send the raw Excel data directly to backend - no mapping needed
      const customersToDistribute = results.allData
        .filter(row => {
          // Only include rows with account number - check multiple possible field names
          const accountNumber = row['ACCOUNT_NUM'] || row['ACCOUNT_NUMBER'] || row['Account Number'] || row['Account_num'] || '';
          const isValid = accountNumber && accountNumber.toString().trim() !== '';
          if (!isValid) {
            console.warn('Row missing account number:', Object.keys(row).slice(0, 5));
          }
          return isValid;
        })
        .map(row => {
          // Add REGION from RTOM if not present
          const rtomCode = row['RTOM'] || null;
          const region = rtomCode ? getRegionForRtom(rtomCode) : (row['REGION'] || null);

          // Ensure ACCOUNT_NUMBER field exists for backend
          return {
            ...row,
            REGION: region,
            ACCOUNT_NUMBER: row['ACCOUNT_NUM'] || row['ACCOUNT_NUMBER'] || row['Account Number'] || row['Account_num']
          };
        });

      console.log('Customers to distribute:', customersToDistribute.length, 'Sample:', customersToDistribute.slice(0, 2));

      if (!customersToDistribute.length) {
        showError("No valid customers to distribute. All rows are missing account numbers.");
        setDistributing(false);
        return;
      }

      // Send to backend API
      const token = localStorage.getItem('token');
      if (!token) {
        showError("Authentication token not found. Please log in again.");
        setDistributing(false);
        return;
      }

      const response = await secureFetch(`/distribution/distribute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          customers: customersToDistribute
        })
      });

      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('Non-JSON response:', text.substring(0, 500));
        showError('Server returned an error. Please check your authentication and try again.');
        setDistributing(false);
        return;
      }

      const data = await response.json();

      if (!response.ok) {
        showError(data.message || `Server error: ${response.status}`);
        console.error('Distribution failed:', data);
        setDistributing(false);
        return;
      }

      if (data.success) {
        showSuccess(`Successfully distributed ${data.summary.created + data.summary.updated} customers to regions and RTOMs`);

        // Show distribution summary
        console.log('Distribution Summary:', data.summary);

        if (data.summary.errors > 0) {
          showError(`${data.summary.errors} records failed to distribute. Check console for details.`);
          console.error('Distribution errors:', data.errors);
        }
      } else {
        showError(data.message || 'Failed to distribute data');
        console.error('Distribution failed:', data);
      }
    } catch (error) {
      console.error('Distribution error:', error);
      showError('An error occurred while distributing data to regions and RTOMs');
    } finally {
      setDistributing(false);
    }
  };

  const reset = () => {
    setMainExcel(null);
    setExcludeFiles([]);
    setResults(null);
    setCurrentStep(0);
    setShowResultsModal(false);

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
                    onChange={(e) => setConfig({ ...config, callCenterStaffLimit: parseInt(e.target.value) })}
                    placeholder="e.g., 30000"
                  />
                  <span className="config-hint">Maximum accounts for Call Center Staff</span>
                </div>
                <div className="config-item">
                  <label>Call Center Limit:</label>
                  <input
                    type="number"
                    value={config.ccLimit}
                    onChange={(e) => setConfig({ ...config, ccLimit: parseInt(e.target.value) })}
                    placeholder="e.g., 5000"
                  />
                  <span className="config-hint">Maximum accounts for CC</span>
                </div>
                <div className="config-item">
                  <label>Staff Limit:</label>
                  <input
                    type="number"
                    value={config.staffLimit}
                    onChange={(e) => setConfig({ ...config, staffLimit: parseInt(e.target.value) })}
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

            {(mainExcel || excludeFiles.length > 0) && (
              <button className="reset-btn" onClick={reset}>
                <i className="fas fa-redo"></i>
                Reset
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Results Modal - Shows after filtering completes */}
      {showResultsModal && results && (
        <div className="pod-filter-overlay">
          <div className="pod-filter-modal">
            <div className="pod-filter-header">
              <h2>Filtering Complete - Download Results</h2>
              <button className="close-btn" onClick={() => setShowResultsModal(false)}>&times;</button>
            </div>

            <div className="pod-filter-body results-split-layout">
              {/* Left Side - Results Summary */}
              <div className="results-left-column">
                {/* Success Message and Summary */}
                <div className="results-summary">
                  <div className="success-message">
                    <i className="fas fa-check-circle"></i>
                    <p>Successfully processed <strong>{results.stats.totalRecords}</strong> records</p>
                    <small>after filtering: <strong>{results.stats.afterInitialFiltration}</strong> records</small>
                  </div>

                  <div className="results-summary-section">
                    <h3>Processing Summary</h3>
                    <div className="summary-grid">
                      <div className="summary-item">
                        <span>Total Records Processed:</span>
                        <strong>{results.stats.totalRecords}</strong>
                      </div>
                      <div className="summary-item">
                        <span>After Filtering:</span>
                        <strong className="success">{results.stats.afterInitialFiltration}</strong>
                      </div>
                      <div className="summary-item">
                        <span>VIP Records:</span>
                        <strong className="warning">{results.stats.vipRecords}</strong>
                      </div>
                      <div className="summary-item">
                        <span>Enterprise Accounts:</span>
                        <strong>{results.stats.totalEnterprise}</strong>
                      </div>
                      <div className="summary-item">
                        <span>SME Accounts:</span>
                        <strong>{results.stats.sme}</strong>
                      </div>
                      <div className="summary-item">
                        <span>Retail/Micro (FTTH):</span>
                        <strong className="info">{results.stats.retailMicro}</strong>
                      </div>
                    </div>

                    <h4 style={{ marginTop: '25px', marginBottom: '15px', fontSize: '16px', color: '#1f2937', borderBottom: '2px solid #e5e7eb', paddingBottom: '10px' }}>
                      Distribution Breakdown (Retail/Micro)
                    </h4>
                    <div className="summary-grid">
                      <div className="summary-item">
                        <span>Call Center Staff:</span>
                        <strong>{results.stats.callCenterStaff || 0}</strong>
                      </div>
                      <div className="summary-item">
                        <span>Call Center (CC):</span>
                        <strong>{results.stats.cc || 0}</strong>
                      </div>
                      <div className="summary-item">
                        <span>Staff:</span>
                        <strong>{results.stats.staff || 0}</strong>
                      </div>
                      <div className="summary-item">
                        <span>Region (Billing Center):</span>
                        <strong>{results.stats.regionAssigned || 0}</strong>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Side - Download Buttons */}
              <div className="results-right-column">
                {/* Distribute Button */}
                <button
                  className="distribute-btn"
                  onClick={distributeToRegionsAndRtoms}
                  disabled={!results?.allData?.length}
                  style={{
                    backgroundColor: (!results?.allData?.length) ? '#ccc' : '#dc2626',
                    cursor: (!results?.allData?.length) ? 'not-allowed' : 'pointer'
                  }}
                  title={!results?.allData?.length ? 'Process filtration first to enable distribution' : 'Distribute filtered data to database'}
                >
                  {distributing ? (
                    <>
                      <i className="fas fa-spinner fa-spin"></i>
                      Distributing...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-share-alt"></i>
                      Distribute to Regions & RTOMs {results?.allData?.length ? `(${results.allData.length})` : ''}
                    </>
                  )}
                </button>

                {/* Download Buttons Section */}
                <div className="action-section results-action-section">
                  <button
                    className="download-btn"
                    onClick={() => downloadResults('all')}
                    title="Download all categories as separate Excel files in a ZIP"
                  >
                    <i className="fas fa-file-archive"></i>
                    Download All as ZIP
                  </button>

                  <button
                    className="download-btn"
                    onClick={() => downloadResults('vip')}
                  >
                    <i className="fas fa-crown"></i>
                    VIP Only ({results.vip?.length || 0})
                  </button>

                  <button
                    className="download-btn"
                    onClick={() => downloadResults('enterprise')}
                  >
                    <i className="fas fa-building"></i>
                    Enterprise (Gov + Large + Medium + Wholesales) ({(results.enterpriseGov?.length || 0) + (results.enterpriseLarge?.length || 0) + (results.enterpriseMedium?.length || 0) + (results.wholesales?.length || 0)})
                  </button>

                  <button
                    className="download-btn"
                    onClick={() => downloadResults('sme')}
                  >
                    <i className="fas fa-briefcase"></i>
                    SME ({results.sme?.length || 0})
                  </button>

                  <button
                    className="download-btn"
                    onClick={() => downloadResults('retail')}
                  >
                    <i className="fas fa-store"></i>
                    Retail/Micro (FTTH Only) ({results.retail?.length || 0})
                  </button>

                  <button
                    className="download-btn"
                    onClick={() => downloadResults('excluded')}
                  >
                    <i className="fas fa-ban"></i>
                    Excluded (SU) ({results.excluded?.length || 0})
                  </button>

                  <button
                    className="reset-btn"
                    onClick={() => setShowResultsModal(false)}
                  >
                    <i className="fas fa-arrow-left"></i>
                    Back to Filtering
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PODFilterComponent;
