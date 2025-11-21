import ExcelJS from 'exceljs';
import Customer from '../models/Customer.js';

// Upload and parse Excel file
export const uploadExcelFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        message: 'No file uploaded' 
      });
    }

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(req.file.buffer);

    const worksheet = workbook.worksheets[0]; // Get first sheet
    const rows = [];
    const headers = [];

    // Get headers from first row
    worksheet.getRow(1).eachCell((cell, colNumber) => {
      headers.push(cell.value?.toString().trim() || `Column${colNumber}`);
    });

    // Get data rows (skip header row)
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber > 1) { // Skip header
        const rowData = {};
        row.eachCell((cell, colNumber) => {
          const header = headers[colNumber - 1];
          rowData[header] = cell.value;
        });
        rows.push(rowData);
      }
    });

    // Store parsed data temporarily (you can save to DB or cache)
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

// Import Excel data to database (customers)
export const importCustomers = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        message: 'No file uploaded' 
      });
    }

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(req.file.buffer);

    const worksheet = workbook.worksheets[0];
    const customers = [];
    let headers = [];

    // Get headers
    worksheet.getRow(1).eachCell((cell, colNumber) => {
      headers.push(cell.value?.toString().trim() || `Column${colNumber}`);
    });

    // Parse rows and map to Customer model
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber > 1) {
        const rowData = {};
        row.eachCell((cell, colNumber) => {
          const header = headers[colNumber - 1];
          rowData[header] = cell.value;
        });

        // Map Excel columns to Customer model
        // Adjust these mappings based on your Excel structure
        const customer = {
          accountNumber: rowData['Account Number'] || rowData['accountNumber'],
          name: rowData['Name'] || rowData['name'],
          region: rowData['Region'] || rowData['region'] || '',
          rtom: rowData['RTOM'] || rowData['rtom'] || '',
          productLabel: rowData['Product Label'] || rowData['productLabel'] || '',
          medium: rowData['Medium'] || rowData['medium'] || '',
          latestBillAmount: parseFloat(rowData['Latest Bill Amount'] || rowData['latestBillAmount']) || 0,
          newArrears: parseFloat(rowData['New Arrears'] || rowData['newArrears']) || 0,
          amountOverdue: (rowData['Amount Overdue'] || rowData['amountOverdue'] || '0').toString(),
          daysOverdue: (rowData['Days Overdue'] || rowData['daysOverdue'] || '0').toString(),
          contactNumber: (rowData['Contact Number'] || rowData['contactNumber'] || '').toString(),
          mobileContactTel: (rowData['Mobile Contact'] || rowData['mobileContactTel'] || '').toString(),
          emailAddress: rowData['Email'] || rowData['emailAddress'] || '',
          creditScore: parseInt(rowData['Credit Score'] || rowData['creditScore']) || 0,
          creditClassName: rowData['Credit Class'] || rowData['creditClassName'] || '',
          accountManager: rowData['Account Manager'] || rowData['accountManager'] || '',
          salesPerson: rowData['Sales Person'] || rowData['salesPerson'] || '',
          status: 'UNASSIGNED'
        };

        if (customer.accountNumber && customer.name && customer.contactNumber) {
          customers.push(customer);
        }
      }
    });

    // Bulk insert customers
    const result = await Customer.insertMany(customers, { ordered: false })
      .catch(err => {
        // Handle duplicate key errors
        if (err.code === 11000) {
          return { 
            insertedCount: err.writeErrors ? customers.length - err.writeErrors.length : 0,
            duplicates: err.writeErrors?.length || 0
          };
        }
        throw err;
      });

    res.status(200).json({
      success: true,
      message: 'Customers imported successfully',
      data: {
        imported: result.insertedCount || customers.length,
        total: customers.length,
        duplicates: result.duplicates || 0
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

export default { uploadExcelFile, importCustomers };
