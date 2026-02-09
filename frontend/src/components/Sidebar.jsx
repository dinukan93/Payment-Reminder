import React from "react";
import Logo from "../assets/logo_11.png";
import "./Sidebar.css";
import { BiHomeAlt2 } from "react-icons/bi";
import { FaTasks } from "react-icons/fa";
import { GoPeople } from "react-icons/go";
import { TbPhoneCall } from "react-icons/tb";
import { IoFileTrayFullOutline } from "react-icons/io5";
import { RiSettings4Line } from "react-icons/ri";
import { TbLogout2 } from "react-icons/tb";
import { NavLink } from "react-router-dom";
import { MdOutlineFileUpload } from "react-icons/md";
import { RiAdminLine } from "react-icons/ri";
import { FaFilter } from "react-icons/fa";

export default function Sidebar() {

  const userData = JSON.parse(localStorage.getItem('userData') || '{}');
  const userRole = userData.role || 'caller';

  
  const adminRoles = ['superadmin', 'region_admin', 'rtom_admin', 'supervisor', 'admin', 'uploader'];
  const isAdminRole = adminRoles.includes(userRole);

 
  if (userRole === "uploader") {
    return (
      <div className="sidebar">
        <div className="sidebar-logo">
          <img src={Logo} alt="App Logo" />
        </div>

        <nav className="sidebar-menu">
          <h4>Overview</h4>
          <ul>
            <li>
              <NavLink
                to="/upload"
                className={({ isActive }) =>
                  `menu-item${isActive ? " active" : ""}`
                }
              >
                <MdOutlineFileUpload />
                <span>Upload</span>
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
    );
  }

  
  return (
    <div className="sidebar">
      <div className="sidebar-logo">
        <img src={Logo} alt="App Logo" />
      </div>

      <nav className="sidebar-menu">
        <h4>Overview</h4>
        <ul>
          {userRole === "superadmin" ? (
            <>
              <li>
                <NavLink
                  to="/superadmin"
                  className={({ isActive }) =>
                    `menu-item${isActive ? " active" : ""}`
                  }
                >
                  <RiAdminLine />
                  <span>Admin Management</span>
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="/pod-filter"
                  className={({ isActive }) =>
                    `menu-item${isActive ? " active" : ""}`
                  }
                >
                  <FaFilter />
                  <span>POD Filter</span>
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="/pod-config"
                  className={({ isActive }) =>
                    `menu-item${isActive ? " active" : ""}`
                  }
                >
                  <RiSettings4Line />
                  <span>POD Config</span>
                </NavLink>
              </li>
            </>
          ) : userRole === "region_admin" ? (
            <li>
              <NavLink
                to="/region-admin-dashboard"
                className={({ isActive }) =>
                  `menu-item${isActive ? " active" : ""}`
                }
              >
                <RiAdminLine />
                <span>RTOM Admins</span>
              </NavLink>
            </li>
          ) : userRole === "rtom_admin" ? (
            <li>
              <NavLink
                to="/rtom-admin-dashboard"
                className={({ isActive }) =>
                  `menu-item${isActive ? " active" : ""}`
                }
              >
                <RiAdminLine />
                <span>Supervisors</span>
              </NavLink>
            </li>
          ) : userRole === "supervisor" ? (
            <>
              <li>
                <NavLink
                  to="/admin"
                  end
                  className={({ isActive }) =>
                    `menu-item${isActive ? " active" : ""}`
                  }
                >
                  <RiAdminLine />
                  <span>Admin Dashboard</span>
                </NavLink>
              </li>

              <li>
                <NavLink
                  to="/admin/tasks"
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

              <li>
                <NavLink
                  to="/employees"
                  className={({ isActive }) =>
                    `menu-item${isActive ? " active" : ""}`
                  }
                >
                  <TbPhoneCall />
                  <span>Callers</span>
                </NavLink>
              </li>

              <li>
                <NavLink
                  to="/admin/reports"
                  className={({ isActive }) =>
                    `menu-item${isActive ? " active" : ""}`
                  }
                >
                  <IoFileTrayFullOutline />
                  <span>Report</span>
                </NavLink>
              </li>
            </>
          ) : (
            <>
              <li>
                <NavLink
                  to={
                    isAdminRole && userRole !== "uploader"
                      ? "/admin"
                      : "/dashboard"
                  }
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
                  to={
                    isAdminRole && userRole !== "uploader"
                      ? "/admin/tasks"
                      : "/tasks"
                  }
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

              {(userRole === "admin" ||
                userRole === "rtom_admin" ||
                userRole === "supervisor") && (
                  <li>
                    <NavLink
                      to="/employees"
                      className={({ isActive }) =>
                        `menu-item${isActive ? " active" : ""}`
                      }
                    >
                      <TbPhoneCall />
                      <span>Callers</span>
                    </NavLink>
                  </li>
                )}

              <li>
                <NavLink
                  to={
                    userRole === "admin"
                      ? "/admin/reports"
                      : "/reports"
                  }
                  className={({ isActive }) =>
                    `menu-item${isActive ? " active" : ""}`
                  }
                >
                  <IoFileTrayFullOutline />
                  <span>Report</span>
                </NavLink>
              </li>
            </>
          )}
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
  );
}
