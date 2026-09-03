import React, { useState, useRef, useEffect } from 'react';
import {
  Upload,
  Type,
  QrCode,
  Barcode,
  Save,
  Trash2,
  Move,
  Check,
  Eye,
  Sparkles,
  Sliders,
  Layers,
  Palette,
  X
} from 'lucide-react';
import Modal from '../components/Modal';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';

const DEFAULT_ELEMENTS = [
  { id: 'el_event', type: 'text', field: 'event_name', label: 'Event Name', text: 'Corporate Expo 2026', x: 40, y: 50, width: 720, height: 60, fontSize: 32, fontColor: '#60A5FA', textAlign: 'center', isVisible: true },
  { id: 'el_category', type: 'text', field: 'category_name', label: 'Category / Tier', text: 'VIP ALL-ACCESS PASS', x: 40, y: 130, width: 720, height: 50, fontSize: 26, fontColor: '#F59E0B', textAlign: 'center', isVisible: true },
  { id: 'el_customer', type: 'text', field: 'customer_name', label: 'Pass Holder Name', text: 'Aarav Sharma', x: 40, y: 220, width: 720, height: 40, fontSize: 22, fontColor: '#FFFFFF', textAlign: 'center', isVisible: true },
  { id: 'el_validity', type: 'text', field: 'validity', label: 'Validity Window', text: 'Valid: 2 Oct 2026 – 4 Oct 2026', x: 40, y: 285, width: 720, height: 35, fontSize: 16, fontColor: '#94A3B8', textAlign: 'center', isVisible: true },
  { id: 'el_barcode', type: 'barcode', field: 'barcode', label: 'Barcode / QR Placeholder', x: 150, y: 390, width: 500, height: 130, isVisible: true },
  { id: 'el_code', type: 'text', field: 'pass_code', label: 'Unique Pass Code', text: 'PASS CODE: 55KDBD2', x: 40, y: 545, width: 720, height: 40, fontSize: 24, fontColor: '#38BDF8', textAlign: 'center', isVisible: true },
  { id: 'el_sponsor', type: 'text', field: 'sponsor', label: 'Sponsor Info', text: 'Sponsored by TechCorp India', x: 40, y: 620, width: 720, height: 35, fontSize: 15, fontColor: '#E2E8F0', textAlign: 'center', isVisible: true }
];

export default function PassDesignerModal({
  isOpen,
  onClose,
  editingStyle = null,
  events = [],
  selectedEvent = null,
  isSuperAdmin = false,
  onSaved
}) {
  const toast = useToast();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [eventId, setEventId] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  const [backgroundImageUrl, setBackgroundImageUrl] = useState('');
  const [elements, setElements] = useState(DEFAULT_ELEMENTS);
  const [selectedElementId, setSelectedElementId] = useState(null);
  const [saving, setSaving] = useState(false);

  // Canvas scaling dimensions
  const CANVAS_W = 800;
  const CANVAS_H = 1200;
  const DISPLAY_SCALE = 0.45; // Render canvas scaled on screen

  const canvasRef = useRef(null);
  const isDraggingRef = useRef(false);
  const dragOffsetRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (editingStyle) {
      setName(editingStyle.name || '');
      setDescription(editingStyle.description || '');
      setEventId(editingStyle.event_id ? String(editingStyle.event_id) : '');
      setIsDefault(Boolean(editingStyle.is_default));
      setBackgroundImageUrl(editingStyle.background_image_url || '');
      setElements(Array.isArray(editingStyle.elements_config) && editingStyle.elements_config.length > 0
        ? editingStyle.elements_config
        : DEFAULT_ELEMENTS
      );
      setSelectedElementId(editingStyle.elements_config?.[0]?.id || 'el_event');
    } else {
      setName('');
      setDescription('');
      setEventId(selectedEvent ? String(selectedEvent.id) : (events[0] ? String(events[0].id) : ''));
      setIsDefault(false);
      setBackgroundImageUrl('');
      setElements(DEFAULT_ELEMENTS);
      setSelectedElementId('el_event');
    }
  }, [editingStyle, isOpen, selectedEvent]);

  // Image Upload Handler
  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload a valid image file (PNG, JPG, WebP)');
      return;
    }

    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      setBackgroundImageUrl(uploadEvent.target.result);
      toast.success('Template background uploaded successfully');
    };
    reader.readAsDataURL(file);
  };

  // Drag Handlers
  const handleMouseDown = (el, e) => {
    e.stopPropagation();
    setSelectedElementId(el.id);
    isDraggingRef.current = true;

    const canvasRect = canvasRef.current.getBoundingClientRect();
    const clickX = (e.clientX - canvasRect.left) / DISPLAY_SCALE;
    const clickY = (e.clientY - canvasRect.top) / DISPLAY_SCALE;

    dragOffsetRef.current = {
      x: clickX - el.x,
      y: clickY - el.y
    };
  };

  const handleMouseMove = (e) => {
    if (!isDraggingRef.current || !selectedElementId) return;

    const canvasRect = canvasRef.current.getBoundingClientRect();
    const currentX = (e.clientX - canvasRect.left) / DISPLAY_SCALE;
    const currentY = (e.clientY - canvasRect.top) / DISPLAY_SCALE;

    const newX = Math.round(Math.max(0, Math.min(CANVAS_W - 50, currentX - dragOffsetRef.current.x)));
    const newY = Math.round(Math.max(0, Math.min(CANVAS_H - 30, currentY - dragOffsetRef.current.y)));

    setElements(prev =>
      prev.map(el => (el.id === selectedElementId ? { ...el, x: newX, y: newY } : el))
    );
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  // Element Property Updates
  const updateSelectedElement = (prop, value) => {
    if (!selectedElementId) return;
    setElements(prev =>
      prev.map(el => (el.id === selectedElementId ? { ...el, [prop]: value } : el))
    );
  };

  const addCustomText = () => {
    const newId = 'el_' + Date.now();
    const newEl = {
      id: newId,
      type: 'text',
      field: 'custom',
      label: 'Custom Text',
      text: 'Custom Notice / Entry Rule',
      x: 100,
      y: 700,
      width: 600,
      height: 35,
      fontSize: 18,
      fontColor: '#FFFFFF',
      textAlign: 'center',
      isVisible: true
    };
    setElements(prev => [...prev, newEl]);
    setSelectedElementId(newId);
    toast.success('Added new text field');
  };

  const removeElement = (id) => {
    setElements(prev => prev.filter(el => el.id !== id));
    if (selectedElementId === id) setSelectedElementId(null);
  };

  // Submit Handler
  const handleSave = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.warning('Please enter a Pass Style name');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: name.trim(),
        description: description.trim(),
        eventId: eventId ? parseInt(eventId, 10) : null,
        backgroundImageUrl: backgroundImageUrl || null,
        canvasWidth: CANVAS_W,
        canvasHeight: CANVAS_H,
        elementsConfig: elements,
        isDefault
      };

      if (editingStyle) {
        const res = await api.put(`/pass-styles/${editingStyle.id}`, payload);
        if (res.success) {
          toast.success('Pass Style updated successfully');
          onSaved();
          onClose();
        }
      } else {
        const res = await api.post('/pass-styles', payload);
        if (res.success) {
          toast.success('New Pass Style created successfully');
          onSaved();
          onClose();
        }
      }
    } catch (err) {
      toast.error(err.message || 'Failed to save pass style');
    } finally {
      setSaving(false);
    }
  };

  const selectedEl = elements.find(el => el.id === selectedElementId);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingStyle ? `Edit Pass Style — ${editingStyle.name}` : '🎨 Visual Pass Designer & Style Builder'}
      maxWidth="1200px"
    >
      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Style Meta Header */}
        <div style={{ display: 'grid', gridTemplateColumns: isSuperAdmin ? '1.5fr 1fr 1fr' : '2fr 1fr', gap: '14px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, marginBottom: '4px' }}>
              Pass Style Name *
            </label>
            <input
              type="text"
              placeholder="e.g. VIP Holographic Pass, Standard Badge"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              style={{ width: '100%' }}
            />
          </div>

          {isSuperAdmin && (
            <div>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, marginBottom: '4px' }}>
                Assigned Event Context
              </label>
              <select value={eventId} onChange={(e) => setEventId(e.target.value)} style={{ width: '100%' }}>
                <option value="">🌐 Global (All Events Template)</option>
                {events.map(ev => (
                  <option key={ev.id} value={ev.id}>{ev.event_name}</option>
                ))}
              </select>
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingTop: '22px' }}>
            <input
              type="checkbox"
              id="isDefaultCheckbox"
              checked={isDefault}
              onChange={(e) => setIsDefault(e.target.checked)}
              style={{ width: '16px', height: '16px' }}
            />
            <label htmlFor="isDefaultCheckbox" style={{ fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
              Set as Default Style for Event
            </label>
          </div>
        </div>

        {/* Main Designer Studio */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '20px', minHeight: '580px' }}>
          {/* Left Canvas Panel */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#090D16',
            borderRadius: '12px',
            border: '1px solid var(--border-color)',
            padding: '24px',
            overflow: 'hidden'
          }}>
            <div style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '12px', width: '100%', justifyContent: 'space-between' }}>
              <div style={{ fontSize: '12px', color: '#94A3B8' }}>
                🖱️ <strong>Drag & Drop</strong> any element on the pass to position it freely.
              </div>
              <label className="btn btn-secondary btn-sm" style={{ cursor: 'pointer' }}>
                <Upload size={14} />
                <span>Upload Background</span>
                <input type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} />
              </label>
            </div>

            {/* Scaled Canvas */}
            <div
              ref={canvasRef}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              style={{
                width: `${CANVAS_W * DISPLAY_SCALE}px`,
                height: `${CANVAS_H * DISPLAY_SCALE}px`,
                position: 'relative',
                borderRadius: '8px',
                overflow: 'hidden',
                boxShadow: '0 20px 40px rgba(0,0,0,0.6)',
                backgroundImage: backgroundImageUrl ? `url(${backgroundImageUrl})` : 'linear-gradient(135deg, #0F172A 0%, #1E293B 50%, #090D16 100%)',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                userSelect: 'none',
                border: '2px solid rgba(59, 130, 246, 0.4)'
              }}
            >
              {elements.map(el => {
                if (el.isVisible === false) return null;
                const isSelected = selectedElementId === el.id;

                const posX = el.x * DISPLAY_SCALE;
                const posY = el.y * DISPLAY_SCALE;
                const width = el.width * DISPLAY_SCALE;
                const height = el.height * DISPLAY_SCALE;
                const fontSize = (el.fontSize || 18) * DISPLAY_SCALE;

                return (
                  <div
                    key={el.id}
                    onMouseDown={(e) => handleMouseDown(el, e)}
                    style={{
                      position: 'absolute',
                      left: `${posX}px`,
                      top: `${posY}px`,
                      width: `${width}px`,
                      minHeight: `${height}px`,
                      cursor: 'move',
                      border: isSelected ? '2px dashed #38BDF8' : '1px dashed transparent',
                      backgroundColor: isSelected ? 'rgba(56, 189, 248, 0.12)' : 'transparent',
                      padding: '2px 4px',
                      borderRadius: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: el.textAlign === 'left' ? 'flex-start' : (el.textAlign === 'right' ? 'flex-end' : 'center'),
                      transition: 'border 0.15s ease'
                    }}
                  >
                    {el.type === 'barcode' ? (
                      <div style={{
                        width: '100%',
                        height: '100%',
                        backgroundColor: '#FFFFFF',
                        borderRadius: '4px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '6px'
                      }}>
                        <Barcode size={36} color="#000000" />
                        <span style={{ fontSize: '9px', fontWeight: 700, color: '#000000', fontFamily: 'monospace' }}>
                          55KDBD2 (DYNAMIC BARCODE)
                        </span>
                      </div>
                    ) : el.type === 'qrcode' ? (
                      <div style={{
                        width: `${width}px`,
                        height: `${width}px`,
                        backgroundColor: '#FFFFFF',
                        borderRadius: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <QrCode size={40} color="#000000" />
                      </div>
                    ) : (
                      <span style={{
                        fontSize: `${fontSize}px`,
                        color: el.fontColor || '#FFFFFF',
                        fontWeight: el.fontWeight || '700',
                        textAlign: el.textAlign || 'center',
                        width: '100%',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        textShadow: '0 1px 3px rgba(0,0,0,0.8)'
                      }}>
                        {el.text || el.label}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Element Customizer Sidebar */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
            backgroundColor: 'var(--bg-subtle, #F8FAFC)',
            borderRadius: '12px',
            padding: '16px',
            border: '1px solid var(--border-color)',
            maxHeight: '620px',
            overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #CBD5E1', paddingBottom: '10px' }}>
              <div style={{ fontSize: '13.5px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Sliders size={16} />
                <span>Element Properties</span>
              </div>
              <button type="button" onClick={addCustomText} className="btn btn-outline btn-sm">
                <Type size={14} />
                <span>Add Text</span>
              </button>
            </div>

            {selectedEl ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>
                    Element: <strong style={{ color: 'var(--primary-600)' }}>{selectedEl.label}</strong>
                  </label>
                  {selectedEl.type === 'text' && (
                    <input
                      type="text"
                      value={selectedEl.text || ''}
                      onChange={(e) => updateSelectedElement('text', e.target.value)}
                      placeholder="Display Text / Placeholder"
                      style={{ width: '100%', fontSize: '12.5px' }}
                    />
                  )}
                </div>

                {/* Coordinate Inputs */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <div>
                    <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)' }}>X (Left)</label>
                    <input
                      type="number"
                      value={selectedEl.x}
                      onChange={(e) => updateSelectedElement('x', parseInt(e.target.value, 10) || 0)}
                      style={{ width: '100%' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)' }}>Y (Top)</label>
                    <input
                      type="number"
                      value={selectedEl.y}
                      onChange={(e) => updateSelectedElement('y', parseInt(e.target.value, 10) || 0)}
                      style={{ width: '100%' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <div>
                    <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)' }}>Width (px)</label>
                    <input
                      type="number"
                      value={selectedEl.width}
                      onChange={(e) => updateSelectedElement('width', parseInt(e.target.value, 10) || 100)}
                      style={{ width: '100%' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)' }}>Height (px)</label>
                    <input
                      type="number"
                      value={selectedEl.height}
                      onChange={(e) => updateSelectedElement('height', parseInt(e.target.value, 10) || 30)}
                      style={{ width: '100%' }}
                    />
                  </div>
                </div>

                {/* Text Styling Options */}
                {selectedEl.type === 'text' && (
                  <>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                      <div>
                        <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)' }}>Font Size (pt)</label>
                        <input
                          type="number"
                          value={selectedEl.fontSize || 18}
                          onChange={(e) => updateSelectedElement('fontSize', parseInt(e.target.value, 10) || 12)}
                          style={{ width: '100%' }}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)' }}>Color</label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <input
                            type="color"
                            value={selectedEl.fontColor || '#FFFFFF'}
                            onChange={(e) => updateSelectedElement('fontColor', e.target.value)}
                            style={{ width: '36px', height: '36px', padding: 0, cursor: 'pointer' }}
                          />
                          <input
                            type="text"
                            value={selectedEl.fontColor || '#FFFFFF'}
                            onChange={(e) => updateSelectedElement('fontColor', e.target.value)}
                            style={{ width: '100%', fontSize: '12px', fontFamily: 'monospace' }}
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>
                        Alignment
                      </label>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        {['left', 'center', 'right'].map(align => (
                          <button
                            key={align}
                            type="button"
                            onClick={() => updateSelectedElement('textAlign', align)}
                            className={`btn btn-sm ${selectedEl.textAlign === align ? 'btn-primary' : 'btn-outline'}`}
                            style={{ flex: 1, textTransform: 'capitalize', fontSize: '12px' }}
                          >
                            {align}
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {/* Barcode / QR Code Type Selector */}
                {(selectedEl.type === 'barcode' || selectedEl.type === 'qrcode') && (
                  <div>
                    <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>
                      Barcode Format
                    </label>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        type="button"
                        onClick={() => updateSelectedElement('type', 'barcode')}
                        className={`btn btn-sm ${selectedEl.type === 'barcode' ? 'btn-primary' : 'btn-outline'}`}
                        style={{ flex: 1 }}
                      >
                        Code 128
                      </button>
                      <button
                        type="button"
                        onClick={() => updateSelectedElement('type', 'qrcode')}
                        className={`btn btn-sm ${selectedEl.type === 'qrcode' ? 'btn-primary' : 'btn-outline'}`}
                        style={{ flex: 1 }}
                      >
                        QR Code
                      </button>
                    </div>
                  </div>
                )}

                {selectedEl.field === 'custom' && (
                  <button
                    type="button"
                    onClick={() => removeElement(selectedEl.id)}
                    className="btn btn-outline btn-sm"
                    style={{ color: '#EF4444', borderColor: '#FCA5A5', marginTop: '10px' }}
                  >
                    <Trash2 size={14} />
                    <span>Delete Text Field</span>
                  </button>
                )}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '30px 10px', color: 'var(--text-muted)', fontSize: '12.5px' }}>
                Click any element on the pass preview to adjust its position, font size, or color.
              </div>
            )}

            {/* Elements Layer Checklist */}
            <div style={{ marginTop: 'auto', borderTop: '1px solid #CBD5E1', paddingTop: '10px' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, marginBottom: '6px' }}>Layers & Elements:</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {elements.map(el => (
                  <div
                    key={el.id}
                    onClick={() => setSelectedElementId(el.id)}
                    style={{
                      padding: '6px 10px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      backgroundColor: selectedElementId === el.id ? '#EFF6FF' : '#FFFFFF',
                      border: selectedElementId === el.id ? '1px solid #3B82F6' : '1px solid #E2E8F0'
                    }}
                  >
                    <span>{el.label}</span>
                    <span style={{ fontSize: '11px', color: '#64748B' }}>
                      ({el.x}, {el.y})
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px', borderTop: '1px solid var(--border-color)', paddingTop: '14px' }}>
          <button type="button" onClick={onClose} className="btn btn-outline" disabled={saving}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            <Save size={16} />
            <span>{saving ? 'Saving Design...' : editingStyle ? 'Save Changes' : 'Create Pass Style'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
}
