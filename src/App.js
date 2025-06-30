import React, { useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import LoginPage from "./Main/LoginPage";
import Main from "./Main/Main";
import Logout from "./Pages/Logout";
import Dashboard from "./Pages/Dashboard";
import Help from "./Pages/Help";
import Products from "./Components/Products";
import Sales from "./Components/Sales";
import NewConnection from "./Components/NewConnection";
import Routess from "./Components/Routess";
import AllCustomers from "./Pages/AllCustomers";
import AllSales from "./Pages/AllSales";
import SaleDetail from "./Pages/SaleDetail";
import CustomerProfile from "./Pages/CustomerProfile";
import EditCustomer from "./Components/EditCustomer";
import Checkin from "./Pages/Checkin";
import GasRequests from "./Pages/GasRequests";
import UpdateSale from "./Components/UpdateSale";
import AllMessages from "./Pages/AllMessages";

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(
    localStorage.getItem("isAuthenticated") === "true"
  );

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem("isAuthenticated");
  };

  return (
    <Routes>
      <Route 
        path="/" 
        element={!isAuthenticated ? <Navigate to="/login" /> : <Navigate to="/dashboard" />} 
      />
      <Route 
        path="/login" 
        element={!isAuthenticated ? 
          <LoginPage setIsAuthenticated={setIsAuthenticated} /> : 
          <Navigate to="/dashboard" />} 
      />
      <Route path="/logout" element={<Logout onLogout={handleLogout} />} />
      
      {/* Protected routes */}
      <Route 
        path="/" 
        element={isAuthenticated ? <Main /> : <Navigate to="/login" />}
      >
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="new-connection" element={<NewConnection />} />
        <Route path="sales" element={<Sales />} />
        <Route path="routes" element={<Routess />} />
        <Route path="products" element={<Products />} />
        <Route path="help" element={<Help />} />
        <Route path="check-in" element={<Checkin />} />
        <Route path="req" element={<GasRequests />} />
        <Route path="msg" element={<AllMessages />} />
        <Route path="all-customers" element={<AllCustomers />} />
        <Route path="all-sales" element={<AllSales />} />
        <Route path="customer/:id" element={<CustomerProfile />} />
        <Route path="customer-edit/:id" element={<EditCustomer />} />
        <Route path="sales/:id" element={<SaleDetail />} />
        <Route path="sales/update/:id" element={<UpdateSale />} />
      </Route>

      {/* Catch-all route */}
      <Route 
        path="*" 
        element={!isAuthenticated ? <Navigate to="/login" /> : <Navigate to="/dashboard" />} 
      />
    </Routes>
  );
}

export default App;