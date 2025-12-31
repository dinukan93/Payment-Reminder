/**
 * Helper function to replace all XLSX usage in downloadResults
 * This file contains the updated downloadResults function using ExcelJS
 */

import { jsonToExcelBuffer } from '../utils/excelUtils';
import JSZip from 'jszip';
import { showSuccess, showError } from './Notifications';

export const downloadResults = async (results, type = 'all') => {
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
            // Download individual file type
            let buffer;
            const fileName = `POD_Report_${type}_${date}.xlsx`;

            if (type === 'vip') {
                buffer = await jsonToExcelBuffer(results.vipData, "VIP Records");
            } else if (type === 'enterprise') {
                // For enterprise, we need multiple sheets
                const ExcelJS = (await import('exceljs')).default;
                const workbook = new ExcelJS.Workbook();

                const addSheet = (data, name) => {
                    if (data.length === 0) return;
                    const worksheet = workbook.addWorksheet(name);
                    const headers = Object.keys(data[0]);
                    worksheet.addRow(headers);
                    worksheet.getRow(1).font = { bold: true };
                    data.forEach(row => {
                        const values = headers.map(header => row[header] || '');
                        worksheet.addRow(values);
                    });
                };

                addSheet(results.enterpriseGovData, "Enterprise-Gov");
                addSheet(results.enterpriseLargeData, "Enterprise-Large");
                addSheet(results.enterpriseMediumData, "Enterprise-Medium");
                addSheet(results.wholesalesData, "Wholesales");

                buffer = await workbook.xlsx.writeBuffer();
            } else if (type === 'sme') {
                buffer = await jsonToExcelBuffer(results.smeData, "SME");
            } else if (type === 'retail') {
                buffer = await jsonToExcelBuffer(results.retailMicroData, "Retail-Micro");
            } else if (type === 'excluded') {
                buffer = await jsonToExcelBuffer(results.excludedData, "Excluded (SU)");
            }

            // Download the file
            const blob = new Blob([buffer], {
                type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = fileName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(link.href);

            showSuccess(`${type.toUpperCase()} results downloaded successfully`);
        }
    } catch (error) {
        console.error('Error downloading results:', error);
        showError('Error downloading results. Please try again.');
    }
};
