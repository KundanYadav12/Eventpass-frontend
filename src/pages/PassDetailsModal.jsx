import React, { useState, useEffect } from 'react';
import {
  Ticket,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RotateCw,
  Ban,
  Printer,
  History,
  QrCode,
  ShieldCheck,
  Calendar,
  Clock,
  User,
  Copy,
  Check
} from 'lucide-react';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';
import Modal from '../components/Modal';
import Badge from '../components/Badge';
import { formatDateIST, formatTimeWithSecondsIST, formatDateTimeIST } from '../utils/dateUtil';
import ScannableBarcode from '../components/ScannableBarcode';

export default function PassDetailsModal({ passId, onClose, onRenew, onVoid, onReissue }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('timeline');
  const [copied, setCopied] = useState(false);
  const [barcodeFormat, setBarcodeFormat] = useState('CODE128');
  const toast = useToast();

  useEffect(() => {
    async function loadDetails() {
      setLoading(true);
      try {
        const res = await api.get(`/passes/${passId}`);
        if (res.success) {
          setData(res.data);
        }
      } catch (err) {
        toast.error('Failed to load pass details');
      } finally {
        setLoading(false);
      }
    }
    if (passId) loadDetails();
  }, [passId]);

  if (loading || !data) {
    return (
      <Modal isOpen={true} onClose={onClose} title="Pass Lifecycle Details" maxWidth="680px">
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
          Loading pass lifecycle timeline...
        </div>
      </Modal>
    );
  }

  const { pass, scanHistory = [], printLogs = [], auditHistory = [] } = data;

  const handleCopy = () => {
    navigator.clipboard.writeText(pass.code);
    setCopied(true);
    toast.success('Pass code copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={`Pass Lifecycle & Audit — #${pass.id}`}
      maxWidth="720px"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Digital Ticket Pass Card Preview */}
        <div className="ticket-preview-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <div style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--primary-600)' }}>
                {pass.event_name || 'EVENTGEN 2026'}
              </div>
              <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)', marginTop: '2px' }}>
                {pass.category_name || pass.code_type}
              </h2>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                Event Code: {pass.event_code || 'EXPO2026'}
              </div>
            </div>

            <Badge variant={
              pass.status === 'active' ? 'success' :
              pass.status === 'used' ? 'info' :
              pass.status === 'expired' ? 'warning' : 'danger'
            }>
              {pass.status.toUpperCase()}
            </Badge>
          </div>

          <div className="ticket-divider" />

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
                7-Digit Pass Code
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                <span style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '26px',
                  fontWeight: 900,
                  letterSpacing: '2px',
                  color: 'var(--primary-600)'
                }}>
                  {pass.code}
                </span>
                <button
                  onClick={handleCopy}
                  className="btn btn-outline btn-icon"
                  style={{ width: '32px', height: '32px' }}
                  title="Copy Code"
                >
                  {copied ? <Check size={16} color="var(--success-accent)" /> : <Copy size={15} color="var(--text-muted)" />}
                </button>
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
                Validity Window
              </div>
              <div style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '4px' }}>
                {new Date(pass.valid_from).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} – {new Date(pass.valid_until).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
              </div>
              <div style={{ fontSize: '11.5px', color: 'var(--text-subtle)', marginTop: '2px' }}>
                Total scans recorded: {pass.scan_count || 0}
              </div>
            </div>
          </div>

          {/* High-Resolution On-Screen Scannable Barcode & QR Display */}
          <div style={{
            marginTop: '16px',
            padding: '16px',
            backgroundColor: 'var(--bg-surface)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-color)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '12px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Digital Scannable Code (Direct Gate Testing)
              </div>

              <div style={{ display: 'flex', gap: '4px', backgroundColor: 'var(--bg-body)', padding: '2px', borderRadius: '6px' }}>
                <button
                  type="button"
                  onClick={() => setBarcodeFormat('QR')}
                  style={{
                    padding: '3px 10px',
                    fontSize: '11px',
                    fontWeight: 700,
                    borderRadius: '4px',
                    border: 'none',
                    backgroundColor: barcodeFormat === 'QR' ? 'var(--primary-600)' : 'transparent',
                    color: barcodeFormat === 'QR' ? '#ffffff' : 'var(--text-muted)',
                    cursor: 'pointer'
                  }}
                >
                  QR Code
                </button>
                <button
                  type="button"
                  onClick={() => setBarcodeFormat('CODE128')}
                  style={{
                    padding: '3px 10px',
                    fontSize: '11px',
                    fontWeight: 700,
                    borderRadius: '4px',
                    border: 'none',
                    backgroundColor: barcodeFormat === 'CODE128' ? 'var(--primary-600)' : 'transparent',
                    color: barcodeFormat === 'CODE128' ? '#ffffff' : 'var(--text-muted)',
                    cursor: 'pointer'
                  }}
                >
                  Code 128
                </button>
                <button
                  type="button"
                  onClick={() => setBarcodeFormat('CODE39')}
                  style={{
                    padding: '3px 10px',
                    fontSize: '11px',
                    fontWeight: 700,
                    borderRadius: '4px',
                    border: 'none',
                    backgroundColor: barcodeFormat === 'CODE39' ? 'var(--primary-600)' : 'transparent',
                    color: barcodeFormat === 'CODE39' ? '#ffffff' : 'var(--text-muted)',
                    cursor: 'pointer'
                  }}
                >
                  Code 39
                </button>
              </div>
            </div>

            <div style={{ padding: '12px 16px', backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <ScannableBarcode
                value={pass.code}
                type={barcodeFormat}
                size="lg"
                showText={true}
              />
              <div style={{
                marginTop: '8px',
                padding: '4px 12px',
                backgroundColor: 'rgba(99, 102, 241, 0.08)',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: 800,
                fontFamily: 'var(--font-mono, monospace)',
                color: 'var(--primary-700)',
                letterSpacing: '1px'
              }}>
                PASS CODE: {pass.code}
              </div>
            </div>

            <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', textAlign: 'center' }}>
              Point the Scanner App's camera directly at this screen to validate this pass at the gate.
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
          <button
            onClick={() => setActiveTab('timeline')}
            style={{
              padding: '6px 14px',
              borderRadius: 'var(--radius-md)',
              fontSize: '13px',
              fontWeight: 700,
              backgroundColor: activeTab === 'timeline' ? 'var(--primary-50)' : 'transparent',
              color: activeTab === 'timeline' ? 'var(--primary-700)' : 'var(--text-muted)'
            }}
          >
            Scan Timeline ({scanHistory.length})
          </button>
          <button
            onClick={() => setActiveTab('print')}
            style={{
              padding: '6px 14px',
              borderRadius: 'var(--radius-md)',
              fontSize: '13px',
              fontWeight: 700,
              backgroundColor: activeTab === 'print' ? 'var(--primary-50)' : 'transparent',
              color: activeTab === 'print' ? 'var(--primary-700)' : 'var(--text-muted)'
            }}
          >
            Print Logs ({printLogs.length})
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            style={{
              padding: '6px 14px',
              borderRadius: 'var(--radius-md)',
              fontSize: '13px',
              fontWeight: 700,
              backgroundColor: activeTab === 'audit' ? 'var(--primary-50)' : 'transparent',
              color: activeTab === 'audit' ? 'var(--primary-700)' : 'var(--text-muted)'
            }}
          >
            Audit Trail ({auditHistory.length})
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'timeline' && (
          <div style={{ maxHeight: '220px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {scanHistory.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)', fontSize: '13px' }}>
                No gate scans recorded yet for this pass.
              </div>
            ) : (
              scanHistory.map((sh) => (
                <div key={sh.id} style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--bg-surface-hover)',
                  border: '1px solid var(--border-color)',
                  fontSize: '13px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Badge variant={sh.result === 'approved' ? 'success' : 'danger'}>
                      {sh.result.toUpperCase()}
                    </Badge>
                    <div>
                      <div style={{ fontWeight: 700 }}>{sh.reason || 'Gate Scan'}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        Device: {sh.device_id} {sh.operator_name ? `• ${sh.operator_name}` : ''}
                      </div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', fontSize: '12px', color: 'var(--text-muted)' }}>
                    <div>{formatTimeWithSecondsIST(sh.scan_time)}</div>
                    <div style={{ fontSize: '11px' }}>{formatDateIST(sh.scan_time)}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'print' && (
          <div style={{ maxHeight: '220px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {printLogs.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)', fontSize: '13px' }}>
                No thermal print logs for this pass. Pass is unprinted.
              </div>
            ) : (
              printLogs.map((pl) => (
                <div key={pl.id} style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--bg-surface-hover)',
                  border: '1px solid var(--border-color)',
                  fontSize: '13px'
                }}>
                  <div>
                    <div style={{ fontWeight: 700 }}>{pl.printer_name || 'TSC TE244'}</div>
                    <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                      Batch: {pl.batch_name || `#${pl.batch_id}`}
                    </div>
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    {formatDateTimeIST(pl.printed_at)}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'audit' && (
          <div style={{ maxHeight: '220px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {auditHistory.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)', fontSize: '13px' }}>
                No administrative modifications recorded.
              </div>
            ) : (
              auditHistory.map((ah) => (
                <div key={ah.id} style={{
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--bg-surface-hover)',
                  border: '1px solid var(--border-color)',
                  fontSize: '12.5px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontWeight: 700 }}>{ah.action}</span>
                    <span style={{ color: 'var(--text-muted)' }}>{formatDateTimeIST(ah.created_at)}</span>
                  </div>
                  <div style={{ color: 'var(--text-muted)' }}>By: {ah.user_name || 'Admin'}</div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Footer Actions */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '16px', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={onRenew} className="btn btn-secondary btn-sm">
              <RotateCw size={14} />
              <span>Renew Pass</span>
            </button>
            <button onClick={onReissue} className="btn btn-secondary btn-sm">
              <Ticket size={14} />
              <span>Reissue 7-Digit Code</span>
            </button>
            <button onClick={onVoid} className="btn btn-outline btn-sm" style={{ color: 'var(--danger-accent)' }}>
              <Ban size={14} />
              <span>Void Pass</span>
            </button>
          </div>

          <button onClick={onClose} className="btn btn-primary">
            Close Details
          </button>
        </div>
      </div>
    </Modal>
  );
}
