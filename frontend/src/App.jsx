import "./App.css";
import Sidebar from "./components/Sidebar";
import ProtectedRoute from "./components/ProtectedRoute";
import CustomerManagement from "./pages/CustomerManagement";
import EmployeeManagement from "./pages/EmployeeManagement";
import CallerDashboard from "./pages/CallerDashboard";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import AuthSuccess from "./pages/AuthSuccess";
import Logout from "./pages/Logout";
import Settings from "./pages/Settings";
import Report from "./pages/Report";
import AdminReport from "./pages/AdminReport";
import CallerTasks from "./pages/CallerTasks";
import AdminDashboard from "./pages/AdminDashboard";
import AdminTasks from "./pages/AdminTasks";
import UploadPage from "./pages/UploadPage";
import DisplayDataPage from "./pages/DisplayDataPage";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";


function App() {
  const location = useLocation();
  const isLoginPage = location.pathname === "/login" || 
                       location.pathname === "/auth-success" || 
                       location.pathname === "/register" ||
                       location.pathname === "/forgot-password" ||
                       location.pathname === "/reset-password" ||
                       location.pathname === "/logout";

  return (
    <>
      <div className="app-container">
        {!isLoginPage && <Sidebar />}
        <div className={`main-content ${isLoginPage ? 'full-width' : ''}`}>
          <Routes>
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/auth-success" element={<AuthSuccess />} />
            <Route path="/dashboard" element={<ProtectedRoute requiredRole="caller"><CallerDashboard /></ProtectedRoute>} />
            <Route path="/admin" element={<ProtectedRoute requiredRole="admin"><AdminDashboard /></ProtectedRoute>} />
            <Route path="/tasks" element={<ProtectedRoute requiredRole="caller"><CallerTasks /></ProtectedRoute>} />
            <Route path="/admin/tasks" element={<ProtectedRoute ><AdminTasks /></ProtectedRoute>} />
            <Route path="/customers" element={<ProtectedRoute><CustomerManagement /></ProtectedRoute>} />
            <Route path="/employees" element={<ProtectedRoute requiredRole="admin"><EmployeeManagement /></ProtectedRoute>} />
            <Route path="/reports" element={<ProtectedRoute><Report /></ProtectedRoute>} />
            <Route path="/upload" element={<ProtectedRoute><UploadPage /></ProtectedRoute>} />
            <Route path="/display-data" element={<ProtectedRoute><DisplayDataPage /></ProtectedRoute>} />
            <Route path="/admin/reports" element={<ProtectedRoute requiredRole="admin"><AdminReport /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
            <Route path="/logout" element={<Logout />} />
          </Routes>
        </div>
      </div>
        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          pauseOnHover
          draggable
        />
    </>
  );
}

export default App;
