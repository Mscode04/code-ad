import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { collection, addDoc, getDocs,query,limit,orderBy } from "firebase/firestore";
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
    currentBalance: 0
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
      [name]: value
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
    await addDoc(collection(db, "customers"), formData);
    toast.success("Customer added successfully!", {
      onClose: () => navigate("/all-customers"),
      autoClose: 3000
    });
    
    // Reset form (ID will be updated by the useEffect on next render)
    setFormData({
      id: "", // This will be set by useEffect
      name: "",
      organization: "",
      phone: "",
      address: "",
      ownerName: "",
      ownerPhone: "",
      password: generatePassword(formData.phone),
      route: "",
      currentBalance: 0
    });
    
    // Trigger a refetch of the latest ID
    const customersQuery = await getDocs(
      query(collection(db, "customers"), orderBy("id", "desc"), limit(1))
    );
    
    if (!customersQuery.empty) {
      const latestCustomer = customersQuery.docs[0].data();
      const nextId = String(parseInt(latestCustomer.id) + 1).padStart(5, '0');
      setFormData(prev => ({ ...prev, id: nextId }));
    }
    
  } catch (error) {
    toast.error("Error adding customer: " + error.message);
    console.error("Error adding document: ", error);
  } finally {
    setIsSubmitting(false);
  }
};

  return (
    <div className="form-container">
      <h2>New Connection</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>ID:</label>
          <input
            type="text"
            name="id"
            value={formData.id}
            onChange={handleChange}
            required
            readOnly
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
          <label>Address:</label>
          <textarea
          className="form-control"
            name="address"
            value={formData.address}
            onChange={handleChange}
            rows="3"
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
          <label>Password (Auto-generated):</label>
          <input
            type="text"
            name="password"
            value={formData.password}
            readOnly
          />
        </div>
        
        <div className="form-group">
          <label>Route:</label>
          <select
            name="route"
            value={formData.route}
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
        
        <button 
          type="submit" 
          className="submit-btn"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Saving...' : 'Save Connection'}
        </button>
      </form>
      
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
    </div>
  );
};

export default NewConnection;