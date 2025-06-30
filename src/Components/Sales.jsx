import React, { useState, useEffect } from "react";
import { collection, addDoc, getDocs, query, where, updateDoc } from "firebase/firestore";
import { db } from "../Firebase/config";
import Select from 'react-select';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const Sales = () => {
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [formData, setFormData] = useState({
    id: `TBG${new Date().toISOString().replace(/[-:T.]/g, "").slice(0, 14)}`,
    customerId: "",
    customerData: null,
    productId: "",
    productData: null,
    routeId: "",
    routeData: null,
    salesQuantity: "",
    emptyQuantity: "",
    todayCredit: "",
    totalAmountReceived: "",
    totalBalance: 0,
    previousBalance: 0,
    date: new Date().toISOString().split('T')[0],
    customPrice: null // Added custom price field
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

  useEffect(() => {
    if (formData.customerId) {
      const customer = customers.find(c => c.id === formData.customerId);
      if (customer) {
        setSelectedCustomer(customer);
        setFormData(prev => ({
          ...prev,
          customerData: customer,
          previousBalance: customer.currentBalance || 0,
          totalBalance: (customer.currentBalance || 0) + prev.todayCredit - prev.totalAmountReceived
        }));
      }
    }
  }, [formData.customerId, customers]);

  useEffect(() => {
    if (formData.productId) {
      const product = products.find(p => p.id === formData.productId);
      if (product) {
        setSelectedProduct(product);
        setFormData(prev => ({
          ...prev,
          productData: product,
          todayCredit: (prev.customPrice || product.price) * prev.salesQuantity,
          totalBalance: (prev.previousBalance || 0) + ((prev.customPrice || product.price) * prev.salesQuantity) - prev.totalAmountReceived
        }));
      }
    }
  }, [formData.productId, products]);

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
    if (selectedProduct && formData.salesQuantity) {
      const currentPrice = formData.customPrice || selectedProduct.price;
      const todayCredit = Number(currentPrice) * Number(formData.salesQuantity);
      const previousBalance = Number(formData.previousBalance) || 0;
      const totalAmountReceived = Number(formData.totalAmountReceived) || 0;
      const totalBalance = previousBalance + todayCredit - totalAmountReceived;
      
      setFormData(prev => ({
        ...prev,
        todayCredit,
        totalBalance
      }));
    }
  }, [selectedProduct, formData.salesQuantity, formData.totalAmountReceived, formData.previousBalance, formData.customPrice]);

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
    const { value } = e.target;
    const price = parseFloat(value) || 0;
    
    setFormData(prev => {
      const updatedData = {
        ...prev,
        customPrice: price > 0 ? price : null,
        todayCredit: price > 0 ? price * prev.salesQuantity : (selectedProduct?.price || 0) * prev.salesQuantity
      };
      
      updatedData.totalBalance = (updatedData.previousBalance || 0) + 
                               updatedData.todayCredit - 
                               updatedData.totalAmountReceived;
      
      return updatedData;
    });
  };

  const handleCustomerChange = (selectedOption) => {
    setFormData(prev => ({
      ...prev,
      customerId: selectedOption ? selectedOption.value : "",
      customerData: selectedOption ? selectedOption.data : null,
      customPrice: null // Reset custom price when customer changes
    }));
  };

  const handleProductChange = (selectedOption) => {
    setFormData(prev => ({
      ...prev,
      productId: selectedOption ? selectedOption.value : "",
      productData: selectedOption ? selectedOption.data : null,
      customPrice: null // Reset custom price when product changes
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

    if (formData.emptyQuantity > selectedCustomer.currentGasOnHand) {
      toast.error(`Empty quantity (${formData.emptyQuantity}) cannot be more than current gas on hand (${selectedCustomer.currentGasOnHand})`);
      return;
    }

    try {
      // Determine the actual price used
      const actualPrice = formData.customPrice || selectedProduct.price;

      // Prepare complete sale data with only essential route information
      const saleData = {
        ...formData,
        customerName: selectedCustomer.name,
        customerPhone: selectedCustomer.phone,
        customerAddress: selectedCustomer.address,
        productName: selectedProduct.name,
        productPrice: actualPrice, // Use the actual price (custom or default)
        baseProductPrice: selectedProduct.price, // Store the base price for reference
        isCustomPrice: formData.customPrice !== null, // Flag for custom pricing
        routeId: selectedRoute.id,
        routeName: selectedRoute.name,
        timestamp: new Date()
      };

      // Remove the routeData object if it exists
      delete saleData.routeData;

      // Add sale to sales collection
      await addDoc(collection(db, "sales"), saleData);
      
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
            currentGasOnHand: (selectedCustomer.currentGasOnHand || 0) - formData.emptyQuantity + formData.salesQuantity,
            lastPurchaseDate: new Date()
          });
        }
      }
      
      toast.success("Sale recorded successfully!");
      // Reset form
      setFormData({
        id: `TBG${new Date().toISOString().replace(/[-:T.]/g, "").slice(0, 14)}`,
        customerId: "",
        customerData: null,
        productId: "",
        productData: null,
        routeId: "",
        routeData: null,
        salesQuantity: 1,
        emptyQuantity: 0,
        todayCredit: 0,
        totalAmountReceived: 0,
        totalBalance: 0,
        previousBalance: 0,
        date: new Date().toISOString().split('T')[0],
        customPrice: null
      });
      setSelectedProduct(null);
      setSelectedCustomer(null);
      setSelectedRoute(null);
    } catch (error) {
      console.error("Error adding document: ", error);
      toast.error("Error recording sale: " + error.message);
    }
  };

  // Prepare options for select components
  const customerOptions = customers.map(customer => ({
    value: customer.id,
    label: `${customer.name} (${customer.phone}) - Balance: ₹${customer.currentBalance || 0}`,
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
      <h2>New Sales</h2>
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
          <label>Sale ID:</label>
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
          </div>
        )}
        
        <div className="form-group">
          <label>Product:</label>
          <Select
            options={productOptions}
            value={productOptions.find(option => option.value === formData.productId)}
            onChange={handleProductChange}
            placeholder="Select Product"
            isSearchable
            required
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
                
              />
            </div>
            
            <div className="form-group">
              <label>Empty Quantity (Current on hand: {selectedCustomer?.currentGasOnHand || 0}):</label>
              <input
                type="number"
                name="emptyQuantity"
                value={formData.emptyQuantity}
                onChange={handleChange}
                required
                
                max={selectedCustomer?.currentGasOnHand || 0}
              />
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
              <label>Previous Balance (₹):</label>
              <input
                type="number"
                name="previousBalance"
                value={formData.previousBalance}
                readOnly
              />
            </div>
            
            <div className="form-group">
              <label>Total Amount Received (₹):</label>
              <input
                type="number"
                name="totalAmountReceived"
                value={formData.totalAmountReceived}
                onChange={handleChange}
                required
                
              />
            </div>
            
            <div className="form-group">
              <label>Total Balance (₹):</label>
              <input
                type="number"
                name="totalBalance"
                value={formData.totalBalance}
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
            </div>
          </>
        )}
        
        <button type="submit" className="submit-btn btn-success btn-sm">Save</button>
      </form>
    </div>
  );
};

export default Sales;