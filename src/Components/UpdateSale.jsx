import React, { useState, useEffect } from "react";
import { db } from "../Firebase/config";
import { doc, getDoc, updateDoc, collection, query, where, getDocs } from "firebase/firestore";
import { useNavigate, useParams } from "react-router-dom";
import { Container, Form, Button, Spinner, Alert, Row, Col, Card, Badge } from "react-bootstrap";
import { format } from 'date-fns';

const UpdateSale = () => {
  const { id } = useParams();
  const [sale, setSale] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch sale data
        const saleDoc = await getDoc(doc(db, "sales", id));
        if (!saleDoc.exists()) {
          throw new Error("Sale not found");
        }

        const saleData = saleDoc.data();
        setSale({
          ...saleData,
          firebaseId: saleDoc.id,
          date: saleData.timestamp?.toDate() || new Date(saleData.date || new Date()),
          customPrice: saleData.isCustomPrice ? saleData.productPrice : null
        });

        // Fetch all customers, products, routes
        const [customersSnap, productsSnap, routesSnap] = await Promise.all([
          getDocs(collection(db, "customers")),
          getDocs(collection(db, "products")),
          getDocs(collection(db, "routes"))
        ]);

        setCustomers(customersSnap.docs.map(d => ({ docId: d.id, ...d.data() })));
        setProducts(productsSnap.docs.map(d => ({ docId: d.id, ...d.data() })));
        setRoutes(routesSnap.docs.map(d => ({ docId: d.id, ...d.data() })));
      } catch (err) {
        console.error("Error fetching data:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setSale(prev => {
      const updatedSale = {
        ...prev,
        [name]: name === "salesQuantity" || name === "emptyQuantity" || name === "totalAmountReceived"
          ? parseInt(value) || 0
          : value
      };

      // Recalculate todayCredit if salesQuantity changes
      if (name === "salesQuantity") {
        const currentPrice = updatedSale.customPrice || updatedSale.baseProductPrice || updatedSale.productPrice;
        updatedSale.todayCredit = currentPrice * updatedSale.salesQuantity;
      }

      return updatedSale;
    });
  };

  const handleCustomPriceChange = (e) => {
    const { value } = e.target;
    const price = parseFloat(value) || 0;
    
    setSale(prev => {
      const updatedSale = {
        ...prev,
        customPrice: price > 0 ? price : null,
        todayCredit: price > 0 ? price * prev.salesQuantity : (prev.baseProductPrice || prev.productPrice) * prev.salesQuantity
      };
      
      return updatedSale;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // First get the original sale to calculate differences
      const originalSaleDoc = await getDoc(doc(db, "sales", id));
      const originalSale = originalSaleDoc.data();

      // Determine the actual price to use
      const actualPrice = sale.customPrice || sale.baseProductPrice || sale.productPrice;

      // Calculate differences
      const todayCredit = actualPrice * sale.salesQuantity;
      const amountDiff = todayCredit - originalSale.todayCredit;
      const receivedDiff = sale.totalAmountReceived - originalSale.totalAmountReceived;
      const qtyDiff = sale.salesQuantity - originalSale.salesQuantity;
      const emptyDiff = sale.emptyQuantity - originalSale.emptyQuantity;

      // Update the sale document
      await updateDoc(doc(db, "sales", id), {
        ...sale,
        productPrice: actualPrice,
        todayCredit,
        totalBalance: sale.previousBalance + todayCredit - sale.totalAmountReceived,
        timestamp: new Date(),
        isCustomPrice: sale.customPrice !== null
      });

      // Update customer document if needed
      if (amountDiff !== 0 || receivedDiff !== 0 || qtyDiff !== 0 || emptyDiff !== 0) {
        const customerQuery = query(
          collection(db, "customers"),
          where("id", "==", sale.customerId)
        );
        const customerSnapshot = await getDocs(customerQuery);
        
        if (!customerSnapshot.empty) {
          const customerDoc = customerSnapshot.docs[0];
          const customerData = customerDoc.data();
          
          await updateDoc(customerDoc.ref, {
            currentBalance: customerData.currentBalance + amountDiff - receivedDiff,
            currentGasOnHand: customerData.currentGasOnHand - emptyDiff + qtyDiff,
            lastPurchaseDate: new Date()
          });
        }
      }

      navigate(`/sales/${id}`, { state: { success: "Sale updated successfully" } });
    } catch (err) {
      console.error("Error updating sale:", err);
      setError("Failed to update sale: " + err.message);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Container className="d-flex justify-content-center align-items-center" style={{ height: '80vh' }}>
        <Spinner animation="border" variant="primary" />
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="mt-4">
        <Alert variant="danger">
          <Alert.Heading>Error Loading Sale</Alert.Heading>
          <p>{error}</p>
          <div className="d-flex justify-content-end">
            <Button variant="outline-danger" onClick={() => navigate('/sales')}>
              Back to Sales List
            </Button>
          </div>
        </Alert>
      </Container>
    );
  }

  if (!sale) {
    return (
      <Container className="mt-4">
        <Alert variant="warning">
          <Alert.Heading>Sale Not Found</Alert.Heading>
          <p>The requested sale could not be found in our records.</p>
          <div className="d-flex justify-content-end">
            <Button variant="outline-secondary" onClick={() => navigate('/sales')}>
              Back to Sales List
            </Button>
          </div>
        </Alert>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      <Button 
        variant="outline-secondary" 
        onClick={() => navigate(`/sales/${id}`)} 
        className="mb-3"
      >
        &larr; Back to Sale Details
      </Button>

      <Card className="shadow-sm">
        <Card.Header className="bg-primary text-white">
          <h4>Update Sale</h4>
        </Card.Header>
        <Card.Body>
          <Form onSubmit={handleSubmit}>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Sale ID</Form.Label>
                  <Form.Control type="text" value={sale.id} readOnly />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Date</Form.Label>
                  <Form.Control 
                    type="date" 
                    name="date"
                    value={format(sale.date, 'yyyy-MM-dd')}
                    onChange={handleChange}
                    required
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Customer</Form.Label>
                  <Form.Control as="select" name="customerId" value={sale.customerId} onChange={handleChange} required>
                    <option value="">Select Customer</option>
                    {customers.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.phone}) - Balance: {c.currentBalance || 0}
                      </option>
                    ))}
                  </Form.Control>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Product</Form.Label>
                  <Form.Control as="select" name="productId" value={sale.productId} onChange={handleChange} required>
                    <option value="">Select Product</option>
                    {products.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name} (₹{p.price})
                      </option>
                    ))}
                  </Form.Control>
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Base Price (₹)</Form.Label>
                  <Form.Control 
                    type="number" 
                    value={sale.baseProductPrice || sale.productPrice} 
                    readOnly 
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>
                    Custom Price (₹) {sale.customPrice !== null && (
                      <Badge bg="warning" text="dark">Custom</Badge>
                    )}
                  </Form.Label>
                  <Form.Control
                    type="number"
                    name="customPrice"
                    value={sale.customPrice || ''}
                    onChange={handleCustomPriceChange}
                    placeholder="Enter custom price"
                    min="0"
                    step="0.01"
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Actual Price (₹)</Form.Label>
                  <Form.Control
                    type="number"
                    value={sale.customPrice || sale.baseProductPrice || sale.productPrice}
                    readOnly
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Sales Quantity</Form.Label>
                  <Form.Control
                    type="number"
                    name="salesQuantity"
                    value={sale.salesQuantity}
                    onChange={handleChange}
                    required
                    min="1"
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Empty Cylinders</Form.Label>
                  <Form.Control
                    type="number"
                    name="emptyQuantity"
                    value={sale.emptyQuantity}
                    onChange={handleChange}
                    required
                    min="0"
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Total Amount Received (₹)</Form.Label>
                  <Form.Control
                    type="number"
                    name="totalAmountReceived"
                    value={sale.totalAmountReceived}
                    onChange={handleChange}
                    required
                    min="0"
                  />
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Today Credit (₹)</Form.Label>
                  <Form.Control
                    type="number"
                    name="todayCredit"
                    value={sale.todayCredit}
                    readOnly
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Previous Balance (₹)</Form.Label>
                  <Form.Control
                    type="number"
                    name="previousBalance"
                    value={sale.previousBalance}
                    readOnly
                  />
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Total Balance (₹)</Form.Label>
                  <Form.Control
                    type="number"
                    name="totalBalance"
                    value={sale.previousBalance + sale.todayCredit - sale.totalAmountReceived}
                    readOnly
                  />
                </Form.Group>
              </Col>
            </Row>

            <div className="d-flex justify-content-end mt-3">
              <Button variant="primary" type="submit" disabled={loading}>
                {loading ? 'Updating...' : 'Update Sale'}
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default UpdateSale;