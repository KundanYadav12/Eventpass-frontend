import React, { useState, useEffect } from 'react';
import Modal from '../components/Modal';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';
import { RotateCcw, Calendar, AlertCircle } from 'lucide-react';

export default function RenewPassModal({ isOpen, onClose, pass, passIds = [], onRenewSuccess }) {
  const isBulk = Array.isArray(passIds) && passIds.length > 1;
  const targetPassesCount = isBulk ? passIds.length : (pass ? 1 : 0);

  const [validFrom, setValidFrom] = useState('');
  const [validUntil, setValidUntil] = useState('');
  const [resetUsage, setResetUsage] = useState(true);
  const [resetStatus, setResetStatus] = useState(true);
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const toast = useToast();

  useEffect(() => {
    if (pass) {
      // Pre-fill dates
      const from = pass.valid_from ? new Date(pass.valid_from).toISOString().slice(0, 16) : '';
      const until = pass.valid_until ? new Date(pass.valid_until).toISOString().slice(0, 16) : '';
      setValidFrom(from);
      setValidUntil(until);
      setReason('');
      setResetUsage(true);
      setResetStatus(true);
    } else if (isBulk) {
      setValidFrom('2026-10-02T00:00');
      setValidUntil('2026-10-04T23:59');
      setReason('Bulk seasonal renewal');
      setResetUsage(true);
      setResetStatus(true);
    }
  }, [pass, passIds, isBulk, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reason.trim()) {
      toast.warning('Please provide a renewal reason for the audit log');
      return;
    }

    setSubmitting(true);
    try {
      if (isBulk) {
        const res = await api.post('/passes/bulk-renew', {
          passIds,
          validFrom: validFrom ? validFrom.replace('T', ' ') + ':00' : undefined,
          validUntil: validUntil ? validUntil.replace('T', ' ') + ':00' : undefined,
          resetUsage,
          resetStatus,
          reason
        });
        if (res.success) {
          toast.success(`Successfully renewed ${res.data.updatedCount} passes`);
          onRenewSuccess();
          onClose();
        }
      } else if (pass) {
        const res = await api.post(`/passes/${pass.id}/renew`, {
          validFrom: validFrom ? validFrom.replace('T', ' ') + ':00' : undefined,
          validUntil: validUntil ? validUntil.replace('T', ' ') + ':00' : undefined,
          resetUsage,
          resetStatus,
          reason
        });
        if (res.success) {
          toast.success(`Pass ${pass.code} renewed successfully`);
          onRenewSuccess();
          onClose();
        }
      }
    } catch (err) {
      toast.error('Failed to renew: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isBulk ? `Bulk Renew ${targetPassesCount} Passes` : `Renew Pass — ${pass?.code}`}
      maxWidth="540px"
      footer={
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', width: '100%' }}>
          <button onClick={onClose} className="btn btn-outline" disabled={submitting}>
            Cancel
          </button>
          <button onClick={handleSubmit} className="btn btn-primary" disabled={submitting}>
            <RotateCcw size={16} />
            <span>{submitting ? 'Renewing...' : isBulk ? `Renew ${targetPassesCount} Passes` : 'Renew Pass'}</span>
          </button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ padding: '12px 14px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--info-bg)', color: 'var(--info-text)', fontSize: '13px', display: 'flex', gap: '8px', alignItems: 'center' }}>
          <AlertCircle size={18} />
          <span>Every renewal action is permanently recorded in the SuperAdmin audit trail.</span>
        </div>

        {/* Valid From */}
        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
            New Valid From Date & Time
          </label>
          <input
            type="datetime-local"
            value={validFrom}
            onChange={(e) => setValidFrom(e.target.value)}
            style={{ width: '100%' }}
            required
          />
        </div>

        {/* Valid Until */}
        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
            New Valid Until / Expiry Date & Time
          </label>
          <input
            type="datetime-local"
            value={validUntil}
            onChange={(e) => setValidUntil(e.target.value)}
            style={{ width: '100%' }}
            required
          />
        </div>

        {/* Checkboxes */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', padding: '12px 0' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13.5px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={resetStatus}
              onChange={(e) => setResetStatus(e.target.checked)}
              style={{ width: '16px', height: '16px' }}
            />
            <span>Reset status to <strong>Active</strong></span>
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13.5px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={resetUsage}
              onChange={(e) => setResetUsage(e.target.checked)}
              style={{ width: '16px', height: '16px' }}
            />
            <span>Reset scan count & usage statistics to <strong>0 scans</strong></span>
          </label>
        </div>

        {/* Reason */}
        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
            Renewal Reason <span style={{ color: 'var(--danger-accent)' }}>*</span>
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. VIP extension, weather reschedule, event shift extension..."
            rows={3}
            style={{ width: '100%', resize: 'vertical' }}
            required
          />
        </div>
      </form>
    </Modal>
  );
}
