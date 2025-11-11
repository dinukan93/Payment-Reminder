require('dotenv').config();
const mongoose = require('mongoose');
const Customer = require('./models/Customer');

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

// Sample customer data (matching frontend data)
const sampleCustomers = [
  {
    accountNumber: "1001",
    name: "Kumar Singh",
    contactNumber: "070 454 5457",
    amountOverdue: "Rs.2000",
    daysOverdue: "16",
    status: "PENDING",
    response: "Will Be Paid Next Week",
    previousResponse: "Said would pay last Friday",
    contactHistory: [
      {
        date: getFormattedDate(0), // Today
        outcome: "Spoke to Customer",
        response: "Said would pay last Friday",
        promisedDate: getFormattedDate(0),
        paymentMade: false
      }
    ],
    assignedTo: null,
    assignedDate: getFormattedDate(0)
  },
  {
    accountNumber: "1002",
    name: "Ravi Kumar",
    contactNumber: "070 123 4567",
    amountOverdue: "Rs.1500",
    daysOverdue: "8",
    status: "COMPLETED",
    response: "Payment Will Be Done After The Call",
    previousResponse: "Will pay after receiving salary",
    contactHistory: [
      {
        date: getFormattedDate(-1), // Yesterday
        outcome: "Spoke to Customer",
        response: "Will pay after receiving salary",
        promisedDate: getFormattedDate(1), // Tomorrow
        paymentMade: true
      }
    ],
    assignedTo: null,
    assignedDate: getFormattedDate(0)
  },
  {
    accountNumber: "1003",
    name: "Kumar Singh",
    contactNumber: "070 454 5457",
    amountOverdue: "Rs.2000",
    daysOverdue: "16",
    status: "OVERDUE",
    response: "Not Contacted Yet",
    previousResponse: "No previous contact",
    contactHistory: [],
    assignedTo: null,
    assignedDate: getFormattedDate(0)
  },
  {
    accountNumber: "1004",
    name: "Ash Kumar",
    contactNumber: "070 789 4561",
    amountOverdue: "Rs.3500",
    daysOverdue: "22",
    status: "OVERDUE",
    response: "Not Contacted Yet",
    previousResponse: "No previous contact",
    contactHistory: [],
    assignedTo: null,
    assignedDate: getFormattedDate(0)
  },
  {
    accountNumber: "1005",
    name: "Priya Singh",
    contactNumber: "070 456 7890",
    amountOverdue: "Rs.1800",
    daysOverdue: "12",
    status: "OVERDUE",
    response: "Not Contacted Yet",
    previousResponse: "No previous contact",
    contactHistory: [],
    assignedTo: null,
    assignedDate: getFormattedDate(0)
  }
];

// Seed function
const seedDatabase = async () => {
  try {
    await connectDB();

    // Clear existing customers
    console.log('Clearing existing customers...');
    await Customer.deleteMany({});
    console.log('Existing customers cleared.');

    // Insert sample customers
    console.log('Inserting sample customers...');
    const customers = await Customer.insertMany(sampleCustomers);
    console.log(`${customers.length} customers inserted successfully!`);

    // Display inserted customers
    console.log('\nInserted Customers:');
    customers.forEach(customer => {
      console.log(`- ${customer.name} (${customer.accountNumber}) - Status: ${customer.status}`);
    });

    console.log('\n✅ Database seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
};

// Run the seed function
seedDatabase();
