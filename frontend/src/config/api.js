// API Configuration
// Development: Uses localhost:5176 with Vite proxy routing /api to backend:4000
// Production: Uses same port for frontend and backend with /api prefix
const API_BASE_URL = (import.meta.env.VITE_API_URL ) ;

export default API_BASE_URL;
