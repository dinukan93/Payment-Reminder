import ExcelJS from 'exceljs';
import Customer from '../models/Customer.js';

// Helper function to map Excel columns to Customer model
// Supports multiple column name variations (from different Excel formats)
const mapRowToCustomer = (rowData) => {
  return {
    accountNumber: 
      rowData['Account Number'] || 
      rowData['accountNumber'] || 
      rowData['ACCOUNT_NUM'] || 
      rowData['Account_Num'] || '',
    
    name: 
      rowData['Name'] || 
      rowData['name'] || 
      rowData['Customer Name'] || 
      rowData['CUSTOMER_NAME'] || '',
    
    region: 
      rowData['Region'] || 
      rowData['region'] || 
      rowData['REGION'] || '',
    
    rtom: 
      rowData['RTOM'] || 
      rowData['rtom'] || 
      rowData['Rtom'] || '',
    
    productLabel: 
      rowData['Product Label'] || 
      rowData['productLabel'] || 
      rowData['PRODUCT_LABEL'] || 
      rowData['Product_Label'] || '',
    
    medium: 
      rowData['Medium'] || 
      rowData['medium'] || 
      rowData['MEDIUM'] || '',
    
    latestBillAmount: parseFloat(
      rowData['Latest Bill Amount'] || 
      rowData['latestBillAmount'] || 
      rowData['LATEST_BILL_MNY'] || 
      rowData['LATEST_BILL_AMOUNT'] || 0
    ) || 0,
    
    newArrears: parseFloat(
      rowData['New Arrears'] || 
      rowData['newArrears'] || 
      rowData['NEW_ARREARS'] || 0
    ) || 0,
    
    amountOverdue: (
      rowData['Amount Overdue'] || 
      rowData['amountOverdue'] || 
      rowData['AMOUNT_OVERDUE'] || '0'
    ).toString(),
    
    daysOverdue: (
      rowData['Days Overdue'] || 
      rowData['daysOverdue'] || 
      rowData['DAYS_OVERDUE'] || '0'
    ).toString(),
    
    contactNumber: (
      rowData['Contact Number'] || 
      rowData['contactNumber'] || 
      rowData['CONTACT_NUM'] || 
      rowData['Contact_Number'] || 
      rowData['MOBILE_CONTACT_TEL'] || 
      rowData['Mobile_Contact_Tel'] || ''
    ).toString(),
    
    mobileContactTel: (
      rowData['Mobile Contact'] || 
      rowData['mobileContactTel'] || 
      rowData['MOBILE_CONTACT_TEL'] || 
      rowData['Mobile_Contact_Tel'] || 
      rowData['Contact Number'] || 
      rowData['contactNumber'] || ''
    ).toString(),
    
    emailAddress: 
      rowData['Email'] || 
      rowData['emailAddress'] || 
      rowData['EMAIL_ADDRESS'] || 
      rowData['Email_Address'] || '',
    
    creditScore: parseInt(
      rowData['Credit Score'] || 
      rowData['creditScore'] || 
      rowData['CREDIT_SCORE'] || 0
    ) || 0,
    
    creditClassName: 
      rowData['Credit Class'] || 
      rowData['creditClassName'] || 
      rowData['CREDIT_CLASS_NAME'] || 
      rowData['Credit_Class_Name'] || '',
    
    accountManager: 
      rowData['Account Manager'] || 
      rowData['accountManager'] || 
      rowData['ACCOUNT_MANAGER'] || 
      rowData['Account_Manager'] || '',
    
    salesPerson: 
      rowData['Sales Person'] || 
      rowData['salesPerson'] || 
      rowData['SALES_PERSON'] || 
      rowData['Sales_Person'] || '',
    
    status: 'UNASSIGNED'
  };
};

// Parse Excel file and return data structure
const parseExcelFile = async (fileBuffer) => {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(fileBuffer);

  const worksheet = workbook.worksheets[0];
  const rows = [];
  const headers = [];

  // Get headers from first row
  worksheet.getRow(1).eachCell((cell, colNumber) => {
    headers.push(cell.value?.toString().trim() || `Column${colNumber}`);
  });

  // Get data rows (skip header row)
  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber > 1) {
      const rowData = {};
      row.eachCell((cell, colNumber) => {
        const header = headers[colNumber - 1];
        rowData[header] = cell.value;
      });
      rows.push(rowData);
    }
  });

  return { headers, rows };
};

// @desc    Upload and parse Excel file (display only, no import)
// @route   POST /api/upload/parse
// @access  Private (Authenticated)
export const uploadExcelFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        message: 'No file uploaded' 
      });
    }

    const { headers, rows } = await parseExcelFile(req.file.buffer);

    res.status(200).json({
      success: true,
      message: 'File uploaded and parsed successfully',
      data: {
        headers,
        rows: rows.slice(0, 100), // Return first 100 rows for display
        totalRows: rows.length,
        fileName: req.file.originalname
      }
    });

  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error processing file', 
      error: error.message 
    });
  }
};

// @desc    Parse and import Excel file to database immediately
// @route   POST /api/upload/parse-and-import
// @access  Private (Authenticated)
export const parseAndImport = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        message: 'No file uploaded' 
      });
    }

    console.log('=== PARSE AND IMPORT ===');
    console.log('File name:', req.file.originalname);
    console.log('File size:', req.file.size);

    const { headers, rows } = await parseExcelFile(req.file.buffer);

    console.log('Headers found:', headers);
    console.log('Total rows in Excel:', rows.length);

    // Map and filter for Customer model
    const customers = rows
      .map(rowData => {
        console.log('Processing row:', rowData);
        return mapRowToCustomer(rowData);
      })
      .filter(c => {
        const hasAccountNumber = c.accountNumber && c.accountNumber.toString().trim() !== '';
        const hasName = c.name && c.name.toString().trim() !== '';
        const hasContactNumber = c.contactNumber && c.contactNumber.toString().trim() !== '';
        
        const valid = hasAccountNumber && hasName && hasContactNumber;
        
        if (!valid) {
          console.log('Row filtered out - Missing required fields:', {
            accountNumber: c.accountNumber,
            name: c.name,
            contactNumber: c.contactNumber,
            fullRow: c
          });
        }
        return valid;
      });

    console.log('Total customers to insert:', customers.length);
    console.log('Sample customer:', customers[0]);

    if (customers.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid customers found in file. Ensure all rows have Account Number, Name, and Contact Number.'
      });
    }

    // Bulk insert customers
    let insertedCount = 0;
    let duplicates = 0;

    try {
      const result = await Customer.insertMany(customers, { ordered: false });
      insertedCount = result.length;
      console.log('Successfully inserted:', insertedCount, 'customers');
    } catch (err) {
      if (err.code === 11000) {
        // Handle duplicate key errors
        insertedCount = err.insertedCount || customers.length - (err.writeErrors?.length || 0);
        duplicates = err.writeErrors?.length || 0;
        console.log('Partial insert due to duplicates:', { insertedCount, duplicates });
      } else {
        throw err;
      }
    }

    console.log('=== END PARSE AND IMPORT ===');

    res.status(200).json({
      success: true,
      message: 'File parsed and customers imported successfully',
      data: {
        headers,
        rows: rows.slice(0, 100),
        totalRows: rows.length,
        fileName: req.file.originalname,
        imported: insertedCount,
        duplicates: duplicates,
        totalProcessed: customers.length
      }
    });

  } catch (error) {
    console.error('Parse & Import error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error parsing/importing file', 
      error: error.message 
    });
  }
};

// @desc    Import Excel data to database (customers) - two-step process
// @route   POST /api/upload/import-customers
// @access  Private (Authenticated)
export const importCustomers = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        message: 'No file uploaded' 
      });
    }

    const { headers, rows } = await parseExcelFile(req.file.buffer);

    // Map and filter for Customer model
    const customers = rows
      .map(rowData => mapRowToCustomer(rowData))
      .filter(c => {
        const hasAccountNumber = c.accountNumber && c.accountNumber.toString().trim() !== '';
        const hasName = c.name && c.name.toString().trim() !== '';
        const hasContactNumber = c.contactNumber && c.contactNumber.toString().trim() !== '';
        
        return hasAccountNumber && hasName && hasContactNumber;
      });

    if (customers.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid customers found in file.'
      });
    }

    // Bulk insert customers
    let insertedCount = 0;
    let duplicates = 0;

    try {
      const result = await Customer.insertMany(customers, { ordered: false });
      insertedCount = result.length;
    } catch (err) {
      if (err.code === 11000) {
        insertedCount = err.insertedCount || customers.length - (err.writeErrors?.length || 0);
        duplicates = err.writeErrors?.length || 0;
      } else {
        throw err;
      }
    }

    res.status(200).json({
      success: true,
      message: 'Customers imported successfully',
      data: {
        imported: insertedCount,
        total: customers.length,
        duplicates: duplicates
      }
    });

  } catch (error) {
    console.error('Import error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error importing customers', 
      error: error.message 
    });
  }
};

export default { uploadExcelFile, parseAndImport, importCustomers };
