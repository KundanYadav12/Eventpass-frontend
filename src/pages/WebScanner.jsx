import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  QrCode,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Volume2,
  VolumeX,
  Camera,
  RefreshCw,
  Sliders,
  ChevronRight,
  Sparkles,
  Sun,
  Moon,
  ArrowLeft,
  Building2,
  Tag,
  Zap
} from 'lucide-react';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';
import { useTheme } from '../context/ThemeContext';

export default function WebScanner() {
  const [code, setCode] = useState('');
  const [deviceId, setDeviceId] = useState('GATE-01');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [loading, setLoading] = useState(false);
  const [lastResult, setLastResult] = useState(null);
  const [recentScans, setRecentScans] = useState([]);
  const [showResultOverlay, setShowResultOverlay] = useState(false);

  const inputRef = useRef(null);
  const scanLockRef = useRef(false);
  const toast = useToast();
  const navigate = useNavigate();
  const { isDark, toggleTheme } = useTheme();

  // Audio Synthesizer for instant feedback sounds (Web Audio API)
  const playSound = (type) => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();

      if (type === 'approved') {
        // High pleasant ascending dual-tone chime
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();

        osc1.type = 'sine';
        osc2.type = 'triangle';

        osc1.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
        osc1.frequency.setValueAtTime(880, ctx.currentTime + 0.1); // A5

        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(ctx.destination);

        osc1.start();
        osc1.stop(ctx.currentTime + 0.35);
      } else {
        // Low descending buzz tone for Denied
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(220, ctx.currentTime); // A3
        osc.frequency.setValueAtTime(130, ctx.currentTime + 0.15);

        gain.gain.setValueAtTime(0.4, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start();
        osc.stop(ctx.currentTime + 0.4);
      }
    } catch (e) {
      console.warn('Audio playback error:', e);
    }
  };

  const handleScanSubmit = async (e, forcedCode = null) => {
    if (e) e.preventDefault();
    if (scanLockRef.current) return;

    const cleanCode = (forcedCode || code).trim().toUpperCase();
    if (!cleanCode) return;

    scanLockRef.current = true;
    setLoading(true);

    try {
      const res = await api.post('/scan', {
        code: cleanCode,
        deviceId
      });

      setLastResult(res);
      setShowResultOverlay(true);
      playSound(res.result === 'approved' ? 'approved' : 'denied');

      setRecentScans(prev => [
        {
          id: Date.now(),
          code: cleanCode,
          result: res.result,
          message: res.message,
          eventName: res.event?.name,
          categoryName: res.category?.name,
          time: new Date().toLocaleTimeString()
        },
        ...prev.slice(0, 14)
      ]);

      setCode('');
    } catch (err) {
      playSound('denied');
      const errorResult = {
        success: false,
        result: 'error',
        message: err.message || 'Scan communication error'
      };
      setLastResult(errorResult);
      setShowResultOverlay(true);
    } finally {
      setLoading(false);
      setTimeout(() => {
        scanLockRef.current = false;
        if (inputRef.current) inputRef.current.focus();
      }, 400);
    }
  };

  const dismissOverlay = () => {
    setShowResultOverlay(false);
    if (inputRef.current) inputRef.current.focus();
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: 'var(--bg-app)',
      padding: '24px 16px',
      position: 'relative'
    }}>
      {/* Full-Screen Scan Result Overlay Popup (Requirement #19, #20, #21) */}
      {showResultOverlay && lastResult && (
        <div
          onClick={dismissOverlay}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 999,
            backgroundColor: lastResult.result === 'approved' ? '#059669' : '#DC2626',
            color: 'white',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '30px',
            textAlign: 'center',
            cursor: 'pointer',
            animation: 'fadeIn 0.15s ease'
          }}
        >
          <div style={{ maxWidth: '640px', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
            {lastResult.result === 'approved' ? (
              <CheckCircle2 size={110} style={{ filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.25))' }} />
            ) : (
              <XCircle size={110} style={{ filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.25))' }} />
            )}

            <div>
              <div style={{ fontSize: '36px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '-0.5px', textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>
                {lastResult.message || (lastResult.result === 'approved' ? 'ENTRY APPROVED' : 'ENTRY DENIED')}
              </div>
              {lastResult.reason && (
                <div style={{ fontSize: '18px', marginTop: '8px', opacity: 0.95 }}>
                  {lastResult.reason}
                </div>
              )}
            </div>

            {/* Resolved Event & Pass Details Box */}
            <div style={{
              backgroundColor: 'rgba(0, 0, 0, 0.28)',
              backdropFilter: 'blur(10px)',
              borderRadius: '16px',
              padding: '20px 28px',
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              textAlign: 'left',
              border: '1px solid rgba(255, 255, 255, 0.2)'
            }}>
              {lastResult.event && (
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255, 255, 255, 0.15)', paddingBottom: '6px' }}>
                  <span style={{ opacity: 0.8 }}>Event Context:</span>
                  <strong style={{ fontSize: '15px' }}>{lastResult.event.name}</strong>
                </div>
              )}
              {lastResult.category && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ opacity: 0.8 }}>Pass Category:</span>
                  <strong>{lastResult.category.name}</strong>
                </div>
              )}
              {lastResult.pass && (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ opacity: 0.8 }}>7-Digit Pass Code:</span>
                    <strong style={{ fontFamily: 'var(--font-mono)', fontSize: '20px', letterSpacing: '1px' }}>
                      {lastResult.pass.code}
                    </strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ opacity: 0.8 }}>Total Scans Recorded:</span>
                    <strong>{lastResult.pass.scanCount} scans</strong>
                  </div>
                </>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ opacity: 0.8 }}>Scan Timestamp:</span>
                <span>{new Date().toLocaleTimeString()}</span>
              </div>
            </div>

            <div style={{ fontSize: '14px', opacity: 0.85, marginTop: '8px' }}>
              Tap screen or press Enter to dismiss and scan next pass
            </div>
          </div>
        </div>
      )}

      {/* Main Scanner Container */}
      <div style={{ maxWidth: '640px', margin: '0 auto' }}>
        {/* Top Bar with Clear Back Button */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <button
            onClick={() => navigate('/')}
            className="btn btn-secondary"
            style={{ padding: '8px 16px', fontWeight: 700, gap: '8px', boxShadow: 'var(--shadow-sm)' }}
          >
            <ArrowLeft size={16} />
            <span>← Back to Dashboard</span>
          </button>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="btn btn-secondary btn-icon"
              title={soundEnabled ? 'Mute Audio FX' : 'Enable Audio FX'}
            >
              {soundEnabled ? <Volume2 size={18} color="var(--primary-600)" /> : <VolumeX size={18} />}
            </button>
            <button
              onClick={toggleTheme}
              className="btn btn-secondary btn-icon"
              title="Toggle Theme"
            >
              {isDark ? <Sun size={18} color="#FBBF24" /> : <Moon size={18} color="#6366F1" />}
            </button>
          </div>
        </div>

        {/* Gate Selector */}
        <div className="card" style={{ marginBottom: '18px', padding: '16px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sliders size={16} color="var(--primary-600)" />
              <span style={{ fontSize: '13px', fontWeight: 700 }}>Active Gate / Device:</span>
            </div>
            <select
              value={deviceId}
              onChange={(e) => setDeviceId(e.target.value)}
              style={{ padding: '6px 14px', fontWeight: 700 }}
            >
              <option value="GATE-01">GATE-01 (Main Entrance Left)</option>
              <option value="GATE-02">GATE-02 (Main Entrance Right)</option>
              <option value="GATE-VIP">GATE-VIP (VIP Priority Turnstile)</option>
              <option value="GATE-EAST">GATE-EAST (East Entrance)</option>
            </select>
          </div>
        </div>

        {/* Animated Scanner Viewfinder Card */}
        <div className="card" style={{ padding: '28px', marginBottom: '20px', textAlign: 'center' }}>
          <div style={{
            width: '240px',
            height: '160px',
            borderRadius: '16px',
            border: '2px dashed var(--primary-400)',
            margin: '0 auto 20px auto',
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'var(--bg-surface-hover)',
            overflow: 'hidden'
          }}>
            {/* Animated Laser Line */}
            <div className="viewfinder-laser" />

            <Camera size={38} color="var(--primary-600)" style={{ marginBottom: '6px', opacity: 0.9 }} />
            <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--primary-600)', letterSpacing: '1px', textTransform: 'uppercase' }}>
              Align Barcode / QR Code
            </div>
          </div>

          <h3 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '6px' }}>Ready to Scan Pass</h3>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '20px' }}>
            Scan ticket with handheld scanner or enter 7-digit pass code
          </p>

          <form onSubmit={(e) => handleScanSubmit(e)} style={{ display: 'flex', gap: '10px' }}>
            <input
              ref={inputRef}
              type="text"
              placeholder="e.g. TESTNOW, 55KDBD2"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              autoFocus
              style={{
                flex: 1,
                fontSize: '20px',
                fontWeight: 800,
                fontFamily: 'var(--font-mono)',
                textAlign: 'center',
                letterSpacing: '2px'
              }}
            />
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              style={{ padding: '0 24px', fontWeight: 700 }}
            >
              <span>{loading ? 'Verifying...' : 'Verify Pass'}</span>
            </button>
          </form>
        </div>

        {/* Multi-Event Quick Test Presets */}
        <div className="card" style={{ marginBottom: '20px', padding: '18px 20px' }}>
          <div style={{ fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.6px', color: 'var(--text-muted)', marginBottom: '12px' }}>
            QA Quick Test Passes (Instant Simulation):
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '8px' }}>
            <button
              onClick={() => handleScanSubmit(null, 'TESTNOW')}
              className="btn btn-primary btn-sm"
              style={{ fontSize: '11.5px', justifyContent: 'flex-start', background: 'var(--success-gradient)' }}
            >
              ★ Live Valid Pass (Today)
            </button>

            <button
              onClick={() => handleScanSubmit(null, 'TESTD1U')}
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '11.5px', justifyContent: 'flex-start' }}
            >
              Event 1: Unused Daily
            </button>

            <button
              onClick={() => handleScanSubmit(null, 'TESTD1S')}
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '11.5px', justifyContent: 'flex-start' }}
            >
              Event 1: Used Daily
            </button>

            <button
              onClick={() => handleScanSubmit(null, 'TESTASU')}
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '11.5px', justifyContent: 'flex-start' }}
            >
              Event 1: All-Season
            </button>

            <button
              onClick={() => handleScanSubmit(null, 'TESTMF1')}
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '11.5px', justifyContent: 'flex-start' }}
            >
              Event 2: Music Fest
            </button>

            <button
              onClick={() => handleScanSubmit(null, 'TESTEXP')}
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '11.5px', justifyContent: 'flex-start' }}
            >
              Expired Pass
            </button>

            <button
              onClick={() => handleScanSubmit(null, 'TESTVOI')}
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '11.5px', justifyContent: 'flex-start' }}
            >
              Voided Pass
            </button>
          </div>
        </div>

        {/* Recent Scans Feed on this Device */}
        {recentScans.length > 0 && (
          <div className="card" style={{ padding: '18px 20px' }}>
            <div style={{ fontSize: '13px', fontWeight: 800, marginBottom: '12px' }}>
              Device Scan History ({recentScans.length})
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {recentScans.map(s => (
                <div
                  key={s.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--bg-surface-hover)',
                    border: '1px solid var(--border-color)',
                    fontSize: '13px'
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontWeight: 800, fontFamily: 'var(--font-mono)' }}>{s.code}</span>
                      <span style={{ color: 'var(--text-muted)' }}>• {s.message}</span>
                    </div>
                    {s.eventName && (
                      <div style={{ fontSize: '11.5px', color: 'var(--primary-600)', fontWeight: 600 }}>
                        {s.eventName} • {s.categoryName}
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '11.5px', color: 'var(--text-subtle)' }}>{s.time}</span>
                    <span style={{
                      padding: '2px 8px',
                      borderRadius: 'var(--radius-full)',
                      fontSize: '11px',
                      fontWeight: 800,
                      backgroundColor: s.result === 'approved' ? 'var(--success-bg)' : 'var(--danger-bg)',
                      color: s.result === 'approved' ? 'var(--success-text)' : 'var(--danger-text)'
                    }}>
                      {s.result.toUpperCase()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
