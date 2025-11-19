import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Customer from './models/Customer.js';

dotenv.config();

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

// Sample customer data with all new fields
const sampleCustomers = [
  {
    // Basic Identity
    accountNumber: "1001234567",
    name: "Kumar Singh",
    region: "Western",
    rtom: "Colombo",
    
    // Product & Service
    productLabel: "Fiber Broadband 100Mbps",
    medium: "FIBER",
    
    // Billing
    latestBillAmount: 2500,
    newArrears: 2000,
    amountOverdue: "Rs.2000",
    daysOverdue: "16",
    nextBillDate: new Date('2025-12-01'),
    ageMonths: 24,
    
    // Contact Info
    mobileContactTel: "0704545457",
    contactNumber: "070 454 5457",
    emailAddress: "kumar.singh@email.com",
    mobileNoConfirmation: true,
    
    // Credit Info
    creditScore: 650,
    creditClassName: "Medium Risk",
    billHandlingCodeName: "Standard",
    
    // Management
    accountManager: "Saman Perera",
    salesPerson: "Nimal Fernando",
    
    // Status
    status: "PENDING",
    response: "Will Be Paid Next Week",
    previousResponse: "Said would pay last Friday",
    contactHistory: [
      {
        contactDate: getFormattedDate(0),
        outcome: "Spoke to Customer",
        remark: "Said would pay last Friday",
        crmAction: "Follow-up scheduled",
        customerFeedback: "Promised to pay",
        creditAction: "Monitor",
        retriedCount: 0,
        promisedDate: getFormattedDate(7),
        paymentMade: false,
        contactedBy: null
      }
    ],
    assignedTo: null,
    assignedDate: getFormattedDate(0)
  },
  {
    // Basic Identity
    accountNumber: "1001234568",
    name: "Ravi Kumar",
    region: "Central",
    rtom: "Kandy",
    
    // Product & Service
    productLabel: "ADSL 8Mbps",
    medium: "ADSL",
    
    // Billing
    latestBillAmount: 1800,
    newArrears: 1500,
    amountOverdue: "Rs.1500",
    daysOverdue: "8",
    nextBillDate: new Date('2025-11-25'),
    ageMonths: 18,
    
    // Contact Info
    mobileContactTel: "0701234567",
    contactNumber: "070 123 4567",
    emailAddress: "ravi.kumar@email.com",
    mobileNoConfirmation: true,
    
    // Credit Info
    creditScore: 720,
    creditClassName: "Low Risk",
    billHandlingCodeName: "Standard",
    
    // Management
    accountManager: "Kamal Silva",
    salesPerson: "Sunil Dias",
    
    // Status
    status: "COMPLETED",
    response: "Payment Will Be Done After The Call",
    previousResponse: "Will pay after receiving salary",
    contactHistory: [
      {
        contactDate: getFormattedDate(-1),
        outcome: "Spoke to Customer",
        remark: "Will pay after receiving salary",
        crmAction: "Payment received",
        customerFeedback: "Satisfied",
        creditAction: "Cleared",
        retriedCount: 0,
        promisedDate: getFormattedDate(1),
        paymentMade: true,
        contactedBy: null
      }
    ],
    assignedTo: null,
    assignedDate: getFormattedDate(0)
  },
  {
    // Basic Identity
    accountNumber: "1001234569",
    name: "Ash Kumar",
    region: "Southern",
    rtom: "Galle",
    
    // Product & Service
    productLabel: "Fiber Broadband 50Mbps",
    medium: "FIBER",
    
    // Billing
    latestBillAmount: 4200,
    newArrears: 3500,
    amountOverdue: "Rs.3500",
    daysOverdue: "22",
    nextBillDate: new Date('2025-12-10'),
    ageMonths: 36,
    
    // Contact Info
    mobileContactTel: "0707894561",
    contactNumber: "070 789 4561",
    emailAddress: "ash.kumar@email.com",
    mobileNoConfirmation: false,
    
    // Credit Info
    creditScore: 580,
    creditClassName: "High Risk",
    billHandlingCodeName: "Special Attention",
    
    // Management
    accountManager: "Dinesh Mendis",
    salesPerson: "Chaminda Ranasinghe",
    
    // Status
    status: "OVERDUE",
    response: "Not Contacted Yet",
    previousResponse: "No previous contact",
    contactHistory: [],
    assignedTo: null,
    assignedDate: getFormattedDate(0)
  },
  {
    // Basic Identity
    accountNumber: "1001234570",
    name: "Priya Singh",
    region: "Western",
    rtom: "Negombo",
    
    // Product & Service
    productLabel: "Fiber Broadband 200Mbps",
    medium: "FIBER",
    
    // Billing
    latestBillAmount: 2100,
    newArrears: 1800,
    amountOverdue: "Rs.1800",
    daysOverdue: "12",
    nextBillDate: new Date('2025-11-28'),
    ageMonths: 12,
    
    // Contact Info
    mobileContactTel: "0704567890",
    contactNumber: "070 456 7890",
    emailAddress: "priya.singh@email.com",
    mobileNoConfirmation: true,
    
    // Credit Info
    creditScore: 700,
    creditClassName: "Medium Risk",
    billHandlingCodeName: "Standard",
    
    // Management
    accountManager: "Ruwan Fernando",
    salesPerson: "Ajith Perera",
    
    // Status
    status: "OVERDUE",
    response: "Not Contacted Yet",
    previousResponse: "No previous contact",
    contactHistory: [],
    assignedTo: null,
    assignedDate: getFormattedDate(0)
  },
  {
    // Basic Identity
    accountNumber: "1001234571",
    name: "Sunita Wickramasinghe",
    region: "Northern",
    rtom: "Jaffna",
    
    // Product & Service
    productLabel: "ADSL 4Mbps",
    medium: "ADSL",
    
    // Billing
    latestBillAmount: 3200,
    newArrears: 2500,
    amountOverdue: "Rs.2500",
    daysOverdue: "18",
    nextBillDate: new Date('2025-12-05'),
    ageMonths: 30,
    
    // Contact Info
    mobileContactTel: "0775551234",
    contactNumber: "077 555 1234",
    emailAddress: "sunita.w@email.com",
    mobileNoConfirmation: true,
    
    // Credit Info
    creditScore: 620,
    creditClassName: "Medium Risk",
    billHandlingCodeName: "Standard",
    
    // Management
    accountManager: "Lakshman Silva",
    salesPerson: "Prasad Kumar",
    
    // Status
    status: "PENDING",
    response: "Customer requested extension",
    previousResponse: "No previous contact",
    contactHistory: [
      {
        contactDate: getFormattedDate(-2),
        outcome: "Spoke to Customer",
        remark: "Customer requested extension",
        crmAction: "Extension granted for 5 days",
        customerFeedback: "Will pay within 5 days",
        creditAction: "Monitor closely",
        retriedCount: 0,
        promisedDate: getFormattedDate(5),
        paymentMade: false,
        contactedBy: null
      }
    ],
    assignedTo: null,
    assignedDate: getFormattedDate(0)
  },
  {
    accountNumber: "1001234572",
    name: "Mahesh Jayawardena",
    region: "Western",
    rtom: "Gampaha",
    productLabel: "Fiber Broadband 100Mbps",
    medium: "FIBER",
    latestBillAmount: 2800,
    newArrears: 2300,
    amountOverdue: "Rs.2300",
    daysOverdue: "25",
    nextBillDate: new Date('2025-12-08'),
    ageMonths: 20,
    mobileContactTel: "0712345678",
    contactNumber: "071 234 5678",
    emailAddress: "mahesh.j@email.com",
    mobileNoConfirmation: true,
    creditScore: 640,
    creditClassName: "Medium Risk",
    billHandlingCodeName: "Standard",
    accountManager: "Anura Perera",
    salesPerson: "Tharindu Silva",
    status: "OVERDUE",
    response: "Not Contacted Yet",
    previousResponse: "No previous contact",
    contactHistory: [],
    assignedTo: null,
    assignedDate: getFormattedDate(0)
  },
  {
    accountNumber: "1001234573",
    name: "Nishantha Fernando",
    region: "Central",
    rtom: "Matale",
    productLabel: "ADSL 16Mbps",
    medium: "ADSL",
    latestBillAmount: 2200,
    newArrears: 1900,
    amountOverdue: "Rs.1900",
    daysOverdue: "14",
    nextBillDate: new Date('2025-11-30'),
    ageMonths: 28,
    mobileContactTel: "0723456789",
    contactNumber: "072 345 6789",
    emailAddress: "nishantha.f@email.com",
    mobileNoConfirmation: true,
    creditScore: 680,
    creditClassName: "Low Risk",
    billHandlingCodeName: "Standard",
    accountManager: "Sampath Rajapakse",
    salesPerson: "Upul Bandara",
    status: "PENDING",
    response: "Will pay by end of month",
    previousResponse: "No previous contact",
    contactHistory: [
      {
        contactDate: getFormattedDate(-1),
        outcome: "Spoke to Customer",
        remark: "Will pay by end of month",
        crmAction: "Follow-up scheduled",
        customerFeedback: "Cooperative",
        creditAction: "Monitor",
        retriedCount: 0,
        promisedDate: getFormattedDate(3),
        paymentMade: false,
        contactedBy: null
      }
    ],
    assignedTo: null,
    assignedDate: getFormattedDate(0)
  },
  {
    accountNumber: "1001234574",
    name: "Dilini Rathnayake",
    region: "Southern",
    rtom: "Matara",
    productLabel: "Fiber Broadband 50Mbps",
    medium: "FIBER",
    latestBillAmount: 1950,
    newArrears: 1600,
    amountOverdue: "Rs.1600",
    daysOverdue: "9",
    nextBillDate: new Date('2025-11-27'),
    ageMonths: 15,
    mobileContactTel: "0734567890",
    contactNumber: "073 456 7890",
    emailAddress: "dilini.r@email.com",
    mobileNoConfirmation: true,
    creditScore: 710,
    creditClassName: "Low Risk",
    billHandlingCodeName: "Standard",
    accountManager: "Chamara Dias",
    salesPerson: "Nirmal Wickrama",
    status: "COMPLETED",
    response: "Payment received",
    previousResponse: "Will pay today",
    contactHistory: [
      {
        contactDate: getFormattedDate(0),
        outcome: "Spoke to Customer",
        remark: "Will pay today",
        crmAction: "Payment received",
        customerFeedback: "Thank you for reminder",
        creditAction: "Cleared",
        retriedCount: 0,
        promisedDate: getFormattedDate(0),
        paymentMade: true,
        contactedBy: null
      }
    ],
    assignedTo: null,
    assignedDate: getFormattedDate(0)
  },
  {
    accountNumber: "1001234575",
    name: "Anil Gunasekara",
    region: "Eastern",
    rtom: "Batticaloa",
    productLabel: "ADSL 8Mbps",
    medium: "ADSL",
    latestBillAmount: 3100,
    newArrears: 2700,
    amountOverdue: "Rs.2700",
    daysOverdue: "32",
    nextBillDate: new Date('2025-12-15'),
    ageMonths: 42,
    mobileContactTel: "0745678901",
    contactNumber: "074 567 8901",
    emailAddress: "anil.g@email.com",
    mobileNoConfirmation: false,
    creditScore: 560,
    creditClassName: "High Risk",
    billHandlingCodeName: "Special Attention",
    accountManager: "Roshan Silva",
    salesPerson: "Buddhika Perera",
    status: "OVERDUE",
    response: "Not Contacted Yet",
    previousResponse: "No previous contact",
    contactHistory: [],
    assignedTo: null,
    assignedDate: getFormattedDate(0)
  },
  {
    accountNumber: "1001234576",
    name: "Savithri Mendis",
    region: "Western",
    rtom: "Colombo",
    productLabel: "Fiber Broadband 300Mbps",
    medium: "FIBER",
    latestBillAmount: 3800,
    newArrears: 3200,
    amountOverdue: "Rs.3200",
    daysOverdue: "19",
    nextBillDate: new Date('2025-12-03'),
    ageMonths: 24,
    mobileContactTel: "0756789012",
    contactNumber: "075 678 9012",
    emailAddress: "savithri.m@email.com",
    mobileNoConfirmation: true,
    creditScore: 630,
    creditClassName: "Medium Risk",
    billHandlingCodeName: "Standard",
    accountManager: "Kumara Silva",
    salesPerson: "Wasantha Fernando",
    status: "PENDING",
    response: "Payment delayed due to travel",
    previousResponse: "No previous contact",
    contactHistory: [
      {
        contactDate: getFormattedDate(-3),
        outcome: "Spoke to Customer",
        remark: "Payment delayed due to travel",
        crmAction: "Follow-up in 5 days",
        customerFeedback: "Will pay upon return",
        creditAction: "Monitor",
        retriedCount: 0,
        promisedDate: getFormattedDate(5),
        paymentMade: false,
        contactedBy: null
      }
    ],
    assignedTo: null,
    assignedDate: getFormattedDate(0)
  },
  {
    accountNumber: "1001234577",
    name: "Tharaka Wijesinghe",
    region: "Central",
    rtom: "Nuwara Eliya",
    productLabel: "Fiber Broadband 100Mbps",
    medium: "FIBER",
    latestBillAmount: 2600,
    newArrears: 2100,
    amountOverdue: "Rs.2100",
    daysOverdue: "27",
    nextBillDate: new Date('2025-12-12'),
    ageMonths: 33,
    mobileContactTel: "0767890123",
    contactNumber: "076 789 0123",
    emailAddress: "tharaka.w@email.com",
    mobileNoConfirmation: true,
    creditScore: 600,
    creditClassName: "Medium Risk",
    billHandlingCodeName: "Standard",
    accountManager: "Gayan Dissanayake",
    salesPerson: "Janaka Rathnayake",
    status: "OVERDUE",
    response: "Not Contacted Yet",
    previousResponse: "No previous contact",
    contactHistory: [],
    assignedTo: null,
    assignedDate: getFormattedDate(0)
  },
  {
    accountNumber: "1001234578",
    name: "Indika Senanayake",
    region: "Northern",
    rtom: "Vavuniya",
    productLabel: "ADSL 4Mbps",
    medium: "ADSL",
    latestBillAmount: 1700,
    newArrears: 1400,
    amountOverdue: "Rs.1400",
    daysOverdue: "11",
    nextBillDate: new Date('2025-11-29'),
    ageMonths: 22,
    mobileContactTel: "0778901234",
    contactNumber: "077 890 1234",
    emailAddress: "indika.s@email.com",
    mobileNoConfirmation: true,
    creditScore: 690,
    creditClassName: "Low Risk",
    billHandlingCodeName: "Standard",
    accountManager: "Pubudu Silva",
    salesPerson: "Sanjaya Perera",
    status: "COMPLETED",
    response: "Payment made online",
    previousResponse: "Will pay tomorrow",
    contactHistory: [
      {
        contactDate: getFormattedDate(-1),
        outcome: "Spoke to Customer",
        remark: "Will pay tomorrow",
        crmAction: "Payment received",
        customerFeedback: "Done online payment",
        creditAction: "Cleared",
        retriedCount: 0,
        promisedDate: getFormattedDate(1),
        paymentMade: true,
        contactedBy: null
      }
    ],
    assignedTo: null,
    assignedDate: getFormattedDate(0)
  },
  {
    accountNumber: "1001234579",
    name: "Chathuri Karunaratne",
    region: "Southern",
    rtom: "Hambantota",
    productLabel: "Fiber Broadband 50Mbps",
    medium: "FIBER",
    latestBillAmount: 2400,
    newArrears: 2000,
    amountOverdue: "Rs.2000",
    daysOverdue: "21",
    nextBillDate: new Date('2025-12-07'),
    ageMonths: 18,
    mobileContactTel: "0709012345",
    contactNumber: "070 901 2345",
    emailAddress: "chathuri.k@email.com",
    mobileNoConfirmation: false,
    creditScore: 610,
    creditClassName: "Medium Risk",
    billHandlingCodeName: "Standard",
    accountManager: "Nuwan Fernando",
    salesPerson: "Thilina Perera",
    status: "PENDING",
    response: "Awaiting salary payment",
    previousResponse: "No previous contact",
    contactHistory: [
      {
        contactDate: getFormattedDate(-2),
        outcome: "Spoke to Customer",
        remark: "Awaiting salary payment",
        crmAction: "Follow-up next week",
        customerFeedback: "Will pay after salary",
        creditAction: "Monitor",
        retriedCount: 0,
        promisedDate: getFormattedDate(6),
        paymentMade: false,
        contactedBy: null
      }
    ],
    assignedTo: null,
    assignedDate: getFormattedDate(0)
  },
  {
    accountNumber: "1001234580",
    name: "Ruwan Jayasuriya",
    region: "Western",
    rtom: "Kalutara",
    productLabel: "Fiber Broadband 200Mbps",
    medium: "FIBER",
    latestBillAmount: 3300,
    newArrears: 2800,
    amountOverdue: "Rs.2800",
    daysOverdue: "15",
    nextBillDate: new Date('2025-12-01'),
    ageMonths: 27,
    mobileContactTel: "0711234567",
    contactNumber: "071 123 4567",
    emailAddress: "ruwan.j@email.com",
    mobileNoConfirmation: true,
    creditScore: 670,
    creditClassName: "Medium Risk",
    billHandlingCodeName: "Standard",
    accountManager: "Sanjeewa Dias",
    salesPerson: "Dilan Silva",
    status: "OVERDUE",
    response: "Not Contacted Yet",
    previousResponse: "No previous contact",
    contactHistory: [],
    assignedTo: null,
    assignedDate: getFormattedDate(0)
  },
  {
    accountNumber: "1001234581",
    name: "Nimali Wijesekara",
    region: "Central",
    rtom: "Kandy",
    productLabel: "ADSL 16Mbps",
    medium: "ADSL",
    latestBillAmount: 2000,
    newArrears: 1700,
    amountOverdue: "Rs.1700",
    daysOverdue: "13",
    nextBillDate: new Date('2025-11-28'),
    ageMonths: 31,
    mobileContactTel: "0722345678",
    contactNumber: "072 234 5678",
    emailAddress: "nimali.w@email.com",
    mobileNoConfirmation: true,
    creditScore: 700,
    creditClassName: "Low Risk",
    billHandlingCodeName: "Standard",
    accountManager: "Asanka Fernando",
    salesPerson: "Pradeep Kumar",
    status: "PENDING",
    response: "Payment promised by Friday",
    previousResponse: "No previous contact",
    contactHistory: [
      {
        contactDate: getFormattedDate(0),
        outcome: "Spoke to Customer",
        remark: "Payment promised by Friday",
        crmAction: "Follow-up Friday",
        customerFeedback: "Will definitely pay",
        creditAction: "Monitor",
        retriedCount: 0,
        promisedDate: getFormattedDate(2),
        paymentMade: false,
        contactedBy: null
      }
    ],
    assignedTo: null,
    assignedDate: getFormattedDate(0)
  },
  {
    accountNumber: "1001234582",
    name: "Kasun Gamage",
    region: "Eastern",
    rtom: "Trincomalee",
    productLabel: "Fiber Broadband 100Mbps",
    medium: "FIBER",
    latestBillAmount: 2900,
    newArrears: 2400,
    amountOverdue: "Rs.2400",
    daysOverdue: "29",
    nextBillDate: new Date('2025-12-14'),
    ageMonths: 36,
    mobileContactTel: "0733456789",
    contactNumber: "073 345 6789",
    emailAddress: "kasun.g@email.com",
    mobileNoConfirmation: false,
    creditScore: 590,
    creditClassName: "High Risk",
    billHandlingCodeName: "Special Attention",
    accountManager: "Duminda Silva",
    salesPerson: "Roshan Perera",
    status: "OVERDUE",
    response: "Not Contacted Yet",
    previousResponse: "No previous contact",
    contactHistory: [],
    assignedTo: null,
    assignedDate: getFormattedDate(0)
  },
  {
    accountNumber: "1001234583",
    name: "Sanduni Amarasinghe",
    region: "Western",
    rtom: "Colombo",
    productLabel: "Fiber Broadband 50Mbps",
    medium: "FIBER",
    latestBillAmount: 2100,
    newArrears: 1800,
    amountOverdue: "Rs.1800",
    daysOverdue: "17",
    nextBillDate: new Date('2025-12-02'),
    ageMonths: 21,
    mobileContactTel: "0744567890",
    contactNumber: "074 456 7890",
    emailAddress: "sanduni.a@email.com",
    mobileNoConfirmation: true,
    creditScore: 660,
    creditClassName: "Medium Risk",
    billHandlingCodeName: "Standard",
    accountManager: "Lahiru Fernando",
    salesPerson: "Charith Silva",
    status: "COMPLETED",
    response: "Payment done via bank",
    previousResponse: "Processing payment",
    contactHistory: [
      {
        contactDate: getFormattedDate(-2),
        outcome: "Spoke to Customer",
        remark: "Processing payment",
        crmAction: "Payment received",
        customerFeedback: "Payment completed",
        creditAction: "Cleared",
        retriedCount: 0,
        promisedDate: getFormattedDate(0),
        paymentMade: true,
        contactedBy: null
      }
    ],
    assignedTo: null,
    assignedDate: getFormattedDate(0)
  },
  {
    accountNumber: "1001234584",
    name: "Pradeep Rajapakse",
    region: "Southern",
    rtom: "Galle",
    productLabel: "ADSL 8Mbps",
    medium: "ADSL",
    latestBillAmount: 1850,
    newArrears: 1550,
    amountOverdue: "Rs.1550",
    daysOverdue: "10",
    nextBillDate: new Date('2025-11-26'),
    ageMonths: 25,
    mobileContactTel: "0755678901",
    contactNumber: "075 567 8901",
    emailAddress: "pradeep.r@email.com",
    mobileNoConfirmation: true,
    creditScore: 720,
    creditClassName: "Low Risk",
    billHandlingCodeName: "Standard",
    accountManager: "Tharindu Dias",
    salesPerson: "Sudath Fernando",
    status: "PENDING",
    response: "Will pay this weekend",
    previousResponse: "No previous contact",
    contactHistory: [
      {
        contactDate: getFormattedDate(-1),
        outcome: "Spoke to Customer",
        remark: "Will pay this weekend",
        crmAction: "Follow-up Monday",
        customerFeedback: "Cooperative",
        creditAction: "Monitor",
        retriedCount: 0,
        promisedDate: getFormattedDate(3),
        paymentMade: false,
        contactedBy: null
      }
    ],
    assignedTo: null,
    assignedDate: getFormattedDate(0)
  },
  {
    accountNumber: "1001234585",
    name: "Gayan Wickramasinghe",
    region: "Northern",
    rtom: "Jaffna",
    productLabel: "Fiber Broadband 100Mbps",
    medium: "FIBER",
    latestBillAmount: 2700,
    newArrears: 2200,
    amountOverdue: "Rs.2200",
    daysOverdue: "23",
    nextBillDate: new Date('2025-12-09'),
    ageMonths: 29,
    mobileContactTel: "0766789012",
    contactNumber: "076 678 9012",
    emailAddress: "gayan.w@email.com",
    mobileNoConfirmation: true,
    creditScore: 640,
    creditClassName: "Medium Risk",
    billHandlingCodeName: "Standard",
    accountManager: "Ranjith Silva",
    salesPerson: "Sampath Perera",
    status: "OVERDUE",
    response: "Not Contacted Yet",
    previousResponse: "No previous contact",
    contactHistory: [],
    assignedTo: null,
    assignedDate: getFormattedDate(0)
  },
  {
    accountNumber: "1001234586",
    name: "Chandrika Samaraweera",
    region: "Central",
    rtom: "Matale",
    productLabel: "ADSL 4Mbps",
    medium: "ADSL",
    latestBillAmount: 1600,
    newArrears: 1300,
    amountOverdue: "Rs.1300",
    daysOverdue: "7",
    nextBillDate: new Date('2025-11-24'),
    ageMonths: 16,
    mobileContactTel: "0777890123",
    contactNumber: "077 789 0123",
    emailAddress: "chandrika.s@email.com",
    mobileNoConfirmation: true,
    creditScore: 730,
    creditClassName: "Low Risk",
    billHandlingCodeName: "Standard",
    accountManager: "Malith Fernando",
    salesPerson: "Ashan Silva",
    status: "COMPLETED",
    response: "Payment received today",
    previousResponse: "Will pay immediately",
    contactHistory: [
      {
        contactDate: getFormattedDate(0),
        outcome: "Spoke to Customer",
        remark: "Will pay immediately",
        crmAction: "Payment received",
        customerFeedback: "Thanks for call",
        creditAction: "Cleared",
        retriedCount: 0,
        promisedDate: getFormattedDate(0),
        paymentMade: true,
        contactedBy: null
      }
    ],
    assignedTo: null,
    assignedDate: getFormattedDate(0)
  },
  {
    accountNumber: "1001234587",
    name: "Buddhika Jayawardena",
    region: "Western",
    rtom: "Negombo",
    productLabel: "Fiber Broadband 300Mbps",
    medium: "FIBER",
    latestBillAmount: 4100,
    newArrears: 3600,
    amountOverdue: "Rs.3600",
    daysOverdue: "34",
    nextBillDate: new Date('2025-12-18'),
    ageMonths: 40,
    mobileContactTel: "0708901234",
    contactNumber: "070 890 1234",
    emailAddress: "buddhika.j@email.com",
    mobileNoConfirmation: false,
    creditScore: 570,
    creditClassName: "High Risk",
    billHandlingCodeName: "Special Attention",
    accountManager: "Isuru Silva",
    salesPerson: "Kasun Fernando",
    status: "OVERDUE",
    response: "Not Contacted Yet",
    previousResponse: "No previous contact",
    contactHistory: [],
    assignedTo: null,
    assignedDate: getFormattedDate(0)
  },
  {
    accountNumber: "1001234588",
    name: "Anushka De Silva",
    region: "Eastern",
    rtom: "Ampara",
    productLabel: "Fiber Broadband 50Mbps",
    medium: "FIBER",
    latestBillAmount: 2300,
    newArrears: 1950,
    amountOverdue: "Rs.1950",
    daysOverdue: "20",
    nextBillDate: new Date('2025-12-06'),
    ageMonths: 23,
    mobileContactTel: "0719012345",
    contactNumber: "071 901 2345",
    emailAddress: "anushka.d@email.com",
    mobileNoConfirmation: true,
    creditScore: 650,
    creditClassName: "Medium Risk",
    billHandlingCodeName: "Standard",
    accountManager: "Chathura Perera",
    salesPerson: "Dinesh Silva",
    status: "PENDING",
    response: "Payment in process",
    previousResponse: "No previous contact",
    contactHistory: [
      {
        contactDate: getFormattedDate(-3),
        outcome: "Spoke to Customer",
        remark: "Payment in process",
        crmAction: "Follow-up in 3 days",
        customerFeedback: "Bank transfer initiated",
        creditAction: "Monitor",
        retriedCount: 0,
        promisedDate: getFormattedDate(3),
        paymentMade: false,
        contactedBy: null
      }
    ],
    assignedTo: null,
    assignedDate: getFormattedDate(0)
  },
  {
    accountNumber: "1001234589",
    name: "Harini Rathnayake",
    region: "Southern",
    rtom: "Matara",
    productLabel: "ADSL 16Mbps",
    medium: "ADSL",
    latestBillAmount: 2050,
    newArrears: 1750,
    amountOverdue: "Rs.1750",
    daysOverdue: "12",
    nextBillDate: new Date('2025-11-30'),
    ageMonths: 19,
    mobileContactTel: "0720123456",
    contactNumber: "072 012 3456",
    emailAddress: "harini.r@email.com",
    mobileNoConfirmation: true,
    creditScore: 680,
    creditClassName: "Low Risk",
    billHandlingCodeName: "Standard",
    accountManager: "Nalin Fernando",
    salesPerson: "Viraj Silva",
    status: "OVERDUE",
    response: "Not Contacted Yet",
    previousResponse: "No previous contact",
    contactHistory: [],
    assignedTo: null,
    assignedDate: getFormattedDate(0)
  },
  {
    accountNumber: "1001234590",
    name: "Thushara Perera",
    region: "Western",
    rtom: "Gampaha",
    productLabel: "Fiber Broadband 100Mbps",
    medium: "FIBER",
    latestBillAmount: 2650,
    newArrears: 2200,
    amountOverdue: "Rs.2200",
    daysOverdue: "26",
    nextBillDate: new Date('2025-12-11'),
    ageMonths: 32,
    mobileContactTel: "0731234567",
    contactNumber: "073 123 4567",
    emailAddress: "thushara.p@email.com",
    mobileNoConfirmation: true,
    creditScore: 620,
    creditClassName: "Medium Risk",
    billHandlingCodeName: "Standard",
    accountManager: "Sachith Silva",
    salesPerson: "Madushanka Perera",
    status: "PENDING",
    response: "Partial payment made",
    previousResponse: "No previous contact",
    contactHistory: [
      {
        contactDate: getFormattedDate(-1),
        outcome: "Spoke to Customer",
        remark: "Partial payment made",
        crmAction: "Follow-up for balance",
        customerFeedback: "Will pay balance soon",
        creditAction: "Monitor",
        retriedCount: 0,
        promisedDate: getFormattedDate(5),
        paymentMade: false,
        contactedBy: null
      }
    ],
    assignedTo: null,
    assignedDate: getFormattedDate(0)
  },
  {
    accountNumber: "1001234591",
    name: "Ashani Gunawardena",
    region: "Northern",
    rtom: "Vavuniya",
    productLabel: "ADSL 8Mbps",
    medium: "ADSL",
    latestBillAmount: 1900,
    newArrears: 1600,
    amountOverdue: "Rs.1600",
    daysOverdue: "14",
    nextBillDate: new Date('2025-12-01'),
    ageMonths: 26,
    mobileContactTel: "0742345678",
    contactNumber: "074 234 5678",
    emailAddress: "ashani.g@email.com",
    mobileNoConfirmation: true,
    creditScore: 690,
    creditClassName: "Low Risk",
    billHandlingCodeName: "Standard",
    accountManager: "Hasitha Fernando",
    salesPerson: "Ravindra Silva",
    status: "COMPLETED",
    response: "Payment completed online",
    previousResponse: "Will pay via online banking",
    contactHistory: [
      {
        contactDate: getFormattedDate(-1),
        outcome: "Spoke to Customer",
        remark: "Will pay via online banking",
        crmAction: "Payment received",
        customerFeedback: "Payment successful",
        creditAction: "Cleared",
        retriedCount: 0,
        promisedDate: getFormattedDate(1),
        paymentMade: true,
        contactedBy: null
      }
    ],
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
