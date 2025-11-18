import React from "react";
import Logo from "../assets/logo_11.png";
import "./sideBar.css";
import { BiHomeAlt2 } from "react-icons/bi";
import { FaTasks } from "react-icons/fa";
import { GoPeople } from "react-icons/go";
import { TbPhoneCall } from "react-icons/tb";
import { IoFileTrayFullOutline } from "react-icons/io5";
import { RiSettings4Line } from "react-icons/ri";
import { TbLogout2 } from "react-icons/tb";
import { NavLink } from "react-router-dom";

export default function Sidebar() {
  // Get user role from localStorage
  const userData = JSON.parse(localStorage.getItem('userData') || '{}');
  const userRole = userData.role || 'caller';

  return (
    <>
      <div className="sidebar">
        <div className="sidebar-logo">
          <img src={Logo} alt="App Logo" />
        </div>

        <nav className="sidebar-menu">
          <h4>Overview</h4>
          <ul>
            <li>
              <NavLink
                to={userRole === 'admin' ? '/admin' : '/dashboard'}
                className={({ isActive }) =>
                  `menu-item${isActive ? " active" : ""}`
                }
              >
                <BiHomeAlt2 />
                <span>Dashboard</span>
              </NavLink>
            </li>
            <li>
              <NavLink
                to={userRole === 'admin' ? '/admin/tasks' : '/tasks'}
                className={({ isActive }) =>
                  `menu-item${isActive ? " active" : ""}`
                }
              >
                <FaTasks />
                <span>Task</span>
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/customers"
                className={({ isActive }) =>
                  `menu-item${isActive ? " active" : ""}`
                }
              >
                <GoPeople />
                <span>Customers</span>
              </NavLink>
            </li>
            {userRole === 'admin' && (
              <li>
                <NavLink
                  to="/employees"
                  className={({ isActive }) =>
                    `menu-item${isActive ? " active" : ""}`
                  }
                >
                  <TbPhoneCall />
                  <span>Employees</span>
                </NavLink>
              </li>
            )}
            <li>
              <NavLink
                to="/reports"
                className={({ isActive }) =>
                  `menu-item${isActive ? " active" : ""}`
                }
              >
                <IoFileTrayFullOutline />
                <span>Report</span>
              </NavLink>
            </li>
          </ul>
        </nav>
        <div className="sidebar-end">
          <ul>
            <li>
              <NavLink
                to="/settings"
                className={({ isActive }) =>
                  `menu-item${isActive ? " active" : ""}`
                }
              >
                <RiSettings4Line />
                <span>Settings</span>
              </NavLink>
            </li>
            <li className="logout">
              <NavLink to="/logout" className="menu-item">
                <TbLogout2 />
                <span>Logout</span>
              </NavLink>
            </li>
          </ul>
        </div>
      </div>
    </>
  );
}
