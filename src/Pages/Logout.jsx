import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Box } from '@mui/material';
// import "./Logout.css";

const Logout = ({ onLogout }) => {
  const navigate = useNavigate();

  useEffect(() => {
    // Perform logout actions
    const performLogout = () => {
      // Call the logout function passed from App.js
      onLogout();
      
      // Add any additional cleanup here (e.g., clearing local storage)
      localStorage.removeItem("userToken");
      localStorage.removeItem("userPreferences");
      
      // Redirect to login after a brief delay
      setTimeout(() => {
        navigate("/login", { state: { fromLogout: true } });
      }, 2000);
    };

    performLogout();
  }, [onLogout, navigate]);

  return (
    <div className="logout-container">
    <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
      <h1 className="text-center text-danger">Logging Out.....</h1>
      <img
        src="https://cdn-icons-gif.flaticon.com/14625/14625568.gif"
        alt="Loading..."
        style={{ width: '350px', height: '350px' }}
      />
    </Box>
    </div>
  );
};


export default Logout;