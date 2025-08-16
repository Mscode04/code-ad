import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, getDoc, updateDoc, collection, getDocs } from "firebase/firestore";
import { db } from "../Firebase/config";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const EditCustomer = () => {
  const { id } = useParams();
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
    currentBalance: 0,
    currentGasOnHand: 0,
    gstNumber: "",
    lastPurchaseDate: null,
    createdAt: ""
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCustomerData = async () => {
      try {
        // Fetch customer document
        const customerDoc = await getDoc(doc(db, "customers", id));
        
        if (!customerDoc.exists()) {
          toast.error("Customer not found");
          navigate("/all-customers");
          return;
        }

        const customerData = customerDoc.data();
        
        // Initialize missing fields with defaults
        setFormData({
          id: customerData.id,
          name: customerData.name || "",
          organization: customerData.organization || "",
          phone: customerData.phone || "",
          address: customerData.address || "",
          ownerName: customerData.ownerName || "",
          ownerPhone: customerData.ownerPhone || "",
          password: customerData.password || generatePassword(customerData.name, customerData.phone),
          route: customerData.route || "",
          currentBalance: customerData.currentBalance || 0,
          currentGasOnHand: customerData.currentGasOnHand || 0,
          gstNumber: customerData.gstNumber || "",
          lastPurchaseDate: customerData.lastPurchaseDate || null,
          createdAt: customerData.createdAt || new Date().toISOString()
        });

        // Fetch routes for dropdown
        const routesSnapshot = await getDocs(collection(db, "routes"));
        setRoutes(routesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })));

      } catch (error) {
        toast.error(`Error loading customer data: ${error.message}`);
        console.error("Error fetching data: ", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCustomerData();
  }, [id, navigate]);

  const generatePassword = (name, phone) => {
    return name?.slice(0, 2).toUpperCase() + "TBGS" + phone?.slice(-4);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === "currentBalance" || name === "currentGasOnHand" 
        ? Number(value) || 0 
        : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Prepare update data
      const updateData = {
        ...formData,
        updatedAt: new Date().toISOString()
      };

      // Remove internal fields not needed in Firestore
      delete updateData.id;
      delete updateData.createdAt;

      await updateDoc(doc(db, "customers", id), updateData);
      
      toast.success("Customer updated successfully!", {
        autoClose: 2000,
        onClose: () => navigate("/all-customers")
      });
      
    } catch (error) {
      toast.error(`Error updating customer: ${error.message}`);
      console.error("Error updating document: ", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p>Loading customer data...</p>
      </div>
    );
  }

  return (
    <div className="form-container">
      <h2>Edit Connection</h2>
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
              onChange={handleChange}
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
              min="0"
              step="0.01"
              className="form-control"
            />
          </div>
          
          <div className="form-group">
            <label>Gas Cylinders On Hand*:</label>
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

        <div className="form-row">
          <div className="form-group">
            <label>GST Number:</label>
            <input
              type="text"
              name="gstNumber"
              value={formData.gstNumber}
              onChange={handleChange}
              placeholder="22AAAAA0000A1Z5"
              pattern="^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$"
              className="form-control"
            />
            <small className="text-muted">Format: 22AAAAA0000A1Z5</small>
          </div>
        </div>

        <div className="form-group">
          <label>Account Created:</label>
          <input
            type="text"
            value={new Date(formData.createdAt).toLocaleString()}
            readOnly
            className="form-control"
          />
        </div>

        <div className="form-actions">
          <button
            type="submit"
            className="btn btn-primary me-3"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                Updating...
              </>
            ) : (
              "Update Connection"
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

export default EditCustomer;