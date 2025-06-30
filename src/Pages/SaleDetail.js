import React, { useState, useEffect } from "react";
import { db } from "../Firebase/config";
import { doc, getDoc, deleteDoc, updateDoc, query, collection, getDocs, where } from "firebase/firestore";
import { useNavigate, useParams } from "react-router-dom";
import { Container, Card, Button, Spinner, Alert, Badge, Row, Col, Modal, Form, Toast, ToastContainer } from "react-bootstrap";
import { format } from 'date-fns';
import { PDFDownloadLink } from '@react-pdf/renderer';
import SaleReceiptPDF from "./SaleReceiptPDF";

const SaleDetail = () => {
  const { id } = useParams();
  const [sale, setSale] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [pin, setPin] = useState("");
  const [toasts, setToasts] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSale = async () => {
      try {
        if (!id) {
          throw new Error("No sale ID provided");
        }

        const docRef = doc(db, "sales", id);
        const docSnap = await getDoc(docRef);
        
        if (!docSnap.exists()) {
          throw new Error("Sale document not found");
        }

        const saleData = docSnap.data();
        setSale({
          firebaseId: docSnap.id,
          ...saleData,
          date: saleData.timestamp?.toDate() || new Date(saleData.date || new Date())
        });
      } catch (err) {
        console.error("Error fetching sale:", err);
        setError(err.message || "Failed to load sale details");
        addToast("Error loading sale details", "danger");
      } finally {
        setLoading(false);
      }
    };

    fetchSale();
  }, [id]);

  const addToast = (message, variant = "success") => {
    const newToast = {
      id: Date.now(),
      message,
      variant
    };
    setToasts(prev => [...prev, newToast]);
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  const handleDelete = async () => {
    if (pin !== "1234") {
      addToast("Invalid PIN", "danger");
      return;
    }

    try {
      // First get the customer to update their balance
      const customerQuery = query(
        collection(db, "customers"),
        where("id", "==", sale.customerId)
      );
      const customerSnapshot = await getDocs(customerQuery);
      
      if (!customerSnapshot.empty) {
        const customerDoc = customerSnapshot.docs[0];
        const customerData = customerDoc.data();
        
        // Revert the customer balance and gas on hand
        await updateDoc(customerDoc.ref, {
          currentBalance: customerData.currentBalance - sale.todayCredit + sale.totalAmountReceived,
          currentGasOnHand: customerData.currentGasOnHand + sale.emptyQuantity - sale.salesQuantity
        });
      }

      // Then delete the sale
      await deleteDoc(doc(db, "sales", id));
      
      addToast("Sale deleted successfully");
      setTimeout(() => navigate('/all-sales'), 1500);
    } catch (err) {
      console.error("Error deleting sale:", err);
      addToast("Failed to delete sale", "danger");
    } finally {
      setShowDeleteModal(false);
      setPin("");
    }
  };

  if (loading) {
    return (
      <Container className="d-flex justify-content-center align-items-center" style={{ height: '80vh' }}>
        <Spinner animation="border" variant="primary" />
      </Container>
    );
  }

  const shopDetails = {
    name: "Your Shop Name",
    address: "Shop Address, City, State - PIN",
    phone: "1234567890",
    gst: "GSTIN123456789",
    footerNote: "Goods once sold will not be taken back"
  };

  if (error) {
    return (
      <Container className="mt-4">
        <Alert variant="danger">
          <Alert.Heading>Error Loading Sale</Alert.Heading>
          <p>{error}</p>
          <div className="d-flex justify-content-end">
            <Button variant="outline-danger" onClick={() => navigate('/all-sales')}>
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
            <Button variant="outline-secondary" onClick={() => navigate('/all-sales')}>
              Back to Sales List
            </Button>
          </div>
        </Alert>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      {/* Toast Container for all notifications */}
      <ToastContainer position="top-end" className="p-3" style={{ zIndex: 1 }}>
        {toasts.map(toast => (
          <Toast 
            key={toast.id}
            onClose={() => removeToast(toast.id)}
            show={true}
            delay={3000}
            autohide
            bg={toast.variant}
          >
            <Toast.Header closeButton={true}>
              <strong className="me-auto">Notification</strong>
            </Toast.Header>
            <Toast.Body className={toast.variant === 'danger' ? 'text-white' : ''}>
              {toast.message}
            </Toast.Body>
          </Toast>
        ))}
      </ToastContainer>

      <Button 
        variant="outline-secondary" 
        onClick={() => navigate('/all-sales')} 
        className="mb-3"
      >
        &larr; Back to All Sales
      </Button>

      <div className="d-flex justify-content-end gap-2 mb-3">
        <Button 
          variant="warning" 
          onClick={() => navigate(`/sales/update/${sale.firebaseId}`)}
        >
          Update Sale
        </Button>
        <Button 
          variant="danger" 
          onClick={() => setShowDeleteModal(true)}
        >
          Delete Sale
        </Button>
        <PDFDownloadLink
          document={<SaleReceiptPDF sale={sale} shopDetails={shopDetails} />}
          fileName={`Sale_${sale.id}.pdf`}
        >
          {({ loading }) => (
            <Button variant="primary" disabled={loading}>
              {loading ? 'Generating PDF...' : 'Download PDF'}
            </Button>
          )}
        </PDFDownloadLink>
      </div>

      <Card className="shadow-sm mb-4">
        <Card.Header className="bg-primary text-white d-flex justify-content-between align-items-center">
          <h4 className="mb-0">Sale Receipt</h4>
          <Badge bg="light" text="dark">
            {format(sale.date, 'dd MMM yyyy')}
          </Badge>
        </Card.Header>
        <Card.Body>
          <Row>
            <Col md={6}>
              <h5>Sale Information</h5>
              <hr />
              <p><strong>Sale ID:</strong> {sale.id || 'N/A'}</p>
              <p><strong>Document ID:</strong> <small>{sale.firebaseId}</small></p>
              <p><strong>Product:</strong> {sale.productName || 'N/A'} ({formatCurrency(sale.productPrice)})</p>
              <p><strong>Quantity:</strong> {sale.salesQuantity || 0}</p>
              <p><strong>Empty Cylinders:</strong> {sale.emptyQuantity || 0}</p>
              <p><strong>Route:</strong> {sale.routeName || 'N/A'}</p>
            </Col>
            <Col md={6}>
              <h5>Customer Information</h5>
              <hr />
              <p><strong>Name:</strong> {sale.customerName || 'N/A'}</p>
              <p><strong>Phone:</strong> {sale.customerPhone || 'N/A'}</p>
              <p><strong>Address:</strong> {sale.customerAddress || sale.customerData?.address || 'N/A'}</p>
              <p><strong>Organization:</strong> {sale.customerData?.organization || 'N/A'}</p>
              <p><strong>Owner Name:</strong> {sale.customerData?.ownerName || 'N/A'}</p>
            </Col>
          </Row>

          <Row className="mt-4">
            <Col md={6}>
              <h5>Transaction Details</h5>
              <hr />
              <p><strong>Total Amount:</strong> {formatCurrency(sale.todayCredit)}</p>
              <p><strong>Amount Paid:</strong> {formatCurrency(sale.totalAmountReceived)}</p>
              <p><strong>Payment Method:</strong> {sale.paymentMethod || 'Cash'}</p>
            </Col>
            <Col md={6}>
              <h5>Balance Information</h5>
              <hr />
              <p><strong>Previous Balance:</strong> {formatCurrency(sale.previousBalance)}</p>
              <p>
                <strong>Current Balance:</strong>
                <Badge bg={sale.totalBalance > 0 ? 'danger' : 'success'} className="ms-2">
                  {formatCurrency(sale.totalBalance)}
                </Badge>
              </p>
              <p><strong>Current Gas On Hand:</strong> {sale.customerData?.currentGasOnHand || 'N/A'}</p>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Deletion</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Alert variant="danger" className="mb-3">
            <strong>Warning!</strong> Deleting this sale will:
            <ul className="mt-2">
              <li>Remove it permanently from records</li>
              <li>Adjust the customer's balance and gas on hand</li>
            </ul>
          </Alert>
          <p>Enter PIN to confirm deletion:</p>
          <Form.Control
            type="password"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            placeholder="Enter PIN (1234)"
            className="mb-3"
          />
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => {
            setShowDeleteModal(false);
            setPin("");
          }}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDelete}>
            Confirm Delete
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default SaleDetail;