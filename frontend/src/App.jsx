import "./App.css";
import Sidebar from "./components/Sidebar";
import CustomerManagement from "./pages/CustomerManagement";
import EmployeeManagement from "./pages/EmployeeManagement";
import CallerDashboard from "./pages/CallerDashboard";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import Login from "./pages/Login";
import Settings from "./pages/Settings";
import Report from "./pages/Report";
import CallerTasks from "./pages/CallerTasks";
import AdminDashboard from "./pages/AdminDashboard";
import AdminTasks from "./pages/AdminTasks";


function App() {
  const location = useLocation();
  const isLoginPage = location.pathname === "/login";

  return (
    <>
      <div className="app-container">
        {!isLoginPage && <Sidebar />}
        <div className={`main-content ${isLoginPage ? 'full-width' : ''}`}>
          <Routes>
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<Login />} />
            <Route path="/dashboard" element={<CallerDashboard />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/tasks" element={<CallerTasks />} />
            <Route path="/admin/tasks" element={<AdminTasks />} />
            <Route path="/customers" element={<CustomerManagement />} />
            <Route path="/employees" element={<EmployeeManagement />} />
            <Route path="/reports" element={<Report />} />
            <Route path="/settings" element={<Settings/>} />
            <Route path="/logout" element={<div>Logging out…</div>} />
          </Routes>
        </div>
      </div>
    </>
  );
}

export default App;
