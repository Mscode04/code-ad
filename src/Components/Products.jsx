import React, { useState, useEffect } from "react";
import { collection, addDoc, getDocs, doc, deleteDoc } from "firebase/firestore";
import { db } from "../Firebase/config";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Modal, Button } from 'react-bootstrap';

const Products = () => {
  const [products, setProducts] = useState([]);
  const [formData, setFormData] = useState({
    id: "",
    name: "",
    price: "",
    remarks: ""
  });
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const querySnapshot = await getDocs(collection(db, "products"));
      const productsData = querySnapshot.docs.map(docSnap => ({
        docId: docSnap.id, // This is Firestore's real document ID
        ...docSnap.data(),
        price: parseFloat(docSnap.data().price) || 0
      }));
      setProducts(productsData);
    } catch (error) {
      toast.error("Failed to fetch products");
      console.error("Error fetching products: ", error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const productData = {
        ...formData,
        price: parseFloat(formData.price) || 0
      };

      await addDoc(collection(db, "products"), productData);

      toast.success("Product added successfully!");
      setFormData({ id: "", name: "", price: "", remarks: "" });
      fetchProducts();
    } catch (error) {
      toast.error("Error adding product");
      console.error("Error adding document: ", error);
    }
  };

  const handleDeleteClick = (product) => {
    setProductToDelete(product);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!productToDelete) return;

    try {
      await deleteDoc(doc(db, "products", productToDelete.docId));
      toast.success("Product deleted successfully!");
      fetchProducts();
    } catch (error) {
      toast.error("Error deleting product");
      console.error("Error deleting document: ", error);
    } finally {
      setShowDeleteModal(false);
      setProductToDelete(null);
    }
  };

  return (
    <div className="container mt-4">
      <ToastContainer position="top-right" autoClose={3000} />
      
      <h2 className="mb-4">Products Management</h2>
      
      <div className="card mb-4">
        <div className="card-header bg-primary text-white">
          <h5>Add New Product</h5>
        </div>
        <div className="card-body">
          <form onSubmit={handleSubmit}>
            <div className="row mb-3">
              <div className="col-md-3">
                <label className="form-label">Product Code:</label>
                <input
                  type="text"
                  className="form-control"
                  name="id"
                  value={formData.id}
                  onChange={handleChange}
                  required
                />
              </div>
              
              <div className="col-md-3">
                <label className="form-label">Name:</label>
                <input
                  type="text"
                  className="form-control"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>
              
              <div className="col-md-3">
                <label className="form-label">Price:</label>
                <input
                  type="number"
                  className="form-control"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  required
                  min="0"
                  step="0.01"
                />
              </div>
              
              <div className="col-md-3">
                <label className="form-label">Remarks:</label>
                <input
                  type="text"
                  className="form-control"
                  name="remarks"
                  value={formData.remarks}
                  onChange={handleChange}
                />
              </div>
            </div>
            
            <button type="submit" className="btn btn-primary">
              Add Product
            </button>
          </form>
        </div>
      </div>
      
      <div className="card">
        <div className="card-header bg-success text-white">
          <h5>Current Products</h5>
        </div>
        <div className="card-body">
          {loading ? (
            <div className="text-center">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-striped table-hover">
                <thead className="table-dark">
                  <tr>
                    <th>Product Code</th>
                    <th>Name</th>
                    <th>Price (₹)</th>
                    <th>Remarks</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.length > 0 ? (
                    products.map(product => (
                      <tr key={product.docId}>
                        <td>{product.id}</td>
                        <td>{product.name}</td>
                        <td>₹{typeof product.price === 'number' ? product.price.toFixed(2) : product.price}</td>
                        <td>{product.remarks}</td>
                        <td>
                          <button 
                            onClick={() => handleDeleteClick(product)}
                            className="btn btn-danger btn-sm"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="text-center">No products found</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Delete</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to delete the product "{productToDelete?.name}"?
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={confirmDelete}>
            Delete
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default Products;
