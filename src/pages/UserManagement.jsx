import React, { useState, useEffect } from 'react';
import {
  Users,
  Plus,
  Edit2,
  Shield,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Building2,
  KeyRound,
  Check,
  Lock,
  Sparkles,
  Calendar,
  Layers,
  ChevronDown
} from 'lucide-react';
import { api } from '../services/api';
import { useEvent } from '../context/EventContext';
import { useToast } from '../context/ToastContext';
import Modal from '../components/Modal';
import Badge from '../components/Badge';
import { formatDateTimeIST } from '../utils/dateUtil';

export default function UserManagement() {
  const { events, selectedEvent } = useEvent();
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showPermModal, setShowPermModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [roleId, setRoleId] = useState(2);
  const [eventId, setEventId] = useState('');
  const [isActive, setIsActive] = useState(true);

  // Event-Based Permission Matrix State
  const [selectedEventForPerms, setSelectedEventForPerms] = useState('');
  const [selectedAdminForPerms, setSelectedAdminForPerms] = useState('');
  const [activePermIds, setActivePermIds] = useState([]);
  const [loadingPerms, setLoadingPerms] = useState(false);
  const [savingPerms, setSavingPerms] = useState(false);

  const toast = useToast();

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const url = selectedEvent ? `/users?eventId=${selectedEvent.id}` : '/users';
      const res = await api.get(url);
      if (res.success) {
        setUsers(res.data);
      }
    } catch (err) {
      toast.error('Failed to load user accounts');
    } finally {
      setLoading(false);
    }
  };

  const fetchRolesAndPermissions = async () => {
    try {
      const res = await api.get('/users/roles-permissions');
      if (res.success) {
        setRoles(res.roles || []);
        setPermissions(res.permissions || []);
      }
    } catch (e) {
      // Ignore
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchRolesAndPermissions();
  }, [selectedEvent]);

  const handleOpenCreate = () => {
    setEditingUser(null);
    setName('');
    setEmail('');
    setPassword('');
    setRoleId(2); // ADMIN default
    setEventId(selectedEvent ? String(selectedEvent.id) : (events[0] ? String(events[0].id) : '1'));
    setIsActive(true);
    setShowModal(true);
  };

  const handleOpenEdit = (user) => {
    setEditingUser(user);
    setName(user.name);
    setEmail(user.email);
    setPassword('');
    setRoleId(user.role_id);
    setEventId(user.event_id ? String(user.event_id) : '');
    setIsActive(Boolean(user.is_active));
    setShowModal(true);
  };

  // Event-Based Permissions Loader
  const loadEventPermissions = async (evId, uId = null) => {
    if (!evId) return;
    setLoadingPerms(true);
    try {
      const url = uId
        ? `/users/event-permissions?eventId=${evId}&userId=${uId}`
        : `/users/event-permissions?eventId=${evId}`;
      const res = await api.get(url);
      if (res.success) {
        setActivePermIds(res.permissionIds || []);
      }
    } catch (err) {
      toast.error('Failed to load event permissions');
    } finally {
      setLoadingPerms(false);
    }
  };

  const handleOpenEventPermModal = (targetEventId = null, targetUserId = null) => {
    const initialEventId = targetEventId || (selectedEvent ? String(selectedEvent.id) : (events[0] ? String(events[0].id) : '1'));
    setSelectedEventForPerms(String(initialEventId));

    const initialUserId = targetUserId ? String(targetUserId) : '';
    setSelectedAdminForPerms(initialUserId);

    loadEventPermissions(initialEventId, initialUserId);
    setShowPermModal(true);
  };

  const handleEventChangeInModal = (newEvId) => {
    setSelectedEventForPerms(newEvId);
    loadEventPermissions(newEvId, selectedAdminForPerms);
  };

  const handleAdminChangeInModal = (newAdminId) => {
    setSelectedAdminForPerms(newAdminId);
    loadEventPermissions(selectedEventForPerms, newAdminId);
  };

  const togglePermission = (pId) => {
    setActivePermIds(prev =>
      prev.includes(pId) ? prev.filter(id => id !== pId) : [...prev, pId]
    );
  };

  const handleSaveEventPermissions = async () => {
    if (!selectedEventForPerms) {
      toast.warning('Please select an event');
      return;
    }

    setSavingPerms(true);
    try {
      const res = await api.put('/users/event-permissions', {
        eventId: parseInt(selectedEventForPerms, 10),
        userId: selectedAdminForPerms ? parseInt(selectedAdminForPerms, 10) : undefined,
        permissionIds: activePermIds
      });

      if (res.success) {
        toast.success(res.message);
        setShowPermModal(false);
        fetchUsers();
      }
    } catch (err) {
      toast.error(err.message || 'Failed to update event permissions');
    } finally {
      setSavingPerms(false);
    }
  };

  const handleSubmitUser = async (e) => {
    e.preventDefault();
    try {
      if (editingUser) {
        const res = await api.put(`/users/${editingUser.id}`, {
          name,
          email,
          password: password || undefined,
          roleId,
          eventId: roleId === 1 ? null : (eventId ? parseInt(eventId, 10) : null),
          isActive
        });
        if (res.success) {
          toast.success(res.message);
          setShowModal(false);
          fetchUsers();
        }
      } else {
        const res = await api.post('/users', {
          name,
          email,
          password,
          roleId,
          eventId: roleId === 1 ? null : (eventId ? parseInt(eventId, 10) : null)
        });
        if (res.success) {
          toast.success(res.message);
          setShowModal(false);
          fetchUsers();
        }
      }
    } catch (err) {
      toast.error(err.message || 'Operation failed');
    }
  };

  // Group permissions by module for the matrix
  const permissionsByModule = permissions.reduce((acc, p) => {
    const mod = p.module || 'General';
    if (!acc[mod]) acc[mod] = [];
    acc[mod].push(p);
    return acc;
  }, {});

  const adminUsers = users.filter(u => u.role_name !== 'SUPERADMIN');

  return (
    <div style={{ padding: '24px 32px', maxWidth: '1440px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800 }}>Admin Accounts & Event-Based Permissions</h1>
          <p style={{ fontSize: '13.5px', color: 'var(--text-muted)' }}>
            Configure event admins and manage strict event-by-event permissions (Pass Generation, Categories, Designer, Billing)
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={() => handleOpenEventPermModal()} className="btn btn-secondary">
            <KeyRound size={16} />
            <span>Event Permissions Matrix</span>
          </button>
          <button onClick={handleOpenCreate} className="btn btn-primary">
            <Plus size={16} />
            <span>New Admin Account</span>
          </button>
          <button onClick={fetchUsers} className="btn btn-outline btn-icon" title="Refresh">
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {/* Users Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th>User / Name</th>
                <th>Email Address</th>
                <th>Role</th>
                <th>Primary Event</th>
                <th>Event Permissions</th>
                <th>Status</th>
                <th>Last Login</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                    Loading user accounts...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                    No users found for this view.
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          backgroundColor: u.role_name === 'SUPERADMIN' ? 'var(--primary-100)' : 'var(--bg-surface-hover)',
                          color: 'var(--primary-700)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 700,
                          fontSize: '12px'
                        }}>
                          {u.name.charAt(0)}
                        </div>
                        <div style={{ fontWeight: 700, fontSize: '13.5px' }}>{u.name}</div>
                      </div>
                    </td>

                    <td>
                      <span style={{ fontSize: '13px' }}>{u.email}</span>
                    </td>

                    <td>
                      <Badge variant={u.role_name === 'SUPERADMIN' ? 'primary' : 'info'}>
                        {u.role_name}
                      </Badge>
                    </td>

                    <td>
                      {u.role_name === 'SUPERADMIN' ? (
                        <span style={{ fontWeight: 700, color: 'var(--primary-600)', fontSize: '12.5px' }}>
                          🌐 Global (All Events)
                        </span>
                      ) : (
                        <span style={{ fontWeight: 600, fontSize: '12.5px' }}>
                          {u.event_name || 'Assigned Event'}
                        </span>
                      )}
                    </td>

                    <td>
                      {u.role_name === 'SUPERADMIN' ? (
                        <span style={{ fontSize: '12px', color: '#059669', fontWeight: 700 }}>
                          ⚡ Full Global Privileges
                        </span>
                      ) : (
                        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', maxWidth: '280px' }}>
                          {u.permissions?.map(p => (
                            <span
                              key={p}
                              style={{
                                fontSize: '10px',
                                padding: '2px 6px',
                                borderRadius: '4px',
                                backgroundColor: '#F1F5F9',
                                color: '#334155',
                                border: '1px solid #E2E8F0'
                              }}
                            >
                              {p}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>

                    <td>
                      <Badge variant={u.is_active ? 'success' : 'danger'}>
                        {u.is_active ? 'ACTIVE' : 'DISABLED'}
                      </Badge>
                    </td>

                    <td>
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        {u.last_login_at ? formatDateTimeIST(u.last_login_at) : 'Never'}
                      </span>
                    </td>

                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                        {u.role_name !== 'SUPERADMIN' && (
                          <button
                            onClick={() => handleOpenEventPermModal(u.event_id, u.id)}
                            className="btn btn-outline btn-sm btn-icon"
                            title="Configure Event Permissions"
                          >
                            <KeyRound size={14} />
                          </button>
                        )}
                        <button
                          onClick={() => handleOpenEdit(u)}
                          className="btn btn-secondary btn-sm btn-icon"
                          title="Edit User"
                        >
                          <Edit2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Strict Event-Based Permission Management Modal */}
      <Modal
        isOpen={showPermModal}
        onClose={() => setShowPermModal(false)}
        title="🛡️ Event-Specific Admin Permissions Matrix"
        maxWidth="840px"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Top Event & Admin Selectors */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1.2fr 1fr',
            gap: '16px',
            backgroundColor: '#F8FAFC',
            padding: '16px 20px',
            borderRadius: '12px',
            border: '1px solid #E2E8F0'
          }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 800, color: 'var(--primary-700)', marginBottom: '6px' }}>
                1. Select Target Event *
              </label>
              <select
                value={selectedEventForPerms}
                onChange={(e) => handleEventChangeInModal(e.target.value)}
                style={{ width: '100%', fontWeight: 700 }}
              >
                {events.map(ev => (
                  <option key={ev.id} value={ev.id}>
                    {ev.event_name} (Event #{ev.id})
                  </option>
                ))}
              </select>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                Permissions configured below apply <strong>strictly to this event</strong>.
              </span>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 800, color: '#334155', marginBottom: '6px' }}>
                2. Target Admin Scope
              </label>
              <select
                value={selectedAdminForPerms}
                onChange={(e) => handleAdminChangeInModal(e.target.value)}
                style={{ width: '100%' }}
              >
                <option value="">👥 All Event Admins for this Event</option>
                {adminUsers.map(adm => (
                  <option key={adm.id} value={adm.id}>
                    {adm.name} ({adm.email})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Independent Permission Checkbox Matrix */}
          {loadingPerms ? (
            <div style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
              Loading permissions for selected event...
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '440px', overflowY: 'auto', paddingRight: '4px' }}>
              {Object.entries(permissionsByModule).map(([mod, perms]) => (
                <div key={mod} style={{ backgroundColor: '#FFFFFF', padding: '16px', borderRadius: '10px', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
                  <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--primary-700)', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    {mod} Module
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    {perms.map(p => {
                      const isChecked = activePermIds.includes(p.id);
                      return (
                        <label
                          key={p.id}
                          style={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: '10px',
                            padding: '10px 12px',
                            borderRadius: '8px',
                            backgroundColor: isChecked ? '#EFF6FF' : '#F8FAFC',
                            border: isChecked ? '1.5px solid #3B82F6' : '1px solid #E2E8F0',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => togglePermission(p.id)}
                            style={{ width: '16px', height: '16px', marginTop: '2px' }}
                          />
                          <div>
                            <div style={{ fontSize: '13px', fontWeight: 700, color: isChecked ? '#1D4ED8' : '#334155' }}>
                              {p.name}
                            </div>
                            <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px' }}>
                              {p.description}
                            </div>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Modal Footer */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
            <button onClick={() => setShowPermModal(false)} className="btn btn-secondary">
              Cancel
            </button>
            <button onClick={handleSaveEventPermissions} className="btn btn-primary" disabled={savingPerms || loadingPerms}>
              <Check size={16} />
              <span>{savingPerms ? 'Saving Event Permissions...' : 'Save Event Permissions'}</span>
            </button>
          </div>
        </div>
      </Modal>

      {/* Create / Edit User Modal with Clean Spacing */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingUser ? `Edit Account — ${editingUser.name}` : 'Create New Admin Account'}
        maxWidth="520px"
      >
        <form onSubmit={handleSubmitUser} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div className="form-group">
            <label className="form-label">Full Name *</label>
            <input
              type="text"
              placeholder="e.g. Aarav Sharma"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              style={{ width: '100%' }}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Email Address *</label>
            <input
              type="email"
              placeholder="e.g. admin.expo@eventgen.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{ width: '100%' }}
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              {editingUser ? 'Password (Leave blank to keep current)' : 'Password *'}
            </label>
            <input
              type="password"
              placeholder={editingUser ? '••••••••' : 'Minimum 8 characters'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required={!editingUser}
              minLength={8}
              style={{ width: '100%' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div>
              <label className="form-label">Role Type</label>
              <select value={roleId} onChange={(e) => setRoleId(parseInt(e.target.value, 10))} style={{ width: '100%' }}>
                {roles.map(r => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
            </div>

            {roleId !== 1 && (
              <div>
                <label className="form-label">Primary Assigned Event *</label>
                <select value={eventId} onChange={(e) => setEventId(e.target.value)} style={{ width: '100%' }} required>
                  {events.map(ev => (
                    <option key={ev.id} value={ev.id}>{ev.event_name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {editingUser && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingTop: '4px' }}>
              <input
                type="checkbox"
                id="activeToggle"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                style={{ width: '16px', height: '16px' }}
              />
              <label htmlFor="activeToggle" style={{ fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
                Account Active & Allowed to Log In
              </label>
            </div>
          )}

          <div className="modal-footer">
            <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              {editingUser ? 'Save Changes' : 'Create Account'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
