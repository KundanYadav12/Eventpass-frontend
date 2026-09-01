import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar,
  Plus,
  Edit2,
  Power,
  ExternalLink,
  Users,
  Tags,
  Ticket,
  MapPin,
  CheckCircle2,
  Clock,
  Search,
  Building2
} from 'lucide-react';
import { api } from '../services/api';
import { useEvent } from '../context/EventContext';
import { useToast } from '../context/ToastContext';
import Modal from '../components/Modal';
import Badge from '../components/Badge';

export default function EventsManagement() {
  const { events, selectedEvent, selectEvent, refreshEvents, loading } = useEvent();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);

  // Form State
  const [eventName, setEventName] = useState('');
  const [eventCode, setEventCode] = useState('');
  const [description, setDescription] = useState('');
  const [venue, setVenue] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [status, setStatus] = useState('active');
  const [submitting, setSubmitting] = useState(false);

  const toast = useToast();
  const navigate = useNavigate();

  const handleOpenCreate = () => {
    setEventName('');
    setEventCode('');
    setDescription('');
    setVenue('');
    setStartDate(new Date().toISOString().slice(0, 16));
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 3);
    setEndDate(nextWeek.toISOString().slice(0, 16));
    setStatus('active');
    setShowCreateModal(true);
  };

  const handleOpenEdit = (ev) => {
    setEditingEvent(ev);
    setEventName(ev.event_name);
    setEventCode(ev.event_code);
    setDescription(ev.description || '');
    setVenue(ev.venue || '');
    setStartDate(new Date(ev.event_start_date).toISOString().slice(0, 16));
    setEndDate(new Date(ev.event_end_date).toISOString().slice(0, 16));
    setStatus(ev.status);
    setShowEditModal(true);
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await api.post('/events', {
        eventName,
        eventCode,
        description,
        venue,
        startDate,
        endDate,
        status
      });

      if (res.success) {
        toast.success(res.message);
        setShowCreateModal(false);
        await refreshEvents();
      }
    } catch (err) {
      toast.error(err.message || 'Failed to create event');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editingEvent) return;
    setSubmitting(true);
    try {
      const res = await api.put(`/events/${editingEvent.id}`, {
        eventName,
        eventCode,
        description,
        venue,
        startDate,
        endDate,
        status
      });

      if (res.success) {
        toast.success(res.message);
        setShowEditModal(false);
        await refreshEvents();
      }
    } catch (err) {
      toast.error(err.message || 'Failed to update event');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (ev) => {
    const newStatus = ev.status === 'active' ? 'inactive' : 'active';
    try {
      const res = await api.put(`/events/${ev.id}/status`, { status: newStatus });
      if (res.success) {
        toast.success(res.message);
        await refreshEvents();
      }
    } catch (err) {
      toast.error(err.message || 'Failed to update event status');
    }
  };

  const handleManageEvent = (ev) => {
    selectEvent(ev);
    toast.success(`Switched active context to: ${ev.event_name}`);
    navigate('/passes');
  };

  const filteredEvents = events.filter((ev) => {
    const matchesSearch =
      ev.event_name.toLowerCase().includes(search.toLowerCase()) ||
      ev.event_code.toLowerCase().includes(search.toLowerCase()) ||
      (ev.venue && ev.venue.toLowerCase().includes(search.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || ev.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div style={{ padding: '24px 32px', maxWidth: '1440px', margin: '0 auto' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800 }}>Events Management</h1>
          <p style={{ fontSize: '13.5px', color: 'var(--text-muted)' }}>
            Create and manage independent events, venues, dates, and dedicated event ecosystems
          </p>
        </div>

        <button onClick={handleOpenCreate} className="btn btn-primary">
          <Plus size={16} />
          <span>Create New Event</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="card" style={{ marginBottom: '20px', padding: '16px 20px' }}>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: '240px' }}>
            <Search size={18} color="var(--text-muted)" />
            <input
              type="text"
              placeholder="Search by event name, code, or venue..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: '100%' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ padding: '8px 14px' }}
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="upcoming">Upcoming</option>
              <option value="completed">Completed</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      {/* Events Table / Card Grid */}
      <div className="card" style={{ overflow: 'hidden', padding: 0 }}>
        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th>Event Name & Code</th>
                <th>Dates & Venue</th>
                <th>Status</th>
                <th>Categories</th>
                <th>Pass Inventory</th>
                <th>Admins</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredEvents.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
                    No events found matching your filter criteria.
                  </td>
                </tr>
              ) : (
                filteredEvents.map((ev) => {
                  const isCurrent = selectedEvent?.id === ev.id;
                  return (
                    <tr key={ev.id} style={{ backgroundColor: isCurrent ? 'var(--primary-50)' : 'transparent' }}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '8px',
                            backgroundColor: isCurrent ? 'var(--primary-600)' : 'var(--bg-surface-hover)',
                            color: isCurrent ? '#FFFFFF' : 'var(--primary-600)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 800,
                            fontSize: '13px'
                          }}>
                            {ev.event_code.slice(0, 3)}
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, fontSize: '14.5px', color: 'var(--text-primary)' }}>
                              {ev.event_name}
                              {isCurrent && (
                                <span style={{
                                  marginLeft: '8px',
                                  fontSize: '11px',
                                  backgroundColor: 'var(--primary-600)',
                                  color: '#FFFFFF',
                                  padding: '2px 8px',
                                  borderRadius: 'var(--radius-full)',
                                  fontWeight: 700
                                }}>
                                  ACTIVE CONTEXT
                                </span>
                              )}
                            </div>
                            <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                              CODE: {ev.event_code}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td>
                        <div style={{ fontSize: '13px', fontWeight: 600 }}>
                          {new Date(ev.event_start_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })} – {new Date(ev.event_end_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                          <MapPin size={12} />
                          <span>{ev.venue || 'Main Venue'}</span>
                        </div>
                      </td>

                      <td>
                        <Badge variant={ev.status === 'active' ? 'success' : ev.status === 'upcoming' ? 'info' : 'neutral'}>
                          {ev.status.toUpperCase()}
                        </Badge>
                      </td>

                      <td>
                        <span style={{ fontWeight: 700 }}>{ev.category_count || 0}</span>
                        <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}> categories</span>
                      </td>

                      <td>
                        <div style={{ fontWeight: 700, fontSize: '13.5px' }}>
                          {Number(ev.total_passes || 0).toLocaleString()} passes
                        </div>
                        <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                          {Number(ev.printed_passes || 0).toLocaleString()} printed • {Number(ev.used_passes || 0).toLocaleString()} used
                        </div>
                      </td>

                      <td>
                        <span style={{ fontWeight: 700 }}>{ev.admin_count || 0}</span>
                        <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}> admins</span>
                      </td>

                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '6px' }}>
                          <button
                            onClick={() => handleManageEvent(ev)}
                            className="btn btn-primary btn-sm"
                            title="Manage this event"
                          >
                            <ExternalLink size={14} />
                            <span>Manage</span>
                          </button>

                          <button
                            onClick={() => handleOpenEdit(ev)}
                            className="btn btn-secondary btn-sm btn-icon"
                            title="Edit Event Details"
                          >
                            <Edit2 size={14} />
                          </button>

                          <button
                            onClick={() => handleToggleStatus(ev)}
                            className="btn btn-outline btn-sm btn-icon"
                            title={ev.status === 'active' ? 'Deactivate Event' : 'Activate Event'}
                            style={{ color: ev.status === 'active' ? 'var(--danger-accent)' : 'var(--success-accent)' }}
                          >
                            <Power size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Event Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create New Event"
        maxWidth="600px"
      >
        <form onSubmit={handleCreateSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>Event Name *</label>
            <input
              type="text"
              placeholder="e.g. Summer Music Festival 2026"
              value={eventName}
              onChange={(e) => setEventName(e.target.value)}
              required
              style={{ width: '100%' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>Event Code *</label>
              <input
                type="text"
                placeholder="e.g. MUSIC2026"
                value={eventCode}
                onChange={(e) => setEventCode(e.target.value.toUpperCase())}
                required
                style={{ width: '100%', fontFamily: 'var(--font-mono)' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>Status</label>
              <select value={status} onChange={(e) => setStatus(e.target.value)} style={{ width: '100%' }}>
                <option value="active">Active</option>
                <option value="upcoming">Upcoming</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>Venue / Location</label>
            <input
              type="text"
              placeholder="e.g. Grand Convention Center, Hall A & B"
              value={venue}
              onChange={(e) => setVenue(e.target.value)}
              style={{ width: '100%' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>Start Date & Time *</label>
              <input
                type="datetime-local"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
                style={{ width: '100%' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>End Date & Time *</label>
              <input
                type="datetime-local"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
                style={{ width: '100%' }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>Description</label>
            <textarea
              rows={3}
              placeholder="Event background, guidelines, and access instructions..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              style={{ width: '100%' }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
            <button type="button" onClick={() => setShowCreateModal(false)} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={submitting} className="btn btn-primary">
              {submitting ? 'Creating Event...' : 'Create Event'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Event Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Edit Event Details"
        maxWidth="600px"
      >
        <form onSubmit={handleEditSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>Event Name</label>
            <input
              type="text"
              value={eventName}
              onChange={(e) => setEventName(e.target.value)}
              required
              style={{ width: '100%' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>Event Code</label>
              <input
                type="text"
                value={eventCode}
                onChange={(e) => setEventCode(e.target.value.toUpperCase())}
                required
                style={{ width: '100%', fontFamily: 'var(--font-mono)' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>Status</label>
              <select value={status} onChange={(e) => setStatus(e.target.value)} style={{ width: '100%' }}>
                <option value="active">Active</option>
                <option value="upcoming">Upcoming</option>
                <option value="completed">Completed</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>Venue</label>
            <input
              type="text"
              value={venue}
              onChange={(e) => setVenue(e.target.value)}
              style={{ width: '100%' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>Start Date & Time</label>
              <input
                type="datetime-local"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
                style={{ width: '100%' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>End Date & Time</label>
              <input
                type="datetime-local"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
                style={{ width: '100%' }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>Description</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              style={{ width: '100%' }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
            <button type="button" onClick={() => setShowEditModal(false)} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={submitting} className="btn btn-primary">
              {submitting ? 'Saving Changes...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
