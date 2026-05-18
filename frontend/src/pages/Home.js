import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { publicAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import './Home.css';

// ── Hooks ─────────────────────────────────────────────────────────────────────

const useInView = (threshold = 0.15) => {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setInView(true); obs.disconnect(); } },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, inView];
};

const useCounter = (target, active, duration = 1800) => {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!active) return;
    const steps = 60;
    const inc = target / steps;
    let cur = 0; let t = 0;
    const id = setInterval(() => {
      t++;
      cur = Math.min(Math.round(inc * t), target);
      setVal(cur);
      if (cur >= target) clearInterval(id);
    }, duration / steps);
    return () => clearInterval(id);
  }, [active, target, duration]);
  return val;
};

// ── SVG Tyre ──────────────────────────────────────────────────────────────────

const TyreSVG = ({ className = '' }) => {
  const cx = 120, cy = 120;
  // 18 angled tread lugs — offset inner/outer edge for a real lug tyre look
  const lugs = Array.from({ length: 18 }, (_, i) => {
    const base = (i * 20) * Math.PI / 180;
    const skew = 4 * Math.PI / 180;
    const r1 = 88, r2 = 112;
    const wa = 7 * Math.PI / 180;
    return [
      `${cx + r1 * Math.cos(base - wa)},${cy + r1 * Math.sin(base - wa)}`,
      `${cx + r2 * Math.cos(base - wa + skew)},${cy + r2 * Math.sin(base - wa + skew)}`,
      `${cx + r2 * Math.cos(base + wa + skew)},${cy + r2 * Math.sin(base + wa + skew)}`,
      `${cx + r1 * Math.cos(base + wa)},${cy + r1 * Math.sin(base + wa)}`,
    ].join(' ');
  });

  return (
    <svg className={className} viewBox="0 0 240 240" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Outer tyre body */}
      <circle cx={cx} cy={cy} r="116" fill="#1A1A1A" />
      {/* Tyre shoulder ring */}
      <circle cx={cx} cy={cy} r="116" fill="none" stroke="#2A2A2A" strokeWidth="6" />
      {/* Tread lugs — uniform dark, angled like real lugs */}
      {lugs.map((pts, i) => (
        <polygon key={i} points={pts} fill="#272727" stroke="#111" strokeWidth="0.8" />
      ))}
      {/* Sidewall */}
      <circle cx={cx} cy={cy} r="83" fill="#111111" />
      {/* Sidewall text ring (decorative) */}
      <circle cx={cx} cy={cy} r="83" fill="none" stroke="#1E1E1E" strokeWidth="3" />
      {/* Rim outer ring */}
      <circle cx={cx} cy={cy} r="72" fill="#181818" stroke="#F5A623" strokeWidth="2.5" />
      {/* Rim inner ring */}
      <circle cx={cx} cy={cy} r="50" fill="none" stroke="#2A2A2A" strokeWidth="1" />
      {/* 5 spokes — tapered with highlight */}
      {Array.from({ length: 5 }, (_, i) => {
        const a = (i * 72 - 90) * Math.PI / 180;
        const x1 = cx + 25 * Math.cos(a), y1 = cy + 25 * Math.sin(a);
        const x2 = cx + 68 * Math.cos(a), y2 = cy + 68 * Math.sin(a);
        return (
          <g key={i}>
            <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#F5A623" strokeWidth="12" strokeLinecap="round" />
            <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#FFD166" strokeWidth="3" strokeLinecap="round" opacity="0.35" />
          </g>
        );
      })}
      {/* Hub */}
      <circle cx={cx} cy={cy} r="23" fill="#111" stroke="#F5A623" strokeWidth="2.5" />
      <circle cx={cx} cy={cy} r="13" fill="#F5A623" />
      <circle cx={cx} cy={cy} r="5" fill="#111" />
      {/* 5 hub bolts */}
      {Array.from({ length: 5 }, (_, i) => {
        const a = (i * 72 - 90) * Math.PI / 180;
        return <circle key={i} cx={cx + 18 * Math.cos(a)} cy={cy + 18 * Math.sin(a)} r="2.2" fill="#0D0D0D" />;
      })}
    </svg>
  );
};

// ── SVG Remoulding Animation ──────────────────────────────────────────────────

const RemouldinAnimationSVG = ({ className = '' }) => {
  const cx = 120, cy = 120;
  const numTread = 20;

  const treads = Array.from({ length: numTread }, (_, i) => {
    const base = (i * (360 / numTread)) * Math.PI / 180;
    const skew = 4 * Math.PI / 180;
    const r1 = 87, r2 = 113;
    const wa = 7.5 * Math.PI / 180;
    const pts = [
      `${cx + r1 * Math.cos(base - wa)},${cy + r1 * Math.sin(base - wa)}`,
      `${cx + r2 * Math.cos(base - wa + skew)},${cy + r2 * Math.sin(base - wa + skew)}`,
      `${cx + r2 * Math.cos(base + wa + skew)},${cy + r2 * Math.sin(base + wa + skew)}`,
      `${cx + r1 * Math.cos(base + wa)},${cy + r1 * Math.sin(base + wa)}`,
    ].join(' ');
    return { pts, delay: (i * (4 / numTread)).toFixed(2) };
  });

  return (
    <svg className={className} viewBox="0 0 240 240" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Outer heat glow ring */}
      <circle cx={cx} cy={cy} r="118" fill="none" stroke="#F5A623" strokeWidth="3" className="remould-outer-glow" />

      {/* Tyre body */}
      <circle cx={cx} cy={cy} r="116" fill="#1A1A1A" />

      {/* Raw rubber compound band */}
      <circle cx={cx} cy={cy} r="100" fill="none" stroke="#1D1D1D" strokeWidth="26" />

      {/* Rotating press group */}
      <g className="press-group">
        {/* Main press arc */}
        <circle cx={cx} cy={cy} r="102" fill="none" stroke="#F5A623" strokeWidth="4"
                strokeDasharray="55 586" />
        {/* Press glow diffuse */}
        <circle cx={cx} cy={cy} r="102" fill="none" stroke="#F5A623" strokeWidth="14"
                strokeDasharray="30 611" opacity="0.2" />
        {/* Heat shimmer lines at press contact point */}
        <line x1={cx + 88} y1={cy} x2={cx + 96} y2={cy} stroke="#FFD166" strokeWidth="2" opacity="0.85" />
        <line x1={cx + 110} y1={cy} x2={cx + 119} y2={cy} stroke="#FF8C00" strokeWidth="1.5" opacity="0.6" />
      </g>

      {/* Tread blocks — flash gold as the press passes */}
      {treads.map((t, i) => (
        <polygon
          key={i}
          points={t.pts}
          fill="#272727"
          stroke="#111"
          strokeWidth="0.8"
          className="tread-stamp"
          style={{ animationDelay: `-${t.delay}s` }}
        />
      ))}

      {/* Sidewall */}
      <circle cx={cx} cy={cy} r="83" fill="#111111" />
      <circle cx={cx} cy={cy} r="83" fill="none" stroke="#1E1E1E" strokeWidth="3" />

      {/* Rim outer ring */}
      <circle cx={cx} cy={cy} r="72" fill="#181818" stroke="#F5A623" strokeWidth="2.5" />
      <circle cx={cx} cy={cy} r="50" fill="none" stroke="#2A2A2A" strokeWidth="1" />

      {/* 5 spokes */}
      {Array.from({ length: 5 }, (_, i) => {
        const a = (i * 72 - 90) * Math.PI / 180;
        const x1 = cx + 25 * Math.cos(a), y1 = cy + 25 * Math.sin(a);
        const x2 = cx + 68 * Math.cos(a), y2 = cy + 68 * Math.sin(a);
        return (
          <g key={i}>
            <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#F5A623" strokeWidth="12" strokeLinecap="round" />
            <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#FFD166" strokeWidth="3" strokeLinecap="round" opacity="0.35" />
          </g>
        );
      })}

      {/* Hub */}
      <circle cx={cx} cy={cy} r="23" fill="#111" stroke="#F5A623" strokeWidth="2.5" />
      <circle cx={cx} cy={cy} r="13" fill="#F5A623" />
      <circle cx={cx} cy={cy} r="5" fill="#111" />

      {/* 5 hub bolts */}
      {Array.from({ length: 5 }, (_, i) => {
        const a = (i * 72 - 90) * Math.PI / 180;
        return <circle key={i} cx={cx + 18 * Math.cos(a)} cy={cy + 18 * Math.sin(a)} r="2.2" fill="#0D0D0D" />;
      })}
    </svg>
  );
};

// ── Header ────────────────────────────────────────────────────────────────────

const Header = ({ user }) => {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', fn);
    return () => window.removeEventListener('scroll', fn);
  }, []);

  const close = () => setMenuOpen(false);

  return (
    <header className={`site-header${scrolled ? ' scrolled' : ''}`}>
      <div className="header-inner">
        <Link to="/" className="logo-link" onClick={close}>
          <div className="logo-pill">
            <span className="logo-wordmark">
              KISH
              <span className="logo-tyre-wrap">
                <svg viewBox="0 0 28 28" className="logo-tyre-svg">
                  <circle cx="14" cy="14" r="13" fill="#1A1A1A" />
                  {Array.from({ length: 14 }, (_, i) => {
                    const a = (i * (360/14)) * Math.PI / 180;
                    const b = (i * (360/14) + 16) * Math.PI / 180;
                    const r1 = 9.5, r2 = 13;
                    const pts = [
                      `${14 + r1 * Math.cos(a)},${14 + r1 * Math.sin(a)}`,
                      `${14 + r2 * Math.cos(a)},${14 + r2 * Math.sin(a)}`,
                      `${14 + r2 * Math.cos(b)},${14 + r2 * Math.sin(b)}`,
                      `${14 + r1 * Math.cos(b)},${14 + r1 * Math.sin(b)}`,
                    ].join(' ');
                    return <polygon key={i} points={pts} fill="#D4860A" />;
                  })}
                  <circle cx="14" cy="14" r="9" fill="#F5A623" />
                  <circle cx="14" cy="14" r="7" fill="#1A1A1A" stroke="#0D0D0D" strokeWidth="0.5" />
                  {Array.from({ length: 5 }, (_, i) => {
                    const a = (i * 72 - 90) * Math.PI / 180;
                    return (
                      <line key={i}
                        x1={14 + 2.5 * Math.cos(a)} y1={14 + 2.5 * Math.sin(a)}
                        x2={14 + 6.5 * Math.cos(a)} y2={14 + 6.5 * Math.sin(a)}
                        stroke="#F5A623" strokeWidth="1.6" strokeLinecap="round" />
                    );
                  })}
                  <circle cx="14" cy="14" r="2.5" fill="#0D0D0D" />
                  <circle cx="14" cy="14" r="1" fill="#F5A623" />
                </svg>
              </span>
              R
            </span>
            <span className="logo-tagline">360° tyre care solutions</span>
          </div>
        </Link>

        <nav className={`main-nav${menuOpen ? ' open' : ''}`}>
          <a href="#about" onClick={close}>About</a>
          <Link to="/services" onClick={close}>Services</Link>
          <a href="#tyre-sizes" onClick={close}>Tyre Sizes</a>
          <a href="#gallery" onClick={close}>Gallery</a>
          <a href="#testimonials" onClick={close}>Reviews</a>
          <a href="#contact" onClick={close}>Contact</a>
        </nav>

        <div className="header-right">
          {user ? (
            <Link
              to={(user.user_type === 'admin' || user.is_staff) ? '/admin' : '/profile'}
              className="btn-account"
              onClick={close}
            >
              My Account
            </Link>
          ) : (
            <Link to="/login" className="btn-account" onClick={close}>Login</Link>
          )}
          <button
            className={`hamburger${menuOpen ? ' open' : ''}`}
            onClick={() => setMenuOpen(o => !o)}
            aria-label="Menu"
          >
            <span /><span /><span />
          </button>
        </div>
      </div>
    </header>
  );
};

// ── Hero ──────────────────────────────────────────────────────────────────────

const HeroSection = ({ companyInfo }) => {
  const [statsRef, statsInView] = useInView(0.3);
  const c1 = useCounter(50, statsInView);
  const c2 = useCounter(10000, statsInView);
  const c3 = useCounter(500, statsInView);

  return (
    <section className="hero-section">
      <div className="tread-bar"><div className="tread-track" /></div>

      <div className="hero-inner">
        <div className="hero-text">
          <p className="hero-eyebrow">Est. {companyInfo?.established_year || 1995} — Pandharpur, Maharashtra</p>
          <h1 className="hero-headline">
            KISHOR TYRE<br />
            <span className="gold">REMOULDING</span><br />
            WORKS
          </h1>
          <p className="hero-sub">360° Tyre Care Solutions</p>
          <p className="hero-desc">
            Premium pre-cure &amp; mold-cure remoulding for tractors, trucks, JCBs and more.
            Trusted quality by <strong>Kishor K Nair</strong> (B.E. Prod, MBA).
          </p>
          <div className="hero-btns">
            <a href="#contact" className="btn-gold pulse-glow">Get a Quote</a>
            <a href="#tyre-sizes" className="btn-outline">View Sizes</a>
          </div>
        </div>

        <div className="hero-visual">
          <div className="tyre-glow-ring" />
          <RemouldinAnimationSVG className="hero-tyre" />
        </div>
      </div>

      <div className="hero-stats" ref={statsRef}>
        <div className="stat-card">
          <span className="stat-num">{c1}+</span>
          <span className="stat-lbl">Years Experience</span>
        </div>
        <div className="stat-sep" />
        <div className="stat-card">
          <span className="stat-num">{c2 >= 10000 ? '10,000' : c2.toLocaleString()}+</span>
          <span className="stat-lbl">Tyres Remoulded</span>
        </div>
        <div className="stat-sep" />
        <div className="stat-card">
          <span className="stat-num">{c3}+</span>
          <span className="stat-lbl">Satisfied Clients</span>
        </div>
      </div>
    </section>
  );
};

// ── Why Choose Us ─────────────────────────────────────────────────────────────

const WHY_FEATURES = [
  { icon: '🏆', title: 'Proven Excellence', desc: '50+ years of trusted remoulding expertise delivering consistent quality.' },
  { icon: '⚙️', title: 'Advanced Technology', desc: 'State-of-the-art pre-cure and mold-cure systems for every tyre type.' },
  { icon: '⚡', title: 'Fast Turnaround', desc: 'Quick processing without compromising on quality or durability.' },
  { icon: '🌍', title: 'Wide Coverage', desc: 'Serving farmers, fleet owners and contractors across Maharashtra.' },
];

const WhySection = () => {
  const [ref, inView] = useInView(0.1);
  return (
    <section id="about" className="why-section">
      <div className="section-wrap">
        <div className="section-head">
          <h2 className="section-title">Why Choose Us</h2>
          <div className="section-rule" />
        </div>
        <p className="section-sub">Built on trust, quality and decades of expertise</p>
        <div className="features-grid" ref={ref}>
          {WHY_FEATURES.map((f, i) => (
            <div
              key={i}
              className={`feature-card${inView ? ' visible' : ''}`}
              style={{ transitionDelay: `${i * 0.1}s` }}
            >
              <span className="feat-icon">{f.icon}</span>
              <h3 className="feat-title">{f.title}</h3>
              <p className="feat-desc">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// ── Tyre Sizes ────────────────────────────────────────────────────────────────

const TAB_LABELS = {
  tractor: 'Tractor',
  earth_mover: 'Earth Mover',
  truck: 'Truck',
  truck_bus_tubeless: 'Truck Tubeless',
  tempo: 'Tempo',
  mini_truck: 'Mini Truck',
};

const TyreSizesSection = () => {
  const [grouped, setGrouped] = useState({});
  const [activeTab, setActiveTab] = useState('');
  const [ref, inView] = useInView(0.1);

  useEffect(() => {
    publicAPI.getTyreSizesGrouped()
      .then(res => {
        const data = res.data;
        let groups = {};
        if (Array.isArray(data)) {
          data.forEach(t => {
            const cat = t.vehicle_category;
            if (!groups[cat]) groups[cat] = [];
            groups[cat].push(t.size);
          });
        } else {
          groups = data;
        }
        setGrouped(groups);
        const first = Object.keys(groups)[0];
        if (first) setActiveTab(first);
      })
      .catch(() => {});
  }, []);

  const tabs = Object.keys(grouped);
  const sizes = grouped[activeTab] || [];

  return (
    <section id="tyre-sizes" className="sizes-section">
      <div className="section-wrap">
        <div className="section-head">
          <h2 className="section-title">Available Tyre Sizes</h2>
          <div className="section-rule" />
        </div>
        <p className="section-sub">Quality remoulded tyres for every vehicle category</p>

        {tabs.length > 0 ? (
          <>
            <div className="tabs-bar">
              {tabs.map(t => (
                <button
                  key={t}
                  className={`tab-btn${activeTab === t ? ' active' : ''}`}
                  onClick={() => setActiveTab(t)}
                >
                  {TAB_LABELS[t] || t}
                </button>
              ))}
            </div>
            <div className={`chips-wrap${inView ? ' visible' : ''}`} ref={ref}>
              {sizes.map((s, i) => (
                <span key={i} className="size-chip">
                  {typeof s === 'object' ? s.size : s}
                </span>
              ))}
            </div>
          </>
        ) : (
          <p style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>Loading tyre sizes…</p>
        )}
      </div>
    </section>
  );
};

// ── Gallery ───────────────────────────────────────────────────────────────────

const GallerySection = ({ gallery }) => {
  const [filter, setFilter] = useState('all');
  const cats = ['all', 'factory', 'products', 'process', 'team'];
  const shown = filter === 'all' ? gallery : gallery.filter(g => g.category === filter);

  return (
    <section id="gallery" className="gallery-section">
      <div className="section-wrap">
        <div className="section-head">
          <h2 className="section-title">Our Gallery</h2>
          <div className="section-rule" />
        </div>
        <p className="section-sub">See our work in action</p>

        <div className="gallery-filters">
          {cats.map(c => (
            <button key={c} className={`filter-btn${filter === c ? ' active' : ''}`}
              onClick={() => setFilter(c)}>
              {c.charAt(0).toUpperCase() + c.slice(1)}
            </button>
          ))}
        </div>

        <div className="gallery-grid">
          {(shown.length > 0 ? shown : Array.from({ length: 6 }, (_, i) => ({ id: i, title: `Gallery ${i + 1}` }))).map(item => (
            <div key={item.id} className="gallery-card">
              {item.image
                ? <img src={item.image} alt={item.title} />
                : <div className="gallery-ph"><span>📷</span></div>
              }
              <div className="gallery-overlay">
                <p>{item.title || 'Tyre Remoulding'}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// ── Testimonials ──────────────────────────────────────────────────────────────

const FALLBACK_T = [
  { id: 1, customer_name: 'Rahul Sharma', rating: 5, content: 'Excellent service! My tractor tyres look brand new. Quality remoulding at a very reasonable price.' },
  { id: 2, customer_name: 'Priya Patel', rating: 5, content: 'Professional team and quick turnaround time. Have been using Kishor Tyres for years. Highly recommended!' },
  { id: 3, customer_name: 'Amit Kumar', rating: 4, content: 'Great experience. The staff is knowledgeable and helped me choose the right remoulding type for my truck.' },
  { id: 4, customer_name: 'Suresh Yadav', rating: 5, content: 'Very happy with the pre-cure remoulding. My JCB tyres are running perfectly after the remould.' },
];

const TestimonialsSection = ({ testimonials }) => {
  const list = testimonials.length > 0 ? testimonials : FALLBACK_T;
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setIdx(p => (p + 1) % list.length), 4000);
    return () => clearInterval(t);
  }, [list.length]);

  const t = list[idx];

  return (
    <section id="testimonials" className="testimonials-section">
      <div className="section-wrap">
        <div className="section-head">
          <h2 className="section-title">What Our Clients Say</h2>
          <div className="section-rule" />
        </div>

        <div className="testimonial-stage">
          <div className="testimonial-card" key={idx}>
            <span className="quote-mark">"</span>
            <p className="t-text">{t.content}</p>
            <div className="t-meta">
              <div className="t-avatar">{t.customer_name.charAt(0)}</div>
              <div>
                <p className="t-name">{t.customer_name}</p>
                <p className="t-stars">{'★'.repeat(t.rating)}{'☆'.repeat(5 - t.rating)}</p>
              </div>
            </div>
          </div>
          <div className="carousel-dots">
            {list.map((_, i) => (
              <button
                key={i}
                className={`dot${i === idx ? ' active' : ''}`}
                onClick={() => setIdx(i)}
                aria-label={`Testimonial ${i + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

// ── Contact ───────────────────────────────────────────────────────────────────

const ContactSection = ({ companyInfo }) => {
  const [fields, setFields] = useState({ name: '', email: '', phone: '', message: '' });
  const [focused, setFocused] = useState({});

  const change = e => setFields(p => ({ ...p, [e.target.name]: e.target.value }));
  const focus = e => setFocused(p => ({ ...p, [e.target.name]: true }));
  const blur = e => setFocused(p => ({ ...p, [e.target.name]: false }));
  const floated = name => focused[name] || !!fields[name];

  return (
    <section id="contact" className="contact-section">
      <div className="section-wrap">
        <div className="section-head">
          <h2 className="section-title">Get In Touch</h2>
          <div className="section-rule" />
        </div>
        <p className="section-sub">Contact us for quotes and enquiries</p>

        <div className="contact-grid">
          <div className="contact-info-col">
            {[
              { icon: '📍', label: 'Address', val: companyInfo?.address || 'Plot No. 77, Industrial Estate, Navi Solapur Road, Sangam Chowk, Pandharpur – 413 304, Dist. Solapur (Maharashtra)' },
              { icon: '📞', label: 'Phone', val: '02186-223343 | 9404069233 | 9373630393' },
              { icon: '✉️', label: 'Email', val: companyInfo?.email || 'info@kishortyres.com' },
              { icon: '🕐', label: 'Hours', val: companyInfo?.working_hours || 'Mon – Sat: 9:00 AM – 7:00 PM' },
            ].map(item => (
              <div key={item.label} className="contact-row">
                <span className="contact-icon">{item.icon}</span>
                <div>
                  <p className="contact-label">{item.label}</p>
                  <p className="contact-val">{item.val}</p>
                </div>
              </div>
            ))}
            <div className="proprietor-badge">
              <p className="prop-name">Kishor K Nair</p>
              <p className="prop-title">Proprietor — B.E. Prod, MBA</p>
            </div>
          </div>

          <form className="contact-form" onSubmit={e => e.preventDefault()}>
            {[
              { name: 'name', label: 'Your Name', type: 'text' },
              { name: 'email', label: 'Email Address', type: 'email' },
              { name: 'phone', label: 'Phone Number', type: 'tel' },
            ].map(f => (
              <div key={f.name} className={`float-field${floated(f.name) ? ' floated' : ''}`}>
                <input type={f.type} name={f.name} value={fields[f.name]}
                  onChange={change} onFocus={focus} onBlur={blur} autoComplete="off" />
                <label>{f.label}</label>
              </div>
            ))}
            <div className={`float-field textarea-wrap${floated('message') ? ' floated' : ''}`}>
              <textarea name="message" rows={5} value={fields.message}
                onChange={change} onFocus={focus} onBlur={blur} />
              <label>Your Message</label>
            </div>
            <button type="submit" className="btn-gold btn-full">Send Message</button>
          </form>
        </div>
      </div>
    </section>
  );
};

// ── Footer ────────────────────────────────────────────────────────────────────

const Footer = ({ companyInfo }) => (
  <footer className="site-footer">
    <div className="footer-grid">
      <div className="footer-brand">
        <p className="footer-name">KISHOR TYRE REMOULDING WORKS</p>
        <p className="footer-tag">360° Tyre Care Solutions</p>
        <p className="footer-prop">Proprietor: Kishor K Nair</p>
      </div>
      <div className="footer-col">
        <h4>Quick Links</h4>
        <a href="#about">About</a>
        <a href="#tyre-sizes">Tyre Sizes</a>
        <a href="#gallery">Gallery</a>
        <a href="#contact">Contact</a>
      </div>
      <div className="footer-col">
        <h4>Services</h4>
        <Link to="/services">Tractor Remoulding</Link>
        <Link to="/services">Truck &amp; JCB Remoulding</Link>
        <Link to="/services">Tyre Repair</Link>
      </div>
      <div className="footer-col">
        <h4>Contact</h4>
        <p>02186-223343</p>
        <p>9404069233</p>
        <p>9373630393</p>
        <p>{companyInfo?.email || 'info@kishortyres.com'}</p>
      </div>
    </div>
    <div className="footer-bottom">
      <div className="footer-rule" />
      <p>© {new Date().getFullYear()} Kishor Tyre Remoulding Works. All rights reserved.</p>
    </div>
  </footer>
);

// ── Page ──────────────────────────────────────────────────────────────────────

const Home = () => {
  const { user } = useAuth();
  const [companyInfo, setCompanyInfo] = useState(null);
  const [testimonials, setTestimonials] = useState([]);
  const [gallery, setGallery] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      publicAPI.getCompanyInfo(),
      publicAPI.getTestimonials(),
      publicAPI.getGallery(),
    ])
      .then(([c, t, g]) => {
        setCompanyInfo(c.data);
        setTestimonials(t.data);
        setGallery(g.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="loading-screen">
        <TyreSVG className="loading-tyre spin" />
        <p>Loading…</p>
      </div>
    );
  }

  return (
    <div className="home-page">
      <Header user={user} />
      <HeroSection companyInfo={companyInfo} />
      <WhySection />
      <TyreSizesSection />
      <GallerySection gallery={gallery} />
      <TestimonialsSection testimonials={testimonials} />
      <ContactSection companyInfo={companyInfo} />
      <Footer companyInfo={companyInfo} />
    </div>
  );
};

export default Home;
