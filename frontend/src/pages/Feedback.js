import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { publicAPI } from '../services/api';
import './Feedback.css';

const STAR_COLORS = { 5: '#f59e0b', 4: '#f59e0b', 3: '#94a3b8', 2: '#ef4444', 1: '#ef4444' };

const StarRating = ({ rating }) => (
  <div className="star-rating">
    {[1, 2, 3, 4, 5].map((s) => (
      <span key={s} style={{ color: s <= rating ? STAR_COLORS[rating] : '#e2e8f0', fontSize: 18 }}>
        ★
      </span>
    ))}
  </div>
);

const Feedback = () => {
  const [testimonials, setTestimonials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState(0);

  useEffect(() => {
    publicAPI.getTestimonials()
      .then((res) => setTestimonials(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = filter === 0
    ? testimonials
    : testimonials.filter((t) => t.rating === filter);

  const avgRating =
    testimonials.length > 0
      ? (testimonials.reduce((sum, t) => sum + t.rating, 0) / testimonials.length).toFixed(1)
      : '—';

  const ratingCounts = [5, 4, 3, 2, 1].map((r) => ({
    rating: r,
    count: testimonials.filter((t) => t.rating === r).length,
    pct: testimonials.length
      ? Math.round((testimonials.filter((t) => t.rating === r).length / testimonials.length) * 100)
      : 0,
  }));

  return (
    <div className="feedback-page">
      <nav className="breadcrumb-nav">
        <Link to="/">Home</Link>
        <span> / </span>
        <span>Customer Feedback</span>
      </nav>

      <header className="feedback-hero">
        <h1>Customer Feedback</h1>
        <p>What our customers say about Kishor Tyres</p>
      </header>

      <div className="feedback-container">
        {!loading && testimonials.length > 0 && (
          <div className="rating-summary">
            <div className="avg-rating">
              <span className="avg-number">{avgRating}</span>
              <StarRating rating={Math.round(parseFloat(avgRating))} />
              <span className="review-count">{testimonials.length} reviews</span>
            </div>

            <div className="rating-bars">
              {ratingCounts.map(({ rating, count, pct }) => (
                <div key={rating} className="rating-bar-row">
                  <button
                    className={`star-filter-btn ${filter === rating ? 'active' : ''}`}
                    onClick={() => setFilter(filter === rating ? 0 : rating)}
                  >
                    {rating}★
                  </button>
                  <div className="bar-track">
                    <div className="bar-fill" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="bar-count">{count}</span>
                </div>
              ))}
            </div>

            {filter > 0 && (
              <button className="clear-filter" onClick={() => setFilter(0)}>
                Clear filter
              </button>
            )}
          </div>
        )}

        {loading ? (
          <div className="loading-state">Loading reviews…</div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            {testimonials.length === 0
              ? 'No reviews yet. Be the first to share your experience!'
              : 'No reviews match this rating filter.'}
          </div>
        ) : (
          <div className="testimonials-grid">
            {filtered.map((t) => (
              <div key={t.id} className={`testimonial-card rating-${t.rating}`}>
                <div className="t-header">
                  <div className="t-avatar">{t.customer_name.charAt(0).toUpperCase()}</div>
                  <div className="t-meta">
                    <h4>{t.customer_name}</h4>
                    <StarRating rating={t.rating} />
                  </div>
                </div>
                <p className="t-content">"{t.content}"</p>
                <span className="t-date">
                  {new Date(t.created_at).toLocaleDateString('en-IN', {
                    day: 'numeric', month: 'short', year: 'numeric',
                  })}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <section className="feedback-cta">
        <div className="feedback-cta-inner">
          <h3>Happy with our service?</h3>
          <p>Visit us and share your experience. Your feedback helps us serve better.</p>
          <Link to="/#contact" className="btn-primary">Contact Us</Link>
        </div>
      </section>
    </div>
  );
};

export default Feedback;
