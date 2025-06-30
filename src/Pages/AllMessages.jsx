import React, { useState, useEffect } from 'react';
import { db } from '../Firebase/config';
import { collection, getDocs, orderBy, query, doc, updateDoc } from 'firebase/firestore';
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
  TablePagination,
  Chip,
  Avatar,
  IconButton,
  Tooltip,
  TextField,
  Button,
  Menu,
  MenuItem,
  InputAdornment,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Checkbox
} from '@mui/material';
import { 
  Mail as MailIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  MarkEmailRead as MarkEmailReadIcon,
  Search as SearchIcon,
  FilterList as FilterListIcon,
  FileDownload as FileDownloadIcon,
  CalendarToday as CalendarIcon
} from '@mui/icons-material';
import * as XLSX from 'xlsx';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

function AllMessages() {
  const [messages, setMessages] = useState([]);
  const [filteredMessages, setFilteredMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAnchorEl, setFilterAnchorEl] = useState(null);
  const [dateFilter, setDateFilter] = useState({
    startDate: null,
    endDate: null
  });
  const [statusFilter, setStatusFilter] = useState('all');
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [exportColumns, setExportColumns] = useState({
    customerName: true,
    customerId: true,
    message: true,
    createdAt: true,
    status: true
  });
  

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const messagesRef = collection(db, 'messages');
        const q = query(messagesRef, orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);
        
        const messagesData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date(),
          customerName: doc.data().customerName || 'Unknown Customer',
          customerId: doc.data().customerId || 'N/A',
          formattedDate: doc.data().createdAt?.toDate()?.toLocaleString() || 'N/A'
        }));
        
        setMessages(messagesData);
        setFilteredMessages(messagesData);
      } catch (err) {
        console.error('Error fetching messages:', err);
        setError('Failed to load message data');
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [searchTerm, dateFilter, statusFilter, messages]);

  const applyFilters = () => {
    let result = [...messages];

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(message => 
        message.customerName.toLowerCase().includes(term) || 
        message.customerId.toLowerCase().includes(term)
      );
    }

    // Apply date filter
    if (dateFilter.startDate || dateFilter.endDate) {
      result = result.filter(message => {
        const messageDate = new Date(message.createdAt);
        const startDate = dateFilter.startDate ? new Date(dateFilter.startDate) : null;
        const endDate = dateFilter.endDate ? new Date(dateFilter.endDate) : null;

        if (startDate) startDate.setHours(0, 0, 0, 0);
        if (endDate) endDate.setHours(23, 59, 59, 999);

        if (startDate && endDate) {
          return messageDate >= startDate && messageDate <= endDate;
        } else if (startDate) {
          return messageDate >= startDate;
        } else if (endDate) {
          return messageDate <= endDate;
        }
        return true;
      });
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      result = result.filter(message => 
        statusFilter === 'read' ? message.isRead : !message.isRead
      );
    }

    setFilteredMessages(result);
    setPage(0); // Reset to first page when filters change
  };

  const handleMarkAsRead = async (messageId) => {
    try {
      const messageRef = doc(db, 'messages', messageId);
      await updateDoc(messageRef, { isRead: true });

      setMessages(messages.map(message => 
        message.id === messageId ? { ...message, isRead: true } : message
      ));
    } catch (err) {
      console.error('Error updating message status:', err);
      setError('Failed to update message status');
    }
  };

  const handleFilterMenuOpen = (event) => {
    setFilterAnchorEl(event.currentTarget);
  };

  const handleFilterMenuClose = () => {
    setFilterAnchorEl(null);
  };

  const handleDateChange = (date, type) => {
    setDateFilter(prev => ({ ...prev, [type]: date }));
  };

  const handleStatusFilterChange = (status) => {
    setStatusFilter(status);
    handleFilterMenuClose();
  };

  const handleExportToExcel = () => {
    const dataToExport = filteredMessages.map(message => {
      const row = {};
      if (exportColumns.customerName) row['Customer Name'] = message.customerName;
      if (exportColumns.customerId) row['Customer ID'] = message.customerId;
      if (exportColumns.message) row['Message'] = message.message;
      if (exportColumns.createdAt) row['Date'] = message.formattedDate;
      if (exportColumns.status) row['Status'] = message.isRead ? 'Read' : 'Unread';
      return row;
    });

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Messages');
    XLSX.writeFile(workbook, 'messages_export.xlsx');
    setExportDialogOpen(false);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const resetFilters = () => {
    setSearchTerm('');
    setDateFilter({ startDate: null, endDate: null });
    setStatusFilter('all');
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

  const emptyRows =
    page > 0 ? Math.max(0, (1 + page) * rowsPerPage - filteredMessages.length) : 0;

  return (
    <div style={{ padding: '20px' }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <MailIcon fontSize="large" /> All Messages
        </Typography>
        <Box display="flex" gap={2}>
          <Button
            variant="contained"
            color="primary"
            startIcon={<FileDownloadIcon />}
            onClick={() => setExportDialogOpen(true)}
          >
            Export
          </Button>
        </Box>
      </Box>

      <Box display="flex" gap={2} mb={3} flexWrap="wrap">
        <TextField
          variant="outlined"
          size="small"
          placeholder="Search by name or ID..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          sx={{ minWidth: 250 }}
        />

        <Button
          variant="outlined"
          startIcon={<FilterListIcon />}
          onClick={handleFilterMenuOpen}
        >
          Filters
        </Button>

        <Menu
          anchorEl={filterAnchorEl}
          open={Boolean(filterAnchorEl)}
          onClose={handleFilterMenuClose}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'left',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'left',
          }}
        >
          <MenuItem disabled>Status</MenuItem>
          <MenuItem onClick={() => handleStatusFilterChange('all')} selected={statusFilter === 'all'}>
            All Messages
          </MenuItem>
          <MenuItem onClick={() => handleStatusFilterChange('read')} selected={statusFilter === 'read'}>
            Read Only
          </MenuItem>
          <MenuItem onClick={() => handleStatusFilterChange('unread')} selected={statusFilter === 'unread'}>
            Unread Only
          </MenuItem>
          <MenuItem disabled>Date Range</MenuItem>
          <Box px={2} py={1} width={250}>
            <Box mb={1}>
              <Typography variant="subtitle2">Start Date</Typography>
              <DatePicker
                selected={dateFilter.startDate}
                onChange={(date) => handleDateChange(date, 'startDate')}
                selectsStart
                startDate={dateFilter.startDate}
                endDate={dateFilter.endDate}
                customInput={
                  <TextField
                    size="small"
                    fullWidth
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <CalendarIcon fontSize="small" />
                        </InputAdornment>
                      ),
                    }}
                  />
                }
              />
            </Box>
            <Box>
              <Typography variant="subtitle2">End Date</Typography>
              <DatePicker
                selected={dateFilter.endDate}
                onChange={(date) => handleDateChange(date, 'endDate')}
                selectsEnd
                startDate={dateFilter.startDate}
                endDate={dateFilter.endDate}
                minDate={dateFilter.startDate}
                customInput={
                  <TextField
                    size="small"
                    fullWidth
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <CalendarIcon fontSize="small" />
                        </InputAdornment>
                      ),
                    }}
                  />
                }
              />
            </Box>
          </Box>
          <MenuItem onClick={resetFilters} sx={{ color: 'primary.main' }}>
            Clear All Filters
          </MenuItem>
        </Menu>

        {(searchTerm || dateFilter.startDate || dateFilter.endDate || statusFilter !== 'all') && (
          <Chip
            label="Clear Filters"
            onClick={resetFilters}
            color="primary"
            variant="outlined"
          />
        )}
      </Box>

      <TableContainer component={Paper} elevation={3}>
        <Table sx={{ minWidth: 650 }} aria-label="messages table">
          <TableHead>
            <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
              <TableCell><strong>Customer</strong></TableCell>
              <TableCell><strong>Customer ID</strong></TableCell>
              <TableCell><strong>Message</strong></TableCell>
              <TableCell><strong>Date</strong></TableCell>
              <TableCell><strong>Status</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredMessages.length > 0 ? (
              filteredMessages
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((message) => (
                  <TableRow key={message.id} hover>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={2}>
                        <Avatar sx={{ bgcolor: '#1976d2' }}>
                          {message.customerName.charAt(0)}
                        </Avatar>
                        {message.customerName}
                      </Box>
                    </TableCell>
                    <TableCell>{message.customerId}</TableCell>
                    <TableCell sx={{ maxWidth: '300px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {message.message}
                    </TableCell>
                    <TableCell>{message.formattedDate}</TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Chip
                          icon={message.isRead ? <CheckCircleIcon /> : <CancelIcon />}
                          label={message.isRead ? 'Read' : 'Unread'}
                          color={message.isRead ? 'success' : 'warning'}
                          size="small"
                        />
                        {!message.isRead && (
                          <Tooltip title="Mark as read">
                            <IconButton 
                              size="small" 
                              color="primary"
                              onClick={() => handleMarkAsRead(message.id)}
                            >
                              <MarkEmailReadIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  No messages found matching your criteria
                </TableCell>
              </TableRow>
            )}
            {emptyRows > 0 && (
              <TableRow style={{ height: 53 * emptyRows }}>
                <TableCell colSpan={5} />
              </TableRow>
            )}
          </TableBody>
        </Table>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={filteredMessages.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </TableContainer>

      {/* Export Dialog */}
      <Dialog open={exportDialogOpen} onClose={() => setExportDialogOpen(false)}>
        <DialogTitle>Export to Excel</DialogTitle>
        <DialogContent>
          <Typography variant="subtitle1" gutterBottom>
            Select columns to export:
          </Typography>
          <Box display="flex" flexDirection="column">
            {Object.keys(exportColumns).map((key) => (
              <Box key={key} display="flex" alignItems="center" mb={1}>
                <Checkbox
                  checked={exportColumns[key]}
                  onChange={() => setExportColumns(prev => ({
                    ...prev,
                    [key]: !prev[key]
                  }))}
                />
                <Typography>
                  {key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}
                </Typography>
              </Box>
            ))}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setExportDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleExportToExcel} color="primary" variant="contained">
            Export
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}

export default AllMessages;