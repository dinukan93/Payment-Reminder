import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

import passport from 'passport';
import connectDB from './config/db.js';
import './config/passport.js';
import './cron/autoReport.js';

import customerRoutes from './routes/customerRoutes.js';
import callerRoutes from './routes/callerRoutes.js';
import requestRoutes from './routes/requestRoutes.js';
import authRoutes from './routes/authRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import superadminRoutes from './routes/superadminRoutes.js';
import reportRoutes from './routes/reportRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';
import settingsRoutes from './routes/settingsRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env') });

// ================= GLOBAL ERROR HANDLING =================
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});

// ================= DATABASE CONNECTION =================
connectDB();

// ================= EXPRESS APP =================
const app = express();

app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(passport.initialize());
app.use(express.static(join(__dirname, '../frontend/dist')));

// ================= ROUTES =================
app.use('/api/customers', customerRoutes);
app.use('/api/callers', callerRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/superadmin', superadminRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/settings', settingsRoutes);

// ================= HEALTH CHECK =================
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Server is running' });
});

// ================= REACT SPA FALLBACK =================
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/')) return next();
  res.sendFile(join(__dirname, '../frontend/dist', 'index.html'));
});

// ================= API 404 =================
app.use('/api/*', (req, res) => {
  res.status(404).json({ message: 'API route not found' });
});

// ================= GLOBAL ERROR HANDLER =================
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

// ================= START SERVER =================
const PORT = process.env.PORT ;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ HTTP Server running on port ${PORT}`);
  console.log(`🌐 Local access via: http://localhost:${PORT}/`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log('✅ Auto-report cron jobs initialized');
});