import React, { useState, useEffect } from 'react';
import {
  Printer,
  Play,
  Pause,
  RotateCw,
  XCircle,
  FileCode,
  Plus,
  RefreshCw,
  Download,
  CheckCircle2,
  AlertCircle,
  Sliders,
  Sparkles,
  Zap,
  HelpCircle,
  Copy,
  Check,
  Activity,
  Terminal,
  Eye,
  QrCode,
  Barcode
} from 'lucide-react';
import { api } from '../services/api';
import { useEvent } from '../context/EventContext';
import { useToast } from '../context/ToastContext';
import Badge from '../components/Badge';
import Modal from '../components/Modal';
import ScannableBarcode from '../components/ScannableBarcode';
import { formatDateTimeIST } from '../utils/dateUtil';

export default function PrintBatches() {
  const { events, selectedEvent } = useEvent();
  const [batches, setBatches] = useState([]);
  const [categories, setCategories] = useState([]);
  const [printers, setPrinters] = useState([]);
  const [selectedPrinter, setSelectedPrinter] = useState('TSC TE244');
  const [diagnostics, setDiagnostics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [testingPrinter, setTestingPrinter] = useState(false);
  const [calibrating, setCalibrating] = useState(false);
  const [unpausing, setUnpausing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDiagModal, setShowDiagModal] = useState(false);
  const [activeTsplModalBatchId, setActiveTsplModalBatchId] = useState(null);
  const [tsplPreview, setTsplPreview] = useState('');
  const [lastDispatchedLog, setLastDispatchedLog] = useState(null);
  const [copiedTspl, setCopiedTspl] = useState(false);

  // Form State
  const [targetEventId, setTargetEventId] = useState('');
  const [targetCategoryId, setTargetCategoryId] = useState('');
  const [batchName, setBatchName] = useState('');
  const [quantity, setQuantity] = useState(100);
  const [submitting, setSubmitting] = useState(false);

  const toast = useToast();

  const [printerSettings, setPrinterSettings] = useState(null);
  const [commandLanguage, setCommandLanguage] = useState('TSPL');
  const [barcodePattern, setBarcodePattern] = useState('QR_CODE');
  const [savingSettings, setSavingSettings] = useState(false);

  const fetchSettings = async () => {
    try {
      const res = await api.get('/print/settings');
      if (res.success && res.settings) {
        setPrinterSettings(res.settings);
        setSelectedPrinter(res.settings.printer_name || 'TSC TE244');
        setCommandLanguage(res.settings.command_language || 'TSPL');
        setBarcodePattern(res.settings.barcode_type || 'QR_CODE');
      }
    } catch (e) {
      // Ignore
    }
  };

  const handleUpdatePrinterConfig = async (newPrinterName, newLang = commandLanguage, newPattern = barcodePattern) => {
    setSavingSettings(true);
    try {
      const res = await api.put('/print/settings', {
        printer_name: newPrinterName,
        command_language: newLang,
        barcode_type: newPattern
      });
      if (res.success) {
        setPrinterSettings(res.settings);
        setSelectedPrinter(res.settings.printer_name);
        setCommandLanguage(res.settings.command_language);
        setBarcodePattern(res.settings.barcode_type || newPattern);
        toast.success(`Active configuration saved (${res.settings.printer_name} • ${res.settings.command_language} • ${res.settings.barcode_type})`);
      }
    } catch (err) {
      toast.error('Failed to save printer configuration');
    } finally {
      setSavingSettings(false);
    }
  };

  const fetchBatches = async () => {
    setLoading(true);
    try {
      const url = selectedEvent ? `/print/batches?eventId=${selectedEvent.id}` : '/print/batches';
      const res = await api.get(url);
      if (res.success) {
        setBatches(res.batches);
      }
    } catch (err) {
      toast.error('Failed to load print batches');
    } finally {
      setLoading(false);
    }
  };

  const fetchPrinters = async () => {
    try {
      const res = await api.get('/print/printers');
      if (res.success && res.printers.length > 0) {
        setPrinters(res.printers);
      }
    } catch (e) {
      // Ignore
    }
  };

  const fetchDiagnostics = async (pName = selectedPrinter) => {
    try {
      const res = await api.get(`/print/diagnostics?printerName=${encodeURIComponent(pName)}`);
      if (res.success) {
        setDiagnostics(res.diagnostics);
      }
    } catch (e) {
      // Ignore
    }
  };

  const fetchCategories = async (evId = null) => {
    try {
      const eId = evId || (selectedEvent ? selectedEvent.id : null);
      const url = eId ? `/categories?eventId=${eId}` : '/categories';
      const res = await api.get(url);
      if (res.success) {
        setCategories(res.data);
        if (res.data.length > 0 && !targetCategoryId) {
          setTargetCategoryId(String(res.data[0].id));
        }
      }
    } catch (e) {
      // Ignore
    }
  };

  useEffect(() => {
    fetchSettings();
    fetchBatches();
    fetchCategories();
    fetchPrinters();
    fetchDiagnostics();
  }, [selectedEvent]);

  useEffect(() => {
    if (selectedPrinter) {
      fetchDiagnostics(selectedPrinter);
    }
  }, [selectedPrinter]);

  const [testingBarcode, setTestingBarcode] = useState(false);

  const handleTestBarcode = async () => {
    setTestingBarcode(true);
    try {
      const res = await api.post('/print/test-barcode', {
        printerName: selectedPrinter,
        barcodeValue: '55KDBD2',
        pattern: barcodePattern
      });
      if (res.success) {
        setLastDispatchedLog({
          title: `Physical Label Test (${res.barcodeType}: ${res.barcodeValue})`,
          printer: res.printerName,
          bytesSent: res.bytesSent,
          message: res.message,
          tspl: res.tsplSent,
          diagnostics: res.diagnostics,
          time: new Date().toLocaleTimeString()
        });
        toast.success(res.message);
        fetchDiagnostics(selectedPrinter);
      }
    } catch (err) {
      toast.error(err.message || 'Label test failed');
    } finally {
      setTestingBarcode(false);
    }
  };

  const handleCalibrate = async () => {
    setCalibrating(true);
    try {
      const res = await api.post('/print/calibrate', { printerName: selectedPrinter });
      if (res.success) {
        toast.info(res.message);
        setLastDispatchedLog({
          title: 'Media Gap Calibration (GAP-DETECT)',
          printer: selectedPrinter,
          bytesSent: res.tsplSent.length,
          message: res.message,
          tspl: res.tsplSent,
          diagnostics: res.diagnostics,
          time: new Date().toLocaleTimeString()
        });
        fetchDiagnostics(selectedPrinter);
      }
    } catch (err) {
      toast.error(err.message || 'Calibration failed');
    } finally {
      setCalibrating(false);
    }
  };

  const handleUnpause = async () => {
    setUnpausing(true);
    try {
      const res = await api.post('/print/unpause', { printerName: selectedPrinter });
      if (res.success) {
        toast.success(res.message);
        setLastDispatchedLog({
          title: 'Unpause / Resume Command',
          printer: selectedPrinter,
          bytesSent: res.tsplSent?.length || 0,
          message: res.message,
          tspl: res.tsplSent,
          diagnostics: res.diagnostics,
          time: new Date().toLocaleTimeString()
        });
        fetchDiagnostics(selectedPrinter);
      }
    } catch (err) {
      toast.error(err.message || 'Unpause failed');
    } finally {
      setUnpausing(false);
    }
  };

  const handleReconnect = async () => {
    try {
      const res = await api.post('/print/reconnect', { printerName: selectedPrinter });
      if (res.success) {
        setDiagnostics(res.diagnostics);
        await fetchPrinters();
        toast.success(res.message || `Refreshed hardware status for '${selectedPrinter}'`);
      }
    } catch (err) {
      toast.error('Failed to refresh printer status');
    }
  };

  const handleOpenCreate = () => {
    const defaultEventId = selectedEvent?.id ? String(selectedEvent.id) : (events[0]?.id ? String(events[0].id) : '1');
    setTargetEventId(defaultEventId);
    fetchCategories(defaultEventId);
    setBatchName('');
    setQuantity(100);
    setShowCreateModal(true);
  };

  const handleCreateBatch = async (e) => {
    e.preventDefault();
    if (!targetEventId || !targetCategoryId) {
      toast.warning('Event and Category are required');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post('/print/batches', {
        eventId: parseInt(targetEventId, 10),
        categoryId: parseInt(targetCategoryId, 10),
        name: batchName.trim() || undefined,
        quantity: parseInt(quantity, 10),
        barcodePattern
      });
      if (res.success) {
        toast.success(res.message);
        setShowCreateModal(false);
        fetchBatches();
      }
    } catch (err) {
      toast.error(err.message || 'Failed to create batch');
    } finally {
      setSubmitting(false);
    }
  };

  const handleProcessChunk = async (batchId, chunkSize = 50) => {
    try {
      const res = await api.post(`/print/batches/${batchId}/process`, {
        chunkSize,
        printerName: selectedPrinter
      });
      if (res.success) {
        toast.success(`Printed chunk: ${res.data.printedNow} labels (Total: ${res.data.totalPrinted})`);
        if (res.data.tsplData) {
          setLastDispatchedLog({
            title: `Batch #${batchId} Chunk Print (${res.data.printedNow} labels)`,
            printer: selectedPrinter,
            bytesSent: res.data.tsplData.length,
            message: `Dispatched ${res.data.printedNow} labels to Windows Spooler`,
            tspl: res.data.tsplData,
            time: new Date().toLocaleTimeString()
          });
        }
        fetchBatches();
        fetchDiagnostics(selectedPrinter);
      }
    } catch (err) {
      toast.error(err.message || 'Chunk printing error');
      fetchBatches();
      fetchDiagnostics(selectedPrinter);
    }
  };

  const handleReprintBatch = async (batchId) => {
    if (!window.confirm(`Regenerate brand new unique 7-character pass codes for Batch #${batchId} and reset it for reprinting? (Old pass codes in this batch will be replaced with fresh valid barcodes/QR codes)`)) {
      return;
    }
    try {
      const res = await api.post(`/print/batches/${batchId}/reprint`);
      if (res.success) {
        toast.success(res.message || 'Batch reset with new unique codes ready for reprint');
        fetchBatches();
      }
    } catch (err) {
      toast.error(err.message || 'Reprint failed');
    }
  };

  const handlePauseBatch = async (batchId) => {
    try {
      const res = await api.post(`/print/batches/${batchId}/pause`);
      if (res.success) {
        toast.info(res.message);
        fetchBatches();
      }
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleResumeBatch = async (batchId) => {
    try {
      const res = await api.post(`/print/batches/${batchId}/resume`);
      if (res.success) {
        toast.success(res.message);
        fetchBatches();
      }
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleCancelBatch = async (batchId) => {
    if (!window.confirm('Cancel print batch and release remaining unprinted passes back to queue?')) return;
    try {
      const res = await api.post(`/print/batches/${batchId}/cancel`);
      if (res.success) {
        toast.warning(res.message);
        fetchBatches();
      }
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleInspectTspl = async (batchId) => {
    try {
      const res = await fetch(`http://localhost:5006/api/print/batches/${batchId}/tspl`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('eventgen_access_token')}` }
      });
      const text = await res.text();
      setTsplPreview(text);
      setActiveTsplModalBatchId(batchId);
    } catch (e) {
      toast.error('Failed to load TSPL file');
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedTspl(true);
    setTimeout(() => setCopiedTspl(false), 2000);
    toast.success('Raw TSPL copied to clipboard');
  };

  const selectedCategoryObj = categories.find(c => String(c.id) === String(targetCategoryId)) || categories[0] || { name: 'VIP PASS', code: 'VIP' };
  const currentEventName = selectedEvent ? selectedEvent.event_name : (events[0] ? events[0].event_name : 'Raas Utsav 2026');

  return (
    <div style={{ padding: '24px 32px', maxWidth: '1440px', margin: '0 auto' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800 }}>TSC TE244 Thermal Print Center</h1>
          <p style={{ fontSize: '13.5px', color: 'var(--text-muted)' }}>
            Windows RAW Spooler Queue • 38mm × 50mm 2-Up Stock
            {selectedEvent && <span> for <strong>{selectedEvent.event_name}</strong></span>}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button onClick={() => setShowDiagModal(true)} className="btn btn-secondary" title="Hardware Diagnostics & LED Guide">
            <Activity size={16} color="var(--primary-600)" />
            <span>Printer Diagnostics & LED Guide</span>
          </button>
          <button onClick={handleOpenCreate} className="btn btn-primary">
            <Plus size={16} />
            <span>New Print Batch</span>
          </button>
          <button onClick={() => { fetchBatches(); fetchDiagnostics(); }} className="btn btn-outline btn-icon" title="Refresh">
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {/* Main Hardware Status Bar + Live 38mm x 50mm Label Preview Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px', marginBottom: '20px' }}>
        {/* Left Card: Hardware & Calibration Controls */}
        <div className="card" style={{
          padding: '20px',
          background: 'linear-gradient(135deg, var(--bg-surface), var(--bg-surface-hover))',
          border: '1px solid var(--border-color)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          gap: '16px'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
              <div style={{
                width: '44px',
                height: '44px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: diagnostics?.isOffline ? 'rgba(239, 68, 68, 0.15)' : 'var(--primary-50)',
                color: diagnostics?.isOffline ? 'var(--danger-accent)' : 'var(--primary-600)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <Printer size={22} />
              </div>

              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)' }}>
                  Hardware Spooler Controls
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  {diagnostics?.explanation || 'Pluggable Driver • 38mm × 50mm Thermal Stock'}
                </div>
              </div>

              <Badge variant={
                diagnostics?.isOffline ? 'danger' :
                diagnostics?.isPaused ? 'warning' :
                diagnostics?.hasErrors ? 'danger' : 'success'
              }>
                {diagnostics?.statusLabel || 'READY'} ({diagnostics?.port || 'USB001'})
              </Badge>
            </div>

            {/* Config Selectors */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px', marginTop: '10px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '4px' }}>
                  Active Printer
                </label>
                <select
                  value={selectedPrinter}
                  onChange={(e) => {
                    const val = e.target.value;
                    setSelectedPrinter(val);
                    handleUpdatePrinterConfig(val, commandLanguage, barcodePattern);
                  }}
                  style={{ width: '100%', padding: '6px 8px', fontSize: '12.5px', fontWeight: 700, borderRadius: '6px' }}
                >
                  {printers.map(p => (
                    <option key={p.name} value={p.name}>
                      {p.name} {p.source === 'venue_gateway' ? '🌐 (Venue Gateway)' : `(${p.driver || 'Windows'})`}
                    </option>
                  ))}
                  {!printers.some(p => p.name === 'TSC TE244') && (
                    <option value="TSC TE244">TSC TE244 (Default Seagull Driver)</option>
                  )}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '4px' }}>
                  Language
                </label>
                <select
                  value={commandLanguage}
                  onChange={(e) => {
                    const lang = e.target.value;
                    setCommandLanguage(lang);
                    handleUpdatePrinterConfig(selectedPrinter, lang, barcodePattern);
                  }}
                  style={{ width: '100%', padding: '6px 8px', fontSize: '12.5px', fontWeight: 700, borderRadius: '6px' }}
                  title="Select Command Language (TSPL, ZPL, ESC/POS)"
                >
                  <option value="TSPL">TSPL (TSC / Gprinter)</option>
                  <option value="ZPL">ZPL (Zebra / Citizen)</option>
                  <option value="ESCPOS">ESC/POS (Epson / POS)</option>
                  <option value="GENERIC_TEXT">Generic Text (Spooler)</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '4px' }}>
                  Barcode Pattern
                </label>
                <select
                  value={barcodePattern}
                  onChange={(e) => {
                    const pat = e.target.value;
                    setBarcodePattern(pat);
                    handleUpdatePrinterConfig(selectedPrinter, commandLanguage, pat);
                  }}
                  style={{ width: '100%', padding: '6px 8px', fontSize: '12.5px', fontWeight: 700, borderRadius: '6px' }}
                  title="Select Default Barcode Pattern (QR Code, Code 128, Code 39)"
                >
                  <option value="QR_CODE">QR Code (2D)</option>
                  <option value="CODE128">Code 128 (1D)</option>
                  <option value="CODE39">Code 39 (1D)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap', paddingTop: '10px', borderTop: '1px solid var(--border-color)' }}>
            <button
              onClick={handleReconnect}
              className="btn btn-outline btn-sm"
              title="Refresh installed printers and probe hardware status"
            >
              <RotateCw size={13} />
              <span>Refresh Status</span>
            </button>

            <button
              onClick={handleCalibrate}
              disabled={calibrating}
              className="btn btn-outline btn-sm"
              title="Calibrate label gap sensor on printer (GAP-DETECT)"
            >
              <Sliders size={13} />
              <span>{calibrating ? 'Calibrating...' : 'Calibrate Gap'}</span>
            </button>

            <button
              onClick={handleUnpause}
              disabled={unpausing}
              className="btn btn-outline btn-sm"
              title="Clear Pause State / Stop Blinking Blue LED"
            >
              <Play size={13} />
              <span>{unpausing ? 'Sending...' : 'Unpause'}</span>
            </button>

            <button
              onClick={handleTestBarcode}
              disabled={testingBarcode}
              className="btn btn-primary btn-sm"
              style={{ fontWeight: 800, marginLeft: 'auto' }}
              title="Print 1 actual physical test barcode label using active driver language"
            >
              <Zap size={14} />
              <span>{testingBarcode ? 'Printing...' : `Print 1 Test (${barcodePattern.replace('_CODE', '')})`}</span>
            </button>
          </div>

          {diagnostics?.isOffline && (
            <div style={{
              padding: '10px 14px',
              backgroundColor: 'rgba(239, 68, 68, 0.08)',
              border: '1px solid rgba(239, 68, 68, 0.25)',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px'
            }}>
              <div style={{ fontSize: '12.5px', color: '#ef4444', fontWeight: 600 }}>
                ⚠️ Printer &apos;{selectedPrinter}&apos; is Offline. Ensure USB cable is plugged in and power switch is ON.
              </div>
              <button onClick={handleReconnect} className="btn btn-outline btn-sm" style={{ borderColor: '#ef4444', color: '#ef4444' }}>
                <RotateCw size={13} />
                <span>Retry</span>
              </button>
            </div>
          )}
        </div>

        {/* Right Card: Live 38mm x 50mm Thermal Sticker Preview Panel */}
        <div className="card" style={{
          padding: '20px',
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Eye size={16} color="var(--primary-600)" />
              <span style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-primary)' }}>
                Live Thermal Sticker Preview
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ display: 'flex', gap: '3px', backgroundColor: 'var(--bg-body)', padding: '2px', borderRadius: '6px' }}>
                <button
                  type="button"
                  onClick={() => setBarcodePattern('QR_CODE')}
                  style={{
                    padding: '3px 8px',
                    fontSize: '10.5px',
                    fontWeight: 700,
                    borderRadius: '4px',
                    border: 'none',
                    backgroundColor: barcodePattern === 'QR_CODE' ? 'var(--primary-600)' : 'transparent',
                    color: barcodePattern === 'QR_CODE' ? '#ffffff' : 'var(--text-muted)',
                    cursor: 'pointer'
                  }}
                >
                  QR Code
                </button>
                <button
                  type="button"
                  onClick={() => setBarcodePattern('CODE128')}
                  style={{
                    padding: '3px 8px',
                    fontSize: '10.5px',
                    fontWeight: 700,
                    borderRadius: '4px',
                    border: 'none',
                    backgroundColor: barcodePattern === 'CODE128' ? 'var(--primary-600)' : 'transparent',
                    color: barcodePattern === 'CODE128' ? '#ffffff' : 'var(--text-muted)',
                    cursor: 'pointer'
                  }}
                >
                  Code 128
                </button>
                <button
                  type="button"
                  onClick={() => setBarcodePattern('CODE39')}
                  style={{
                    padding: '3px 8px',
                    fontSize: '10.5px',
                    fontWeight: 700,
                    borderRadius: '4px',
                    border: 'none',
                    backgroundColor: barcodePattern === 'CODE39' ? 'var(--primary-600)' : 'transparent',
                    color: barcodePattern === 'CODE39' ? '#ffffff' : 'var(--text-muted)',
                    cursor: 'pointer'
                  }}
                >
                  Code 39
                </button>
              </div>

              <span className="badge badge-primary" style={{ fontSize: '10px' }}>
                38mm × 50mm Stock
              </span>
            </div>
          </div>

          {/* The Physical 38mm x 50mm Thermal Sticker Render */}
          <div style={{
            width: '190px',
            height: '250px',
            backgroundColor: '#ffffff',
            borderRadius: '6px',
            border: '2px solid #0f172a',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)',
            padding: '12px 10px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            color: '#0f172a',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            boxSizing: 'border-box'
          }}>
            {/* Scannable Barcode / QR Stream & Pass Code */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
              <ScannableBarcode
                value="55KDBD2"
                type={barcodePattern}
                size="lg"
                showText={false}
                style={{ padding: '0px', border: 'none', boxShadow: 'none' }}
              />

              <div style={{
                fontFamily: 'var(--font-mono, monospace)',
                fontSize: '13.5px',
                fontWeight: 900,
                letterSpacing: '1.5px',
                color: '#0f172a',
                marginTop: '10px',
                textAlign: 'center'
              }}>
                PASS CODE: 55KDBD2
              </div>
            </div>
          </div>

          <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '8px', textAlign: 'center' }}>
            Exact 38mm × 50mm layout rendered by the TSPL/ZPL command stream.
          </div>
        </div>
      </div>

      {/* Live Dispatched RAW TSPL Inspector Card (If recent print executed) */}
      {lastDispatchedLog && (
        <div className="card" style={{
          marginBottom: '20px',
          padding: '16px 20px',
          borderLeft: '4px solid var(--primary-600)',
          backgroundColor: 'var(--bg-card)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Terminal size={18} color="var(--primary-600)" />
              <span style={{ fontWeight: 800, fontSize: '14px' }}>Latest Dispatched RAW TSPL Stream: {lastDispatchedLog.title}</span>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>({lastDispatchedLog.time} • {lastDispatchedLog.bytesSent} bytes)</span>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => copyToClipboard(lastDispatchedLog.tspl)} className="btn btn-outline btn-sm">
                {copiedTspl ? <Check size={13} color="var(--success-accent)" /> : <Copy size={13} />}
                <span>{copiedTspl ? 'Copied' : 'Copy TSPL'}</span>
              </button>
              <button onClick={() => setLastDispatchedLog(null)} className="btn btn-outline btn-sm">
                Dismiss
              </button>
            </div>
          </div>

          <pre style={{
            margin: 0,
            padding: '12px 14px',
            backgroundColor: 'var(--bg-app)',
            borderRadius: 'var(--radius-sm)',
            fontSize: '11.5px',
            fontFamily: 'var(--font-mono)',
            maxHeight: '140px',
            overflowY: 'auto',
            color: 'var(--text-primary)',
            border: '1px solid var(--border-color)'
          }}>
            {lastDispatchedLog.tspl}
          </pre>
        </div>
      )}

      {/* Batches Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th>Batch Name</th>
                <th>Event & Category</th>
                <th>Pattern</th>
                <th>Progress</th>
                <th>Status</th>
                <th>Created At</th>
                <th style={{ textAlign: 'right' }}>Printer Controls</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                    Loading print batches...
                  </td>
                </tr>
              ) : batches.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                    No print batches created for this event. Click &quot;New Print Batch&quot; to allocate passes.
                  </td>
                </tr>
              ) : (
                batches.map((batch) => {
                  const progressPct = batch.total_requested > 0 ? Math.round((batch.printed_count / batch.total_requested) * 100) : 0;
                  const isOutOfStock = batch.status === 'paused_out_of_stock';
                  const patternLabel = (batch.barcode_pattern || 'QR_CODE').replace('_CODE', '');

                  return (
                    <tr key={batch.id}>
                      <td>
                        <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-primary)' }}>
                          {batch.name}
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                          Batch ID #{batch.id} • Created by {batch.created_by_name || 'Admin'}
                        </div>
                      </td>

                      <td>
                        <div style={{ fontWeight: 600 }}>{batch.category_name || batch.pass_type}</div>
                        <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>{batch.event_name || 'Event 2026'}</div>
                      </td>

                      <td>
                        <span className="badge badge-neutral" style={{ fontSize: '11px', fontWeight: 700 }}>
                          {patternLabel}
                        </span>
                      </td>

                      <td style={{ minWidth: '160px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>
                          <span>{batch.printed_count} / {batch.total_requested}</span>
                          <span>{progressPct}%</span>
                        </div>
                        <div style={{ width: '100%', height: '6px', backgroundColor: 'var(--border-color)', borderRadius: '3px', overflow: 'hidden' }}>
                          <div style={{ width: `${progressPct}%`, height: '100%', backgroundColor: 'var(--primary-600)', transition: 'width 0.3s ease' }} />
                        </div>
                      </td>

                      <td>
                        <Badge variant={
                          batch.status === 'completed' ? 'success' :
                          batch.status === 'printing' ? 'info' :
                          isOutOfStock ? 'danger' :
                          batch.status === 'paused' ? 'warning' :
                          batch.status === 'cancelled' ? 'danger' : 'neutral'
                        }>
                          {isOutOfStock ? 'PAUSED (OUT OF STOCK)' : batch.status.toUpperCase()}
                        </Badge>
                      </td>

                      <td>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                          {formatDateTimeIST(batch.created_at)}
                        </div>
                      </td>

                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '6px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                          {batch.status !== 'completed' && batch.status !== 'cancelled' && (
                            <>
                              <button
                                onClick={() => handleProcessChunk(batch.id, 50)}
                                className="btn btn-primary btn-sm"
                                title="Send next 50 labels directly to TSC TE244 printer"
                              >
                                <Play size={13} />
                                <span>Print 50</span>
                              </button>

                              {batch.status === 'printing' ? (
                                <button
                                  onClick={() => handlePauseBatch(batch.id)}
                                  className="btn btn-secondary btn-sm btn-icon"
                                  title="Pause (For roll change)"
                                >
                                  <Pause size={13} />
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleResumeBatch(batch.id)}
                                  className="btn btn-secondary btn-sm"
                                  title="Resume Printing (Continues from next unprinted pass)"
                                >
                                  <RotateCw size={13} />
                                  <span>Resume</span>
                                </button>
                              )}
                            </>
                          )}

                          <button
                            onClick={() => handleReprintBatch(batch.id)}
                            className="btn btn-secondary btn-sm"
                            title="Regenerate brand new unique 7-character pass codes & reset for reprinting"
                            style={{ gap: '4px' }}
                          >
                            <RefreshCw size={13} />
                            <span>Reprint (New Codes)</span>
                          </button>

                          <button
                            onClick={() => handleInspectTspl(batch.id)}
                            className="btn btn-outline btn-sm btn-icon"
                            title="Inspect Generated TSPL"
                          >
                            <FileCode size={14} />
                          </button>

                          {batch.status !== 'completed' && batch.status !== 'cancelled' && (
                            <button
                              onClick={() => handleCancelBatch(batch.id)}
                              className="btn btn-outline btn-sm btn-icon"
                              title="Cancel Batch"
                              style={{ color: 'var(--danger-accent)' }}
                            >
                              <XCircle size={14} />
                            </button>
                          )}
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

      {/* Diagnostics & LED Troubleshooting Modal */}
      {showDiagModal && (
        <Modal
          isOpen={true}
          onClose={() => setShowDiagModal(false)}
          title="TSC TE244 Hardware Diagnostics & LED Guide"
          maxWidth="750px"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{
              backgroundColor: 'var(--bg-app)',
              padding: '16px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-color)'
            }}>
              <div style={{ fontWeight: 800, fontSize: '14px', marginBottom: '10px' }}>
                Windows Print Spooler Connection Status
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', fontSize: '13px' }}>
                <div><strong>Printer Name:</strong> {diagnostics?.name || selectedPrinter}</div>
                <div><strong>Port:</strong> {diagnostics?.port || 'USB001'}</div>
                <div><strong>Driver:</strong> {diagnostics?.driver || 'TSC TE244 (Seagull)'}</div>
                <div><strong>Spooler Status:</strong> {diagnostics?.statusLabel || 'Idle / Ready'}</div>
                <div><strong>Queued Jobs:</strong> {diagnostics?.activeJobCount || 0}</div>
                <div><strong>Error State:</strong> {diagnostics?.detectedErrorState || 0}</div>
              </div>
            </div>

            <div style={{
              backgroundColor: 'rgba(59, 130, 246, 0.08)',
              padding: '16px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid rgba(59, 130, 246, 0.25)'
            }}>
              <div style={{ fontWeight: 800, fontSize: '14px', color: 'var(--primary-600)', marginBottom: '10px' }}>
                TSC TE244 LED Indicator Diagnostic Guide
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px' }}>
                <div>
                  <strong>🔵 / 🟢 Blinking Blue or Green:</strong> The printer is in <strong>Pause Mode</strong> or the <strong>Gap Sensor is not calibrated</strong>. Click <em>&quot;Calibrate Gap&quot;</em> above, or press the physical <strong>FEED</strong> button once to clear pause mode.
                </div>
                <div>
                  <strong>🔴 Blinking Red:</strong> Out of labels/stock, thermal transfer ribbon ended, or top cover is open.
                </div>
                <div>
                  <strong>🟢 Solid Green:</strong> Printer is calibrated, ready, and standing by for print jobs.
                </div>
              </div>
            </div>

            <div style={{
              backgroundColor: 'var(--bg-card)',
              padding: '14px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-color)',
              fontSize: '12.5px'
            }}>
              <strong>Manual Hardware Gap Sensor Calibration Sequence:</strong>
              <ol style={{ margin: '6px 0 0 18px', padding: 0, lineHeight: 1.6 }}>
                <li>Turn off the printer power switch.</li>
                <li>Press and hold the physical <strong>FEED</strong> button on top of the printer.</li>
                <li>Turn power back ON while holding the FEED button.</li>
                <li>Release the button when the LED blinks <strong>Red</strong>. The printer will feed labels and calibrate the sensor automatically.</li>
              </ol>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button onClick={() => setShowDiagModal(false)} className="btn btn-primary">
                Done
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Create Batch Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create New Print Batch"
        maxWidth="500px"
      >
        <form onSubmit={handleCreateBatch} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>Target Event *</label>
            <select
              value={targetEventId}
              onChange={(e) => {
                setTargetEventId(e.target.value);
                fetchCategories(e.target.value);
              }}
              style={{ width: '100%' }}
              required
            >
              {events.map(ev => (
                <option key={ev.id} value={ev.id}>{ev.event_name} ({ev.event_code})</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>Pass Category *</label>
            <select
              value={targetCategoryId}
              onChange={(e) => setTargetCategoryId(e.target.value)}
              style={{ width: '100%' }}
              required
            >
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name} ({c.code})</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>Barcode Pattern / Symbology *</label>
            <select
              value={barcodePattern}
              onChange={(e) => setBarcodePattern(e.target.value)}
              style={{ width: '100%' }}
              required
            >
              <option value="QR_CODE">QR Code (2D High-Speed Matrix)</option>
              <option value="CODE128">Code 128 (1D High-Density Barcode)</option>
              <option value="CODE39">Code 39 (1D Standard Barcode)</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>Batch Name (Optional)</label>
            <input
              type="text"
              placeholder="e.g. VIP Front Entrance Roll #1"
              value={batchName}
              onChange={(e) => setBatchName(e.target.value)}
              style={{ width: '100%' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>Number of Passes to Allocate *</label>
            <input
              type="number"
              min={1}
              max={5000}
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              style={{ width: '100%' }}
              required
            />
            <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '4px' }}>
              Note: If existing inventory is empty, unique 7-character passes will be auto-generated.
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
            <button type="button" onClick={() => setShowCreateModal(false)} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={submitting} className="btn btn-primary">
              {submitting ? 'Creating Batch...' : 'Create Batch'}
            </button>
          </div>
        </form>
      </Modal>

      {/* TSPL Preview Modal */}
      {activeTsplModalBatchId && (
        <Modal
          isOpen={true}
          onClose={() => setActiveTsplModalBatchId(null)}
          title={`TSPL Commands Preview — Batch #${activeTsplModalBatchId}`}
          maxWidth="700px"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
              Dual-column 38mm × 50mm TSPL instructions with 7-digit pass codes ready for TSC TE244 printer:
            </div>

            <pre style={{
              backgroundColor: 'var(--bg-app)',
              padding: '16px',
              borderRadius: 'var(--radius-md)',
              fontSize: '12px',
              fontFamily: 'var(--font-mono)',
              maxHeight: '300px',
              overflowY: 'auto',
              border: '1px solid var(--border-color)',
              color: 'var(--text-primary)'
            }}>
              {tsplPreview}
            </pre>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button onClick={() => copyToClipboard(tsplPreview)} className="btn btn-secondary">
                <Copy size={14} />
                <span>Copy TSPL</span>
              </button>
              <a
                href={`http://localhost:5006/api/print/batches/${activeTsplModalBatchId}/tspl`}
                download
                className="btn btn-primary"
              >
                <Download size={14} />
                <span>Download .TSPL Script</span>
              </a>
              <button onClick={() => setActiveTsplModalBatchId(null)} className="btn btn-secondary">
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
