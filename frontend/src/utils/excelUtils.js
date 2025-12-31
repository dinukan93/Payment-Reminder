import ExcelJS from 'exceljs';

/**
 * ExcelJS Utility - Secure replacement for xlsx library
 * Provides methods for reading and writing Excel files
 */

/**
 * Read Excel file and convert to JSON
 * @param {File} file - The Excel file to read
 * @returns {Promise<Array>} Array of row objects
 */
export const readExcelFile = async (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = async (e) => {
            try {
                const buffer = e.target.result;
                const workbook = new ExcelJS.Workbook();
                await workbook.xlsx.load(buffer);

                // Get first worksheet
                const worksheet = workbook.worksheets[0];

                if (!worksheet) {
                    reject(new Error('No worksheet found in Excel file'));
                    return;
                }

                // Convert to JSON
                const jsonData = [];
                const headers = [];

                // Get headers from first row
                worksheet.getRow(1).eachCell((cell, colNumber) => {
                    headers[colNumber] = cell.value?.toString().trim() || `Column${colNumber}`;
                });

                // Process data rows
                worksheet.eachRow((row, rowNumber) => {
                    if (rowNumber === 1) return; // Skip header row

                    const rowData = {};
                    row.eachCell((cell, colNumber) => {
                        const header = headers[colNumber];
                        if (header) {
                            // Handle different cell types
                            let value = cell.value;

                            // Convert dates to string format
                            if (cell.type === ExcelJS.ValueType.Date) {
                                const date = new Date(value);
                                const year = date.getFullYear();
                                const month = String(date.getMonth() + 1).padStart(2, '0');
                                const day = String(date.getDate()).padStart(2, '0');
                                value = `${year}-${month}-${day}`;
                            } else if (typeof value === 'object' && value !== null) {
                                // Handle rich text and formulas
                                value = value.result || value.text || String(value);
                            }

                            rowData[header] = value !== null && value !== undefined ? String(value) : '';
                        }
                    });

                    // Only add rows that have at least one value
                    if (Object.keys(rowData).length > 0) {
                        jsonData.push(rowData);
                    }
                });

                resolve(jsonData);
            } catch (error) {
                reject(error);
            }
        };

        reader.onerror = reject;
        reader.readAsArrayBuffer(file);
    });
};

/**
 * Convert JSON data to Excel buffer
 * @param {Array} data - Array of objects to convert
 * @param {string} sheetName - Name for the worksheet
 * @returns {Promise<ArrayBuffer>} Excel file as ArrayBuffer
 */
export const jsonToExcelBuffer = async (data, sheetName = 'Sheet1') => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(sheetName);

    if (data.length === 0) {
        return await workbook.xlsx.writeBuffer();
    }

    // Get headers from first object
    const headers = Object.keys(data[0]);

    // Add header row
    worksheet.addRow(headers);

    // Style header row
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFD3D3D3' }
    };

    // Add data rows
    data.forEach(row => {
        const values = headers.map(header => row[header] || '');
        worksheet.addRow(values);
    });

    // Auto-fit columns
    worksheet.columns.forEach(column => {
        let maxLength = 0;
        column.eachCell({ includeEmpty: true }, cell => {
            const cellValue = cell.value ? cell.value.toString() : '';
            maxLength = Math.max(maxLength, cellValue.length);
        });
        column.width = Math.min(maxLength + 2, 50); // Max width of 50
    });

    return await workbook.xlsx.writeBuffer();
};

/**
 * Create Excel workbook with multiple sheets
 * @param {Object} sheets - Object with sheet names as keys and data arrays as values
 * @returns {Promise<ArrayBuffer>} Excel file as ArrayBuffer
 */
export const createMultiSheetWorkbook = async (sheets) => {
    const workbook = new ExcelJS.Workbook();

    for (const [sheetName, data] of Object.entries(sheets)) {
        if (data.length === 0) continue;

        const worksheet = workbook.addWorksheet(sheetName);
        const headers = Object.keys(data[0]);

        // Add header row
        worksheet.addRow(headers);
        worksheet.getRow(1).font = { bold: true };
        worksheet.getRow(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFD3D3D3' }
        };

        // Add data rows
        data.forEach(row => {
            const values = headers.map(header => row[header] || '');
            worksheet.addRow(values);
        });

        // Auto-fit columns
        worksheet.columns.forEach(column => {
            let maxLength = 0;
            column.eachCell({ includeEmpty: true }, cell => {
                const cellValue = cell.value ? cell.value.toString() : '';
                maxLength = Math.max(maxLength, cellValue.length);
            });
            column.width = Math.min(maxLength + 2, 50);
        });
    }

    return await workbook.xlsx.writeBuffer();
};

/**
 * Download Excel file
 * @param {ArrayBuffer} buffer - Excel file buffer
 * @param {string} filename - Filename for download
 */
export const downloadExcelFile = (buffer, filename) => {
    const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
};

export default {
    readExcelFile,
    jsonToExcelBuffer,
    createMultiSheetWorkbook,
    downloadExcelFile
};
