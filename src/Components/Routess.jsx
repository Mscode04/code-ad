import React, { useState, useEffect } from "react";
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { db } from "../Firebase/config";
import { ToastContainer, toast } from "react-toastify";

const Routes = () => {
  const [routes, setRoutes] = useState([]);
  const [formData, setFormData] = useState({
    id: "",
    name: "",
    remarks: "",
  });

  useEffect(() => {
    fetchRoutes();
  }, []);

  const fetchRoutes = async () => {
    const querySnapshot = await getDocs(collection(db, "routes"));
    const routesData = querySnapshot.docs.map((doc) => ({
      docId: doc.id, // Firestore doc ID
      ...doc.data(),
    }));
    setRoutes(routesData);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, "routes"), formData);
      toast.success("Route added successfully!");
      setFormData({ id: "", name: "", remarks: "" });
      fetchRoutes();
    } catch (error) {
      console.error("Error adding document: ", error);
      toast.error("Error adding route");
    }
  };

  const handleDelete = async (docId) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this route?");
    if (!confirmDelete) return;

    try {
      await deleteDoc(doc(db, "routes", docId));
      toast.success("Route deleted successfully!");
      fetchRoutes();
    } catch (error) {
      console.error("Error deleting document: ", error);
      toast.error("Error deleting route");
    }
  };

  return (
    <div className="container mt-5">
      <ToastContainer />

      <h2 className="mb-4">Manage Routes</h2>

      <form onSubmit={handleSubmit} className="mb-4 border p-4 rounded bg-light">
        <div className="mb-3">
          <label className="form-label">ID:</label>
          <input
            type="text"
            name="id"
            className="form-control"
            value={formData.id}
            onChange={handleChange}
            required
          />
        </div>

        <div className="mb-3">
          <label className="form-label">Name:</label>
          <input
            type="text"
            name="name"
            className="form-control"
            value={formData.name}
            onChange={handleChange}
            required
          />
        </div>

        <div className="mb-3">
          <label className="form-label">Remarks:</label>
          <input
            type="text"
            name="remarks"
            className="form-control"
            value={formData.remarks}
            onChange={handleChange}
          />
        </div>

        <button type="submit" className="btn btn-primary">Add Route</button>
      </form>

      <h3 className="mb-3">Current Routes</h3>
      <div className="table-responsive">
        <table className="table table-bordered table-hover">
          <thead className="table-dark">
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Remarks</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {routes.map((route) => (
              <tr key={route.docId}>
                <td>{route.id}</td>
                <td>{route.name}</td>
                <td>{route.remarks}</td>
                <td>
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => handleDelete(route.docId)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {routes.length === 0 && (
              <tr>
                <td colSpan="4" className="text-center">No routes found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Routes;
