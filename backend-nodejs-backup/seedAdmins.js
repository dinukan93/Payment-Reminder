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

async function seedAdmins() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('✅ MongoDB connected successfully');

    const adminsData = [
      {
        adminId: 'ADMIN1',
        name: 'Kasun Admin',
        email: 'admin1@slt.lk',
        phone: '0771111111',
        password: await bcrypt.hash('Admin@123', 10),
        role: 'admin',
        rtom: 'Colombo',
        isVerified: true
      },
      {
        adminId: 'ADMINN2',
        name: 'Joe Admin',
        email: 'admin2@slt.lk',
        phone: '0772222222',
        password: await bcrypt.hash('Admin@123', 10),
        role: 'admin',
        rtom: 'Negombo',
        isVerified: true
      }
    ];

    console.log('\n🔄 Creating admin users...');
    
    for (const adminData of adminsData) {
      // Check if admin already exists
      const existingAdmin = await Admin.findOne({ 
        $or: [{ email: adminData.email }, { adminId: adminData.adminId }] 
      });
      
      if (existingAdmin) {
        console.log(`⚠️  Admin ${adminData.adminId} already exists, skipping...`);
        continue;
      }

      const admin = new Admin(adminData);
      await admin.save();
      console.log(`✅ Created: ${adminData.name} (${adminData.rtom})`);
    }

    console.log('\n📋 Admin Login Credentials:');
    console.log('\n1️⃣  Colombo Admin:');
    console.log('   Email: admin.colombo@slt.lk');
    console.log('   Password: Admin@123');
    console.log('   RTOM: Colombo');
    console.log('\n2️⃣  Matara Admin:');
    console.log('   Email: admin.matara@slt.lk');
    console.log('   Password: Admin@123');
    console.log('   RTOM: Matara');
    console.log('\n⚠️  IMPORTANT: Change passwords after first login!');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding admins:', error.message);
    process.exit(1);
  }
}

// Run the seed function
seedAdmins();
