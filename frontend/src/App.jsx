import "./App.css";
import Sidebar from "./components/Sidebar";
import CustomerManagement from "./pages/CustomerManagement";
import CallerDashboard from "./pages/CallerDashboard";

function App() {
  return (
    <>
      <div className="app-container">
        <Sidebar />
        <div className="main-content">
          <CallerDashboard />
          {/* <CustomerManagement /> */}
        </div>
      </div>
    </>
  );
}

export default App;
