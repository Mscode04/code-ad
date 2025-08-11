import React, { useState, useEffect } from "react";
import { db } from "../Firebase/config";
import { collection, getDocs } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { Box } from '@mui/material';
import { Container, Table, Button, Alert, Form, Row, Col, Pagination, Badge } from "react-bootstrap";
import * as XLSX from 'xlsx';

const AllCustomers = () => {
  const [customers, setCustomers] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);

  // Filter and search state
  const [routeFilter, setRouteFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [routes, setRoutes] = useState([]);

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "customers"));
        const customersData = querySnapshot.docs.map(doc => ({
          firebaseId: doc.id,
          ...doc.data()
        }));
        
        setCustomers(customersData);
        setFilteredCustomers(customersData);
        
        // Extract unique routes for filter dropdown
        const uniqueRoutes = [...new Set(customersData.map(c => c.route))].filter(r => r);
        setRoutes(uniqueRoutes);
      } catch (err) {
        console.error("Error fetching customers: ", err);
        setError("Failed to load customers. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchCustomers();
  }, []);

  // Apply filters and search
  useEffect(() => {
    let result = [...customers];
    
    // Apply route filter
    if (routeFilter) {
      result = result.filter(customer => customer.route === routeFilter);
    }
    
    // Apply search
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(customer => 
        (customer.name && customer.name.toLowerCase().includes(term)) ||
        (customer.phone && customer.phone.includes(term)) ||
        (customer.ownerName && customer.ownerName.toLowerCase().includes(term)) ||
        (customer.ownerPhone && customer.ownerPhone.includes(term))
      );
    }
    
    setFilteredCustomers(result);
    setCurrentPage(1); // Reset to first page when filters change
  }, [customers, routeFilter, searchTerm]);

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredCustomers.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage);

  const handleViewDetails = (firebaseId) => {
    navigate(`/customer/${firebaseId}`);
  };

  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(filteredCustomers);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Customers");
    XLSX.writeFile(workbook, "customers.xlsx");
  };

  // Calculate totals
  const totalCustomers = filteredCustomers.length;
  const totalGasOnHand = filteredCustomers.reduce((sum, customer) => sum + (customer.currentGasOnHand || 0), 0);
  const totalBalance = filteredCustomers.reduce(
    (sum, customer) => sum + Number(customer.currentBalance ?? 0),
    0
  );

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
      <Container className="mt-4">
        <Alert variant="danger">{error}</Alert>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>All Customers</h2>
        <Button 
          variant="primary"
          onClick={() => navigate("/new-connection")}
        >
          Add New Customer
        </Button>
      </div>

      {/* Filters and Search */}
      <div className="mb-4 p-3 bg-light rounded shadow-sm">
        <Row>
          <Col md={4}>
            <Form.Group controlId="routeFilter">
              <Form.Label>Filter by Route</Form.Label>
              <Form.Control
                as="select"
                value={routeFilter}
                onChange={(e) => setRouteFilter(e.target.value)}
              >
                <option value="">All Routes</option>
                {routes.map((route, index) => (
                  <option key={index} value={route}>{route}</option>
                ))}
              </Form.Control>
            </Form.Group>
          </Col>
          <Col md={6}>
            <Form.Group controlId="search">
              <Form.Label>Search</Form.Label>
              <Form.Control
                type="text"
                placeholder="Search by name, phone, owner name, or owner phone"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </Form.Group>
          </Col>
          <Col md={2} className="d-flex align-items-end">
            <Button variant="success" onClick={exportToExcel}>
              Export
            </Button>
          </Col>
        </Row>
      </div>

      {/* Summary Cards */}
      <Row className="mb-4">
        <Col md={4}>
          <div className="p-3 bg-info rounded shadow-sm">
            <h5>Total Customers</h5>
            <h3><Badge bg="" text="dark">{totalCustomers}</Badge></h3>
          </div>
        </Col>
        <Col md={4}>
          <div className="p-3 bg-warning rounded shadow-sm">
            <h5>Total Gas On Hand</h5>
            <h3><Badge bg="" text="dark">{totalGasOnHand.toLocaleString('en-IN')} kg</Badge></h3>
          </div>
        </Col>
        <Col md={4}>
          <div className="p-3 bg-danger rounded shadow-sm">
            <h5 className="text-light">Total Balance</h5>
<h3>
  <Badge bg="">
    ₹{totalBalance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
  </Badge>
</h3>
          </div>
        </Col>
      </Row>

      {/* Customers Table */}
      <div className="table-responsive mb-4">
        <Table striped bordered hover className="shadow-sm">
          <thead className="bg-primary text-white">
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Organization</th>
              <th>Phone</th>
              <th>Route</th>
              <th>Current Balance</th>
              <th>Gas On Hand</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentItems.length > 0 ? (
              currentItems.map((customer) => (
                <tr key={customer.firebaseId}>
                  <td>{customer.id || '-'}</td>
                  <td>{customer.name}</td>
                  <td>{customer.organization || '-'}</td>
                  <td>{customer.phone}</td>
                  <td>{customer.route || '-'}</td>
                  <td>₹{customer.currentBalance?.toLocaleString('en-IN') || '0'}</td>
                  <td>{customer.currentGasOnHand?.toLocaleString('en-IN') || '0'} kg</td>
                  <td>
                    <Button 
                      variant="outline-primary"
                      size="sm"
                      onClick={() => handleViewDetails(customer.firebaseId)}
                    >
                      View
                    </Button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="8" className="text-center">No customers found</td>
              </tr>
            )}
          </tbody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="d-flex justify-content-center">
          <Pagination>
            <Pagination.First onClick={() => setCurrentPage(1)} disabled={currentPage === 1} />
            <Pagination.Prev onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} />
            
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }
              
              return (
                <Pagination.Item 
                  key={pageNum}
                  active={pageNum === currentPage}
                  onClick={() => setCurrentPage(pageNum)}
                >
                  {pageNum}
                </Pagination.Item>
              );
            })}
            
            <Pagination.Next onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} />
            <Pagination.Last onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages} />
          </Pagination>
        </div>
      )}

      {/* Showing X of Y entries */}
      <div className="text-muted mt-2">
        Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredCustomers.length)} of {filteredCustomers.length} entries
        {routeFilter && ` (filtered by route: ${routeFilter})`}
        {searchTerm && ` (searched for: "${searchTerm}")`}
      </div>
    </Container>
  );
};

export default AllCustomers;