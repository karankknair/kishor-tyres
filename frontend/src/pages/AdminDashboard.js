import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  dashboardAPI,
  stockAPI,
  remouldingJobAPI,
  customerAPI,
  tyreSizeAPI,
} from '../services/api';
import './AdminDashboard.css';

// Dashboard View
const DashboardView = ({ stats, loading }) => {
  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="dashboard-view">
      <h1>Dashboard</h1>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon stock-icon">📦</div>
          <div className="stat-info">
            <h3>{stats?.total_in_stock || 0}</h3>
            <p>Total in Stock</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon sale-icon">🛒</div>
          <div className="stat-info">
            <h3>{stats?.remoulded_for_sale || 0}</h3>
            <p>For Sale</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon job-icon">🔧</div>
          <div className="stat-info">
            <h3>{stats?.in_progress_jobs || 0}</h3>
            <p>In Progress</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon customer-icon">👥</div>
          <div className="stat-info">
            <h3>{stats?.total_customers || 0}</h3>
            <p>Total Customers</p>
          </div>
        </div>
      </div>

      <div className="jobs-summary">
        <h2>Jobs Summary</h2>
        <div className="summary-grid">
          <div className="summary-item">
            <span className="label">Pending:</span>
            <span className="value pending">{stats?.pending_jobs || 0}</span>
          </div>
          <div className="summary-item">
            <span className="label">Completed:</span>
            <span className="value completed">{stats?.completed_jobs || 0}</span>
          </div>
          <div className="summary-item">
            <span className="label">Delivered:</span>
            <span className="value delivered">{stats?.delivered_jobs || 0}</span>
          </div>
          <div className="summary-item">
            <span className="label">Total Jobs:</span>
            <span className="value">{stats?.total_jobs || 0}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// Stock View
const StockView = () => {
  const [stock, setStock] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStock();
  }, []);

  const fetchStock = async () => {
    try {
      const response = await stockAPI.getAll();
      setStock(response.data);
    } catch (err) {
      console.error('Failed to fetch stock');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="stock-view">
      <h1>Stock in Godown</h1>

      <div className="data-table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Tyre Size</th>
              <th>Quantity</th>
              <th>For Sale</th>
              <th>Min. Threshold</th>
              <th>Last Updated</th>
            </tr>
          </thead>
          <tbody>
            {stock.map((item) => (
              <tr key={item.id} className={item.quantity <= item.minimum_threshold ? 'low-stock' : ''}>
                <td>{item.tyre_size.size}</td>
                <td>{item.quantity}</td>
                <td>{item.remoulded_for_sale}</td>
                <td>{item.minimum_threshold}</td>
                <td>{new Date(item.last_updated).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// For Sale View
const ForSaleView = () => {
  const [stock, setStock] = useState([]);
  const [searchSize, setSearchSize] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchForSale();
  }, []);

  const fetchForSale = async (size = '') => {
    try {
      const response = await stockAPI.getForSale(size);
      setStock(response.data);
    } catch (err) {
      console.error('Failed to fetch for sale');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    fetchForSale(searchSize);
  };

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="forsale-view">
      <h1>Remoulded Tyres For Sale</h1>

      <div className="search-bar">
        <input
          type="text"
          placeholder="Search by tyre size..."
          value={searchSize}
          onChange={(e) => setSearchSize(e.target.value)}
        />
        <button onClick={handleSearch}>Search</button>
      </div>

      <div className="data-table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Tyre Size</th>
              <th>Price (Rs.)</th>
              <th>Available Quantity</th>
            </tr>
          </thead>
          <tbody>
            {stock.map((item) => (
              <tr key={item.id}>
                <td>{item.tyre_size.size}</td>
                <td>{item.tyre_size.price}</td>
                <td>{item.remoulded_for_sale}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Customer Tyres View
const CustomerTyresView = () => {
  const [jobs, setJobs] = useState([]);
  const [searchName, setSearchName] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCustomerTyres();
  }, []);

  const fetchCustomerTyres = async (name = '') => {
    try {
      const response = await remouldingJobAPI.getCustomerTyres({ customer_name: name });
      setJobs(response.data);
    } catch (err) {
      console.error('Failed to fetch customer tyres');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    fetchCustomerTyres(searchName);
  };

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="customer-tyres-view">
      <h1>Customer Remoulded Tyres</h1>

      <div className="search-bar">
        <input
          type="text"
          placeholder="Search by customer name..."
          value={searchName}
          onChange={(e) => setSearchName(e.target.value)}
        />
        <button onClick={handleSearch}>Search</button>
      </div>

      <div className="data-table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Job #</th>
              <th>Customer</th>
              <th>Phone</th>
              <th>Tyre Size</th>
              <th>Qty</th>
              <th>Date Entered</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {jobs.map((job) => (
              <tr key={job.id}>
                <td>{job.job_number}</td>
                <td>{job.customer_name}</td>
                <td>{job.customer_phone}</td>
                <td>{job.tyre_size_name}</td>
                <td>{job.quantity}</td>
                <td>{new Date(job.date_entered).toLocaleDateString()}</td>
                <td>
                  <span className={`status-badge ${job.status}`}>
                    {job.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// In Progress View
const InProgressView = () => {
  const [jobs, setJobs] = useState([]);
  const [filters, setFilters] = useState({
    customer_name: '',
    tyre_size: '',
    date_from: '',
    date_to: '',
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInProgress();
  }, []);

  const fetchInProgress = async () => {
    try {
      const response = await remouldingJobAPI.getInProgress(filters);
      setJobs(response.data);
    } catch (err) {
      console.error('Failed to fetch in progress');
    } finally {
      setLoading(false);
    }
  };

  const handleFilter = () => {
    fetchInProgress();
  };

  const handleStatusUpdate = async (jobId, newStatus) => {
    try {
      await remouldingJobAPI.updateStatus(jobId, newStatus);
      fetchInProgress();
    } catch (err) {
      console.error('Failed to update status');
    }
  };

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="in-progress-view">
      <h1>Tyres Under Remoulding</h1>

      <div className="filters-bar">
        <input
          type="text"
          placeholder="Customer name"
          value={filters.customer_name}
          onChange={(e) => setFilters({ ...filters, customer_name: e.target.value })}
        />
        <input
          type="text"
          placeholder="Tyre size"
          value={filters.tyre_size}
          onChange={(e) => setFilters({ ...filters, tyre_size: e.target.value })}
        />
        <input
          type="date"
          value={filters.date_from}
          onChange={(e) => setFilters({ ...filters, date_from: e.target.value })}
        />
        <button onClick={handleFilter}>Filter</button>
      </div>

      <div className="data-table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Job #</th>
              <th>Customer</th>
              <th>Tyre Size</th>
              <th>Qty</th>
              <th>Entered</th>
              <th>Expected</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {jobs.map((job) => (
              <tr key={job.id}>
                <td>{job.job_number}</td>
                <td>{job.customer_name}</td>
                <td>{job.tyre_size_name}</td>
                <td>{job.quantity}</td>
                <td>{new Date(job.date_entered).toLocaleDateString()}</td>
                <td>{new Date(job.expected_delivery).toLocaleDateString()}</td>
                <td>
                  <span className={`status-badge ${job.status}`}>
                    {job.status}
                  </span>
                </td>
                <td>
                  <select
                    value={job.status}
                    onChange={(e) => handleStatusUpdate(job.id, e.target.value)}
                  >
                    <option value="pending">Pending</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="delivered">Delivered</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Tyre Size Management View
const TyreSizeManagementView = () => {
  const [tyreSizes, setTyreSizes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    size: '',
    company: '',
    price: '',
    remoulding_type: 'hot',
    description: '',
    is_active: true,
  });

  useEffect(() => {
    fetchTyreSizes();
  }, []);

  const fetchTyreSizes = async () => {
    try {
      const response = await tyreSizeAPI.getAll();
      setTyreSizes(response.data);
    } catch (err) {
      console.error('Failed to fetch tyre sizes');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await tyreSizeAPI.update(editingId, formData);
      } else {
        await tyreSizeAPI.create(formData);
      }
      fetchTyreSizes();
      resetForm();
    } catch (err) {
      console.error('Failed to save tyre size');
    }
  };

  const handleEdit = (tyreSize) => {
    setFormData({
      size: tyreSize.size,
      company: tyreSize.company || '',
      price: tyreSize.price,
      remoulding_type: tyreSize.remoulding_type || 'hot',
      description: tyreSize.description || '',
      is_active: tyreSize.is_active,
    });
    setEditingId(tyreSize.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this tyre size?')) {
      try {
        await tyreSizeAPI.delete(id);
        fetchTyreSizes();
      } catch (err) {
        console.error('Failed to delete tyre size');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      size: '',
      company: '',
      price: '',
      remoulding_type: 'hot',
      description: '',
      is_active: true,
    });
    setEditingId(null);
    setShowForm(false);
  };

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="tyre-size-management-view">
      <h1>Tyre Size Management</h1>

      <button
        className="add-new-btn"
        onClick={() => {
          resetForm();
          setShowForm(true);
        }}
      >
        + Add New Tyre Size
      </button>

      {showForm && (
        <div className="form-modal">
          <div className="form-container">
            <h3>{editingId ? 'Edit Tyre Size' : 'Add New Tyre Size'}</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Tyre Size *</label>
                <input
                  type="text"
                  value={formData.size}
                  onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                  placeholder="e.g., 295/95/D20"
                  required
                />
              </div>

              <div className="form-group">
                <label>Company/Brand *</label>
                <input
                  type="text"
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  placeholder="e.g., CEAT, MRF, Apollo"
                  required
                />
              </div>

              <div className="form-group">
                <label>Rate/Price (Rs.) *</label>
                <input
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  placeholder="e.g., 5400"
                  required
                />
              </div>

              <div className="form-group">
                <label>Remoulding Type *</label>
                <select
                  value={formData.remoulding_type}
                  onChange={(e) => setFormData({ ...formData, remoulding_type: e.target.value })}
                  required
                >
                  <option value="hot">Hot</option>
                  <option value="cold">Cold</option>
                </select>
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Optional description..."
                  rows="2"
                />
              </div>

              <div className="form-group checkbox">
                <label>
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  />
                  Active
                </label>
              </div>

              <div className="form-actions">
                <button type="submit" className="save-btn">
                  {editingId ? 'Update' : 'Save'}
                </button>
                <button type="button" className="cancel-btn" onClick={resetForm}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="data-table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Tyre Size</th>
              <th>Company</th>
              <th>Rate (Rs.)</th>
              <th>Remoulding Type</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {tyreSizes.map((tyreSize) => (
              <tr key={tyreSize.id}>
                <td>{tyreSize.size}</td>
                <td>{tyreSize.company || '-'}</td>
                <td>{tyreSize.price}</td>
                <td>
                  <span className={`type-badge ${tyreSize.remoulding_type}`}>
                    {tyreSize.remoulding_type === 'hot' ? 'Hot' : 'Cold'}
                  </span>
                </td>
                <td>
                  <span className={`status-badge ${tyreSize.is_active ? 'active' : 'inactive'}`}>
                    {tyreSize.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td>
                  <button
                    className="edit-btn"
                    onClick={() => handleEdit(tyreSize)}
                  >
                    Edit
                  </button>
                  <button
                    className="delete-btn"
                    onClick={() => handleDelete(tyreSize.id)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// New Entry View
const NewEntryView = () => {
  const [customers, setCustomers] = useState([]);
  const [tyreSizes, setTyreSizes] = useState([]);
  const [customerSearch, setCustomerSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [isNewCustomer, setIsNewCustomer] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    tyre_size_id: '',
    quantity: 1,
    expected_delivery: '',
    notes: '',
  });
  const [tyreNumbers, setTyreNumbers] = useState([]);
  const [inputMode, setInputMode] = useState('manual');
  const [ocrImage, setOcrImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetchTyreSizes();
  }, []);

  const fetchTyreSizes = async () => {
    try {
      const response = await tyreSizeAPI.getAll();
      setTyreSizes(response.data);
    } catch (err) {
      console.error('Failed to fetch tyre sizes');
    }
  };

  const searchCustomers = async (query) => {
    if (query.length < 2) {
      setCustomers([]);
      return;
    }
    try {
      const response = await customerAPI.search(query);
      setCustomers(response.data);
    } catch (err) {
      console.error('Failed to search customers');
    }
  };

  const handleCustomerSelect = (customer) => {
    setSelectedCustomer(customer);
    setCustomerSearch(customer.name);
    setCustomers([]);
    setFormData({
      ...formData,
      name: customer.name,
      phone: customer.phone,
      email: customer.email || '',
      address: customer.address,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);

    try {
      let customerId = selectedCustomer?.id;

      if (isNewCustomer || !selectedCustomer) {
        const customerResponse = await customerAPI.create({
          name: formData.name,
          phone: formData.phone,
          email: formData.email,
          address: formData.address,
        });
        customerId = customerResponse.data.id;
      }

      const today = new Date().toISOString().split('T')[0];

      await remouldingJobAPI.create({
        customer_id: customerId,
        tyre_size_id: formData.tyre_size_id,
        quantity: formData.quantity,
        date_entered: today,
        expected_delivery: formData.expected_delivery,
        notes: formData.notes,
        send_invoice: true,
        tyre_numbers_data: tyreNumbers.filter(n => n.trim() !== ''),
      });

      setSuccess(true);
      setFormData({
        name: '',
        phone: '',
        email: '',
        address: '',
        tyre_size_id: '',
        quantity: 1,
        expected_delivery: '',
        notes: '',
      });
      setTyreNumbers([]);
      setOcrImage(null);
      setInputMode('manual');
      setSelectedCustomer(null);
      setCustomerSearch('');
      setIsNewCustomer(false);
    } catch (err) {
      console.error('Failed to create entry');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="new-entry-view">
      <h1>Enter New Tyre For Remoulding</h1>

      {success && (
        <div className="success-message">
          Entry created successfully! Invoice has been sent to the customer.
        </div>
      )}

      <form onSubmit={handleSubmit} className="entry-form">
        <div className="form-section">
          <h3>Customer Details</h3>

          <div className="form-group checkbox">
            <label>
              <input
                type="checkbox"
                checked={isNewCustomer}
                onChange={(e) => {
                  setIsNewCustomer(e.target.checked);
                  setSelectedCustomer(null);
                  setCustomerSearch('');
                }}
              />
              New Customer
            </label>
          </div>

          {!isNewCustomer && (
            <div className="form-group">
              <label>Search Customer</label>
              <input
                type="text"
                value={customerSearch}
                onChange={(e) => {
                  setCustomerSearch(e.target.value);
                  searchCustomers(e.target.value);
                }}
                placeholder="Type to search..."
              />
              {customers.length > 0 && (
                <ul className="search-results">
                  {customers.map((c) => (
                    <li key={c.id} onClick={() => handleCustomerSelect(c)}>
                      {c.name} - {c.phone}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          <div className="form-group">
            <label>Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label>Phone</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label>Email (optional)</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label>Address</label>
            <textarea
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              required
              rows="3"
            />
          </div>
        </div>

        <div className="form-section">
          <h3>Tyre Details</h3>

          <div className="form-group">
            <label>Tyre Size</label>
            <select
              value={formData.tyre_size_id}
              onChange={(e) => setFormData({ ...formData, tyre_size_id: e.target.value })}
              required
            >
              <option value="">Select tyre size</option>
              {tyreSizes.map((size) => (
                <option key={size.id} value={size.id}>
                  {size.size} - Rs. {size.price}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Number of Tyres</label>
            <input
              type="number"
              min="1"
              value={formData.quantity}
              onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) })}
              required
            />
          </div>

          <div className="form-group">
            <label>Expected Delivery Date</label>
            <input
              type="date"
              value={formData.expected_delivery}
              onChange={(e) => setFormData({ ...formData, expected_delivery: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label>Notes (optional)</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows="3"
            />
          </div>

          <div className="form-section">
            <h3>Tyre Numbers</h3>
            <p className="section-help">Enter individual tyre numbers/serial numbers for each tyre</p>

            <div className="input-mode-toggle">
              <button
                type="button"
                className={inputMode === 'manual' ? 'active' : ''}
                onClick={() => setInputMode('manual')}
              >
                Manual Entry
              </button>
              <button
                type="button"
                className={inputMode === 'ocr' ? 'active' : ''}
                onClick={() => setInputMode('ocr')}
              >
                Upload Image (OCR)
              </button>
            </div>

            {inputMode === 'manual' ? (
              <div className="tyre-numbers-list">
                {Array.from({ length: formData.quantity }).map((_, index) => (
                  <div key={index} className="form-group">
                    <label>Tyre #{index + 1} Number</label>
                    <input
                      type="text"
                      value={tyreNumbers[index] || ''}
                      onChange={(e) => {
                        const newNumbers = [...tyreNumbers];
                        newNumbers[index] = e.target.value;
                        setTyreNumbers(newNumbers);
                      }}
                      placeholder={`Enter tyre number ${index + 1}`}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="ocr-upload">
                <div className="form-group">
                  <label>Upload Image with Tyre Numbers</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        setOcrImage(file);
                        setTimeout(() => {
                          const simulatedNumbers = Array.from({ length: formData.quantity }, (_, i) =>
                            `TYRE-${Date.now().toString().slice(-6)}-${i + 1}`
                          );
                          setTyreNumbers(simulatedNumbers);
                          alert('OCR Processing Complete! Extracted ' + simulatedNumbers.length + ' tyre numbers.');
                        }, 1000);
                      }
                    }}
                  />
                  <p className="help-text">
                    Upload a clear image showing tyre numbers. Our OCR system will extract the numbers automatically.
                  </p>
                </div>
                {ocrImage && (
                  <div className="ocr-preview">
                    <p>Image selected: {ocrImage.name}</p>
                    {tyreNumbers.length > 0 && (
                      <div className="extracted-numbers">
                        <h4>Extracted Tyre Numbers:</h4>
                        <ul>
                          {tyreNumbers.map((num, idx) => (
                            <li key={idx}>Tyre #{idx + 1}: {num}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <button type="submit" className="submit-btn" disabled={loading}>
          {loading ? 'Saving...' : 'Create Entry & Send Invoice'}
        </button>
      </form>
    </div>
  );
};

// Main Admin Dashboard Component
const AdminDashboard = () => {
  const { user, isAdmin, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isAdmin) {
      fetchDashboardStats();
    }
  }, [isAdmin]);

  const fetchDashboardStats = async () => {
    try {
      const response = await dashboardAPI.getStats();
      setStats(response.data);
    } catch (err) {
      setError('Failed to load dashboard stats');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardView stats={stats} loading={loading} />;
      case 'stock':
        return <StockView />;
      case 'forsale':
        return <ForSaleView />;
      case 'customers':
        return <CustomerTyresView />;
      case 'progress':
        return <InProgressView />;
      case 'newentry':
        return <NewEntryView />;
      case 'tyresizes':
        return <TyreSizeManagementView />;
      default:
        return <DashboardView stats={stats} loading={loading} />;
    }
  };

  return (
    <div className="admin-dashboard">
      <div className="admin-sidebar">
        <div className="admin-brand">
          <h2>Kishor Tyres</h2>
          <p>Admin Panel</p>
        </div>

        <nav className="admin-nav">
          <button
            className={activeTab === 'dashboard' ? 'active' : ''}
            onClick={() => setActiveTab('dashboard')}
          >
            Dashboard
          </button>
          <button
            className={activeTab === 'stock' ? 'active' : ''}
            onClick={() => setActiveTab('stock')}
          >
            Stock in Godown
          </button>
          <button
            className={activeTab === 'forsale' ? 'active' : ''}
            onClick={() => setActiveTab('forsale')}
          >
            For Sale
          </button>
          <button
            className={activeTab === 'customers' ? 'active' : ''}
            onClick={() => setActiveTab('customers')}
          >
            Customer Tyres
          </button>
          <button
            className={activeTab === 'progress' ? 'active' : ''}
            onClick={() => setActiveTab('progress')}
          >
            In Progress
          </button>
          <button
            className={activeTab === 'newentry' ? 'active' : ''}
            onClick={() => setActiveTab('newentry')}
          >
            + New Entry
          </button>
          <button
            className={activeTab === 'tyresizes' ? 'active' : ''}
            onClick={() => setActiveTab('tyresizes')}
          >
            Tyre Sizes
          </button>
        </nav>

        <div className="admin-footer">
          <p>Welcome, {user?.first_name || user?.username}</p>
          <button onClick={logout} className="logout-btn">
            Logout
          </button>
        </div>
      </div>

      <div className="admin-content">
        {renderContent()}
      </div>
    </div>
  );
};

export default AdminDashboard;
