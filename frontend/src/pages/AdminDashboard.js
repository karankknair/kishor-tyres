import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  dashboardAPI, stockAPI, remouldingJobAPI, customerAPI,
  tyreSizeAPI, rateCardAPI, adminAPI, ocrAPI,
} from '../services/api';
import './AdminDashboard.css';

// ─── Helpers ────────────────────────────────────────────────────────────────

const StatusBadge = ({ status }) => (
  <span className={`status-badge ${status}`}>{status.replace('_', ' ')}</span>
);

const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN') : '—';
const fmtAmt  = (a) => a ? `₹${parseFloat(a).toLocaleString('en-IN')}` : '₹0';

// ─── Dashboard View ──────────────────────────────────────────────────────────

const DashboardView = ({ stats, loading }) => {
  if (loading) return <div className="loading">Loading…</div>;
  return (
    <div className="dashboard-view">
      <h1>Dashboard</h1>
      <div className="stats-grid">
        {[
          { label: 'Tyres in Godown', value: stats?.tyres_in_godown ?? 0, cls: 'stock-icon', icon: '📦' },
          { label: 'In Progress', value: stats?.in_progress_jobs ?? 0, cls: 'job-icon', icon: '🔧' },
          { label: 'Completed', value: stats?.completed_jobs ?? 0, cls: 'sale-icon', icon: '✅' },
          { label: 'Delivered', value: stats?.delivered_jobs ?? 0, cls: 'delivered-icon', icon: '🚚' },
          { label: 'Overdue', value: stats?.overdue_jobs ?? 0, cls: 'overdue-icon', icon: '⚠️' },
          { label: 'Total Customers', value: stats?.total_customers ?? 0, cls: 'customer-icon', icon: '👥' },
        ].map((s) => (
          <div key={s.label} className={`stat-card ${s.overdue ? 'overdue' : ''}`}>
            <div className={`stat-icon ${s.cls}`}>{s.icon}</div>
            <div className="stat-info">
              <h3>{s.value}</h3>
              <p>{s.label}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="jobs-summary">
        <h2>Jobs Summary</h2>
        <div className="summary-grid">
          {['in_progress', 'completed', 'delivered'].map((st) => (
            <div key={st} className="summary-item">
              <span className="label">{st.replace('_', ' ')}:</span>
              <span className={`value ${st}`}>{stats?.[`${st}_jobs`] ?? 0}</span>
            </div>
          ))}
          <div className="summary-item">
            <span className="label">Total:</span>
            <span className="value">{stats?.total_jobs ?? 0}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── All Jobs View ────────────────────────────────────────────────────────────

const AllJobsView = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ customer_name: '', tyre_size: '', status: '', date_from: '', date_to: '' });

  const fetch = async () => {
    setLoading(true);
    try {
      const r = await remouldingJobAPI.getAll(filters);
      setJobs(r.data);
    } finally { setLoading(false); }
  };

  useEffect(() => { fetch(); }, []); // eslint-disable-line

  const handleStatusUpdate = async (id, status) => {
    await remouldingJobAPI.updateStatus(id, status);
    fetch();
  };

  const downloadInvoice = async (id, jobNumber) => {
    const r = await remouldingJobAPI.getInvoice(id);
    const url = window.URL.createObjectURL(new Blob([r.data]));
    const a = document.createElement('a');
    a.href = url; a.download = `Invoice_${jobNumber}.pdf`; a.click();
  };

  return (
    <div className="all-jobs-view">
      <h1>All Jobs</h1>
      <div className="filters-bar">
        <input placeholder="Customer" value={filters.customer_name}
          onChange={(e) => setFilters({ ...filters, customer_name: e.target.value })} />
        <input placeholder="Tyre size" value={filters.tyre_size}
          onChange={(e) => setFilters({ ...filters, tyre_size: e.target.value })} />
        <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
          <option value="">All statuses</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
          <option value="delivered">Delivered</option>
        </select>
        <input type="date" value={filters.date_from}
          onChange={(e) => setFilters({ ...filters, date_from: e.target.value })} />
        <input type="date" value={filters.date_to}
          onChange={(e) => setFilters({ ...filters, date_to: e.target.value })} />
        <button onClick={fetch}>Filter</button>
      </div>
      {loading ? <div className="loading">Loading…</div> : (
        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Job #</th><th>Customer</th><th>Phone</th><th>Size</th>
                <th>Brand</th><th>Qty</th><th>In Date</th><th>Delivery</th>
                <th>Amount</th><th>Status</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((j) => (
                <tr key={j.id} className={j.is_overdue ? 'overdue-row' : ''}>
                  <td>{j.job_number}</td>
                  <td>{j.customer_name}</td>
                  <td>{j.customer_phone}</td>
                  <td>{j.tyre_size_name}</td>
                  <td>{j.tyre_brand || '—'}</td>
                  <td>{j.quantity}</td>
                  <td>{fmtDate(j.in_date)}</td>
                  <td className={j.is_overdue ? 'overdue-cell' : ''}>{fmtDate(j.expected_delivery)}</td>
                  <td>{fmtAmt(j.amount)}</td>
                  <td>
                    <select value={j.status} onChange={(e) => handleStatusUpdate(j.id, e.target.value)}>
                      <option value="in_progress">In Progress</option>
                      <option value="completed">Completed</option>
                      <option value="delivered">Delivered</option>
                    </select>
                  </td>
                  <td>
                    <button className="icon-btn" title="Download Invoice"
                      onClick={() => downloadInvoice(j.id, j.job_number)}>📄</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {jobs.length === 0 && <p className="empty-msg">No jobs found.</p>}
        </div>
      )}
    </div>
  );
};

// ─── Overdue View ─────────────────────────────────────────────────────────────

const OverdueView = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    remouldingJobAPI.getOverdue()
      .then((r) => setJobs(r.data))
      .finally(() => setLoading(false));
  }, []);

  const handleStatusUpdate = async (id, status) => {
    await remouldingJobAPI.updateStatus(id, status);
    remouldingJobAPI.getOverdue().then((r) => setJobs(r.data));
  };

  if (loading) return <div className="loading">Loading…</div>;

  return (
    <div className="overdue-view">
      <h1>Overdue Jobs <span className="overdue-count">{jobs.length}</span></h1>
      {jobs.length === 0 ? (
        <div className="empty-state-card">🎉 No overdue jobs!</div>
      ) : (
        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Job #</th><th>Customer</th><th>Phone</th><th>Tyre Size</th>
                <th>Qty</th><th>Due Date</th><th>Days Overdue</th><th>Status</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((j) => {
                const daysOver = Math.floor((new Date() - new Date(j.expected_delivery)) / 86400000);
                return (
                  <tr key={j.id} className="overdue-row">
                    <td>{j.job_number}</td>
                    <td>{j.customer_name}</td>
                    <td>{j.customer_phone}</td>
                    <td>{j.tyre_size_name}</td>
                    <td>{j.quantity}</td>
                    <td className="overdue-cell">{fmtDate(j.expected_delivery)}</td>
                    <td className="overdue-cell">{daysOver}d overdue</td>
                    <td>
                      <select value={j.status} onChange={(e) => handleStatusUpdate(j.id, e.target.value)}>
                        <option value="in_progress">In Progress</option>
                        <option value="completed">Completed</option>
                        <option value="delivered">Delivered</option>
                      </select>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

// ─── Stock View ───────────────────────────────────────────────────────────────

const StockView = () => {
  const [stock, setStock] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    stockAPI.getAll().then((r) => setStock(r.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading">Loading…</div>;
  return (
    <div className="stock-view">
      <h1>Stock in Godown</h1>
      <div className="data-table-container">
        <table className="data-table">
          <thead>
            <tr><th>Tyre Size</th><th>Category</th><th>Quantity</th><th>For Sale</th><th>Min Threshold</th><th>Last Updated</th></tr>
          </thead>
          <tbody>
            {stock.map((item) => (
              <tr key={item.id} className={item.quantity <= item.minimum_threshold ? 'low-stock' : ''}>
                <td>{item.tyre_size.size}</td>
                <td>{item.tyre_size.vehicle_category_display || item.tyre_size.vehicle_category}</td>
                <td>{item.quantity}</td>
                <td>{item.remoulded_for_sale}</td>
                <td>{item.minimum_threshold}</td>
                <td>{fmtDate(item.last_updated)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ─── Customer Tyres View ──────────────────────────────────────────────────────

const CustomerTyresView = () => {
  const [jobs, setJobs] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const fetch = (name = '') => {
    setLoading(true);
    remouldingJobAPI.getCustomerTyres({ customer_name: name })
      .then((r) => setJobs(r.data)).finally(() => setLoading(false));
  };

  useEffect(() => { fetch(); }, []);

  return (
    <div className="customer-tyres-view">
      <h1>Customer Remoulded Tyres</h1>
      <div className="search-bar">
        <input placeholder="Search by customer name…" value={search}
          onChange={(e) => setSearch(e.target.value)} />
        <button onClick={() => fetch(search)}>Search</button>
      </div>
      {loading ? <div className="loading">Loading…</div> : (
        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr><th>Job #</th><th>Customer</th><th>Phone</th><th>Tyre Size</th><th>Qty</th><th>In Date</th><th>Status</th></tr>
            </thead>
            <tbody>
              {jobs.map((j) => (
                <tr key={j.id}>
                  <td>{j.job_number}</td><td>{j.customer_name}</td><td>{j.customer_phone}</td>
                  <td>{j.tyre_size_name}</td><td>{j.quantity}</td>
                  <td>{fmtDate(j.in_date)}</td>
                  <td><StatusBadge status={j.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

// ─── In Progress View ─────────────────────────────────────────────────────────

const InProgressView = () => {
  const [jobs, setJobs] = useState([]);
  const [filters, setFilters] = useState({ customer_name: '', tyre_size: '', date_from: '' });
  const [loading, setLoading] = useState(true);

  const fetch = () => {
    setLoading(true);
    remouldingJobAPI.getInProgress(filters).then((r) => setJobs(r.data)).finally(() => setLoading(false));
  };
  useEffect(() => { fetch(); }, []); // eslint-disable-line

  return (
    <div className="in-progress-view">
      <h1>Tyres Under Remoulding</h1>
      <div className="filters-bar">
        <input placeholder="Customer name" value={filters.customer_name}
          onChange={(e) => setFilters({ ...filters, customer_name: e.target.value })} />
        <input placeholder="Tyre size" value={filters.tyre_size}
          onChange={(e) => setFilters({ ...filters, tyre_size: e.target.value })} />
        <input type="date" value={filters.date_from}
          onChange={(e) => setFilters({ ...filters, date_from: e.target.value })} />
        <button onClick={fetch}>Filter</button>
      </div>
      {loading ? <div className="loading">Loading…</div> : (
        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr><th>Job #</th><th>Customer</th><th>Size</th><th>Qty</th><th>In Date</th><th>Expected</th><th>Status</th><th>Update</th></tr>
            </thead>
            <tbody>
              {jobs.map((j) => (
                <tr key={j.id} className={j.is_overdue ? 'overdue-row' : ''}>
                  <td>{j.job_number}</td><td>{j.customer_name}</td>
                  <td>{j.tyre_size_name}</td><td>{j.quantity}</td>
                  <td>{fmtDate(j.in_date)}</td>
                  <td className={j.is_overdue ? 'overdue-cell' : ''}>{fmtDate(j.expected_delivery)}</td>
                  <td><StatusBadge status={j.status} /></td>
                  <td>
                    <select value={j.status}
                      onChange={(e) => remouldingJobAPI.updateStatus(j.id, e.target.value).then(fetch)}>
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
      )}
    </div>
  );
};

// ─── New Entry View ───────────────────────────────────────────────────────────

const REMOULDING_TYPES = [
  { value: 'pre_cure', label: 'Pre-cure' },
  { value: 'mold_cure', label: 'Mold-cure' },
];
const REMOULDING_SUB_TYPES = {
  pre_cure: [
    { value: 'rib', label: 'Rib' },
    { value: 'lug', label: 'Lug' },
    { value: 'mixed', label: 'Mixed' },
    { value: 'highway', label: 'Highway' },
  ],
  mold_cure: [
    { value: 'hot', label: 'Hot' },
    { value: 'cold', label: 'Cold' },
  ],
};

const NewEntryView = () => {
  const today = new Date().toISOString().split('T')[0];
  const [tyreSizes, setTyreSizes] = useState([]);
  const [customerSearch, setCustomerSearch] = useState('');
  const [customerResults, setCustomerResults] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [isNewCustomer, setIsNewCustomer] = useState(false);
  const [form, setForm] = useState({
    name: '', phone: '', address: '',
    tyre_size_id: '', quantity: 1, tyre_brand: '',
    remoulding_type: 'pre_cure', remoulding_sub_type: 'rib',
    in_date: today, expected_delivery: '', cuts_repairs: '', notes: '', amount: '',
  });
  const [tyreNumbers, setTyreNumbers] = useState([]);
  const [inputMode, setInputMode] = useState('manual');
  const [ocrImage, setOcrImage] = useState(null);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { tyreSizeAPI.getAll().then((r) => setTyreSizes(r.data)); }, []);

  // Auto-lookup rate card price
  useEffect(() => {
    if (!form.tyre_size_id || !form.tyre_brand || !form.remoulding_type || !form.remoulding_sub_type) return;
    rateCardAPI.lookup({
      tyre_brand: form.tyre_brand,
      remoulding_type: form.remoulding_type,
      remoulding_sub_type: form.remoulding_sub_type,
      tyre_size_id: form.tyre_size_id,
    }).then((r) => {
      if (r.data.price) {
        setForm((f) => ({ ...f, amount: (parseFloat(r.data.price) * f.quantity).toString() }));
      }
    }).catch(() => {});
  }, [form.tyre_size_id, form.tyre_brand, form.remoulding_type, form.remoulding_sub_type]);

  const searchCustomers = (q) => {
    setCustomerSearch(q);
    if (q.length < 2) { setCustomerResults([]); return; }
    customerAPI.search(q).then((r) => setCustomerResults(r.data));
  };

  const selectCustomer = (c) => {
    setSelectedCustomer(c);
    setCustomerSearch(c.name);
    setCustomerResults([]);
    setForm((f) => ({ ...f, name: c.name, phone: c.phone, address: c.address || '' }));
  };

  const handleOCR = async (file) => {
    setOcrImage(file);
    setOcrLoading(true);
    try {
      const r = await ocrAPI.extract(file);
      const candidates = r.data.candidates || [];
      const nums = Array.from({ length: form.quantity }, (_, i) => candidates[i] || '');
      setTyreNumbers(nums);
    } catch {
      alert('OCR failed. Please enter tyre numbers manually.');
      setInputMode('manual');
    } finally { setOcrLoading(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError(''); setSuccess(false);
    try {
      let customerId = selectedCustomer?.id;
      if (isNewCustomer || !selectedCustomer) {
        const cr = await customerAPI.create({ name: form.name, phone: form.phone, address: form.address });
        customerId = cr.data.id;
      }
      await remouldingJobAPI.create({
        customer_id: customerId,
        tyre_size_id: form.tyre_size_id,
        quantity: form.quantity,
        tyre_brand: form.tyre_brand,
        remoulding_type: form.remoulding_type,
        remoulding_sub_type: form.remoulding_sub_type,
        in_date: form.in_date,
        expected_delivery: form.expected_delivery,
        cuts_repairs: form.cuts_repairs,
        notes: form.notes,
        amount: form.amount || undefined,
        send_invoice: true,
        tyre_numbers_data: tyreNumbers.filter((n) => n.trim()),
      });
      setSuccess(true);
      setForm({ name: '', phone: '', address: '', tyre_size_id: '', quantity: 1, tyre_brand: '',
        remoulding_type: 'pre_cure', remoulding_sub_type: 'rib', in_date: today,
        expected_delivery: '', cuts_repairs: '', notes: '', amount: '' });
      setTyreNumbers([]); setOcrImage(null); setSelectedCustomer(null); setCustomerSearch('');
    } catch { setError('Failed to create job. Please check all fields.'); }
    finally { setLoading(false); }
  };

  const subTypes = REMOULDING_SUB_TYPES[form.remoulding_type] || [];

  return (
    <div className="new-entry-view">
      <h1>New Remoulding Entry</h1>
      {success && <div className="success-message">Job created and invoice sent!</div>}
      {error && <div className="error-message">{error}</div>}

      <form onSubmit={handleSubmit} className="entry-form">
        <div className="form-section">
          <h3>Customer Details</h3>
          <label className="checkbox-label">
            <input type="checkbox" checked={isNewCustomer}
              onChange={(e) => { setIsNewCustomer(e.target.checked); setSelectedCustomer(null); setCustomerSearch(''); }} />
            New Customer
          </label>

          {!isNewCustomer && (
            <div className="form-group autocomplete">
              <label>Search Existing Customer</label>
              <input value={customerSearch} onChange={(e) => searchCustomers(e.target.value)}
                placeholder="Type name or phone…" />
              {customerResults.length > 0 && (
                <ul className="search-results">
                  {customerResults.map((c) => (
                    <li key={c.id} onClick={() => selectCustomer(c)}>{c.name} — {c.phone}</li>
                  ))}
                </ul>
              )}
            </div>
          )}

          <div className="form-row">
            <div className="form-group">
              <label>Name *</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div className="form-group">
              <label>Phone *</label>
              <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required />
            </div>
          </div>

          <div className="form-group">
            <label>Address *</label>
            <textarea rows="2" value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })} required />
          </div>
        </div>

        <div className="form-section">
          <h3>Tyre Details</h3>
          <div className="form-row">
            <div className="form-group">
              <label>Tyre Size *</label>
              <select value={form.tyre_size_id}
                onChange={(e) => setForm({ ...form, tyre_size_id: e.target.value })} required>
                <option value="">Select size…</option>
                {tyreSizes.map((s) => (
                  <option key={s.id} value={s.id}>{s.size} ({s.vehicle_category_display})</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Quantity *</label>
              <input type="number" min="1" value={form.quantity}
                onChange={(e) => setForm({ ...form, quantity: parseInt(e.target.value) || 1 })} required />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Tyre Brand *</label>
              <input value={form.tyre_brand}
                onChange={(e) => setForm({ ...form, tyre_brand: e.target.value })}
                placeholder="e.g. MRF, CEAT, Apollo" required />
            </div>
            <div className="form-group">
              <label>Amount (₹)</label>
              <input type="number" value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                placeholder="Auto-filled from rate card" />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Remoulding Type *</label>
              <select value={form.remoulding_type}
                onChange={(e) => setForm({ ...form, remoulding_type: e.target.value, remoulding_sub_type: REMOULDING_SUB_TYPES[e.target.value][0].value })}>
                {REMOULDING_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Sub-type *</label>
              <select value={form.remoulding_sub_type}
                onChange={(e) => setForm({ ...form, remoulding_sub_type: e.target.value })}>
                {subTypes.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>In-Date (received) *</label>
              <input type="date" value={form.in_date}
                onChange={(e) => setForm({ ...form, in_date: e.target.value })} required />
            </div>
            <div className="form-group">
              <label>Expected Delivery *</label>
              <input type="date" value={form.expected_delivery}
                onChange={(e) => setForm({ ...form, expected_delivery: e.target.value })} required />
            </div>
          </div>

          <div className="form-group">
            <label>Cuts / Repairs</label>
            <textarea rows="2" value={form.cuts_repairs}
              onChange={(e) => setForm({ ...form, cuts_repairs: e.target.value })}
              placeholder="Describe any cuts, injuries, or damage…" />
          </div>

          <div className="form-group">
            <label>Notes</label>
            <textarea rows="2" value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </div>
        </div>

        <div className="form-section">
          <h3>Tyre Serial Numbers</h3>
          <div className="input-mode-toggle">
            <button type="button" className={inputMode === 'manual' ? 'active' : ''}
              onClick={() => setInputMode('manual')}>Manual Entry</button>
            <button type="button" className={inputMode === 'ocr' ? 'active' : ''}
              onClick={() => setInputMode('ocr')}>Upload Image (OCR)</button>
          </div>

          {inputMode === 'manual' ? (
            <div className="tyre-numbers-list">
              {Array.from({ length: form.quantity }).map((_, i) => (
                <div key={i} className="form-group">
                  <label>Tyre #{i + 1}</label>
                  <input value={tyreNumbers[i] || ''}
                    onChange={(e) => {
                      const n = [...tyreNumbers]; n[i] = e.target.value; setTyreNumbers(n);
                    }}
                    placeholder={`Serial number for tyre ${i + 1}`} />
                </div>
              ))}
            </div>
          ) : (
            <div className="ocr-upload">
              <div className="form-group">
                <label>Upload Tyre Image</label>
                <input type="file" accept="image/*"
                  onChange={(e) => { if (e.target.files[0]) handleOCR(e.target.files[0]); }} />
                <p className="help-text">Upload a clear image of the tyre sidewall. OCR will extract the serial number.</p>
              </div>
              {ocrLoading && <div className="ocr-loading">Extracting numbers…</div>}
              {ocrImage && !ocrLoading && tyreNumbers.some((n) => n) && (
                <div className="extracted-numbers">
                  <h4>Extracted Numbers (edit if needed):</h4>
                  {tyreNumbers.map((num, i) => (
                    <div key={i} className="form-group">
                      <label>Tyre #{i + 1}</label>
                      <input value={num}
                        onChange={(e) => { const n = [...tyreNumbers]; n[i] = e.target.value; setTyreNumbers(n); }} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <button type="submit" className="submit-btn" disabled={loading}>
          {loading ? 'Saving…' : 'Create Job & Send Invoice'}
        </button>
      </form>
    </div>
  );
};

// ─── Tyre Size Management ─────────────────────────────────────────────────────

const TyreSizeManagementView = () => {
  const [tyreSizes, setTyreSizes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ size: '', vehicle_category: 'truck', is_active: true });

  const fetch = () => {
    setLoading(true);
    tyreSizeAPI.getAll().then((r) => setTyreSizes(r.data)).finally(() => setLoading(false));
  };
  useEffect(() => { fetch(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    editId ? await tyreSizeAPI.update(editId, form) : await tyreSizeAPI.create(form);
    fetch(); reset();
  };
  const reset = () => { setForm({ size: '', vehicle_category: 'truck', is_active: true }); setEditId(null); setShowForm(false); };

  const handleEdit = (s) => { setForm({ size: s.size, vehicle_category: s.vehicle_category, is_active: s.is_active }); setEditId(s.id); setShowForm(true); };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this tyre size?')) { await tyreSizeAPI.delete(id); fetch(); }
  };

  return (
    <div className="tyre-size-management-view">
      <h1>Tyre Sizes</h1>
      <button className="add-new-btn" onClick={() => { reset(); setShowForm(true); }}>+ Add Size</button>

      {showForm && (
        <div className="form-modal">
          <div className="form-container">
            <h3>{editId ? 'Edit' : 'Add'} Tyre Size</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Size *</label>
                <input value={form.size} onChange={(e) => setForm({ ...form, size: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Vehicle Category *</label>
                <select value={form.vehicle_category} onChange={(e) => setForm({ ...form, vehicle_category: e.target.value })}>
                  <option value="tractor">Tractor</option>
                  <option value="earth_mover">Earth Mover</option>
                  <option value="truck">Truck</option>
                  <option value="truck_bus_tubeless">Truck/Bus Tubeless</option>
                  <option value="tempo">Tempo</option>
                  <option value="mini_truck">Mini Truck</option>
                </select>
              </div>
              <div className="form-group checkbox">
                <label><input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} /> Active</label>
              </div>
              <div className="form-actions">
                <button type="submit" className="save-btn">Save</button>
                <button type="button" className="cancel-btn" onClick={reset}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? <div className="loading">Loading…</div> : (
        <div className="data-table-container">
          <table className="data-table">
            <thead><tr><th>Size</th><th>Category</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {tyreSizes.map((s) => (
                <tr key={s.id}>
                  <td>{s.size}</td>
                  <td>{s.vehicle_category_display || s.vehicle_category}</td>
                  <td><span className={`status-badge ${s.is_active ? 'active' : 'inactive'}`}>{s.is_active ? 'Active' : 'Inactive'}</span></td>
                  <td>
                    <button className="edit-btn" onClick={() => handleEdit(s)}>Edit</button>
                    <button className="delete-btn" onClick={() => handleDelete(s.id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

// ─── Rate Card View ───────────────────────────────────────────────────────────

const RateCardView = () => {
  const [rates, setRates] = useState([]);
  const [tyreSizes, setTyreSizes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [filterBrand, setFilterBrand] = useState('');
  const [form, setForm] = useState({
    tyre_brand: '', remoulding_type: 'pre_cure', remoulding_sub_type: 'rib',
    tyre_size: '', price: '', is_active: true,
  });

  const fetch = () => {
    setLoading(true);
    Promise.all([rateCardAPI.getAll({ search: filterBrand }), tyreSizeAPI.getAll()])
      .then(([r, s]) => { setRates(r.data); setTyreSizes(s.data); })
      .finally(() => setLoading(false));
  };
  useEffect(() => { fetch(); }, []); // eslint-disable-line

  const handleSubmit = async (e) => {
    e.preventDefault();
    editId ? await rateCardAPI.update(editId, form) : await rateCardAPI.create(form);
    fetch(); reset();
  };
  const reset = () => { setForm({ tyre_brand: '', remoulding_type: 'pre_cure', remoulding_sub_type: 'rib', tyre_size: '', price: '', is_active: true }); setEditId(null); setShowForm(false); };

  const handleEdit = (r) => {
    setForm({ tyre_brand: r.tyre_brand, remoulding_type: r.remoulding_type, remoulding_sub_type: r.remoulding_sub_type, tyre_size: r.tyre_size, price: r.price, is_active: r.is_active });
    setEditId(r.id); setShowForm(true);
  };
  const handleDelete = async (id) => { if (window.confirm('Delete?')) { await rateCardAPI.delete(id); fetch(); } };

  const subTypes = REMOULDING_SUB_TYPES[form.remoulding_type] || [];

  return (
    <div className="rate-card-view">
      <h1>Rate Card</h1>
      <div className="search-bar">
        <input placeholder="Filter by brand…" value={filterBrand} onChange={(e) => setFilterBrand(e.target.value)} />
        <button onClick={fetch}>Filter</button>
        <button className="add-new-btn" onClick={() => { reset(); setShowForm(true); }}>+ Add Rate</button>
      </div>

      {showForm && (
        <div className="form-modal">
          <div className="form-container">
            <h3>{editId ? 'Edit' : 'Add'} Rate</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label>Tyre Brand *</label>
                  <input value={form.tyre_brand} onChange={(e) => setForm({ ...form, tyre_brand: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label>Tyre Size *</label>
                  <select value={form.tyre_size} onChange={(e) => setForm({ ...form, tyre_size: e.target.value })} required>
                    <option value="">Select…</option>
                    {tyreSizes.map((s) => <option key={s.id} value={s.id}>{s.size} ({s.vehicle_category_display})</option>)}
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Type *</label>
                  <select value={form.remoulding_type} onChange={(e) => setForm({ ...form, remoulding_type: e.target.value, remoulding_sub_type: REMOULDING_SUB_TYPES[e.target.value][0].value })}>
                    {REMOULDING_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Sub-type *</label>
                  <select value={form.remoulding_sub_type} onChange={(e) => setForm({ ...form, remoulding_sub_type: e.target.value })}>
                    {subTypes.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Price (₹) *</label>
                  <input type="number" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required />
                </div>
                <div className="form-group checkbox" style={{ justifyContent: 'flex-end', paddingTop: 28 }}>
                  <label><input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} /> Active</label>
                </div>
              </div>
              <div className="form-actions">
                <button type="submit" className="save-btn">Save</button>
                <button type="button" className="cancel-btn" onClick={reset}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? <div className="loading">Loading…</div> : (
        <div className="data-table-container">
          <table className="data-table">
            <thead><tr><th>Brand</th><th>Tyre Size</th><th>Type</th><th>Sub-type</th><th>Price</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {rates.map((r) => (
                <tr key={r.id}>
                  <td>{r.tyre_brand}</td>
                  <td>{r.tyre_size_detail?.size}</td>
                  <td>{r.remoulding_type_display}</td>
                  <td>{r.remoulding_sub_type_display}</td>
                  <td>{fmtAmt(r.price)}</td>
                  <td><span className={`status-badge ${r.is_active ? 'active' : 'inactive'}`}>{r.is_active ? 'Active' : 'Inactive'}</span></td>
                  <td>
                    <button className="edit-btn" onClick={() => handleEdit(r)}>Edit</button>
                    <button className="delete-btn" onClick={() => handleDelete(r.id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {rates.length === 0 && <p className="empty-msg">No rates yet. Add one above.</p>}
        </div>
      )}
    </div>
  );
};

// ─── Shared: Image Upload Field ───────────────────────────────────────────────
// Renders a file picker with a live preview of the selected (or existing) image.

const ImageUploadField = ({ label, currentUrl, onFileSelect }) => {
  const [preview, setPreview] = useState(null);

  const handleChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setPreview(URL.createObjectURL(file));
    onFileSelect(file);
  };

  const displaySrc = preview || currentUrl;

  return (
    <div className="form-group image-upload-field">
      <label>{label}</label>
      {displaySrc && (
        <div className="img-preview-wrap">
          <img src={displaySrc} alt="preview" className="img-preview" />
        </div>
      )}
      <label className="file-pick-btn">
        {displaySrc ? '🔄 Replace image' : '📷 Upload image'}
        <input type="file" accept="image/*" onChange={handleChange} style={{ display: 'none' }} />
      </label>
      {preview && <span className="img-preview-note">New image selected — save to apply.</span>}
    </div>
  );
};

// ─── Testimonials Management View ─────────────────────────────────────────────

const TestimonialsManagementView = () => {
  const [testimonials, setTestimonials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [currentImageUrl, setCurrentImageUrl] = useState(null);
  const [form, setForm] = useState({
    customer_name: '', content: '', rating: 5, is_active: true, customer_image: null,
  });

  const fetch = () => {
    setLoading(true);
    adminAPI.getTestimonials().then((r) => setTestimonials(r.data)).finally(() => setLoading(false));
  };
  useEffect(() => { fetch(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Don't send null image field (would clear existing image unintentionally)
    const payload = { ...form };
    if (!payload.customer_image) delete payload.customer_image;
    editId
      ? await adminAPI.updateTestimonial(editId, payload)
      : await adminAPI.createTestimonial(payload);
    fetch(); reset();
  };

  const reset = () => {
    setForm({ customer_name: '', content: '', rating: 5, is_active: true, customer_image: null });
    setEditId(null); setShowForm(false); setCurrentImageUrl(null);
  };

  const handleEdit = (t) => {
    setForm({ customer_name: t.customer_name, content: t.content, rating: t.rating, is_active: t.is_active, customer_image: null });
    setCurrentImageUrl(t.customer_image || null);
    setEditId(t.id); setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this testimonial?')) { await adminAPI.deleteTestimonial(id); fetch(); }
  };

  return (
    <div className="testimonials-management-view">
      <h1>Testimonials</h1>
      <button className="add-new-btn" onClick={() => { reset(); setShowForm(true); }}>+ Add Testimonial</button>

      {showForm && (
        <div className="form-modal">
          <div className="form-container">
            <h3>{editId ? 'Edit' : 'Add'} Testimonial</h3>
            <form onSubmit={handleSubmit}>
              <ImageUploadField
                label="Customer Photo (optional)"
                currentUrl={currentImageUrl}
                onFileSelect={(f) => setForm({ ...form, customer_image: f })}
              />
              <div className="form-group">
                <label>Customer Name *</label>
                <input value={form.customer_name}
                  onChange={(e) => setForm({ ...form, customer_name: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Review *</label>
                <textarea rows="4" value={form.content}
                  onChange={(e) => setForm({ ...form, content: e.target.value })} required />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Rating *</label>
                  <select value={form.rating}
                    onChange={(e) => setForm({ ...form, rating: parseInt(e.target.value) })}>
                    {[5, 4, 3, 2, 1].map((r) => <option key={r} value={r}>{r} ★</option>)}
                  </select>
                </div>
                <div className="form-group checkbox" style={{ paddingTop: 28 }}>
                  <label>
                    <input type="checkbox" checked={form.is_active}
                      onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />
                    Show publicly
                  </label>
                </div>
              </div>
              <div className="form-actions">
                <button type="submit" className="save-btn">Save</button>
                <button type="button" className="cancel-btn" onClick={reset}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? <div className="loading">Loading…</div> : (
        <div className="testimonials-card-grid">
          {testimonials.map((t) => (
            <div key={t.id} className="testimonial-admin-card">
              <div className="t-admin-avatar">
                {t.customer_image
                  ? <img src={t.customer_image} alt={t.customer_name} />
                  : <span>{t.customer_name.charAt(0).toUpperCase()}</span>}
              </div>
              <div className="t-admin-body">
                <div className="t-admin-header">
                  <strong>{t.customer_name}</strong>
                  <span className="t-stars">{'★'.repeat(t.rating)}{'☆'.repeat(5 - t.rating)}</span>
                </div>
                <p className="t-admin-content">{t.content.slice(0, 100)}{t.content.length > 100 ? '…' : ''}</p>
                <div className="t-admin-footer">
                  <span className={`status-badge ${t.is_active ? 'active' : 'inactive'}`}>
                    {t.is_active ? 'Visible' : 'Hidden'}
                  </span>
                  <div>
                    <button className="edit-btn" onClick={() => handleEdit(t)}>Edit</button>
                    <button className="delete-btn" onClick={() => handleDelete(t.id)}>Delete</button>
                  </div>
                </div>
              </div>
            </div>
          ))}
          {testimonials.length === 0 && <p className="empty-msg">No testimonials yet.</p>}
        </div>
      )}
    </div>
  );
};

// ─── Gallery Management View ──────────────────────────────────────────────────

const GALLERY_CATEGORIES = [
  { value: 'factory', label: 'Factory' },
  { value: 'products', label: 'Products' },
  { value: 'process', label: 'Process' },
  { value: 'team', label: 'Team' },
];

const GalleryManagementView = () => {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [currentImageUrl, setCurrentImageUrl] = useState(null);
  const [filterCat, setFilterCat] = useState('all');
  const [form, setForm] = useState({
    title: '', category: 'factory', is_active: true, image: null,
  });

  const fetchImages = () => {
    setLoading(true);
    adminAPI.getGallery().then((r) => setImages(r.data)).finally(() => setLoading(false));
  };
  useEffect(() => { fetchImages(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!editId && !form.image) { alert('Please select an image to upload.'); return; }
    setSaving(true);
    try {
      const payload = { ...form };
      if (!payload.image) delete payload.image;
      editId
        ? await adminAPI.updateGalleryImage(editId, payload)
        : await adminAPI.createGalleryImage(payload);
      fetchImages(); reset();
    } finally { setSaving(false); }
  };

  const reset = () => {
    setForm({ title: '', category: 'factory', is_active: true, image: null });
    setEditId(null); setShowForm(false); setCurrentImageUrl(null);
  };

  const handleEdit = (img) => {
    setForm({ title: img.title, category: img.category, is_active: img.is_active, image: null });
    setCurrentImageUrl(img.image || null);
    setEditId(img.id); setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this image?')) { await adminAPI.deleteGalleryImage(id); fetchImages(); }
  };

  const filtered = filterCat === 'all' ? images : images.filter((i) => i.category === filterCat);

  return (
    <div className="gallery-management-view">
      <div className="gallery-mgmt-header">
        <h1>Gallery</h1>
        <button className="add-new-btn" onClick={() => { reset(); setShowForm(true); }}>+ Upload Image</button>
      </div>

      <div className="category-filter-row">
        {[{ value: 'all', label: 'All' }, ...GALLERY_CATEGORIES].map((c) => (
          <button
            key={c.value}
            className={`filter-chip ${filterCat === c.value ? 'active' : ''}`}
            onClick={() => setFilterCat(c.value)}
          >
            {c.label}
          </button>
        ))}
      </div>

      {showForm && (
        <div className="form-modal">
          <div className="form-container">
            <h3>{editId ? 'Edit' : 'Upload'} Image</h3>
            <form onSubmit={handleSubmit}>
              <ImageUploadField
                label={editId ? 'Image (leave blank to keep current)' : 'Image *'}
                currentUrl={currentImageUrl}
                onFileSelect={(f) => setForm({ ...form, image: f })}
              />
              <div className="form-group">
                <label>Title *</label>
                <input value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })} required />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Category *</label>
                  <select value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}>
                    {GALLERY_CATEGORIES.map((c) => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group checkbox" style={{ paddingTop: 28 }}>
                  <label>
                    <input type="checkbox" checked={form.is_active}
                      onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />
                    Show publicly
                  </label>
                </div>
              </div>
              <div className="form-actions">
                <button type="submit" className="save-btn" disabled={saving}>
                  {saving ? 'Uploading…' : 'Save'}
                </button>
                <button type="button" className="cancel-btn" onClick={reset}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? <div className="loading">Loading…</div> : (
        <>
          <div className="gallery-admin-grid">
            {filtered.map((img) => (
              <div key={img.id} className={`gallery-admin-card ${!img.is_active ? 'hidden-card' : ''}`}>
                <div className="gallery-admin-thumb">
                  {img.image
                    ? <img src={img.image} alt={img.title} />
                    : <div className="no-img-placeholder">No image</div>}
                  {!img.is_active && <div className="hidden-overlay">Hidden</div>}
                </div>
                <div className="gallery-admin-info">
                  <span className="gallery-admin-title">{img.title}</span>
                  <span className="gallery-cat-badge">{img.category}</span>
                </div>
                <div className="gallery-admin-actions">
                  <button className="edit-btn" onClick={() => handleEdit(img)}>Edit</button>
                  <button className="delete-btn" onClick={() => handleDelete(img.id)}>Delete</button>
                </div>
              </div>
            ))}
          </div>
          {filtered.length === 0 && (
            <div className="empty-state-card">No images yet. Click "Upload Image" to add one.</div>
          )}
        </>
      )}
    </div>
  );
};

// ─── Company Info View ────────────────────────────────────────────────────────

const CompanyInfoView = () => {
  const [info, setInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({
    name: '', tagline: '', description: '', phone: '',
    email: '', address: '', working_hours: '', established_year: '',
    logo: null,
  });

  useEffect(() => {
    adminAPI.getCompanyInfo().then((r) => {
      const data = r.data[0] || null;
      setInfo(data);
      if (data) {
        setForm({
          name: data.name || '',
          tagline: data.tagline || '',
          description: data.description || '',
          phone: data.phone || '',
          email: data.email || '',
          address: data.address || '',
          working_hours: data.working_hours || '',
          established_year: data.established_year || '',
          logo: null,
        });
      }
    }).finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true); setSaved(false);
    try {
      const payload = { ...form };
      if (!payload.logo) delete payload.logo;
      if (info) {
        await adminAPI.updateCompanyInfo(info.id, payload);
      } else {
        await adminAPI.createCompanyInfo(payload);
      }
      // Refresh
      const r = await adminAPI.getCompanyInfo();
      setInfo(r.data[0] || null);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } finally { setSaving(false); }
  };

  if (loading) return <div className="loading">Loading…</div>;

  return (
    <div className="company-info-view">
      <h1>Company Info</h1>
      <p className="view-subtitle">This information appears on the public website (Home page, Contact section, footer).</p>

      {saved && <div className="success-message">Company info saved successfully!</div>}

      <form onSubmit={handleSubmit} className="entry-form">
        <div className="form-section">
          <h3>Branding</h3>
          <ImageUploadField
            label="Company Logo"
            currentUrl={info?.logo || null}
            onFileSelect={(f) => setForm({ ...form, logo: f })}
          />
          <div className="form-group">
            <label>Business Name *</label>
            <input value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </div>
          <div className="form-group">
            <label>Tagline</label>
            <input value={form.tagline}
              onChange={(e) => setForm({ ...form, tagline: e.target.value })}
              placeholder="e.g. Quality Remoulding — Miles of Trust" />
          </div>
          <div className="form-group">
            <label>About / Description *</label>
            <textarea rows="5" value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })} required />
          </div>
        </div>

        <div className="form-section">
          <h3>Contact Details</h3>
          <div className="form-row">
            <div className="form-group">
              <label>Phone *</label>
              <input value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })} required />
            </div>
            <div className="form-group">
              <label>Email *</label>
              <input type="email" value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })} required />
            </div>
          </div>
          <div className="form-group">
            <label>Address *</label>
            <textarea rows="3" value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })} required />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Working Hours</label>
              <input value={form.working_hours}
                onChange={(e) => setForm({ ...form, working_hours: e.target.value })}
                placeholder="e.g. Mon–Sat 9 AM – 7 PM" />
            </div>
            <div className="form-group">
              <label>Established Year</label>
              <input type="number" value={form.established_year}
                onChange={(e) => setForm({ ...form, established_year: e.target.value })} />
            </div>
          </div>
        </div>

        <button type="submit" className="submit-btn" disabled={saving}>
          {saving ? 'Saving…' : 'Save Company Info'}
        </button>
      </form>
    </div>
  );
};

// ─── Main Admin Dashboard ─────────────────────────────────────────────────────

const TABS = [
  { id: 'dashboard',    label: 'Dashboard' },
  { id: 'newentry',     label: '+ New Entry' },
  { id: 'alljobs',      label: 'All Jobs' },
  { id: 'overdue',      label: 'Overdue' },
  { id: 'progress',     label: 'In Progress' },
  { id: 'customers',    label: 'Customer Tyres' },
  { id: 'stock',        label: 'Godown Stock' },
  { id: 'ratecard',     label: 'Rate Card' },
  { id: 'tyresizes',    label: 'Tyre Sizes' },
  { id: 'gallery',      label: 'Gallery' },
  { id: 'testimonials', label: 'Testimonials' },
  { id: 'companyinfo',  label: 'Company Info' },
];

const AdminDashboard = () => {
  const { user, isAdmin, logout } = useAuth();
  const [tab, setTab] = useState('dashboard');
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    if (isAdmin) {
      dashboardAPI.getStats()
        .then((r) => setStats(r.data))
        .finally(() => setStatsLoading(false));
    }
  }, [isAdmin]);

  if (!user) return <Navigate to="/login" replace />;
  if (!isAdmin) return <Navigate to="/" replace />;

  const renderContent = () => {
    switch (tab) {
      case 'dashboard':    return <DashboardView stats={stats} loading={statsLoading} />;
      case 'alljobs':      return <AllJobsView />;
      case 'overdue':      return <OverdueView />;
      case 'progress':     return <InProgressView />;
      case 'customers':    return <CustomerTyresView />;
      case 'stock':        return <StockView />;
      case 'newentry':     return <NewEntryView />;
      case 'tyresizes':    return <TyreSizeManagementView />;
      case 'ratecard':     return <RateCardView />;
      case 'gallery':      return <GalleryManagementView />;
      case 'testimonials': return <TestimonialsManagementView />;
      case 'companyinfo':  return <CompanyInfoView />;
      default:             return <DashboardView stats={stats} loading={statsLoading} />;
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
          {TABS.map((t) => (
            <button key={t.id} className={tab === t.id ? 'active' : ''} onClick={() => setTab(t.id)}>
              {t.label}
              {t.id === 'overdue' && stats?.overdue_jobs > 0 && (
                <span className="nav-badge">{stats.overdue_jobs}</span>
              )}
            </button>
          ))}
        </nav>
        <div className="admin-footer">
          <p>{user?.first_name || user?.username}</p>
          <button onClick={logout} className="logout-btn">Logout</button>
        </div>
      </div>
      <div className="admin-content">{renderContent()}</div>
    </div>
  );
};

export default AdminDashboard;
