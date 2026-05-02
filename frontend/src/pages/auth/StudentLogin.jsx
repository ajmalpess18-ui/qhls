import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { GraduationCap } from 'lucide-react';

export default function StudentLogin() {
  const { login } = useAuth();
  const navigate  = useNavigate();
  const [form, setForm]     = useState({ phone: '', password: '' });
  const [error, setError]   = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const { data } = await api.post('/auth/student/login', form);
      login(data);
      navigate('/dashboard/student');
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
          <div className="logo-circle"><GraduationCap size={24} /></div>
          <h2>Student Login</h2>
          <p>Sign in to access your dashboard</p>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Phone Number</label>
            <input
              className="form-input" name="phone" type="tel"
              placeholder="e.g. 9876543210" value={form.phone}
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
          Are you an admin? <Link to="/login/admin" style={{ color: 'var(--green)', fontWeight: '500' }}>Admin Login</Link>
        </p>
        <p style={{ textAlign: 'center', marginTop: '0.5rem', fontSize: '0.85rem' }}>
          <Link to="/" style={{ color: 'var(--text-muted)' }}>← Back to Home</Link>
        </p>
      </div>
    </div>
  );
}
