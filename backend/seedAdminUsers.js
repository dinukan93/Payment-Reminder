import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import Admin from './models/Admin.js';
import dotenv from 'dotenv';

dotenv.config();

const seedAdmins = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    console.log('Connected to MongoDB');

    // Clear existing admins
    await Admin.deleteMany({});
    console.log('Cleared existing admins');

    // Hash passwords
    const salt = await bcrypt.genSalt(10);
    
    const admins = [
      {
        adminId: 'ADMIN001',
        name: 'Kasun Perera',
        email: 'admin@slt.lk',
        phone: '94771234567',
        password: await bcrypt.hash('admin123', salt),
        role: 'admin',
        isVerified: true,
        isLoggedIn: false
      },
      {
        adminId: 'ADMIN002',
        name: 'Samantha Fernando',
        email: 'samantha@slt.lk',
        phone: '94772345678',
        password: await bcrypt.hash('admin123', salt),
        role: 'admin',
        isVerified: true,
        isLoggedIn: false
      }
    ];

    await Admin.insertMany(admins);
    console.log('✅ Admin users seeded successfully');
    console.log('📧 Email: admin@slt.lk | Password: admin123');
    console.log('📧 Email: samantha@slt.lk | Password: admin123');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding admins:', error);
    process.exit(1);
  }
};

seedAdmins();
