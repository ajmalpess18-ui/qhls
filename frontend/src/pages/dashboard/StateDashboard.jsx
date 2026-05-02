import { useState, useEffect } from 'react';
import Sidebar from '../../components/layout/Sidebar';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { Building2, Users, MapPin, ClipboardList, Plus, X, CheckCircle, XCircle, Trash2, Upload, FileText, BookOpen, Megaphone } from 'lucide-react';

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

  useEffect(() => { loadTab(); }, [tab]);

  const loadTab = async () => {
    try {
      if (tab === 'dashboard') { const r = await api.get('/state/stats'); setStats(r.data); }
      if (tab === 'districts') { const r = await api.get('/state/districts'); setDistricts(r.data); }
      if (tab === 'submissions') { const r = await api.get('/state/submissions'); setSubmissions(r.data); }
      if (tab === 'materials')  { const r = await api.get('/state/materials'); setMaterials(r.data); }
      if (tab === 'announcements') { const r = await api.get('/state/announcements'); setAnnouncements(r.data); }
    } catch {}
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
      <Sidebar activeTab={tab} setActiveTab={setTab} />
      <div className="main-content">
        <div className="topbar">
          <span className="topbar-title">{tab.charAt(0).toUpperCase() + tab.slice(1)}</span>
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
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button className={`btn btn-sm ${uploadMode==='manual' ? 'btn-primary':'btn-outline'}`} onClick={() => setUploadMode('manual')}>Manual Entry</button>
                  <button className={`btn btn-sm ${uploadMode==='csv' ? 'btn-primary':'btn-outline'}`} onClick={() => setUploadMode('csv')}>CSV Upload</button>
                </div>
              </div>
              {uploadMode === 'manual' ? (
                <div className="card" style={{ maxWidth: '500px' }}>
                  <form onSubmit={handleResultManual}>
                    {error && <div className="alert alert-error">{error}</div>}
                    {['student_id','exam_name','subject','marks','total_marks','grade'].map(f => (
                      <div className="form-group" key={f}>
                        <label className="form-label">{f.replace(/_/g,' ').replace(/\b\w/g,c=>c.toUpperCase())}</label>
                        <input className="form-input" value={form[f]||''} onChange={e=>setForm({...form,[f]:e.target.value})} required={f!=='grade'} />
                      </div>
                    ))}
                    <button className="btn btn-primary btn-full" type="submit">Save Result</button>
                  </form>
                </div>
              ) : (
                <div className="card" style={{ maxWidth: '500px' }}>
                  <form onSubmit={handleResultCSV}>
                    {error && <div className="alert alert-error">{error}</div>}
                    <div className="form-group">
                      <label className="form-label">Exam Name</label>
                      <input className="form-input" value={form.exam_name||''} onChange={e=>setForm({...form,exam_name:e.target.value})} required />
                    </div>
                    <div className="form-group">
                      <label className="form-label">CSV File (reg_number, subject, marks, total_marks, grade)</label>
                      <input className="form-input" type="file" accept=".csv" onChange={e=>setCsvFile(e.target.files[0])} required />
                    </div>
                    <button className="btn btn-primary btn-full" type="submit"><Upload size={15} /> Upload CSV</button>
                  </form>
                </div>
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
