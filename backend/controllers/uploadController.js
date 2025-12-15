import ExcelJS from 'exceljs';
import Customer from '../models/Customer.js';
import Request from '../models/Request.js';

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
const parseExcelFile = async (fileBuffer, fileName = '') => {
  try {
    const workbook = new ExcelJS.Workbook();
    
    // Determine file type and parse accordingly
    const isXlsx = fileName.toLowerCase().endsWith('.xlsx');
    const isXls = fileName.toLowerCase().endsWith('.xls');
    const isCsv = fileName.toLowerCase().endsWith('.csv');
    
    console.log('File type detection:', { fileName, isXlsx, isXls, isCsv });
    
    if (isCsv) {
      // Parse CSV - convert buffer to stream
      const { Readable } = await import('stream');
      const stream = Readable.from(fileBuffer.toString('utf-8'));
      await workbook.csv.read(stream);
    } else {
      // Try parsing as XLSX (supports both .xlsx and .xls in most cases)
      try {
        await workbook.xlsx.load(fileBuffer);
      } catch (xlsxError) {
        console.error('XLSX parsing failed:', xlsxError.message);
        throw new Error('Unable to parse file. Please save it as .xlsx format in Excel and try again.');
      }
    }

    const worksheet = workbook.worksheets[0];
    
    if (!worksheet) {
      throw new Error('No worksheet found in the Excel file');
    }

    const rows = [];
    const headers = [];

    // Get headers from first row
    const headerRow = worksheet.getRow(1);
    if (!headerRow) {
      throw new Error('No header row found in the worksheet');
    }

    headerRow.eachCell((cell, colNumber) => {
      const value = cell.value;
      // Handle different cell value types
      let headerText = '';
      if (typeof value === 'string') {
        headerText = value.trim();
      } else if (value && typeof value === 'object' && value.text) {
        headerText = value.text.trim();
      } else if (value !== null && value !== undefined) {
        headerText = value.toString().trim();
      }
      headers.push(headerText || `Column${colNumber}`);
    });

    if (headers.length === 0) {
      throw new Error('No headers found in the Excel file');
    }

    console.log('Headers found:', headers);

    // Get data rows (skip header row)
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber > 1) {
        const rowData = {};
        row.eachCell((cell, colNumber) => {
          const header = headers[colNumber - 1];
          if (header) {
            let cellValue = cell.value;
            // Handle rich text and formula values
            if (cellValue && typeof cellValue === 'object') {
              if (cellValue.result !== undefined) {
                cellValue = cellValue.result; // Formula result
              } else if (cellValue.richText) {
                cellValue = cellValue.richText.map(t => t.text).join('');
              } else if (cellValue.text) {
                cellValue = cellValue.text;
              }
            }
            rowData[header] = cellValue;
          }
        });
        // Only add rows that have at least one non-empty value
        if (Object.values(rowData).some(val => val !== null && val !== undefined && val !== '')) {
          rows.push(rowData);
        }
      }
    });

    console.log(`Parsed ${rows.length} data rows`);
    return { headers, rows };
  } catch (error) {
    console.error('Excel parsing error:', error);
    throw new Error(`Failed to parse Excel file: ${error.message}`);
  }
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

    console.log('Parsing file:', req.file.originalname);
    console.log('File size:', req.file.size);
    console.log('File mimetype:', req.file.mimetype);

    // Validate file buffer
    if (!req.file.buffer || req.file.buffer.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'File buffer is empty'
      });
    }

    const { headers, rows } = await parseExcelFile(req.file.buffer, req.file.originalname);

    console.log('Parsed successfully:', headers.length, 'headers,', rows.length, 'rows');

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

    const { headers, rows } = await parseExcelFile(req.file.buffer, req.file.originalname);

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

    const { headers, rows } = await parseExcelFile(req.file.buffer, req.file.originalname);

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

// @desc    Import arrears update (handle partial payments and update customer status)
// @route   POST /api/upload/import-arrears
// @access  Private (Authenticated)
export const importArrears = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        message: 'No file uploaded' 
      });
    }

    const { headers, rows } = await parseExcelFile(req.file.buffer, req.file.originalname);

    console.log('=== IMPORT ARREARS ===');
    console.log('File name:', req.file.originalname);
    console.log('Headers:', headers);
    console.log('Total rows:', rows.length);

    let updated = 0;
    let skipped = 0;
    const errors = [];

    for (const row of rows) {
      try {
        // Extract account number and new arrears from row
        const accountNumber = 
          row['Account Number'] || 
          row['accountNumber'] || 
          row['ACCOUNT_NUM'] || 
          row['Account_Num'];

        const newArrears = parseFloat(
          row['New Arrears'] || 
          row['newArrears'] || 
          row['NEW_ARREARS'] || 
          row['Arrears'] || 0
        );

        // Validate required fields
        if (!accountNumber || accountNumber.toString().trim() === '') {
          skipped++;
          console.warn('Skipped: No account number in row:', row);
          continue;
        }

        // Find customer by account number
        const customer = await Customer.findOne({ 
          accountNumber: accountNumber.toString().trim() 
        });

        if (!customer) {
          skipped++;
          errors.push(`Account ${accountNumber} not found in database`);
          console.warn('Skipped: Customer not found for account:', accountNumber);
          continue;
        }

        // Calculate payment amount (difference between old and new arrears)
        const oldArrears = customer.newArrears || 0;
        const paymentAmount = oldArrears - newArrears;

        console.log(`Processing Account ${accountNumber}:`, {
          oldArrears,
          newArrears,
          paymentAmount
        });

        // Update customer arrears and status
        customer.newArrears = newArrears;
        customer.status = 'COMPLETED'; // Mark as completed due to partial payment
        await customer.save();

        // Create request record for the payment (optional, for tracking)
        if (paymentAmount > 0) {
          const newRequest = new Request({
            customerId: customer._id,
            accountNumber: customer.accountNumber,
            paymentAmount: paymentAmount,
            description: `Partial payment received. Arrears reduced from ${oldArrears} to ${newArrears}`,
            status: 'COMPLETED',
            completedDate: new Date()
          });
          await newRequest.save();
          console.log('Request created for account:', accountNumber);
        }

        updated++;
      } catch (err) {
        skipped++;
        console.error('Error processing row:', err.message);
        errors.push(`Error processing row: ${err.message}`);
      }
    }

    console.log('=== END IMPORT ARREARS ===');
    console.log('Summary:', { updated, skipped, errors: errors.slice(0, 5) });

    res.status(200).json({
      success: true,
      message: `Arrears updated successfully`,
      data: {
        updated,
        skipped,
        total: rows.length,
        errors: errors.slice(0, 10) // Return first 10 errors
      }
    });

  } catch (error) {
    console.error('Import arrears error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error importing arrears', 
      error: error.message 
    });
  }
};

// @desc    Mark customers as paid by account number
// @route   POST /api/upload/mark-paid
// @access  Private (Authenticated)
export const markCustomersAsPaid = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        message: 'No file uploaded' 
      });
    }

    const { headers, rows } = await parseExcelFile(req.file.buffer, req.file.originalname);

    console.log('=== MARK AS PAID ===');
    console.log('File name:', req.file.originalname);
    console.log('Headers:', headers);
    console.log('Total rows:', rows.length);

    let marked = 0;
    let skipped = 0;
    const errors = [];

    for (const row of rows) {
      try {
        // Extract account number from row
        const accountNumber = 
          row['Account Number'] || 
          row['accountNumber'] || 
          row['ACCOUNT_NUM'] || 
          row['Account_Num'] ||
          row['Account'] ||
          row['account'];

        // Validate required fields
        if (!accountNumber || accountNumber.toString().trim() === '') {
          skipped++;
          console.warn('Skipped: No account number in row:', row);
          continue;
        }

        // Find customer by account number
        const customer = await Customer.findOne({ 
          accountNumber: accountNumber.toString().trim() 
        });

        if (!customer) {
          skipped++;
          errors.push(`Account ${accountNumber} not found in database`);
          console.warn('Skipped: Customer not found for account:', accountNumber);
          continue;
        }

        // Extract new arrears from row (flexible column naming)
        const newArrears = parseFloat(
          row['NEW_ARREARS'] ||
          row['New Arrears'] ||
          row['newArrears'] ||
          row['Arrears'] ||
          0
        );

        // Check if NEW_ARREARS field exists in the Excel file (any variant)
        const hasNewArrearsField = headers.some(header => 
          header === 'NEW_ARREARS' || 
          header === 'New Arrears' || 
          header === 'newArrears' || 
          header === 'Arrears'
        );

        console.log(`Processing Account ${accountNumber}:`, {
          currentArrears: customer.newArrears,
          newArrears,
          newArrearsType: typeof newArrears,
          hasNewArrearsField,
          willBeCompleted: !(hasNewArrearsField && newArrears > 0),
          paymentType: hasNewArrearsField ? 'PARTIAL' : 'FULL'
        });

        // Update customer with new arrears value (allow negative for credit balance)
        customer.newArrears = newArrears;
        console.log(`Updated new arrears to: ${newArrears}`);

        // Update customer status: COMPLETED if full payment (no NEW_ARREARS field, newArrears = 0, or negative/overpayment), PENDING if partial
        customer.status = (hasNewArrearsField && newArrears > 0) ? 'PENDING' : 'COMPLETED';
        console.log(`Status set to: ${customer.status} (hasNewArrearsField: ${hasNewArrearsField}, newArrears > 0: ${newArrears > 0})`);
        
        // Update amountOverdue to reflect remaining balance (negative values allowed for credit)
        customer.amountOverdue = (customer.newArrears || 0).toString();
        
        // Save updated customer
        await customer.save();

        // Create request record for the payment (for tracking)
        if (newArrears > 0 || !hasNewArrearsField) {
          const description = hasNewArrearsField 
            ? `Partial payment received. Remaining arrears: ${customer.newArrears}`
            : `Full payment received. Account settled.`;
            
          const newRequest = new Request({
            customerId: customer._id,
            accountNumber: customer.accountNumber,
            paymentAmount: hasNewArrearsField ? 0 : customer.newArrears,
            description: description,
            status: 'COMPLETED',
            completedDate: new Date()
          });
          await newRequest.save();
          console.log('Request record created for account:', accountNumber);
        }

        marked++;
      } catch (err) {
        skipped++;
        console.error('Error processing row:', err.message);
        errors.push(`Error processing row: ${err.message}`);
      }
    }

    console.log('=== END MARK AS PAID ===');
    console.log('Summary:', { marked, skipped, errors: errors.slice(0, 5) });

    res.status(200).json({
      success: true,
      message: `Successfully marked ${marked} customers as paid`,
      data: {
        marked,
        skipped,
        total: rows.length,
        errors: errors.slice(0, 10) // Return first 10 errors
      }
    });

  } catch (error) {
    console.error('Mark paid error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error marking customers as paid', 
      error: error.message 
    });
  }
};

export default { uploadExcelFile, parseAndImport, importCustomers, importArrears, markCustomersAsPaid };
