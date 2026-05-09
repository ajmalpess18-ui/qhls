import { useState } from 'react';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import { Search, User, BookOpen, Award } from 'lucide-react';
import axios from 'axios';

export default function ResultCheck() {
  const [regNumber, setRegNumber]   = useState('');
  const [result, setResult]         = useState(null);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState('');

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!regNumber.trim()) return;
    setLoading(true); setError(''); setResult(null);
    try {
      const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const { data } = await axios.get(`${baseURL}/public/result/${regNumber.trim()}`);
      setResult(data);
    } catch (err) {
      setError(err.response?.data?.detail || 'No record found for this registration number.');
    } finally {
      setLoading(false);
    }
  };

  const getBadge = (grade) => {
    if (!grade) return 'badge-gray';
    const g = grade.toUpperCase();
    if (g === 'A+' || g === 'A' || g === 'DISTINCTION') return 'badge-green';
    if (g === 'B')  return 'badge-blue';
    if (g === 'C')  return 'badge-yellow';
    return 'badge-red';
  };

  return (
    <div className="page-wrapper">
      <Navbar />
      <section className="section" style={{ minHeight: 'calc(100vh - 130px)' }}>
        <div className="container" style={{ maxWidth: '700px' }}>
          <div className="section-title">
            <h2>Result Check</h2>
            <p>Enter your registration number to view your exam results</p>
          </div>

          <form onSubmit={handleSearch} className="result-search">
            <div className="search-row">
              <input
                className="form-input"
                placeholder="e.g. QHLS-2024-00001"
                value={regNumber}
                onChange={e => setRegNumber(e.target.value)}
              />
              <button className="btn btn-primary" type="submit" disabled={loading}>
                <Search size={16} /> {loading ? 'Searching...' : 'Search'}
              </button>
            </div>
          </form>

          {error && <div className="alert alert-error">{error}</div>}

          {result && (
            <div className="result-card">
              {/* Student info */}
              <h3 style={{ color: 'var(--green)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <User size={18} /> Student Information
              </h3>
              <div className="student-info" style={{ marginBottom: '1.5rem' }}>
                <div className="info-item">
                  <div className="label">Name</div>
                  <div className="value">{result.student.name}</div>
                </div>
                <div className="info-item">
                  <div className="label">Reg. Number</div>
                  <div className="value">{result.student.reg_number}</div>
                </div>
                <div className="info-item">
                  <div className="label">Class</div>
                  <div className="value">{result.student.class_name || '—'}</div>
                </div>
                <div className="info-item">
                  <div className="label">Center</div>
                  <div className="value">{result.student.center || '—'}</div>
                </div>
                <div className="info-item">
                  <div className="label">Unit</div>
                  <div className="value">{result.student.unit || '—'}</div>
                </div>
              </div>

              {/* Results */}
              <h3 style={{ color: 'var(--green)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Award size={18} /> Exam Results
              </h3>
              {result.results.length === 0 ? (
                <div className="empty-state">
                  <BookOpen size={36} />
                  <p>No results published yet.</p>
                </div>
              ) : (
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Exam</th><th>Subject</th>
                        <th>Marks</th><th>Total</th><th>Grade</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.results.map((r, i) => (
                        <tr key={i}>
                          <td>{r.exam_name}</td>
                          <td>{r.subject}</td>
                          <td><strong>{r.marks}</strong></td>
                          <td>{r.total_marks}</td>
                          <td><span className={`badge ${getBadge(r.grade)}`}>{r.grade || '—'}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </section>
      <Footer />
    </div>
  );
}
