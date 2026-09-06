import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  User,
  Mail,
  Phone,
  Tag,
  Palette,
  DollarSign,
  Percent,
  CheckCircle2,
  FileText,
  Send,
  Download,
  Share2,
  Sparkles,
  Eye,
  RefreshCw,
  Clock,
  Printer,
  Barcode,
  Building2,
  MessageCircle,
  HelpCircle,
  Check,
  AlertTriangle,
  Loader2
} from 'lucide-react';
import { api } from '../services/api';
import { useEvent } from '../context/EventContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Modal from '../components/Modal';
import Badge from '../components/Badge';
import { formatDateTimeIST, formatDateIST } from '../utils/dateUtil';

export default function CustomerBilling() {
  const { user, isSuperAdmin, hasPermission } = useAuth();
  const { events, selectedEvent } = useEvent();
  const toast = useToast();

  const [activeTab, setActiveTab] = useState('new_bill'); // 'new_bill' | 'history'

  // Form State
  const [eventId, setEventId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [styleId, setStyleId] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [sponsorName, setSponsorName] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [unitPrice, setUnitPrice] = useState(0);
  const [gstMode, setGstMode] = useState('INCLUDED'); // 'INCLUDED' | 'EXCLUDED' | 'OFF'
  const [gstRate, setGstRate] = useState(18);
  const [includePassCodeOnBill, setIncludePassCodeOnBill] = useState(true);

  // Send & Custom Email Sender Configuration
  const [sendVia, setSendVia] = useState('EMAIL'); // 'EMAIL' | 'WHATSAPP' | 'BOTH' | 'NONE'
  const [senderName, setSenderName] = useState('');
  const [senderEmail, setSenderEmail] = useState('');
  const [emailSubject, setEmailSubject] = useState('');

  // Data Options
  const [categories, setCategories] = useState([]);
  const [styles, setStyles] = useState([]);
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Preview & Confirmation Modal State
  const [previewLoading, setPreviewLoading] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [passPdfUrl, setPassPdfUrl] = useState(null);
  const [billPdfUrl, setBillPdfUrl] = useState(null);
  const [issuing, setIssuing] = useState(false);

  // Success Result & Delivery State
  const [issuedResult, setIssuedResult] = useState(null);
  const [retrying, setRetrying] = useState(false);

  // Issue Progress Tracking Modal State
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [progressStep, setProgressStep] = useState(1); // 1: Allocating, 2: Pass PDFs, 3: Invoice, 4: Dispatching, 5: Complete
  const [progressPercent, setProgressPercent] = useState(0);
  const [progressStatusText, setProgressStatusText] = useState('');
  const [progressError, setProgressError] = useState(null);

  // Convert Base64 strings to Blob URLs for high performance & unlimited size PDF rendering
  useEffect(() => {
    if (previewData?.passPdfBase64) {
      try {
        const byteCharacters = atob(previewData.passPdfBase64);
        const byteNumbers = new Uint8Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const blob = new Blob([byteNumbers], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        setPassPdfUrl(url);
        return () => URL.revokeObjectURL(url);
      } catch (e) {
        console.error('Error creating pass pdf blob:', e);
      }
    } else {
      setPassPdfUrl(null);
    }
  }, [previewData?.passPdfBase64]);

  useEffect(() => {
    if (previewData?.billPdfBase64) {
      try {
        const byteCharacters = atob(previewData.billPdfBase64);
        const byteNumbers = new Uint8Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const blob = new Blob([byteNumbers], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        setBillPdfUrl(url);
        return () => URL.revokeObjectURL(url);
      } catch (e) {
        console.error('Error creating bill pdf blob:', e);
      }
    } else {
      setBillPdfUrl(null);
    }
  }, [previewData?.billPdfBase64]);

  // 1. Fetch Categories & Styles for selected event
  const fetchOptions = async () => {
    try {
      const targetEventId = selectedEvent?.id || (events[0]?.id || 1);
      const [catRes, styleRes] = await Promise.allSettled([
        api.get(`/categories?eventId=${targetEventId}`),
        api.get(`/pass-styles?eventId=${targetEventId}`)
      ]);

      if (catRes.status === 'fulfilled' && catRes.value?.success) {
        const catList = catRes.value.data || [];
        setCategories(catList);
        if (catList.length > 0) {
          setCategoryId(String(catList[0].id));
          setUnitPrice(parseFloat(catList[0].price || 0));
        } else {
          setCategoryId('');
          setUnitPrice(0);
        }
      }

      if (styleRes.status === 'fulfilled' && styleRes.value?.success) {
        const styleList = styleRes.value.data || [];
        setStyles(styleList);
        const defaultStyle = styleList.find(s => s.is_default) || styleList[0];
        if (defaultStyle) {
          setStyleId(String(defaultStyle.id));
        } else {
          setStyleId('');
        }
      }
    } catch (err) {
      // Ignore
    }
  };

  const fetchHistory = async () => {
    setHistoryLoading(true);
    try {
      const url = selectedEvent ? `/billing/history?eventId=${selectedEvent.id}` : '/billing/history';
      const res = await api.get(url);
      if (res.success) {
        setHistory(res.billings || []);
      }
    } catch (err) {
      toast.error('Failed to load billing history');
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    const evId = selectedEvent ? String(selectedEvent.id) : (events[0] ? String(events[0].id) : '1');
    setEventId(evId);
    setSenderName(user?.name || 'Event Operations Team');
    setSenderEmail(user?.email || 'admin@eventgen.duckdns.org');
    fetchOptions();
    if (activeTab === 'history') fetchHistory();
  }, [selectedEvent, activeTab]);

  // When category selection changes, update default price
  const handleCategoryChange = (catId) => {
    setCategoryId(catId);
    const cat = categories.find(c => String(c.id) === String(catId));
    if (cat) {
      setUnitPrice(parseFloat(cat.price || 0));
    }
  };

  // 2. GST Calculation Breakdown
  const calculateTotals = () => {
    const qty = Math.max(1, parseInt(quantity, 10) || 1);
    const price = Math.max(0, parseFloat(unitPrice) || 0);
    const rate = Math.max(0, parseFloat(gstRate) || 18);
    const rawTotal = price * qty;

    if (gstMode === 'INCLUDED') {
      const base = rawTotal / (1 + rate / 100);
      const sub = Math.round(base * 100) / 100;
      const gst = Math.round((rawTotal - sub) * 100) / 100;
      return { subtotal: sub, gstAmount: gst, total: rawTotal };
    } else if (gstMode === 'EXCLUDED') {
      const gst = Math.round((rawTotal * (rate / 100)) * 100) / 100;
      const total = Math.round((rawTotal + gst) * 100) / 100;
      return { subtotal: rawTotal, gstAmount: gst, total };
    } else {
      return { subtotal: rawTotal, gstAmount: 0, total: rawTotal };
    }
  };

  const totals = calculateTotals();

  // 3. Open Preview Confirmation Modal
  const handleOpenPreview = async (e) => {
    e.preventDefault();
    if (!customerName.trim()) {
      toast.warning('Customer name is required');
      return;
    }
    if (!categoryId) {
      toast.warning('Please select a pass category');
      return;
    }

    setPreviewLoading(true);
    try {
      const res = await api.post('/billing/preview', {
        eventId: parseInt(eventId, 10),
        categoryId: parseInt(categoryId, 10),
        styleId: styleId ? parseInt(styleId, 10) : null,
        customerName: customerName.trim(),
        customerEmail: customerEmail.trim() || undefined,
        customerPhone: customerPhone.trim() || undefined,
        sponsorName: sponsorName.trim() || undefined,
        quantity: parseInt(quantity, 10) || 1,
        unitPrice: parseFloat(unitPrice) || 0,
        gstMode,
        gstRate,
        includePassCodeOnBill
      });

      if (res.success) {
        setPreviewData(res);
        setShowPreviewModal(true);
      }
    } catch (err) {
      toast.error(err.message || 'Failed to generate preview');
    } finally {
      setPreviewLoading(false);
    }
  };

  // 4. Final Confirm & Issue Passes with Live Multi-Step Progress UI
  const handleConfirmAndIssue = async () => {
    setShowPreviewModal(false);
    setShowProgressModal(true);
    setProgressError(null);
    setProgressStep(1);
    setProgressPercent(15);
    const qtyNum = parseInt(quantity, 10) || 1;
    setProgressStatusText(`Step 1/4: Allocating and signing ${qtyNum} unique pass code(s) with HMAC-SHA256...`);

    const timer1 = setTimeout(() => {
      setProgressStep(2);
      setProgressPercent(45);
      setProgressStatusText(`Step 2/4: Generating ${qtyNum} styled Pass PDF(s) with scannable QR/barcodes...`);
    }, 450);

    const timer2 = setTimeout(() => {
      setProgressStep(3);
      setProgressPercent(75);
      setProgressStatusText('Step 3/4: Generating itemized Tax Invoice Bill PDF...');
    }, 950);

    const timer3 = setTimeout(() => {
      setProgressStep(4);
      setProgressPercent(90);
      setProgressStatusText(
        sendVia === 'EMAIL' || sendVia === 'BOTH'
          ? `Step 4/4: Attaching ${qtyNum} Pass PDF(s) & sending email to ${customerEmail || 'recipient'}...`
          : (sendVia === 'WHATSAPP' ? 'Step 4/4: Generating secure WhatsApp delivery bundle...' : 'Step 4/4: Finalizing pass inventory & download bundle...')
      );
    }, 1500);

    setIssuing(true);
    try {
      const res = await api.post('/billing/issue-and-send', {
        eventId: parseInt(eventId, 10),
        categoryId: parseInt(categoryId, 10),
        styleId: styleId ? parseInt(styleId, 10) : null,
        customerName: customerName.trim(),
        customerEmail: customerEmail.trim() || undefined,
        customerPhone: customerPhone.trim() || undefined,
        sponsorName: sponsorName.trim() || undefined,
        quantity: qtyNum,
        unitPrice: parseFloat(unitPrice) || 0,
        gstMode,
        gstRate,
        includePassCodeOnBill,
        sendVia,
        senderName,
        senderEmail,
        emailSubject
      });

      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);

      if (res.success) {
        setProgressStep(5);
        setProgressPercent(100);
        setProgressStatusText(`Complete! All ${res.passes?.length || qtyNum} passes generated and packaged successfully.`);

        setTimeout(() => {
          setShowProgressModal(false);
          setIssuedResult(res);
          toast.success(`Successfully issued ${res.passes?.length || qtyNum} pass(es)!`);
          // Reset form fields
          setCustomerName('');
          setCustomerEmail('');
          setCustomerPhone('');
          setSponsorName('');
          setQuantity(1);
          if (activeTab === 'history') fetchHistory();
        }, 650);
      }
    } catch (err) {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      setProgressError(err.message || 'Failed to issue passes');
      toast.error(err.message || 'Failed to issue passes');
    } finally {
      setIssuing(false);
    }
  };

  // Retry failed delivery for issued billing record without re-creating passes
  const handleRetryDelivery = async (billingId) => {
    if (!billingId) return;
    setRetrying(true);
    try {
      const res = await api.post(`/billing/${billingId}/resend-delivery`, {
        sendVia: sendVia === 'NONE' ? 'EMAIL' : sendVia,
        recipientEmail: customerEmail || undefined,
        recipientPhone: customerPhone || undefined,
        emailSubject
      });

      if (res.success) {
        toast.success('Passes & Bill delivery re-sent successfully!');
        if (issuedResult) {
          setIssuedResult(prev => ({
            ...prev,
            emailSent: res.emailDelivery?.status === 'SENT',
            emailDelivery: res.emailDelivery,
            whatsappDelivery: res.whatsappDelivery,
            whatsappUrl: res.whatsappUrl || prev?.whatsappUrl
          }));
        }
      }
    } catch (err) {
      toast.error(err.message || 'Failed to resend delivery');
    } finally {
      setRetrying(false);
    }
  };

  const handleDownloadPdf = (base64Data, filename) => {
    if (!base64Data) {
      toast.warning('PDF data not available for download');
      return;
    }
    const link = document.createElement('a');
    link.href = `data:application/pdf;base64,${base64Data}`;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={{ padding: '24px 32px', maxWidth: '1440px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800 }}>Customer Billing & Styled Pass Issuance</h1>
          <p style={{ fontSize: '13.5px', color: 'var(--text-muted)' }}>
            Issue branded customer passes with dynamic barcodes, compute GST tax invoices, and dispatch via Email & WhatsApp
            {selectedEvent && <span> for <strong>{selectedEvent.event_name}</strong></span>}
          </p>
        </div>

        {/* Navigation Tabs */}
        <div style={{ display: 'flex', gap: '8px', backgroundColor: 'var(--bg-subtle, #F1F5F9)', padding: '4px', borderRadius: '8px' }}>
          <button
            onClick={() => setActiveTab('new_bill')}
            className={`btn btn-sm ${activeTab === 'new_bill' ? 'btn-primary' : 'btn-ghost'}`}
          >
            <CreditCard size={15} />
            <span>New Sale & Issue</span>
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`btn btn-sm ${activeTab === 'history' ? 'btn-primary' : 'btn-ghost'}`}
          >
            <Clock size={15} />
            <span>Billing History</span>
          </button>
        </div>
      </div>

      {activeTab === 'new_bill' ? (
        <form onSubmit={handleOpenPreview} style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '24px' }}>
          {/* Left Form: Customer, Event, Pricing & GST */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Section 1: Customer Details */}
            <div className="card" style={{ padding: '20px' }}>
              <div style={{ fontSize: '15px', fontWeight: 800, marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <User size={18} color="var(--primary-600)" />
                <span>1. Customer & Buyer Information</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, marginBottom: '4px' }}>
                    Customer / Buyer Full Name *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Aarav Sharma, TechCorp Delegation"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    required
                    style={{ width: '100%' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, marginBottom: '4px' }}>
                    Email Address (For PDF Delivery)
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="email"
                      placeholder="e.g. customer@example.com"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      style={{ width: '100%' }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, marginBottom: '4px' }}>
                    WhatsApp / Mobile Number
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. +91 98765 43210"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    style={{ width: '100%' }}
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Pass Tier & Visual Style */}
            <div className="card" style={{ padding: '20px' }}>
              <div style={{ fontSize: '15px', fontWeight: 800, marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Palette size={18} color="var(--primary-600)" />
                <span>2. Select Category & Pass Design Style</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, marginBottom: '4px' }}>
                    Pass Category / Tier *
                  </label>
                  <select
                    value={categoryId}
                    onChange={(e) => handleCategoryChange(e.target.value)}
                    required
                    style={{ width: '100%' }}
                  >
                    {categories.length === 0 && (
                      <option value="">No categories available for this event</option>
                    )}
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.code}) — ₹{parseFloat(c.price || 0).toFixed(2)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, marginBottom: '4px' }}>
                    Pass Style / Template Design *
                  </label>
                  <select
                    value={styleId}
                    onChange={(e) => setStyleId(e.target.value)}
                    style={{ width: '100%' }}
                  >
                    {styles.length === 0 && (
                      <option value="">Standard Default Template</option>
                    )}
                    {styles.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.name} {s.is_default ? '★ (Default)' : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Section 3: Pricing, GST & Sponsor Customization */}
            <div className="card" style={{ padding: '20px' }}>
              <div style={{ fontSize: '15px', fontWeight: 800, marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <DollarSign size={18} color="var(--primary-600)" />
                <span>3. Pricing, GST Mode & Sponsor Options</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, marginBottom: '4px' }}>
                    Quantity (Passes to Generate) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    required
                    style={{ width: '100%' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, marginBottom: '4px' }}>
                    Unit Selling Price (₹) — Manual Override
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={unitPrice}
                    onChange={(e) => setUnitPrice(e.target.value)}
                    required
                    style={{ width: '100%', fontWeight: 700 }}
                  />
                </div>
              </div>

              {/* GST Radio Selector */}
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, marginBottom: '6px' }}>
                  GST Tax Mode *
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                  {[
                    { mode: 'INCLUDED', label: 'GST Included', desc: 'Price includes 18% GST' },
                    { mode: 'EXCLUDED', label: 'GST Excluded', desc: 'Add +18% on top of base' },
                    { mode: 'OFF', label: 'GST OFF (0%)', desc: 'Exempt / No tax added' }
                  ].map(item => (
                    <label
                      key={item.mode}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '2px',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        border: gstMode === item.mode ? '2px solid var(--primary-600)' : '1px solid #CBD5E1',
                        backgroundColor: gstMode === item.mode ? '#EFF6FF' : '#FFFFFF',
                        cursor: 'pointer'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 700 }}>
                        <input
                          type="radio"
                          name="gstMode"
                          value={item.mode}
                          checked={gstMode === item.mode}
                          onChange={() => setGstMode(item.mode)}
                        />
                        <span>{item.label}</span>
                      </div>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginLeft: '20px' }}>{item.desc}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Sponsor & Pass Code Options */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', borderTop: '1px solid #E2E8F0', paddingTop: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, marginBottom: '4px' }}>
                    Sponsor Name (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. RedBull, Tata Consultancy"
                    value={sponsorName}
                    onChange={(e) => setSponsorName(e.target.value)}
                    style={{ width: '100%' }}
                  />
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>If entered, sponsor tag is printed on pass and bill.</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}>
                    <input
                      type="checkbox"
                      checked={includePassCodeOnBill}
                      onChange={(e) => setIncludePassCodeOnBill(e.target.checked)}
                      style={{ width: '16px', height: '16px' }}
                    />
                    <span>Include Pass Code(s) on Bill PDF</span>
                  </label>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginLeft: '24px' }}>
                    Lists the generated 7-character security codes directly on the tax invoice.
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Summary & Dispatch Settings Panel */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Calculation Card */}
            <div className="card" style={{ padding: '20px', backgroundColor: '#0F172A', color: '#FFFFFF' }}>
              <div style={{ fontSize: '15px', fontWeight: 800, marginBottom: '14px', color: '#60A5FA' }}>
                Invoice Summary Breakdown
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13.5px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#CBD5E1' }}>
                  <span>Base Subtotal:</span>
                  <span style={{ fontWeight: 600 }}>₹{totals.subtotal.toFixed(2)}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#CBD5E1' }}>
                  <span>GST ({gstMode === 'OFF' ? '0%' : '18%'}):</span>
                  <span style={{ fontWeight: 600, color: gstMode === 'OFF' ? '#94A3B8' : '#F59E0B' }}>
                    ₹{totals.gstAmount.toFixed(2)}
                  </span>
                </div>

                <div style={{ borderTop: '1px solid #334155', margin: '4px 0' }} />

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '18px', fontWeight: 800 }}>
                  <span style={{ color: '#FFFFFF' }}>Total Amount:</span>
                  <span style={{ color: '#34D399' }}>₹{totals.total.toFixed(2)}</span>
                </div>
              </div>

              <div style={{ marginTop: '16px', fontSize: '11px', color: '#94A3B8', backgroundColor: '#1E293B', padding: '10px', borderRadius: '6px' }}>
                💡 Mode: <strong>{gstMode}</strong> ({gstMode === 'INCLUDED' ? 'Tax extracted from final price' : (gstMode === 'EXCLUDED' ? 'Tax added on top of unit rate' : 'Tax exempt')})
              </div>
            </div>

            {/* Section 4: Email & WhatsApp Dispatch Configuration */}
            <div className="card" style={{ padding: '20px' }}>
              <div style={{ fontSize: '15px', fontWeight: 800, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Send size={18} color="var(--primary-600)" />
                <span>4. Delivery & Dispatch Options</span>
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px' }}>
                  Send Output Via:
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  {[
                    { mode: 'EMAIL', label: 'Email Only', icon: Mail },
                    { mode: 'WHATSAPP', label: 'WhatsApp', icon: MessageCircle },
                    { mode: 'BOTH', label: 'Both Channels', icon: Sparkles },
                    { mode: 'NONE', label: 'Download Only', icon: Download }
                  ].map(ch => {
                    const Icon = ch.icon;
                    return (
                      <button
                        key={ch.mode}
                        type="button"
                        onClick={() => setSendVia(ch.mode)}
                        className={`btn btn-sm ${sendVia === ch.mode ? 'btn-primary' : 'btn-outline'}`}
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                      >
                        <Icon size={14} />
                        <span>{ch.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Admin Email Configuration */}
              {(sendVia === 'EMAIL' || sendVia === 'BOTH') && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', backgroundColor: '#F8FAFC', padding: '12px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)' }}>
                    Admin Sender Branding:
                  </div>

                  <div>
                    <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)' }}>Sender Display Name</label>
                    <input
                      type="text"
                      value={senderName}
                      onChange={(e) => setSenderName(e.target.value)}
                      placeholder="e.g. Expo Operations Team"
                      style={{ width: '100%', fontSize: '12px' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)' }}>Email Subject Heading</label>
                    <input
                      type="text"
                      value={emailSubject}
                      onChange={(e) => setEmailSubject(e.target.value)}
                      placeholder="e.g. Your Official Entry Pass & Tax Invoice"
                      style={{ width: '100%', fontSize: '12px' }}
                    />
                  </div>
                </div>
              )}

              {/* Generate & Preview Action Button */}
              <button
                type="submit"
                className="btn btn-primary"
                disabled={previewLoading}
                style={{ width: '100%', marginTop: '16px', padding: '12px', fontSize: '14px', fontWeight: 800 }}
              >
                <Eye size={18} />
                <span>{previewLoading ? 'Generating Previews...' : 'Preview Pass & Bill Before Sending'}</span>
              </button>
            </div>
          </div>
        </form>
      ) : (
        /* Tab 2: Billing History */
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Invoice #</th>
                  <th>Customer Name</th>
                  <th>Contact Info</th>
                  <th>Tier / Category</th>
                  <th>Passes Qty</th>
                  <th>GST Status</th>
                  <th>Total Amount</th>
                  <th>Issued Date</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {historyLoading ? (
                  <tr>
                    <td colSpan={9} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                      Loading billing history...
                    </td>
                  </tr>
                ) : history.length === 0 ? (
                  <tr>
                    <td colSpan={9} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                      No customer billing records found for this view.
                    </td>
                  </tr>
                ) : (
                  history.map(b => (
                    <tr key={b.id}>
                      <td>
                        <span style={{ fontWeight: 700, fontFamily: 'monospace', color: 'var(--primary-600)' }}>
                          {b.bill_number}
                        </span>
                      </td>
                      <td>
                        <div style={{ fontWeight: 700 }}>{b.customer_name}</div>
                        {b.sponsor_name && (
                          <div style={{ fontSize: '11px', color: '#D97706' }}>★ {b.sponsor_name}</div>
                        )}
                      </td>
                      <td>
                        <div style={{ fontSize: '12px' }}>{b.customer_email || '—'}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{b.customer_phone || '—'}</div>
                      </td>
                      <td>{b.category_name}</td>
                      <td>
                        <span style={{ fontWeight: 700 }}>{b.quantity} pass(es)</span>
                      </td>
                      <td>
                        <Badge variant={b.gst_mode === 'INCLUDED' ? 'success' : (b.gst_mode === 'EXCLUDED' ? 'info' : 'secondary')}>
                          {b.gst_mode}
                        </Badge>
                      </td>
                      <td>
                        <strong style={{ color: 'var(--success-accent, #047857)' }}>
                          ₹{parseFloat(b.total_amount).toFixed(2)}
                        </strong>
                      </td>
                      <td>
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                          {formatDateTimeIST(b.created_at)}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                          <a
                            href={`http://localhost:5006/api/billing/${b.id}/download-pass`}
                            target="_blank"
                            rel="noreferrer"
                            className="btn btn-outline btn-sm btn-icon"
                            title="Download Pass PDF"
                          >
                            <Ticket size={14} />
                          </a>
                          <a
                            href={`http://localhost:5006/api/billing/${b.id}/download-bill`}
                            target="_blank"
                            rel="noreferrer"
                            className="btn btn-outline btn-sm btn-icon"
                            title="Download Bill PDF"
                          >
                            <FileText size={14} />
                          </a>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Live Preview & Confirmation Modal */}
      {previewData && (
        <Modal
          isOpen={showPreviewModal}
          onClose={() => setShowPreviewModal(false)}
          title="🔍 Review Pass & Bill Previews Before Issuing"
          maxWidth="1100px"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ padding: '12px 16px', backgroundColor: '#EFF6FF', borderRadius: '8px', border: '1px solid #BFDBFE', fontSize: '13px', color: '#1D4ED8' }}>
              ✓ Verify all customer details, GST calculations, and visual barcode layout below. Click <strong>Confirm & Issue Passes</strong> to generate unique security codes and dispatch files.
            </div>

            {/* Side by Side Previews */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              {/* Pass PDF Preview */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ fontSize: '13.5px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Sparkles size={16} color="#3B82F6" />
                    <span>Pass PDF Live Preview</span>
                  </div>
                  {passPdfUrl && (
                    <a href={passPdfUrl} target="_blank" rel="noreferrer" style={{ fontSize: '11.5px', color: 'var(--primary-600)', textDecoration: 'underline' }}>
                      Open Full View ↗
                    </a>
                  )}
                </div>
                <div style={{ height: '440px', borderRadius: '10px', border: '1px solid #CBD5E1', overflow: 'hidden', backgroundColor: '#334155' }}>
                  {passPdfUrl ? (
                    <iframe
                      src={`${passPdfUrl}#toolbar=0&navpanes=0&scrollbar=0`}
                      title="Pass PDF Preview"
                      style={{ width: '100%', height: '100%', border: 'none' }}
                    />
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#94A3B8' }}>
                      Loading Pass PDF...
                    </div>
                  )}
                </div>
              </div>

              {/* Bill PDF Preview */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ fontSize: '13.5px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <FileText size={16} color="#10B981" />
                    <span>Tax Invoice Bill Live Preview</span>
                  </div>
                  {billPdfUrl && (
                    <a href={billPdfUrl} target="_blank" rel="noreferrer" style={{ fontSize: '11.5px', color: 'var(--primary-600)', textDecoration: 'underline' }}>
                      Open Full View ↗
                    </a>
                  )}
                </div>
                <div style={{ height: '440px', borderRadius: '10px', border: '1px solid #CBD5E1', overflow: 'hidden', backgroundColor: '#334155' }}>
                  {billPdfUrl ? (
                    <iframe
                      src={`${billPdfUrl}#toolbar=0&navpanes=0&scrollbar=0`}
                      title="Bill PDF Preview"
                      style={{ width: '100%', height: '100%', border: 'none' }}
                    />
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#94A3B8' }}>
                      Loading Bill PDF...
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px', borderTop: '1px solid var(--border-color)', paddingTop: '14px' }}>
              <button onClick={() => setShowPreviewModal(false)} className="btn btn-outline" disabled={issuing}>
                Back / Edit Details
              </button>
              <button onClick={handleConfirmAndIssue} className="btn btn-primary" disabled={issuing}>
                <CheckCircle2 size={16} />
                <span>{issuing ? 'Generating Security Codes & Issuing...' : 'Confirm & Issue Passes'}</span>
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Issue Progress Modal */}
      <Modal
        isOpen={showProgressModal}
        onClose={() => {
          if (!issuing) setShowProgressModal(false);
        }}
        title="⚡ Issuing & Packaging Passes..."
        maxWidth="560px"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '12px 6px' }}>
          {/* Progress Bar */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 700, marginBottom: '8px' }}>
              <span style={{ color: 'var(--primary-600)' }}>{progressStatusText}</span>
              <span style={{ color: '#64748B' }}>{progressPercent}%</span>
            </div>
            <div style={{ width: '100%', height: '10px', backgroundColor: '#E2E8F0', borderRadius: '6px', overflow: 'hidden' }}>
              <div
                style={{
                  height: '100%',
                  width: `${progressPercent}%`,
                  backgroundColor: progressError ? '#EF4444' : (progressPercent === 100 ? '#10B981' : '#3B82F6'),
                  transition: 'width 0.4s ease, background-color 0.3s ease'
                }}
              />
            </div>
          </div>

          {/* Step Progression Checklist */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', backgroundColor: '#F8FAFC', padding: '16px', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13.5px', color: progressStep > 1 ? '#047857' : (progressStep === 1 ? '#1D4ED8' : '#64748B'), fontWeight: progressStep === 1 ? 700 : 500 }}>
              {progressStep > 1 ? <CheckCircle2 size={18} color="#10B981" /> : (progressStep === 1 ? <Loader2 size={18} className="spin" color="#3B82F6" /> : <div style={{ width: '18px', height: '18px', borderRadius: '50%', border: '2px solid #CBD5E1' }} />)}
              <span>1. Allocate & HMAC-Sign Security Pass Codes</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13.5px', color: progressStep > 2 ? '#047857' : (progressStep === 2 ? '#1D4ED8' : '#64748B'), fontWeight: progressStep === 2 ? 700 : 500 }}>
              {progressStep > 2 ? <CheckCircle2 size={18} color="#10B981" /> : (progressStep === 2 ? <Loader2 size={18} className="spin" color="#3B82F6" /> : <div style={{ width: '18px', height: '18px', borderRadius: '50%', border: '2px solid #CBD5E1' }} />)}
              <span>2. Render All {quantity} Pass PDF(s) with QR / Barcodes</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13.5px', color: progressStep > 3 ? '#047857' : (progressStep === 3 ? '#1D4ED8' : '#64748B'), fontWeight: progressStep === 3 ? 700 : 500 }}>
              {progressStep > 3 ? <CheckCircle2 size={18} color="#10B981" /> : (progressStep === 3 ? <Loader2 size={18} className="spin" color="#3B82F6" /> : <div style={{ width: '18px', height: '18px', borderRadius: '50%', border: '2px solid #CBD5E1' }} />)}
              <span>3. Generate Itemized Tax Invoice PDF</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13.5px', color: progressStep >= 4 ? (progressStep === 5 ? '#047857' : '#1D4ED8') : '#64748B', fontWeight: progressStep === 4 ? 700 : 500 }}>
              {progressStep === 5 ? <CheckCircle2 size={18} color="#10B981" /> : (progressStep === 4 ? <Loader2 size={18} className="spin" color="#3B82F6" /> : <div style={{ width: '18px', height: '18px', borderRadius: '50%', border: '2px solid #CBD5E1' }} />)}
              <span>4. Package & Dispatch ({sendVia})</span>
            </div>
          </div>

          {/* Error Message & Retry */}
          {progressError && (
            <div style={{ padding: '12px 16px', backgroundColor: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: '8px', color: '#991B1B', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertTriangle size={18} color="#DC2626" />
                <span>{progressError}</span>
              </div>
              <button onClick={handleConfirmAndIssue} className="btn btn-sm btn-danger" style={{ minWidth: '80px' }}>
                Retry
              </button>
            </div>
          )}
        </div>
      </Modal>

      {/* Success Confirmation Modal with Downloads & Success Rate */}
      {issuedResult && (
        <Modal
          isOpen={Boolean(issuedResult)}
          onClose={() => setIssuedResult(null)}
          title="🎉 Passes Successfully Issued & Generated!"
          maxWidth="640px"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '10px' }}>
            {/* Header Icon */}
            <div style={{ textAlign: 'center' }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '50%', backgroundColor: '#D1FAE5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px auto' }}>
                <CheckCircle2 size={32} />
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 4px 0' }}>
                Invoice {issuedResult.billing?.bill_number}
              </h3>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>
                {issuedResult.passes?.length} unique pass(es) created with active HMAC security signatures.
              </p>
            </div>

            {/* Success Rate & Delivery Status Summary Banner */}
            <div
              style={{
                backgroundColor: issuedResult.emailSent || sendVia === 'NONE' || sendVia === 'WHATSAPP' ? '#ECFDF5' : '#FFFBEB',
                border: `1px solid ${issuedResult.emailSent || sendVia === 'NONE' || sendVia === 'WHATSAPP' ? '#A7F3D0' : '#FDE68A'}`,
                borderRadius: '8px',
                padding: '12px 16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '10px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {issuedResult.emailSent || sendVia === 'NONE' || sendVia === 'WHATSAPP' ? (
                  <CheckCircle2 size={20} color="#059669" />
                ) : (
                  <AlertTriangle size={20} color="#D97706" />
                )}
                <div>
                  <div style={{ fontSize: '13.5px', fontWeight: 800, color: '#0F172A' }}>
                    {issuedResult.passes?.length} / {issuedResult.passes?.length} passes generated and packaged successfully.
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>
                    {(sendVia === 'EMAIL' || sendVia === 'BOTH') && (
                      issuedResult.emailSent
                        ? `✓ Email delivered to ${issuedResult.billing?.customer_email} (${issuedResult.passes?.length} Pass PDF attachments + 1 Invoice)`
                        : `⚠️ Email delivery pending/failed: ${issuedResult.emailDelivery?.error || 'Check SMTP configuration'}`
                    )}
                    {sendVia === 'WHATSAPP' && `✓ WhatsApp confirmation link prepared for ${issuedResult.billing?.customer_phone || 'recipient'}`}
                    {sendVia === 'NONE' && '✓ Ready for instant on-demand download.'}
                  </div>
                </div>
              </div>

              {(!issuedResult.emailSent && (sendVia === 'EMAIL' || sendVia === 'BOTH')) && (
                <button
                  onClick={() => handleRetryDelivery(issuedResult.billing?.id)}
                  className="btn btn-sm btn-outline"
                  disabled={retrying}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}
                >
                  <RefreshCw size={13} className={retrying ? 'spin' : ''} />
                  <span>{retrying ? 'Retrying...' : 'Retry Delivery'}</span>
                </button>
              )}
            </div>

            {/* Pass Codes Box with Individual Download Badges */}
            <div style={{ backgroundColor: '#F8FAFC', padding: '14px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#64748B', marginBottom: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span>GENERATED PASS CODES ({issuedResult.passes?.length}):</span>
                <span style={{ fontSize: '11px', color: '#94A3B8' }}>Click any pass chip to download individually</span>
              </div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {issuedResult.passes?.map((p, idx) => {
                  const passItem = issuedResult.passPdfs?.find(pdf => pdf.code === p.code);
                  return (
                    <button
                      key={p.code}
                      type="button"
                      onClick={() => {
                        if (passItem?.base64) {
                          handleDownloadPdf(passItem.base64, `Pass_${p.code}.pdf`);
                        } else {
                          handleDownloadPdf(issuedResult.passPdfBase64, `Pass_${p.code}.pdf`);
                        }
                      }}
                      title={`Download Pass ${p.code}`}
                      style={{
                        backgroundColor: '#EFF6FF',
                        color: '#1D4ED8',
                        fontFamily: 'monospace',
                        fontWeight: 800,
                        fontSize: '13.5px',
                        padding: '5px 12px',
                        borderRadius: '6px',
                        border: '1px solid #BFDBFE',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        cursor: 'pointer',
                        transition: 'background-color 0.2s'
                      }}
                    >
                      <span>{p.code}</span>
                      <Download size={13} color="#2563EB" />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Action Buttons: Bundle Download, Bill PDF & WhatsApp */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '4px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <button
                  onClick={() => {
                    const fname = (issuedResult.passes?.length || 1) > 1
                      ? `Passes_${issuedResult.billing?.bill_number}.pdf`
                      : `Pass_${issuedResult.passes[0]?.code}.pdf`;
                    handleDownloadPdf(issuedResult.passPdfBase64, fname);
                  }}
                  className="btn btn-primary"
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                >
                  <Download size={16} />
                  <span>
                    {(issuedResult.passes?.length || 1) > 1
                      ? `Download All ${issuedResult.passes?.length} Passes (PDF)`
                      : 'Download Pass PDF'}
                  </span>
                </button>

                <button
                  onClick={() => handleDownloadPdf(issuedResult.billPdfBase64, `Invoice_${issuedResult.billing?.bill_number}.pdf`)}
                  className="btn btn-secondary"
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                >
                  <FileText size={16} />
                  <span>Download Bill PDF</span>
                </button>
              </div>

              {issuedResult.whatsappUrl && (
                <a
                  href={issuedResult.whatsappUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-primary"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    backgroundColor: '#10B981',
                    borderColor: '#10B981'
                  }}
                >
                  <MessageCircle size={18} />
                  <span>Share Confirmation via WhatsApp</span>
                </a>
              )}
            </div>

            <button onClick={() => setIssuedResult(null)} className="btn btn-outline" style={{ marginTop: '4px' }}>
              Done / Create Another Bill
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
