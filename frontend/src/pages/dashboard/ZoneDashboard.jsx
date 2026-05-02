import { useState, useEffect } from 'react';
import Sidebar from '../../components/layout/Sidebar';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { Building2, Users, MapPin, Plus, X, Pencil, Trash2, ToggleLeft, Menu } from 'lucide-react';
function StatCard({ icon: Icon, value, label }) {
  return (
    <div className="stat-card">
      <div className="stat-icon"><Icon size={20} /></div>
      <div><div className="stat-value">{value ?? '—'}</div><div className="stat-label">{label}</div></div>
    </div>
  );
}

const statusBadge = { NEW:'badge-blue', IN_LIST:'badge-yellow', APPROVED:'badge-green', REJECTED:'badge-red', REMOVED:'badge-gray' };

export default function ZoneDashboard() {
  const { user } = useAuth();
  const [tab, setTab]     = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [stats, setStats] = useState({});
  const [units, setUnits] = useState([]);
  const [subs, setSubs]   = useState([]);
  const [users, setUsers]   = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState(''); // 'unit', 'edit_unit', 'unit_user', 'edit_unit_user'
  const [form, setForm]   = useState({});
  const [error, setError] = useState('');

  useEffect(() => { loadTab(); }, [tab]);

  const loadTab = async () => {
    try {
      if (tab === 'dashboard')   { const r = await api.get('/zone/stats');       setStats(r.data); }
      if (tab === 'units')       { const r = await api.get('/zone/units');       setUnits(r.data); }
      if (tab === 'users') {
        const [unitsRes, usersRes] = await Promise.all([
          api.get('/zone/units'),
          api.get('/zone/unit-users')
        ]);
        setUnits(unitsRes.data);
        setUsers(usersRes.data);
      }
      if (tab === 'submissions') { const r = await api.get('/zone/submissions'); setSubs(r.data); }
    } catch {}
  };

  const openUnitModal = (existingUnit = null) => {
    setModalType(existingUnit ? 'edit_unit' : 'unit');
    setForm(existingUnit || {});
    setError('');
    setShowModal(true);
  };

  const openUnitUserModal = (unit = null, existingUser = null) => {
    setModalType(existingUser ? 'edit_unit_user' : 'unit_user');
    if (existingUser) {
      setForm({ ...existingUser, password: '' });
    } else {
      setForm(unit ? { unit_id: String(unit.id), unit_name: unit.name } : {});
    }
    setError('');
    setShowModal(true);
  };

  const handleDeleteUnit = async (id) => {
    if (!window.confirm("Are you sure you want to delete this unit?")) return;
    try { await api.delete(`/zone/units/${id}`); loadTab(); }
    catch (err) { alert(err.response?.data?.detail || "Error deleting unit"); }
  };

  const handleDeleteUser = async (id) => {
    if (!window.confirm("Are you sure you want to delete this admin?")) return;
    try { await api.delete(`/zone/users/${id}`); loadTab(); }
    catch (err) { alert(err.response?.data?.detail || "Error deleting user"); }
  };

  const toggleUser = async (id) => {
    await api.patch(`/admin/users/${id}/toggle`);
    loadTab();
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); setError('');
    try {
      if (modalType === 'unit') {
        await api.post('/zone/units', { name: form.name });
      } else if (modalType === 'edit_unit') {
        await api.put(`/zone/units/${form.id}`, { name: form.name });
      } else if (modalType === 'edit_unit_user') {
        await api.put(`/zone/users/${form.id}`, {
          name: form.name, email: form.email, password: form.password,
          role: 'unit', unit_id: parseInt(form.unit_id),
        });
      } else {
        if (!form.unit_id) { setError('Please select a Unit.'); return; }
        await api.post('/zone/users', {
          name: form.name, email: form.email, password: form.password,
          role: 'unit', unit_id: parseInt(form.unit_id),
        });
      }
      setShowModal(false); loadTab(); 
    } catch (err) { 
      const detail = err.response?.data?.detail;
      let errMsg = 'An error occurred';
      if (typeof detail === 'string') {
        errMsg = detail;
      } else if (Array.isArray(detail)) {
        errMsg = detail.map(d => d.msg).join(', ');
      } else if (detail) {
        errMsg = JSON.stringify(detail);
      }
      setError(errMsg); 
    }
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
              <h2 style={{ marginBottom:'1rem' }}>Zone Dashboard</h2>
              <div className="stats-grid">
                <StatCard icon={Building2} value={stats.units}   label="Units" />
                <StatCard icon={Building2} value={stats.centers} label="Centers" />
                <StatCard icon={Users}     value={stats.students} label="Students" />
                <StatCard icon={Users}     value={stats.faculty}  label="Faculty" />
              </div>
            </>
          )}

          {tab === 'units' && (
            <>
              <div className="page-header">
                <h2>Units</h2>
                <button className="btn btn-primary btn-sm" onClick={() => openUnitModal()}><Plus size={15}/> Add Unit</button>
              </div>
              <div className="table-wrap">
                <table>
                  <thead><tr><th>#</th><th>Unit Name</th><th>Action</th></tr></thead>
                  <tbody>
                    {units.map((u, i) => (
                      <tr key={u.id}>
                        <td>{i+1}</td>
                        <td>{u.name}</td>
                        <td>
                          <button className="btn btn-primary btn-sm" onClick={() => openUnitUserModal(u)} style={{ marginRight: '0.5rem' }}>
                            <Plus size={13} /> Create Admin
                          </button>
                          <button className="btn btn-outline btn-sm" onClick={() => openUnitModal(u)} style={{ marginRight: '0.5rem' }}>
                            <Pencil size={14} />
                          </button>
                          <button className="btn btn-outline btn-sm" onClick={() => handleDeleteUnit(u.id)} style={{ color: 'var(--red)', borderColor: 'var(--red)' }}>
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {tab === 'users' && (
            <>
              <div className="page-header">
                <h2>Unit Admins</h2>
                <button className="btn btn-primary btn-sm" onClick={() => openUnitUserModal()}>
                  <Plus size={15} /> Create Unit Admin
                </button>
              </div>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr><th>Name</th><th>Email</th><th>Unit</th><th>Status</th><th>Action</th></tr>
                  </thead>
                  <tbody>
                    {users.map(u => (
                      <tr key={u.id}>
                        <td>{u.name}</td>
                        <td>{u.email}</td>
                        <td>{units.find(un => un.id === u.unit_id)?.name || u.unit_id || '—'}</td>
                        <td>
                          <span className={`badge ${u.is_active ? 'badge-green' : 'badge-red'}`}>
                            {u.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td>
                          <label className="switch" style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} title={u.is_active ? "Click to Deactivate" : "Click to Activate"}>
                            <input 
                              type="checkbox" 
                              checked={u.is_active} 
                              onChange={() => toggleUser(u.id)} 
                            />
                            <span className="switch-slider"></span>
                          </label>
                          <button className="btn btn-outline btn-sm" onClick={() => openUnitUserModal(null, u)} style={{ marginRight: '0.5rem' }}>
                            <Pencil size={14} />
                          </button>
                          <button className="btn btn-outline btn-sm" onClick={() => handleDeleteUser(u.id)} style={{ color: 'var(--red)', borderColor: 'var(--red)' }}>
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {users.length === 0 && (
                      <tr><td colSpan={5} style={{ textAlign: 'center', opacity: 0.5 }}>No unit admins yet.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {tab === 'submissions' && (
            <>
              <h2 style={{ marginBottom:'1rem' }}>Submissions <span className="badge badge-blue" style={{fontSize:'0.75rem',marginLeft:'0.5rem'}}>READ ONLY</span></h2>
              <div className="table-wrap">
                <table>
                  <thead><tr><th>Center</th><th>Status</th><th>Date</th></tr></thead>
                  <tbody>
                    {subs.map(s => (
                      <tr key={s.id}>
                        <td>{s.center_name}</td>
                        <td><span className={`badge ${statusBadge[s.status]||'badge-gray'}`}>{s.status}</span></td>
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

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                {modalType === 'unit' ? 'Add Unit'
                  : modalType === 'edit_unit' ? 'Edit Unit'
                  : modalType === 'edit_unit_user' ? 'Edit Unit Admin'
                  : form.unit_name ? `Create Unit Admin — ${form.unit_name}`
                  : 'Create Unit Admin'}
              </h3>
              <button onClick={() => setShowModal(false)} style={{background:'none',border:'none',cursor:'pointer'}}><X size={20}/></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                {error && <div className="alert alert-error">{error}</div>}
                
                {modalType === 'unit' || modalType === 'edit_unit' ? (
                  <div className="form-group">
                    <label className="form-label">Unit Name</label>
                    <input className="form-input" value={form.name||''} onChange={e=>setForm({...form,name:e.target.value})} required />
                  </div>
                ) : (
                  <>
                    <div className="form-group">
                      <label className="form-label">Full Name</label>
                      <input className="form-input" value={form.name||''} onChange={e=>setForm({...form,name:e.target.value})} required />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Email</label>
                      <input className="form-input" type="email" value={form.email||''} onChange={e=>setForm({...form,email:e.target.value})} required />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Password {modalType === 'edit_unit_user' && "(Leave blank to keep current)"}</label>
                      <input className="form-input" type="password" value={form.password||''} onChange={e=>setForm({...form,password:e.target.value})} required={modalType !== 'edit_unit_user'} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Assign Unit</label>
                      {form.unit_name ? (
                        <input className="form-input" value={form.unit_name} disabled style={{ opacity: 0.7 }} />
                      ) : (
                        <select className="form-select" value={form.unit_id || ''} onChange={e => setForm({ ...form, unit_id: e.target.value })} required>
                          <option value="">Select Unit</option>
                          {units.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                        </select>
                      )}
                    </div>
                  </>
                )}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
