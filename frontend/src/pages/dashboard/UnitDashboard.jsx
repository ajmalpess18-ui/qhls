import { useState, useEffect } from 'react';
import Sidebar from '../../components/layout/Sidebar';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { Building2, Users, Plus, X, MapPin, CalendarCheck, Menu } from 'lucide-react';
function StatCard({ icon: Icon, value, label }) {
  return (
    <div className="stat-card">
      <div className="stat-icon"><Icon size={20} /></div>
      <div><div className="stat-value">{value ?? '—'}</div><div className="stat-label">{label}</div></div>
    </div>
  );
}

const statusBadge = { NEW:'badge-blue', IN_LIST:'badge-yellow', APPROVED:'badge-green', REJECTED:'badge-red', REMOVED:'badge-gray' };

const FACILITY_TYPES = [
  { value: 'own_building', label: 'Own Building' },
  { value: 'rented_building', label: 'Rented Building' },
  { value: 'mosque', label: 'Mosque' },
  { value: 'madrasa', label: 'Madrasa' },
  { value: 'other', label: 'Other' },
];

export default function UnitDashboard() {
  const { user } = useAuth();
  const [tab, setTab]           = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [stats, setStats]       = useState({});
  const [centers, setCenters]   = useState([]);
  const [students, setStudents] = useState([]);
  const [faculty, setFaculty]   = useState([]);
  const [subs, setSubs]         = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('');
  const [form, setForm]         = useState({});
  const [error, setError]       = useState('');
  const [attendDate, setAttendDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendance, setAttendance] = useState({});

  useEffect(() => { loadTab(); }, [tab]);

  const loadTab = async () => {
    try {
      if (tab === 'dashboard')   { const r = await api.get('/unit/stats');       setStats(r.data); }
      if (tab === 'centers')     { const r = await api.get('/unit/centers');     setCenters(r.data); }
      if (tab === 'students')    { 
        const [r1, r2] = await Promise.all([api.get('/unit/students'), api.get('/unit/centers')]);
        setStudents(r1.data); setCenters(r2.data);
      }
      if (tab === 'faculty')     { 
        const [r1, r2] = await Promise.all([api.get('/unit/faculty'), api.get('/unit/centers')]);
        setFaculty(r1.data); setCenters(r2.data);
      }
      if (tab === 'submissions') { const r = await api.get('/unit/submissions'); setSubs(r.data); }
      if (tab === 'attendance')  { const r = await api.get('/unit/students');    setStudents(r.data); }
    } catch {}
  };

  const openModal = (type) => { setModalType(type); setForm({ country: 'India' }); setError(''); setShowModal(true); };
  const closeModal = () => setShowModal(false);

  const handleCenter = async (e) => {
    e.preventDefault(); setError('');
    try { 
      await api.post('/unit/centers', { 
        ...form, 
        name: (form.name || '').toUpperCase(),
        district_id: user.district_id,
        zone_id: user.zone_id,
        unit_id: user.unit_id
      }); 
      closeModal(); 
      loadTab(); 
    }
    catch (err) { setError(err.response?.data?.detail || 'Error creating center'); }
  };

  const handleStudent = async (e) => {
    e.preventDefault(); setError('');
    try { 
      if (form.id) {
        await api.put(`/unit/students/${form.id}`, form);
      } else {
        await api.post('/unit/students', form); 
      }
      closeModal(); loadTab(); 
    }
    catch (err) { setError(err.response?.data?.detail || 'Error'); }
  };

  const handleFaculty = async (e) => {
    e.preventDefault(); setError('');
    if (!form.center_ids || form.center_ids.length === 0) {
      setError('Please select at least one center.');
      return;
    }
    try { 
      if (form.id) {
        await api.put(`/unit/faculty/${form.id}`, form);
      } else {
        await api.post('/unit/faculty', form); 
      }
      closeModal(); loadTab(); 
    }
    catch (err) { setError(err.response?.data?.detail || 'Error'); }
  };

  const deleteStudent = async (id) => {
    if(!window.confirm("Delete this student?")) return;
    try { await api.delete(`/unit/students/${id}`); loadTab(); }
    catch (err) { alert("Error deleting student"); }
  };

  const deleteFaculty = async (id) => {
    if(!window.confirm("Delete this faculty?")) return;
    try { await api.delete(`/unit/faculty/${id}`); loadTab(); }
    catch (err) { alert("Error deleting faculty"); }
  };

  const toggleAtt = (studentId, status) => {
    setAttendance(prev => ({ ...prev, [studentId]: status }));
  };

  const submitAttendance = async () => {
    const payload = students.map(s => ({
      student_id: s.id,
      date: attendDate,
      status: attendance[s.id] || 'absent',
    }));
    await api.post('/unit/attendance', payload);
    alert('Attendance saved!');
  };

  const f = (key) => form[key] || '';
  const set = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

  return (
    <div className="dashboard-layout">
      <Sidebar activeTab={tab} setActiveTab={setTab} isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
      <div className={`sidebar-overlay ${sidebarOpen ? 'show' : ''}`} onClick={() => setSidebarOpen(false)}></div>
      <div className="main-content">
        <div className="topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button className="mobile-menu-btn" onClick={() => setSidebarOpen(true)}>
              <Menu size={20} />
            </button>
            <span className="topbar-title">{tab.charAt(0).toUpperCase() + tab.slice(1)}</span>
          </div>
          <span className="topbar-user">👤 {user?.name}</span>
        </div>
        <div className="page-content">

          {tab === 'dashboard' && (
            <>
              <h2 style={{ marginBottom:'1rem' }}>Unit Dashboard</h2>
              <div className="stats-grid">
                <StatCard icon={Building2} value={stats.centers}  label="Centers" />
                <StatCard icon={Users}     value={stats.students} label="Students" />
                <StatCard icon={Users}     value={stats.faculty}  label="Faculty" />
              </div>
            </>
          )}

          {tab === 'centers' && (
            <>
              <div className="page-header">
                <h2>Centers</h2>
                <button className="btn btn-primary btn-sm" onClick={() => openModal('center')}><Plus size={15}/> New Center</button>
              </div>
              <div className="table-wrap">
                <table>
                  <thead><tr><th>Name</th><th>Place</th><th>Phone</th><th>Submission</th><th>Reason</th></tr></thead>
                  <tbody>
                    {centers.map(c => (
                      <tr key={c.id}>
                        <td><strong>{c.name}</strong></td>
                        <td>{c.place}</td>
                        <td>{c.phone_office}</td>
                        <td><span className={`badge ${statusBadge[c.submission_status]||'badge-gray'}`}>{c.submission_status || '—'}</span></td>
                        <td style={{fontSize:'0.8rem',color:'#dc2626'}}>{c.rejection_reason || ''}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {centers.length === 0 && <div className="empty-state"><Building2 size={36}/><p>No centers yet. Create one!</p></div>}
              </div>
            </>
          )}

          {tab === 'students' && (
            <>
              <div className="page-header">
                <h2>Students</h2>
                <button className="btn btn-primary btn-sm" onClick={() => openModal('student')}><Plus size={15}/> Add Student</button>
              </div>
              <div className="table-wrap">
                <table>
                  <thead><tr><th>Name</th><th>Reg. No.</th><th>Center</th><th>Class</th><th>Actions</th></tr></thead>
                  <tbody>
                    {students.map(s => (
                      <tr key={s.id}>
                        <td>{s.name}</td>
                        <td><strong>{s.reg_number}</strong></td>
                        <td>{s.center}</td>
                        <td>{s.class_name || '—'}</td>
                        <td style={{ display: 'flex', gap: '0.5rem' }}>
                          <button className="btn btn-outline btn-sm" onClick={() => openModal('student', { ...s, password: '' })}>Edit</button>
                          <button className="btn btn-danger btn-sm" onClick={() => deleteStudent(s.id)}>Delete</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {tab === 'faculty' && (
            <>
              <div className="page-header">
                <h2>Faculty</h2>
                <button className="btn btn-primary btn-sm" onClick={() => openModal('faculty')}><Plus size={15}/> Add Faculty</button>
              </div>
              <div className="table-wrap">
                <table>
                  <thead><tr><th>Name</th><th>Email</th><th>Phone</th><th>Center</th><th>Actions</th></tr></thead>
                  <tbody>
                    {faculty.map(f => (
                      <tr key={f.id}>
                        <td>{f.name}</td>
                        <td>{f.email}</td>
                        <td>{f.phone}</td>
                        <td>{f.center}</td>
                        <td style={{ display: 'flex', gap: '0.5rem' }}>
                          <button className="btn btn-outline btn-sm" onClick={() => openModal('faculty', { ...f, password: '' })}>Edit</button>
                          <button className="btn btn-danger btn-sm" onClick={() => deleteFaculty(f.id)}>Delete</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {tab === 'attendance' && (
            <>
              <h2 style={{ marginBottom:'1rem' }}>Mark Attendance</h2>
              <div className="card" style={{ marginBottom:'1rem', maxWidth:'300px' }}>
                <div className="form-group" style={{ marginBottom:0 }}>
                  <label className="form-label">Date</label>
                  <input className="form-input" type="date" value={attendDate} onChange={e => setAttendDate(e.target.value)} />
                </div>
              </div>
              <div className="table-wrap">
                <table>
                  <thead><tr><th>Student</th><th>Reg. No.</th><th>Present</th><th>Absent</th></tr></thead>
                  <tbody>
                    {students.map(s => (
                      <tr key={s.id}>
                        <td>{s.name}</td>
                        <td>{s.reg_number}</td>
                        <td>
                          <input type="radio" name={`att-${s.id}`} checked={attendance[s.id]==='present'}
                            onChange={() => toggleAtt(s.id, 'present')} />
                        </td>
                        <td>
                          <input type="radio" name={`att-${s.id}`} checked={attendance[s.id]==='absent'||!attendance[s.id]}
                            onChange={() => toggleAtt(s.id, 'absent')} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {students.length > 0 && (
                <button className="btn btn-primary" style={{ marginTop:'1rem' }} onClick={submitAttendance}>
                  <CalendarCheck size={15}/> Save Attendance
                </button>
              )}
            </>
          )}

          {tab === 'submissions' && (
            <>
              <h2 style={{ marginBottom:'1rem' }}>My Submissions</h2>
              <div className="table-wrap">
                <table>
                  <thead><tr><th>Center</th><th>Status</th><th>Reason</th><th>Date</th></tr></thead>
                  <tbody>
                    {subs.map(s => (
                      <tr key={s.id}>
                        <td><strong>{s.center_name}</strong></td>
                        <td><span className={`badge ${statusBadge[s.status]||'badge-gray'}`}>{s.status}</span></td>
                        <td style={{ color:'#dc2626', fontSize:'0.82rem' }}>{s.rejection_reason || '—'}</td>
                        <td>{new Date(s.submitted_at).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Modals */}
      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" style={{ maxWidth: modalType==='center' ? '680px' : '480px' }} onClick={e=>e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                {modalType==='center'  && 'Create New Center'}
                {modalType==='student' && 'Add Student'}
                {modalType==='faculty' && 'Add Faculty'}
              </h3>
              <button onClick={closeModal} style={{background:'none',border:'none',cursor:'pointer'}}><X size={20}/></button>
            </div>
            <div className="modal-body">
              {error && <div className="alert alert-error">{error}</div>}

              {/* Center Form */}
              {modalType === 'center' && (
                <form onSubmit={handleCenter}>
                  {/* Basic */}
                  <div className="form-section-title">📌 Basic Information</div>
                  <div className="form-grid-2">
                    <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                      <label className="form-label">Center Name (UPPERCASE)</label>
                      <input className="form-input" value={f('name')} onChange={e=>set('name',e.target.value.toUpperCase())} required placeholder="CENTER NAME" />
                    </div>
                  </div>

                  {/* Address */}
                  <div className="form-section-title">📌 Address</div>
                  <div className="form-grid-2">
                    <div className="form-group"><label className="form-label">Place</label><input className="form-input" value={f('place')} onChange={e=>set('place',e.target.value)} required /></div>
                    <div className="form-group"><label className="form-label">Post</label><input className="form-input" value={f('post')} onChange={e=>set('post',e.target.value)} required /></div>
                    <div className="form-group"><label className="form-label">Pin</label><input className="form-input" value={f('pin')} onChange={e=>set('pin',e.target.value)} required /></div>
                    <div className="form-group"><label className="form-label">Country</label><input className="form-input" value={f('country')} onChange={e=>set('country',e.target.value)} /></div>
                    <div className="form-group"><label className="form-label">State</label><input className="form-input" value={f('state_name')} onChange={e=>set('state_name',e.target.value)} required /></div>
                    <div className="form-group"><label className="form-label">Local Body Type</label>
                      <select className="form-select" value={f('local_body_type')} onChange={e=>set('local_body_type',e.target.value)}>
                        <option value="">Select</option>
                        <option>Panchayat</option><option>Municipality</option><option>Corporation</option><option>Other</option>
                      </select>
                    </div>
                    <div className="form-group"><label className="form-label">Local Body Name</label><input className="form-input" value={f('local_body_name')} onChange={e=>set('local_body_name',e.target.value)} /></div>
                    <div className="form-group"><label className="form-label">Phone (Office)</label><input className="form-input" value={f('phone_office')} onChange={e=>set('phone_office',e.target.value)} required /></div>
                    <div className="form-group"><label className="form-label">Email</label><input className="form-input" type="email" value={f('email')} onChange={e=>set('email',e.target.value)} /></div>
                  </div>
                  <div className="form-grid-2">
                    <div className="form-group"><label className="form-label">Latitude</label><input className="form-input" type="number" step="any" value={f('latitude')} onChange={e=>set('latitude',parseFloat(e.target.value))} /></div>
                    <div className="form-group"><label className="form-label">Longitude</label><input className="form-input" type="number" step="any" value={f('longitude')} onChange={e=>set('longitude',parseFloat(e.target.value))} /></div>
                  </div>

                  {/* Facility */}
                  <div className="form-section-title">📌 Physical Facility</div>
                  <div className="radio-group" style={{ marginBottom:'1rem' }}>
                    {FACILITY_TYPES.map(ft => (
                      <div key={ft.value} className={`radio-option ${f('facility_type')===ft.value?'selected':''}`} onClick={()=>set('facility_type',ft.value)}>
                        {ft.label}
                      </div>
                    ))}
                  </div>

                  {/* Schedule */}
                  <div className="form-section-title">📌 Schedule</div>
                  <div className="form-grid-2">
                    <div className="form-group"><label className="form-label">Class Date</label><input className="form-input" type="date" value={f('class_date')} onChange={e=>set('class_date',e.target.value)} /></div>
                    <div className="form-group"><label className="form-label">Class Time</label><input className="form-input" type="time" value={f('class_time')} onChange={e=>set('class_time',e.target.value)} /></div>
                  </div>

                  {/* Staff */}
                  <div className="form-section-title">📌 Staff Details</div>
                  <div className="form-grid-2">
                    <div className="form-group"><label className="form-label">Faculty Name</label><input className="form-input" value={f('faculty_name')} onChange={e=>set('faculty_name',e.target.value)} /></div>
                    <div className="form-group"><label className="form-label">Faculty Number</label><input className="form-input" value={f('faculty_number')} onChange={e=>set('faculty_number',e.target.value)} /></div>
                    <div className="form-group"><label className="form-label">Coordinator Name</label><input className="form-input" value={f('coordinator_name')} onChange={e=>set('coordinator_name',e.target.value)} /></div>
                    <div className="form-group"><label className="form-label">Coordinator Number</label><input className="form-input" value={f('coordinator_number')} onChange={e=>set('coordinator_number',e.target.value)} /></div>
                    <div className="form-group"><label className="form-label">QHLS Convener Name</label><input className="form-input" value={f('convener_name')} onChange={e=>set('convener_name',e.target.value)} /></div>
                    <div className="form-group"><label className="form-label">QHLS Convener Number</label><input className="form-input" value={f('convener_number')} onChange={e=>set('convener_number',e.target.value)} /></div>
                    <div className="form-group"><label className="form-label">NFE Convener Name</label><input className="form-input" value={f('nfe_convener_name')} onChange={e=>set('nfe_convener_name',e.target.value)} /></div>
                    <div className="form-group"><label className="form-label">NFE Convener Number</label><input className="form-input" value={f('nfe_convener_number')} onChange={e=>set('nfe_convener_number',e.target.value)} /></div>
                  </div>

                  <div className="modal-footer" style={{padding:0,marginTop:'1rem'}}>
                    <button type="button" className="btn btn-outline" onClick={closeModal}>Cancel</button>
                    <button type="submit" className="btn btn-primary">Submit to State</button>
                  </div>
                </form>
              )}

              {/* Student Form */}
              {modalType === 'student' && (
                <form onSubmit={handleStudent}>
                  <div className="form-group"><label className="form-label">Full Name</label><input className="form-input" value={f('name')} onChange={e=>set('name',e.target.value)} required /></div>
                  <div className="form-group"><label className="form-label">Email</label><input className="form-input" type="email" value={f('email')} onChange={e=>set('email',e.target.value)} required /></div>
                  <div className="form-group"><label className="form-label">Phone Number</label><input className="form-input" type="tel" value={f('phone')} onChange={e=>set('phone',e.target.value)} required /></div>
                  <div className="form-group">
                    <label className="form-label">Password {form.id && <span style={{fontSize:'0.8rem',color:'#666'}}>(Leave blank to keep unchanged)</span>}</label>
                    <input className="form-input" type="password" value={f('password')} onChange={e=>set('password',e.target.value)} required={!form.id} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Center</label>
                    <select className="form-select" value={f('center_id')} onChange={e=>set('center_id',parseInt(e.target.value))} required>
                      <option value="">Select Center</option>
                      {centers.filter(c => c.submission_status === 'APPROVED').map(c => <option key={c.id} value={c.id}>{c.name} ({c.place})</option>)}
                    </select>
                  </div>
                  <div className="form-group"><label className="form-label">Class</label><input className="form-input" placeholder="e.g. Class 1" value={f('class_name')} onChange={e=>set('class_name',e.target.value)} /></div>
                  <div className="modal-footer" style={{padding:0,marginTop:'1rem'}}>
                    <button type="button" className="btn btn-outline" onClick={closeModal}>Cancel</button>
                    <button type="submit" className="btn btn-primary">{form.id ? 'Save Changes' : 'Add Student'}</button>
                  </div>
                </form>
              )}

              {/* Faculty Form */}
              {modalType === 'faculty' && (
                <form onSubmit={handleFaculty}>
                  <div className="form-group"><label className="form-label">Full Name</label><input className="form-input" value={f('name')} onChange={e=>set('name',e.target.value)} required /></div>
                  <div className="form-group"><label className="form-label">Email</label><input className="form-input" type="email" value={f('email')} onChange={e=>set('email',e.target.value)} required /></div>
                  <div className="form-group"><label className="form-label">Phone Number</label><input className="form-input" type="tel" value={f('phone')} onChange={e=>set('phone',e.target.value)} required /></div>
                  <div className="form-group">
                    <label className="form-label">Password {form.id && <span style={{fontSize:'0.8rem',color:'#666'}}>(Leave blank to keep unchanged)</span>}</label>
                    <input className="form-input" type="password" value={f('password')} onChange={e=>set('password',e.target.value)} required={!form.id} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Assign Centers</label>
                    <div style={{ maxHeight: '150px', overflowY: 'auto', border: '1px solid var(--border)', padding: '0.5rem', borderRadius: 'var(--radius)' }}>
                      {centers.filter(c => c.submission_status === 'APPROVED').map(c => (
                        <label key={c.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                          <input 
                            type="checkbox" 
                            checked={(form.center_ids || []).includes(c.id)}
                            onChange={(e) => {
                              const curr = form.center_ids || [];
                              if (e.target.checked) set('center_ids', [...curr, c.id]);
                              else set('center_ids', curr.filter(id => id !== c.id));
                            }}
                          />
                          {c.name} ({c.place})
                        </label>
                      ))}
                      {centers.filter(c => c.submission_status === 'APPROVED').length === 0 && <span style={{ opacity: 0.6 }}>No approved centers available</span>}
                    </div>
                  </div>
                  <div className="modal-footer" style={{padding:0,marginTop:'1rem'}}>
                    <button type="button" className="btn btn-outline" onClick={closeModal}>Cancel</button>
                    <button type="submit" className="btn btn-primary">Add Faculty</button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


