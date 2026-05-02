import { Link, useLocation } from 'react-router-dom';
import { BookOpen, Home, Search, Download, LogIn } from 'lucide-react';

export default function Navbar() {
  const { pathname } = useLocation();
  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand">
        <div className="brand-icon">Q</div>
        <div>
          <div className="brand-name">QHLS</div>
        </div>
      </Link>

      <div className="navbar-links">
        <Link to="/"          className={pathname === '/'          ? 'active' : ''}>Home</Link>
        <Link to="/results"   className={pathname === '/results'   ? 'active' : ''}>Results</Link>
        <Link to="/downloads" className={pathname === '/downloads' ? 'active' : ''}>Downloads</Link>
      </div>

      <div className="navbar-actions">
        <Link to="/login/student" className="btn btn-outline btn-sm">Student Login</Link>
        <Link to="/login/admin"   className="btn btn-primary btn-sm">Admin Login</Link>
      </div>
    </nav>
  );
}
