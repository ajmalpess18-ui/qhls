import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Search, Download, Menu, X, GraduationCap, ShieldCheck } from 'lucide-react';

const navLinks = [
  { to: '/',          label: 'Home',      icon: Home },
  { to: '/results',   label: 'Results',   icon: Search },
  { to: '/downloads', label: 'Downloads', icon: Download },
];

export default function Navbar() {
  const { pathname } = useLocation();
  const [menuOpen, setMenuOpen]   = useState(false);
  const [scrolled, setScrolled]   = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <nav className={`navbar2 ${scrolled ? 'navbar2--scrolled' : ''}`}>
      {/* ── Brand ── */}
      <Link to="/" className="nb-brand" onClick={() => setMenuOpen(false)}>
        {/* Arch logo mark */}
        <div className="nb-logo-mark" aria-hidden="true">
          <svg viewBox="0 0 40 34" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M3 32 L3 18 Q3 6 11.5 6 Q20 6 20 18 L20 32" stroke="currentColor" strokeWidth="3.5" fill="none" strokeLinecap="round"/>
            <path d="M12 32 L12 13 Q12 2 20 2 Q28 2 28 13 L28 32" stroke="currentColor" strokeWidth="3.5" fill="none" strokeLinecap="round"/>
            <path d="M20 32 L20 18 Q20 6 28.5 6 Q37 6 37 18 L37 32" stroke="currentColor" strokeWidth="3.5" fill="none" strokeLinecap="round"/>
          </svg>
        </div>
        <div className="nb-brand-text">
          <span className="nb-brand-name">QHLS</span>
          <span className="nb-brand-sub">ക്വുർആൻ ഹദീഥ് ലേണിംഗ് സ്കൂൾ</span>
        </div>
      </Link>

      {/* ── Mobile toggle ── */}
      <button
        className="nb-toggle"
        onClick={() => setMenuOpen(o => !o)}
        aria-label="Toggle menu"
      >
        {menuOpen ? <X size={22} /> : <Menu size={22} />}
      </button>

      {/* ── Nav menu ── */}
      <div className={`nb-menu ${menuOpen ? 'nb-menu--open' : ''}`}>
        {/* Links */}
        <div className="nb-links" onClick={() => setMenuOpen(false)}>
          {navLinks.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              className={`nb-link ${pathname === to ? 'nb-link--active' : ''}`}
            >
              <Icon size={14} strokeWidth={2} />
              {label}
            </Link>
          ))}
        </div>

        {/* Actions */}
        <div className="nb-actions" onClick={() => setMenuOpen(false)}>
          <Link to="/login/student" className="nb-btn nb-btn--outline" id="nav-student-login">
            <GraduationCap size={14} />
            Student Login
          </Link>
          <Link to="/login/admin" className="nb-btn nb-btn--solid" id="nav-admin-login">
            <ShieldCheck size={14} />
            Admin Login
          </Link>
        </div>
      </div>

      {/* Mobile backdrop */}
      {menuOpen && (
        <div className="nb-backdrop" onClick={() => setMenuOpen(false)} />
      )}
    </nav>
  );
}
