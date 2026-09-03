import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useEvent } from '../context/EventContext';
import { useToast } from '../context/ToastContext';
import { api } from '../services/api';
import Modal from '../components/Modal';
import {
  Mail,
  MessageCircle,
  ShieldCheck,
  Send,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  RefreshCw,
  Clock,
  FileText,
  Lock,
  Layers,
  Settings,
  HelpCircle
} from 'lucide-react';

export default function EventDeliverySettings() {
  const { user, isSuperAdmin } = useAuth();
  const { events, selectedEvent, setSelectedEvent } = useEvent();
  const toast = useToast();

  const [activeTab, setActiveTab] = useState('email'); // 'email' | 'whatsapp' | 'logs'
  const [activeEventId, setActiveEventId] = useState(
    selectedEvent?.id || (events?.[0]?.id || 1)
  );

  // Email Configuration State
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailSaving, setEmailSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [emailForm, setEmailForm] = useState({
    sender_name: '',
    sender_email: '',
    smtp_host: 'smtp.gmail.com',
    smtp_port: 587,
    smtp_secure: false,
    smtp_user: '',
    smtp_pass: '',
    has_password: false,
    email_subject_template: '',
    is_enabled: true
  });

  // WhatsApp Configuration State
  const [whatsappLoading, setWhatsappLoading] = useState(false);
  const [whatsappSaving, setWhatsappSaving] = useState(false);
  const [showToken, setShowToken] = useState(false);
  const [whatsappForm, setWhatsappForm] = useState({
    provider: 'WHATSAPP_LINK',
    phone_number_id: '',
    access_token: '',
    has_token: false,
    custom_message_template: '',
    is_enabled: true
  });

  // Test Email Modal State
  const [showTestModal, setShowTestModal] = useState(false);
  const [testRecipient, setTestRecipient] = useState(user?.email || '');
  const [testingEmail, setTestingEmail] = useState(false);
  const [testResult, setTestResult] = useState(null);

  // Delivery Logs State
  const [logs, setLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(false);

  // Sync active event ID
  useEffect(() => {
    if (selectedEvent?.id) {
      setActiveEventId(selectedEvent.id);
    }
  }, [selectedEvent]);

  // Load configuration on event change or tab switch
  useEffect(() => {
    if (activeEventId) {
      if (activeTab === 'email') fetchEmailSettings(activeEventId);
      if (activeTab === 'whatsapp') fetchWhatsappSettings(activeEventId);
      if (activeTab === 'logs') fetchDeliveryLogs(activeEventId);
    }
  }, [activeEventId, activeTab]);

  const handleEventChange = (evId) => {
    const numId = parseInt(evId, 10);
    setActiveEventId(numId);
    const matched = events?.find(e => e.id === numId);
    if (matched && setSelectedEvent) {
      setSelectedEvent(matched);
    }
  };

  // 1. Fetch Email Settings
  const fetchEmailSettings = async (eventId) => {
    setEmailLoading(true);
    try {
      const res = await api.get(`/events/${eventId}/delivery/email`);
      if (res.success && res.settings) {
        setEmailForm({
          sender_name: res.settings.sender_name || '',
          sender_email: res.settings.sender_email || '',
          smtp_host: res.settings.smtp_host || 'smtp.gmail.com',
          smtp_port: res.settings.smtp_port || 465,
          smtp_secure: Boolean(res.settings.smtp_secure),
          smtp_user: res.settings.smtp_user || res.settings.sender_email || '',
          smtp_pass: '',
          has_password: Boolean(res.settings.has_password),
          email_subject_template: res.settings.email_subject_template || '',
          is_enabled: Boolean(res.settings.is_enabled)
        });
      }
    } catch (err) {
      toast.error(err.message || 'Failed to load event email settings');
    } finally {
      setEmailLoading(false);
    }
  };

  // 2. Save Email Settings
  const handleSaveEmail = async (e) => {
    e.preventDefault();
    setEmailSaving(true);
    try {
      const payload = {
        ...emailForm,
        smtp_user: (emailForm.smtp_user || emailForm.sender_email || '').trim(),
        smtp_pass: emailForm.smtp_pass ? emailForm.smtp_pass.trim() : (emailForm.has_password ? '••••••••' : '')
      };
      const res = await api.put(`/events/${eventIdUrl()}/delivery/email`, payload);
      if (res.success) {
        toast.success(`Email settings for ${currentEventName()} saved successfully!`);
        setEmailForm(prev => ({
          ...prev,
          smtp_user: payload.smtp_user,
          smtp_pass: '',
          has_password: Boolean(res.settings.has_password)
        }));
      }
    } catch (err) {
      toast.error(err.message || 'Failed to save email settings');
    } finally {
      setEmailSaving(false);
    }
  };

  // 3. Fetch WhatsApp Settings
  const fetchWhatsappSettings = async (eventId) => {
    setWhatsappLoading(true);
    try {
      const res = await api.get(`/events/${eventId}/delivery/whatsapp`);
      if (res.success && res.settings) {
        setWhatsappForm({
          provider: res.settings.provider || 'WHATSAPP_LINK',
          phone_number_id: res.settings.phone_number_id || '',
          access_token: '',
          has_token: Boolean(res.settings.has_token),
          custom_message_template: res.settings.custom_message_template || '',
          is_enabled: Boolean(res.settings.is_enabled)
        });
      }
    } catch (err) {
      toast.error(err.message || 'Failed to load event WhatsApp settings');
    } finally {
      setWhatsappLoading(false);
    }
  };

  // 4. Save WhatsApp Settings
  const handleSaveWhatsapp = async (e) => {
    e.preventDefault();
    setWhatsappSaving(true);
    try {
      const payload = {
        ...whatsappForm,
        access_token: whatsappForm.access_token ? whatsappForm.access_token.trim() : (whatsappForm.has_token ? '••••••••' : '')
      };
      const res = await api.put(`/events/${eventIdUrl()}/delivery/whatsapp`, payload);
      if (res.success) {
        toast.success(`WhatsApp settings for ${currentEventName()} saved successfully!`);
        setWhatsappForm(prev => ({
          ...prev,
          access_token: '',
          has_token: Boolean(res.settings?.has_token || prev.has_token)
        }));
      }
    } catch (err) {
      toast.error(err.message || 'Failed to save WhatsApp settings');
    } finally {
      setWhatsappSaving(false);
    }
  };

  // 5. Fetch Delivery Logs
  const fetchDeliveryLogs = async (eventId) => {
    setLogsLoading(true);
    try {
      const res = await api.get(`/events/${eventId}/delivery/logs`);
      if (res.success) {
        setLogs(res.logs || []);
      }
    } catch (err) {
      toast.error('Failed to load delivery logs');
    } finally {
      setLogsLoading(false);
    }
  };

  // 6. Test Email Dispatch
  const handleRunTestEmail = async (e) => {
    e.preventDefault();
    if (!testRecipient) {
      toast.error('Please enter a recipient email address');
      return;
    }
    setTestingEmail(true);
    setTestResult(null);
    try {
      const testPayload = {
        recipientEmail: testRecipient.trim(),
        settings: {
          ...emailForm,
          smtp_user: (emailForm.smtp_user || emailForm.sender_email || '').trim(),
          smtp_pass: emailForm.smtp_pass ? emailForm.smtp_pass.trim() : (emailForm.has_password ? '••••••••' : '')
        }
      };
      const res = await api.post(`/events/${eventIdUrl()}/delivery/email/test`, testPayload);
      setTestResult(res);
      if (res.success) {
        toast.success(res.message || 'Test email with Pass & Bill PDFs dispatched successfully!');
      } else {
        toast.error(res.message || 'Test email failed');
      }
    } catch (err) {
      setTestResult({ success: false, message: err.message });
      toast.error(err.message || 'Test email execution failed');
    } finally {
      setTestingEmail(false);
    }
  };

  const eventIdUrl = () => activeEventId;
  const currentEventName = () => events?.find(e => e.id === activeEventId)?.event_name || `Event #${activeEventId}`;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header Banner & Event Context Selector */}
      <div className="card" style={{ padding: '22px 28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '10px', backgroundColor: 'rgba(59, 130, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Send size={22} color="var(--primary-600)" />
            </div>
            <div>
              <h1 style={{ fontSize: '19px', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                Event Email & WhatsApp Delivery Settings
              </h1>
              <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>
                Configure isolated SMTP senders, WhatsApp links, and automated PDF attachment delivery per event.
              </p>
            </div>
          </div>
        </div>

        {/* Event Selector Dropdown (Strict Event Isolation) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: 'var(--bg-surface-hover)', padding: '8px 14px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
          <Layers size={16} color="var(--primary-600)" />
          <span style={{ fontSize: '13px', fontWeight: 700 }}>Configuring For Event:</span>
          <select
            value={activeEventId}
            onChange={(e) => handleEventChange(e.target.value)}
            style={{ fontWeight: 700, padding: '6px 12px', borderRadius: '8px' }}
          >
            {events?.map(ev => (
              <option key={ev.id} value={ev.id}>
                {ev.event_name} (#{ev.id})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div style={{ display: 'flex', gap: '10px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
        <button
          onClick={() => setActiveTab('email')}
          className={`btn ${activeTab === 'email' ? 'btn-primary' : 'btn-outline'}`}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13.5px', fontWeight: 700, padding: '9px 18px' }}
        >
          <Mail size={16} />
          <span>Event SMTP Email Sender</span>
        </button>

        <button
          onClick={() => setActiveTab('whatsapp')}
          className={`btn ${activeTab === 'whatsapp' ? 'btn-primary' : 'btn-outline'}`}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13.5px', fontWeight: 700, padding: '9px 18px' }}
        >
          <MessageCircle size={16} />
          <span>Event WhatsApp Delivery</span>
        </button>

        <button
          onClick={() => setActiveTab('logs')}
          className={`btn ${activeTab === 'logs' ? 'btn-primary' : 'btn-outline'}`}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13.5px', fontWeight: 700, padding: '9px 18px' }}
        >
          <Clock size={16} />
          <span>Delivery Activity Logs</span>
        </button>
      </div>

      {/* TAB 1: Event SMTP & Email Delivery Settings */}
      {activeTab === 'email' && (
        <div className="card" style={{ padding: '28px 32px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '22px', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h2 style={{ fontSize: '16px', fontWeight: 800, margin: 0 }}>
                📧 SMTP Server & Email Sender for {currentEventName()}
              </h2>
              <p style={{ margin: '4px 0 0 0', fontSize: '12.5px', color: 'var(--text-muted)' }}>
                All passwords are encrypted with AES-256-GCM. These credentials will <strong>never</strong> be used for any other event.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                onClick={() => {
                  setTestResult(null);
                  setShowTestModal(true);
                }}
                className="btn btn-outline"
                style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <Sparkles size={15} color="var(--primary-600)" />
                <span>Test Email Configuration</span>
              </button>
            </div>
          </div>

          {emailLoading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
              Loading email configuration for {currentEventName()}...
            </div>
          ) : (
            <form onSubmit={handleSaveEmail} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              {/* Enable Toggle & Sender Display Name */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div className="form-group">
                  <label className="form-label">Sender Display Name *</label>
                  <input
                    type="text"
                    placeholder="e.g. Raas Utsav Operations Team"
                    value={emailForm.sender_name}
                    onChange={(e) => setEmailForm({ ...emailForm, sender_name: e.target.value })}
                    required
                    style={{ width: '100%' }}
                  />
                  <small className="form-help">The name customer sees in their email inbox "From" field.</small>
                </div>

                <div className="form-group">
                  <label className="form-label">Sender Email Address *</label>
                  <input
                    type="email"
                    placeholder="e.g. example@gmail.com"
                    value={emailForm.sender_email}
                    onChange={(e) => {
                      const val = e.target.value;
                      setEmailForm(prev => ({
                        ...prev,
                        sender_email: val,
                        smtp_user: (!prev.smtp_user || prev.smtp_user === prev.sender_email) ? val : prev.smtp_user
                      }));
                    }}
                    required
                    style={{ width: '100%' }}
                  />
                  <small className="form-help">Must match or be authorized by your SMTP server provider.</small>
                </div>
              </div>

              {/* SMTP Server & Port Settings */}
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '20px' }}>
                <div className="form-group">
                  <label className="form-label">SMTP Host Server *</label>
                  <input
                    type="text"
                    placeholder="e.g. smtp.gmail.com, smtp.office365.com, smtp.sendgrid.net"
                    value={emailForm.smtp_host}
                    onChange={(e) => {
                      const val = e.target.value;
                      const isGm = val.toLowerCase().includes('gmail');
                      setEmailForm(prev => ({
                        ...prev,
                        smtp_host: val,
                        smtp_port: isGm ? 465 : prev.smtp_port,
                        smtp_secure: isGm ? true : prev.smtp_secure
                      }));
                    }}
                    required
                    style={{ width: '100%', fontFamily: 'var(--font-mono)' }}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">SMTP Port *</label>
                  <input
                    type="number"
                    placeholder="587 / 465 / 25"
                    value={emailForm.smtp_port}
                    onChange={(e) => setEmailForm({ ...emailForm, smtp_port: e.target.value })}
                    required
                    style={{ width: '100%', fontFamily: 'var(--font-mono)' }}
                  />
                </div>

                <div className="form-group" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <label className="form-label">Security Protocol</label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', marginTop: '6px' }}>
                    <input
                      type="checkbox"
                      checked={emailForm.smtp_secure}
                      onChange={(e) => setEmailForm({ ...emailForm, smtp_secure: e.target.checked })}
                      style={{ width: '16px', height: '16px' }}
                    />
                    <span style={{ fontSize: '13px', fontWeight: 600 }}>SSL / TLS (Port 465)</span>
                  </label>
                </div>
              </div>

              {/* SMTP Credentials (AES-256 Encrypted) */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', padding: '18px 20px', backgroundColor: 'var(--bg-surface-hover)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">SMTP Username / Login Email</label>
                  <input
                    type="text"
                    placeholder="e.g. operations@raasutsav.com"
                    value={emailForm.smtp_user}
                    onChange={(e) => setEmailForm({ ...emailForm, smtp_user: e.target.value })}
                    style={{ width: '100%', fontFamily: 'var(--font-mono)' }}
                  />
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">
                    SMTP Password / App Password
                  </label>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder={emailForm.has_password ? '•••••••• (Saved Encrypted — Type new to change)' : 'Enter SMTP App Password'}
                      value={emailForm.smtp_pass}
                      onChange={(e) => setEmailForm({ ...emailForm, smtp_pass: e.target.value })}
                      style={{ width: '100%', paddingRight: '42px', fontFamily: 'var(--font-mono)' }}
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      title={showPassword ? 'Hide password' : 'Show password'}
                      style={{
                        position: 'absolute',
                        right: '8px',
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '6px',
                        color: showPassword ? 'var(--primary-600)' : 'var(--text-muted)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '6px',
                        transition: 'color 0.2s'
                      }}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  <small className="form-help">
                    {emailForm.has_password ? '🔒 Stored encrypted with AES-256-GCM. Leave blank to retain current password.' : 'Enter your email provider SMTP password or Google App Password.'}
                  </small>
                </div>
              </div>

              {/* Subject Template & Enable Toggle */}
              <div className="form-group">
                <label className="form-label">Email Subject Line Template *</label>
                <input
                  type="text"
                  placeholder="e.g. {eventName} — Official Pass Confirmation & Invoice"
                  value={emailForm.email_subject_template}
                  onChange={(e) => setEmailForm({ ...emailForm, email_subject_template: e.target.value })}
                  required
                  style={{ width: '100%' }}
                />
                <small className="form-help">Available dynamic placeholders: <code>{`{eventName}`}</code>, <code>{`{customerName}`}</code>, <code>{`{billNumber}`}</code></small>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '14px 18px', backgroundColor: emailForm.is_enabled ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.08)', borderRadius: '10px', border: `1px solid ${emailForm.is_enabled ? '#A7F3D0' : '#FECACA'}` }}>
                <input
                  type="checkbox"
                  id="emailEnabledToggle"
                  checked={emailForm.is_enabled}
                  onChange={(e) => setEmailForm({ ...emailForm, is_enabled: e.target.checked })}
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                />
                <label htmlFor="emailEnabledToggle" style={{ cursor: 'pointer', fontSize: '13.5px', fontWeight: 700, color: emailForm.is_enabled ? '#065F46' : '#991B1B' }}>
                  {emailForm.is_enabled ? '✅ Automated Customer Email Delivery is ENABLED for this event' : '⚠️ Email Delivery is DISABLED for this event'}
                </label>
              </div>

              <div className="modal-footer" style={{ marginTop: '10px' }}>
                <button type="submit" disabled={emailSaving} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ShieldCheck size={16} />
                  <span>{emailSaving ? 'Saving Event SMTP Configuration...' : `Save Email Configuration for ${currentEventName()}`}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* TAB 2: WhatsApp Delivery Settings */}
      {activeTab === 'whatsapp' && (
        <div className="card" style={{ padding: '28px 32px' }}>
          <div style={{ marginBottom: '22px' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 800, margin: 0 }}>
              💬 WhatsApp Delivery & Message Templates for {currentEventName()}
            </h2>
            <p style={{ margin: '4px 0 0 0', fontSize: '12.5px', color: 'var(--text-muted)' }}>
              Configure WhatsApp web deep links or Cloud API credentials to dispatch passes and bills to customer phones.
            </p>
          </div>

          {whatsappLoading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
              Loading WhatsApp settings...
            </div>
          ) : (
            <form onSubmit={handleSaveWhatsapp} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div className="form-group">
                  <label className="form-label">WhatsApp Delivery Provider</label>
                  <select
                    value={whatsappForm.provider}
                    onChange={(e) => setWhatsappForm({ ...whatsappForm, provider: e.target.value })}
                    style={{ width: '100%' }}
                  >
                    <option value="WHATSAPP_LINK">📱 WhatsApp Direct Share Link (Universal & Free)</option>
                    <option value="META_CLOUD_API">☁️ Meta WhatsApp Cloud API (Automated)</option>
                    <option value="TWILIO">📞 Twilio WhatsApp Messaging</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Phone Number ID / Sender Number</label>
                  <input
                    type="text"
                    placeholder="e.g. +91 98765 43210"
                    value={whatsappForm.phone_number_id}
                    onChange={(e) => setWhatsappForm({ ...whatsappForm, phone_number_id: e.target.value })}
                    style={{ width: '100%' }}
                  />
                </div>
              </div>

              {whatsappForm.provider !== 'WHATSAPP_LINK' && (
                <div className="form-group">
                  <label className="form-label">API Access Token / Secret (Encrypted)</label>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <input
                      type={showToken ? 'text' : 'password'}
                      placeholder={whatsappForm.has_token ? '•••••••• (Saved Encrypted — Type new to change)' : 'Enter WhatsApp API Token'}
                      value={whatsappForm.access_token}
                      onChange={(e) => setWhatsappForm({ ...whatsappForm, access_token: e.target.value })}
                      style={{ width: '100%', paddingRight: '42px', fontFamily: 'var(--font-mono)' }}
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowToken(!showToken)}
                      title={showToken ? 'Hide token' : 'Show token'}
                      style={{
                        position: 'absolute',
                        right: '8px',
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '6px',
                        color: showToken ? 'var(--primary-600)' : 'var(--text-muted)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '6px',
                        transition: 'color 0.2s'
                      }}
                    >
                      {showToken ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  <small className="form-help">
                    {whatsappForm.has_token ? '🔒 Stored encrypted with AES-256-GCM. Leave blank to retain current token.' : 'Enter your WhatsApp Cloud API or Twilio auth token.'}
                  </small>
                </div>
              )}

              <div className="form-group">
                <label className="form-label">WhatsApp Message Template *</label>
                <textarea
                  rows={5}
                  value={whatsappForm.custom_message_template}
                  onChange={(e) => setWhatsappForm({ ...whatsappForm, custom_message_template: e.target.value })}
                  required
                  style={{ width: '100%', fontFamily: 'var(--font-mono)', fontSize: '13px' }}
                />
                <small className="form-help">
                  Placeholders: <code>{`{customerName}`}</code>, <code>{`{eventName}`}</code>, <code>{`{passCodes}`}</code>, <code>{`{totalAmount}`}</code>, <code>{`{passPdfUrl}`}</code>, <code>{`{billPdfUrl}`}</code>
                </small>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '14px 18px', backgroundColor: whatsappForm.is_enabled ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.08)', borderRadius: '10px', border: `1px solid ${whatsappForm.is_enabled ? '#A7F3D0' : '#FECACA'}` }}>
                <input
                  type="checkbox"
                  id="waEnabledToggle"
                  checked={whatsappForm.is_enabled}
                  onChange={(e) => setWhatsappForm({ ...whatsappForm, is_enabled: e.target.checked })}
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                />
                <label htmlFor="waEnabledToggle" style={{ cursor: 'pointer', fontSize: '13.5px', fontWeight: 700, color: whatsappForm.is_enabled ? '#065F46' : '#991B1B' }}>
                  {whatsappForm.is_enabled ? '✅ WhatsApp Delivery Option is ENABLED in Customer Billing' : '⚠️ WhatsApp Delivery is DISABLED'}
                </label>
              </div>

              <div className="modal-footer" style={{ marginTop: '10px' }}>
                <button type="submit" disabled={whatsappSaving} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ShieldCheck size={16} />
                  <span>{whatsappSaving ? 'Saving WhatsApp Settings...' : `Save WhatsApp Configuration`}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* TAB 3: Delivery Logs */}
      {activeTab === 'logs' && (
        <div className="card" style={{ padding: '24px 28px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h2 style={{ fontSize: '16px', fontWeight: 800, margin: 0 }}>
                📊 Recent Delivery Logs for {currentEventName()}
              </h2>
              <p style={{ margin: '4px 0 0 0', fontSize: '12.5px', color: 'var(--text-muted)' }}>
                Real-time audit history of customer emails and WhatsApp dispatches for this event.
              </p>
            </div>
            <button onClick={() => fetchDeliveryLogs(activeEventId)} className="btn btn-outline btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <RefreshCw size={14} />
              <span>Refresh Logs</span>
            </button>
          </div>

          {logsLoading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
              Loading delivery logs...
            </div>
          ) : logs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
              No delivery logs recorded for this event yet.
            </div>
          ) : (
            <div style={{ overflowX: 'auto', border: '1px solid var(--border-color)', borderRadius: '10px', backgroundColor: 'var(--bg-surface)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ backgroundColor: 'var(--bg-surface-hover)', borderBottom: '1px solid var(--border-color)' }}>
                    <th style={{ width: '85px', minWidth: '85px', whiteSpace: 'nowrap', padding: '14px 18px', textAlign: 'left', fontWeight: 700, color: 'var(--text-secondary)' }}>Log ID</th>
                    <th style={{ width: '130px', minWidth: '130px', whiteSpace: 'nowrap', padding: '14px 18px', textAlign: 'left', fontWeight: 700, color: 'var(--text-secondary)' }}>Channel</th>
                    <th style={{ width: '220px', minWidth: '220px', whiteSpace: 'nowrap', padding: '14px 18px', textAlign: 'left', fontWeight: 700, color: 'var(--text-secondary)' }}>Recipient</th>
                    <th style={{ width: '140px', minWidth: '140px', whiteSpace: 'nowrap', padding: '14px 18px', textAlign: 'left', fontWeight: 700, color: 'var(--text-secondary)' }}>Status</th>
                    <th style={{ minWidth: '280px', padding: '14px 20px', textAlign: 'left', fontWeight: 700, color: 'var(--text-secondary)' }}>Message / Error</th>
                    <th style={{ width: '170px', minWidth: '170px', whiteSpace: 'nowrap', padding: '14px 18px', textAlign: 'left', fontWeight: 700, color: 'var(--text-secondary)' }}>Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map(log => (
                    <tr key={log.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '14px 18px', fontFamily: 'var(--font-mono)', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                        #{log.id}
                      </td>
                      <td style={{ padding: '14px 18px', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          padding: '4px 10px',
                          borderRadius: '16px',
                          fontSize: '11.5px',
                          fontWeight: 600,
                          lineHeight: 1.2,
                          whiteSpace: 'nowrap',
                          backgroundColor: log.channel === 'EMAIL' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                          color: log.channel === 'EMAIL' ? 'var(--primary-600)' : '#059669',
                          border: `1px solid ${log.channel === 'EMAIL' ? 'rgba(59, 130, 246, 0.25)' : 'rgba(16, 185, 129, 0.25)'}`
                        }}>
                          {log.channel === 'EMAIL' ? '📧 EMAIL' : '💬 WHATSAPP'}
                        </span>
                      </td>
                      <td style={{ padding: '14px 18px', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                        <strong>{log.recipient}</strong>
                      </td>
                      <td style={{ padding: '14px 18px', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          padding: '4px 10px',
                          borderRadius: '16px',
                          fontSize: '11.5px',
                          fontWeight: 600,
                          lineHeight: 1.2,
                          whiteSpace: 'nowrap',
                          backgroundColor: log.status === 'SUCCESS' ? 'rgba(16, 185, 129, 0.1)' : (log.status === 'PENDING' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(239, 68, 68, 0.1)'),
                          color: log.status === 'SUCCESS' ? '#059669' : (log.status === 'PENDING' ? '#D97706' : '#DC2626'),
                          border: `1px solid ${log.status === 'SUCCESS' ? 'rgba(16, 185, 129, 0.25)' : (log.status === 'PENDING' ? 'rgba(245, 158, 11, 0.25)' : 'rgba(239, 68, 68, 0.25)')}`
                        }}>
                          {log.status === 'SUCCESS' ? '✓ DISPATCHED' : (log.status === 'PENDING' ? '⏳ PENDING' : '✕ FAILED')}
                        </span>
                      </td>
                      <td style={{ padding: '14px 20px', verticalAlign: 'middle' }}>
                        <div style={{
                          fontSize: '12px',
                          color: log.status === 'FAILED' ? '#DC2626' : 'var(--text-muted)',
                          lineHeight: '1.45',
                          wordBreak: 'break-word',
                          maxWidth: '420px'
                        }}>
                          {log.error_message || log.message_id || 'Delivered with Pass & Invoice PDFs'}
                        </div>
                      </td>
                      <td style={{ padding: '14px 18px', color: 'var(--text-muted)', fontSize: '12px', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                        {new Date(log.created_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Test Email Modal */}
      <Modal
        isOpen={showTestModal}
        onClose={() => setShowTestModal(false)}
        title={`🧪 Test SMTP Email Configuration — ${currentEventName()}`}
        maxWidth="640px"
      >
        <form onSubmit={handleRunTestEmail} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div style={{ padding: '14px', backgroundColor: 'rgba(59, 130, 246, 0.08)', borderRadius: '10px', border: '1px solid #BFDBFE', fontSize: '13px', color: '#1E40AF' }}>
            This diagnostic tool will connect to <strong>{emailForm.smtp_host || 'SMTP Server'}</strong> as <strong>{emailForm.sender_name || 'Sender'}</strong>, dynamically generate a sample <strong>Pass PDF</strong> (with barcode) and <strong>Tax Invoice PDF</strong>, and deliver them to your test inbox.
          </div>

          <div className="form-group">
            <label className="form-label">Test Recipient Email Address *</label>
            <input
              type="email"
              placeholder="e.g. yourname@example.com"
              value={testRecipient}
              onChange={(e) => setTestRecipient(e.target.value)}
              required
              style={{ width: '100%' }}
            />
          </div>

          {testResult && (
            <div style={{ padding: '14px', borderRadius: '10px', border: `1px solid ${testResult.success ? '#A7F3D0' : '#FECACA'}`, backgroundColor: testResult.success ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.08)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 800, color: testResult.success ? '#065F46' : '#991B1B', fontSize: '13.5px' }}>
                {testResult.success ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                <span>{testResult.success ? 'Test Email Succeeded!' : 'Test Email Failed'}</span>
              </div>
              <p style={{ margin: '6px 0 0 0', fontSize: '12.5px', color: testResult.success ? '#047857' : '#B91C1C' }}>
                {testResult.message}
              </p>
              {testResult.details?.attachments && (
                <div style={{ marginTop: '8px', fontSize: '12px', color: '#065F46' }}>
                  ✓ Attachments Included: <strong>{testResult.details.attachments.join(', ')}</strong>
                </div>
              )}
            </div>
          )}

          <div className="modal-footer">
            <button type="button" onClick={() => setShowTestModal(false)} className="btn btn-secondary">
              Close
            </button>
            <button type="submit" disabled={testingEmail} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Send size={15} />
              <span>{testingEmail ? 'Connecting to SMTP & Sending...' : 'Send Test Email Now'}</span>
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
