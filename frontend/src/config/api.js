// API Configuration
// Development: Uses localhost:5173 with Vite proxy routing /api to backend:4000
// Production: Uses environment variable or defaults to /api
export const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

export default API_BASE_URL;
