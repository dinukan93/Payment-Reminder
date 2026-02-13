import React, { useState, useEffect } from "react";
import "./PODFilterComponent.css";
import { showSuccess, showError } from "./Notifications";
import { readExcelFile as readExcel, jsonToExcelBuffer, downloadExcelFile, createMultiSheetWorkbook } from '../utils/excelUtils';
import JSZip from 'jszip';
import API_BASE_URL from "../config/api";
import { secureFetch } from "../utils/api";
import logger from '../utils/logger';
import { getRegionForRtom } from "../config/regionConfig";

const steps = [
  "Upload Files",
  "VIP Separation",
  "Initial Filtration",
  "Exclusion List",
  "Enterprise Path",
  "Retail/Micro Path",
  "Complete"
];

function PODFilterComponent({ isOpen, onClose }) {
  const [mainExcel, setMainExcel] = useState(null);
  const [excludeFiles, setExcludeFiles] = useState([]);
  const [processing, setProcessing] = useState(false);
  const [distributing, setDistributing] = useState(false);
  const [results, setResults] = useState(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [showResultsModal, setShowResultsModal] = useState(false);
  const [configLoading, setConfigLoading] = useState(true);

  // Configurable thresholds - now fetched from backend
  const [config, setConfig] = useState({
    billMin: 3000,
    billMax: 10000,
    callCenterStaffLimit: 30000,
    ccLimit: 5000,
    staffLimit: 3000
  });

  // Fetch configuration from backend on component mount
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        setConfigLoading(true);
        const response = await secureFetch('/api/pod-filter-config');

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data) {
            setConfig({
              billMin: data.data.bill_min,
              billMax: data.data.bill_max,
              callCenterStaffLimit: data.data.call_center_staff_limit,
              ccLimit: data.data.cc_limit,
              staffLimit: data.data.staff_limit
            });
          }
        } else {
          logger.warn('Failed to fetch POD filter config, using defaults');
        }
      } catch (error) {
        logger.error('Error fetching POD filter config:', error);
        showError('Failed to load filter configuration. Using default values.');
      } finally {
        setConfigLoading(false);
      }
    };

    fetchConfig();
  }, []);

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

      // FIRST: Check if record meets base filtering criteria
      const isMediumCopperOrFTTH = mediumUpper.includes('COPPER') || mediumUpper.includes('FTTH');
      const isOK = productStatusUpper === 'OK';
      const meetsOutstanding = totalOutstanding > 2400;
      const meetsBaseCriteria = isMediumCopperOrFTTH && isOK && meetsOutstanding;

      // THEN: Check if VIP credit class
      const isVIP = creditClassUpper === 'VIP' || creditClassUpper.includes('VIP');

      // If meets base criteria AND is VIP → VIP assignment (no assignedTo)
      if (meetsBaseCriteria && isVIP) {
        vipRecords.push({ ...row, classification: 'VIP', path: 'VIP Path' });
      }
      // If meets base criteria but NOT VIP → goes through normal filtering
      else if (meetsBaseCriteria && !isVIP) {
        nonVipRecords.push(row);
      }
      // If doesn't meet base criteria → excluded (regardless of VIP status)
      else {
        excludedVIPs.push({
          ...row,
          exclusionReason: !isMediumCopperOrFTTH ? 'Medium not COPPER/FTTH' :
            !isOK ? 'Product Status not OK (SU)' :
              'Outstanding <= 2400'
        });
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
            enterpriseType: 'Government Institutions',
            lastBillValue
          });
        } else if (subSegmentUpper.includes('LARGE')) {
          enterpriseLargeRecords.push({
            ...row,
            path: 'Enterprise - Large',
            enterpriseType: 'Large',
            lastBillValue
          });
        } else if (subSegmentUpper.includes('MEDIUM')) {
          enterpriseMediumRecords.push({
            ...row,
            path: 'Enterprise - Medium',
            enterpriseType: 'Medium',
            lastBillValue
          });
        } else if (subSegmentUpper.includes('SME')) {
          smeRecords.push({
            ...row,
            path: 'SME',
            enterpriseType: 'SME',
            lastBillValue
          });
        } else if (subSegmentUpper.includes('WHOLESALE')) {
          wholesalesRecords.push({
            ...row,
            path: 'Wholesales',
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
        ...smeRecords,
        ...wholesalesRecords
      ];


      // Step 5: Further process Retail/Micro FTTH records (bill value assignment with config)
      const retailMicroProcessed = applyRetailMicroPath(retailMicroFromStep4, config);



      // Remaining records don't get assignedTo - will be NULL in database
      const remainingWithAssignment = remainingRecords.map(row => ({
        ...row,
        path: 'Unassigned'
      }));

      // Combine all processed data (EXCLUDING VIP - they're only for download, not for database)
      const allProcessedData = [
        ...allEnterpriseRecords,
        ...retailMicroProcessed,
        ...remainingWithAssignment
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
        regionAssigned: retailMicroProcessed.filter(r => r.assignedTo?.includes('Region')).length,
        remaining: remainingWithAssignment.length
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
      // Error logged previously via showError message if needed
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
          const vipBuffer = await jsonToExcelBuffer(results.vipData, "VIP Records");
          zip.file(`VIP_Records_${date}.xlsx`, vipBuffer);
        }

        if (results.enterpriseGovData.length > 0) {
          const govBuffer = await jsonToExcelBuffer(results.enterpriseGovData, "Enterprise-Gov");
          zip.file(`Enterprise_Gov_${date}.xlsx`, govBuffer);
        }

        if (results.enterpriseLargeData.length > 0) {
          const largeBuffer = await jsonToExcelBuffer(results.enterpriseLargeData, "Enterprise-Large");
          zip.file(`Enterprise_Large_${date}.xlsx`, largeBuffer);
        }

        if (results.enterpriseMediumData.length > 0) {
          const mediumBuffer = await jsonToExcelBuffer(results.enterpriseMediumData, "Enterprise-Medium");
          zip.file(`Enterprise_Medium_${date}.xlsx`, mediumBuffer);
        }

        if (results.wholesalesData.length > 0) {
          const wholesalesBuffer = await jsonToExcelBuffer(results.wholesalesData, "Wholesales");
          zip.file(`Wholesales_${date}.xlsx`, wholesalesBuffer);
        }

        if (results.smeData.length > 0) {
          const smeBuffer = await jsonToExcelBuffer(results.smeData, "SME");
          zip.file(`SME_${date}.xlsx`, smeBuffer);
        }

        if (results.retailMicroData.length > 0) {
          const retailBuffer = await jsonToExcelBuffer(results.retailMicroData, "Retail-Micro");
          zip.file(`Retail_Micro_${date}.xlsx`, retailBuffer);
        }

        if (results.excludedData.length > 0) {
          const excludedBuffer = await jsonToExcelBuffer(results.excludedData, "Excluded (SU)");
          zip.file(`Excluded_SU_${date}.xlsx`, excludedBuffer);
        }

        if (results.allData.length > 0) {
          const allBuffer = await jsonToExcelBuffer(results.allData, "All Records");
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
        // Download individual file type with multiple sheets if applicable
        let buffer;
        let fileName;

        if (type === 'vip') {
          buffer = await jsonToExcelBuffer(results.vipData, "VIP Records");
          fileName = `POD_Report_VIP_${date}.xlsx`;
        } else if (type === 'enterprise') {
          // Create workbook with multiple sheets for enterprise
          const sheets = {
            'Enterprise-Gov': results.enterpriseGovData,
            'Enterprise-Large': results.enterpriseLargeData,
            'Enterprise-Medium': results.enterpriseMediumData,
            'Wholesales': results.wholesalesData
          };
          buffer = await createMultiSheetWorkbook(sheets);
          fileName = `POD_Report_Enterprise_${date}.xlsx`;
        } else if (type === 'sme') {
          buffer = await jsonToExcelBuffer(results.smeData, "SME");
          fileName = `POD_Report_SME_${date}.xlsx`;
        } else if (type === 'retail') {
          buffer = await jsonToExcelBuffer(results.retailMicroData, "Retail-Micro");
          fileName = `POD_Report_Retail_${date}.xlsx`;
        } else if (type === 'excluded') {
          buffer = await jsonToExcelBuffer(results.excludedData, "Excluded (SU)");
          fileName = `POD_Report_Excluded_${date}.xlsx`;
        }

        if (buffer && fileName) {
          downloadExcelFile(buffer, fileName);
          showSuccess(`${type.toUpperCase()} results downloaded successfully`);
        }
      }
    } catch (error) {
      showError('Error downloading results. Please try again.');
    }
  };

  // Distribute filtered data to regions and RTOMs
  const distributeToRegionsAndRtoms = async () => {


    if (!results || !results.allData) {
      showError("No data available to distribute. Please run filtration first.");
      // Distribution check failed
      return;
    }

    if (!results.allData.length) {
      showError("No data to distribute. The filtered data is empty.");
      // Distribution check failed
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
          const configRegion = rtomCode ? getRegionForRtom(rtomCode) : null;
          const region = configRegion || row['REGION'] || row['region'] || 'Unknown';

          // Ensure ACCOUNT_NUMBER field exists for backend
          const mappedRow = {
            ...row,
            REGION: region,
            ACCOUNT_NUMBER: row['ACCOUNT_NUM'] || row['ACCOUNT_NUMBER'] || row['Account Number'] || row['Account_num']
          };

          return mappedRow;
        });




      if (!customersToDistribute.length) {
        showError("No valid customers to distribute. All rows are missing account numbers.");
        setDistributing(false);
        return;
      }

      // Send to backend API
      const response = await secureFetch(`/api/distribution/distribute`, {
        method: 'POST',
        body: JSON.stringify({
          customers: customersToDistribute
        })
      });

      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        showError('Server returned an error. Please check your authentication and try again.');
        setDistributing(false);
        return;
      }

      const data = await response.json();

      if (!response.ok) {
        showError(data.message || `Server error: ${response.status}`);
        setDistributing(false);
        return;
      }

      if (data.success) {
        showSuccess(`Successfully distributed ${data.summary.created + data.summary.updated} customers to regions and RTOMs`);



        if (data.summary.errors > 0) {
          showError(`${data.summary.errors} records failed to distribute. Check console for details.`);
        }
      } else {
        showError(data.message || 'Failed to distribute data');
      }
    } catch (error) {
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
                    VIP Only ({results.vipData?.length || 0})
                  </button>

                  <button
                    className="download-btn"
                    onClick={() => downloadResults('enterprise')}
                  >
                    <i className="fas fa-building"></i>
                    Enterprise (Gov + Large + Medium + Wholesales) ({(results.enterpriseGovData?.length || 0) + (results.enterpriseLargeData?.length || 0) + (results.enterpriseMediumData?.length || 0) + (results.wholesalesData?.length || 0)})
                  </button>

                  <button
                    className="download-btn"
                    onClick={() => downloadResults('sme')}
                  >
                    <i className="fas fa-briefcase"></i>
                    SME ({results.smeData?.length || 0})
                  </button>

                  <button
                    className="download-btn"
                    onClick={() => downloadResults('retail')}
                  >
                    <i className="fas fa-store"></i>
                    Retail/Micro (FTTH Only) ({results.retailMicroData?.length || 0})
                  </button>

                  <button
                    className="download-btn"
                    onClick={() => downloadResults('excluded')}
                  >
                    <i className="fas fa-ban"></i>
                    Excluded (SU) ({results.excludedData?.length || 0})
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
