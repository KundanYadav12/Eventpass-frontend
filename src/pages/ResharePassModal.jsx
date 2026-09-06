import React, { useState } from 'react';
import {
  Share2,
  Mail,
  MessageCircle,
  Sparkles,
  Send,
  CheckCircle2,
  User,
  Phone,
  Tag,
  AlertCircle,
  Download,
  FileText,
  ExternalLink
} from 'lucide-react';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';
import Modal from '../components/Modal';
import Badge from '../components/Badge';
import { formatDateTimeIST } from '../utils/dateUtil';

export default function ResharePassModal({ pass, onClose, onSuccess }) {
  const toast = useToast();
  const [sharingMethod, setSharingMethod] = useState('EMAIL'); // 'EMAIL' | 'WHATSAPP' | 'BOTH'
  const [customerEmail, setCustomerEmail] = useState(pass?.customer_email || '');
  const [customerPhone, setCustomerPhone] = useState(pass?.customer_phone || '');
  const [emailSubject, setEmailSubject] = useState(`${pass?.event_name || 'Event'} — Resent Official Pass Confirmation (${pass?.code})`);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (sharingMethod === 'EMAIL' && !customerEmail.trim()) {
      toast.warning('Please enter a valid recipient email address');
      return;
    }
    if (sharingMethod === 'WHATSAPP' && !customerPhone.trim()) {
      toast.warning('Please enter a valid WhatsApp phone number');
      return;
    }
    if (sharingMethod === 'BOTH' && (!customerEmail.trim() || !customerPhone.trim())) {
      toast.warning('Both Email address and WhatsApp number are required for dual delivery');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post(`/passes/${pass.id}/reshare`, {
        sharingMethod,
        customerEmail: customerEmail.trim() || undefined,
        customerPhone: customerPhone.trim() || undefined,
        emailSubject: emailSubject.trim() || undefined,
        notes: notes.trim() || undefined
      });

      if (res.success) {
        toast.success(`Pass ${pass.code} successfully reshared!`);
        setResult(res);
        if (onSuccess) onSuccess(res);
      }
    } catch (err) {
      toast.error(err.message || 'Failed to reshare pass');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPdf = (base64Data, filename) => {
    const link = document.createElement('a');
    link.href = `data:application/pdf;base64,${base64Data}`;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={result ? '🎉 Pass Reshared Successfully' : `Reshare Pass: ${pass.code}`}
      maxWidth="620px"
    >
      {result ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', textAlign: 'center', padding: '8px' }}>
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            backgroundColor: '#D1FAE5',
            color: '#059669',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto'
          }}>
            <CheckCircle2 size={32} />
          </div>

          <div>
            <h3 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 6px 0' }}>
              Pass {pass.code} Successfully Dispatched
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>
              Communication history updated. Reshare count is now <strong>{(pass.reshare_count || 0) + 1}</strong>.
            </p>
          </div>

          {/* Pass Summary Details */}
          <div style={{ backgroundColor: '#F8FAFC', padding: '14px', borderRadius: '8px', border: '1px solid #E2E8F0', textAlign: 'left', fontSize: '13px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <div><span style={{ color: '#64748B' }}>Pass Code:</span> <strong style={{ fontFamily: 'monospace' }}>{pass.code}</strong></div>
              <div><span style={{ color: '#64748B' }}>Category:</span> <strong>{pass.category_name || pass.code_type}</strong></div>
              <div><span style={{ color: '#64748B' }}>Customer:</span> <strong>{pass.customer_name || 'Customer'}</strong></div>
              <div><span style={{ color: '#64748B' }}>Method:</span> <Badge variant="primary">{sharingMethod}</Badge></div>
              {customerEmail && <div style={{ gridColumn: '1 / -1' }}><span style={{ color: '#64748B' }}>Email:</span> <strong>{customerEmail}</strong></div>}
              {customerPhone && <div style={{ gridColumn: '1 / -1' }}><span style={{ color: '#64748B' }}>WhatsApp:</span> <strong>{customerPhone}</strong></div>}
            </div>
          </div>

          {/* Quick Actions: WhatsApp Share link & PDF Downloads */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {result.whatsappUrl && (
              <a
                href={result.whatsappUrl}
                target="_blank"
                rel="noreferrer"
                className="btn btn-primary"
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', backgroundColor: '#10B981', borderColor: '#10B981' }}
              >
                <MessageCircle size={18} />
                <span>Open WhatsApp Direct Share</span>
                <ExternalLink size={14} />
              </a>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: result.billPdfBase64 ? '1fr 1fr' : '1fr', gap: '10px' }}>
              {result.passPdfBase64 && (
                <button
                  type="button"
                  onClick={() => handleDownloadPdf(result.passPdfBase64, `Pass_${pass.code}.pdf`)}
                  className="btn btn-secondary"
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                >
                  <Download size={15} />
                  <span>Download Pass PDF</span>
                </button>
              )}

              {result.billPdfBase64 && (
                <button
                  type="button"
                  onClick={() => handleDownloadPdf(result.billPdfBase64, `Invoice_${pass.bill_number || pass.code}.pdf`)}
                  className="btn btn-secondary"
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                >
                  <FileText size={15} />
                  <span>Download Invoice PDF</span>
                </button>
              )}
            </div>
          </div>

          <button onClick={onClose} className="btn btn-outline" style={{ marginTop: '8px' }}>
            Close
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Top Notice: Existing Pass Code Preserved */}
          <div style={{
            padding: '12px 14px',
            backgroundColor: '#EFF6FF',
            borderRadius: '8px',
            border: '1px solid #BFDBFE',
            fontSize: '12.5px',
            color: '#1E40AF',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '8px'
          }}>
            <Sparkles size={16} style={{ marginTop: '2px', flexShrink: 0 }} />
            <div>
              <strong>Existing Pass Security Retained:</strong> Resharing this pass retains the existing 7-character code (<code style={{ fontWeight: 800 }}>{pass.code}</code>), category, and billing details. Reshare count will increment automatically.
            </div>
          </div>

          {/* Current Pass Details Summary Card */}
          <div style={{ backgroundColor: 'var(--bg-surface-hover, #F8FAFC)', padding: '12px 16px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '12.5px' }}>
              <div><span style={{ color: 'var(--text-muted)' }}>Customer Name:</span> <strong>{pass.customer_name || 'Valued Guest'}</strong></div>
              <div><span style={{ color: 'var(--text-muted)' }}>Category:</span> <strong>{pass.category_name || pass.code_type}</strong></div>
              <div><span style={{ color: 'var(--text-muted)' }}>Event:</span> <strong>{pass.event_name || 'Event 2026'}</strong></div>
              <div><span style={{ color: 'var(--text-muted)' }}>Current Reshares:</span> <strong>{pass.reshare_count || 0} times</strong></div>
              {pass.last_shared_at && (
                <div style={{ gridColumn: '1 / -1', fontSize: '11.5px', color: 'var(--text-subtle)' }}>
                  Last shared on: {formatDateTimeIST(pass.last_shared_at)}
                </div>
              )}
            </div>
          </div>

          {/* Sharing Channel Selection */}
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '8px' }}>
              Select Reshare Channel *
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
              {[
                { mode: 'EMAIL', label: 'Email', icon: Mail },
                { mode: 'WHATSAPP', label: 'WhatsApp', icon: MessageCircle },
                { mode: 'BOTH', label: 'Both Channels', icon: Sparkles }
              ].map(item => {
                const Icon = item.icon;
                const isSelected = sharingMethod === item.mode;
                return (
                  <button
                    key={item.mode}
                    type="button"
                    onClick={() => setSharingMethod(item.mode)}
                    className={`btn btn-sm ${isSelected ? 'btn-primary' : 'btn-outline'}`}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '10px' }}
                  >
                    <Icon size={16} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Email Recipient Input */}
          {(sharingMethod === 'EMAIL' || sharingMethod === 'BOTH') && (
            <div>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, marginBottom: '4px' }}>
                Customer Email Address *
              </label>
              <input
                type="email"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                placeholder="customer@example.com"
                required
                style={{ width: '100%' }}
              />
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px', display: 'block' }}>
                Will dispatch Pass PDF and Bill PDF directly to this address via Event SMTP.
              </span>
            </div>
          )}

          {/* WhatsApp Phone Number Input */}
          {(sharingMethod === 'WHATSAPP' || sharingMethod === 'BOTH') && (
            <div>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, marginBottom: '4px' }}>
                WhatsApp Mobile Number (with Country Code) *
              </label>
              <input
                type="text"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="+91 98765 43210"
                required
                style={{ width: '100%' }}
              />
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px', display: 'block' }}>
                Generates instant WhatsApp confirmation link with scannable pass and bill invoice download tokens.
              </span>
            </div>
          )}

          {/* Optional Notes */}
          <div>
            <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, marginBottom: '4px' }}>
              Reshare Reason / Internal Notes (Optional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Customer requested pass re-delivery to updated email"
              style={{ width: '100%', fontSize: '12.5px' }}
            />
          </div>

          {/* Modal Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px', borderTop: '1px solid var(--border-color)', paddingTop: '14px' }}>
            <button type="button" onClick={onClose} className="btn btn-secondary" disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Send size={16} />
              <span>{loading ? 'Resharing Pass...' : 'Confirm & Reshare Pass'}</span>
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}
