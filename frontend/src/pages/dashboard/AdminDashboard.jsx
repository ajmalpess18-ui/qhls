import { useState, useEffect } from 'react';
import Sidebar from '../../components/layout/Sidebar';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { MapPin, Users, BarChart2, Plus, X, ToggleLeft, Building2, Pencil, Trash2 } from 'lucide-react';

function StatCard({ icon: Icon, value, label, color = '#6c63ff' }) {
  return (
    <div className="stat-card">
      <div className="stat-icon" style={{ color }}><Icon size={20} /></div>
      <div>
        <div className="stat-value">{value ?? '—'}</div>
        <div className="stat-label">{label}</div>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const [tab, setTab]           = useState('dashboard');
  const [stats, setStats]       = useState({});
  const [states, setStates]     = useState([]);
  const [districts, setDistricts] = useState([]);
  const [users, setUsers]       = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('');
  const [form, setForm]         = useState({});
  const [error, setError]       = useState('');

  useEffect(() => { loadData(); }, [tab]);

  const loadData = async () => {
    try {
      if (tab === 'dashboard' || tab === 'analytics') {
        const { data } = await api.get('/admin/analytics');
        setStats(data);
      }
      if (tab === 'states') {
        const { data } = await api.get('/admin/states');
        setStates(data);
      }
      if (tab === 'districts') {
        const { data } = await api.get('/admin/districts');
        setDistricts(data);
      }
      if (tab === 'users') {
        const [usersRes, distRes] = await Promise.all([
          api.get('/admin/users'),
          api.get('/admin/districts'),
        ]);
        setUsers(usersRes.data);
        setDistricts(distRes.data);
      }
    } catch {}
  };

  const openModal = (type, existingData = null) => {
    setModalType(type);
    setForm(existingData || {});
    setError('');
    setShowModal(true);
    // Pre-load districts when opening user modal
    if ((type === 'user' || type === 'edit_user') && districts.length === 0) {
      api.get('/admin/districts').then(r => setDistricts(r.data)).catch(() => {});
    }
  };
  const closeModal = () => setShowModal(false);

  const handleDeleteState = async (id) => {
    if (!window.confirm("Are you sure you want to delete this state?")) return;
    try {
      await api.delete(`/admin/states/${id}`);
      loadData();
    } catch (err) {
      alert(err.response?.data?.detail || "Error deleting state");
    }
  };

  const handleDeleteUser = async (id) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;
    try {
      await api.delete(`/admin/users/${id}`);
      loadData();
    } catch (err) {
      alert(err.response?.data?.detail || "Error deleting user");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); setError('');
    try {
      if (modalType === 'state') {
        await api.post('/admin/states', { name: form.name });
      } else if (modalType === 'edit_state') {
        await api.put(`/admin/states/${form.id}`, { name: form.name });
      } else if (modalType === 'edit_user') {
        const payload = { ...form };
        if (payload.role === 'district') payload.district_id = parseInt(payload.district_id);
        await api.put(`/admin/users/${form.id}`, payload);
      } else {
        // Build payload — district admin must have district_id
        const payload = { ...form };
        if (payload.role === 'district') {
          if (!payload.district_id) {
            setError('Please select a district for this admin.');
            return;
          }
          payload.district_id = parseInt(payload.district_id);
        }
        await api.post('/admin/users', payload);
      }
      closeModal(); loadData();
    } catch (err) {
      const detail = err.response?.data?.detail;
      setError(typeof detail === 'string' ? detail : JSON.stringify(detail) || 'Error');
    }
  };

  const toggleUser = async (id) => {
    await api.patch(`/admin/users/${id}/toggle`);
    loadData();
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

          {/* Dashboard */}
          {tab === 'dashboard' && (
            <>
              <h2 style={{ marginBottom: '1rem' }}>Welcome, {user?.name}</h2>
              <div className="stats-grid">
                <StatCard icon={MapPin}    value={stats.total_states}    label="States" />
                <StatCard icon={Building2} value={stats.total_districts} label="Districts" />
                <StatCard icon={MapPin}    value={stats.total_zones}     label="Zones" />
                <StatCard icon={MapPin}    value={stats.total_units}     label="Units" />
                <StatCard icon={Building2} value={stats.total_centers}   label="Centers" />
                <StatCard icon={Users}     value={stats.total_students}  label="Students" />
                <StatCard icon={Users}     value={stats.total_users}     label="Admin Users" />
              </div>
            </>
          )}

          {/* States */}
          {tab === 'states' && (
            <>
              <div className="page-header">
                <h2>States</h2>
                <button className="btn btn-primary btn-sm" onClick={() => openModal('state')}>
                  <Plus size={15} /> Add State
                </button>
              </div>
              <div className="table-wrap">
                <table>
                  <thead><tr><th>#</th><th>Code</th><th>State Name</th><th>Action</th></tr></thead>
                  <tbody>
                    {states.map((s, i) => (
                      <tr key={s.id}>
                        <td>{i + 1}</td>
                        <td><span className="badge badge-blue">{s.code || '—'}</span></td>
                        <td>{s.name}</td>
                        <td>
                          <button className="btn btn-outline btn-sm" onClick={() => openModal('edit_state', s)} style={{ marginRight: '0.5rem' }}>
                            <Pencil size={14} />
                          </button>
                          <button className="btn btn-outline btn-sm" onClick={() => handleDeleteState(s.id)} style={{ color: 'var(--red)', borderColor: 'var(--red)' }}>
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

          {/* Districts */}
          {tab === 'districts' && (
            <>
              <div className="page-header">
                <h2>Kerala Districts</h2>
                <span className="badge badge-blue" style={{ fontSize: '0.8rem' }}>
                  {districts.length} Districts
                </span>
              </div>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>District Code</th>
                      <th>District Name</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {districts.map((d) => (
                      <tr key={d.id}>
                        <td>{d.district_number}</td>
                        <td><span className="badge badge-green">{d.code}</span></td>
                        <td>{d.name}</td>
                        <td>
                          <button
                            className="btn btn-primary btn-sm"
                            onClick={() => {
                              setModalType('user');
                              setForm({ role: 'district', district_id: String(d.id), district_name: d.name, district_code: d.code });
                              setError('');
                              setShowModal(true);
                            }}
                          >
                            <Plus size={13} /> Create Admin
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* Users */}
          {tab === 'users' && (
            <>
              <div className="page-header">
                <h2>System Users</h2>
                <button className="btn btn-primary btn-sm" onClick={() => openModal('user')}>
                  <Plus size={15} /> Add User
                </button>
              </div>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(u => (
                      <tr key={u.id}>
                        <td>{u.name}</td>
                        <td>{u.email}</td>
                        <td><span className="badge badge-green">{u.role}</span></td>
                        <td>
                          <span className={`badge ${u.is_active ? 'badge-green' : 'badge-red'}`}>
                            {u.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td>
                          <button 
                            className={`btn btn-sm ${u.is_active ? 'btn-outline' : 'btn-primary'}`} 
                            style={!u.is_active ? { backgroundColor: 'var(--red)', borderColor: 'var(--red)' } : { marginRight: '0.5rem' }}
                            onClick={() => toggleUser(u.id)}
                          >
                            <ToggleLeft size={14} /> Toggle
                          </button>
                          <button className="btn btn-outline btn-sm" onClick={() => openModal('edit_user', { ...u, password: '' })} style={{ marginRight: '0.5rem' }}>
                            <Pencil size={14} />
                          </button>
                          <button className="btn btn-outline btn-sm" onClick={() => handleDeleteUser(u.id)} style={{ color: 'var(--red)', borderColor: 'var(--red)' }}>
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

          {/* Analytics */}
          {tab === 'analytics' && (
            <>
              <h2 style={{ marginBottom: '1rem' }}>System Analytics</h2>
              <div className="stats-grid">
                <StatCard icon={MapPin}    value={stats.total_states}    label="Total States" />
                <StatCard icon={Building2} value={stats.total_districts} label="Total Districts" />
                <StatCard icon={MapPin}    value={stats.total_zones}     label="Total Zones" />
                <StatCard icon={MapPin}    value={stats.total_units}     label="Total Units" />
                <StatCard icon={Building2} value={stats.total_centers}   label="Total Centers" />
                <StatCard icon={Users}     value={stats.total_students}  label="Total Students" />
              </div>
            </>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                {modalType === 'state' ? 'Add State'
                  : modalType === 'edit_state' ? 'Edit State'
                  : modalType === 'edit_user' ? 'Edit User'
                  : form.district_name ? `Create Admin — ${form.district_code} ${form.district_name}`
                  : 'Create User'}
              </h3>
              <button onClick={closeModal} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                {error && <div className="alert alert-error">{error}</div>}

                {modalType === 'state' || modalType === 'edit_state' ? (
                  <div className="form-group">
                    <label className="form-label">State Name</label>
                    <input
                      className="form-input"
                      value={form.name || ''}
                      onChange={e => setForm({ ...form, name: e.target.value })}
                      required
                    />
                  </div>
                ) : (
                  <>
                    <div className="form-group">
                      <label className="form-label">Full Name</label>
                      <input
                        className="form-input"
                        value={form.name || ''}
                        onChange={e => setForm({ ...form, name: e.target.value })}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Email</label>
                      <input
                        className="form-input"
                        type="email"
                        value={form.email || ''}
                        onChange={e => setForm({ ...form, email: e.target.value })}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Password {modalType === 'edit_user' && "(Leave blank to keep current)"}</label>
                      <input
                        className="form-input"
                        type="password"
                        value={form.password || ''}
                        onChange={e => setForm({ ...form, password: e.target.value })}
                        required={modalType !== 'edit_user'}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Role</label>
                      <select
                        className="form-select"
                        value={form.role || ''}
                        onChange={e => setForm({ ...form, role: e.target.value, district_id: '', district_name: '', district_code: '' })}
                        required
                        disabled={!!form.district_name}  // lock role if coming from district row
                      >
                        <option value="">Select Role</option>
                        <option value="state">State</option>
                        <option value="district">District</option>
                        <option value="zone">Zone</option>
                        <option value="unit">Unit</option>
                      </select>
                    </div>

                    {/* Show district picker if role is district and no pre-filled district */}
                    {form.role === 'district' && !form.district_name && (
                      <div className="form-group">
                        <label className="form-label">Assign District</label>
                        <select
                          className="form-select"
                          value={form.district_id || ''}
                          onChange={e => setForm({ ...form, district_id: e.target.value })}
                          required
                        >
                          <option value="">Select District</option>
                          {districts.map(d => (
                            <option key={d.id} value={d.id}>
                              [{d.code}] {d.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {/* Show pre-filled district info */}
                    {form.district_name && (
                      <div className="form-group">
                        <label className="form-label">Assigned District</label>
                        <input
                          className="form-input"
                          value={`[${form.district_code}] ${form.district_name}`}
                          disabled
                          style={{ opacity: 0.7 }}
                        />
                      </div>
                    )}
                  </>
                )}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={closeModal}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
