import React, { useState, useEffect } from "react";
import { collection, addDoc, getDocs, query, where, updateDoc } from "firebase/firestore";
import { db } from "../Firebase/config";
import Select from 'react-select';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './sales.css'

const Sales = () => {
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [isPaymentOnly, setIsPaymentOnly] = useState(false);
  
  const [formData, setFormData] = useState({
    id: `TBG${new Date().toISOString().replace(/[-:T.]/g, "").slice(0, 14)}`,
    customerId: "",
    customerData: null,
    productId: "",
    productData: null,
    routeId: "",
    routeData: null,
    salesQuantity: 0,
    emptyQuantity: 0,
    todayCredit: 0,
    totalAmountReceived: 0,
    totalBalance: 0,
    previousBalance: 0,
    date: new Date().toISOString().split('T')[0],
    customPrice: null,
    transactionType: "sale" // 'sale' or 'payment'
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch customers
        const customersSnapshot = await getDocs(collection(db, "customers"));
        const customersData = customersSnapshot.docs.map(doc => ({
          docId: doc.id,
          ...doc.data()
        }));
        setCustomers(customersData);
        
        // Fetch products
        const productsSnapshot = await getDocs(collection(db, "products"));
        const productsData = productsSnapshot.docs.map(doc => ({
          docId: doc.id,
          ...doc.data()
        }));
        setProducts(productsData);
        
        // Fetch routes
        const routesSnapshot = await getDocs(collection(db, "routes"));
        const routesData = routesSnapshot.docs.map(doc => ({
          docId: doc.id,
          ...doc.data()
        }));
        setRoutes(routesData);
      } catch (error) {
        toast.error(`Error fetching data: ${error.message}`);
      }
    };
    
    fetchData();
  }, []);

  const togglePaymentMode = () => {
    setIsPaymentOnly(!isPaymentOnly);
    setFormData(prev => ({
      ...prev,
      transactionType: !isPaymentOnly ? "payment" : "sale",
      productId: !isPaymentOnly ? "" : prev.productId,
      productData: !isPaymentOnly ? null : prev.productData,
      salesQuantity: !isPaymentOnly ? 0 : prev.salesQuantity,
      emptyQuantity: !isPaymentOnly ? 0 : prev.emptyQuantity,
      todayCredit: !isPaymentOnly ? 0 : prev.todayCredit,
      customPrice: !isPaymentOnly ? null : prev.customPrice
    }));
    
    if (!isPaymentOnly) {
      setSelectedProduct(null);
    }
  };

  useEffect(() => {
    if (formData.customerId) {
      const customer = customers.find(c => c.id === formData.customerId);
      if (customer) {
        setSelectedCustomer(customer);
        setFormData(prev => ({
          ...prev,
          customerData: customer,
          previousBalance: customer.currentBalance || 0,
          totalBalance: (customer.currentBalance || 0) + (prev.todayCredit || 0) - (prev.totalAmountReceived || 0)
        }));
      }
    }
  }, [formData.customerId, customers]);

  useEffect(() => {
    if (formData.productId && !isPaymentOnly) {
      const product = products.find(p => p.id === formData.productId);
      if (product) {
        setSelectedProduct(product);
        setFormData(prev => ({
          ...prev,
          productData: product,
          todayCredit: (prev.customPrice || product.price) * (prev.salesQuantity || 0),
          totalBalance: (prev.previousBalance || 0) + ((prev.customPrice || product.price) * (prev.salesQuantity || 0)) - (prev.totalAmountReceived || 0)
        }));
      }
    }
  }, [formData.productId, products, isPaymentOnly]);

  useEffect(() => {
    if (formData.routeId) {
      const route = routes.find(r => r.id === formData.routeId);
      if (route) {
        setSelectedRoute(route);
        setFormData(prev => ({
          ...prev,
          routeData: route
        }));
      }
    }
  }, [formData.routeId, routes]);

  useEffect(() => {
    if ((selectedProduct && formData.salesQuantity) || isPaymentOnly) {
      const currentPrice = isPaymentOnly ? 0 : (formData.customPrice || selectedProduct?.price || 0);
      const todayCredit = isPaymentOnly ? 0 : Number(currentPrice) * Number(formData.salesQuantity || 0);
      const previousBalance = Number(formData.previousBalance) || 0;
      const totalAmountReceived = Number(formData.totalAmountReceived) || 0;
      const totalBalance = previousBalance + todayCredit - totalAmountReceived;
      
      setFormData(prev => ({
        ...prev,
        todayCredit,
        totalBalance
      }));
    }
  }, [selectedProduct, formData.salesQuantity, formData.totalAmountReceived, formData.previousBalance, formData.customPrice, isPaymentOnly]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: name === "salesQuantity" || name === "emptyQuantity" || name === "totalAmountReceived" || name === "customPrice"
        ? Number(value) || 0 
        : value 
    }));
  };

  const handleCustomPriceChange = (e) => {
    if (isPaymentOnly) return;
    
    const { value } = e.target;
    const price = parseFloat(value) || 0;
    
    setFormData(prev => {
      const updatedData = {
        ...prev,
        customPrice: price > 0 ? price : null,
        todayCredit: price > 0 ? price * (prev.salesQuantity || 0) : (selectedProduct?.price || 0) * (prev.salesQuantity || 0)
      };
      
      updatedData.totalBalance = (updatedData.previousBalance || 0) + 
                               updatedData.todayCredit - 
                               (updatedData.totalAmountReceived || 0);
      
      return updatedData;
    });
  };

  const handleCustomerChange = (selectedOption) => {
    setFormData(prev => ({
      ...prev,
      customerId: selectedOption ? selectedOption.value : "",
      customerData: selectedOption ? selectedOption.data : null,
      customPrice: null
    }));
  };

  const handleProductChange = (selectedOption) => {
    if (isPaymentOnly) return;
    
    setFormData(prev => ({
      ...prev,
      productId: selectedOption ? selectedOption.value : "",
      productData: selectedOption ? selectedOption.data : null,
      customPrice: null
    }));
  };

  const handleRouteChange = (selectedOption) => {
    setFormData(prev => ({
      ...prev,
      routeId: selectedOption ? selectedOption.value : "",
      routeData: selectedOption ? selectedOption.data : null
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedCustomer) {
      toast.error("Please select a customer");
      return;
    }

    if (!selectedRoute) {
      toast.error("Please select a route");
      return;
    }

    if (!isPaymentOnly && !selectedProduct) {
      toast.error("Please select a product");
      return;
    }

    if (!isPaymentOnly && formData.salesQuantity <= 0) {
      toast.error("Sales quantity must be greater than 0");
      return;
    }

    try {
      // Prepare transaction data
      const transactionData = {
        ...formData,
        customerName: selectedCustomer.name,
        customerPhone: selectedCustomer.phone,
        customerAddress: selectedCustomer.address,
        routeId: selectedRoute.id,
        routeName: selectedRoute.name,
        timestamp: new Date(),
        transactionType: isPaymentOnly ? "payment" : "sale"
      };

      // Add product details if it's a sale
      if (!isPaymentOnly) {
        const actualPrice = formData.customPrice || selectedProduct.price;
        transactionData.productName = selectedProduct.name;
        transactionData.productPrice = actualPrice;
        transactionData.baseProductPrice = selectedProduct.price;
        transactionData.isCustomPrice = formData.customPrice !== null;
      } else {
        // For payments, clear product-related fields
        transactionData.productName = "";
        transactionData.productPrice = 0;
        transactionData.baseProductPrice = 0;
        transactionData.isCustomPrice = false;
        transactionData.salesQuantity = 0;
        transactionData.emptyQuantity = 0;
        transactionData.todayCredit = 0;
      }

      // Remove the routeData object if it exists
      delete transactionData.routeData;

      // Add transaction to sales collection
      await addDoc(collection(db, "sales"), transactionData);
      
      // Update customer document
      const customerDoc = customers.find(c => c.id === formData.customerId);
      if (customerDoc) {
        const customerQuery = query(
          collection(db, "customers"),
          where("id", "==", formData.customerId)
        );
        
        const querySnapshot = await getDocs(customerQuery);
        if (!querySnapshot.empty) {
          const customerDocRef = querySnapshot.docs[0].ref;
          await updateDoc(customerDocRef, {
            currentBalance: formData.totalBalance,
            currentGasOnHand: isPaymentOnly 
              ? (selectedCustomer.currentGasOnHand || 0)
              : (selectedCustomer.currentGasOnHand || 0) - formData.emptyQuantity + formData.salesQuantity,
            lastPurchaseDate: new Date()
          });
        }
      }
      
      toast.success(isPaymentOnly ? "Payment recorded successfully!" : "Sale recorded successfully!");
      
      // Reset form
      setFormData({
        id: `TBG${new Date().toISOString().replace(/[-:T.]/g, "").slice(0, 14)}`,
        customerId: "",
        customerData: null,
        productId: "",
        productData: null,
        routeId: "",
        routeData: null,
        salesQuantity: 0,
        emptyQuantity: 0,
        todayCredit: 0,
        totalAmountReceived: 0,
        totalBalance: 0,
        previousBalance: 0,
        date: new Date().toISOString().split('T')[0],
        customPrice: null,
        transactionType: isPaymentOnly ? "payment" : "sale"
      });
      setSelectedProduct(null);
      setSelectedCustomer(null);
      setSelectedRoute(null);
    } catch (error) {
      console.error("Error adding document: ", error);
      toast.error(`Error recording ${isPaymentOnly ? "payment" : "sale"}: ${error.message}`);
    }
  };

  // Prepare options for select components
  const customerOptions = customers.map(customer => ({
    value: customer.id,
    label: `${customer.name} (${customer.phone}) - Balance: ₹${customer.currentBalance || 0} - Gas: ${customer.currentGasOnHand || 0}`,
    data: customer
  }));

  const productOptions = products.map(product => ({
    value: product.id,
    label: `${product.name} (₹${product.price})`,
    data: product
  }));

  const routeOptions = routes.map(route => ({
    value: route.id,
    label: route.name,
    data: route
  }));

  return (
    <div className="form-container">
      <div className="form-header">
        <h2>{isPaymentOnly ? "Record Payment" : "New Sale"}</h2>
        <div className="payment-toggle">
          <label>
            <input
              type="checkbox"
              checked={isPaymentOnly}
              onChange={togglePaymentMode}
            />
            <span>Payment Only Mode</span>
          </label>
        </div>
      </div>
      
      <ToastContainer 
        position="top-right" 
        autoClose={5000}
        closeButton={false}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Transaction ID:</label>
          <input
            type="text"
            name="id"
            value={formData.id}
            readOnly
          />
        </div>
        
        <div className="form-group">
          <label>Date:</label>
          <input
            type="date"
            name="date"
            value={formData.date}
            onChange={handleChange}
            required
          />
        </div>
        
        <div className="form-group">
          <label>Route:</label>
          <Select
            options={routeOptions}
            value={routeOptions.find(option => option.value === formData.routeId)}
            onChange={handleRouteChange}
            placeholder="Select Route"
            isSearchable
            required
          />
        </div>
        
        <div className="form-group">
          <label>Customer:</label>
          <Select
            options={customerOptions}
            value={customerOptions.find(option => option.value === formData.customerId)}
            onChange={handleCustomerChange}
            placeholder="Select Customer"
            isSearchable
            required
          />
        </div>
        
        {selectedCustomer && (
          <div className="customer-details">
            <p><strong>Current Balance:</strong> ₹{selectedCustomer.currentBalance || 0}</p>
            <p><strong>Gas On Hand:</strong> {selectedCustomer.currentGasOnHand || 0}</p>
            <p><strong>New Balance After Transaction:</strong> ₹{formData.totalBalance}</p>
          </div>
        )}
        
        {!isPaymentOnly && (
          <>
            <div className="form-group">
              <label>Product:</label>
              <Select
                options={productOptions}
                value={productOptions.find(option => option.value === formData.productId)}
                onChange={handleProductChange}
                placeholder="Select Product"
                isSearchable
                required={!isPaymentOnly}
              />
            </div>
            
            {selectedProduct && (
              <>
                <div className="form-group">
                  <label>Base Price (₹):</label>
                  <input
                    type="number"
                    value={selectedProduct.price}
                    readOnly
                  />
                </div>
                
                <div className="form-group">
                  <label>
                    Custom Price (₹) {formData.customPrice !== null && (
                      <span className="badge bg-warning text-dark">Custom</span>
                    )}
                  </label>
                  <input
                    type="number"
                    name="customPrice"
                    value={formData.customPrice || ''}
                    onChange={handleCustomPriceChange}
                    placeholder="Enter custom price"
                    min="0"
                    step="0.01"
                  />
                </div>
                
                <div className="form-group">
                  <label>Actual Price (₹):</label>
                  <input
                    type="number"
                    value={formData.customPrice || selectedProduct.price}
                    readOnly
                  />
                </div>
                
                <div className="form-group">
                  <label>Sales Quantity:</label>
                  <input
                    type="number"
                    name="salesQuantity"
                    value={formData.salesQuantity}
                    onChange={handleChange}
                    required
                    min="1"
                  />
                </div>
                
                <div className="form-group">
                  <label>Empty Quantity:</label>
                  <input
                    type="number"
                    name="emptyQuantity"
                    value={formData.emptyQuantity}
                    onChange={handleChange}
                    required
                    min="0"
                  />
                  <small className="text-muted">Current on hand: {selectedCustomer?.currentGasOnHand || 0}</small>
                </div>
                
                <div className="form-group">
                  <label>Today Credit (₹):</label>
                  <input
                    type="number"
                    name="todayCredit"
                    value={formData.todayCredit}
                    readOnly
                  />
                </div>
                
                <div className="form-group">
                  <label>New Gas On Hand After Sale:</label>
                  <input
                    type="number"
                    value={
                      selectedCustomer 
                        ? (selectedCustomer.currentGasOnHand || 0) - formData.emptyQuantity + formData.salesQuantity
                        : 0
                    }
                    readOnly
                  />
                  <small className="text-muted">Can be negative if returning more than currently has</small>
                </div>
              </>
            )}
          </>
        )}
        
        <div className="form-group">
          <label>Previous Balance (₹):</label>
          <input
            type="number"
            name="previousBalance"
            value={formData.previousBalance}
            readOnly
          />
        </div>
        
        <div className="form-group">
          <label>Amount Received (₹):</label>
          <input
            type="number"
            name="totalAmountReceived"
            value={formData.totalAmountReceived}
            onChange={handleChange}
            required
            min="0"
          />
        </div>
        
        <div className="form-group">
          <label>New Balance (₹):</label>
          <input
            type="number"
            name="totalBalance"
            value={formData.totalBalance}
            readOnly
          />
        </div>
        
        <button 
          type="submit" 
          className="submit-btn btn-success btn-sm"
          disabled={!selectedCustomer || !selectedRoute || (!isPaymentOnly && !selectedProduct)}
        >
          {isPaymentOnly ? "Record Payment" : "Record Sale"}
        </button>
      </form>
    </div>
  );
};

export default Sales;