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
  Card, 
  CardContent,
  Typography,
  Divider,
  Button,
  ButtonGroup
} from '@mui/material';
import { styled } from '@mui/system';

const PremiumCard = styled(Card)(({ theme }) => ({
  background: 'linear-gradient(145deg, #1a237e, #283593)',
  color: 'white',
  borderRadius: '12px',
  boxShadow: '0 8px 16px rgba(0, 0, 0, 0.2)',
  transition: 'transform 0.3s ease-in-out',
  '&:hover': {
    transform: 'translateY(-5px)'
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
    <div className="dashboard-container" style={{ background: '#f5f7fa', padding: '24px' }}>
      {/* Filters Section */}
      <PremiumCard sx={{ mb: 4, p: 3 }}>
        <Box sx={{ 
          display: 'flex', 
          flexWrap: 'wrap', 
          gap: 3,
          alignItems: 'center'
        }}>
          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel id="time-period-label" sx={{ color: 'white' }}>Time Period</InputLabel>
            <Select
              labelId="time-period-label"
              id="time-period-select"
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
                color: 'white',
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'rgba(255, 255, 255, 0.5)',
                },
                '& .MuiSvgIcon-root': {
                  color: 'white',
                },
              }}
              MenuProps={{
                PaperProps: {
                  sx: {
                    bgcolor: '#1a237e',
                    color: 'white'
                  }
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
            <>
              <DatePicker
                selected={startDate}
                onChange={(date) => setStartDate(date)}
                selectsStart
                startDate={startDate}
                endDate={endDate}
                isClearable
                placeholderText="Start Date"
                className="custom-datepicker"
                wrapperClassName="premium-datepicker"
              />
              <DatePicker
                selected={endDate}
                onChange={(date) => setEndDate(date)}
                selectsEnd
                startDate={startDate}
                endDate={endDate}
                minDate={startDate}
                isClearable
                placeholderText="End Date"
                className="custom-datepicker"
                wrapperClassName="premium-datepicker"
              />
            </>
          )}

          <ButtonGroup variant="outlined" sx={{ ml: 'auto', gap: 1 }}>
            <ActionButton 
              onClick={() => navigate('/sales')}
              className={activeView === "new-sales" ? "active" : ""}
            >
              New Sales
            </ActionButton>
            <ActionButton 
              onClick={() => navigate('/all-sales')}
              className={activeView === "sales" ? "active" : ""}
            >
              Sales Report
            </ActionButton>
            <ActionButton 
              onClick={() => navigate('/all-customers')}
              className={activeView === "customers" ? "active" : ""}
            >
              Customers
            </ActionButton>
            <ActionButton 
              onClick={() => navigate('/products')}
              className={activeView === "products" ? "active" : ""}
            >
              Products
            </ActionButton>
          </ButtonGroup>
        </Box>
      </PremiumCard>

      {/* Main Chart Section */}
      <Box sx={{ display: 'flex', gap: 4, mb: 4 }}>
        <PremiumCard sx={{ flex: 1, p: 3 }}>
          <Typography variant="h6" gutterBottom sx={{ color: 'white' }}>
            Sales vs Amount Received
          </Typography>
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
              <Legend 
                wrapperStyle={{
                  paddingTop: '20px'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </PremiumCard>
      </Box>

      {/* Summary Cards Section */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 3 }}>
        <PremiumCard>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ color: 'white' }}>
              Total Sales Amount
            </Typography>
            <Typography variant="h4" sx={{ color: 'white' }}>
              ₹{totalSalesAmount.toLocaleString('en-IN')}
            </Typography>
          </CardContent>
        </PremiumCard>
        
        <PremiumCard>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ color: 'white' }}>
              Total Sales Quantity
            </Typography>
            <Typography variant="h4" sx={{ color: 'white' }}>
              {totalSalesQuantity}
            </Typography>
          </CardContent>
        </PremiumCard>
        
        <PremiumCard>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ color: 'white' }}>
              Total Empty Cylinders
            </Typography>
            <Typography variant="h4" sx={{ color: 'white' }}>
              {totalEmptyQuantity}
            </Typography>
          </CardContent>
        </PremiumCard>
        
        <PremiumCard>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ color: 'white' }}>
              Total Gas On Hand
            </Typography>
            <Typography variant="h4" sx={{ color: 'white' }}>
              {totalGasQuantity}
            </Typography>
          </CardContent>
        </PremiumCard>
        
        <PremiumCard>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ color: 'white' }}>
              Total Balance Due
            </Typography>
            <Typography variant="h4" sx={{ color: 'white' }}>
              ₹{totalBalance.toLocaleString('en-IN')}
            </Typography>
          </CardContent>
        </PremiumCard>
        
        <PremiumCard>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ color: 'white' }}>
              Total Amount Received
            </Typography>
            <Typography variant="h4" sx={{ color: 'white' }}>
              ₹{totalAmountReceived.toLocaleString('en-IN')}
            </Typography>
          </CardContent>
        </PremiumCard>
      </Box>
    </div>
  );
};

export default Dashboard;