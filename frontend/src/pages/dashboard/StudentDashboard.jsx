import { useState, useEffect } from 'react';
import Sidebar from '../../components/layout/Sidebar';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { User, Award, CalendarCheck, Download, Bell } from 'lucide-react';

export default function StudentDashboard() {
  const { user } = useAuth();
  const [tab, setTab]           = useState('dashboard');
  const [profile, setProfile]   = useState(null);
  const [results, setResults]   = useState([]);
  const [attendance, setAttendance] = useState(null);
  const [materials, setMaterials]   = useState([]);
  const [announcements, setAnnouncements] = useState([]);

  useEffect(() => { loadTab(); }, [tab]);

  const loadTab = async () => {
    try {
      if (tab === 'dashboard' || tab === 'profile') { const r = await api.get('/student/profile'); setProfile(r.data); }
      if (tab === 'results')    { const r = await api.get('/student/results');       setResults(r.data); }
      if (tab === 'attendance') { const r = await api.get('/student/attendance');    setAttendance(r.data); }
      if (tab === 'materials')  { const r = await api.get('/student/materials');     setMaterials(r.data); }
    } catch {}
  };

  useEffect(() => {
    api.get('/student/announcements').then(r => setAnnouncements(r.data)).catch(() => {});
  }, []);

  const gradeColor = (g) => {
    if (!g) return 'badge-gray';
    const u = g.toUpperCase();
    if (u==='A+' || u==='A' || u==='DISTINCTION') return 'badge-green';
    if (u==='B') return 'badge-blue';
    if (u==='C') return 'badge-yellow';
    return 'badge-red';
  };

  return (
    <div className="dashboard-layout">
      <Sidebar activeTab={tab} setActiveTab={setTab} />
      <div className="main-content">
        <div className="topbar">
          <span className="topbar-title">{tab.charAt(0).toUpperCase() + tab.slice(1)}</span>
          <span className="topbar-user">👤 {user?.name}</span>
        </div>
        <div className="page-content">

          {tab === 'dashboard' && profile && (
            <>
              <h2 style={{ marginBottom:'1rem' }}>Welcome, {profile.name}</h2>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))', gap:'1rem', marginBottom:'1.5rem' }}>
                <div className="stat-card"><div className="stat-icon"><User size={20}/></div><div><div className="stat-value" style={{fontSize:'1rem'}}>{profile.reg_number}</div><div className="stat-label">Reg. Number</div></div></div>
                <div className="stat-card"><div className="stat-icon"><User size={20}/></div><div><div className="stat-value" style={{fontSize:'1rem'}}>{profile.class_name || '—'}</div><div className="stat-label">Class</div></div></div>
                <div className="stat-card"><div className="stat-icon"><User size={20}/></div><div><div className="stat-value" style={{fontSize:'1rem'}}>{profile.center || '—'}</div><div className="stat-label">Center</div></div></div>
              </div>
              {announcements.length > 0 && (
                <div>
                  <h3 style={{ color:'var(--green)', marginBottom:'0.75rem', display:'flex', alignItems:'center', gap:'0.4rem' }}><Bell size={16}/> Announcements</h3>
                  {announcements.slice(0,3).map(a => (
                    <div key={a.id} className="card" style={{ marginBottom:'0.75rem', padding:'1rem' }}>
                      <div style={{ fontWeight:'600', marginBottom:'0.25rem' }}>{a.title}</div>
                      <div style={{ fontSize:'0.85rem', color:'var(--text-muted)' }}>{a.body}</div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {tab === 'profile' && profile && (
            <div className="card" style={{ maxWidth:'500px' }}>
              <h2 style={{ marginBottom:'1.25rem' }}>My Profile</h2>
              {[['Name', profile.name], ['Email', profile.email], ['Reg. Number', profile.reg_number],
                ['Class', profile.class_name||'—'], ['Center', profile.center||'—'], ['Unit', profile.unit||'—']
              ].map(([k,v]) => (
                <div key={k} style={{ display:'flex', justifyContent:'space-between', padding:'0.6rem 0', borderBottom:'1px solid var(--border)' }}>
                  <span style={{ color:'var(--text-muted)', fontSize:'0.88rem' }}>{k}</span>
                  <span style={{ fontWeight:'500', fontSize:'0.88rem' }}>{v}</span>
                </div>
              ))}
            </div>
          )}

          {tab === 'results' && (
            <>
              <h2 style={{ marginBottom:'1rem' }}>My Results</h2>
              {results.length === 0 ? (
                <div className="empty-state"><Award size={40}/><p>No results published yet.</p></div>
              ) : (
                <div className="table-wrap">
                  <table>
                    <thead><tr><th>Exam</th><th>Subject</th><th>Marks</th><th>Total</th><th>Grade</th><th>Date</th></tr></thead>
                    <tbody>
                      {results.map((r,i) => (
                        <tr key={i}>
                          <td>{r.exam_name}</td><td>{r.subject}</td>
                          <td><strong>{r.marks}</strong></td><td>{r.total_marks}</td>
                          <td><span className={`badge ${gradeColor(r.grade)}`}>{r.grade || '—'}</span></td>
                          <td>{r.date}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}

          {tab === 'attendance' && attendance && (
            <>
              <h2 style={{ marginBottom:'1rem' }}>My Attendance</h2>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'1rem', maxWidth:'500px', marginBottom:'1.5rem' }}>
                <div className="stat-card"><div className="stat-icon"><CalendarCheck size={18}/></div><div><div className="stat-value">{attendance.total}</div><div className="stat-label">Total</div></div></div>
                <div className="stat-card"><div className="stat-icon" style={{background:'#dcfce7',color:'#166534'}}><CalendarCheck size={18}/></div><div><div className="stat-value" style={{color:'#166534'}}>{attendance.present}</div><div className="stat-label">Present</div></div></div>
                <div className="stat-card"><div className="stat-icon" style={{background:'#fee2e2',color:'#991b1b'}}><CalendarCheck size={18}/></div><div><div className="stat-value" style={{color:'#991b1b'}}>{attendance.absent}</div><div className="stat-label">Absent</div></div></div>
              </div>
              <div className="card" style={{ maxWidth:'400px', marginBottom:'1rem', textAlign:'center' }}>
                <div style={{ fontSize:'2rem', fontWeight:'700', color:'var(--green)' }}>{attendance.percentage}%</div>
                <div style={{ color:'var(--text-muted)', fontSize:'0.85rem' }}>Attendance Percentage</div>
              </div>
              <div className="attendance-grid">
                {attendance.records.map((r, i) => (
                  <div key={i} className={`att-dot ${r.status}`} title={`${r.date}: ${r.status}`}>
                    {new Date(r.date).getDate()}
                  </div>
                ))}
              </div>
            </>
          )}

          {tab === 'materials' && (
            <>
              <h2 style={{ marginBottom:'1rem' }}>Study Materials</h2>
              {materials.length === 0 ? (
                <div className="empty-state"><Download size={40}/><p>No materials available yet.</p></div>
              ) : (
                <div style={{ display:'flex', flexDirection:'column', gap:'0.75rem' }}>
                  {materials.map(m => (
                    <div key={m.id} className="card" style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'1rem 1.25rem' }}>
                      <div>
                        <div style={{ fontWeight:'500' }}>{m.title}</div>
                        {m.description && <div style={{ fontSize:'0.82rem', color:'var(--text-muted)' }}>{m.description}</div>}
                        {m.class_name && <span className="badge badge-green" style={{ marginTop:'0.3rem', display:'inline-block' }}>{m.class_name}</span>}
                      </div>
                      <a href={`http://localhost:8000${m.file_url}`} target="_blank" rel="noreferrer" className="btn btn-primary btn-sm">
                        <Download size={14}/> Download
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
