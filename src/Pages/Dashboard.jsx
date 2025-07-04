import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "../Firebase/config";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend
} from 'recharts';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "./Dashboard.css";
import { 
  Box, 
  FormControl, 
  InputLabel, 
  MenuItem, 
  Select, 
  Typography,
  Divider,
  Button,
  ButtonGroup
} from '@mui/material';
import { styled } from '@mui/system';

const PremiumCard = styled('div')(({ theme }) => ({
  background: 'linear-gradient(145deg, #1a237e, #283593)',
  color: 'white',
  borderRadius: '12px',
  padding: '20px',
  boxShadow: '0 8px 16px rgba(0, 0, 0, 0.2)',
  transition: 'transform 0.3s ease-in-out',
  '&:hover': {
    transform: 'translateY(-2px)'
  }
}));

const ActionButton = styled(Button)(({ theme }) => ({
  background: 'rgba(255, 255, 255, 0.1)',
  color: 'white',
  border: '1px solid rgba(255, 255, 255, 0.3)',
  '&:hover': {
    background: 'rgba(255, 255, 255, 0.2)'
  },
  '&.active': {
    background: 'rgba(255, 255, 255, 0.3)',
    fontWeight: 'bold'
  }
}));

const Dashboard = () => {
  const navigate = useNavigate();
  const [salesData, setSalesData] = useState([]);
  const [customersData, setCustomersData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [timePeriod, setTimePeriod] = useState("today");
  const [activeView, setActiveView] = useState("dashboard");
  const [routes, setRoutes] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const salesQuery = query(collection(db, "sales"), orderBy("timestamp", "desc"));
        const salesSnapshot = await getDocs(salesQuery);
        const salesData = salesSnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            date: data.timestamp?.toDate(),
            route: data.route || 'Unknown'
          };
        });
        setSalesData(salesData);

        const customersQuery = query(collection(db, "customers"));
        const customersSnapshot = await getDocs(customersQuery);
        const customersData = customersSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setCustomersData(customersData);

        const routeSet = new Set();
        salesData.forEach(sale => {
          if (sale.route) {
            routeSet.add(sale.route);
          }
        });
        const uniqueRoutes = Array.from(routeSet).filter(route => route && route.trim() !== '');
        setRoutes(["All", ...uniqueRoutes]);

        setLoading(false);
      } catch (error) {
        console.error("Error fetching data:", error);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const filteredData = salesData.filter(sale => {
    if (timePeriod !== "All") {
      const today = new Date();
      const saleDate = sale.date ? new Date(sale.date) : null;
      
      if (!saleDate) return false;
      
      if (timePeriod === "today") {
        return (
          saleDate.getDate() === today.getDate() &&
          saleDate.getMonth() === today.getMonth() &&
          saleDate.getFullYear() === today.getFullYear()
        );
      } else if (timePeriod === "lastWeek") {
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        return saleDate >= oneWeekAgo && saleDate <= today;
      } else if (timePeriod === "lastMonth") {
        const oneMonthAgo = new Date();
        oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
        return saleDate >= oneMonthAgo && saleDate <= today;
      } else if (timePeriod === "lastYear") {
        const oneYearAgo = new Date();
        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
        return saleDate >= oneYearAgo && saleDate <= today;
      } else if (timePeriod === "custom") {
        if (startDate && endDate) {
          return saleDate >= startDate && saleDate <= endDate;
        }
      }
    }
    return true;
  });

  const totalSalesAmount = filteredData.reduce((sum, sale) => sum + (sale.todayCredit || 0), 0);
  const totalSalesQuantity = filteredData.reduce((sum, sale) => sum + (sale.salesQuantity || 0), 0);
  const totalEmptyQuantity = filteredData.reduce((sum, sale) => sum + (sale.emptyQuantity || 0), 0);
  const totalGasQuantity = customersData.reduce((sum, customer) => sum + (customer.currentGasOnHand || 0), 0);
  const totalBalance = customersData.reduce((sum, customer) => sum + (customer.currentBalance || 0), 0);
  const totalAmountReceived = filteredData.reduce((sum, sale) => sum + (sale.totalAmountReceived || 0), 0);

  const salesVsReceivedPieData = [
    { name: "Sales Amount", value: totalSalesAmount },
    { name: "Amount Received", value: totalAmountReceived }
  ];

  const COLORS = ['#FFE072', '#9AD8D8'];

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <img
          src="https://cdn.pixabay.com/animation/2023/10/08/03/19/03-19-26-213_512.gif"
          alt="Loading..."
          style={{ width: '150px', height: '150px' }}
        />
      </Box>
    );
  }

  return (
    <div className="dashboard-container">
      {/* Combined Header Section */}
      <div className="dashboard-header">
        {/* Filters Section */}
        <div className="filters-container">
          <Typography variant="h6" gutterBottom>Filters</Typography>
          <Divider sx={{ mb: 2 }} />
          
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Time Period</InputLabel>
            <Select
              value={timePeriod}
              label="Time Period"
              onChange={(e) => {
                setTimePeriod(e.target.value);
                if (e.target.value !== "custom") {
                  setStartDate(null);
                  setEndDate(null);
                }
              }}
            >
              <MenuItem value="today">Today</MenuItem>
              <MenuItem value="lastWeek">Last Week</MenuItem>
              <MenuItem value="lastMonth">Last Month</MenuItem>
              <MenuItem value="lastYear">Last Year</MenuItem>
              <MenuItem value="custom">Custom Range</MenuItem>
              <MenuItem value="All">All Time</MenuItem>
            </Select>
          </FormControl>

{timePeriod === "custom" && (
  <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
    <DatePicker
      selected={startDate}
      onChange={(date) => setStartDate(date)}
      selectsStart
      startDate={startDate}
      endDate={endDate}
      placeholderText="Start Date"
      className="custom-datepicker"
      showMonthDropdown
      showYearDropdown
      dropdownMode="select"
      minDate={new Date(2020, 0, 1)} // Set your minimum allowed date
      maxDate={endDate || new Date()} // Don't allow dates after end date or today
    />
    <Typography variant="body1">to</Typography>
    <DatePicker
      selected={endDate}
      onChange={(date) => setEndDate(date)}
      selectsEnd
      startDate={startDate}
      endDate={endDate}
      minDate={startDate} // Don't allow dates before start date
      maxDate={new Date()} // Don't allow future dates
      placeholderText="End Date"
      className="custom-datepicker"
      showMonthDropdown
      showYearDropdown
      dropdownMode="select"
    />
  </Box>
)}

          <ButtonGroup variant="outlined" sx={{ mt: 2 }}>
            <ActionButton onClick={() => navigate('/all-sales')}>Sales Report</ActionButton>
            <ActionButton onClick={() => navigate('/all-customers')}>Customers</ActionButton>
          </ButtonGroup>
        </div>

        {/* Quick Stats Preview */}
        <PremiumCard>
          <Typography variant="h6" gutterBottom>Quick Stats</Typography>
          <Divider sx={{ bgcolor: 'rgba(255, 255, 255, 0.2)', mb: 2 }} />
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2 }}>
            <div>
              <Typography variant="body2">Total Sales</Typography>
              <Typography variant="h5">₹{totalSalesAmount.toLocaleString('en-IN')}</Typography>
            </div>
            <div>
              <Typography variant="body2">Amount Received</Typography>
              <Typography variant="h5">₹{totalAmountReceived.toLocaleString('en-IN')}</Typography>
            </div>
            <div>
              <Typography variant="body2">Balance Due</Typography>
              <Typography variant="h5">₹{totalBalance.toLocaleString('en-IN')}</Typography>
            </div>
          </Box>
        </PremiumCard>
      </div>

      {/* Main Content Area */}
      <div className="dashboard-content">
        {/* Combined Analytics Section */}
        <div className="analytics-container">
          {/* Main Chart */}
          <PremiumCard>
            <Typography variant="h6" gutterBottom>Sales Analytics</Typography>
            <Divider sx={{ bgcolor: 'rgba(255, 255, 255, 0.2)', mb: 3 }} />
            <ResponsiveContainer width="100%" height={400}>
              <PieChart>
                <Pie
                  data={salesVsReceivedPieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={120}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name}: ₹${(percent * totalSalesAmount).toLocaleString('en-IN')}`}
                >
                  {salesVsReceivedPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value) => [`₹${value.toLocaleString('en-IN')}`, 'Amount']}
                  contentStyle={{
                    background: '#1a237e',
                    borderColor: '#4e79a7',
                    borderRadius: '8px',
                    color: 'white'
                  }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </PremiumCard>

          {/* Summary Cards - Vertical Layout */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <PremiumCard>
              <Typography variant="h6">Total Sales Qty</Typography>
              <Typography variant="h4">{totalSalesQuantity}</Typography>
            </PremiumCard>
            <PremiumCard>
              <Typography variant="h6">Empty Cylinders</Typography>
              <Typography variant="h4">{totalEmptyQuantity}</Typography>
            </PremiumCard>
            <PremiumCard>
              <Typography variant="h6">Gas On Hand</Typography>
              <Typography variant="h4">{totalGasQuantity}</Typography>
            </PremiumCard>
              <PremiumCard>
            <Typography variant="h6">Total Customers</Typography>
            <Typography variant="h4">{customersData.length}</Typography>
          </PremiumCard>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;