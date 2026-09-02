import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Server, Database, Printer, Shield, Globe, Cpu, Edit3, Check, Save, Sliders } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { useToast } from '../context/ToastContext';
import { api } from '../services/api';

export default function Settings() {
  const { user } = useAuth();
  const { platformName, updatePlatformName } = useSettings();
  const [nameInput, setNameInput] = useState(platformName);
  const [savingName, setSavingName] = useState(false);

  // Printer & Sticker Configuration State
  const [printerSettings, setPrinterSettings] = useState(null);
  const [stockWidth, setStockWidth] = useState(38);
  const [stockHeight, setStockHeight] = useState(50);
  const [barcodeType, setBarcodeType] = useState('QR_CODE');
  const [gapMm, setGapMm] = useState(3);
  const [speed, setSpeed] = useState(4);
  const [density, setDensity] = useState(8);
  const [savingPrinter, setSavingPrinter] = useState(false);

  const toast = useToast();
  const isSuperAdmin = user?.role === 'SUPERADMIN';

  useEffect(() => {
    setNameInput(platformName);
  }, [platformName]);

  useEffect(() => {
    async function loadPrinterSettings() {
      try {
        const res = await api.get('/print/settings');
        if (res.success && res.settings) {
          setPrinterSettings(res.settings);
          setStockWidth(res.settings.stock_width_mm || 38);
          setStockHeight(res.settings.stock_height_mm || 50);
          setBarcodeType(res.settings.barcode_type || 'QR_CODE');
          setGapMm(res.settings.gap_mm || 3);
          setSpeed(res.settings.speed || 4);
          setDensity(res.settings.density || 8);
        }
      } catch (err) {
        // Ignore
      }
    }
    loadPrinterSettings();
  }, []);

  const handleSavePlatformName = async (e) => {
    e.preventDefault();
    if (!nameInput.trim()) {
      toast.warning('Platform name cannot be empty');
      return;
    }

    setSavingName(true);
    try {
      await updatePlatformName(nameInput);
      toast.success('Platform name updated across the system!');
    } catch (err) {
      toast.error(err.message || 'Failed to update platform name');
    } finally {
      setSavingName(false);
    }
  };

  const handleSavePrinterSettings = async (e) => {
    e.preventDefault();
    setSavingPrinter(true);
    try {
      const res = await api.put('/print/settings', {
        stock_width_mm: parseFloat(stockWidth),
        stock_height_mm: parseFloat(stockHeight),
        barcode_type: barcodeType,
        gap_mm: parseFloat(gapMm),
        speed: parseInt(speed, 10),
        density: parseInt(density, 10)
      });
      if (res.success) {
        setPrinterSettings(res.settings);
        toast.success(`Sticker template updated: ${stockWidth}mm × ${stockHeight}mm (${barcodeType})`);
      }
    } catch (err) {
      toast.error(err.message || 'Failed to update printer settings');
    } finally {
      setSavingPrinter(false);
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">{platformName} System Settings</h1>
          <p className="page-subtitle">Server status, port 5006 configuration, thermal sticker stock dimensions, and platform branding</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px' }}>
        
        {/* Platform Branding & Identity (Editable by SuperAdmin) */}
        <div className="card">
          <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Globe size={18} color="var(--primary-600)" />
            Platform Brand & System Name
          </h3>

          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px' }}>
            Configure the application brand name displayed across the web dashboard, sidebar, mobile scanner, and print applications.
          </p>

          {isSuperAdmin ? (
            <form onSubmit={handleSavePlatformName} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, marginBottom: '6px', color: 'var(--text-primary)' }}>
                  Platform Name:
                </label>
                <input
                  type="text"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  placeholder="e.g. EventGen"
                  style={{ width: '100%', fontSize: '14px', fontWeight: 700 }}
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  type="submit"
                  disabled={savingName || nameInput === platformName}
                  className="btn btn-primary btn-sm"
                  style={{ gap: '6px' }}
                >
                  <Save size={14} />
                  <span>{savingName ? 'Saving...' : 'Save Platform Name'}</span>
                </button>
              </div>
            </form>
          ) : (
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderTop: '1px solid var(--border-color)' }}>
              <span style={{ color: 'var(--text-muted)' }}>Current Platform Name</span>
              <strong style={{ color: 'var(--primary-600)', fontSize: '15px' }}>{platformName}</strong>
            </div>
          )}
        </div>

        {/* Thermal Printer & Sticker Dimensions Configuration (Editable by SuperAdmin) */}
        <div className="card">
          <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Printer size={18} color="var(--primary-600)" />
            Thermal Sticker Dimensions & Barcode Pattern
          </h3>

          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px' }}>
            Configure the physical label roll stock size and default barcode symbology generated for all print runs.
          </p>

          {isSuperAdmin ? (
            <form onSubmit={handleSavePrinterSettings} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>
                    Sticker Width (mm) *
                  </label>
                  <input
                    type="number"
                    min={10}
                    max={120}
                    step="1"
                    value={stockWidth}
                    onChange={(e) => setStockWidth(e.target.value)}
                    style={{ width: '100%', fontSize: '13.5px', fontWeight: 700 }}
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>
                    Sticker Height (mm) *
                  </label>
                  <input
                    type="number"
                    min={10}
                    max={150}
                    step="1"
                    value={stockHeight}
                    onChange={(e) => setStockHeight(e.target.value)}
                    style={{ width: '100%', fontSize: '13.5px', fontWeight: 700 }}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>
                    Default Symbology *
                  </label>
                  <select
                    value={barcodeType}
                    onChange={(e) => setBarcodeType(e.target.value)}
                    style={{ width: '100%', fontSize: '13px', fontWeight: 700 }}
                  >
                    <option value="QR_CODE">QR Code (2D)</option>
                    <option value="CODE128">Code 128 (1D)</option>
                    <option value="CODE39">Code 39 (1D)</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>
                    Label Gap (mm)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={10}
                    step="0.5"
                    value={gapMm}
                    onChange={(e) => setGapMm(e.target.value)}
                    style={{ width: '100%', fontSize: '13.5px', fontWeight: 700 }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '4px' }}>
                <button
                  type="submit"
                  disabled={savingPrinter}
                  className="btn btn-primary btn-sm"
                  style={{ gap: '6px' }}
                >
                  <Save size={14} />
                  <span>{savingPrinter ? 'Saving...' : 'Save Sticker Template'}</span>
                </button>
              </div>
            </form>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13.5px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border-color)' }}>
                <span style={{ color: 'var(--text-muted)' }}>Sticker Sizing</span>
                <strong>{stockWidth}mm × {stockHeight}mm</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0' }}>
                <span style={{ color: 'var(--text-muted)' }}>Default Symbology</span>
                <strong>{barcodeType}</strong>
              </div>
            </div>
          )}
        </div>

        {/* Backend & Domain Info */}
        <div className="card">
          <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Server size={18} color="var(--primary-600)" />
            Server & Network Routing
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13.5px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-color)' }}>
              <span style={{ color: 'var(--text-muted)' }}>Backend Port</span>
              <strong>Port 5006 (http://127.0.0.1:5006)</strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-color)' }}>
              <span style={{ color: 'var(--text-muted)' }}>Production Domain</span>
              <strong style={{ color: 'var(--primary-600)' }}>https://eventgen.duckdns.org</strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-color)' }}>
              <span style={{ color: 'var(--text-muted)' }}>Nginx API Proxy</span>
              <code>/api → http://127.0.0.1:5006</code>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
              <span style={{ color: 'var(--text-muted)' }}>PM2 Process Name</span>
              <code>eventgen-backend</code>
            </div>
          </div>
        </div>

        {/* Database & Concurrency */}
        <div className="card">
          <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Database size={18} color="var(--primary-600)" />
            Database & Concurrency Protection
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13.5px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-color)' }}>
              <span style={{ color: 'var(--text-muted)' }}>Database Engine</span>
              <strong>MySQL 8.0 (eventgen_db)</strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-color)' }}>
              <span style={{ color: 'var(--text-muted)' }}>Concurrency Locking</span>
              <span className="badge badge-active">Distributed Mutex / Row Lock</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-color)' }}>
              <span style={{ color: 'var(--text-muted)' }}>Pass Cryptography</span>
              <strong>HMAC-SHA256 Signatures</strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
              <span style={{ color: 'var(--text-muted)' }}>Daily Unlock Boundary</span>
              <strong>1:00 AM (Server-Side Clock)</strong>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
