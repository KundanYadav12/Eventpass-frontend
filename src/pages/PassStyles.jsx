import React, { useState, useEffect } from 'react';
import {
  Palette,
  Plus,
  Edit2,
  Trash2,
  RefreshCw,
  Sparkles,
  QrCode,
  Barcode,
  CheckCircle2,
  Calendar,
  Layers,
  Star
} from 'lucide-react';
import { api } from '../services/api';
import { useEvent } from '../context/EventContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import PassDesignerModal from './PassDesignerModal';
import Badge from '../components/Badge';

export default function PassStyles() {
  const { user, isSuperAdmin, hasPermission } = useAuth();
  const { events, selectedEvent } = useEvent();
  const [styles, setStyles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDesignerModal, setShowDesignerModal] = useState(false);
  const [editingStyle, setEditingStyle] = useState(null);

  const canCreate = isSuperAdmin || hasPermission('pass_styles.create');
  const canEdit = isSuperAdmin || hasPermission('pass_styles.edit');
  const canDelete = isSuperAdmin || hasPermission('pass_styles.delete');

  const toast = useToast();

  const fetchStyles = async () => {
    setLoading(true);
    try {
      const url = selectedEvent ? `/pass-styles?eventId=${selectedEvent.id}` : '/pass-styles';
      const res = await api.get(url);
      if (res.success) {
        setStyles(res.data);
      }
    } catch (err) {
      toast.error('Failed to load pass styles');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStyles();
  }, [selectedEvent]);

  const handleOpenCreate = () => {
    setEditingStyle(null);
    setShowDesignerModal(true);
  };

  const handleOpenEdit = (style) => {
    setEditingStyle(style);
    setShowDesignerModal(true);
  };

  const handleDelete = async (style) => {
    if (!window.confirm(`Are you sure you want to delete the pass style "${style.name}"?`)) {
      return;
    }

    try {
      const res = await api.delete(`/pass-styles/${style.id}`);
      if (res.success) {
        toast.success(res.message);
        fetchStyles();
      }
    } catch (err) {
      toast.error(err.message || 'Failed to delete pass style');
    }
  };

  return (
    <div style={{ padding: '24px 32px', maxWidth: '1440px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800 }}>Pass Styles & Visual Designer</h1>
          <p style={{ fontSize: '13.5px', color: 'var(--text-muted)' }}>
            Design reusable event pass templates, position barcodes/QR codes with drag & drop, and configure typography
            {selectedEvent && <span> for <strong>{selectedEvent.event_name}</strong></span>}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          {canCreate && (
            <button onClick={handleOpenCreate} className="btn btn-primary">
              <Plus size={16} />
              <span>New Pass Style</span>
            </button>
          )}
          <button onClick={fetchStyles} className="btn btn-outline btn-icon" title="Refresh">
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {/* Grid of Pass Styles */}
      {loading ? (
        <div className="card" style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>
          Loading pass styles and designer templates...
        </div>
      ) : styles.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '48px' }}>
          <Palette size={48} style={{ margin: '0 auto 12px', color: 'var(--text-muted)' }} />
          <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '6px' }}>No Pass Styles Found</h3>
          <p style={{ fontSize: '13.5px', color: 'var(--text-muted)', maxWidth: '450px', margin: '0 auto 16px' }}>
            {canCreate
              ? 'Create a custom pass style with background templates and drag-and-drop barcode placement.'
              : 'No pass styles are currently available for this event.'}
          </p>
          {canCreate && (
            <button onClick={handleOpenCreate} className="btn btn-primary">
              <Plus size={16} />
              <span>Create First Pass Style</span>
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
          {styles.map(s => {
            const elementsCount = Array.isArray(s.elements_config) ? s.elements_config.length : 0;
            return (
              <div
                key={s.id}
                className="card"
                style={{
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '14px',
                  position: 'relative',
                  border: s.is_default ? '2px solid var(--primary-500, #3B82F6)' : '1px solid var(--border-color)',
                  boxShadow: 'var(--shadow-sm)'
                }}
              >
                {/* Top Badge & Title */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '10px' }}>
                  <div>
                    <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)' }}>
                      {s.name}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                      {s.event_name ? `Event: ${s.event_name}` : '🌐 Global Template (All Events)'}
                    </div>
                  </div>

                  {s.is_default && (
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      backgroundColor: '#EFF6FF',
                      color: '#1D4ED8',
                      fontSize: '11px',
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: '12px'
                    }}>
                      <Star size={12} fill="#1D4ED8" />
                      Default
                    </span>
                  )}
                </div>

                {/* Mini Preview Box */}
                <div style={{
                  height: '160px',
                  borderRadius: '8px',
                  backgroundColor: '#090D16',
                  backgroundImage: s.background_image_url ? `url(${s.background_image_url})` : 'linear-gradient(135deg, #0F172A 0%, #1E293B 50%, #090D16 100%)',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '12px',
                  color: '#FFFFFF',
                  textAlign: 'center',
                  border: '1px solid rgba(255,255,255,0.1)'
                }}>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#60A5FA' }}>
                    {s.name}
                  </div>
                  <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: 'rgba(255,255,255,0.9)', padding: '4px 8px', borderRadius: '4px' }}>
                    <Barcode size={24} color="#000000" />
                    <span style={{ fontSize: '10px', color: '#000000', fontWeight: 700, fontFamily: 'monospace' }}>55KDBD2</span>
                  </div>
                </div>

                {/* Specs / Meta */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-muted)' }}>
                  <span>📐 {s.canvas_width} × {s.canvas_height} px</span>
                  <span>🧩 {elementsCount} Elements</span>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '8px', marginTop: 'auto', borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}>
                  {canEdit && (
                    <button
                      onClick={() => handleOpenEdit(s)}
                      className="btn btn-secondary btn-sm"
                      style={{ flex: 1 }}
                    >
                      <Edit2 size={14} />
                      <span>Edit Design</span>
                    </button>
                  )}

                  {canDelete && (
                    <button
                      onClick={() => handleDelete(s)}
                      className="btn btn-outline btn-sm btn-icon"
                      title="Delete Style"
                      style={{ color: '#EF4444', borderColor: '#FCA5A5' }}
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Designer Studio Modal */}
      <PassDesignerModal
        isOpen={showDesignerModal}
        onClose={() => setShowDesignerModal(false)}
        editingStyle={editingStyle}
        events={events}
        selectedEvent={selectedEvent}
        isSuperAdmin={isSuperAdmin}
        onSaved={fetchStyles}
      />
    </div>
  );
}
