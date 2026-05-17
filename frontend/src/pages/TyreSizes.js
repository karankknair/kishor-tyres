import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { publicAPI } from '../services/api';
import './TyreSizes.css';

const CATEGORY_ICONS = {
  'Tractor': '🚜',
  'Earth Mover': '🏗️',
  'Truck': '🚛',
  'Truck/Bus Tubeless': '🚌',
  'Tempo': '🚐',
  'Mini Truck': '🛻',
};

const TyreSizes = () => {
  const [grouped, setGrouped] = useState({});
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    publicAPI.getTyreSizesGrouped()
      .then((res) => {
        setGrouped(res.data);
        const first = Object.keys(res.data)[0];
        if (first) setActiveCategory(first);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const categories = Object.keys(grouped);

  const filteredSizes = activeCategory
    ? (grouped[activeCategory] || []).filter((s) =>
        s.size.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : [];

  return (
    <div className="tyre-sizes-page">
      <nav className="breadcrumb-nav">
        <Link to="/">Home</Link>
        <span> / </span>
        <span>Tyre Sizes</span>
      </nav>

      <header className="sizes-hero">
        <h1>Available Tyre Sizes</h1>
        <p>All sizes we remould — grouped by vehicle category</p>
      </header>

      {loading ? (
        <div className="loading-state">Loading sizes…</div>
      ) : (
        <div className="sizes-layout">
          <aside className="category-sidebar">
            <h3>Vehicle Categories</h3>
            {categories.map((cat) => (
              <button
                key={cat}
                className={`category-btn ${activeCategory === cat ? 'active' : ''}`}
                onClick={() => { setActiveCategory(cat); setSearchTerm(''); }}
              >
                <span className="cat-icon">{CATEGORY_ICONS[cat] || '🔧'}</span>
                <span className="cat-name">{cat}</span>
                <span className="cat-count">{grouped[cat].length}</span>
              </button>
            ))}
          </aside>

          <main className="sizes-content">
            {activeCategory && (
              <>
                <div className="sizes-content-header">
                  <h2>
                    {CATEGORY_ICONS[activeCategory]} {activeCategory}
                  </h2>
                  <input
                    type="text"
                    className="size-search"
                    placeholder="Filter sizes…"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>

                <div className="sizes-grid">
                  {filteredSizes.length === 0 ? (
                    <p className="no-results">No sizes match your filter.</p>
                  ) : (
                    filteredSizes.map((s) => (
                      <div key={s.id} className="size-card">
                        <div className="size-display">{s.size}</div>
                        {s.description && (
                          <p className="size-description">{s.description}</p>
                        )}
                        <div className="size-status active">Available</div>
                      </div>
                    ))
                  )}
                </div>

                <div className="sizes-note">
                  <span className="note-icon">ℹ️</span>
                  Don't see your size? <Link to="/#contact">Contact us</Link> — we may still be able to help.
                </div>
              </>
            )}
          </main>
        </div>
      )}

      <section className="sizes-cta">
        <div className="sizes-cta-inner">
          <h3>Need a price for your tyre size?</h3>
          <p>Contact us or visit our workshop for a free assessment and quote.</p>
          <Link to="/#contact" className="btn-primary">Get a Quote</Link>
        </div>
      </section>
    </div>
  );
};

export default TyreSizes;
