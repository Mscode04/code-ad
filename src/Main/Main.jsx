import React, { useState } from "react";
import { Link, Outlet, useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import logo from "../assets/img/logo.jpg"; // Make sure to have your logo.jpg in the same directory
import "./Main.css";

const Main = () => {
  const navigate = useNavigate();
  const [showMobileWarning, setShowMobileWarning] = useState(false);
  const [isMenuCollapsed, setIsMenuCollapsed] = useState(false);

  // Check screen size on component mount and resize
  React.useEffect(() => {
    const checkScreenSize = () => {
      if (window.innerWidth < 768) {
        setShowMobileWarning(true);
      } else {
        setShowMobileWarning(false);
      }
    };

    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);

    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  // Navigation items
  const navItems = [
    { path: "/dashboard", name: "Dashboard", icon: "dashboard" },
    { path: "/all-sales", name: "Sales Reports", icon: "assessment" },
    { path: "/all-customers", name: "Customers", icon: "people" },
    { path: "/sales", name: "New Sales", icon: "add_shopping_cart" },
    { path: "/new-connection", name: "New Connection", icon: "link" },
    { path: "/req", name: "New Requests", icon: "assignment" },
    { path: "/routes", name: "New Route", icon: "alt_route" },
    { path: "/products", name: "Products", icon: "inventory" },
    { path: "/check-in", name: "Check-in Reports", icon: "checklist" },
    { path: "/msg", name: "Massages", icon: "assignment" },
    // { path: "/help", name: "Help", icon: "help" },
  ];

  const handleLogout = () => {
    toast.info(
      <div>
        <p>Are you sure you want to logout?</p>
        <div className="logout-confirm-buttons">
          <button 
            className="confirm-btn"
            onClick={() => {
              toast.dismiss();
              navigate("/logout");
            }}
          >
            Yes
          </button>
          <button 
            className="cancel-btn"
            onClick={() => toast.dismiss()}
          >
            Cancel
          </button>
        </div>
      </div>,
      {
        position: "top-center",
        autoClose: false,
        closeOnClick: false,
        draggable: false,
      }
    );
  };

  const toggleMenu = () => {
    setIsMenuCollapsed(!isMenuCollapsed);
  };

  const getCurrentDate = () => {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return new Date().toLocaleDateString(undefined, options);
  };

  return (
    <div className="dashboard-container">
      {showMobileWarning && (
        <div className="mobile-warning">
          <div className="warning-content">
            <span className="warning-icon">⚠️</span>
            <h3>Mobile View Not Supported</h3>
            <p>Please use a tablet or desktop for the best experience.</p>
          </div>
        </div>
      )}

      {/* Sidebar/Navbar */}
      <nav className={`sidebar ${isMenuCollapsed ? "collapsed" : ""}`}>
        <div className="sidebar-header">
          <img src={logo} alt=" Logo" className="logo" />
      
          {/* <button className="menu-toggle" onClick={toggleMenu}>
            <span className="material-icons">
              {isMenuCollapsed ? "chevron_right" : "chevron_left"}
            </span>
          </button> */}
        </div>
        <ul className="nav-items">
          {navItems.map((item) => (
            <li key={item.path}>
              <Link to={item.path} className="nav-link">
                <span className="material-icons nav-icon">{item.icon}</span>
                {!isMenuCollapsed && (
                  <span className="nav-text">{item.name}</span>
                )}
              </Link>
            </li>
          ))}
        </ul>
        <div className="user-profile">
          <div className="user-avatar">
            <span className="material-icons">account_circle</span>
          </div>
          {!isMenuCollapsed && (
            <div className="user-info">
              <span className="user-name">Admin Dashboard</span>
              <span className="user-role">Manager</span>
            </div>
          )}
        </div>
      </nav>

      {/* Main Content Area */}
      <div className="main-content">
        {/* Top Header */}
        <header className="content-header">
          <div className="header-left">
            <button className="mobile-menu-btn" onClick={toggleMenu}>
              <span className="material-icons">menu</span>
            </button>
            <h1>Admin Dashboard</h1>
            <div className="current-date">{getCurrentDate()}</div>
          </div>
          <div className="header-right">
            {/* <button className="notification-btn">
              <span className="material-icons">notifications</span>
              <span className="notification-badge">3</span>
            </button> */}
            <button 
              className="logout-btn"
              onClick={handleLogout}
            >
              {/* <span className="material-icons">logout</span> */}
              {!isMenuCollapsed && <span>Logout</span>}
            </button>
          </div>
        </header>

        {/* Page Content - This will render nested routes */}
        <div className="page-content">
          <Outlet />
        </div>

        {/* Footer */}
        <footer className="dashboard-footer">
          <div className="footer-content">
            <div className="help-section">
              <Link to="/help" className="help-link">
                <span className="material-icons">help</span>
                Help? 
              </Link>
            </div>
            <div className="copyright">
              © {new Date().getFullYear()} © Tharayil Bharath Gas. All rights reserved. Designed & Developed by <a href="https://neuraq.in/" class="text-dark text-decoration-none">neuraq.in</a>

            </div>
          
          </div>
        </footer>
      </div>

      <ToastContainer />
    </div>
  );
};

export default Main;