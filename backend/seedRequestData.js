require('dotenv').config();
const mongoose = require('mongoose');
const Caller = require('./models/Caller');
const Customer = require('./models/Customer');
const Request = require('./models/Request');

// MongoDB connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB Connected...');
  } catch (err) {
    console.error('Error connecting to MongoDB:', err.message);
    process.exit(1);
  }
};

// Get current date in DD/MM/YYYY format
const getFormattedDate = (daysOffset = 0) => {
  const date = new Date();
  date.setDate(date.getDate() + daysOffset);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

// Seed function
const seedRequestData = async () => {
  try {
    await connectDB();

    // Step 1: Create a sample caller if doesn't exist
    console.log('Creating sample caller...');
    let caller = await Caller.findOne({ callerId: 'CALLER001' });
    
    if (!caller) {
      caller = await Caller.create({
        callerId: 'CALLER001',
        name: 'John Doe',
        email: 'john.doe@example.com',
        password: 'password123', // In production, this should be hashed
        status: 'AVAILABLE',
        currentLoad: 0,
        maxLoad: 20,
        assignedCustomers: [],
        taskStatus: 'IDLE'
      });
      console.log(' Sample caller created:', caller.name);
    } else {
      console.log(' Caller already exists:', caller.name);
    }

    // Step 2: Create new customers for the request
    console.log('\nCreating new customers for admin request...');
    const newCustomers = [
      {
        accountNumber: "2001",
        name: "Kamal Perera",
        contactNumber: "077-1234567",
        amountOverdue: "Rs.3500",
        daysOverdue: "25",
        status: 'UNASSIGNED', // Not yet assigned to caller
        response: "Not Contacted Yet",
        previousResponse: "No previous contact",
        contactHistory: [],
        assignedTo: null,
        assignedDate: null
      },
      {
        accountNumber: "2002",
        name: "Nimal Silva",
        contactNumber: "071-9876543",
        amountOverdue: "Rs.4200",
        daysOverdue: "18",
        status: 'UNASSIGNED',
        response: "Not Contacted Yet",
        previousResponse: "No previous contact",
        contactHistory: [],
        assignedTo: null,
        assignedDate: null
      },
      {
        accountNumber: "2003",
        name: "Saman Fernando",
        contactNumber: "076-5555444",
        amountOverdue: "Rs.2800",
        daysOverdue: "30",
        status: 'UNASSIGNED',
        response: "Not Contacted Yet",
        previousResponse: "No previous contact",
        contactHistory: [],
        assignedTo: null,
        assignedDate: null
      }
    ];

    // Remove existing customers with these account numbers
    await Customer.deleteMany({ 
      accountNumber: { $in: newCustomers.map(c => c.accountNumber) }
    });

    const createdCustomers = await Customer.insertMany(newCustomers);
    console.log(` ${createdCustomers.length} new customers created`);

    // Step 3: Create a pending request from Admin
    console.log('\nCreating admin request...');
    
    // Remove any existing pending requests for this caller
    await Request.deleteMany({ 
      callerId: caller.callerId,
      status: 'PENDING'
    });

    const request = await Request.create({
      taskId: `REQ${Date.now()}`,
      callerName: caller.name,
      callerId: caller.callerId,
      caller: caller._id,
      customers: createdCustomers.map(customer => ({
        customerId: customer._id,
        accountNumber: customer.accountNumber,
        name: customer.name,
        contactNumber: customer.contactNumber,
        amountOverdue: customer.amountOverdue,
        daysOverdue: customer.daysOverdue
      })),
      customersSent: createdCustomers.length,
      sentDate: getFormattedDate(0),
      status: 'PENDING',
      sentBy: 'Admin'
    });

    console.log(' Admin request created successfully!');
    console.log('\nRequest Details:');
    console.log(`- Task ID: ${request.taskId}`);
    console.log(`- Caller: ${request.callerName}`);
    console.log(`- Customers: ${request.customersSent}`);
    console.log(`- Status: ${request.status}`);
    console.log(`- Sent Date: ${request.sentDate}`);

    console.log('\n Summary:');
    console.log('1. Sample caller created/found');
    console.log('2. New customers created for assignment');
    console.log('3. Admin request created and waiting for caller to accept');
    console.log('\n Test data seeding completed successfully!');
    console.log('\nNext steps:');
    console.log('1. Open the CallerDashboard in frontend');
    console.log('2. Click on the envelope icon to view pending requests');
    console.log('3. Accept the request to add customers to the database');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding request data:', error);
    process.exit(1);
  }
};

// Run the seed function
seedRequestData();
