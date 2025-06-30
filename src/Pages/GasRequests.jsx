import React, { useState, useEffect } from 'react';
import { db } from '../Firebase/config';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Paper, 
  Typography,
  Box,
} from '@mui/material';

function GasRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const requestsRef = collection(db, 'gasRequests');
        const q = query(requestsRef, orderBy('timestamp', 'desc'));
        const querySnapshot = await getDocs(q);
        
        const requestsData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          // Convert Firestore timestamp to readable date
          timestamp: doc.data().timestamp?.toDate()?.toLocaleString() || 'N/A',
          deliveryDate: doc.data().deliveryDate || 'N/A'
        }));
        
        setRequests(requestsData);
      } catch (err) {
        console.error('Error fetching gas requests:', err);
        setError('Failed to load request data');
      } finally {
        setLoading(false);
      }
    };

    fetchRequests();
  }, []);

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
      <Typography color="error" align="center" mt={4}>
        {error}
      </Typography>
    );
  }

  return (
    <div style={{ padding: '20px' }}>
      <Typography variant="h4" gutterBottom>
        Gas Delivery Requests
      </Typography>
      
      <TableContainer component={Paper}>
        <Table sx={{ minWidth: 650 }} aria-label="gas requests table">
          <TableHead>
            <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
              <TableCell><strong>Name</strong></TableCell>
              <TableCell><strong>Phone</strong></TableCell>
              <TableCell><strong>Address</strong></TableCell>
              <TableCell><strong>Gas Type</strong></TableCell>
              <TableCell><strong>Quantity</strong></TableCell>
              <TableCell><strong>Delivery Date</strong></TableCell>
              <TableCell><strong>Special Instructions</strong></TableCell>
              <TableCell><strong>Request Time</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {requests.length > 0 ? (
              requests.map((request) => (
                <TableRow key={request.id} hover>
                  <TableCell>{request.name}</TableCell>
                  <TableCell>{request.phone}</TableCell>
                  <TableCell>{request.address}</TableCell>
                  <TableCell>{request.gasType}</TableCell>
                  <TableCell>{request.quantity}</TableCell>
                  <TableCell>{request.deliveryDate}</TableCell>
                  <TableCell>{request.specialInstructions || 'None'}</TableCell>
                  <TableCell>{request.timestamp}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  No gas request data available
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </div>
  );
}

export default GasRequests;