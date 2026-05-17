import React from 'react';
import { Link } from 'react-router-dom';
import './Services.css';

const SERVICES = [
  {
    icon: '🚜',
    title: 'Tractor Tyre Remoulding',
    description:
      'Extend the life of your tractor tyres with our precision remoulding process. Available in Rib, Lug, and Mixed tread patterns to suit paddy fields, orchards, and highway use.',
    features: ['Pre-cure & Mold-cure options', 'All major sizes available', 'Deep tread retention', 'Warranty included'],
    sizes: '8.3*20 to 16.9*28',
  },
  {
    icon: '🚛',
    title: 'Truck & Bus Tyre Remoulding',
    description:
      'Our truck tyre remoulding delivers the endurance and load capacity your fleet demands. We handle tubeless and tube-type tyres for all commercial vehicle classes.',
    features: ['Tubeless & tube-type', 'Highway and mixed tread', 'All major brands accepted', 'Bulk order discounts'],
    sizes: '825*16 to 1100*20',
  },
  {
    icon: '🏗️',
    title: 'JCB / Earth Mover Remoulding',
    description:
      'Heavy-duty remoulding for earth movers and construction equipment. Designed to withstand abrasive surfaces and extreme loads.',
    features: ['Deep lug patterns', 'Cut-resistant compounds', 'Specially reinforced sidewalls', 'On-site assessment available'],
    sizes: '1400*25',
  },
  {
    icon: '🚐',
    title: 'Tempo & Mini Truck Remoulding',
    description:
      'Cost-effective remoulding for light commercial vehicles including tempos and mini trucks. Restore traction and extend tyre life significantly.',
    features: ['Quick turnaround', 'Ribbed & mixed patterns', 'Tubeless options', 'All common sizes'],
    sizes: '4.50*10 to 825*R16',
  },
  {
    icon: '🔧',
    title: 'Tyre Repair',
    description:
      'Professional tyre repair services for cars, jeeps, and light vehicles. Puncture repair, bead seating, and sidewall patching done by certified technicians.',
    features: ['Puncture repair', 'Bead seating', 'Sidewall patching', 'Same-day service'],
    sizes: 'Cars, Jeeps, SUVs',
  },
  {
    icon: '📋',
    title: 'Custom Rate Card',
    description:
      'Need a quote for your fleet or a specific tyre brand and size? Our pricing is transparent and competitive. Contact us for a tailored rate card.',
    features: ['Fleet pricing', 'Multi-brand acceptance', 'Transparent billing', 'Invoice on every job'],
    sizes: 'All categories',
    cta: true,
  },
];

const PROCESS_STEPS = [
  { step: '01', title: 'Inspection', desc: 'We thoroughly inspect the tyre casing for structural integrity and suitability.' },
  { step: '02', title: 'Buffing', desc: 'The old worn tread is buffed down to a uniform surface using precision machinery.' },
  { step: '03', title: 'Skiving & Repair', desc: 'Cuts, injuries, and holes are repaired with rubber filler to ensure a strong casing.' },
  { step: '04', title: 'Cushion Gum Application', desc: 'Cushion gum is applied for strong bonding between the casing and new tread.' },
  { step: '05', title: 'Tread Application', desc: 'New pre-cured or hot-mold tread rubber is applied with precise alignment.' },
  { step: '06', title: 'Curing', desc: 'The tyre is cured in a press or autoclave to bond and vulcanise the new tread.' },
  { step: '07', title: 'Final Inspection', desc: 'Quality check, balance verification, and marking before dispatch.' },
];

const Services = () => {
  return (
    <div className="services-page">
      <nav className="breadcrumb-nav">
        <Link to="/">Home</Link>
        <span> / </span>
        <span>Services</span>
      </nav>

      <header className="services-hero">
        <h1>Our Services</h1>
        <p>Professional tyre remoulding for every vehicle — from tractors to heavy trucks</p>
      </header>

      <section className="services-grid-section">
        <div className="services-grid">
          {SERVICES.map((s, i) => (
            <div key={i} className="service-card">
              <div className="service-icon">{s.icon}</div>
              <h3>{s.title}</h3>
              <p className="service-desc">{s.description}</p>
              <div className="service-sizes">
                <span className="size-label">Size range:</span>
                <span className="size-value">{s.sizes}</span>
              </div>
              <ul className="service-features">
                {s.features.map((f, j) => (
                  <li key={j}><span className="check">✓</span> {f}</li>
                ))}
              </ul>
              {s.cta && (
                <Link to="/#contact" className="service-cta-btn">Get a Quote</Link>
              )}
            </div>
          ))}
        </div>
      </section>

      <section className="process-section">
        <h2>Our Remoulding Process</h2>
        <p className="section-subtitle">7 steps from worn tyre to road-ready remould</p>
        <div className="process-steps">
          {PROCESS_STEPS.map((p) => (
            <div key={p.step} className="process-step">
              <div className="step-number">{p.step}</div>
              <div className="step-content">
                <h4>{p.title}</h4>
                <p>{p.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="services-cta-section">
        <h2>Ready to extend the life of your tyres?</h2>
        <p>Contact us today for a free assessment and competitive quote.</p>
        <div className="cta-buttons">
          <Link to="/#contact" className="btn-primary">Get a Quote</Link>
          <Link to="/tyre-sizes" className="btn-secondary">View Tyre Sizes</Link>
        </div>
      </section>
    </div>
  );
};

export default Services;
