import React, { useState, useEffect } from 'react';
import {
  Users,
  Plus,
  Edit2,
  Shield,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Building2
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
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [roleId, setRoleId] = useState(2);
  const [eventId, setEventId] = useState('');
  const [isActive, setIsActive] = useState(true);

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

  const fetchRoles = async () => {
    try {
      const res = await api.get('/users/roles-permissions');
      if (res.success) {
        setRoles(res.roles);
      }
    } catch (e) {
      // Ignore
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchRoles();
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

  const handleSubmit = async (e) => {
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

  return (
    <div style={{ padding: '24px 32px', maxWidth: '1440px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800 }}>Admin Accounts & RBAC</h1>
          <p style={{ fontSize: '13.5px', color: 'var(--text-muted)' }}>
            Create and assign Event Admins with strictly isolated event permissions
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
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
                <th>Assigned Event Context</th>
                <th>Status</th>
                <th>Last Login</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                    Loading user accounts...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
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
                      <button
                        onClick={() => handleOpenEdit(u)}
                        className="btn btn-secondary btn-sm btn-icon"
                        title="Edit User"
                      >
                        <Edit2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create / Edit User Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingUser ? 'Edit User Account' : 'Create Admin Account'}
        maxWidth="500px"
      >
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>Full Name *</label>
            <input
              type="text"
              placeholder="e.g. John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              style={{ width: '100%' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>Email Address *</label>
            <input
              type="email"
              placeholder="e.g. admin.expo@eventgen.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{ width: '100%' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
              {editingUser ? 'Password (Leave blank to keep existing)' : 'Password *'}
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

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>Role</label>
              <select value={roleId} onChange={(e) => setRoleId(parseInt(e.target.value, 10))} style={{ width: '100%' }}>
                {roles.map(r => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
            </div>

            {roleId !== 1 && (
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>Assigned Event *</label>
                <select value={eventId} onChange={(e) => setEventId(e.target.value)} style={{ width: '100%' }} required>
                  {events.map(ev => (
                    <option key={ev.id} value={ev.id}>{ev.event_name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {editingUser && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
              <input
                type="checkbox"
                id="activeToggle"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
              />
              <label htmlFor="activeToggle" style={{ fontSize: '13px', fontWeight: 600 }}>
                Account Active
              </label>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
            <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              {editingUser ? 'Save Changes' : 'Create Admin'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
