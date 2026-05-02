import { useState, useEffect } from 'react';
import Sidebar from '../../components/layout/Sidebar';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { MapPin, Building2, Users, Plus, X, Pencil, Trash2, ToggleLeft } from 'lucide-react';

function StatCard({ icon: Icon, value, label }) {
  return (
    <div className="stat-card">
      <div className="stat-icon"><Icon size={20} /></div>
      <div><div className="stat-value">{value ?? '—'}</div><div className="stat-label">{label}</div></div>
    </div>
  );
}

const statusBadge = {
  NEW: 'badge-blue', IN_LIST: 'badge-yellow',
  APPROVED: 'badge-green', REJECTED: 'badge-red', REMOVED: 'badge-gray'
};

export default function DistrictDashboard() {
  const { user } = useAuth();
  const [tab, setTab]         = useState('dashboard');
  const [stats, setStats]     = useState({});
  const [zones, setZones]     = useState([]);
  const [units, setUnits]     = useState([]);
  const [subs, setSubs]       = useState([]);
  const [zoneUsers, setZoneUsers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('zone'); // 'zone' | 'zone_user'
  const [form, setForm]       = useState({});
  const [error, setError]     = useState('');

  useEffect(() => { loadTab(); }, [tab]);

  const loadTab = async () => {
    try {
      if (tab === 'dashboard') {
        const r = await api.get('/district/stats'); setStats(r.data);
      }
      if (tab === 'zones') {
        const r = await api.get('/district/zones'); setZones(r.data);
      }
      if (tab === 'units') {
        const r = await api.get('/district/units'); setUnits(r.data);
      }
      if (tab === 'submissions') {
        const r = await api.get('/district/submissions'); setSubs(r.data);
      }
      if (tab === 'users') {
        const [zonesRes, usersRes] = await Promise.all([
          api.get('/district/zones'),
          api.get('/district/zone-users'),
        ]);
        setZones(zonesRes.data);
        setZoneUsers(usersRes.data || []);
      }
    } catch {}
  };

  const openZoneModal = (existingZone = null) => {
    setModalType(existingZone ? 'edit_zone' : 'zone');
    setForm(existingZone || {});
    setError('');
    setShowModal(true);
  };

  const openZoneUserModal = (zone = null, existingUser = null) => {
    setModalType(existingUser ? 'edit_zone_user' : 'zone_user');
    if (existingUser) {
      setForm({ ...existingUser, password: '' });
    } else {
      setForm(zone ? { zone_id: String(zone.id), zone_name: zone.name } : {});
    }
    setError('');
    setShowModal(true);
  };

  const handleDeleteZone = async (id) => {
    if (!window.confirm("Are you sure you want to delete this zone?")) return;
    try {
      await api.delete(`/district/zones/${id}`);
      loadTab();
    } catch (err) {
      alert(err.response?.data?.detail || "Error deleting zone");
    }
  };

  const handleDeleteUser = async (id) => {
    if (!window.confirm("Are you sure you want to delete this admin?")) return;
    try {
      await api.delete(`/district/users/${id}`);
      loadTab();
    } catch (err) {
      alert(err.response?.data?.detail || "Error deleting user");
    }
  };

  const toggleUser = async (id) => {
    await api.patch(`/admin/users/${id}/toggle`); // It uses the same toggle route in admin router
    loadTab();
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); setError('');
    try {
      if (modalType === 'zone') {
        await api.post('/district/zones', { name: form.name });
      } else if (modalType === 'edit_zone') {
        await api.put(`/district/zones/${form.id}`, { name: form.name });
      } else if (modalType === 'edit_zone_user') {
        await api.put(`/district/users/${form.id}`, {
          name: form.name,
          email: form.email,
          password: form.password,
          role: 'zone',
          zone_id: parseInt(form.zone_id),
        });
      } else {
        // create zone admin user
        if (!form.zone_id) { setError('Please select a Zone.'); return; }
        await api.post('/district/users', {
          name: form.name,
          email: form.email,
          password: form.password,
          role: 'zone',
          zone_id: parseInt(form.zone_id),
        });
      }
      setShowModal(false);
      loadTab();
    } catch (err) {
      setError(err.response?.data?.detail || 'Error');
    }
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
              <h2 style={{ marginBottom: '1rem' }}>District Dashboard</h2>
              <div className="stats-grid">
                <StatCard icon={MapPin}    value={stats.zones}    label="Zones" />
                <StatCard icon={Building2} value={stats.units}    label="Units" />
                <StatCard icon={Building2} value={stats.centers}  label="Centers" />
                <StatCard icon={Users}     value={stats.students} label="Students" />
              </div>
            </>
          )}

          {/* Zones */}
          {tab === 'zones' && (
            <>
              <div className="page-header">
                <h2>Zones</h2>
                <button className="btn btn-primary btn-sm" onClick={openZoneModal}>
                  <Plus size={15} /> Add Zone
                </button>
              </div>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr><th>#</th><th>Zone Name</th><th>Action</th></tr>
                  </thead>
                  <tbody>
                    {zones.map((z, i) => (
                      <tr key={z.id}>
                        <td>{i + 1}</td>
                        <td>{z.name}</td>
                        <td>
                          <button
                            className="btn btn-primary btn-sm"
                            onClick={() => openZoneUserModal(z)}
                            style={{ marginRight: '0.5rem' }}
                          >
                            <Plus size={13} /> Create Admin
                          </button>
                          <button className="btn btn-outline btn-sm" onClick={() => openZoneModal(z)} style={{ marginRight: '0.5rem' }}>
                            <Pencil size={14} />
                          </button>
                          <button className="btn btn-outline btn-sm" onClick={() => handleDeleteZone(z.id)} style={{ color: 'var(--red)', borderColor: 'var(--red)' }}>
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {zones.length === 0 && (
                      <tr><td colSpan={3} style={{ textAlign: 'center', opacity: 0.5 }}>No zones yet. Add one!</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* Units */}
          {tab === 'units' && (
            <>
              <h2 style={{ marginBottom: '1rem' }}>Units</h2>
              <div className="table-wrap">
                <table>
                  <thead><tr><th>#</th><th>Unit Name</th><th>Zone ID</th></tr></thead>
                  <tbody>
                    {units.map((u, i) => (
                      <tr key={u.id}><td>{i + 1}</td><td>{u.name}</td><td>{u.zone_id}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* Zone Users */}
          {tab === 'users' && (
            <>
              <div className="page-header">
                <h2>Zone Admins</h2>
                <button className="btn btn-primary btn-sm" onClick={() => openZoneUserModal()}>
                  <Plus size={15} /> Create Zone Admin
                </button>
              </div>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr><th>Name</th><th>Email</th><th>Zone</th><th>Status</th><th>Action</th></tr>
                  </thead>
                  <tbody>
                    {zoneUsers.map(u => (
                      <tr key={u.id}>
                        <td>{u.name}</td>
                        <td>{u.email}</td>
                        <td>{u.zone_id ?? '—'}</td>
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
                          <button className="btn btn-outline btn-sm" onClick={() => openZoneUserModal(null, u)} style={{ marginRight: '0.5rem' }}>
                            <Pencil size={14} />
                          </button>
                          <button className="btn btn-outline btn-sm" onClick={() => handleDeleteUser(u.id)} style={{ color: 'var(--red)', borderColor: 'var(--red)' }}>
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {zoneUsers.length === 0 && (
                      <tr><td colSpan={4} style={{ textAlign: 'center', opacity: 0.5 }}>No zone admins yet.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* Submissions */}
          {tab === 'submissions' && (
            <>
              <h2 style={{ marginBottom: '1rem' }}>
                Submissions <span className="badge badge-blue" style={{ fontSize: '0.75rem', marginLeft: '0.5rem' }}>READ ONLY</span>
              </h2>
              <div className="table-wrap">
                <table>
                  <thead><tr><th>Center</th><th>Status</th><th>Date</th></tr></thead>
                  <tbody>
                    {subs.map(s => (
                      <tr key={s.id}>
                        <td>{s.center_name}</td>
                        <td><span className={`badge ${statusBadge[s.status] || 'badge-gray'}`}>{s.status}</span></td>
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

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                {modalType === 'zone' ? 'Add Zone'
                  : modalType === 'edit_zone' ? 'Edit Zone'
                  : modalType === 'edit_zone_user' ? 'Edit Zone Admin'
                  : form.zone_name ? `Create Zone Admin — ${form.zone_name}`
                  : 'Create Zone Admin'}
              </h3>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                {error && <div className="alert alert-error">{error}</div>}

                {modalType === 'zone' || modalType === 'edit_zone' ? (
                  <div className="form-group">
                    <label className="form-label">Zone Name</label>
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
                      <label className="form-label">Password {modalType === 'edit_zone_user' && "(Leave blank to keep current)"}</label>
                      <input
                        className="form-input"
                        type="password"
                        value={form.password || ''}
                        onChange={e => setForm({ ...form, password: e.target.value })}
                        required={modalType !== 'edit_zone_user'}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Assign Zone</label>
                      {form.zone_name ? (
                        <input className="form-input" value={form.zone_name} disabled style={{ opacity: 0.7 }} />
                      ) : (
                        <select
                          className="form-select"
                          value={form.zone_id || ''}
                          onChange={e => setForm({ ...form, zone_id: e.target.value })}
                          required
                        >
                          <option value="">Select Zone</option>
                          {zones.map(z => (
                            <option key={z.id} value={z.id}>{z.name}</option>
                          ))}
                        </select>
                      )}
                    </div>
                  </>
                )}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">
                  {modalType === 'zone' ? 'Add Zone' : 'Create Admin'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
