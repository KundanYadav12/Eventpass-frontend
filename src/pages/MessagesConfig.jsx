import React, { useState, useEffect } from 'react';
import { MessageSquare, Save, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';

export default function MessagesConfig() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState(null);
  const toast = useToast();

  const fetchMessages = async () => {
    setLoading(true);
    try {
      const res = await api.get('/messages');
      if (res.success) {
        setMessages(res.data || []);
      }
    } catch (e) {
      toast.error('Failed to load scanner messages: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, []);

  const handleTextChange = (key, newText) => {
    setMessages(prev => prev.map(m => m.message_key === key ? { ...m, message_text: newText } : m));
  };

  const handleSaveMessage = async (msg) => {
    setSavingKey(msg.message_key);
    try {
      const res = await api.put(`/messages/${msg.message_key}`, { text: msg.message_text });
      if (res.success) {
        toast.success(`Message for '${msg.message_key}' updated live`);
      }
    } catch (e) {
      toast.error('Failed to save message: ' + e.message);
    } finally {
      setSavingKey(null);
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Scanner Messages Configuration</h1>
          <p className="page-subtitle">Customize real-time textual feedback sent to gate scanners and mobile apps</p>
        </div>
        <button onClick={fetchMessages} className="btn btn-secondary">
          <RefreshCw size={16} className={loading ? 'spin' : ''} />
          <span>Refresh</span>
        </button>
      </div>

      <div style={{
        backgroundColor: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-lg)',
        padding: '16px 20px',
        marginBottom: '24px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
      }}>
        <AlertCircle size={20} color="var(--primary-600)" />
        <span style={{ fontSize: '13.5px', color: 'var(--text-muted)' }}>
          Changes saved here take effect immediately across all gate barcode scanners and mobile scanning applications.
        </span>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <RefreshCw size={28} className="spin" style={{ color: 'var(--primary-600)' }} />
          <p style={{ marginTop: '12px', color: 'var(--text-muted)' }}>Loading message configurations...</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {messages.map(m => (
            <div
              key={m.id || m.message_key}
              className="card"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '16px',
                padding: '20px'
              }}
            >
              <div style={{ flex: 1, minWidth: '280px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <span style={{ fontWeight: 700, fontFamily: 'var(--font-mono)', fontSize: '14px', color: 'var(--primary-600)' }}>
                    {m.message_key}
                  </span>
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>
                  {m.description || 'Scanner feedback message'}
                </div>
                <input
                  type="text"
                  value={m.message_text}
                  onChange={(e) => handleTextChange(m.message_key, e.target.value)}
                  style={{ width: '100%', fontSize: '14px', fontWeight: 500 }}
                />
              </div>

              <div>
                <button
                  onClick={() => handleSaveMessage(m)}
                  disabled={savingKey === m.message_key}
                  className="btn btn-primary"
                >
                  <Save size={15} />
                  <span>{savingKey === m.message_key ? 'Saving...' : 'Save Message'}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
