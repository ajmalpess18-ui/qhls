import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { ShieldCheck } from 'lucide-react';

export default function AdminLogin() {
  const { login } = useAuth();
  const navigate  = useNavigate();
  const [form, setForm]       = useState({ email: '', password: '' });
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const { data } = await api.post('/auth/admin/login', form);
      login(data);
      const map = {
        admin: '/dashboard/admin', state: '/dashboard/state',
        district: '/dashboard/district', zone: '/dashboard/zone',
        unit: '/dashboard/unit', faculty: '/dashboard/faculty',
      };
      navigate(map[data.role] || '/dashboard');
    } catch (err) {
      setError(err.response?.data?.detail || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <div className="logo-circle"><ShieldCheck size={24} /></div>
          <h2>Admin Login</h2>
          <p>For Admin, State, District, Zone, Unit & Faculty</p>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              className="form-input" name="email" type="email"
              placeholder="admin@qhls.org" value={form.email}
              onChange={handleChange} required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              className="form-input" name="password" type="password"
              placeholder="••••••••" value={form.password}
              onChange={handleChange} required
            />
          </div>
          <button className="btn btn-primary btn-full" type="submit" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: '0.85rem' }}>
          Are you a student? <Link to="/login/student" style={{ color: 'var(--green)', fontWeight: '500' }}>Student Login</Link>
        </p>
        <p style={{ textAlign: 'center', marginTop: '0.5rem', fontSize: '0.85rem' }}>
          <Link to="/" style={{ color: 'var(--text-muted)' }}>← Back to Home</Link>
        </p>
      </div>
    </div>
  );
}
