import React, { useState, useEffect } from 'react';
import {
  Tags,
  Plus,
  Edit2,
  Trash2,
  RefreshCw,
  Calendar,
  Layers,
  Sparkles
} from 'lucide-react';
import { api } from '../services/api';
import { useEvent } from '../context/EventContext';
import { useToast } from '../context/ToastContext';
import Modal from '../components/Modal';
import Badge from '../components/Badge';

export default function PassCategories() {
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
    setValidFrom(selectedEvent ? new Date(selectedEvent.event_start_date).toISOString().slice(0, 16) : '2026-10-02T00:00');
    setValidUntil(selectedEvent ? new Date(selectedEvent.event_end_date).toISOString().slice(0, 16) : '2026-10-02T23:59');
    setTotalQuantity(1000);
    setMaxDailyScans(1);
    setPrice(0);
    setShowModal(true);
  };

  const handleOpenEdit = (cat) => {
    setEditingCategory(cat);
    setEventId(String(cat.event_id));
    setName(cat.name);
    setCode(cat.code);
    setCategoryPrefix(cat.category_prefix || '');
    setDescription(cat.description || '');
    setValidFrom(new Date(cat.valid_from).toISOString().slice(0, 16));
    setValidUntil(new Date(cat.valid_until).toISOString().slice(0, 16));
    setTotalQuantity(cat.total_quantity);
    setMaxDailyScans(cat.max_daily_scans);
    setPrice(cat.price);
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingCategory) {
        const res = await api.put(`/categories/${editingCategory.id}`, {
          name,
          categoryPrefix,
          description,
          validFrom,
          validUntil,
          maxDailyScans,
          price
        });
        if (res.success) {
          toast.success(res.message);
          setShowModal(false);
          fetchCategories();
        }
      } else {
        const res = await api.post('/categories', {
          eventId: parseInt(eventId, 10),
          name,
          code,
          categoryPrefix,
          description,
          validFrom,
          validUntil,
          totalQuantity,
          maxDailyScans,
          price
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
          <h1 style={{ fontSize: '24px', fontWeight: 800 }}>Pass Categories</h1>
          <p style={{ fontSize: '13.5px', color: 'var(--text-muted)' }}>
            Configure ticket tiers, internal prefixes, and event-specific entry permissions
            {selectedEvent && <span> for <strong>{selectedEvent.event_name}</strong></span>}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={handleOpenCreate} className="btn btn-primary">
            <Plus size={16} />
            <span>Create Category</span>
          </button>
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
                <th>Validity Window</th>
                <th>Daily Scans</th>
                <th>Total Pass Inventory</th>
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
                    No categories found for this event. Click "Create Category" to get started.
                  </td>
                </tr>
              ) : (
                categories.map((cat) => (
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
                        {new Date(cat.valid_from).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} – {new Date(cat.valid_until).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                      </div>
                    </td>

                    <td>
                      <span style={{ fontWeight: 700 }}>{cat.max_daily_scans} scan / day</span>
                    </td>

                    <td>
                      <div style={{ fontWeight: 700 }}>{Number(cat.total_passes_in_db || cat.total_quantity || 0).toLocaleString()} passes</div>
                    </td>

                    <td>
                      <div style={{ fontSize: '12.5px' }}>
                        <span style={{ color: 'var(--primary-600)', fontWeight: 600 }}>{cat.printed_count || 0} printed</span> • <span style={{ color: 'var(--success-accent)', fontWeight: 600 }}>{cat.used_count || 0} used</span>
                      </div>
                    </td>

                    <td style={{ textAlign: 'right' }}>
                      <button
                        onClick={() => handleOpenEdit(cat)}
                        className="btn btn-secondary btn-sm btn-icon"
                        title="Edit Category"
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

      {/* Create / Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingCategory ? 'Edit Category' : 'Create Pass Category'}
        maxWidth="540px"
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
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>Valid From *</label>
              <input
                type="datetime-local"
                value={validFrom}
                onChange={(e) => setValidFrom(e.target.value)}
                required
                style={{ width: '100%' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>Valid Until *</label>
              <input
                type="datetime-local"
                value={validUntil}
                onChange={(e) => setValidUntil(e.target.value)}
                required
                style={{ width: '100%' }}
              />
            </div>
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
