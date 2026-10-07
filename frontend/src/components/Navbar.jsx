import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { clearAuth } from '../store/authSlice';
import { clearNotifications } from '../store/notificationsSlice';
import client from '../api/client';
import { ProfileSection } from './navbar/index.js';
import NotificationDropdown from './NotificationDropdown';
import PlanSelectionModal from './PlanSelectionModal';

const CATEGORIES = [
  { value: '',                    label: 'All',               icon: '🏷️' },
  { value: 'real-estate',         label: 'Real Estate',       icon: '🏠' },
  { value: 'automotive',          label: 'Automotive',        icon: '🚗' },
  { value: 'electronics',         label: 'Electronics',       icon: '📱' },
  { value: 'home-furniture',      label: 'Home & Furniture',  icon: '🛋️' },
  { value: 'fashion-clothing',    label: 'Fashion',           icon: '👗' },
  { value: 'sports-fitness',      label: 'Sports',            icon: '⚽' },
  { value: 'books-media',         label: 'Books & Media',     icon: '📚' },
  { value: 'pets-animals',        label: 'Pets',              icon: '🐾' },
  { value: 'services',            label: 'Services',          icon: '🔧' },
  { value: 'domestic-jobs',       label: 'Domestic Jobs',     icon: '🏡' },
  { value: 'professional-jobs',   label: 'Pro Jobs',          icon: '💼' },
  { value: 'business-industrial', label: 'Business',          icon: '🏭' },
  { value: 'agriculture',         label: 'Agriculture',       icon: '🌾' },
];

export default function Navbar() {
  const { i18n, t } = useTranslation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const user = useSelector((s) => s.auth.user);

  const [q, setQ] = useState('');
  const [searchCat, setSearchCat] = useState('');
  const [postModal, setPostModal] = useState(false);

  // Sync search input with URL on navigation
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    setQ(params.get('q') || '');
    setSearchCat(params.get('category') || '');
  }, [location.search]);

  async function handleLogout() {
    try {
      await client.post('/auth/logout');
    } catch (_) {}
    localStorage.removeItem('refreshToken');
    dispatch(clearNotifications());
    dispatch(clearAuth());
    navigate('/');
  }

  function handleSearch(e) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (q.trim()) params.set('q', q.trim());
    if (searchCat) params.set('category', searchCat);
    navigate(`/search?${params.toString()}`);
  }

  async function handleLanguageToggle() {
    const newLang = i18n.language === 'en' ? 'am' : 'en';
    await i18n.changeLanguage(newLang);
    if (user) {
      try { await client.patch('/users/me/language', { language: newLang }); } catch (_) {}
    }
  }

  // Active category from URL
  const urlCat = new URLSearchParams(location.search).get('category') || '';

  return (
    <>
      {/* ── TOP NAVBAR ── */}
      <nav className="navbar-custom">

        {/* Brand */}
        <Link to="/" className="navbar-brand flex-shrink-0">
          <div className="navbar-brand-icon">🏠</div>
          <div className="navbar-brand-text">
            <span className="navbar-brand-name">EthioGebiya</span>
            <span className="navbar-brand-tagline">Ethiopia's Marketplace</span>
          </div>
        </Link>

        {/* Search bar */}
        <form onSubmit={handleSearch} className="navbar-search flex-grow-1 mx-3" style={{ maxWidth: 680 }}>
          <select
            className="navbar-search-cat"
            value={searchCat}
            onChange={(e) => setSearchCat(e.target.value)}
            aria-label="Category"
          >
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
          <input
            className="navbar-search-input"
            type="text"
            placeholder="Search listings — cars, homes, jobs…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            aria-label="Search"
          />
          <button type="submit" className="navbar-search-btn" aria-label="Search">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
          </button>
        </form>

        {/* Right actions */}
        <div className="d-flex align-items-center gap-1 flex-shrink-0 ms-auto">

          {/* Language toggle */}
          <button className="nav-action" onClick={handleLanguageToggle} title="Switch language">
            <span className="nav-action-top">Language</span>
            <span className="nav-action-bottom">{i18n.language === 'en' ? 'አማርኛ' : 'English'}</span>
          </button>

          {user ? (
            <>
              {/* Notifications */}
              <div style={{ position: 'relative' }}>
                <NotificationDropdown />
              </div>

              {/* Profile dropdown */}
              <ProfileSection user={user} onEditProfile={() => navigate('/profile')} />

              {/* More options */}
              <div className="dropdown">
                <button
                  className="nav-action dropdown-toggle"
                  data-bs-toggle="dropdown"
                  style={{ border: '2px solid transparent', borderRadius: 4 }}
                  title="More"
                >
                  <span className="nav-action-top">Returns</span>
                  <span className="nav-action-bottom">& Orders</span>
                </button>
                <ul className="dropdown-menu dropdown-menu-end">
                  {user.role !== 'admin' && (
                    <>
                      <li><Link className="dropdown-item" to="/my-listings">📋 My Listings</Link></li>
                      <li><Link className="dropdown-item" to="/messages">💬 Messages</Link></li>
                      <li><Link className="dropdown-item" to="/notifications">🔔 Notifications</Link></li>
                      <li><hr className="dropdown-divider" /></li>
                      <li><Link className="dropdown-item" to="/settings">⚙️ Settings</Link></li>
                      <li><Link className="dropdown-item" to="/premium-subscription">⭐ Premium</Link></li>
                    </>
                  )}
                  {user.role === 'admin' && (
                    <li><Link className="dropdown-item text-danger" to="/admin-panel">⚙️ Admin Panel</Link></li>
                  )}
                  <li><hr className="dropdown-divider" /></li>
                  <li>
                    <button className="dropdown-item text-danger" onClick={handleLogout}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="me-2">
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                        <polyline points="16,17 21,12 16,7"/>
                        <line x1="21" y1="12" x2="9" y2="12"/>
                      </svg>
                      {t('nav.logout')}
                    </button>
                  </li>
                </ul>
              </div>

              {/* Post listing */}
              {user.role !== 'admin' && (
                <button className="nav-post-btn ms-1" onClick={() => setPostModal(true)}>
                  + Post
                </button>
              )}
            </>
          ) : (
            <>
              <div className="dropdown">
                <button className="nav-action dropdown-toggle" data-bs-toggle="dropdown">
                  <span className="nav-action-top">Hello, sign in</span>
                  <span className="nav-action-bottom">Account ▾</span>
                </button>
                <ul className="dropdown-menu dropdown-menu-end">
                  <li className="px-3 py-2">
                    <Link to="/login" className="btn btn-success w-100 fw-semibold mb-2">Sign In</Link>
                    <p className="text-muted small mb-0 text-center">
                      New customer? <Link to="/register" className="text-success fw-semibold">Start here</Link>
                    </p>
                  </li>
                  <li><hr className="dropdown-divider" /></li>
                  <li><Link className="dropdown-item" to="/login">🔑 {t('nav.login')}</Link></li>
                  <li><Link className="dropdown-item" to="/register">✨ {t('nav.register')}</Link></li>
                </ul>
              </div>
              <Link to="/register" className="nav-post-btn ms-1">
                + Post Free
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* ── CATEGORY BAR ── */}
      <div className="catbar">
        {CATEGORIES.map((c) => (
          <Link
            key={c.value}
            to={c.value ? `/search?category=${c.value}` : '/search'}
            className={`catbar-item ${urlCat === c.value ? 'active' : ''}`}
          >
            <span>{c.icon}</span>
            <span>{c.label}</span>
          </Link>
        ))}
      </div>

      {/* Plan Selection Modal */}
      {postModal && (
        <PlanSelectionModal
          userRole={user?.role}
          onClose={() => setPostModal(false)}
        />
      )}
    </>
  );
}
