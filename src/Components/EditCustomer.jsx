import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, getDoc, updateDoc, collection, getDocs } from "firebase/firestore";
import { db } from "../Firebase/config";
import { Box } from '@mui/material';
import { toast, ToastContainer } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';
import './EditCustomer.css';

const EditCustomer = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [routes, setRoutes] = useState([]);
  const [formData, setFormData] = useState({
    id: "",
    name: "",
    address: "",
    organization: "",
    phone: "",
    ownerName: "",
    ownerPhone: "",
    password: "",
    route: "",
    currentBalance: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch routes for dropdown
    const fetchData = async () => {
      try {
        // Fetch customer data
        const customerDoc = await getDoc(doc(db, "customers", id));
        if (customerDoc.exists()) {
          setFormData(customerDoc.data());
        } else {
          toast.error("Customer not found");
          navigate("/");
        }

        // Fetch routes
        const routesSnapshot = await getDocs(collection(db, "routes"));
        const routesData = routesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setRoutes(routesData);
      } catch (error) {
        console.error("Error fetching data: ", error);
        toast.error("Error loading customer data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await updateDoc(doc(db, "customers", id), formData);
      toast.success("Customer updated successfully!", {
        autoClose: 2000,
        onClose: () => navigate("/all-customers")
      });
    } catch (error) {
      console.error("Error updating document: ", error);
      toast.error("Error updating customer");
    }
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

  return (
    <div className="form-container">
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
      
      <h2>Edit Connection</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>ID:</label>
          <input
            type="text"
            name="id"
            value={formData.id}
            onChange={handleChange}
            required
            disabled
          />
        </div>
        
        <div className="form-group">
          <label>Name:</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
          />
        </div>
        
        <div className="form-group">
          <label>Address:</label>
          <input
            type="text"
            name="address"
            value={formData.address}
            onChange={handleChange}
          />
        </div>
        
        <div className="form-group">
          <label>Organization:</label>
          <input
            type="text"
            name="organization"
            value={formData.organization}
            onChange={handleChange}
          />
        </div>
        
        <div className="form-group">
          <label>Phone:</label>
          <input
            type="text"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            required
            
          />
        </div>
        
        <div className="form-group">
          <label>Owner Name:</label>
          <input
            type="text"
            name="ownerName"
            value={formData.ownerName}
            onChange={handleChange}
          />
        </div>
        
        <div className="form-group">
          <label>Owner Phone:</label>
          <input
            type="text"
            name="ownerPhone"
            value={formData.ownerPhone}
            onChange={handleChange}
          />
        </div>
        
        <div className="form-group">
          <label>Password:</label>
          <input
            type="text"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
           
          />
        </div>
        
        <div className="form-group">
          <label>Route:</label>
          <select
            name="route"
            value={formData.route}
            className="form-control"
            onChange={handleChange}
            required
          >
            <option value="">Select Route</option>
            {routes.map(route => (
              <option key={route.id} value={route.name}>
                {route.name}
              </option>
            ))}
          </select>
        </div>
        
        <div className="form-group">
          <label>Current Balance Amount:</label>
          <input
            type="number"
            name="currentBalance"
            value={formData.currentBalance}
            onChange={handleChange}
            required
          />
        </div>
        
        <button type="submit" className="submit-btn btn-warning text-ligh text-center">
          Update
        </button>
        <button 
          type="button" 
          className="cancel-btn"
          onClick={() => navigate(-1)}
        >
          Cancel
        </button>
      </form>
    </div>
  );
};

export default EditCustomer;