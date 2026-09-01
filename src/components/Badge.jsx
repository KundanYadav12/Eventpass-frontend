import React from 'react';

export default function Badge({ status, type, label }) {
  let badgeClass = 'badge-active';
  let displayLabel = label || status || type || '';

  const normalized = String(status || type || '').toLowerCase();

  if (normalized === 'active' || normalized === 'approved' || normalized === 'completed' || normalized === 'success') {
    badgeClass = 'badge-active';
  } else if (normalized === 'used' || normalized === 'printing' || normalized === 'info') {
    badgeClass = 'badge-used';
  } else if (normalized === 'expired' || normalized === 'paused' || normalized === 'warning' || normalized === 'wrong_date') {
    badgeClass = 'badge-expired';
  } else if (normalized === 'void' || normalized === 'voided' || normalized === 'denied' || normalized === 'cancelled' || normalized === 'invalid' || normalized === 'already_used') {
    badgeClass = 'badge-void';
  } else if (normalized === 'printed') {
    badgeClass = 'badge-printed';
  }

  return (
    <span className={`badge ${badgeClass}`}>
      <span style={{
        width: '6px',
        height: '6px',
        borderRadius: '50%',
        backgroundColor: 'currentColor'
      }} />
      {displayLabel.replace('_', ' ')}
    </span>
  );
}
