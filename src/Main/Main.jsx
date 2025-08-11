import React, { useState, useEffect } from "react";
import { Link, Outlet, useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import logo from "../assets/img/logo.jpg";
import "./Main.css";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../Firebase/config";

const Main = () => {
  const navigate = useNavigate();
  const [showMobileWarning, setShowMobileWarning] = useState(false);
  const [isMenuCollapsed, setIsMenuCollapsed] = useState(false);

  // Dashboard stats
  const [todaySaleAmount, setTodaySaleAmount] = useState(0);
  const [todayAmountReceived, setTodayAmountReceived] = useState(0);
  const [todayCredit, setTodayCredit] = useState(0);

  // Responsive warning
  useEffect(() => {
    const checkScreenSize = () => {
      setShowMobileWarning(window.innerWidth < 768);
    };
    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);
    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  // Fetch today's sales and calculate stats
  useEffect(() => {
    const fetchTodaySales = async () => {
      try {
        const today = new Date().toISOString().split("T")[0];
        const salesQuery = query(
          collection(db, "sales"),
          where("date", "==", today),
          where("transactionType", "==", "sale")
        );
        const snapshot = await getDocs(salesQuery);
        let totalSale = 0;
        let totalReceived = 0;
        let totalCredit = 0;
        snapshot.forEach((doc) => {
          const data = doc.data();
          const price = data.customPrice || data.productPrice || 0;
          const qty = data.salesQuantity || 0;
          const amountReceived = data.totalAmountReceived || 0;
          const saleAmount = price * qty;
          totalSale += saleAmount;
          totalReceived += amountReceived;
          totalCredit += saleAmount - amountReceived;
        });
        setTodaySaleAmount(totalSale);
        setTodayAmountReceived(totalReceived);
        setTodayCredit(totalCredit);
      } catch (err) {
        setTodaySaleAmount(0);
        setTodayAmountReceived(0);
        setTodayCredit(0);
      }
    };
    fetchTodaySales();
  }, []);

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

  const toggleMenu = () => setIsMenuCollapsed(!isMenuCollapsed);

  const getCurrentDate = () => {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return new Date().toLocaleDateString(undefined, options);
  };

  // Helper to show 1 decimal
  const fmt = (num) => Number(num).toFixed(1);

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
            {/* Dashboard Stats */}
            <div style={{
              marginLeft: 24,
              fontWeight: 500,
              display: "flex",
              gap: "18px",
              alignItems: "center"
            }}>
              {/* <span>
                <span style={{ color: "#1976d2" }}>Today Sale:</span> ₹{fmt(todaySaleAmount)}
              </span>
              <span>
                <span style={{ color: "#388e3c" }}>Received:</span> ₹{fmt(todayAmountReceived)}
              </span>
              <span>
                <span style={{ color: "#d32f2f" }}>Credited:</span> ₹{fmt(todayCredit)}
              </span> */}
            </div>
          </div>
          <div className="header-right">
            <button 
              className="logout-btn"
              onClick={handleLogout}
            >
              {!isMenuCollapsed && <span>Logout</span>}
            </button>
          </div>
        </header>

        {/* Page Content */}
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
              © {new Date().getFullYear()} © Tharayil Bharath Gas. All rights reserved. Designed & Developed by <a href="https://neuraq.in/" className="text-dark text-decoration-none">neuraq.in</a>
            </div>
          </div>
        </footer>
      </div>
      <ToastContainer />
    </div>
  );
};

export default Main;