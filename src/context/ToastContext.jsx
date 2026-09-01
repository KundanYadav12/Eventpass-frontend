import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

const ToastContext = createContext();

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info', duration = 4000) => {
    const id = Date.now().toString(36) + Math.random().toString(36).substring(2);
    setToasts(prev => [...prev, { id, message, type }]);

    if (duration > 0) {
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, duration);
    }
  }, []);

  const removeToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const success = (msg, duration) => addToast(msg, 'success', duration);
  const error = (msg, duration) => addToast(msg, 'danger', duration);
  const info = (msg, duration) => addToast(msg, 'info', duration);
  const warning = (msg, duration) => addToast(msg, 'warning', duration);

  return (
    <ToastContext.Provider value={{ success, error, info, warning }}>
      {children}
      <div style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        maxWidth: '420px',
        pointerEvents: 'none'
      }}>
        {toasts.map(t => (
          <div
            key={t.id}
            style={{
              pointerEvents: 'auto',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              padding: '14px 18px',
              borderRadius: '10px',
              backgroundColor: t.type === 'success' ? 'var(--success-bg)' : t.type === 'danger' ? 'var(--danger-bg)' : t.type === 'warning' ? 'var(--warning-bg)' : 'var(--info-bg)',
              color: t.type === 'success' ? 'var(--success-text)' : t.type === 'danger' ? 'var(--danger-text)' : t.type === 'warning' ? 'var(--warning-text)' : 'var(--info-text)',
              border: `1px solid ${t.type === 'success' ? 'var(--success-border)' : t.type === 'danger' ? 'var(--danger-border)' : t.type === 'warning' ? 'var(--warning-border)' : 'var(--info-border)'}`,
              boxShadow: 'var(--shadow-lg)',
              animation: 'fadeIn 0.2s ease',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {t.type === 'success' && <CheckCircle2 size={20} />}
              {t.type === 'danger' && <AlertCircle size={20} />}
              {t.type === 'warning' && <AlertCircle size={20} />}
              {t.type === 'info' && <Info size={20} />}
              <span>{t.message}</span>
            </div>
            <button
              onClick={() => removeToast(t.id)}
              style={{ background: 'transparent', border: 'none', color: 'inherit', cursor: 'pointer', display: 'flex', padding: '2px' }}
            >
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
