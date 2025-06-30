import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { db } from "../Firebase/config";
import { doc, getDoc, collection, query, where, getDocs, deleteDoc } from "firebase/firestore";
import { 
  Typography, 
  Paper, 
  Box, 
  Button,  
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  List,
  ListItem,
  ListItemText,
  Divider,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  TextField
} from "@mui/material";
import { format } from 'date-fns';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const CustomerProfile = () => {
  const { id, routeName } = useParams();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState(null);
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState('');

  useEffect(() => {
    const fetchCustomerData = async () => {
      try {
        // Fetch customer
        const customerDoc = await getDoc(doc(db, "customers", id));
        if (!customerDoc.exists()) {
          throw new Error("Customer not found");
        }
        setCustomer({ id: customerDoc.id, ...customerDoc.data() });
        
        // Fetch sales
        const salesQuery = query(
          collection(db, "sales"),
          where("customerId", "==", customerDoc.data().id),
        );
        const salesSnapshot = await getDocs(salesQuery);
        const salesData = salesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setSales(salesData);
        
        toast.success("Customer data loaded successfully");
      } catch (err) {
        console.error("Error fetching data:", err);
        setError(err.message);
        toast.error(`Error loading customer: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };
    
    fetchCustomerData();
  }, [id, routeName]);

  const handleDeleteCustomer = async () => {
    if (pin !== "1234") {
      setPinError("Invalid PIN");
      toast.error("Invalid PIN entered");
      return false;
    }

    try {
      // First delete all associated sales
      const salesQuery = query(
        collection(db, "sales"),
        where("customerId", "==", customer.id)
      );
      const salesSnapshot = await getDocs(salesQuery);
      
      // Delete each sale document
      const deletePromises = salesSnapshot.docs.map(saleDoc => 
        deleteDoc(doc(db, "sales", saleDoc.id))
      );
      await Promise.all(deletePromises);
      
      // Then delete the customer document
      await deleteDoc(doc(db, "customers", id));
      
      toast.success("Customer and all associated sales deleted successfully", {
        autoClose: 3000,
        onClose: () => navigate("/all-customers")
      });
      
      return true;
    } catch (err) {
      console.error("Error deleting customer:", err);
      toast.error(`Failed to delete customer: ${err.message}`);
      return false;
    }
  };

  const handleDeleteDialogClose = () => {
    setOpenDeleteDialog(false);
    setPin('');
    setPinError('');
  };

  const handleDeleteConfirm = async () => {
    const success = await handleDeleteCustomer();
    if (success) {
      handleDeleteDialogClose();
    }
  };

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


  if (error) {
    return (
      <Paper elevation={3} sx={{ p: 2, backgroundColor: 'error.light', color: 'white' }}>
        {error}
      </Paper>
    );
  }

  return (
    <Box>
      <ToastContainer 
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
      
      <Button 
        component={Link}
        to={`/all-customers`}
        variant="outlined"
        sx={{ mb: 2 }}
      >
        Back to Customers
      </Button>
      
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          {customer.name}'s Profile
        </Typography>
        
        <List>
          <ListItem>
            <ListItemText primary="Phone" secondary={customer.phone} />
          </ListItem>
          <Divider />
          <ListItem>
            <ListItemText primary="Address" secondary={customer.address} />
          </ListItem>
          <Divider />
          <ListItem>
            <ListItemText 
              primary="Current Balance" 
              secondary={`₹${customer.currentBalance?.toLocaleString() || '0'}`} 
            />
          </ListItem>
          <Divider />
          <ListItem>
            <ListItemText 
              primary="Gas On Hand" 
              secondary={customer.currentGasOnHand || '0'} 
            />
          </ListItem>
          <ListItem>
            <ListItemText 
              primary="password" 
              secondary={customer.password || '0'} 
            />
          </ListItem>
        </List>
        
        <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
          <Button 
            variant="contained"
            component={Link}
            to={`/customer-edit/${id}`}
          >
            Edit Profile
          </Button>
          <Button 
            variant="contained"
            color="error"
            onClick={() => setOpenDeleteDialog(true)}
          >
            Delete Profile
          </Button>
        </Box>
      </Paper>
      
      <Typography variant="h5" gutterBottom>
        Sales History
      </Typography>
      
      {sales.length > 0 ? (
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Date</TableCell>
              <TableCell>Sale ID</TableCell>
              <TableCell>Product</TableCell>
              <TableCell>Quantity</TableCell>
              <TableCell>Amount</TableCell>
              <TableCell>Received</TableCell>
              <TableCell>Balance</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sales.map(sale => (
              <TableRow key={sale.id}>
                <TableCell>{format(sale.timestamp?.toDate(), 'dd MMM yyyy')}</TableCell>
                <TableCell>{sale.id}</TableCell>
                <TableCell>{sale.productName}</TableCell>
                <TableCell>{sale.salesQuantity}</TableCell>
                <TableCell>₹{sale.todayCredit?.toLocaleString()}</TableCell>
                <TableCell>₹{sale.totalAmountReceived?.toLocaleString()}</TableCell>
                <TableCell>
                  <Chip 
                    label={`₹${sale.totalBalance?.toLocaleString()}`}
                    color={sale.totalBalance > 0 ? 'error' : 'success'}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <Typography variant="body1" sx={{ mt: 2 }}>
          No sales history found for this customer.
        </Typography>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={openDeleteDialog} onClose={handleDeleteDialogClose}>
        <DialogTitle>Delete Customer Profile</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this customer profile? This will also delete all associated sales records. 
            This action cannot be undone. Please enter PIN 1234 to confirm.
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            label="Enter PIN"
            type="password"
            fullWidth
            variant="standard"
            value={pin}
            onChange={(e) => {
              setPin(e.target.value);
              setPinError('');
            }}
            error={!!pinError}
            helperText={pinError}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteDialogClose}>Cancel</Button>
          <Button 
            onClick={handleDeleteConfirm}
            color="error"
          >
            Confirm Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CustomerProfile;