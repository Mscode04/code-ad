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
  TablePagination
} from '@mui/material';

function Checkin() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const sessionsRef = collection(db, 'sessions');
        const q = query(sessionsRef, orderBy('loginTime', 'desc'));
        const querySnapshot = await getDocs(q);
        
        const sessionsData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          // Convert Firestore timestamps to readable dates
          loginTime: doc.data().loginTime?.toDate()?.toLocaleString() || 'N/A',
          logoutTime: doc.data().logoutTime?.toDate()?.toLocaleString() || 'Still logged in',
          date: doc.data().date || 'N/A'
        }));
        
        setSessions(sessionsData);
      } catch (err) {
        console.error('Error fetching sessions:', err);
        setError('Failed to load session data');
      } finally {
        setLoading(false);
      }
    };

    fetchSessions();
  }, []);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
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
      <Typography color="error" align="center" mt={4}>
        {error}
      </Typography>
    );
  }

  // Avoid a layout jump when reaching the last page with empty rows.
  const emptyRows =
    page > 0 ? Math.max(0, (1 + page) * rowsPerPage - sessions.length) : 0;

  return (
    <div style={{ padding: '20px' }}>
      <Typography variant="h4" gutterBottom>
        Session History
      </Typography>
      
      <TableContainer component={Paper}>
        <Table sx={{ minWidth: 650 }} aria-label="session table">
          <TableHead>
            <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
              <TableCell><strong>Route ID</strong></TableCell>
              <TableCell><strong>Route Name</strong></TableCell>
              <TableCell><strong>Login Time</strong></TableCell>
              <TableCell><strong>Logout Time</strong></TableCell>
              <TableCell><strong>Date</strong></TableCell>
              <TableCell><strong>Status</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sessions.length > 0 ? (
              sessions
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((session) => (
                  <TableRow key={session.id} hover>
                    <TableCell>{session.routeId}</TableCell>
                    <TableCell>{session.routeName}</TableCell>
                    <TableCell>{session.loginTime}</TableCell>
                    <TableCell>{session.logoutTime}</TableCell>
                    <TableCell>{session.date}</TableCell>
                    <TableCell>
                      {session.logoutTime === 'Still logged in' ? (
                        <span style={{ color: 'green', fontWeight: 'bold' }}>Active</span>
                      ) : (
                        <span style={{ color: 'gray' }}>Completed</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  No session data available
                </TableCell>
              </TableRow>
            )}
            {emptyRows > 0 && (
              <TableRow style={{ height: 53 * emptyRows }}>
                <TableCell colSpan={6} />
              </TableRow>
            )}
          </TableBody>
        </Table>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={sessions.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </TableContainer>
    </div>
  );
}

export default Checkin;