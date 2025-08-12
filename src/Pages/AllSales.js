import React, { useState, useEffect } from "react";
import { db } from "../Firebase/config";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { Container, Table, Button, Alert, Form, Row, Col, Card, Pagination } from "react-bootstrap";
import { format } from 'date-fns';
import * as XLSX from 'xlsx';
import { Box } from '@mui/material';

const AllSales = () => {
  const [sales, setSales] = useState([]);
  const [filteredSales, setFilteredSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [routeFilter, setRouteFilter] = useState("");
  const [productFilter, setProductFilter] = useState("");
  const [uniqueRoutes, setUniqueRoutes] = useState([]);
  const [uniqueProducts, setUniqueProducts] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(50);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSales = async () => {
      try {
        const q = query(collection(db, "sales"), orderBy("timestamp", "desc"));
        const querySnapshot = await getDocs(q);
        const salesData = querySnapshot.docs.map(doc => ({
          firebaseId: doc.id,
          ...doc.data(),
          date: doc.data().timestamp?.toDate() || new Date(),
          formattedDate: format(doc.data().timestamp?.toDate() || new Date(), 'dd MMM yyyy')
        }));
        
        setSales(salesData);
        setFilteredSales(salesData);
        
        // Extract unique routes and products for filters
        const routes = [...new Set(salesData.map(sale => sale.routeName))].filter(Boolean);
        const products = [...new Set(salesData.map(sale => sale.productName))].filter(Boolean);
        
        setUniqueRoutes(routes);
        setUniqueProducts(products);
      } catch (err) {
        console.error("Error fetching sales: ", err);
        setError("Failed to load sales. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchSales();
  }, []);

  useEffect(() => {
    let results = sales;
    
    // Text search filter
    if (searchTerm) {
      results = results.filter(sale =>
        sale.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sale.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sale.productName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sale.customerPhone?.toLowerCase().includes(searchTerm.toLowerCase()))
    }
    
    // Date range filter
    if (startDate && endDate) {
      results = results.filter(sale => {
        const saleDate = format(sale.date, 'yyyy-MM-dd');
        return saleDate >= startDate && saleDate <= endDate;
      });
    }
    
    // Route filter
    if (routeFilter) {
      results = results.filter(sale => sale.routeName === routeFilter);
    }
    
    // Product filter
    if (productFilter) {
      results = results.filter(sale => sale.productName === productFilter);
    }
    
    setFilteredSales(results);
    setCurrentPage(1); // Reset to first page when filters change
  }, [searchTerm, startDate, endDate, routeFilter, productFilter, sales]);

  // Calculate summary statistics
  const calculateSummary = () => {
    return filteredSales.reduce((acc, sale) => {
      const price = Number(sale.customPrice || sale.productPrice || 0);
      const qty = Number(sale.salesQuantity || 0);
      const saleAmount = price * qty;
      acc.totalSalesAmount += saleAmount;
      acc.totalReceived += Number(sale.totalAmountReceived) || 0;
      acc.totalBalance += Number(sale.totalBalance) || 0;
      acc.totalQuantity += qty;
      acc.totalEmptyQuantity += Number(sale.emptyQuantity) || 0;
      return acc;
    }, {
      totalSalesAmount: 0,
      totalReceived: 0,
      totalBalance: 0,
      totalQuantity: 0,
      totalEmptyQuantity: 0,
      totalDocuments: filteredSales.length
    });
  };

  const summary = calculateSummary();

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredSales.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredSales.length / itemsPerPage);

  const handleViewDetails = (firebaseId) => {
    navigate(`/sales/${firebaseId}`);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 1,
      maximumFractionDigits: 1
    }).format(amount || 0);
  };

  const resetFilters = () => {
    setSearchTerm("");
    setStartDate("");
    setEndDate("");
    setRouteFilter("");
    setProductFilter("");
  };

  const exportToExcel = () => {
    // Prepare data for export with all fields
    const exportData = filteredSales.map(sale => ({
      'Sale ID': sale.id,
      'Date': sale.formattedDate,
      'Customer ID': sale.customerId,
      'Customer Name': sale.customerName,
      'Customer Phone': sale.customerPhone,
      'Route': sale.routeName,
      'Product ID': sale.productId,
      'Product Name': sale.productName,
      'Product Price': sale.productPrice,
      'Sales Quantity': sale.salesQuantity,
      'Empty Quantity': sale.emptyQuantity,
      'Today Credit': sale.todayCredit,
      'Total Amount Received': sale.totalAmountReceived,
      'Total Balance': sale.totalBalance,
      'Previous Balance': sale.previousBalance,
      'Customer Address': sale.customerData?.address || sale.customerAddress,
      'Organization': sale.customerData?.organization,
      'Owner Name': sale.customerData?.ownerName,
      'Owner Phone': sale.customerData?.ownerPhone,
      'Current Gas On Hand': sale.customerData?.currentGasOnHand,
      'Timestamp': format(sale.date, 'yyyy-MM-dd HH:mm:ss')
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sales Data");
    XLSX.writeFile(workbook, `Sales_Data_${format(new Date(), 'yyyyMMdd_HHmmss')}.xlsx`);
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
      <Container className="mt-4">
        <Alert variant="danger">{error}</Alert>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Sales History ({summary.totalDocuments})</h2>
        <Button variant="success" onClick={exportToExcel}>
          Export to Excel
        </Button>
      </div>

      {/* Summary Cards */}
      <Row className="">
        <Col md={4}>
          <Card className="text-white bg-primary mb-3">
            <Card.Body>
              <Card.Title>Sales Amount</Card.Title>
              <Card.Text>{formatCurrency(summary.totalSalesAmount)}</Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="text-white bg-success mb-3">
            <Card.Body>
              <Card.Title>Total Received</Card.Title>
              <Card.Text>{formatCurrency(summary.totalReceived)}</Card.Text>
            </Card.Body>
          </Card>
        </Col>

        <Col md={4}>
          <Card className={`text-white ${summary.totalBalance > 0 ? 'bg-warning' : 'bg-warning'} mb-3`}>
            <Card.Body>
              <Card.Title>Total Balance</Card.Title>
              <Card.Text>{formatCurrency((summary.totalSalesAmount)-(summary.totalReceived))}</Card.Text>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      <Row className="mb-2">
         <Col md={6}>
          <Card className="text-white bg-secondary mb-3">
            <Card.Body>
              <Card.Title>Total Quantity</Card.Title>
              <Card.Text>{summary.totalQuantity}</Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col md={6}>
          <Card className="text-white bg-dark mb-3">
            <Card.Body>
              <Card.Title>Empty Quantity</Card.Title>
              <Card.Text>{summary.totalEmptyQuantity}</Card.Text>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Filters */}
      <Row className="mb-4">
        <Col md={3}>
          <Form.Group controlId="search">
            <Form.Label>Search</Form.Label>
            <Form.Control
              type="text"
              placeholder="Search customer, product, ID or phone"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </Form.Group>
        </Col>
        <Col md={2}>
          <Form.Group controlId="startDate">
            <Form.Label>From</Form.Label>
            <Form.Control
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </Form.Group>
        </Col>
        <Col md={2}>
          <Form.Group controlId="endDate">
            <Form.Label>To</Form.Label>
            <Form.Control
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </Form.Group>
        </Col>
        <Col md={2}>
          <Form.Group controlId="routeFilter">
            <Form.Label>Route</Form.Label>
            <Form.Control
              as="select"
              value={routeFilter}
              onChange={(e) => setRouteFilter(e.target.value)}
            >
              <option value="">All Routes</option>
              {uniqueRoutes.map(route => (
                <option key={route} value={route}>{route}</option>
              ))}
            </Form.Control>
          </Form.Group>
        </Col>
        <Col md={2}>
          <Form.Group controlId="productFilter">
            <Form.Label>Product</Form.Label>
            <Form.Control
              as="select"
              value={productFilter}
              onChange={(e) => setProductFilter(e.target.value)}
            >
              <option value="">All Products</option>
              {uniqueProducts.map(product => (
                <option key={product} value={product}>{product}</option>
              ))}
            </Form.Control>
          </Form.Group>
        </Col>
        <Col md={1} className="d-flex align-items-end">
          <Button 
            variant="outline-secondary"
            onClick={resetFilters}
            className="w-100 me-4"
          >
            Clear
          </Button>
        </Col>
      </Row>

      {filteredSales.length === 0 ? (
        <Alert variant="info">No sales found matching your criteria</Alert>
      ) : (
        <>
          <div className="table-responsive mb-3">
            <Table striped bordered hover className="shadow-sm">
              <thead className="bg-primary text-white">
                <tr>
                  <th>Date</th>
                  <th>Customer</th>
                  <th>Phone</th>
                  <th>Route</th>
                  <th>Product Price</th>
                  <th>Sale Qty</th>
                  <th>Empty Qty</th>
                  <th>WOUT GST</th>
                  <th>Credit</th>
                  <th>Received</th>
                  <th>Balance</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentItems.map((sale) => (
                  <tr key={sale.firebaseId}>
                    <td>{sale.formattedDate}</td>
                    <td>{sale.customerName || 'N/A'}</td>
                    <td>{sale.customerPhone || 'N/A'}</td>
                    <td>{sale.routeName || 'N/A'}</td>
                    <td>{formatCurrency(sale.productPrice) || 'N/A'}</td>
                    <td>{sale.salesQuantity}</td>
                    <td>{sale.emptyQuantity}</td>
                    <td>{formatCurrency(sale.productPrice / 1.18)}</td>
                    <td>{formatCurrency(sale.todayCredit)}</td>
                    <td>{formatCurrency(sale.totalAmountReceived)}</td>
                    <td className={sale.totalBalance > 0 ? 'text-danger' : 'text-success'}>
                      {formatCurrency(sale.totalBalance)}
                    </td>
                    <td>
                      <Button 
                        variant="outline-primary"
                        size="sm"
                        onClick={() => handleViewDetails(sale.firebaseId)}
                      >
                        Details
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="d-flex justify-content-between align-items-center">
            <div>
              Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredSales.length)} of {filteredSales.length} entries
            </div>
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
        </>
      )}
    </Container>
  );
};

export default AllSales;