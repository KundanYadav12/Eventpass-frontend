import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  QrCode,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Volume2,
  VolumeX,
  Camera,
  CameraOff,
  RefreshCw,
  Sliders,
  ChevronRight,
  Sparkles,
  Sun,
  Moon,
  ArrowLeft,
  Building2,
  Tag,
  Zap,
  RotateCw,
  Info
} from 'lucide-react';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';
import { useTheme } from '../context/ThemeContext';
import { useSettings } from '../context/SettingsContext';
import {
  formatDateTimeIST,
  formatTimeWithSecondsIST,
  formatDateIST
} from '../utils/dateUtil';

export default function WebScanner() {
  const [code, setCode] = useState('');
  const [deviceId, setDeviceId] = useState('GATE-01');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [loading, setLoading] = useState(false);
  const [lastResult, setLastResult] = useState(null);
  const [recentScans, setRecentScans] = useState([]);
  const [showResultOverlay, setShowResultOverlay] = useState(false);

  // Live Camera State
  const [cameraActive, setCameraActive] = useState(false);
  const [facingMode, setFacingMode] = useState('environment'); // 'environment' or 'user'
  const [cameraError, setCameraError] = useState(null);
  const [isSecure, setIsSecure] = useState(true);

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const scanIntervalRef = useRef(null);
  const inputRef = useRef(null);
  const scanLockRef = useRef(false);
  const lastScannedCodeRef = useRef('');
  const lastScanTimeRef = useRef(0);

  const toast = useToast();
  const navigate = useNavigate();
  const { isDark, toggleTheme } = useTheme();
  const { platformName } = useSettings();

  // Check secure context on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      const isHttps = window.location.protocol === 'https:';
      setIsSecure(isHttps || isLocalhost);
    }
  }, []);

  // Web Audio Synthesizer for instant feedback sounds
  const playSound = (type) => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();

      if (type === 'approved') {
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

  // Start Camera Stream
  const startCamera = async () => {
    setCameraError(null);
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError('Camera access is not supported on this browser or requires an HTTPS connection.');
      return;
    }

    try {
      // Stop any existing stream
      stopCamera();

      const constraints = {
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        videoRef.current.setAttribute('muted', 'true');
        await videoRef.current.play();
      }

      setCameraActive(true);
      startBarcodeScannerLoop();
      toast.success(`Camera activated (${facingMode === 'environment' ? 'Rear' : 'Front'})`);
    } catch (err) {
      console.error('[Scanner] Camera error:', err);
      let errMsg = err.message || 'Failed to access camera';
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        errMsg = 'Camera permission was denied. Please allow camera permissions in your browser address bar.';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        errMsg = 'No video camera device detected on this hardware.';
      }
      setCameraError(errMsg);
      setCameraActive(false);
    }
  };

  // Stop Camera Stream
  const stopCamera = () => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  };

  // Flip Camera (Rear <-> Front)
  const toggleCameraFacing = () => {
    const nextMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextMode);
  };

  useEffect(() => {
    if (cameraActive) {
      startCamera();
    }
  }, [facingMode]);

  // Cleanup camera on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  // Barcode Detection Loop (BarcodeDetector API or fallback)
  const startBarcodeScannerLoop = () => {
    if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);

    const hasBarcodeDetector = typeof window !== 'undefined' && 'BarcodeDetector' in window;
    let detector = null;

    if (hasBarcodeDetector) {
      try {
        detector = new window.BarcodeDetector({
          formats: ['qr_code', 'code_128', 'code_39', 'ean_13', 'ean_8', 'data_matrix']
        });
      } catch (e) {
        console.warn('BarcodeDetector format init error:', e);
      }
    }

    scanIntervalRef.current = setInterval(async () => {
      if (!videoRef.current || videoRef.current.readyState < 2 || scanLockRef.current) return;

      if (detector) {
        try {
          const barcodes = await detector.detect(videoRef.current);
          if (barcodes && barcodes.length > 0) {
            const rawValue = barcodes[0].rawValue;
            if (rawValue) {
              const now = Date.now();
              // Prevent scanning the exact same code within 2.5 seconds
              if (rawValue === lastScannedCodeRef.current && now - lastScanTimeRef.current < 2500) {
                return;
              }
              lastScannedCodeRef.current = rawValue;
              lastScanTimeRef.current = now;
              handleScanSubmit(null, rawValue);
            }
          }
        } catch (e) {
          // Ignore frame decode errors
        }
      }
    }, 250);
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
          time: formatTimeWithSecondsIST(new Date())
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
      }, 500);
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
      padding: '16px',
      position: 'relative'
    }}>
      {/* Full-Screen Scan Result Overlay Popup */}
      {showResultOverlay && lastResult && (
        <div
          onClick={dismissOverlay}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 999,
            backgroundColor: lastResult.result === 'approved' ? '#059669' : lastResult.result === 'expired' ? '#D97706' : '#DC2626',
            color: 'white',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
            textAlign: 'center',
            cursor: 'pointer',
            animation: 'fadeIn 0.15s ease'
          }}
        >
          <div style={{ maxWidth: '600px', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
            {lastResult.result === 'approved' ? (
              <CheckCircle2 size={100} style={{ filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.25))' }} />
            ) : (
              <XCircle size={100} style={{ filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.25))' }} />
            )}

            <div>
              <div style={{ fontSize: '32px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '-0.5px', textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>
                {lastResult.message || (lastResult.result === 'approved' ? 'ENTRY APPROVED' : 'ENTRY DENIED')}
              </div>
              {lastResult.reason && (
                <div style={{ fontSize: '16px', marginTop: '6px', opacity: 0.95 }}>
                  {lastResult.reason}
                </div>
              )}
            </div>

            {/* Resolved Event & Pass Details Box */}
            <div style={{
              backgroundColor: 'rgba(0, 0, 0, 0.28)',
              backdropFilter: 'blur(10px)',
              borderRadius: '14px',
              padding: '18px 22px',
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              textAlign: 'left',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              fontSize: '13.5px'
            }}>
              {lastResult.event && (
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255, 255, 255, 0.15)', paddingBottom: '6px' }}>
                  <span style={{ opacity: 0.8 }}>Event:</span>
                  <strong style={{ fontSize: '14.5px' }}>{lastResult.event.name}</strong>
                </div>
              )}
              {lastResult.category && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ opacity: 0.8 }}>Category:</span>
                  <strong>{lastResult.category.name}</strong>
                </div>
              )}
              {lastResult.category?.scanBehavior && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ opacity: 0.8 }}>Scan Rule:</span>
                  <strong>{lastResult.category.scanBehavior === 'RENEWABLE' ? 'Renewable (Daily Reset)' : 'One-Time Use (Single Entry)'}</strong>
                </div>
              )}
              {lastResult.category?.scanBehavior === 'RENEWABLE' && lastResult.category?.renewalTime && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ opacity: 0.8 }}>Renewal Reset Time:</span>
                  <strong>{lastResult.category.renewalTime} IST</strong>
                </div>
              )}
              {lastResult.category?.scanBehavior === 'RENEWABLE' && (lastResult.category?.renewalActiveFrom || lastResult.category?.renewalActiveUntil) && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ opacity: 0.8 }}>Active Window (IST):</span>
                  <strong>{formatDateIST(lastResult.category.renewalActiveFrom)} – {formatDateIST(lastResult.category.renewalActiveUntil)}</strong>
                </div>
              )}
              {lastResult.pass && (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ opacity: 0.8 }}>Pass Code:</span>
                    <strong style={{ fontFamily: 'var(--font-mono)', fontSize: '18px', letterSpacing: '1px' }}>
                      {lastResult.pass.code}
                    </strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ opacity: 0.8 }}>Total Scans:</span>
                    <strong>{lastResult.pass.scanCount} scans</strong>
                  </div>
                </>
              )}
              {(lastResult.firstScannedAt || lastResult.pass?.firstScannedAt) && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ opacity: 0.8 }}>First Scanned (IST):</span>
                  <span>{formatDateTimeIST(lastResult.firstScannedAt || lastResult.pass?.firstScannedAt)}</span>
                </div>
              )}
              {(lastResult.lastScannedAt || lastResult.pass?.lastScannedAt) && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ opacity: 0.8 }}>Last Scanned (IST):</span>
                  <span>{formatDateTimeIST(lastResult.lastScannedAt || lastResult.pass?.lastScannedAt)}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ opacity: 0.8 }}>Scan Timestamp (IST):</span>
                <span>{formatDateTimeIST(new Date())}</span>
              </div>
            </div>

            <div style={{ fontSize: '13px', opacity: 0.85, marginTop: '4px' }}>
              Tap anywhere or press Enter to scan next pass
            </div>
          </div>
        </div>
      )}

      {/* Main Scanner Container */}
      <div style={{ maxWidth: '640px', margin: '0 auto' }}>
        {/* Top Bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <button
            onClick={() => navigate('/')}
            className="btn btn-secondary"
            style={{ padding: '8px 14px', fontWeight: 700, gap: '6px', fontSize: '13px' }}
          >
            <ArrowLeft size={16} />
            <span>Dashboard</span>
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
        <div className="card" style={{ marginBottom: '16px', padding: '14px 18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sliders size={16} color="var(--primary-600)" />
              <span style={{ fontSize: '13px', fontWeight: 700 }}>Active Gate / Device:</span>
            </div>
            <select
              value={deviceId}
              onChange={(e) => setDeviceId(e.target.value)}
              style={{ padding: '6px 12px', fontWeight: 700 }}
            >
              <option value="GATE-01">GATE-01 (Main Entrance Left)</option>
              <option value="GATE-02">GATE-02 (Main Entrance Right)</option>
              <option value="GATE-VIP">GATE-VIP (VIP Priority Turnstile)</option>
              <option value="GATE-EAST">GATE-EAST (East Entrance)</option>
            </select>
          </div>
        </div>

        {/* Insecure Context Warning Banner if applicable */}
        {!isSecure && (
          <div className="alert-banner" style={{ backgroundColor: 'var(--warning-bg)', borderColor: 'var(--warning-border)', marginBottom: '16px', padding: '12px 16px', borderRadius: 'var(--radius-md)', display: 'flex', gap: '10px' }}>
            <Info size={20} color="var(--warning-500)" style={{ flexShrink: 0 }} />
            <div style={{ fontSize: '12.5px', color: 'var(--text-primary)' }}>
              <strong>HTTPS Notice:</strong> Mobile browsers require an HTTPS secure context (e.g. <code>https://eventgen.duckdns.org</code>) to activate device cameras.
            </div>
          </div>
        )}

        {/* Camera Scanner Viewfinder Card */}
        <div className="card" style={{ padding: '20px', marginBottom: '18px', textAlign: 'center' }}>
          
          {/* Live Video / Placeholder Box */}
          <div style={{
            width: '100%',
            maxWidth: '360px',
            height: '240px',
            borderRadius: '16px',
            border: '2px dashed var(--primary-400)',
            margin: '0 auto 16px auto',
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#000000',
            overflow: 'hidden'
          }}>
            {/* Live Video Element */}
            <video
              ref={videoRef}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                display: cameraActive ? 'block' : 'none'
              }}
              playsInline
              autoPlay
              muted
            />

            {/* Target Laser Overlay */}
            {cameraActive && <div className="viewfinder-laser" />}

            {/* Inactive Camera Placeholder */}
            {!cameraActive && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', color: '#94A3B8', padding: '16px' }}>
                <Camera size={44} color="var(--primary-500)" />
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#FFFFFF' }}>
                  Camera is Inactive
                </div>
                <div style={{ fontSize: '11.5px', maxWidth: '240px' }}>
                  Tap "Open Camera Scanner" below to scan pass barcodes in real-time
                </div>
              </div>
            )}
          </div>

          {/* Camera Error Message */}
          {cameraError && (
            <div style={{
              backgroundColor: 'var(--danger-bg)',
              color: 'var(--danger-text)',
              border: '1px solid var(--danger-border)',
              borderRadius: 'var(--radius-md)',
              padding: '10px 14px',
              fontSize: '12.5px',
              marginBottom: '14px',
              textAlign: 'left'
            }}>
              ⚠️ {cameraError}
            </div>
          )}

          {/* Camera Controls Bar */}
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginBottom: '18px', flexWrap: 'wrap' }}>
            {!cameraActive ? (
              <button
                onClick={startCamera}
                className="btn btn-primary"
                style={{ padding: '8px 20px', gap: '8px', fontWeight: 700 }}
              >
                <Camera size={18} />
                <span>Open Camera Scanner</span>
              </button>
            ) : (
              <>
                <button
                  onClick={stopCamera}
                  className="btn btn-danger btn-sm"
                  style={{ gap: '6px' }}
                >
                  <CameraOff size={16} />
                  <span>Stop Camera</span>
                </button>

                <button
                  onClick={toggleCameraFacing}
                  className="btn btn-outline btn-sm"
                  style={{ gap: '6px' }}
                  title="Switch Front/Rear Camera"
                >
                  <RotateCw size={16} />
                  <span>Flip Camera</span>
                </button>
              </>
            )}
          </div>

          {/* Manual Input Form */}
          <form onSubmit={(e) => handleScanSubmit(e)} style={{ display: 'flex', gap: '8px' }}>
            <input
              ref={inputRef}
              type="text"
              placeholder="Enter 7-digit code (e.g. 55KDBD2)"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              style={{
                flex: 1,
                fontSize: '17px',
                fontWeight: 800,
                fontFamily: 'var(--font-mono)',
                textAlign: 'center',
                letterSpacing: '1.5px'
              }}
            />
            <button
              type="submit"
              disabled={loading || !code.trim()}
              className="btn btn-primary"
              style={{ padding: '0 18px', fontWeight: 700 }}
            >
              <span>{loading ? '...' : 'Verify'}</span>
            </button>
          </form>
        </div>

        {/* Multi-Event Quick Test Presets */}
        <div className="card" style={{ marginBottom: '18px', padding: '16px' }}>
          <div style={{ fontSize: '11.5px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.6px', color: 'var(--text-muted)', marginBottom: '10px' }}>
            Quick Test Passes (Simulation):
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '8px' }}>
            <button
              onClick={() => handleScanSubmit(null, 'TESTNOW')}
              className="btn btn-primary btn-sm"
              style={{ fontSize: '11.5px', justifyContent: 'flex-start', background: 'var(--success-gradient)' }}
            >
              ★ Valid Pass (Today)
            </button>

            <button
              onClick={() => handleScanSubmit(null, 'TESTD1U')}
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '11.5px', justifyContent: 'flex-start' }}
            >
              Unused Daily Pass
            </button>

            <button
              onClick={() => handleScanSubmit(null, 'TESTD1S')}
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '11.5px', justifyContent: 'flex-start' }}
            >
              Used Daily Pass
            </button>

            <button
              onClick={() => handleScanSubmit(null, 'TESTASU')}
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '11.5px', justifyContent: 'flex-start' }}
            >
              All-Season Pass
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

        {/* Recent Scans Feed */}
        {recentScans.length > 0 && (
          <div className="card" style={{ padding: '16px' }}>
            <div style={{ fontSize: '13px', fontWeight: 800, marginBottom: '10px' }}>
              Recent Scans ({recentScans.length})
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {recentScans.map(s => (
                <div
                  key={s.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 12px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--bg-surface-hover)',
                    border: '1px solid var(--border-color)',
                    fontSize: '12.5px'
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontWeight: 800, fontFamily: 'var(--font-mono)' }}>{s.code}</span>
                      <span style={{ color: 'var(--text-muted)' }}>• {s.message}</span>
                    </div>
                    {s.eventName && (
                      <div style={{ fontSize: '11px', color: 'var(--primary-600)', fontWeight: 600 }}>
                        {s.eventName} • {s.categoryName}
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-subtle)' }}>{s.time}</span>
                    <span style={{
                      padding: '2px 8px',
                      borderRadius: 'var(--radius-full)',
                      fontSize: '10.5px',
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
