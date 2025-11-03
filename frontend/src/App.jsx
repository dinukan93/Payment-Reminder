import "./App.css";
import Sidebar from "./components/Sidebar";
import CustomerManagement from "./pages/CustomerManagement";
import EmployeeManagement from "./pages/EmployeeManagement";
import { Routes, Route, Navigate } from "react-router-dom";

function App() {
  return (
    <>
      <div className="app-container">
        <Sidebar />
        <div className="main-content">
          <Routes>
            <Route path="/" element={<Navigate to="/customers" replace />} />
            <Route path="/dashboard" element={<div>Dashboard</div>} />
            <Route path="/tasks" element={<div>Tasks</div>} />
            <Route path="/customers" element={<CustomerManagement />} />
            <Route path="/employees" element={<EmployeeManagement />} />
            <Route path="/reports" element={<div>Reports</div>} />
            <Route path="/settings" element={<div>Settings</div>} />
            <Route path="/logout" element={<div>Logging out…</div>} />
          </Routes>
        </div>
      </div>
    </>
  );
}

export default App;
