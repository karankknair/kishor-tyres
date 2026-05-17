import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { publicAPI } from '../services/api';
import './Portfolio.css';

const CATEGORIES = [
  { id: 'all', label: 'All' },
  { id: 'factory', label: 'Factory' },
  { id: 'products', label: 'Products' },
  { id: 'process', label: 'Process' },
  { id: 'team', label: 'Team' },
];

// Placeholder items shown when no gallery images are uploaded yet
const PLACEHOLDERS = [
  { id: 1, title: 'Main Workshop Floor', category: 'factory', color: '#1a1a2e' },
  { id: 2, title: 'Buffing Machine', category: 'factory', color: '#2c3e50' },
  { id: 3, title: 'Pre-cure Tread Application', category: 'process', color: '#34495e' },
  { id: 4, title: 'Curing Autoclave', category: 'process', color: '#2c3e50' },
  { id: 5, title: 'Remoulded Tractor Tyres', category: 'products', color: '#1a1a2e' },
  { id: 6, title: 'Truck Tyre Collection', category: 'products', color: '#34495e' },
  { id: 7, title: 'Quality Inspection', category: 'process', color: '#2c3e50' },
  { id: 8, title: 'Team at Work', category: 'team', color: '#1a1a2e' },
  { id: 9, title: 'Finished JCB Tyre', category: 'products', color: '#34495e' },
  { id: 10, title: 'Storage Yard', category: 'factory', color: '#2c3e50' },
  { id: 11, title: 'Tread Pattern Library', category: 'products', color: '#1a1a2e' },
  { id: 12, title: 'Senior Technicians', category: 'team', color: '#34495e' },
];

const Portfolio = () => {
  const [gallery, setGallery] = useState([]);
  const [activeCategory, setActiveCategory] = useState('all');
  const [loading, setLoading] = useState(true);
  const [lightbox, setLightbox] = useState(null);

  useEffect(() => {
    publicAPI.getGallery()
      .then((res) => setGallery(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const items = gallery.length > 0 ? gallery : PLACEHOLDERS;
  const isPlaceholder = gallery.length === 0;

  const filtered =
    activeCategory === 'all'
      ? items
      : items.filter((i) => i.category === activeCategory);

  return (
    <div className="portfolio-page">
      <nav className="breadcrumb-nav">
        <Link to="/">Home</Link>
        <span> / </span>
        <span>Portfolio</span>
      </nav>

      <header className="portfolio-hero">
        <h1>Our Portfolio</h1>
        <p>A glimpse into our workshop, processes, and finished products</p>
      </header>

      <div className="portfolio-container">
        <div className="category-filters">
          {CATEGORIES.map((c) => (
            <button
              key={c.id}
              className={`filter-btn ${activeCategory === c.id ? 'active' : ''}`}
              onClick={() => setActiveCategory(c.id)}
            >
              {c.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="loading-state">Loading gallery…</div>
        ) : (
          <>
            {isPlaceholder && (
              <div className="placeholder-notice">
                Gallery images will appear here once uploaded from the admin panel.
                Showing placeholder layout.
              </div>
            )}

            <div className="gallery-masonry">
              {filtered.map((item, idx) => (
                <div
                  key={item.id}
                  className={`gallery-card span-${(idx % 5 === 0) ? 'wide' : 'normal'}`}
                  onClick={() => setLightbox(item)}
                >
                  {item.image ? (
                    <img src={item.image} alt={item.title} />
                  ) : (
                    <div
                      className="placeholder-img"
                      style={{ background: item.color || '#2c3e50' }}
                    >
                      <span className="placeholder-icon">📷</span>
                    </div>
                  )}
                  <div className="gallery-overlay">
                    <span className="gallery-title">{item.title}</span>
                    <span className="gallery-cat">{item.category}</span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div className="lightbox" onClick={() => setLightbox(null)}>
          <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
            {lightbox.image ? (
              <img src={lightbox.image} alt={lightbox.title} />
            ) : (
              <div
                className="lightbox-placeholder"
                style={{ background: lightbox.color || '#2c3e50' }}
              >
                <span>📷</span>
                <p>{lightbox.title}</p>
              </div>
            )}
            <div className="lightbox-info">
              <h3>{lightbox.title}</h3>
              <span className="lightbox-cat">{lightbox.category}</span>
            </div>
            <button className="lightbox-close" onClick={() => setLightbox(null)}>✕</button>
          </div>
        </div>
      )}

      <section className="portfolio-cta">
        <div className="portfolio-cta-inner">
          <h3>Interested in our work?</h3>
          <p>Contact us for a workshop visit or to discuss your remoulding requirements.</p>
          <Link to="/#contact" className="btn-primary">Contact Us</Link>
        </div>
      </section>
    </div>
  );
};

export default Portfolio;
