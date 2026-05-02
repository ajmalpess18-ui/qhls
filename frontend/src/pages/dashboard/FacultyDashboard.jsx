import { useState, useEffect } from 'react';
import Sidebar from '../../components/layout/Sidebar';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { Building2, Users, Phone, Mail } from 'lucide-react';

export default function FacultyDashboard() {
  const { user }  = useAuth();
  const [tab, setTab] = useState('dashboard');
  const [centers, setCenters] = useState([]);

  useEffect(() => { loadCenters(); }, []);

  const loadCenters = async () => {
    try { const r = await api.get('/faculty/centers'); setCenters(r.data); }
    catch {}
  };

  return (
    <div className="dashboard-layout">
      <Sidebar activeTab={tab} setActiveTab={setTab} />
      <div className="main-content">
        <div className="topbar">
          <span className="topbar-title">{tab === 'dashboard' ? 'Dashboard' : 'My Center'}</span>
          <span className="topbar-user">👤 {user?.name}</span>
        </div>
        <div className="page-content">
          <h2 style={{ marginBottom:'1rem' }}>Welcome, {user?.name}</h2>
          {centers.length === 0 ? (
            <div className="empty-state"><Building2 size={40}/><p>No center assigned yet.</p></div>
          ) : centers.map(c => (
            <div key={c.id} className="card" style={{ maxWidth:'600px' }}>
              <h3 style={{ color:'var(--green)', marginBottom:'1rem' }}>{c.name}</h3>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.75rem 1.5rem', marginBottom:'1rem' }}>
                <div className="info-item"><div className="label">Place</div><div className="value">{c.place}</div></div>
                <div className="info-item"><div className="label">Facility</div><div className="value" style={{textTransform:'capitalize'}}>{c.facility_type?.replace(/_/g,' ')}</div></div>
                <div className="info-item"><div className="label">Class Date</div><div className="value">{c.class_date || '—'}</div></div>
                <div className="info-item"><div className="label">Class Time</div><div className="value">{c.class_time || '—'}</div></div>
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:'0.5rem' }}>
                <div style={{ display:'flex', alignItems:'center', gap:'0.5rem', fontSize:'0.88rem' }}><Phone size={15} color="var(--green)"/> {c.phone_office}</div>
                {c.email && <div style={{ display:'flex', alignItems:'center', gap:'0.5rem', fontSize:'0.88rem' }}><Mail size={15} color="var(--green)"/> {c.email}</div>}
                <div style={{ display:'flex', alignItems:'center', gap:'0.5rem', fontSize:'0.88rem' }}><Users size={15} color="var(--green)"/><strong>{c.student_count}</strong> students enrolled</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
