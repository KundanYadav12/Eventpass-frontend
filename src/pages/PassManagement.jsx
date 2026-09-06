import React, { useState, useEffect } from 'react';
import {
  Ticket,
  Search,
  Filter,
  RefreshCw,
  Eye,
  RotateCw,
  Ban,
  SlidersHorizontal,
  ChevronDown,
  Layers,
  Sparkles,
  Plus,
  Copy,
  Check,
  Share2,
  Download,
  Mail,
  Phone,
  User,
  Clock,
  CheckCircle2,
  Calendar,
  X
} from 'lucide-react';
import { api } from '../services/api';
import { useEvent } from '../context/EventContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Pagination from '../components/Pagination';
import Badge from '../components/Badge';
import Modal from '../components/Modal';
import PassDetailsModal from './PassDetailsModal';
import RenewPassModal from './RenewPassModal';
import ResharePassModal from './ResharePassModal';
import ScannableBarcode from '../components/ScannableBarcode';
import { formatDateIST, formatTimeIST, formatDateTimeIST } from '../utils/dateUtil';

export default function PassManagement() {
  const { user, isSuperAdmin, hasPermission } = useAuth();
  const { events, selectedEvent } = useEvent();
  const canGenerate = isSuperAdmin || hasPermission('passes.generate');
  const [passes, setPasses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    totalRecords: 0,
    totalPages: 1
  });

  // Filters State
  const [search, setSearch] = useState('');
  const [passType, setPassType] = useState('all');
  const [status, setStatus] = useState('all');
  const [sharingMethod, setSharingMethod] = useState('all');
  const [printed, setPrinted] = useState('all');
  const [usageState, setUsageState] = useState('all');
  const [validityState, setValidityState] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [sharedFrom, setSharedFrom] = useState('');
  const [sharedTo, setSharedTo] = useState('');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Modals & Selection State
  const [selectedPassIds, setSelectedPassIds] = useState([]);
  const [activePassDetailsId, setActivePassDetailsId] = useState(null);
  const [reshareTargetPass, setReshareTargetPass] = useState(null);
  const [renewTargetPass, setRenewTargetPass] = useState(null);
  const [showBulkRenewModal, setShowBulkRenewModal] = useState(false);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [copiedCode, setCopiedCode] = useState(null);
  const [exportingExcel, setExportingExcel] = useState(false);

  // Generate Form State
  const [genEventId, setGenEventId] = useState('');
  const [genCategoryId, setGenCategoryId] = useState('');
  const [genQuantity, setGenQuantity] = useState(100);
  const [generating, setGenerating] = useState(false);

  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const buildQueryParams = (page = 1) => {
    return new URLSearchParams({
      page,
      limit: pagination.limit,
      ...(selectedEvent ? { eventId: selectedEvent.id } : {}),
      ...(search ? { search } : {}),
      ...(passType !== 'all' ? { passType } : {}),
      ...(status !== 'all' ? { status } : {}),
      ...(sharingMethod !== 'all' ? { sharingMethod } : {}),
      ...(printed !== 'all' ? { printed } : {}),
      ...(usageState !== 'all' ? { usageState } : {}),
      ...(validityState !== 'all' ? { validityState } : {}),
      ...(dateFrom ? { dateFrom } : {}),
      ...(dateTo ? { dateTo } : {}),
      ...(sharedFrom ? { sharedFrom } : {}),
      ...(sharedTo ? { sharedTo } : {})
    });
  };

  const fetchPasses = async (page = 1) => {
    setLoading(true);
    try {
      const params = buildQueryParams(page);
      const res = await api.get(`/passes?${params.toString()}`);
      if (res.success) {
        setPasses(res.passes || []);
        setPagination(res.pagination);
      }
    } catch (err) {
      toast.error('Failed to load passes');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const url = selectedEvent ? `/categories?eventId=${selectedEvent.id}` : '/categories';
      const res = await api.get(url);
      if (res.success) {
        setCategories(res.data || []);
      }
    } catch (e) {
      // Ignore
    }
  };

  useEffect(() => {
    fetchPasses(1);
    fetchCategories();
    setSelectedPassIds([]);
  }, [
    selectedEvent, passType, status, sharingMethod, printed,
    usageState, validityState, dateFrom, dateTo, sharedFrom, sharedTo, pagination.limit
  ]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchPasses(1);
  };

  const handleResetFilters = () => {
    setSearch('');
    setPassType('all');
    setStatus('all');
    setSharingMethod('all');
    setPrinted('all');
    setUsageState('all');
    setValidityState('all');
    setDateFrom('');
    setDateTo('');
    setSharedFrom('');
    setSharedTo('');
    fetchPasses(1);
  };

  const handleExportExcel = async () => {
    setExportingExcel(true);
    try {
      const params = buildQueryParams(1);
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5006/api/passes/export-excel?${params.toString()}`, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      });

      if (!response.ok) {
        throw new Error('Excel export failed');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `PassInventory_${new Date().toISOString().slice(0, 10)}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Pass Inventory Excel exported successfully!');
    } catch (err) {
      toast.error('Failed to download Excel file');
    } finally {
      setExportingExcel(false);
    }
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedPassIds(passes.map(p => p.id));
    } else {
      setSelectedPassIds([]);
    }
  };

  const handleToggleSelectPass = (id) => {
    setSelectedPassIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleCopyCode = (code, e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast.success(`Copied pass code: ${code}`);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleVoidPass = async (id) => {
    if (!window.confirm('Are you sure you want to void this pass? This will permanently invalidate it for gate entry.')) {
      return;
    }
    try {
      const res = await api.post(`/passes/${id}/void`, { reason: 'Admin void action' });
      if (res.success) {
        toast.success(res.message);
        fetchPasses(pagination.page);
      }
    } catch (err) {
      toast.error(err.message || 'Failed to void pass');
    }
  };

  const handleOpenGenerate = () => {
    const evId = selectedEvent?.id ? String(selectedEvent.id) : (events[0]?.id ? String(events[0].id) : '1');
    setGenEventId(evId);
    setGenCategoryId(categories[0]?.id ? String(categories[0].id) : '');
    setGenQuantity(100);
    setShowGenerateModal(true);
  };

  const handleGenerateSubmit = async (e) => {
    e.preventDefault();
    if (!genEventId || !genCategoryId || !genQuantity) {
      toast.warning('Please select Event, Category, and Quantity');
      return;
    }

    setGenerating(true);
    try {
      const res = await api.post('/passes/generate', {
        eventId: parseInt(genEventId, 10),
        categoryId: parseInt(genCategoryId, 10),
        quantity: parseInt(genQuantity, 10)
      });

      if (res.success) {
        toast.success(res.message);
        setShowGenerateModal(false);
        fetchPasses(1);
        fetchCategories();
      }
    } catch (err) {
      toast.error(err.message || 'Failed to generate passes');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div style={{ padding: '24px 32px', maxWidth: '1560px', margin: '0 auto' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800 }}>Pass Inventory & Customer Lifecycle</h1>
          <p style={{ fontSize: '13.5px', color: 'var(--text-muted)' }}>
            Search, filter, track customer communication history, reshare passes, and inspect IST scan activity
            {selectedEvent && <span> for <strong>{selectedEvent.event_name}</strong></span>}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Export Excel Button */}
          <button
            onClick={handleExportExcel}
            disabled={exportingExcel || loading}
            className="btn btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700 }}
            title="Download filtered dataset in .xlsx format"
          >
            <Download size={15} />
            <span>{exportingExcel ? 'Exporting...' : 'Export Excel (.xlsx)'}</span>
          </button>

          {canGenerate && (
            <button onClick={handleOpenGenerate} className="btn btn-primary">
              <Plus size={16} />
              <span>Generate Passes</span>
            </button>
          )}

          {selectedPassIds.length > 0 && isSuperAdmin && (
            <button
              onClick={() => setShowBulkRenewModal(true)}
              className="btn btn-secondary"
            >
              <RotateCw size={16} />
              <span>Bulk Renew ({selectedPassIds.length})</span>
            </button>
          )}

          <button onClick={() => fetchPasses(pagination.page)} className="btn btn-outline btn-icon" title="Refresh Table">
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {/* Category Filter Chips */}
      {categories.length > 0 && (
        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '10px', marginBottom: '16px' }}>
          <button
            onClick={() => setPassType('all')}
            style={{
              padding: '6px 14px',
              borderRadius: 'var(--radius-full)',
              fontSize: '12.5px',
              fontWeight: 700,
              border: '1px solid var(--border-color)',
              backgroundColor: passType === 'all' ? 'var(--primary-600)' : 'var(--bg-surface)',
              color: passType === 'all' ? '#FFFFFF' : 'var(--text-primary)',
              cursor: 'pointer'
            }}
          >
            All Categories ({pagination.totalRecords})
          </button>

          {categories.map(c => {
            const isSelected = passType === c.code;
            return (
              <button
                key={c.id}
                onClick={() => setPassType(isSelected ? 'all' : c.code)}
                style={{
                  padding: '6px 14px',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '12.5px',
                  fontWeight: 700,
                  border: '1px solid var(--border-color)',
                  backgroundColor: isSelected ? 'var(--primary-600)' : 'var(--bg-surface)',
                  color: isSelected ? '#FFFFFF' : 'var(--text-primary)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <span>{c.name}</span>
                {c.category_prefix && (
                  <span style={{
                    fontSize: '10px',
                    padding: '1px 5px',
                    borderRadius: '4px',
                    backgroundColor: isSelected ? 'rgba(255,255,255,0.2)' : 'var(--bg-surface-hover)'
                  }}>
                    {c.category_prefix}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Filter & Search Toolbar */}
      <div className="card" style={{ marginBottom: '20px', padding: '16px 20px' }}>
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Main Search Row */}
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '280px', position: 'relative' }}>
              <input
                type="text"
                placeholder="Search by Pass Code (e.g. 55KDBD2), Customer Name, Email, WhatsApp Phone, or Bill #..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ width: '100%', paddingLeft: '38px' }}
              />
              <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            </div>

            <button type="submit" className="btn btn-primary" style={{ padding: '0 22px' }}>
              Search
            </button>

            <button
              type="button"
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className={`btn ${showAdvancedFilters ? 'btn-primary' : 'btn-outline'}`}
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <SlidersHorizontal size={15} />
              <span>{showAdvancedFilters ? 'Hide Filters' : 'More Filters'}</span>
            </button>

            {(search || status !== 'all' || sharingMethod !== 'all' || printed !== 'all' || usageState !== 'all' || validityState !== 'all' || dateFrom || dateTo || sharedFrom || sharedTo) && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="btn btn-secondary"
              >
                Reset All
              </button>
            )}
          </div>

          {/* Core Dropdown Filters */}
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--text-muted)' }}>
              <Filter size={14} />
              <span>Filters:</span>
            </div>

            <select value={status} onChange={(e) => setStatus(e.target.value)} style={{ padding: '6px 10px', fontSize: '13px' }}>
              <option value="all">All Pass Statuses</option>
              <option value="active">Active</option>
              <option value="used">Used</option>
              <option value="expired">Expired</option>
              <option value="void">Void</option>
            </select>

            <select value={sharingMethod} onChange={(e) => setSharingMethod(e.target.value)} style={{ padding: '6px 10px', fontSize: '13px' }}>
              <option value="all">All Sharing Channels</option>
              <option value="EMAIL">Shared via Email</option>
              <option value="WHATSAPP">Shared via WhatsApp</option>
              <option value="BOTH">Shared via Both</option>
              <option value="NONE">Not Shared (Direct / Batch)</option>
            </select>

            <select value={usageState} onChange={(e) => setUsageState(e.target.value)} style={{ padding: '6px 10px', fontSize: '13px' }}>
              <option value="all">All Gate Usage</option>
              <option value="unused">Unused (0 scans)</option>
              <option value="used">Used (≥1 scans)</option>
            </select>

            <select value={printed} onChange={(e) => setPrinted(e.target.value)} style={{ padding: '6px 10px', fontSize: '13px' }}>
              <option value="all">All Print States</option>
              <option value="true">Printed Labels</option>
              <option value="false">Unprinted</option>
            </select>

            <select value={validityState} onChange={(e) => setValidityState(e.target.value)} style={{ padding: '6px 10px', fontSize: '13px' }}>
              <option value="all">All Validity Windows</option>
              <option value="valid">Currently Valid</option>
              <option value="expired">Expired Window</option>
            </select>
          </div>

          {/* Advanced Date Range Filters Collapsible */}
          {showAdvancedFilters && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '14px',
              backgroundColor: 'var(--bg-surface-hover, #F8FAFC)',
              padding: '14px 16px',
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
              marginTop: '4px'
            }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>
                  Pass Validity Window (IST Date Range)
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    style={{ padding: '6px 8px', fontSize: '12.5px', width: '100%' }}
                  />
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>to</span>
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    style={{ padding: '6px 8px', fontSize: '12.5px', width: '100%' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>
                  Customer Shared / Reshared Date (IST Date Range)
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    type="date"
                    value={sharedFrom}
                    onChange={(e) => setSharedFrom(e.target.value)}
                    style={{ padding: '6px 8px', fontSize: '12.5px', width: '100%' }}
                  />
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>to</span>
                  <input
                    type="date"
                    value={sharedTo}
                    onChange={(e) => setSharedTo(e.target.value)}
                    style={{ padding: '6px 8px', fontSize: '12.5px', width: '100%' }}
                  />
                </div>
              </div>
            </div>
          )}
        </form>
      </div>

      {/* Main Passes Table with Full Customer Details */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th style={{ width: '38px' }}>
                  <input
                    type="checkbox"
                    checked={passes.length > 0 && selectedPassIds.length === passes.length}
                    onChange={handleSelectAll}
                  />
                </th>
                <th>Pass Code (7-Char)</th>
                <th>Customer / Buyer Details</th>
                <th>Category & Event</th>
                <th>Price & Bill</th>
                <th>Sharing Channel</th>
                <th>Shared Date (IST)</th>
                <th>Scan Status</th>
                <th>Scan Usage (IST)</th>
                <th>Print State</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={11} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                    Loading pass inventory...
                  </td>
                </tr>
              ) : passes.length === 0 ? (
                <tr>
                  <td colSpan={11} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                    No passes found matching your filter criteria.
                  </td>
                </tr>
              ) : (
                passes.map((pass) => {
                  const isSelected = selectedPassIds.includes(pass.id);
                  const isCopied = copiedCode === pass.code;
                  return (
                    <tr key={pass.id} style={{ backgroundColor: isSelected ? 'var(--primary-50)' : 'transparent' }}>
                      <td>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelectPass(pass.id)}
                        />
                      </td>

                      {/* 1. 7-Character Pass Code + Copy + Thumbnail */}
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <button
                                onClick={() => setActivePassDetailsId(pass.id)}
                                className="pass-code-pill"
                                title="Click to view lifecycle timeline & barcode"
                              >
                                <span>{pass.code}</span>
                              </button>

                              <button
                                onClick={(e) => handleCopyCode(pass.code, e)}
                                className="btn btn-outline btn-icon"
                                style={{ width: '24px', height: '24px', border: 'none', background: 'transparent' }}
                                title="Copy 7-digit code"
                              >
                                {isCopied ? <Check size={13} color="var(--success-accent)" /> : <Copy size={12} color="var(--text-muted)" />}
                              </button>
                            </div>
                            <div style={{ fontSize: '11px', color: 'var(--text-subtle)', marginTop: '2px' }}>
                              Pass #{pass.id}
                            </div>
                          </div>

                          <div
                            onClick={() => setActivePassDetailsId(pass.id)}
                            style={{ cursor: 'pointer', transition: 'transform 0.15s ease' }}
                            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.04)'}
                            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                            title="Click to view digital scannable barcode"
                          >
                            <ScannableBarcode value={pass.code} type="CODE128" size="sm" showText={false} />
                          </div>
                        </div>
                      </td>

                      {/* 2. Customer / Buyer Name, Email & WhatsApp Number */}
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          <div style={{ fontWeight: 700, fontSize: '13.5px', color: 'var(--text-primary)' }}>
                            {pass.customer_name || '—'}
                          </div>
                          {pass.customer_email && (
                            <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <Mail size={11} />
                              <span>{pass.customer_email}</span>
                            </div>
                          )}
                          {pass.customer_phone && (
                            <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <Phone size={11} />
                              <span>{pass.customer_phone}</span>
                            </div>
                          )}
                          {pass.sponsor_name && (
                            <div style={{ fontSize: '10.5px', color: '#D97706', fontWeight: 600 }}>
                              ★ {pass.sponsor_name}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* 3. Category & Event */}
                      <td>
                        <div style={{ fontWeight: 700, fontSize: '13px' }}>
                          {pass.category_name || pass.code_type}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                          {pass.event_name || 'Event 2026'}
                        </div>
                        {pass.category_prefix && (
                          <span style={{
                            fontSize: '10px',
                            fontFamily: 'var(--font-mono)',
                            color: 'var(--primary-700)',
                            backgroundColor: 'var(--primary-50)',
                            padding: '1px 5px',
                            borderRadius: '4px',
                            fontWeight: 700,
                            display: 'inline-block',
                            marginTop: '2px'
                          }}>
                            TAG: {pass.category_prefix}
                          </span>
                        )}
                      </td>

                      {/* 4. Price & Bill # */}
                      <td>
                        <div style={{ fontWeight: 800, fontSize: '13px', color: 'var(--text-primary)' }}>
                          ₹{parseFloat(pass.category_price || pass.total_amount || 0).toFixed(2)}
                        </div>
                        {pass.bill_number ? (
                          <div style={{ fontSize: '11px', fontFamily: 'monospace', color: 'var(--primary-600)' }}>
                            {pass.bill_number}
                          </div>
                        ) : (
                          <div style={{ fontSize: '11px', color: 'var(--text-subtle)' }}>Direct Issue</div>
                        )}
                      </td>

                      {/* 5. Sharing Method Badge */}
                      <td>
                        <Badge variant={
                          pass.sharing_method === 'EMAIL' ? 'info' :
                          pass.sharing_method === 'WHATSAPP' ? 'success' :
                          pass.sharing_method === 'BOTH' ? 'primary' : 'neutral'
                        }>
                          {pass.sharing_method || 'NONE'}
                        </Badge>
                      </td>

                      {/* 6. Shared Date (IST) & Reshare Count */}
                      <td>
                        {pass.last_shared_at ? (
                          <div>
                            <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>
                              {formatDateIST(pass.last_shared_at)}
                            </div>
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                              {formatTimeIST(pass.last_shared_at)}
                            </div>
                            {pass.reshare_count > 0 && (
                              <div style={{ fontSize: '10px', color: '#2563EB', fontWeight: 700, marginTop: '2px' }}>
                                Reshared {pass.reshare_count}×
                              </div>
                            )}
                          </div>
                        ) : (
                          <span style={{ fontSize: '12px', color: 'var(--text-subtle)' }}>Not shared</span>
                        )}
                      </td>

                      {/* 7. Scan Status */}
                      <td>
                        <Badge variant={
                          pass.status === 'active' ? 'success' :
                          pass.status === 'used' ? 'info' :
                          pass.status === 'expired' ? 'warning' : 'danger'
                        }>
                          {pass.status.toUpperCase()}
                        </Badge>
                      </td>

                      {/* 8. Scan Usage with Accurate IST Time */}
                      <td>
                        <div style={{ fontWeight: 800, fontSize: '13px' }}>
                          {pass.scan_count || 0} scans
                        </div>
                        {pass.last_scanned_at ? (
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                            Last: <strong>{formatTimeIST(pass.last_scanned_at)}</strong>
                            <div style={{ fontSize: '10px', color: 'var(--text-subtle)' }}>{formatDateIST(pass.last_scanned_at)}</div>
                          </div>
                        ) : (
                          <div style={{ fontSize: '11px', color: 'var(--text-subtle)' }}>Never scanned</div>
                        )}
                      </td>

                      {/* 9. Print State */}
                      <td>
                        <Badge variant={pass.printed ? 'neutral' : 'warning'}>
                          {pass.printed ? 'PRINTED' : 'UNPRINTED'}
                        </Badge>
                      </td>

                      {/* 10. Actions: View, Reshare, Renew, Void */}
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '5px' }}>
                          <button
                            onClick={() => setActivePassDetailsId(pass.id)}
                            className="btn btn-outline btn-sm btn-icon"
                            title="View Lifecycle Details & History"
                          >
                            <Eye size={14} />
                          </button>

                          <button
                            onClick={() => setReshareTargetPass(pass)}
                            className="btn btn-primary btn-sm btn-icon"
                            title="Reshare Pass via Email/WhatsApp"
                          >
                            <Share2 size={14} />
                          </button>

                          {isSuperAdmin && (
                            <>
                              <button
                                onClick={() => setRenewTargetPass(pass)}
                                className="btn btn-secondary btn-sm btn-icon"
                                title="Renew Pass"
                              >
                                <RotateCw size={14} />
                              </button>

                              <button
                                onClick={() => handleVoidPass(pass.id)}
                                className="btn btn-outline btn-sm btn-icon"
                                title="Void Pass"
                                style={{ color: 'var(--danger-accent)' }}
                              >
                                <Ban size={14} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Server-Side Pagination */}
        <Pagination
          currentPage={pagination.page}
          totalPages={pagination.totalPages}
          totalRecords={pagination.totalRecords}
          pageSize={pagination.limit}
          onPageChange={(page) => fetchPasses(page)}
          onPageSizeChange={(limit) => setPagination(prev => ({ ...prev, limit, page: 1 }))}
        />
      </div>

      {/* Reshare Pass Modal */}
      {reshareTargetPass && (
        <ResharePassModal
          pass={reshareTargetPass}
          onClose={() => setReshareTargetPass(null)}
          onSuccess={() => {
            setReshareTargetPass(null);
            fetchPasses(pagination.page);
          }}
        />
      )}

      {/* Pass Details Modal */}
      {activePassDetailsId && (
        <PassDetailsModal
          passId={activePassDetailsId}
          onClose={() => setActivePassDetailsId(null)}
          onRenew={() => {
            const p = passes.find(item => item.id === activePassDetailsId);
            setActivePassDetailsId(null);
            setRenewTargetPass(p);
          }}
          onVoid={() => {
            handleVoidPass(activePassDetailsId);
            setActivePassDetailsId(null);
          }}
          onReissue={() => {
            setActivePassDetailsId(null);
          }}
        />
      )}

      {/* Individual Renew Pass Modal */}
      {renewTargetPass && (
        <RenewPassModal
          pass={renewTargetPass}
          onClose={() => setRenewTargetPass(null)}
          onSuccess={() => {
            setRenewTargetPass(null);
            fetchPasses(pagination.page);
          }}
        />
      )}

      {/* Generate Passes Modal */}
      <Modal
        isOpen={showGenerateModal}
        onClose={() => setShowGenerateModal(false)}
        title="Generate 7-Character Passes"
        maxWidth="500px"
      >
        <form onSubmit={handleGenerateSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>Target Event *</label>
            <select
              value={genEventId}
              onChange={(e) => {
                setGenEventId(e.target.value);
                api.get(`/categories?eventId=${e.target.value}`).then(res => {
                  if (res.success && res.data.length > 0) {
                    setCategories(res.data);
                    setGenCategoryId(String(res.data[0].id));
                  }
                });
              }}
              style={{ width: '100%' }}
              required
            >
              {events.map(ev => (
                <option key={ev.id} value={ev.id}>{ev.event_name} ({ev.event_code})</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>Pass Category *</label>
            <select
              value={genCategoryId}
              onChange={(e) => setGenCategoryId(e.target.value)}
              style={{ width: '100%' }}
              required
            >
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name} ({c.code})</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>Quantity to Generate *</label>
            <input
              type="number"
              min={1}
              max={10000}
              value={genQuantity}
              onChange={(e) => setGenQuantity(e.target.value)}
              style={{ width: '100%' }}
              required
            />
            <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '4px' }}>
              Generates unique collision-free 7-character pass codes with cryptographic HMAC signatures
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
            <button type="button" onClick={() => setShowGenerateModal(false)} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={generating} className="btn btn-primary">
              {generating ? 'Generating Passes...' : 'Generate Passes'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Bulk Renew Modal */}
      {showBulkRenewModal && (
        <Modal
          isOpen={showBulkRenewModal}
          onClose={() => setShowBulkRenewModal(false)}
          title={`Bulk Renew ${selectedPassIds.length} Passes`}
          maxWidth="500px"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <p style={{ fontSize: '13.5px', color: 'var(--text-muted)' }}>
              Renewing will reset the usage and active status for all {selectedPassIds.length} selected passes.
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button onClick={() => setShowBulkRenewModal(false)} className="btn btn-secondary">
                Cancel
              </button>
              <button
                onClick={async () => {
                  try {
                    const res = await api.post('/passes/bulk-renew', {
                      passIds: selectedPassIds,
                      resetUsage: true,
                      resetStatus: true,
                      reason: 'Bulk admin renewal'
                    });
                    if (res.success) {
                      toast.success(res.message);
                      setShowBulkRenewModal(false);
                      setSelectedPassIds([]);
                      fetchPasses(pagination.page);
                    }
                  } catch (e) {
                    toast.error('Bulk renewal failed');
                  }
                }}
                className="btn btn-primary"
              >
                Confirm Bulk Renewal
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
