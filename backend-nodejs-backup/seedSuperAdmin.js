import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import Admin from './models/Admin.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env') });

const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/payment-reminder';

async function seedSuperAdmin() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('✅ MongoDB connected successfully');

    // Check if superadmin already exists
    const existingSuperAdmin = await Admin.findOne({ role: 'superadmin' });
    
    if (existingSuperAdmin) {
      console.log('⚠️  Superadmin already exists:');
      console.log('   Admin ID:', existingSuperAdmin.adminId);
      console.log('   Email:', existingSuperAdmin.email);
      console.log('   Name:', existingSuperAdmin.name);
      console.log('\n💡 If you want to reset the password, delete this admin first and run the script again.');
      process.exit(0);
    }

    // Create superadmin
    const superadminData = {
      adminId: 'SUPERADMIN001',
      name: 'Super Administrator',
      email: 'superadmin@slt.lk',
      phone: '0771234567',
      password: await bcrypt.hash('Super@123', 10), // You can change this default password
      role: 'superadmin',
      isVerified: true
    };

    const superadmin = new Admin(superadminData);
    await superadmin.save();

    console.log('✅ Superadmin created successfully!');
    console.log('\n📋 Login Credentials:');
    console.log('   Email:', superadminData.email);
    console.log('   Password: Super@123');
    console.log('   Admin ID:', superadminData.adminId);
    console.log('\n⚠️  IMPORTANT: Change the password after first login!');
    console.log('🔐 You can now login and create other admins and uploaders.');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding superadmin:', error.message);
    process.exit(1);
  }
}

// Run the seed function
seedSuperAdmin();
