import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { BookOpen, Home, Search, Download, LogIn, Menu, X } from 'lucide-react';

export default function Navbar() {
  const { pathname } = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand">
        <div className="brand-icon">Q</div>
        <div>
          <div className="brand-name">QHLS</div>
        </div>
      </Link>

      <button className="mobile-menu-btn" onClick={() => setMenuOpen(!menuOpen)}>
        {menuOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      <div className={`navbar-menu ${menuOpen ? 'open' : ''}`}>
        <div className="navbar-links" onClick={() => setMenuOpen(false)}>
          <Link to="/"          className={pathname === '/'          ? 'active' : ''}>Home</Link>
          <Link to="/results"   className={pathname === '/results'   ? 'active' : ''}>Results</Link>
          <Link to="/downloads" className={pathname === '/downloads' ? 'active' : ''}>Downloads</Link>
        </div>

        <div className="navbar-actions" onClick={() => setMenuOpen(false)}>
          <Link to="/login/student" className="btn btn-outline btn-sm">Student Login</Link>
          <Link to="/login/admin"   className="btn btn-primary btn-sm">Admin Login</Link>
        </div>
      </div>
    </nav>
  );
}
