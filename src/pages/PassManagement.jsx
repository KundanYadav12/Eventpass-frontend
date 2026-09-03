import React, { useState, useEffect } from 'react';
import {
  Ticket,
  Search,
  Filter,
  RefreshCw,
  Eye,
  RotateCw,
  Ban,
  CheckSquare,
  Square,
  SlidersHorizontal,
  ChevronDown,
  Layers,
  Sparkles,
  Plus,
  Copy,
  Check
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
import ScannableBarcode from '../components/ScannableBarcode';

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
  const [printed, setPrinted] = useState('all');
  const [usageState, setUsageState] = useState('all');
  const [validityState, setValidityState] = useState('all');

  // Modals & Selection State
  const [selectedPassIds, setSelectedPassIds] = useState([]);
  const [activePassDetailsId, setActivePassDetailsId] = useState(null);
  const [renewTargetPass, setRenewTargetPass] = useState(null);
  const [showBulkRenewModal, setShowBulkRenewModal] = useState(false);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [copiedCode, setCopiedCode] = useState(null);

  // Generate Form State
  const [genEventId, setGenEventId] = useState('');
  const [genCategoryId, setGenCategoryId] = useState('');
  const [genQuantity, setGenQuantity] = useState(100);
  const [generating, setGenerating] = useState(false);

  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const fetchPasses = async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page,
        limit: pagination.limit,
        ...(selectedEvent ? { eventId: selectedEvent.id } : {}),
        ...(search ? { search } : {}),
        ...(passType !== 'all' ? { passType } : {}),
        ...(status !== 'all' ? { status } : {}),
        ...(printed !== 'all' ? { printed } : {}),
        ...(usageState !== 'all' ? { usageState } : {}),
        ...(validityState !== 'all' ? { validityState } : {})
      });

      const res = await api.get(`/passes?${params.toString()}`);
      if (res.success) {
        setPasses(res.passes);
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
        setCategories(res.data);
      }
    } catch (e) {
      // Ignore
    }
  };

  useEffect(() => {
    fetchPasses(1);
    fetchCategories();
    setSelectedPassIds([]);
  }, [selectedEvent, passType, status, printed, usageState, validityState, pagination.limit]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchPasses(1);
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

  const handleReissuePass = async (id) => {
    if (!window.confirm('Reissuing will assign a NEW 7-character pass code and invalidate the old ticket barcode. Proceed?')) {
      return;
    }
    try {
      const res = await api.post(`/passes/${id}/reissue`, { reason: 'Admin reissue request' });
      if (res.success) {
        toast.success(res.message);
        fetchPasses(pagination.page);
      }
    } catch (err) {
      toast.error(err.message || 'Failed to reissue pass');
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
    <div style={{ padding: '24px 32px', maxWidth: '1440px', margin: '0 auto' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800 }}>Pass Inventory & Lifecycle</h1>
          <p style={{ fontSize: '13.5px', color: 'var(--text-muted)' }}>
            Search, filter, inspect timelines, renew, and manage 7-character passes
            {selectedEvent && <span> for <strong>{selectedEvent.event_name}</strong></span>}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {canGenerate && (
            <button onClick={handleOpenGenerate} className="btn btn-primary">
              <Plus size={16} />
              <span>Generate Passes</span>
            </button>
          )}

          {selectedPassIds.length > 0 && (
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
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '260px', position: 'relative' }}>
              <input
                type="text"
                placeholder="Search by 7-character Pass Code (e.g. 55KDBD2) or ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ width: '100%', paddingLeft: '38px' }}
              />
              <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            </div>

            <button type="submit" className="btn btn-primary" style={{ padding: '0 22px' }}>
              Search
            </button>
            {search && (
              <button
                type="button"
                onClick={() => { setSearch(''); fetchPasses(1); }}
                className="btn btn-secondary"
              >
                Clear
              </button>
            )}
          </div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--text-muted)' }}>
              <Filter size={14} />
              <span>Filters:</span>
            </div>

            <select value={status} onChange={(e) => setStatus(e.target.value)} style={{ padding: '6px 10px', fontSize: '13px' }}>
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="used">Used</option>
              <option value="expired">Expired</option>
              <option value="void">Void</option>
            </select>

            <select value={printed} onChange={(e) => setPrinted(e.target.value)} style={{ padding: '6px 10px', fontSize: '13px' }}>
              <option value="all">All Print States</option>
              <option value="true">Printed Labels</option>
              <option value="false">Unprinted</option>
            </select>

            <select value={usageState} onChange={(e) => setUsageState(e.target.value)} style={{ padding: '6px 10px', fontSize: '13px' }}>
              <option value="all">All Usage States</option>
              <option value="unused">Unused (0 scans)</option>
              <option value="used">Used (≥1 scans)</option>
            </select>

            <select value={validityState} onChange={(e) => setValidityState(e.target.value)} style={{ padding: '6px 10px', fontSize: '13px' }}>
              <option value="all">All Validity</option>
              <option value="valid">Currently Valid</option>
              <option value="expired">Expired Date</option>
            </select>
          </div>
        </form>
      </div>

      {/* Main Passes Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th style={{ width: '40px' }}>
                  <input
                    type="checkbox"
                    checked={passes.length > 0 && selectedPassIds.length === passes.length}
                    onChange={handleSelectAll}
                  />
                </th>
                <th>Pass Code (7-Digit)</th>
                <th>Category</th>
                <th>Status</th>
                <th>Valid Dates</th>
                <th>Scan Usage</th>
                <th>Print State</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                    Loading passes...
                  </td>
                </tr>
              ) : passes.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
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

                      {/* 7-Character Pass Code with 1-Click Copy & Digital Scannable Barcode */}
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <button
                                onClick={() => setActivePassDetailsId(pass.id)}
                                className="pass-code-pill"
                                title="Click to view pass details & scannable barcode"
                              >
                                <span>{pass.code}</span>
                              </button>

                              <button
                                onClick={(e) => handleCopyCode(pass.code, e)}
                                className="btn btn-outline btn-icon"
                                style={{ width: '26px', height: '26px', border: 'none', background: 'transparent' }}
                                title="Copy 7-digit code"
                              >
                                {isCopied ? <Check size={14} color="var(--success-accent)" /> : <Copy size={13} color="var(--text-muted)" />}
                              </button>
                            </div>
                            <div style={{ fontSize: '11px', color: 'var(--text-subtle)', marginTop: '2px' }}>
                              Pass #{pass.id}
                            </div>
                          </div>

                          {/* Scannable Barcode Thumbnail */}
                          <div
                            onClick={() => setActivePassDetailsId(pass.id)}
                            style={{ cursor: 'pointer', transition: 'transform 0.15s ease' }}
                            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.04)'}
                            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                            title="Click to view high-res scannable barcode"
                          >
                            <ScannableBarcode value={pass.code} type="CODE128" size="sm" showText={false} />
                          </div>
                        </div>
                      </td>

                      <td>
                        <div style={{ fontWeight: 700, fontSize: '13.5px' }}>{pass.category_name || pass.code_type}</div>
                        {pass.category_prefix && (
                          <span style={{
                            fontSize: '10.5px',
                            fontFamily: 'var(--font-mono)',
                            color: 'var(--primary-700)',
                            backgroundColor: 'var(--primary-50)',
                            padding: '1px 6px',
                            borderRadius: '4px',
                            fontWeight: 700
                          }}>
                            TAG: {pass.category_prefix}
                          </span>
                        )}
                      </td>

                      <td>
                        <Badge variant={
                          pass.status === 'active' ? 'success' :
                          pass.status === 'used' ? 'info' :
                          pass.status === 'expired' ? 'warning' : 'danger'
                        }>
                          {pass.status.toUpperCase()}
                        </Badge>
                      </td>

                      <td>
                        <div style={{ fontSize: '12.5px', color: 'var(--text-primary)' }}>
                          {new Date(pass.valid_from).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} – {new Date(pass.valid_until).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                        </div>
                      </td>

                      <td>
                        <div style={{ fontWeight: 800, fontSize: '13px' }}>
                          {pass.scan_count || 0} scans
                        </div>
                        {pass.last_scanned_at && (
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                            Last: {new Date(pass.last_scanned_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        )}
                      </td>

                      <td>
                        <Badge variant={pass.printed ? 'neutral' : 'warning'}>
                          {pass.printed ? 'PRINTED' : 'UNPRINTED'}
                        </Badge>
                      </td>

                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '6px' }}>
                          <button
                            onClick={() => setActivePassDetailsId(pass.id)}
                            className="btn btn-outline btn-sm btn-icon"
                            title="View Lifecycle Timeline"
                          >
                            <Eye size={14} />
                          </button>
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
            handleReissuePass(activePassDetailsId);
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
