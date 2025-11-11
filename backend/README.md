# Payment Reminder Backend API

Backend API for the Payment Reminder System built with Node.js, Express, and MongoDB.

## Features

- Customer Management (CRUD operations)
- Caller Management (CRUD operations)
- Request/Assignment System (Admin assigns customers to callers)
- Contact History Tracking
- Authentication & Authorization
- RESTful API endpoints

## Tech Stack

- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM for MongoDB
- **JWT** - Authentication
- **bcryptjs** - Password hashing

## Installation

1. Navigate to the backend folder:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the backend directory with the following variables:
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/payment-reminder
JWT_SECRET=your_jwt_secret_key_here_change_in_production
NODE_ENV=development
```

4. Make sure MongoDB is installed and running on your system.

## Running the Server

### Development mode (with auto-restart):
```bash
npm run dev
```

### Production mode:
```bash
npm start
```

The server will run on `http://localhost:5000`

## API Endpoints

### Customer Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/customers` | Get all customers |
| GET | `/api/customers/:id` | Get customer by ID |
| GET | `/api/customers/status/:status` | Get customers by status (OVERDUE, PENDING, COMPLETED, UNASSIGNED) |
| GET | `/api/customers/assigned/:callerId` | Get customers assigned to a caller |
| POST | `/api/customers` | Create new customer |
| PUT | `/api/customers/:id` | Update customer |
| PUT | `/api/customers/:id/contact` | Update customer contact history |
| DELETE | `/api/customers/:id` | Delete customer |

### Caller Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/callers` | Get all callers |
| GET | `/api/callers/available` | Get available callers |
| GET | `/api/callers/:id` | Get caller by ID |
| POST | `/api/callers` | Create new caller |
| PUT | `/api/callers/:id` | Update caller |
| PUT | `/api/callers/:id/workload` | Update caller workload |
| DELETE | `/api/callers/:id` | Delete caller |

### Request Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/requests` | Get all requests |
| GET | `/api/requests/pending` | Get pending requests |
| GET | `/api/requests/caller/:callerId` | Get requests by caller ID |
| GET | `/api/requests/:id` | Get request by ID |
| POST | `/api/requests` | Create new request (admin assigns customers) |
| PUT | `/api/requests/:id` | Update request |
| PUT | `/api/requests/:id/accept` | Accept request |
| PUT | `/api/requests/:id/decline` | Decline request |

### Authentication Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new caller |
| POST | `/api/auth/login` | Login caller |
| GET | `/api/auth/profile` | Get caller profile (requires token) |

## Data Models

### Customer Model
```javascript
{
  accountNumber: String (unique),
  name: String,
  contactNumber: String,
  amountOverdue: String,
  daysOverdue: String,
  status: String (OVERDUE, PENDING, COMPLETED, UNASSIGNED),
  response: String,
  previousResponse: String,
  contactHistory: [
    {
      date: String,
      outcome: String,
      response: String,
      promisedDate: String,
      paymentMade: Boolean
    }
  ],
  assignedTo: ObjectId (ref: Caller),
  assignedDate: String
}
```

### Caller Model
```javascript
{
  callerId: String (unique),
  name: String,
  email: String (unique),
  password: String (hashed),
  status: String (AVAILABLE, BUSY, OFFLINE),
  currentLoad: Number,
  maxLoad: Number,
  assignedCustomers: [ObjectId],
  taskStatus: String (ONGOING, COMPLETED, IDLE),
  customersContacted: String
}
```

### Request Model
```javascript
{
  requestId: String (unique),
  callerName: String,
  callerId: String,
  caller: ObjectId (ref: Caller),
  customers: [
    {
      customerId: ObjectId,
      accountNumber: String,
      name: String,
      contactNumber: String,
      amountOverdue: String,
      daysOverdue: String
    }
  ],
  customersSent: Number,
  sentDate: String,
  status: String (PENDING, ACCEPTED, DECLINED),
  respondedDate: String,
  reason: String,
  sentBy: String
}
```

## Example API Calls

### Create a Customer
```bash
POST http://localhost:5000/api/customers
Content-Type: application/json

{
  "accountNumber": "1001234567",
  "name": "John Doe",
  "contactNumber": "077-1234567",
  "amountOverdue": "Rs.5000",
  "daysOverdue": "25",
  "status": "UNASSIGNED"
}
```

### Assign Customers to Caller (Create Request)
```bash
POST http://localhost:5000/api/requests
Content-Type: application/json

{
  "callerName": "Ravi Kumar",
  "callerId": "2313",
  "customers": [
    {
      "accountNumber": "1001234567",
      "name": "John Doe",
      "contactNumber": "077-1234567",
      "amountOverdue": "Rs.5000",
      "daysOverdue": "25"
    }
  ]
}
```

### Accept Request
```bash
PUT http://localhost:5000/api/requests/:id/accept
```

### Update Customer Contact
```bash
PUT http://localhost:5000/api/customers/:id/contact
Content-Type: application/json

{
  "callOutcome": "Spoke to Customer",
  "customerResponse": "Will pay next week",
  "paymentMade": false,
  "promisedDate": "15/11/2025"
}
```

## Connecting Frontend to Backend

Update your frontend API calls to use `http://localhost:5000/api` as the base URL.

Example in React:
```javascript
// Get all customers
const response = await fetch('http://localhost:5000/api/customers');
const data = await response.json();

// Create customer
const response = await fetch('http://localhost:5000/api/customers', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(customerData),
});
```

## Error Handling

All API responses follow this format:

**Success Response:**
```json
{
  "success": true,
  "data": { ... }
}
```

**Error Response:**
```json
{
  "success": false,
  "message": "Error message",
  "error": "Detailed error (development only)"
}
```

## Development Notes

- The backend runs on port 5000 by default
- MongoDB should be running before starting the server
- JWT tokens expire after 30 days
- Passwords are hashed using bcrypt with salt rounds of 10
- CORS is enabled for all origins in development

## Future Enhancements

- [ ] Add input validation middleware
- [ ] Implement rate limiting
- [ ] Add API documentation with Swagger
- [ ] Implement real-time updates with Socket.io
- [ ] Add email/SMS notification service
- [ ] Implement admin authentication
- [ ] Add pagination for large datasets
- [ ] Implement data export functionality
