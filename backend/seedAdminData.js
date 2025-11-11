const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Caller = require('./models/Caller');
const Customer = require('./models/Customer');
const Request = require('./models/Request');
const bcrypt = require('bcryptjs');

dotenv.config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

const seedAdminData = async () => {
  try {
    await connectDB();

    console.log('Seeding admin dashboard data...');

    // Create sample callers with different statuses
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('password123', salt);

    const callers = [
      {
        callerId: '2331',
        name: 'Kumar Singh',
        email: 'kumar.singh@example.com',
        password: hashedPassword,
        status: 'AVAILABLE',
        currentLoad: 10,
        maxLoad: 20,
        taskStatus: 'ONGOING',
        customersContacted: '10/20'
      },
      {
        callerId: '2313',
        name: 'Ravi Kumar',
        email: 'ravi.kumar@example.com',
        password: hashedPassword,
        status: 'AVAILABLE',
        currentLoad: 20,
        maxLoad: 20,
        taskStatus: 'COMPLETED',
        customersContacted: '20/20'
      },
      {
        callerId: '2314',
        name: 'Ash Kumar',
        email: 'ash.kumar@example.com',
        password: hashedPassword,
        status: 'AVAILABLE',
        currentLoad: 0,
        maxLoad: 20,
        taskStatus: 'IDLE',
        customersContacted: '0/0'
      },
      {
        callerId: '2315',
        name: 'Priya Singh',
        email: 'priya.singh@example.com',
        password: hashedPassword,
        status: 'AVAILABLE',
        currentLoad: 3,
        maxLoad: 20,
        taskStatus: 'ONGOING',
        customersContacted: '3/20'
      },
      {
        callerId: '2332',
        name: 'Sita Devi',
        email: 'sita.devi@example.com',
        password: hashedPassword,
        status: 'AVAILABLE',
        currentLoad: 0,
        maxLoad: 20,
        taskStatus: 'IDLE',
        customersContacted: '0/0'
      }
    ];

    // Clear existing callers
    await Caller.deleteMany({});
    const createdCallers = await Caller.insertMany(callers);
    console.log(`✅ Created ${createdCallers.length} callers`);

    // Get some existing customers for requests
    const existingCustomers = await Customer.find().limit(10);
    
    if (existingCustomers.length > 0) {
      // Create sample requests
      const requests = [
        {
          requestId: Date.now().toString(),
          callerName: createdCallers[1].name,
          callerId: createdCallers[1].callerId,
          caller: createdCallers[1]._id,
          customers: existingCustomers.slice(0, 3).map(c => ({
            customerId: c._id,
            accountNumber: c.accountNumber,
            name: c.name,
            contactNumber: c.contactNumber,
            amountOverdue: c.amountOverdue,
            daysOverdue: c.daysOverdue
          })),
          customersSent: 3,
          sentDate: '01/11/2025',
          status: 'ACCEPTED',
          respondedDate: '01/11/2025 10:30 AM',
          respondedAt: new Date('2025-11-01T10:30:00'),
          sentBy: 'Admin'
        },
        {
          requestId: (Date.now() + 1).toString(),
          callerName: createdCallers[2].name,
          callerId: createdCallers[2].callerId,
          caller: createdCallers[2]._id,
          customers: existingCustomers.slice(3, 7).map(c => ({
            customerId: c._id,
            accountNumber: c.accountNumber,
            name: c.name,
            contactNumber: c.contactNumber,
            amountOverdue: c.amountOverdue,
            daysOverdue: c.daysOverdue
          })),
          customersSent: 4,
          sentDate: '02/11/2025',
          status: 'DECLINED',
          respondedDate: '02/11/2025 02:15 PM',
          respondedAt: new Date('2025-11-02T14:15:00'),
          declineReason: 'Too many customers assigned already',
          sentBy: 'Admin'
        },
        {
          requestId: (Date.now() + 2).toString(),
          callerName: createdCallers[3].name,
          callerId: createdCallers[3].callerId,
          caller: createdCallers[3]._id,
          customers: existingCustomers.slice(7, 10).map(c => ({
            customerId: c._id,
            accountNumber: c.accountNumber,
            name: c.name,
            contactNumber: c.contactNumber,
            amountOverdue: c.amountOverdue,
            daysOverdue: c.daysOverdue
          })),
          customersSent: 3,
          sentDate: '03/11/2025',
          status: 'PENDING',
          sentBy: 'Admin'
        }
      ];

      // Clear existing requests
      await Request.deleteMany({});
      const createdRequests = await Request.insertMany(requests);
      console.log(`✅ Created ${createdRequests.length} requests`);
    } else {
      console.log('⚠️  No existing customers found. Run seedDatabase.js first to create customers.');
    }

    console.log('✅ Admin dashboard data seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding admin data:', error);
    process.exit(1);
  }
};

seedAdminData();
