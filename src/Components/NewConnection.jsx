import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { collection, addDoc, getDocs, query, limit, orderBy } from "firebase/firestore";
import { db } from "../Firebase/config";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const NewConnection = () => {
  const navigate = useNavigate();
  const [routes, setRoutes] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    id: "",
    name: "",
    organization: "",
    phone: "",
    address: "",
    ownerName: "",
    ownerPhone: "",
    password: "",
    route: "",
    currentBalance: 
    '',
    currentGasOnHand: 
    '', // Initialize gas on hand
    lastPurchaseDate: null,
    createdAt: new Date().toISOString()
  });

  useEffect(() => {
    const fetchLatestCustomerAndRoutes = async () => {
      try {
        // Fetch routes
        const routesQuery = await getDocs(collection(db, "routes"));
        const routesData = routesQuery.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setRoutes(routesData);

        // Fetch latest customer to determine next ID
        const customersQuery = await getDocs(
          query(collection(db, "customers"), orderBy("id", "desc"), limit(1))
        );
        
        let nextId = "00001"; // Default starting ID
        
        if (!customersQuery.empty) {
          const latestCustomer = customersQuery.docs[0].data();
          const latestId = parseInt(latestCustomer.id);
          nextId = String(latestId + 1).padStart(5, '0');
        }
        
        setFormData(prev => ({ ...prev, id: nextId }));
      } catch (error) {
        toast.error("Failed to load initial data");
        console.error("Error fetching data: ", error);
      }
    };
    
    fetchLatestCustomerAndRoutes();
  }, []);

  const generatePassword = (name, phone) => {
    const randomChars = name?.slice(0, 2).toUpperCase() + "TBGS" + phone?.slice(-4);
    return randomChars;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData(prev => {
      const updatedFormData = {
        ...prev,
        [name]: name === "currentBalance" || name === "currentGasOnHand" 
          ? Number(value) || 0 
          : value
      };

      // Generate password only when phone or name changes
      if (name === "phone" || name === "name") {
        updatedFormData.password = generatePassword(
          name === "name" ? value : prev.name,
          name === "phone" ? value : prev.phone
        );
      }

      return updatedFormData;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Create customer data with all required fields
      const customerData = {
        ...formData,
        currentGasOnHand: formData.currentGasOnHand || 0, // Ensure field exists
        createdAt: new Date().toISOString(),
        lastPurchaseDate: null
      };

      await addDoc(collection(db, "customers"), customerData);
      
      toast.success("Customer added successfully!", {
        onClose: () => navigate("/all-customers"),
        autoClose: 3000
      });
      
      // Reset form with new ID
      const customersQuery = await getDocs(
        query(collection(db, "customers"), orderBy("id", "desc"), limit(1))
      );
      
      let nextId = "00001";
      if (!customersQuery.empty) {
        const latestCustomer = customersQuery.docs[0].data();
        nextId = String(parseInt(latestCustomer.id) + 1).padStart(5, '0');
      }
      
      setFormData({
        id: nextId,
        name: "",
        organization: "",
        phone: "",
        address: "",
        ownerName: "",
        ownerPhone: "",
        password: generatePassword("", ""),
        route: "",
        currentBalance: 0,
        currentGasOnHand: 0,
        lastPurchaseDate: null,
        createdAt: new Date().toISOString()
      });
      
    } catch (error) {
      toast.error(`Error adding customer: ${error.message}`);
      console.error("Error adding document: ", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="form-container">
      <h2>New Connection</h2>
      <ToastContainer position="top-right" autoClose={3000} />
      <form onSubmit={handleSubmit}>
        <div className="form-row">
          <div className="form-group">
            <label>Customer ID:</label>
            <input
              type="text"
              name="id"
              value={formData.id}
              readOnly
              className="form-control"
            />
          </div>
          
          <div className="form-group">
            <label>Name*:</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="form-control"
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Phone*:</label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              required
              className="form-control"
            />
          </div>
          
          <div className="form-group">
            <label>Organization:</label>
            <input
              type="text"
              name="organization"
              value={formData.organization}
              onChange={handleChange}
              className="form-control"
            />
          </div>
        </div>

        <div className="form-group">
          <label>Address:</label>
          <textarea
            name="address"
            value={formData.address}
            onChange={handleChange}
            rows={3}
            className="form-control"
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Owner Name:</label>
            <input
              type="text"
              name="ownerName"
              value={formData.ownerName}
              onChange={handleChange}
              className="form-control"
            />
          </div>
          
          <div className="form-group">
            <label>Owner Phone:</label>
            <input
              type="tel"
              name="ownerPhone"
              value={formData.ownerPhone}
              onChange={handleChange}
              className="form-control"
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Password:</label>
            <input
              type="text"
              name="password"
              value={formData.password}
              readOnly
              className="form-control"
            />
          </div>
          
          <div className="form-group">
            <label>Route*:</label>
            <select
              name="route"
              value={formData.route}
              onChange={handleChange}
              required
              className="form-control"
            >
              <option value="">Select Route</option>
              {routes.map(route => (
                <option key={route.id} value={route.name}>
                  {route.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Current Balance (₹):</label>
            <input
              type="number"
              name="currentBalance"
              value={formData.currentBalance}
              onChange={handleChange}
              className="form-control"
            />
          </div>
          
          <div className="form-group">
            <label>Gas Cylinders On Hand:</label>
            <input
              type="number"
              name="currentGasOnHand"
              value={formData.currentGasOnHand}
              onChange={handleChange}
              min="0"
              required
              className="form-control"
            />
          </div>
        </div>

        <div className="form-actions">
          <button
            type="submit"
            className="btn btn-primary me-2"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                Saving...
              </>
            ) : (
              "Save Connection"
            )}
          </button>
          
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => navigate(-1)}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default NewConnection;