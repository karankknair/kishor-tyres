import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { publicAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import kishorLogo from '../kishor_logo.svg';
import { t } from '../i18n/translations';
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

// ── Hero Tyre SVG ─────────────────────────────────────────────────────────────

const HeroTyre = () => (
  <div className="hero-tyre-wrapper">
    <svg
      viewBox="0 0 300 300"
      width="260"
      height="260"
      className="hero-tyre-svg"
      style={{ animation: 'heroTyreSpin 10s linear infinite' }}
    >
      {/* Outer dashed ring */}
      <circle cx="150" cy="150" r="142" fill="none" stroke="#F5A800" strokeWidth="2.5" strokeDasharray="12 7"/>
      {/* Tyre body — solid filled black */}
      <circle cx="150" cy="150" r="134" fill="#111111"/>
      {/* Tread grooves */}
      <circle cx="150" cy="150" r="120" fill="none" stroke="#F5A800" strokeWidth="1.5" opacity="0.5"/>
      <circle cx="150" cy="150" r="108" fill="none" stroke="#F5A800" strokeWidth="1.5" opacity="0.5"/>
      {/* Bead line */}
      <circle cx="150" cy="150" r="90" fill="none" stroke="#333333" strokeWidth="1.5"/>
      {/* Rim area — dark fill */}
      <circle cx="150" cy="150" r="78" fill="#1C1C1C"/>
      {/* Rim amber accent ring */}
      <circle cx="150" cy="150" r="78" fill="none" stroke="#F5A800" strokeWidth="2.5"/>
      {/* Center hub cap */}
      <circle cx="150" cy="150" r="20" fill="#F5A800" opacity="0.55"/>
    </svg>
  </div>
);

// ── Loading Screen ────────────────────────────────────────────────────────────

const LoadingScreen = ({ onDone }) => (
  <div
    className="loading-screen"
    onAnimationEnd={(e) => { if (e.animationName === 'loaderFade') onDone(); }}
  >
    <div className="loader-tyre" />
    <div className="loader-bar-track">
      <div className="loader-bar-fill" />
    </div>
    <div className="loader-brand">
      <span className="loader-brand-main">KISHOR</span>
      <span className="loader-brand-sub">TYRE REMOULDING WORKS</span>
    </div>
  </div>
);

// ── Header ────────────────────────────────────────────────────────────────────

const Header = ({ user, lang, setLang, darkMode, setDarkMode }) => {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const tr = t[lang];

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
          <img src={kishorLogo} alt="Kishor Tyre Remoulding Works" className="logo-img" />
        </Link>

        <nav className={`main-nav${menuOpen ? ' open' : ''}`}>
          <a href="#about" onClick={close}>{tr.nav_about}</a>
          <Link to="/services" onClick={close}>{tr.nav_services}</Link>
          <a href="#tyre-sizes" onClick={close}>{tr.nav_sizes}</a>
          <a href="#gallery" onClick={close}>{tr.nav_gallery}</a>
          <a href="#testimonials" onClick={close}>{tr.nav_reviews}</a>
          <a href="#contact" onClick={close}>{tr.nav_contact}</a>
        </nav>

        <div className="header-right">
          <button
            className="theme-toggle"
            onClick={() => setDarkMode(d => !d)}
            aria-label="Toggle dark mode"
          >
            {darkMode ? '☀️' : '🌙'}
          </button>
          <button
            className="lang-toggle"
            onClick={() => setLang(lang === 'en' ? 'mr' : 'en')}
            aria-label="Toggle language"
          >
            {lang === 'en' ? 'मराठी' : 'English'}
          </button>
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

const HeroSection = ({ companyInfo, lang }) => {
  const [statsRef, statsInView] = useInView(0.3);
  const c1 = useCounter(50, statsInView);
  const c2 = useCounter(10000, statsInView);
  const c3 = useCounter(500, statsInView);
  const tr = t[lang];
  const headlineLines = tr.hero_headline.split('\n');

  return (
    <section className="hero-section">
      <div className="hero-inner">
        <div className="hero-text">
          <p className="hero-eyebrow">
            <span className="live-dot" aria-hidden="true" />
            Est. {companyInfo?.established_year || 1995} — Pandharpur, Maharashtra
          </p>
          <h1 className="hero-headline">
            <span className="headline-word">{headlineLines[0]}</span><br />
            <span className="headline-word" style={{ animationDelay: '0.08s' }}>{headlineLines[1]}</span>
          </h1>
          <div className="exclusive-badge">
            <span className="badge-star">★</span>
            <span className="badge-text">{tr.hero_exclusive}</span>
            <span className="badge-star">★</span>
          </div>
          <p className="hero-desc">{tr.hero_sub}</p>
          <div className="hero-btns">
            <a href="#contact" className="btn-gold pulse-glow">{tr.hero_cta1}</a>
            <a href="#tyre-sizes" className="btn-outline">{tr.hero_cta2}</a>
          </div>
        </div>
        <div className="hero-tyre-wrap">
          <div className="tyre-ambient" />
          <div className="glow-ring" />
          <div className="glow-ring glow-ring-2" />
          <HeroTyre />
        </div>
      </div>

      <div className="hero-stats" ref={statsRef}>
        <div className="stat-card">
          <span className="stat-num">{c1}+</span>
          <span className="stat-lbl">{tr.stats_exp}</span>
          <div className={`stat-bar${statsInView ? ' fill' : ''}`} />
        </div>
        <div className="stat-sep" />
        <div className="stat-card">
          <span className="stat-num">{c2 >= 10000 ? '10,000' : c2.toLocaleString()}+</span>
          <span className="stat-lbl">{tr.stats_tyres}</span>
          <div className={`stat-bar${statsInView ? ' fill' : ''}`} />
        </div>
        <div className="stat-sep" />
        <div className="stat-card">
          <span className="stat-num">{c3}+</span>
          <span className="stat-lbl">{tr.stats_clients}</span>
          <div className={`stat-bar${statsInView ? ' fill' : ''}`} />
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

const TyreSizesSection = ({ lang }) => {
  const [grouped, setGrouped] = useState({});
  const [activeTab, setActiveTab] = useState('');
  const [ref, inView] = useInView(0.1);

  useEffect(() => {
    publicAPI.getTyreSizesGrouped()
      .then(res => {
        const data = res.data;
        console.log('[TyreSizes] API response:', data);
        let groups = {};
        if (Array.isArray(data) && data.length > 0 && data[0].sizes !== undefined) {
          // [{category: 'tractor', sizes: ['6.00-16', ...]}]
          data.forEach(item => { groups[item.category] = item.sizes; });
        } else if (Array.isArray(data)) {
          // [{vehicle_category: 'tractor', size: '6.00-16'}]
          data.forEach(item => {
            const cat = item.vehicle_category;
            if (!groups[cat]) groups[cat] = [];
            groups[cat].push(item.size);
          });
        } else {
          // {tractor: ['6.00-16', ...]}
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
  const tr = t[lang];

  return (
    <section id="tyre-sizes" className="sizes-section">
      <div className="section-wrap">
        <div className="section-head">
          <h2 className="section-title">{tr.sizes_title}</h2>
          <div className="section-rule" />
        </div>
        <p className="section-sub">{tr.sizes_sub}</p>

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

const ContactSection = ({ companyInfo, lang }) => {
  const [fields, setFields] = useState({ name: '', email: '', phone: '', message: '' });
  const [focused, setFocused] = useState({});

  const change = e => setFields(p => ({ ...p, [e.target.name]: e.target.value }));
  const focus = e => setFocused(p => ({ ...p, [e.target.name]: true }));
  const blur = e => setFocused(p => ({ ...p, [e.target.name]: false }));
  const floated = name => focused[name] || !!fields[name];
  const tr = t[lang];

  return (
    <section id="contact" className="contact-section">
      <div className="section-wrap">
        <div className="section-head">
          <h2 className="section-title">{tr.contact_title}</h2>
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
              { name: 'name', label: tr.contact_name, type: 'text' },
              { name: 'email', label: tr.contact_email, type: 'email' },
              { name: 'phone', label: tr.contact_phone, type: 'tel' },
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
              <label>{tr.contact_msg}</label>
            </div>
            <button type="submit" className="btn-gold btn-full">{tr.contact_submit}</button>
          </form>
        </div>
      </div>
    </section>
  );
};

// ── Footer ────────────────────────────────────────────────────────────────────

const Footer = ({ companyInfo, lang }) => (
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
      <p>{t[lang].footer_copy}</p>
    </div>
  </footer>
);

// ── Page ──────────────────────────────────────────────────────────────────────

const Home = () => {
  const { user } = useAuth();
  const [companyInfo, setCompanyInfo] = useState(null);
  const [testimonials, setTestimonials] = useState([]);
  const [gallery, setGallery] = useState([]);
  const [showLoader, setShowLoader] = useState(true);
  const [lang, setLang] = useState(() => localStorage.getItem('lang') || 'en');
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('theme') === 'dark');

  useEffect(() => { localStorage.setItem('lang', lang); }, [lang]);

  useEffect(() => {
    localStorage.setItem('theme', darkMode ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  useEffect(() => {
    Promise.all([
      publicAPI.getCompanyInfo(),
      publicAPI.getTestimonials(),
      publicAPI.getGallery(),
    ])
      .then(([c, tData, g]) => {
        setCompanyInfo(c.data);
        setTestimonials(tData.data);
        setGallery(g.data);
      })
      .catch(() => {});
  }, []);

  if (showLoader) {
    return <LoadingScreen onDone={() => setShowLoader(false)} />;
  }

  return (
    <div className={`home-page${lang === 'mr' ? ' marathi' : ''}`}>
      <Header user={user} lang={lang} setLang={setLang} darkMode={darkMode} setDarkMode={setDarkMode} />
      <HeroSection companyInfo={companyInfo} lang={lang} />
      <WhySection />
      <TyreSizesSection lang={lang} />
      <GallerySection gallery={gallery} />
      <TestimonialsSection testimonials={testimonials} />
      <ContactSection companyInfo={companyInfo} lang={lang} />
      <Footer companyInfo={companyInfo} lang={lang} />
    </div>
  );
};

export default Home;
