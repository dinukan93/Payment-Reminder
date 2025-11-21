import express from 'express';
import multer from 'multer';
import { uploadExcelFile, importCustomers, parseAndImport } from '../controllers/uploadController.js';
import isAuthenticated from '../middleware/isAuthenticated.js';

const router = express.Router();

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 60 * 1024 * 1024 // 60MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept Excel and CSV files
    const allowedMimes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-excel', // .xls
      'text/csv' // .csv
    ];
    
    if (allowedMimes.includes(file.mimetype) || 
        /\.(xlsx|xls|csv)$/i.test(file.originalname)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only Excel and CSV files are allowed.'));
    }
  }
});

// Upload and parse Excel file (just display data)
router.post('/parse', isAuthenticated, upload.single('file'), uploadExcelFile);

// Import customers from Excel to database
router.post('/import-customers', isAuthenticated, upload.single('file'), importCustomers);

// Parse and import Excel file to database immediately
router.post('/parse-and-import', isAuthenticated, upload.single('file'), parseAndImport);

export default router;
