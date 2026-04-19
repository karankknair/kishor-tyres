import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { publicAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import './Home.css';

const Home = () => {
  const { user } = useAuth();
  const [companyInfo, setCompanyInfo] = useState(null);
  const [testimonials, setTestimonials] = useState([]);
  const [gallery, setGallery] = useState([]);
  const [availableTyres, setAvailableTyres] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [companyRes, testimonialsRes, galleryRes, tyresRes] = await Promise.all([
        publicAPI.getCompanyInfo(),
        publicAPI.getTestimonials(),
        publicAPI.getGallery(),
        publicAPI.getAvailableTyres(),
      ]);

      setCompanyInfo(companyRes.data);
      setTestimonials(testimonialsRes.data);
      setGallery(galleryRes.data);
      setAvailableTyres(tyresRes.data);
    } catch (err) {
      console.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading-container">Loading...</div>;
  }

  return (
    <div className="home-page">
      <Header user={user} />
      <HeroSection companyInfo={companyInfo} />
      <AboutSection companyInfo={companyInfo} />
      <AvailableTyresSection tyres={availableTyres} />
      <GallerySection gallery={gallery} />
      <TestimonialsSection testimonials={testimonials} />
      <ContactSection companyInfo={companyInfo} />
      <Footer companyInfo={companyInfo} />
    </div>
  );
};

// Header Component
const Header = ({ user }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="site-header">
      <div className="header-container">
        <div className="logo">
          <Link to="/">
            <span className="logo-icon">🚗</span>
            <span className="logo-text">Kishor Tyres</span>
          </Link>
        </div>

        <nav className={`main-nav ${isMenuOpen ? 'open' : ''}`}>
          <a href="#about">About</a>
          <a href="#tyres">Tyres</a>
          <a href="#gallery">Gallery</a>
          <a href="#testimonials">Testimonials</a>
          <a href="#contact">Contact</a>
        </nav>

        <div className="header-actions">
          {user ? (
            <Link to={user.user_type === 'admin' ? '/admin' : '/profile'} className="btn-login">
              My Account
            </Link>
          ) : (
            <Link to="/login" className="btn-login">
              Login
            </Link>
          )}
          <button
            className="menu-toggle"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            ☰
          </button>
        </div>
      </div>
    </header>
  );
};

// Hero Section
const HeroSection = ({ companyInfo }) => {
  return (
    <section className="hero-section">
      <div className="hero-content">
        <h1>{companyInfo?.name || 'Kishor Tyres'}</h1>
        <p className="hero-tagline">{companyInfo?.tagline || 'Professional Tyre Remoulding Services'}</p>
        <p className="hero-description">
          {companyInfo?.description || 'Quality tyre remoulding services since 1995. We give old tyres a new life.'}
        </p>
        <div className="hero-cta">
          <a href="#contact" className="btn-primary">Get a Quote</a>
          <a href="#tyres" className="btn-secondary">View Tyres</a>
        </div>
      </div>
      <div className="hero-stats">
        <div className="stat">
          <span className="stat-number">25+</span>
          <span className="stat-label">Years Experience</span>
        </div>
        <div className="stat">
          <span className="stat-number">50K+</span>
          <span className="stat-label">Tyres Remoulded</span>
        </div>
        <div className="stat">
          <span className="stat-number">10K+</span>
          <span className="stat-label">Happy Customers</span>
        </div>
      </div>
    </section>
  );
};

// About Section
const AboutSection = ({ companyInfo }) => {
  return (
    <section id="about" className="about-section">
      <div className="section-container">
        <div className="about-content">
          <div className="about-text">
            <h2>About Kishor Tyres</h2>
            <p>
              {companyInfo?.description ||
                'Kishor Tyres has been a pioneer in tyre remoulding services since 1995. ' +
                'We specialize in giving old tyres a new life using state-of-the-art technology.'}
            </p>
            <div className="features-grid">
              <div className="feature">
                <span className="feature-icon">✓</span>
                <div>
                  <h4>Quality Assurance</h4>
                  <p>Every remoulded tyre undergoes rigorous testing</p>
                </div>
              </div>
              <div className="feature">
                <span className="feature-icon">✓</span>
                <div>
                  <h4>Expert Technicians</h4>
                  <p>Over 25 years of industry experience</p>
                </div>
              </div>
              <div className="feature">
                <span className="feature-icon">✓</span>
                <div>
                  <h4>Cost Effective</h4>
                  <p>Save up to 50% compared to new tyres</p>
                </div>
              </div>
              <div className="feature">
                <span className="feature-icon">✓</span>
                <div>
                  <h4>Eco-Friendly</h4>
                  <p>Reduce waste and protect environment</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

// Available Tyres Section
const AvailableTyresSection = ({ tyres }) => {
  const [selectedSize, setSelectedSize] = useState(null);

  return (
    <section id="tyres" className="tyres-section">
      <div className="section-container">
        <h2>Available Remoulded Tyres</h2>
        <p className="section-subtitle">
          Quality remoulded tyres at affordable prices
        </p>

        {tyres.length === 0 ? (
          <div className="no-tyres-message">
            <p>No tyres available at the moment. Please contact us for more information.</p>
          </div>
        ) : (
          <>
            <div className="tyres-grid">
              {tyres.map((tyre) => (
                <div
                  key={tyre.id}
                  className={`tyre-card ${selectedSize === tyre.id ? 'selected' : ''}`}
                  onClick={() => setSelectedSize(selectedSize === tyre.id ? null : tyre.id)}
                >
                  <div className="tyre-image-placeholder">
                    <span>🛞</span>
                  </div>
                  <div className="tyre-info">
                    <h3>{tyre.size}</h3>
                    <p className="tyre-description">{tyre.description}</p>
                    <div className="tyre-price">
                      <span className="price">₹{tyre.price}</span>
                      <span className="unit">/tyre</span>
                    </div>
                    <button className="btn-inquire">
                      Inquire Now
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="tyre-sizes-info">
              <h3>All Tyre Sizes Available</h3>
              <div className="sizes-tags">
                {['145/70 R12', '155/70 R13', '165/65 R14', '175/65 R14', '185/65 R15', '195/65 R15', '205/55 R16', '215/55 R17', '225/45 R17', '235/45 R18'].map((size) => (
                  <span key={size} className="size-tag">{size}</span>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </section>
  );
};

// Gallery Section
const GallerySection = ({ gallery }) => {
  const [selectedCategory, setSelectedCategory] = useState('all');

  const categories = [
    { id: 'all', label: 'All' },
    { id: 'factory', label: 'Factory' },
    { id: 'products', label: 'Products' },
    { id: 'process', label: 'Process' },
    { id: 'team', label: 'Team' },
  ];

  const filteredGallery = selectedCategory === 'all'
    ? gallery
    : gallery.filter((item) => item.category === selectedCategory);

  return (
    <section id="gallery" className="gallery-section">
      <div className="section-container">
        <h2>Our Gallery</h2>
        <p className="section-subtitle">See our work in action</p>

        <div className="gallery-filters">
          {categories.map((cat) => (
            <button
              key={cat.id}
              className={selectedCategory === cat.id ? 'active' : ''}
              onClick={() => setSelectedCategory(cat.id)}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <div className="gallery-grid">
          {filteredGallery.length > 0 ? (
            filteredGallery.map((item) => (
              <div key={item.id} className="gallery-item">
                <div className="gallery-image-placeholder">
                  <span>📷 {item.title}</span>
                </div>
              </div>
            ))
          ) : (
            <div className="gallery-placeholder">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="gallery-item placeholder">
                  <div className="gallery-image-placeholder">
                    <span>📷 Gallery Image {i}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

// Testimonials Section
const TestimonialsSection = ({ testimonials }) => {
  const renderStars = (rating) => {
    return '★'.repeat(rating) + '☆'.repeat(5 - rating);
  };

  return (
    <section id="testimonials" className="testimonials-section">
      <div className="section-container">
        <h2>What Our Customers Say</h2>
        <p className="section-subtitle">Trusted by thousands of satisfied customers</p>

        <div className="testimonials-grid">
          {testimonials.length > 0 ? (
            testimonials.map((testimonial) => (
              <div key={testimonial.id} className="testimonial-card">
                <div className="testimonial-header">
                  <div className="testimonial-avatar">
                    {testimonial.customer_name.charAt(0).toUpperCase()}
                  </div>
                  <div className="testimonial-info">
                    <h4>{testimonial.customer_name}</h4>
                    <div className="rating">{renderStars(testimonial.rating)}</div>
                  </div>
                </div>
                <p className="testimonial-content">{testimonial.content}</p>
              </div>
            ))
          ) : (
            [
              {
                name: 'Rahul Sharma',
                rating: 5,
                content: 'Excellent service! My tyres look brand new. The quality of remoulding is outstanding and the price is very reasonable.',
              },
              {
                name: 'Priya Patel',
                rating: 5,
                content: 'Professional team and quick turnaround time. Have been using Kishor Tyres for years. Highly recommended!',
              },
              {
                name: 'Amit Kumar',
                rating: 4,
                content: 'Great experience. The staff is knowledgeable and helped me choose the right tyres for my vehicle.',
              },
            ].map((t, i) => (
              <div key={i} className="testimonial-card">
                <div className="testimonial-header">
                  <div className="testimonial-avatar">{t.name.charAt(0)}</div>
                  <div className="testimonial-info">
                    <h4>{t.name}</h4>
                    <div className="rating">{renderStars(t.rating)}</div>
                  </div>
                </div>
                <p className="testimonial-content">{t.content}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
};

// Contact Section
const ContactSection = ({ companyInfo }) => {
  return (
    <section id="contact" className="contact-section">
      <div className="section-container">
        <h2>Contact Us</h2>
        <p className="section-subtitle">Get in touch for quotes and inquiries</p>

        <div className="contact-grid">
          <div className="contact-info">
            <div className="contact-item">
              <span className="icon">📍</span>
              <div>
                <h4>Address</h4>
                <p>{companyInfo?.address || '123 Industrial Area, Mumbai-Pune Highway, Maharashtra 410206'}</p>
              </div>
            </div>

            <div className="contact-item">
              <span className="icon">📞</span>
              <div>
                <h4>Phone</h4>
                <p>{companyInfo?.phone || '+91 98765 43210'}</p>
              </div>
            </div>

            <div className="contact-item">
              <span className="icon">✉️</span>
              <div>
                <h4>Email</h4>
                <p>{companyInfo?.email || 'info@kishortyres.com'}</p>
              </div>
            </div>

            <div className="contact-item">
              <span className="icon">🕐</span>
              <div>
                <h4>Working Hours</h4>
                <p>{companyInfo?.working_hours || 'Monday - Saturday: 9:00 AM - 7:00 PM'}</p>
              </div>
            </div>
          </div>

          <form className="contact-form">
            <div className="form-row">
              <input type="text" placeholder="Your Name" required />
              <input type="email" placeholder="Your Email" required />
            </div>
            <input type="tel" placeholder="Phone Number" />
            <textarea placeholder="Your Message" rows="5" required></textarea>
            <button type="submit" className="btn-submit">Send Message</button>
          </form>
        </div>
      </div>
    </section>
  );
};

// Footer
const Footer = ({ companyInfo }) => {
  return (
    <footer className="site-footer">
      <div className="footer-container">
        <div className="footer-brand">
          <h3>{companyInfo?.name || 'Kishor Tyres'}</h3>
          <p>{companyInfo?.tagline || 'Professional Tyre Remoulding Services'}</p>
        </div>

        <div className="footer-links">
          <div className="footer-column">
            <h4>Quick Links</h4>
            <a href="#about">About</a>
            <a href="#tyres">Tyres</a>
            <a href="#gallery">Gallery</a>
            <a href="#contact">Contact</a>
          </div>

          <div className="footer-column">
            <h4>Services</h4>
            <a href="#">Tyre Remoulding</a>
            <a href="#">Tyre Sales</a>
            <a href="#">Tyre Repair</a>
            <a href="#">Wheel Alignment</a>
          </div>

          <div className="footer-column">
            <h4>Contact</h4>
            <p>📞 {companyInfo?.phone || '+91 98765 43210'}</p>
            <p>✉️ {companyInfo?.email || 'info@kishortyres.com'}</p>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <p>© {new Date().getFullYear()} {companyInfo?.name || 'Kishor Tyres'}. All rights reserved.</p>
      </div>
    </footer>
  );
};

export default Home;
