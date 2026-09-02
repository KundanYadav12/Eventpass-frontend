import React, { useState, useEffect } from 'react';
import {
  Tags,
  Plus,
  Edit2,
  Trash2,
  RefreshCw,
  Calendar,
  Layers,
  Sparkles,
  Clock,
  RotateCw,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { api } from '../services/api';
import { useEvent } from '../context/EventContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Modal from '../components/Modal';
import Badge from '../components/Badge';
import {
  formatDateIST,
  formatBehaviorSummary,
  formatClockTime,
  toDatetimeLocalIST,
  istDatetimeLocalToUTC
} from '../utils/dateUtil';

export default function PassCategories() {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'SUPERADMIN';
  const { events, selectedEvent } = useEvent();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);

  // Form State
  const [eventId, setEventId] = useState('');
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [categoryPrefix, setCategoryPrefix] = useState('');
  const [description, setDescription] = useState('');
  const [validFrom, setValidFrom] = useState('');
  const [validUntil, setValidUntil] = useState('');
  const [totalQuantity, setTotalQuantity] = useState(1000);
  const [maxDailyScans, setMaxDailyScans] = useState(1);
  const [price, setPrice] = useState(0);

  // Scan Behavior & Renewal Settings
  const [scanBehavior, setScanBehavior] = useState('ONE_TIME'); // 'ONE_TIME' | 'RENEWABLE'
  const [renewalTime, setRenewalTime] = useState('01:00');
  const [renewalActiveFrom, setRenewalActiveFrom] = useState('');
  const [renewalActiveUntil, setRenewalActiveUntil] = useState('');

  const toast = useToast();

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const url = selectedEvent ? `/categories?eventId=${selectedEvent.id}` : '/categories';
      const res = await api.get(url);
      if (res.success) {
        setCategories(res.data);
      }
    } catch (err) {
      toast.error('Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, [selectedEvent]);

  const handleOpenCreate = () => {
    setEditingCategory(null);
    setEventId(selectedEvent ? String(selectedEvent.id) : (events[0] ? String(events[0].id) : '1'));
    setName('');
    setCode('');
    setCategoryPrefix('');
    setDescription('');
    const defaultStart = selectedEvent?.event_start_date ? toDatetimeLocalIST(selectedEvent.event_start_date) : '2026-10-02T00:00';
    const defaultEnd = selectedEvent?.event_end_date ? toDatetimeLocalIST(selectedEvent.event_end_date) : '2026-10-02T23:59';
    setValidFrom(defaultStart);
    setValidUntil(defaultEnd);
    setTotalQuantity(1000);
    setMaxDailyScans(1);
    setPrice(0);
    setScanBehavior('ONE_TIME');
    setRenewalTime('01:00');
    setRenewalActiveFrom(defaultStart);
    setRenewalActiveUntil(defaultEnd);
    setShowModal(true);
  };

  const handleOpenEdit = (cat) => {
    setEditingCategory(cat);
    setEventId(String(cat.event_id));
    setName(cat.name);
    setCode(cat.code);
    setCategoryPrefix(cat.category_prefix || '');
    setDescription(cat.description || '');
    setValidFrom(toDatetimeLocalIST(cat.valid_from));
    setValidUntil(toDatetimeLocalIST(cat.valid_until));
    setTotalQuantity(cat.total_quantity);
    setMaxDailyScans(cat.max_daily_scans);
    setPrice(cat.price);
    
    // Scan behavior state
    const behavior = (cat.scan_behavior || 'ONE_TIME').toUpperCase();
    setScanBehavior(behavior);
    setRenewalTime(cat.renewal_time || '01:00');
    setRenewalActiveFrom(toDatetimeLocalIST(cat.renewal_active_from || cat.valid_from));
    setRenewalActiveUntil(toDatetimeLocalIST(cat.renewal_active_until || cat.valid_until));
    
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        name,
        categoryPrefix,
        description,
        validFrom: istDatetimeLocalToUTC(validFrom),
        validUntil: istDatetimeLocalToUTC(validUntil),
        maxDailyScans,
        price,
        scanBehavior,
        renewalTime: scanBehavior === 'RENEWABLE' ? renewalTime : '01:00',
        renewalActiveFrom: scanBehavior === 'RENEWABLE' ? istDatetimeLocalToUTC(renewalActiveFrom || validFrom) : null,
        renewalActiveUntil: scanBehavior === 'RENEWABLE' ? istDatetimeLocalToUTC(renewalActiveUntil || validUntil) : null
      };

      if (editingCategory) {
        const res = await api.put(`/categories/${editingCategory.id}`, payload);
        if (res.success) {
          toast.success(res.message);
          setShowModal(false);
          fetchCategories();
        }
      } else {
        const res = await api.post('/categories', {
          ...payload,
          eventId: parseInt(eventId, 10),
          code,
          totalQuantity
        });
        if (res.success) {
          toast.success(res.message);
          setShowModal(false);
          fetchCategories();
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
          <h1 style={{ fontSize: '24px', fontWeight: 800 }}>Pass Categories & Renewal Rules</h1>
          <p style={{ fontSize: '13.5px', color: 'var(--text-muted)' }}>
            Configure ticket tiers, Indian Standard Time (IST) renewal cycles, and entry permissions
            {selectedEvent && <span> for <strong>{selectedEvent.event_name}</strong></span>}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          {isSuperAdmin && (
            <button onClick={handleOpenCreate} className="btn btn-primary">
              <Plus size={16} />
              <span>Create Category</span>
            </button>
          )}
          <button onClick={fetchCategories} className="btn btn-outline btn-icon" title="Refresh">
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th>Category Name</th>
                <th>Internal Prefix</th>
                <th>Validity Window (IST)</th>
                <th>Scan Behavior & Renewal Rule</th>
                <th>Total Passes</th>
                <th>Printed / Used</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                    Loading categories...
                  </td>
                </tr>
              ) : categories.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                    {isSuperAdmin ? 'No categories found for this event. Click "Create Category" to get started.' : 'No pass categories found for this event.'}
                  </td>
                </tr>
              ) : (
                categories.map((cat) => {
                  const isRenewable = (cat.scan_behavior || 'ONE_TIME').toUpperCase() === 'RENEWABLE';
                  return (
                    <tr key={cat.id}>
                      <td>
                        <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-primary)' }}>{cat.name}</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                          {cat.code} {cat.event_name ? `• ${cat.event_name}` : ''}
                        </div>
                      </td>

                      <td>
                        {cat.category_prefix ? (
                          <span style={{
                            fontFamily: 'var(--font-mono)',
                            fontWeight: 700,
                            backgroundColor: 'var(--primary-50)',
                            color: 'var(--primary-700)',
                            padding: '2px 8px',
                            borderRadius: '4px',
                            fontSize: '12px'
                          }}>
                            {cat.category_prefix}
                          </span>
                        ) : (
                          <span style={{ color: 'var(--text-subtle)', fontSize: '12px' }}>None (Default)</span>
                        )}
                      </td>

                      <td>
                        <div style={{ fontSize: '12.5px', color: 'var(--text-primary)' }}>
                          {formatDateIST(cat.valid_from)} – {formatDateIST(cat.valid_until)}
                        </div>
                      </td>

                      <td>
                        {isRenewable ? (
                          <div>
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              backgroundColor: '#EFF6FF',
                              color: '#1D4ED8',
                              padding: '3px 8px',
                              borderRadius: '6px',
                              fontSize: '12px',
                              fontWeight: 700
                            }}>
                              <RotateCw size={12} />
                              Renews Daily @ {formatClockTime(cat.renewal_time || '01:00')} IST
                            </span>
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                              Active: {formatDateIST(cat.renewal_active_from || cat.valid_from)} – {formatDateIST(cat.renewal_active_until || cat.valid_until)}
                            </div>
                          </div>
                        ) : (
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            backgroundColor: '#F3F4F6',
                            color: '#4B5563',
                            padding: '3px 8px',
                            borderRadius: '6px',
                            fontSize: '12px',
                            fontWeight: 600
                          }}>
                            <CheckCircle2 size={12} />
                            One-Time Use (Permanent)
                          </span>
                        )}
                      </td>

                      <td>
                        <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                          {Number(cat.total_passes_in_db ?? 0).toLocaleString()} passes
                        </div>
                        <small style={{ color: 'var(--text-subtle)', fontSize: '11px' }}>
                          Limit: {Number(cat.total_quantity || 0).toLocaleString()}
                        </small>
                      </td>

                      <td>
                        <div style={{ fontSize: '12.5px' }}>
                          <span style={{ color: 'var(--primary-600)', fontWeight: 600 }}>{cat.printed_count || 0} printed</span> • <span style={{ color: 'var(--success-accent)', fontWeight: 600 }}>{cat.used_count || 0} used</span>
                        </div>
                      </td>

                      <td style={{ textAlign: 'right' }}>
                        {isSuperAdmin ? (
                          <button
                            onClick={() => handleOpenEdit(cat)}
                            className="btn btn-secondary btn-sm btn-icon"
                            title="Edit Category"
                          >
                            <Edit2 size={14} />
                          </button>
                        ) : (
                          <span style={{ fontSize: '12px', color: 'var(--text-subtle)', fontStyle: 'italic' }}>View Only</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create / Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingCategory ? 'Edit Category & Renewal Rules' : 'Create Pass Category'}
        maxWidth="580px"
      >
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>Event *</label>
            <select
              value={eventId}
              onChange={(e) => setEventId(e.target.value)}
              disabled={Boolean(editingCategory)}
              style={{ width: '100%' }}
              required
            >
              {events.map(ev => (
                <option key={ev.id} value={ev.id}>{ev.event_name} ({ev.event_code})</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>Category Name *</label>
              <input
                type="text"
                placeholder="e.g. VIP Access Pass"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                style={{ width: '100%' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>System Code *</label>
              <input
                type="text"
                placeholder="e.g. vip_access"
                value={code}
                onChange={(e) => setCode(e.target.value.toLowerCase().replace(/\s+/g, '_'))}
                disabled={Boolean(editingCategory)}
                required
                style={{ width: '100%', fontFamily: 'var(--font-mono)' }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
              Internal Category Prefix (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. VIP, D1, AS (Default: none)"
              value={categoryPrefix}
              onChange={(e) => setCategoryPrefix(e.target.value.toUpperCase())}
              style={{ width: '100%', fontFamily: 'var(--font-mono)' }}
            />
            <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '4px' }}>
              Used internally for categorizing. The printed pass code itself remains strictly the unique 7-digit code.
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>Valid From (IST) *</label>
              <input
                type="datetime-local"
                value={validFrom}
                onChange={(e) => setValidFrom(e.target.value)}
                required
                style={{ width: '100%' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>Valid Until (IST) *</label>
              <input
                type="datetime-local"
                value={validUntil}
                onChange={(e) => setValidUntil(e.target.value)}
                required
                style={{ width: '100%' }}
              />
            </div>
          </div>

          {/* SCAN BEHAVIOR & RENEWAL RULES SECTION */}
          <div style={{
            border: '1px solid var(--border-color, #E2E8F0)',
            borderRadius: '8px',
            padding: '14px',
            backgroundColor: 'var(--bg-subtle, #F8FAFC)'
          }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '8px', color: 'var(--text-primary)' }}>
              🎯 Scan Behavior Mode *
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 12px',
                borderRadius: '6px',
                border: scanBehavior === 'ONE_TIME' ? '2px solid var(--primary-600, #2563EB)' : '1px solid #CBD5E1',
                backgroundColor: scanBehavior === 'ONE_TIME' ? '#EFF6FF' : '#FFFFFF',
                cursor: 'pointer'
              }}>
                <input
                  type="radio"
                  name="scanBehavior"
                  value="ONE_TIME"
                  checked={scanBehavior === 'ONE_TIME'}
                  onChange={() => setScanBehavior('ONE_TIME')}
                />
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 700 }}>One-Time Use</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Permanent expiry after 1 scan</div>
                </div>
              </label>

              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 12px',
                borderRadius: '6px',
                border: scanBehavior === 'RENEWABLE' ? '2px solid var(--primary-600, #2563EB)' : '1px solid #CBD5E1',
                backgroundColor: scanBehavior === 'RENEWABLE' ? '#EFF6FF' : '#FFFFFF',
                cursor: 'pointer'
              }}>
                <input
                  type="radio"
                  name="scanBehavior"
                  value="RENEWABLE"
                  checked={scanBehavior === 'RENEWABLE'}
                  onChange={() => setScanBehavior('RENEWABLE')}
                />
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 700 }}>Renewable</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Scheduled daily/recurring reset</div>
                </div>
              </label>
            </div>

            {/* CONDITIONAL RENEWAL FIELDS (REVEALED WHEN RENEWABLE IS SELECTED) */}
            {scanBehavior === 'RENEWABLE' && (
              <div style={{
                marginTop: '12px',
                paddingTop: '12px',
                borderTop: '1px dashed #CBD5E1',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, marginBottom: '4px' }}>
                    ⏰ Renewal Time (IST Clock Time) *
                  </label>
                  <input
                    type="time"
                    value={renewalTime}
                    onChange={(e) => setRenewalTime(e.target.value)}
                    required={scanBehavior === 'RENEWABLE'}
                    style={{ width: '100%', maxWidth: '200px' }}
                  />
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                    The exact time in Indian Standard Time (IST) when the daily scan lock resets (e.g. 01:00 AM).
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, marginBottom: '4px' }}>
                      Renewal Active From (IST) *
                    </label>
                    <input
                      type="datetime-local"
                      value={renewalActiveFrom}
                      onChange={(e) => setRenewalActiveFrom(e.target.value)}
                      required={scanBehavior === 'RENEWABLE'}
                      style={{ width: '100%' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, marginBottom: '4px' }}>
                      Renewal Active Until (IST) *
                    </label>
                    <input
                      type="datetime-local"
                      value={renewalActiveUntil}
                      onChange={(e) => setRenewalActiveUntil(e.target.value)}
                      required={scanBehavior === 'RENEWABLE'}
                      style={{ width: '100%' }}
                    />
                  </div>
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  During this date range, passes unlock daily at {formatClockTime(renewalTime)} IST. Outside this window, passes expire.
                </div>
              </div>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>Daily Scan Limit</label>
              <input
                type="number"
                min={1}
                max={10}
                value={maxDailyScans}
                onChange={(e) => setMaxDailyScans(parseInt(e.target.value, 10))}
                style={{ width: '100%' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>Price ($)</label>
              <input
                type="number"
                min={0}
                step="0.01"
                value={price}
                onChange={(e) => setPrice(parseFloat(e.target.value))}
                style={{ width: '100%' }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
            <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              {editingCategory ? 'Save Changes' : 'Create Category'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
