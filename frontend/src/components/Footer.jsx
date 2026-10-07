import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const FOOTER_COLS = [
  {
    title: 'Browse',
    links: [
      { to: '/search?category=real-estate',       label: '🏠 Real Estate' },
      { to: '/search?category=automotive',        label: '🚗 Automotive' },
      { to: '/search?category=electronics',       label: '📱 Electronics' },
      { to: '/search?category=home-furniture',    label: '🛋️ Home & Furniture' },
      { to: '/search?category=fashion-clothing',  label: '👗 Fashion' },
      { to: '/search?category=professional-jobs', label: '💼 Jobs' },
    ],
  },
  {
    title: 'Sell',
    links: [
      { to: '/register',             label: 'Create Account' },
      { to: '/premium-subscription', label: '⭐ Go Premium' },
      { to: '/register-company',     label: '🏢 Register Company' },
      { to: '/my-listings',          label: 'My Listings' },
    ],
  },
  {
    title: 'Help',
    links: [
      { to: '/about', label: 'About EthioGebiya' },
      { to: '/about', label: 'How It Works' },
      { to: '/about', label: 'Safety Tips' },
      { to: '/about', label: 'Contact Us' },
    ],
  },
  {
    title: 'Account',
    links: [
      { to: '/login',         label: 'Sign In' },
      { to: '/register',      label: 'Register' },
      { to: '/profile',       label: 'My Profile' },
      { to: '/notifications', label: 'Notifications' },
      { to: '/messages',      label: 'Messages' },
    ],
  },
];

export default function Footer() {
  const { t } = useTranslation();

  return (
    <footer className="site-footer">
      {/* Back to top */}
      <div
        className="footer-back-top"
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && window.scrollTo({ top: 0, behavior: 'smooth' })}
        aria-label="Back to top"
      >
        ↑ Back to top
      </div>

      {/* Main footer columns */}
      <div className="footer-top">
        <div className="container">
          <div className="row g-4">
            {/* Brand column */}
            <div className="col-12 col-md-3 mb-2">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                <div style={{
                  width: 38, height: 38, background: 'var(--primary)',
                  borderRadius: 10, display: 'flex', alignItems: 'center',
                  justifyContent: 'center', fontSize: '1.2rem', flexShrink: 0,
                }}>🏠</div>
                <div>
                  <div style={{ color: '#fff', fontWeight: 900, fontSize: '1.1rem', lineHeight: 1 }}>EthioGebiya</div>
                  <div style={{ color: '#6b7280', fontSize: '0.68rem', marginTop: 2 }}>Ethiopia's Marketplace</div>
                </div>
              </div>
              <p style={{ color: '#9ca3af', fontSize: '0.8rem', lineHeight: 1.7, marginBottom: 16 }}>
                Ethiopia's leading online marketplace for buying and selling everything from real estate to electronics.
              </p>
              <div style={{ display: 'flex', gap: 8 }}>
                {['📘', '📸', '🐦', '▶️'].map((icon, i) => (
                  <a key={i} href="#" className="footer-social-btn" aria-label="Social media">{icon}</a>
                ))}
              </div>
            </div>

            {/* Link columns */}
            {FOOTER_COLS.map((col) => (
              <div key={col.title} className="col-6 col-md-2">
                <div className="footer-col-title">{col.title}</div>
                {col.links.map((l) => (
                  <Link key={l.label} to={l.to} className="footer-link">{l.label}</Link>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="container">
        <div className="footer-bottom">
          <span className="footer-brand">🏠 EthioGebiya</span>
          <div className="d-flex gap-3 flex-wrap align-items-center">
            <span style={{ color: '#6b7280', fontSize: '0.78rem' }}>📧 support@ethiogebiya.com</span>
            <span style={{ color: '#6b7280', fontSize: '0.78rem' }}>📞 +251 911 000 000</span>
          </div>
          <span className="footer-copy">© {new Date().getFullYear()} EthioGebiya. All rights reserved.</span>
        </div>
      </div>
    </footer>
  );
}
