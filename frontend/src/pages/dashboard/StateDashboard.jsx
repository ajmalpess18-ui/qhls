import { useState, useEffect } from 'react';
import Sidebar from '../../components/layout/Sidebar';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { Building2, Users, MapPin, ClipboardList, Plus, X, CheckCircle, XCircle, Trash2, Upload, FileText, BookOpen, Megaphone, Menu } from 'lucide-react';
function StatCard({ icon: Icon, value, label }) {
  return (
    <div className="stat-card">
      <div className="stat-icon"><Icon size={20} /></div>
      <div><div className="stat-value">{value ?? '—'}</div><div className="stat-label">{label}</div></div>
    </div>
  );
}

const statusBadge = { NEW: 'badge-blue', IN_LIST: 'badge-yellow', APPROVED: 'badge-green', REJECTED: 'badge-red', REMOVED: 'badge-gray' };

export default function StateDashboard() {
  const { user } = useAuth();
  const [tab, setTab]             = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [stats, setStats]         = useState({});
  const [districts, setDistricts] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('');
  const [form, setForm]           = useState({});
  const [reviewSub, setReviewSub] = useState(null);
  const [error, setError]         = useState('');
  const [uploadMode, setUploadMode] = useState('manual'); // 'manual' | 'csv'
  const [csvFile, setCsvFile]     = useState(null);
  const [pdfFile, setPdfFile]     = useState(null);

  // Drill-down states
  const [hierarchy, setHierarchy] = useState([]);
  const [selDistrict, setSelDistrict] = useState(null);
  const [selZone, setSelZone] = useState(null);
  const [selUnit, setSelUnit] = useState(null);
  const [unitStudents, setUnitStudents] = useState([]);

  useEffect(() => { loadTab(); }, [tab]);

  const loadTab = async () => {
    try {
      if (tab === 'dashboard') { const r = await api.get('/state/stats'); setStats(r.data); }
      if (tab === 'districts') { const r = await api.get('/state/districts'); setDistricts(r.data); }
      if (tab === 'submissions') { const r = await api.get('/state/submissions'); setSubmissions(r.data); }
      if (tab === 'materials')  { const r = await api.get('/state/materials'); setMaterials(r.data); }
      if (tab === 'announcements') { const r = await api.get('/state/announcements'); setAnnouncements(r.data); }
      if (tab === 'results') { const r = await api.get('/state/hierarchy'); setHierarchy(r.data); }
    } catch {}
  };

  const loadUnitStudents = async (unit_id) => {
    try {
      const r = await api.get(`/state/units/${unit_id}/students`);
      setUnitStudents(r.data);
    } catch (err) {
      console.error(err);
    }
  };

  const openModal = (type, extra = {}) => { setModalType(type); setForm(extra); setError(''); setShowModal(true); };
  const closeModal = () => { setShowModal(false); setReviewSub(null); };

  const handleDistrict = async (e) => {
    e.preventDefault(); setError('');
    try { await api.post('/state/districts', { name: form.name }); closeModal(); loadTab(); }
    catch (err) { setError(err.response?.data?.detail || 'Error'); }
  };

  const handleReview = async (status) => {
    await api.patch(`/state/submissions/${reviewSub.id}`, { status, rejection_reason: form.reason || null });
    closeModal(); loadTab();
  };

  const handleResultManual = async (e) => {
    e.preventDefault(); setError('');
    try { await api.post('/state/results/manual', form); closeModal(); }
    catch (err) { setError(err.response?.data?.detail || 'Error'); }
  };

  const handleResultCSV = async (e) => {
    e.preventDefault(); setError('');
    const fd = new FormData();
    fd.append('file', csvFile); fd.append('exam_name', form.exam_name || '');
    try { await api.post('/state/results/upload-csv', fd); closeModal(); }
    catch (err) { setError(err.response?.data?.detail || 'Error'); }
  };

  const handleMaterialUpload = async (e) => {
    e.preventDefault(); setError('');
    const fd = new FormData();
    fd.append('file', pdfFile); fd.append('title', form.title || '');
    if (form.description) fd.append('description', form.description);
    if (form.class_name)  fd.append('class_name', form.class_name);
    try { await api.post('/state/materials/upload', fd); closeModal(); loadTab(); }
    catch (err) { setError(err.response?.data?.detail || 'Error'); }
  };

  const handleAnnouncement = async (e) => {
    e.preventDefault(); setError('');
    try { await api.post('/state/announcements', { title: form.title, body: form.body }); closeModal(); loadTab(); }
    catch (err) { setError(err.response?.data?.detail || 'Error'); }
  };

  const deleteMaterial = async (id) => {
    if (!window.confirm('Delete this material?')) return;
    await api.delete(`/state/materials/${id}`); loadTab();
  };

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
              <h2 style={{ marginBottom: '1rem' }}>State Dashboard</h2>
              <div className="stats-grid">
                <StatCard icon={Building2} value={stats.districts} label="Districts" />
                <StatCard icon={MapPin}    value={stats.zones}     label="Zones" />
                <StatCard icon={MapPin}    value={stats.units}     label="Units" />
                <StatCard icon={Building2} value={stats.centers}   label="Centers" />
                <StatCard icon={Users}     value={stats.students}  label="Students" />
                <StatCard icon={Users}     value={stats.faculty}   label="Faculty" />
              </div>
            </>
          )}

          {tab === 'districts' && (
            <>
              <div className="page-header">
                <h2>Districts</h2>
                <button className="btn btn-primary btn-sm" onClick={() => openModal('district')}><Plus size={15} /> Add District</button>
              </div>
              <div className="table-wrap">
                <table>
                  <thead><tr><th>#</th><th>District Name</th></tr></thead>
                  <tbody>{districts.map((d, i) => <tr key={d.id}><td>{i+1}</td><td>{d.name}</td></tr>)}</tbody>
                </table>
              </div>
            </>
          )}

          {tab === 'submissions' && (
            <>
              <h2 style={{ marginBottom: '1rem' }}>Center Submissions</h2>
              <div className="table-wrap">
                <table>
                  <thead><tr><th>Center</th><th>Unit</th><th>Status</th><th>Submitted</th><th>Actions</th></tr></thead>
                  <tbody>
                    {submissions.map(s => (
                      <tr key={s.id}>
                        <td><strong>{s.center_name}</strong></td>
                        <td>{s.unit_id}</td>
                        <td><span className={`badge ${statusBadge[s.status] || 'badge-gray'}`}>{s.status}</span></td>
                        <td>{new Date(s.submitted_at).toLocaleDateString()}</td>
                        <td>
                          {(s.status === 'NEW' || s.status === 'IN_LIST') && (
                            <button className="btn btn-outline btn-sm" onClick={() => { setReviewSub(s); setForm({}); setShowModal(true); setModalType('review'); }}>
                              Review
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {tab === 'results' && (
            <div>
              <div className="page-header">
                <h2>Upload Results</h2>
              </div>
              
              <div className="breadcrumbs" style={{ marginBottom: '1.5rem', display: 'flex', gap: '0.5rem', color: 'var(--text-muted)' }}>
                <span style={{ cursor: 'pointer', color: !selDistrict ? 'var(--text)' : 'inherit', fontWeight: !selDistrict ? '600' : '400' }} onClick={() => {setSelDistrict(null); setSelZone(null); setSelUnit(null);}}>All Districts</span>
                {selDistrict && <><span>/</span><span style={{ cursor: 'pointer', color: !selZone ? 'var(--text)' : 'inherit', fontWeight: !selZone ? '600' : '400' }} onClick={() => {setSelZone(null); setSelUnit(null);}}>{selDistrict.name}</span></>}
                {selZone && <><span>/</span><span style={{ cursor: 'pointer', color: !selUnit ? 'var(--text)' : 'inherit', fontWeight: !selUnit ? '600' : '400' }} onClick={() => setSelUnit(null)}>{selZone.name}</span></>}
                {selUnit && <><span>/</span><span style={{ color: 'var(--text)', fontWeight: '600' }}>{selUnit.name}</span></>}
              </div>

              {!selDistrict && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
                  {hierarchy.map(d => (
                    <div key={d.id} className="card" style={{ cursor: 'pointer', padding: '1.25rem', textAlign: 'center', transition: 'all 0.2s', border: '1px solid transparent' }} 
                         onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--primary)'}
                         onMouseLeave={e => e.currentTarget.style.borderColor = 'transparent'}
                         onClick={() => setSelDistrict(d)}>
                      <MapPin size={24} style={{ color: 'var(--primary)', margin: '0 auto 0.5rem auto' }} />
                      <div style={{ fontWeight: '600' }}>{d.name}</div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>{d.zones?.length || 0} Zones</div>
                    </div>
                  ))}
                  {hierarchy.length === 0 && <div className="empty-state" style={{ gridColumn: '1 / -1' }}><p>No hierarchy data available.</p></div>}
                </div>
              )}

              {selDistrict && !selZone && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
                  {selDistrict.zones.map(z => (
                    <div key={z.id} className="card" style={{ cursor: 'pointer', padding: '1.25rem', textAlign: 'center', transition: 'all 0.2s', border: '1px solid transparent' }}
                         onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--primary)'}
                         onMouseLeave={e => e.currentTarget.style.borderColor = 'transparent'}
                         onClick={() => setSelZone(z)}>
                      <MapPin size={24} style={{ color: 'var(--green)', margin: '0 auto 0.5rem auto' }} />
                      <div style={{ fontWeight: '600' }}>{z.name}</div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>{z.units?.length || 0} Units</div>
                    </div>
                  ))}
                  {(!selDistrict.zones || selDistrict.zones.length === 0) && <div className="empty-state" style={{ gridColumn: '1 / -1' }}><p>No zones in this district.</p></div>}
                </div>
              )}

              {selZone && !selUnit && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
                  {selZone.units.map(u => (
                    <div key={u.id} className="card" style={{ cursor: 'pointer', padding: '1.25rem', textAlign: 'center', transition: 'all 0.2s', border: '1px solid transparent' }}
                         onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--primary)'}
                         onMouseLeave={e => e.currentTarget.style.borderColor = 'transparent'}
                         onClick={() => { setSelUnit(u); loadUnitStudents(u.id); }}>
                      <Building2 size={24} style={{ color: 'var(--blue)', margin: '0 auto 0.5rem auto' }} />
                      <div style={{ fontWeight: '600' }}>{u.name}</div>
                    </div>
                  ))}
                  {(!selZone.units || selZone.units.length === 0) && <div className="empty-state" style={{ gridColumn: '1 / -1' }}><p>No units in this zone.</p></div>}
                </div>
              )}

              {selUnit && (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h3 style={{ margin: 0 }}>Students in {selUnit.name}</h3>
                    <button className="btn btn-primary" onClick={() => openModal('csv_mark', { unit_id: selUnit.id })}>
                      <Upload size={15} /> Bulk CSV Upload
                    </button>
                  </div>
                  <div className="table-wrap">
                    <table>
                      <thead><tr><th>Name</th><th>Reg. No.</th><th>Center</th><th>Action</th></tr></thead>
                      <tbody>
                        {unitStudents.map(s => (
                          <tr key={s.id}>
                            <td>{s.name}</td>
                            <td><strong>{s.reg_number}</strong></td>
                            <td>{s.center}</td>
                            <td>
                              <button className="btn btn-outline btn-sm" onClick={() => openModal('manual_mark', { student_id: s.id })}>
                                Add Mark
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {unitStudents.length === 0 && <div className="empty-state" style={{ padding: '2rem' }}><p>No students found in this unit.</p></div>}
                  </div>
                </>
              )}
            </div>
          )}

          {tab === 'materials' && (
            <>
              <div className="page-header">
                <h2>Study Materials</h2>
                <button className="btn btn-primary btn-sm" onClick={() => openModal('material')}><Plus size={15} /> Upload Material</button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {materials.map(m => (
                  <div key={m.id} className="card" style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'1rem 1.25rem' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:'0.75rem' }}>
                      <div style={{ background:'var(--green-light)',color:'var(--green)',borderRadius:'8px',padding:'0.5rem',display:'flex' }}><BookOpen size={18}/></div>
                      <div>
                        <div style={{ fontWeight:'500' }}>{m.title}</div>
                        {m.class_name && <span className="badge badge-green">{m.class_name}</span>}
                      </div>
                    </div>
                    <button className="btn btn-danger btn-sm" onClick={() => deleteMaterial(m.id)}><Trash2 size={14}/></button>
                  </div>
                ))}
                {materials.length === 0 && <div className="empty-state"><BookOpen size={36}/><p>No materials uploaded yet.</p></div>}
              </div>
            </>
          )}

          {tab === 'announcements' && (
            <>
              <div className="page-header">
                <h2>Announcements</h2>
                <button className="btn btn-primary btn-sm" onClick={() => openModal('announcement')}><Plus size={15}/> New</button>
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:'0.75rem' }}>
                {announcements.map(a => (
                  <div key={a.id} className="card">
                    <div style={{ fontWeight:'600', color:'var(--green)', marginBottom:'0.3rem' }}>{a.title}</div>
                    <div style={{ fontSize:'0.88rem', color:'var(--text-muted)' }}>{a.body}</div>
                    <div style={{ fontSize:'0.75rem', color:'var(--text-muted)', marginTop:'0.4rem' }}>{new Date(a.created_at).toLocaleDateString()}</div>
                  </div>
                ))}
              </div>
            </>
          )}

          {tab === 'users' && (
            <div className="alert alert-info">Use the Admin panel to manage user accounts.</div>
          )}
        </div>
      </div>

      {/* Modals */}
      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                {modalType==='district' && 'Add District'}
                {modalType==='review' && 'Review Submission'}
                {modalType==='material' && 'Upload Study Material'}
                {modalType==='announcement' && 'New Announcement'}
                {modalType==='manual_mark' && 'Add Manual Mark'}
                {modalType==='csv_mark' && 'Bulk CSV Upload'}
              </h3>
              <button onClick={closeModal} style={{background:'none',border:'none',cursor:'pointer'}}><X size={20}/></button>
            </div>
            <div className="modal-body">
              {error && <div className="alert alert-error">{error}</div>}

              {modalType === 'district' && (
                <form onSubmit={handleDistrict}>
                  <div className="form-group">
                    <label className="form-label">District Name</label>
                    <input className="form-input" value={form.name||''} onChange={e=>setForm({...form,name:e.target.value})} required />
                  </div>
                  <div className="modal-footer" style={{padding:0,marginTop:'1rem'}}>
                    <button type="button" className="btn btn-outline" onClick={closeModal}>Cancel</button>
                    <button type="submit" className="btn btn-primary">Add</button>
                  </div>
                </form>
              )}

              {modalType === 'review' && reviewSub && (
                <div>
                  <p><strong>Center:</strong> {reviewSub.center_name}</p>
                  <p style={{marginTop:'0.5rem'}}><strong>Current Status:</strong> <span className={`badge ${statusBadge[reviewSub.status]}`}>{reviewSub.status}</span></p>
                  <div className="form-group" style={{marginTop:'1rem'}}>
                    <label className="form-label">Rejection Reason (if rejecting)</label>
                    <input className="form-input" placeholder="Optional" value={form.reason||''} onChange={e=>setForm({...form,reason:e.target.value})}/>
                  </div>
                  <div className="modal-footer" style={{padding:0,marginTop:'1rem',justifyContent:'flex-start',gap:'0.5rem'}}>
                    <button className="btn btn-primary btn-sm" onClick={()=>handleReview('APPROVED')}><CheckCircle size={14}/> Approve</button>
                    <button className="btn btn-danger btn-sm"  onClick={()=>handleReview('REJECTED')}><XCircle size={14}/> Reject</button>
                    <button className="btn btn-outline btn-sm" onClick={()=>handleReview('REMOVED')}><Trash2 size={14}/> Remove</button>
                  </div>
                </div>
              )}

              {modalType === 'manual_mark' && (
                <form onSubmit={handleResultManual}>
                  {['student_id','exam_name','subject','marks','total_marks','grade'].map(f => (
                    <div className="form-group" key={f}>
                      <label className="form-label">{f.replace(/_/g,' ').replace(/\b\w/g,c=>c.toUpperCase())}</label>
                      <input 
                        className="form-input" 
                        value={form[f]||''} 
                        onChange={e=>setForm({...form,[f]:e.target.value})} 
                        required={f!=='grade'}
                        disabled={f==='student_id'} 
                      />
                    </div>
                  ))}
                  <div className="modal-footer" style={{padding:0,marginTop:'1rem'}}>
                    <button type="button" className="btn btn-outline" onClick={closeModal}>Cancel</button>
                    <button type="submit" className="btn btn-primary">Save Result</button>
                  </div>
                </form>
              )}

              {modalType === 'csv_mark' && (
                <form onSubmit={handleResultCSV}>
                  <div className="form-group">
                    <label className="form-label">Exam Name</label>
                    <input className="form-input" value={form.exam_name||''} onChange={e=>setForm({...form,exam_name:e.target.value})} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">CSV File</label>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Columns required: reg_number, subject, marks, total_marks, grade</div>
                    <input className="form-input" type="file" accept=".csv" onChange={e=>setCsvFile(e.target.files[0])} required />
                  </div>
                  <div className="modal-footer" style={{padding:0,marginTop:'1rem'}}>
                    <button type="button" className="btn btn-outline" onClick={closeModal}>Cancel</button>
                    <button type="submit" className="btn btn-primary"><Upload size={15}/> Upload CSV</button>
                  </div>
                </form>
              )}

              {modalType === 'material' && (
                <form onSubmit={handleMaterialUpload}>
                  <div className="form-group">
                    <label className="form-label">Title</label>
                    <input className="form-input" value={form.title||''} onChange={e=>setForm({...form,title:e.target.value})} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Description</label>
                    <input className="form-input" value={form.description||''} onChange={e=>setForm({...form,description:e.target.value})}/>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Class (optional)</label>
                    <input className="form-input" placeholder="e.g. Class 1" value={form.class_name||''} onChange={e=>setForm({...form,class_name:e.target.value})}/>
                  </div>
                  <div className="form-group">
                    <label className="form-label">PDF File</label>
                    <input className="form-input" type="file" accept=".pdf" onChange={e=>setPdfFile(e.target.files[0])} required />
                  </div>
                  <div className="modal-footer" style={{padding:0,marginTop:'1rem'}}>
                    <button type="button" className="btn btn-outline" onClick={closeModal}>Cancel</button>
                    <button type="submit" className="btn btn-primary"><Upload size={14}/> Upload</button>
                  </div>
                </form>
              )}

              {modalType === 'announcement' && (
                <form onSubmit={handleAnnouncement}>
                  <div className="form-group">
                    <label className="form-label">Title</label>
                    <input className="form-input" value={form.title||''} onChange={e=>setForm({...form,title:e.target.value})} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Message</label>
                    <textarea className="form-textarea" rows={4} value={form.body||''} onChange={e=>setForm({...form,body:e.target.value})} required />
                  </div>
                  <div className="modal-footer" style={{padding:0,marginTop:'1rem'}}>
                    <button type="button" className="btn btn-outline" onClick={closeModal}>Cancel</button>
                    <button type="submit" className="btn btn-primary">Post</button>
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
