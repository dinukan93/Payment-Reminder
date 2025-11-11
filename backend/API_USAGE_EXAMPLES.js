// API Service for connecting React frontend to backend
// Place this file in: frontend/src/services/api.js

const API_BASE_URL = 'http://localhost:5000/api';

// Helper function for making API requests
const apiRequest = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(url, config);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'API request failed');
    }

    return data;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

// Customer API
export const customerAPI = {
  // Get all customers
  getAll: () => apiRequest('/customers'),

  // Get customer by ID
  getById: (id) => apiRequest(`/customers/${id}`),

  // Get customers by status
  getByStatus: (status) => apiRequest(`/customers/status/${status}`),

  // Get customers assigned to a caller
  getAssigned: (callerId) => apiRequest(`/customers/assigned/${callerId}`),

  // Create new customer
  create: (customerData) => apiRequest('/customers', {
    method: 'POST',
    body: JSON.stringify(customerData),
  }),

  // Update customer
  update: (id, customerData) => apiRequest(`/customers/${id}`, {
    method: 'PUT',
    body: JSON.stringify(customerData),
  }),

  // Update customer contact history
  updateContact: (id, contactData) => apiRequest(`/customers/${id}/contact`, {
    method: 'PUT',
    body: JSON.stringify(contactData),
  }),

  // Delete customer
  delete: (id) => apiRequest(`/customers/${id}`, {
    method: 'DELETE',
  }),
};

// Caller API
export const callerAPI = {
  // Get all callers
  getAll: () => apiRequest('/callers'),

  // Get available callers
  getAvailable: () => apiRequest('/callers/available'),

  // Get caller by ID
  getById: (id) => apiRequest(`/callers/${id}`),

  // Create new caller
  create: (callerData) => apiRequest('/callers', {
    method: 'POST',
    body: JSON.stringify(callerData),
  }),

  // Update caller
  update: (id, callerData) => apiRequest(`/callers/${id}`, {
    method: 'PUT',
    body: JSON.stringify(callerData),
  }),

  // Update caller workload
  updateWorkload: (id, workloadData) => apiRequest(`/callers/${id}/workload`, {
    method: 'PUT',
    body: JSON.stringify(workloadData),
  }),

  // Delete caller
  delete: (id) => apiRequest(`/callers/${id}`, {
    method: 'DELETE',
  }),
};

// Request API
export const requestAPI = {
  // Get all requests
  getAll: () => apiRequest('/requests'),

  // Get pending requests
  getPending: () => apiRequest('/requests/pending'),

  // Get requests by caller ID
  getByCaller: (callerId) => apiRequest(`/requests/caller/${callerId}`),

  // Get request by ID
  getById: (id) => apiRequest(`/requests/${id}`),

  // Create new request (admin assigns customers to caller)
  create: (requestData) => apiRequest('/requests', {
    method: 'POST',
    body: JSON.stringify(requestData),
  }),

  // Update request
  update: (id, requestData) => apiRequest(`/requests/${id}`, {
    method: 'PUT',
    body: JSON.stringify(requestData),
  }),

  // Accept request
  accept: (id) => apiRequest(`/requests/${id}/accept`, {
    method: 'PUT',
  }),

  // Decline request
  decline: (id, reason) => apiRequest(`/requests/${id}/decline`, {
    method: 'PUT',
    body: JSON.stringify({ reason }),
  }),
};

// Auth API
export const authAPI = {
  // Register new caller
  register: (userData) => apiRequest('/auth/register', {
    method: 'POST',
    body: JSON.stringify(userData),
  }),

  // Login
  login: (credentials) => apiRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  }),

  // Get profile
  getProfile: (token) => apiRequest('/auth/profile', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  }),
};

// Example usage in React components:

/*
// In CallerDashboard.jsx
import { customerAPI } from '../services/api';

useEffect(() => {
  const loadCustomers = async () => {
    try {
      const response = await customerAPI.getAssigned(callerId);
      const customers = response.data;
      
      // Separate by status
      const contacted = customers.filter(c => c.status !== 'OVERDUE');
      const overdue = customers.filter(c => c.status === 'OVERDUE');
      
      setContactedCustomers(contacted);
      setOverduePayments(overdue);
    } catch (error) {
      console.error('Error loading customers:', error);
    }
  };
  
  loadCustomers();
}, [callerId]);

// Save customer contact
const handleSaveCustomerDetails = async (customerId, data) => {
  try {
    const response = await customerAPI.updateContact(customerId, data);
    console.log('Customer updated:', response.data);
    // Reload customers
  } catch (error) {
    console.error('Error updating customer:', error);
  }
};
*/

/*
// In AdminTasks.jsx
import { requestAPI, callerAPI } from '../services/api';

const handleConfirmAssign = async () => {
  try {
    const requestData = {
      callerName: selectedCaller.name,
      callerId: selectedCaller.callerId,
      customers: selectedCustomersData
    };
    
    const response = await requestAPI.create(requestData);
    console.log('Request sent:', response.data);
    alert('Customers assigned successfully!');
  } catch (error) {
    console.error('Error assigning customers:', error);
    alert('Failed to assign customers');
  }
};
*/

export default {
  customerAPI,
  callerAPI,
  requestAPI,
  authAPI,
};
