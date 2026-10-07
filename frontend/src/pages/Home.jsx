import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import client from '../api/client';
import PlanSelectionModal from '../components/PlanSelectionModal';
import heroBg from '../assets/home1.jpg';

const CAT_META = {
  'real-estate':         { icon: '🏠', color: '#dbeafe', dark: '#1d4ed8', label: 'Real Estate' },
  'automotive':          { icon: '🚗', color: '#fee2e2', dark: '#dc2626', label: 'Automotive' },
  'electronics':         { icon: '📱', color: '#ede9fe', dark: '#7c3aed', label: 'Electronics' },
  'home-furniture':      { icon: '🛋️', color: '#fef3c7', dark: '#d97706', label: 'Home & Furniture' },
  'fashion-clothing':    { icon: '👗', color: '#fce7f3', dark: '#db2777', label: 'Fashion' },
  'sports-fitness':      { icon: '⚽', color: '#d1fae5', dark: '#059669', label: 'Sports' },
  'books-media':         { icon: '📚', color: '#e0f2fe', dark: '#0284c7', label: 'Books & Media' },
  'pets-animals':        { icon: '🐾', color: '#fef9c3', dark: '#ca8a04', label: 'Pets & Animals' },
  'services':            { icon: '🔧', color: '#f1f5f9', dark: '#475569', label: 'Services' },
  'domestic-jobs':       { icon: '🏡', color: '#ecfdf5', dark: '#16a34a', label: 'Domestic Jobs' },
  'professional-jobs':   { icon: '💼', color: '#f0fdf4', dark: '#15803d', label: 'Pro Jobs' },
  'business-industrial': { icon: '🏭', color: '#fff7ed', dark: '#ea580c', label: 'Business' },
  'agriculture':         { icon: '🌾', color: '#fefce8', dark: '#a16207', label: 'Agriculture' },
};

/* ── Listing Card ─────────────────────────────────────────────── */
function ListingCard({ listing: l }) {
  const isCompany = l.ownerType === 'company' && l.companyOwner;
  const name    = isCompany ? (l.companyOwner?.companyName || 'Company') : (l.owner?.fullName || 'User');
  const photo   = isCompany ? l.companyOwner?.logo : l.owner?.profilePhoto;
  const role    = isCompany ? 'Company' : (l.owner?.role === 'broker' ? 'Broker' : 'Seller');
  const initial = name?.[0]?.toUpperCase() || 'U';
  const meta    = CAT_META[l.categorySlug] || {};

  return (
    <Link to={`/listings/${l._id}`} className="text-decoration-none d-block h-100">
      <article className="hp-card">
        <div className="hp-card-img-wrap">
          {l.images?.[0]
            ? <img src={l.images[0]} alt={l.title} className="hp-card-img" loading="lazy" />
            : <div className="hp-card-img-ph" style={{ background: meta.color || '#f0fdf4' }}>
                <span style={{ fontSize: '2.8rem' }}>{meta.icon || '🏷️'}</span>
              </div>
          }
          {l.isFeatured && <span className="hp-badge-hot">⭐ Featured</span>}
          {l.images?.length > 1 && (
            <span className="hp-badge-count">+{l.images.length - 1}</span>
          )}
        </div>
        <div className="hp-card-body">
          <div className="hp-card-price">
            {l.price
              ? <>{l.price.toLocaleString()} <span className="hp-card-currency">{l.currency || 'ETB'}</span></>
              : <span className="hp-card-price-req">Negotiable</span>
            }
          </div>
          <div className="hp-card-title">{l.title}</div>
          <div className="hp-card-meta">
            <span className="hp-card-loc">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
              </svg>
              {[l.location?.city, l.location?.region].filter(Boolean).join(', ') || 'Ethiopia'}
            </span>
            <span className="hp-card-date">
              {new Date(l.createdAt).toLocaleDateString('en-ET', { day: 'numeric', month: 'short' })}
            </span>
          </div>
          <div className="hp-card-seller">
            {photo
              ? <img src={photo} alt={name} className="hp-card-avatar" />
              : <div className="hp-card-avatar hp-card-avatar-init">{initial}</div>
            }
            <span className="hp-card-seller-name">{name}</span>
            <span className="hp-card-seller-role">{role}</span>
          </div>
        </div>
      </article>
    </Link>
  );
}

/* ── Skeleton ─────────────────────────────────────────────────── */
function SkeletonCard() {
  return (
    <div className="hp-card">
      <div className="hp-skel-img" />
      <div className="hp-card-body">
        <div className="hp-skel" style={{ width: '50%', height: 13, marginBottom: 7 }} />
        <div className="hp-skel" style={{ width: '95%', height: 12, marginBottom: 4 }} />
        <div className="hp-skel" style={{ width: '70%', height: 11 }} />
      </div>
    </div>
  );
}

/* ── Section Header ───────────────────────────────────────────── */
function SectionHead({ title, sub, link, linkLabel = 'See all →' }) {
  return (
    <div className="hp-section-head">
      <div>
        <h2 className="hp-section-title">{title}</h2>
        {sub && <p className="hp-section-sub">{sub}</p>}
      </div>
      {link && <Link to={link} className="hp-see-all">{linkLabel}</Link>}
    </div>
  );
}

/* ── Main ─────────────────────────────────────────────────────── */
export default function Home() {
  const { user } = useSelector((s) => s.auth);
  const navigate = useNavigate();

  const [featured,  setFeatured]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [planModal, setPlanModal] = useState(null);
  const [query,     setQuery]     = useState('');

  useEffect(() => {
    let alive = true;
    const id = setTimeout(async () => {
      try {
        const { data } = await client.get('/search', { params: { limit: 12 } });
        if (alive) setFeatured(data.listings || []);
      } catch (_) {}
      finally { if (alive) setLoading(false); }
    }, 80);
    return () => { alive = false; clearTimeout(id); };
  }, []);

  function handleSearch(e) {
    e.preventDefault();
    navigate(query.trim() ? `/search?q=${encodeURIComponent(query.trim())}` : '/search');
  }

  const row1 = featured.slice(0, 6);
  const row2 = featured.slice(6, 12);

  const QUICK_LINKS = [
    { label: 'Real Estate',   slug: 'real-estate' },
    { label: 'Automotive',    slug: 'automotive' },
    { label: 'Electronics',   slug: 'electronics' },
    { label: 'Domestic Jobs', slug: 'domestic-jobs' },
    { label: 'Pro Jobs',      slug: 'professional-jobs' },
    { label: 'Fashion',       slug: 'fashion-clothing' },
    { label: 'Services',      slug: 'services' },
  ];

  return (
    <>
      {/* ══════════════════════════════════════════════════════
          HERO
      ══════════════════════════════════════════════════════ */}
      <div className="hp-hero">
        <img src={heroBg} alt="" className="hp-hero-bg" aria-hidden="true" />
        <div className="hp-hero-scrim" />

        <div className="container hp-hero-body">
          <div className="row align-items-center" style={{ minHeight: 420 }}>
            {/* left: text + search */}
            <div className="col-lg-6 col-md-8">
              <span className="hp-hero-pill">
                <span className="hp-hero-dot" />
                🇪🇹 Ethiopia's #1 Marketplace
              </span>
              <h1 className="hp-hero-title">
                Buy &amp; Sell<br />
                <span className="hp-hero-accent">Anything</span><br />
                in Ethiopia
              </h1>
              <p className="hp-hero-sub">
                Real Estate · Cars · Electronics · Jobs · Fashion &amp; more
              </p>

              <form onSubmit={handleSearch} className="hp-hero-search">
                <input
                  type="text"
                  className="hp-hero-search-input"
                  placeholder="Search cars, homes, electronics, jobs…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  aria-label="Search listings"
                />
                <button type="submit" className="hp-hero-search-btn" aria-label="Search">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                  </svg>
                  Search
                </button>
              </form>

              <div className="hp-hero-tags">
                {QUICK_LINKS.map(({ label, slug }) => (
                  <Link key={slug} to={`/search?category=${slug}`} className="hp-hero-tag">
                    {CAT_META[slug]?.icon} {label}
                  </Link>
                ))}
              </div>
            </div>

            {/* right: floating stat cards */}
            <div className="col-lg-6 d-none d-lg-flex justify-content-end">
              <div className="hp-hero-stats-grid">
                {[
                  { n: '50K+',  l: 'Active Listings',  icon: '📋', bg: '#fff' },
                  { n: '120K+', l: 'Registered Users',  icon: '👥', bg: '#fff' },
                  { n: '13',    l: 'Categories',         icon: '🗂️', bg: '#fff' },
                  { n: '100%',  l: 'Free to Post',       icon: '🎁', bg: '#fff' },
                ].map((s) => (
                  <div key={s.n} className="hp-stat-card">
                    <span className="hp-stat-icon">{s.icon}</span>
                    <span className="hp-stat-n">{s.n}</span>
                    <span className="hp-stat-l">{s.l}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── mobile stats strip ── */}
      <div className="hp-stats-strip d-lg-none">
        <div className="container">
          <div className="hp-stats-strip-inner">
            {[
              { n: '50K+', l: 'Listings' },
              { n: '120K+', l: 'Users' },
              { n: '13', l: 'Categories' },
              { n: 'Free', l: 'To Post' },
            ].map((s) => (
              <div key={s.n} className="hp-stats-strip-item">
                <span className="hp-stats-strip-n">{s.n}</span>
                <span className="hp-stats-strip-l">{s.l}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════
          PAGE BODY
      ══════════════════════════════════════════════════════ */}
      <div className="hp-body">

        {/* ── TOP PROMO BANNERS ── */}
        <div className="container hp-gap">
          <div className="row g-3">
            <div className="col-md-4">
              <Link to="/search?category=real-estate" className="hp-promo hp-promo-blue">
                <div className="hp-promo-text">
                  <div className="hp-promo-eyebrow">Browse Now</div>
                  <div className="hp-promo-title">Real Estate</div>
                  <div className="hp-promo-sub">Apartments · Villas · Land</div>
                </div>
                <span className="hp-promo-emoji">🏠</span>
              </Link>
            </div>
            <div className="col-md-4">
              <Link to="/search?category=automotive" className="hp-promo hp-promo-red">
                <div className="hp-promo-text">
                  <div className="hp-promo-eyebrow">Shop Now</div>
                  <div className="hp-promo-title">Automotive</div>
                  <div className="hp-promo-sub">Cars · SUVs · Motorcycles</div>
                </div>
                <span className="hp-promo-emoji">🚗</span>
              </Link>
            </div>
            <div className="col-md-4">
              <div className="row g-3 h-100">
                <div className="col-6">
                  <Link to="/search?category=domestic-jobs" className="hp-promo hp-promo-green hp-promo-sm">
                    <span className="hp-promo-emoji-sm">🏡</span>
                    <div className="hp-promo-title-sm">Domestic Jobs</div>
                  </Link>
                </div>
                <div className="col-6">
                  <Link to="/search?category=professional-jobs" className="hp-promo hp-promo-purple hp-promo-sm">
                    <span className="hp-promo-emoji-sm">💼</span>
                    <div className="hp-promo-title-sm">Pro Jobs</div>
                  </Link>
                </div>
                <div className="col-6">
                  <Link to="/search?category=electronics" className="hp-promo hp-promo-indigo hp-promo-sm">
                    <span className="hp-promo-emoji-sm">📱</span>
                    <div className="hp-promo-title-sm">Electronics</div>
                  </Link>
                </div>
                <div className="col-6">
                  <Link to="/search?category=fashion-clothing" className="hp-promo hp-promo-pink hp-promo-sm">
                    <span className="hp-promo-emoji-sm">👗</span>
                    <div className="hp-promo-title-sm">Fashion</div>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── FEATURED LISTINGS ROW 1 ── */}
        <div className="hp-shelf">
          <div className="container">
            <SectionHead title="Featured Listings" sub="Fresh picks updated daily" link="/search" linkLabel="View all listings →" />
            {loading ? (
              <div className="row g-3">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="col-6 col-sm-4 col-md-3 col-lg-2"><SkeletonCard /></div>
                ))}
              </div>
            ) : row1.length === 0 ? (
              <div className="hp-empty">
                <div style={{ fontSize: '3.5rem', marginBottom: 12 }}>🏠</div>
                <h5 className="fw-bold mb-2">No listings yet</h5>
                <p className="text-muted mb-3">Be the first to post something!</p>
                {user && user.role !== 'admin' && (
                  <button className="btn btn-success px-4" onClick={() => setPlanModal({})}>Post a Listing</button>
                )}
              </div>
            ) : (
              <div className="row g-3">
                {row1.map((l) => (
                  <div key={l._id} className="col-6 col-sm-4 col-md-3 col-lg-2"><ListingCard listing={l} /></div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── MID BANNERS ── */}
        <div className="container hp-gap">
          <div className="row g-3">
            <div className="col-md-6">
              <Link to="/search?category=home-furniture" className="hp-wide-banner hp-wide-amber">
                <div>
                  <div className="hp-wide-eyebrow">New Arrivals</div>
                  <div className="hp-wide-title">Home &amp; Furniture</div>
                  <div className="hp-wide-sub">Sofas · Beds · Kitchenware</div>
                  <span className="hp-wide-cta">Shop Now →</span>
                </div>
                <span className="hp-wide-emoji">🛋️</span>
              </Link>
            </div>
            <div className="col-md-6">
              <Link to="/search?category=agriculture" className="hp-wide-banner hp-wide-lime">
                <div>
                  <div className="hp-wide-eyebrow">Fresh Listings</div>
                  <div className="hp-wide-title">Agriculture</div>
                  <div className="hp-wide-sub">Land · Livestock · Equipment</div>
                  <span className="hp-wide-cta">Browse →</span>
                </div>
                <span className="hp-wide-emoji">🌾</span>
              </Link>
            </div>
          </div>
        </div>

        {/* ── LISTINGS ROW 2 ── */}
        {!loading && row2.length > 0 && (
          <div className="hp-shelf">
            <div className="container">
              <SectionHead title="More Listings" sub="Explore more deals across Ethiopia" link="/search" linkLabel="Browse all →" />
              <div className="row g-3">
                {row2.map((l) => (
                  <div key={l._id} className="col-6 col-sm-4 col-md-3 col-lg-2"><ListingCard listing={l} /></div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── HOW IT WORKS ── */}
        <div className="hp-how">
          <div className="container">
            <div className="text-center mb-4">
              <h2 className="hp-section-title">How EthioGebiya Works</h2>
              <p className="hp-section-sub">Buy and sell in 3 simple steps</p>
            </div>
            <div className="row g-4 justify-content-center">
              {[
                { n: '1', icon: '📝', title: 'Post Your Listing',   desc: 'Create a free listing in minutes. Add photos, set your price, and go live instantly.' },
                { n: '2', icon: '💬', title: 'Connect with Buyers', desc: 'Receive messages from interested buyers across all regions of Ethiopia.' },
                { n: '3', icon: '🤝', title: 'Close the Deal',      desc: 'Meet, negotiate, and complete your transaction safely and confidently.' },
              ].map((s) => (
                <div key={s.n} className="col-md-4">
                  <div className="hp-step">
                    <div className="hp-step-badge">{s.n}</div>
                    <div className="hp-step-icon">{s.icon}</div>
                    <h5 className="hp-step-title">{s.title}</h5>
                    <p className="hp-step-desc">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── TRUST STRIP ── */}
        <div className="container hp-gap">
          <div className="hp-trust">
            {[
              { icon: '🔒', title: 'Verified Sellers',    sub: 'Phone-verified accounts' },
              { icon: '🚀', title: 'Post in Minutes',     sub: 'Always free to list' },
              { icon: '💬', title: 'Direct Messaging',    sub: 'Chat with sellers instantly' },
              { icon: '🌍', title: 'Nationwide Coverage', sub: 'All regions of Ethiopia' },
            ].map((item) => (
              <div key={item.title} className="hp-trust-item">
                <div className="hp-trust-icon">{item.icon}</div>
                <div>
                  <div className="hp-trust-title">{item.title}</div>
                  <div className="hp-trust-sub">{item.sub}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── CTA (guests only) ── */}
        {!user && (
          <div className="container hp-gap">
            <div className="hp-cta">
              <div className="hp-cta-glow" />
              <div className="hp-cta-content">
                <span className="hp-cta-pill">✨ Join 120,000+ Ethiopians</span>
                <h2 className="hp-cta-title">Ready to Buy or Sell?</h2>
                <p className="hp-cta-sub">
                  Create a free account and start posting listings or browsing thousands of items across Ethiopia.
                </p>
                <div className="hp-cta-actions">
                  <Link to="/register" className="hp-cta-primary">Get Started — It's Free</Link>
                  <Link to="/search"   className="hp-cta-ghost">Browse Listings</Link>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>{/* end hp-body */}

      {planModal && (
        <PlanSelectionModal
          categorySlug={planModal.categorySlug}
          userRole={user?.role}
          onClose={() => setPlanModal(null)}
        />
      )}
    </>
  );
}
