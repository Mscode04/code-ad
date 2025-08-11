import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "../Firebase/config";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
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

const PremiumCard = styled('div')({
  background: 'linear-gradient(145deg, #1a237e, #283593)',
  color: 'white',
  borderRadius: '16px',
  padding: '24px',
  boxShadow: '0 8px 24px rgba(40,53,147,0.12)',
  transition: 'transform 0.3s',
  '&:hover': { transform: 'translateY(-2px)' }
});

const ActionButton = styled(Button)({
  background: 'rgba(255,255,255,0.08)',
  color: '#fff',
  border: '1px solid #ffd700',
  fontWeight: 600,
  borderRadius: 8,
  '&:hover': { background: 'rgba(255,255,255,0.18)' }
});

const Dashboard = () => {
  const navigate = useNavigate();
  const [salesData, setSalesData] = useState([]);
  const [customersData, setCustomersData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [timePeriod, setTimePeriod] = useState("today");
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
          if (sale.route) routeSet.add(sale.route);
        });
        const uniqueRoutes = Array.from(routeSet).filter(route => route && route.trim() !== '');
        setRoutes(["All", ...uniqueRoutes]);

        setLoading(false);
      } catch (error) {
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

  // Stats calculations
  const totalSaleAmount = filteredData.reduce((sum, sale) => {
    const price = Number(sale.customPrice || sale.productPrice || 0);
    const qty = Number(sale.salesQuantity || 0);
    return sum + price * qty;
  }, 0);

  const totalAmountReceived = filteredData.reduce((sum, sale) => sum + Number(sale.totalAmountReceived || 0), 0);
  const totalCreditedAmount = totalSaleAmount - totalAmountReceived;
  const totalBalance = customersData.reduce((sum, customer) => sum + Number(customer.currentBalance ?? 0), 0);
  const totalSalesQuantity = filteredData.reduce((sum, sale) => sum + Number(sale.salesQuantity || 0), 0);
  const totalEmptyQuantity = filteredData.reduce((sum, sale) => sum + Number(sale.emptyQuantity || 0), 0);
  const totalGasQuantity = customersData.reduce((sum, customer) => sum + Number(customer.currentGasOnHand || 0), 0);

  const fmt = (num) => Number(num).toLocaleString('en-IN', { minimumFractionDigits: 1, maximumFractionDigits: 1 });

  const salesVsReceivedPieData = [
    { name: "Sales ", value: totalSaleAmount },
    { name: "Received", value: totalAmountReceived }
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
      {/* Header: Filters and Quick Stats */}
      <div className="dashboard-header" style={{ gap: 32 }}>
        {/* Filters Section */}
        <div
          className="filters-container"
          style={{
            background: "linear-gradient(135deg, #283593 60%, #1976d2 100%)",
            border: "2px solid #ffd700",
            boxShadow: "0 4px 24px rgba(25, 118, 210, 0.15), 0 1.5px 8px #ffd70033",
            color: "#fff",
            padding: "28px 24px",
            borderRadius: "18px",
            position: "relative",
            overflow: "visible",
            zIndex:100,
            minWidth: 320,
            minHeight: 320,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center"
          }}
        >
          <div style={{
            position: "absolute",
            top: "-40px",
            right: "-40px",
            width: "120px",
            height: "120px",
            // background: "radial-gradient(circle, #ffd70055 0%, transparent 70%)",
            zIndex: 0,
            pointerEvents: "none"
          }} />
          <div style={{ position: "relative", zIndex: 1 }}>
            <Typography variant="h6" gutterBottom style={{ color: "#fff" }}>Filters</Typography>
            <Divider sx={{ mb: 2, bgcolor: "rgba(255,255,255,0.3)" }} />
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel style={{ color: "#fff" }}>Time Period</InputLabel>
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
                sx={{
                  color: "#fff",
                  ".MuiOutlinedInput-notchedOutline": { borderColor: "#ffd700" },
                  "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "#ffd700" },
                  background: "rgba(255,255,255,0.08)",
                  borderRadius: "8px"
                }}
                MenuProps={{
                  PaperProps: {
                    style: { background: "#283593", color: "#fff" }
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
                  minDate={new Date(2020, 0, 1)}
                  maxDate={endDate || new Date()}
                  style={{
                    background: "rgba(255,255,255,0.08)",
                    color: "#fff",
                    border: "1px solid #ffd700"
                  }}
                />
                <Typography variant="body1" style={{ color: "#fff" }}>to</Typography>
                <DatePicker
                  selected={endDate}
                  onChange={(date) => setEndDate(date)}
                  selectsEnd
                  startDate={startDate}
                  endDate={endDate}
                  minDate={startDate}
                  maxDate={new Date()}
                  placeholderText="End Date"
                  className="custom-datepicker"
                  showMonthDropdown
                  showYearDropdown
                  dropdownMode="select"
                  style={{
                    background: "rgba(255,255,255,0.08)",
                    color: "#fff",
                    border: "1px solid #ffd700"
                  }}
                />
              </Box>
            )}

            <ButtonGroup variant="outlined" sx={{ mt: 2 }}>
              <ActionButton onClick={() => navigate('/all-sales')}>Sales Report</ActionButton>
              <ActionButton onClick={() => navigate('/all-customers')}>Customers</ActionButton>
            </ButtonGroup>
          </div>
        </div>

        {/* Quick Stats */}
        <PremiumCard>
          <Typography variant="h6" gutterBottom>Quick Stats</Typography>
          <Divider sx={{ bgcolor: 'rgba(255, 255, 255, 0.2)', mb: 2 }} />
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2 }}>
            <div>
              <Typography variant="body2">Total Sale Amount</Typography>
              <Typography variant="h5">₹{fmt(totalSaleAmount)}</Typography>
            </div>
            <div>
              <Typography variant="body2">Amount Received</Typography>
              <Typography variant="h5">₹{fmt(totalAmountReceived)}</Typography>
            </div>
            <div>
              <Typography variant="body2">Credited Amount</Typography>
              <Typography variant="h5">₹{fmt(totalCreditedAmount)}</Typography>
            </div>
            <div>
              <Typography variant="body2">Total Balance</Typography>
              <Typography variant="h5">₹{fmt(totalBalance)}</Typography>
            </div>
          </Box>
        </PremiumCard>
      </div>

      {/* Main Content Area */}
      <div className="dashboard-content">
        <div className="analytics-container" style={{ display: "flex", gap: 32, flexWrap: "wrap" }}>
          {/* Pie Chart */}
          <PremiumCard style={{ flex: 2, minWidth: 340, boxShadow: "0 8px 32px rgba(40,53,147,0.18)", border: "1.5px solid #ffd700" }}>
            <Typography variant="h6" gutterBottom style={{ letterSpacing: 1, fontWeight: 600 }}>
              Sales Analytics
            </Typography>
            <Divider sx={{ bgcolor: 'rgba(255, 255, 255, 0.2)', mb: 3 }} />
            <ResponsiveContainer width="100%" height={340}>
              <PieChart>
                <Pie
                  data={salesVsReceivedPieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={110}
                  innerRadius={60}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, value, percent }) =>
                    `${name}: ₹${Number(value).toLocaleString('en-IN', { maximumFractionDigits: 1 })} (${(percent * 100).toFixed(1)}%)`
                  }
                  stroke="#fff"
                  strokeWidth={2}
                >
                  {salesVsReceivedPieData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={index === 0 ? "#FFD700" : "#4FC3F7"}
                      stroke={index === 0 ? "#bfa100" : "#1976d2"}
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={value => [`₹${Number(value).toLocaleString('en-IN', { maximumFractionDigits: 1 })}`, 'Amount']}
                  contentStyle={{
                    background: '#222b5a',
                    borderColor: '#ffd700',
                    borderRadius: '10px',
                    color: '#fff',
                    fontWeight: 500
                  }}
                />
                <Legend
                  verticalAlign="bottom"
                  iconType="circle"
                  wrapperStyle={{
                    color: "#fff",
                    fontWeight: 500,
                    fontSize: 15,
                    marginTop: 12
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </PremiumCard>

          {/* Summary Cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px', flex: 1, minWidth: 220 }}>
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