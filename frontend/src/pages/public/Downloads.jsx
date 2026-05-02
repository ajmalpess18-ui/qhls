import { useState, useEffect } from 'react';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import { Download, BookOpen, Search } from 'lucide-react';
import axios from 'axios';

export default function Downloads() {
  const [materials, setMaterials] = useState([]);
  const [filter, setFilter]       = useState('');
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    axios.get('http://localhost:8000/public/materials')
      .then(r => setMaterials(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = materials.filter(m =>
    !filter || m.class_name === filter || !m.class_name
  );

  const classes = [...new Set(materials.map(m => m.class_name).filter(Boolean))];

  return (
    <div className="page-wrapper">
      <Navbar />
      <section className="section" style={{ minHeight: 'calc(100vh - 130px)' }}>
        <div className="container" style={{ maxWidth: '800px' }}>
          <div className="section-title">
            <h2>Study Materials</h2>
            <p>Download study materials and resources published by QHLS</p>
          </div>

          {/* Class filter */}
          {classes.length > 0 && (
            <div style={{ marginBottom: '1.25rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <button
                className={`btn btn-sm ${!filter ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => setFilter('')}
              >All</button>
              {classes.map(c => (
                <button
                  key={c}
                  className={`btn btn-sm ${filter === c ? 'btn-primary' : 'btn-outline'}`}
                  onClick={() => setFilter(c)}
                >{c}</button>
              ))}
            </div>
          )}

          {loading && <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Loading materials...</p>}

          {!loading && filtered.length === 0 && (
            <div className="empty-state">
              <BookOpen size={40} />
              <p>No study materials available yet.</p>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {filtered.map(m => (
              <div key={m.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ background: 'var(--green-light)', color: 'var(--green)', borderRadius: '8px', padding: '0.5rem', display: 'flex' }}>
                    <BookOpen size={20} />
                  </div>
                  <div>
                    <div style={{ fontWeight: '500', color: 'var(--text)' }}>{m.title}</div>
                    {m.description && <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{m.description}</div>}
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                      {m.class_name && <span className="badge badge-green" style={{ marginRight: '0.5rem' }}>{m.class_name}</span>}
                      {m.created_at}
                    </div>
                  </div>
                </div>
                <a
                  href={`http://localhost:8000${m.file_url}`}
                  target="_blank" rel="noreferrer"
                  className="btn btn-primary btn-sm"
                  style={{ flexShrink: 0 }}
                >
                  <Download size={14} /> Download
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
}
