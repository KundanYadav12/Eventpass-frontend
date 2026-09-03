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
  Building2,
  QrCode,
  Barcode,
  Eye
} from 'lucide-react';
import { api } from '../services/api';
import { useEvent } from '../context/EventContext';
import { useToast } from '../context/ToastContext';
import Modal from '../components/Modal';
import Badge from '../components/Badge';
import ScannableBarcode from '../components/ScannableBarcode';
import { toDatetimeLocalIST, istDatetimeLocalToUTC, formatDateIST } from '../utils/dateUtil';

/**
 * 38mm × 50mm Live Thermal Sticker Preview Component
 */
function StickerPreview({ barcodeType, sampleCode = '55KDBD2' }) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '8px',
      padding: '16px',
      backgroundColor: 'var(--bg-surface-hover)',
      borderRadius: 'var(--radius-md)',
      border: '1px solid var(--border-color)'
    }}>
      <div style={{ fontSize: '11.5px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
        Live Thermal Label Preview (38mm × 50mm Ratio)
      </div>

      {/* The 38mm x 50mm Thermal Label Shell */}
      <div style={{
        width: '180px',
        height: '237px', // Exact 38:50 aspect ratio
        backgroundColor: '#FFFFFF',
        color: '#000000',
        borderRadius: '6px',
        boxShadow: '0 4px 14px rgba(0,0,0,0.15)',
        border: '1px solid #CBD5E1',
        padding: '12px 8px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        textAlign: 'center',
        position: 'relative',
        boxSizing: 'border-box'
      }}>
        {/* Barcode / QR Code Body & Pass Code Text */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
          <ScannableBarcode
            value={sampleCode}
            type={barcodeType || 'QR_CODE'}
            size="lg"
            showText={false}
            style={{ border: 'none', padding: 0, boxShadow: 'none' }}
          />

          <div style={{
            fontFamily: 'var(--font-mono, monospace)',
            fontSize: '13px',
            fontWeight: 900,
            letterSpacing: '1.5px',
            color: '#000000',
            marginTop: '8px'
          }}>
            PASS CODE: {sampleCode}
          </div>
        </div>
      </div>
    </div>
  );
}

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
  const [barcodeType, setBarcodeType] = useState('QR_CODE');
  const [stickerWidthMm, setStickerWidthMm] = useState(38);
  const [stickerHeightMm, setStickerHeightMm] = useState(50);
  const [submitting, setSubmitting] = useState(false);

  const toast = useToast();
  const navigate = useNavigate();

  const handleOpenCreate = () => {
    setEventName('');
    setEventCode('');
    setDescription('');
    setVenue('');
    const now = new Date();
    setStartDate(toDatetimeLocalIST(now));
    const nextWeek = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
    setEndDate(toDatetimeLocalIST(nextWeek));
    setStatus('active');
    setBarcodeType('QR_CODE');
    setStickerWidthMm(38);
    setStickerHeightMm(50);
    setShowCreateModal(true);
  };

  const handleOpenEdit = (ev) => {
    setEditingEvent(ev);
    setEventName(ev.event_name);
    setEventCode(ev.event_code);
    setDescription(ev.description || '');
    setVenue(ev.venue || '');
    setStartDate(toDatetimeLocalIST(ev.event_start_date));
    setEndDate(toDatetimeLocalIST(ev.event_end_date));
    setStatus(ev.status);
    setBarcodeType(ev.barcode_type || 'QR_CODE');
    setStickerWidthMm(ev.sticker_width_mm || 38);
    setStickerHeightMm(ev.sticker_height_mm || 50);
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
        startDate: istDatetimeLocalToUTC(startDate),
        endDate: istDatetimeLocalToUTC(endDate),
        status,
        barcodeType,
        stickerWidthMm,
        stickerHeightMm
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
        startDate: istDatetimeLocalToUTC(startDate),
        endDate: istDatetimeLocalToUTC(endDate),
        status,
        barcodeType,
        stickerWidthMm,
        stickerHeightMm
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
            Create and manage independent events, venues, barcode formats, and dedicated ticketing ecosystems
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

      {/* Events Table */}
      <div className="card" style={{ overflow: 'hidden', padding: 0 }}>
        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th>Event Name & Code</th>
                <th>Dates & Venue</th>
                <th>Barcode Format</th>
                <th>Status</th>
                <th>Categories</th>
                <th>Pass Inventory</th>
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
                  const isQR = (ev.barcode_type || 'QR_CODE') === 'QR_CODE';
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
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          {isQR ? <QrCode size={16} color="var(--primary-600)" /> : <Barcode size={16} color="var(--primary-600)" />}
                          <span style={{ fontWeight: 700, fontSize: '12.5px' }}>
                            {isQR ? 'QR Code (2D)' : 'Code128 (1D)'}
                          </span>
                        </div>
                        <small style={{ fontSize: '11px', color: 'var(--text-subtle)' }}>
                          38mm × 50mm Thermal
                        </small>
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

                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                          <button
                            onClick={() => handleManageEvent(ev)}
                            className="btn btn-primary btn-sm"
                            title="Switch Context & Manage Passes"
                          >
                            <Building2 size={14} />
                            <span>Select Event</span>
                          </button>
                          <button
                            onClick={() => handleOpenEdit(ev)}
                            className="btn btn-secondary btn-sm btn-icon"
                            title="Edit Event"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={() => handleToggleStatus(ev)}
                            className="btn btn-ghost btn-sm btn-icon"
                            title={ev.status === 'active' ? 'Deactivate Event' : 'Activate Event'}
                          >
                            <Power size={14} color={ev.status === 'active' ? 'var(--danger-500)' : 'var(--success-500)'} />
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
        title="Create New Event Ecosystem"
        maxWidth="800px"
      >
        <form onSubmit={handleCreateSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 240px', gap: '24px', alignItems: 'start' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label">Event Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Raas Utsav 2026, Tech Innovation Summit"
                  value={eventName}
                  onChange={(e) => setEventName(e.target.value)}
                  required
                  style={{ width: '100%' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Event Code *</label>
                  <input
                    type="text"
                    placeholder="e.g. RAAS2026"
                    value={eventCode}
                    onChange={(e) => setEventCode(e.target.value.toUpperCase())}
                    required
                    style={{ width: '100%', fontFamily: 'var(--font-mono)' }}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select value={status} onChange={(e) => setStatus(e.target.value)} style={{ width: '100%' }}>
                    <option value="active">Active</option>
                    <option value="upcoming">Upcoming</option>
                    <option value="completed">Completed</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>

              {/* Barcode Format Selection */}
              <div style={{ padding: '14px 16px', backgroundColor: 'var(--bg-surface-hover)', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                <label className="form-label" style={{ marginBottom: '8px' }}>
                  Sticker Barcode Format:
                </label>
                <div style={{ display: 'flex', gap: '20px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}>
                    <input
                      type="radio"
                      name="createBarcodeType"
                      value="QR_CODE"
                      checked={barcodeType === 'QR_CODE'}
                      onChange={(e) => setBarcodeType(e.target.value)}
                    />
                    <span>QR Code (2D)</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}>
                    <input
                      type="radio"
                      name="createBarcodeType"
                      value="CODE128"
                      checked={barcodeType === 'CODE128'}
                      onChange={(e) => setBarcodeType(e.target.value)}
                    />
                    <span>Code128 Barcode (1D)</span>
                  </label>
                </div>
                <small className="form-help">
                  Pass code text will always be printed bold beneath the code. Sticker size: 38mm × 50mm.
                </small>
              </div>

              <div className="form-group">
                <label className="form-label">Venue / Location</label>
                <input
                  type="text"
                  placeholder="e.g. Grand Convention Center, Hall A & B"
                  value={venue}
                  onChange={(e) => setVenue(e.target.value)}
                  style={{ width: '100%' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Start Date & Time *</label>
                  <input
                    type="datetime-local"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    required
                    style={{ width: '100%' }}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">End Date & Time *</label>
                  <input
                    type="datetime-local"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    required
                    style={{ width: '100%' }}
                  />
                </div>
              </div>
            </div>

            {/* Live 38mm x 50mm Sticker Preview */}
            <div>
              <StickerPreview eventName={eventName || 'Event Name'} barcodeType={barcodeType} />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea
              rows={2}
              placeholder="Event background, guidelines, and access instructions..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              style={{ width: '100%' }}
            />
          </div>

          <div className="modal-footer">
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
        maxWidth="800px"
      >
        <form onSubmit={handleEditSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 240px', gap: '24px', alignItems: 'start' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label">Event Name</label>
                <input
                  type="text"
                  value={eventName}
                  onChange={(e) => setEventName(e.target.value)}
                  required
                  style={{ width: '100%' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Event Code</label>
                  <input
                    type="text"
                    value={eventCode}
                    onChange={(e) => setEventCode(e.target.value.toUpperCase())}
                    required
                    style={{ width: '100%', fontFamily: 'var(--font-mono)' }}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select value={status} onChange={(e) => setStatus(e.target.value)} style={{ width: '100%' }}>
                    <option value="active">Active</option>
                    <option value="upcoming">Upcoming</option>
                    <option value="completed">Completed</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>

              {/* Barcode Format Selection */}
              <div style={{ padding: '14px 16px', backgroundColor: 'var(--bg-surface-hover)', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                <label className="form-label" style={{ marginBottom: '8px' }}>
                  Sticker Barcode Format:
                </label>
                <div style={{ display: 'flex', gap: '20px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}>
                    <input
                      type="radio"
                      name="editBarcodeType"
                      value="QR_CODE"
                      checked={barcodeType === 'QR_CODE'}
                      onChange={(e) => setBarcodeType(e.target.value)}
                    />
                    <span>QR Code (2D)</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}>
                    <input
                      type="radio"
                      name="editBarcodeType"
                      value="CODE128"
                      checked={barcodeType === 'CODE128'}
                      onChange={(e) => setBarcodeType(e.target.value)}
                    />
                    <span>Code128 Barcode (1D)</span>
                  </label>
                </div>
                <small className="form-help">
                  Pass code text will always be printed bold beneath the code. Sticker size: 38mm × 50mm.
                </small>
              </div>

              <div className="form-group">
                <label className="form-label">Venue</label>
                <input
                  type="text"
                  value={venue}
                  onChange={(e) => setVenue(e.target.value)}
                  style={{ width: '100%' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Start Date & Time (IST)</label>
                  <input
                    type="datetime-local"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    required
                    style={{ width: '100%' }}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">End Date & Time (IST)</label>
                  <input
                    type="datetime-local"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    required
                    style={{ width: '100%' }}
                  />
                </div>
              </div>
            </div>

            {/* Live Preview */}
            <div>
              <StickerPreview eventName={eventName || editingEvent?.event_name} barcodeType={barcodeType} />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              style={{ width: '100%' }}
            />
          </div>

          <div className="modal-footer">
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
