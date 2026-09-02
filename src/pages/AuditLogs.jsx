import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Search,
  Filter,
  RefreshCw,
  Eye,
  Calendar,
  Building2
} from 'lucide-react';
import { api } from '../services/api';
import { useEvent } from '../context/EventContext';
import { useToast } from '../context/ToastContext';
import Pagination from '../components/Pagination';
import Modal from '../components/Modal';
import Badge from '../components/Badge';
import { formatDateIST, formatTimeWithSecondsIST, formatDateTimeIST } from '../utils/dateUtil';

export default function AuditLogs() {
  const { selectedEvent } = useEvent();
  const [logs, setLogs] = useState([]);
  const [actions, setActions] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    totalRecords: 0,
    totalPages: 1
  });

  const [search, setSearch] = useState('');
  const [action, setAction] = useState('all');
  const [entity, setEntity] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [loading, setLoading] = useState(false);
  const [viewLog, setViewLog] = useState(null);

  const toast = useToast();

  const fetchLogs = async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page,
        limit: pagination.limit,
        ...(selectedEvent ? { eventId: selectedEvent.id } : {}),
        ...(search ? { search } : {}),
        ...(action !== 'all' ? { action } : {}),
        ...(entity !== 'all' ? { entity } : {}),
        ...(dateFrom ? { dateFrom } : {}),
        ...(dateTo ? { dateTo } : {})
      });

      const res = await api.get(`/audit?${params.toString()}`);
      if (res.success) {
        setLogs(res.logs);
        setActions(res.actions || []);
        setPagination(res.pagination);
      }
    } catch (err) {
      toast.error('Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs(1);
  }, [selectedEvent, action, entity, dateFrom, dateTo, pagination.limit]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchLogs(1);
  };

  return (
    <div style={{ padding: '24px 32px', maxWidth: '1440px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800 }}>Administrative Audit Trail</h1>
          <p style={{ fontSize: '13.5px', color: 'var(--text-muted)' }}>
            Immutable security log tracking all pass generation, renewals, voids, prints, and event updates
            {selectedEvent && <span> for <strong>{selectedEvent.event_name}</strong></span>}
          </p>
        </div>

        <button onClick={() => fetchLogs(pagination.page)} className="btn btn-outline btn-icon" title="Refresh">
          <RefreshCw size={16} />
        </button>
      </div>

      {/* Toolbar */}
      <div className="card" style={{ marginBottom: '20px', padding: '16px 20px' }}>
        <form onSubmit={handleSearch} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '240px' }}>
              <input
                type="text"
                placeholder="Search by admin name, action, or entity ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ width: '100%' }}
              />
            </div>
            <button type="submit" className="btn btn-primary" style={{ padding: '0 20px' }}>
              Search
            </button>
          </div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
            <select value={action} onChange={(e) => setAction(e.target.value)} style={{ padding: '6px 10px', fontSize: '13px' }}>
              <option value="all">All Actions</option>
              {actions.map(a => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>

            <select value={entity} onChange={(e) => setEntity(e.target.value)} style={{ padding: '6px 10px', fontSize: '13px' }}>
              <option value="all">All Entities</option>
              <option value="PASS">Pass</option>
              <option value="EVENT">Event</option>
              <option value="PASS_CATEGORY">Category</option>
              <option value="PRINT_BATCH">Print Batch</option>
              <option value="USER">User Account</option>
            </select>

            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              style={{ padding: '5px 8px', fontSize: '12.5px' }}
            />
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>to</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              style={{ padding: '5px 8px', fontSize: '12.5px' }}
            />
          </div>
        </form>
      </div>

      {/* Audit Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Administrator</th>
                <th>Action</th>
                <th>Entity & ID</th>
                <th>Event Scope</th>
                <th>IP Address</th>
                <th style={{ textAlign: 'right' }}>Payload Diff</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                    Loading audit trail...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                    No audit records found matching criteria.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id}>
                    <td>
                      <div style={{ fontSize: '13px', fontWeight: 600 }}>
                        {formatTimeWithSecondsIST(log.created_at)}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        {formatDateIST(log.created_at)}
                      </div>
                    </td>

                    <td>
                      <span style={{ fontWeight: 700 }}>{log.user_name || 'System'}</span>
                    </td>

                    <td>
                      <span style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '12px',
                        fontWeight: 700,
                        backgroundColor: 'var(--bg-surface-hover)',
                        padding: '2px 8px',
                        borderRadius: '4px'
                      }}>
                        {log.action}
                      </span>
                    </td>

                    <td>
                      <span style={{ fontWeight: 600 }}>{log.entity}</span>
                      {log.entity_id && (
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)', marginLeft: '6px' }}>
                          #{log.entity_id}
                        </span>
                      )}
                    </td>

                    <td>
                      <span style={{ fontSize: '12px' }}>{log.event_name || '🌐 Global'}</span>
                    </td>

                    <td>
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                        {log.ip_address || '127.0.0.1'}
                      </span>
                    </td>

                    <td style={{ textAlign: 'right' }}>
                      <button
                        onClick={() => setViewLog(log)}
                        className="btn btn-outline btn-sm btn-icon"
                        title="View Change Diff Payload"
                      >
                        <Eye size={14} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <Pagination
          currentPage={pagination.page}
          totalPages={pagination.totalPages}
          totalRecords={pagination.totalRecords}
          pageSize={pagination.limit}
          onPageChange={(page) => fetchLogs(page)}
          onPageSizeChange={(limit) => setPagination(prev => ({ ...prev, limit, page: 1 }))}
        />
      </div>

      {/* JSON Diff Payload Modal */}
      {viewLog && (
        <Modal
          isOpen={true}
          onClose={() => setViewLog(null)}
          title={`Audit Payload Record #${viewLog.id} — ${viewLog.action}`}
          maxWidth="600px"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
              <span>Action: <strong>{viewLog.action}</strong></span>
              <span>By: <strong>{viewLog.user_name}</strong></span>
            </div>

            {viewLog.old_value && (
              <div>
                <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--danger-accent)', marginBottom: '4px' }}>
                  Previous State (Old):
                </div>
                <pre style={{ backgroundColor: 'var(--bg-app)', padding: '10px', borderRadius: '6px', fontSize: '11.5px', overflowX: 'auto', border: '1px solid var(--border-color)' }}>
                  {typeof viewLog.old_value === 'string' ? viewLog.old_value : JSON.stringify(viewLog.old_value, null, 2)}
                </pre>
              </div>
            )}

            {viewLog.new_value && (
              <div>
                <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--success-accent)', marginBottom: '4px' }}>
                  Updated State (New):
                </div>
                <pre style={{ backgroundColor: 'var(--bg-app)', padding: '10px', borderRadius: '6px', fontSize: '11.5px', overflowX: 'auto', border: '1px solid var(--border-color)' }}>
                  {typeof viewLog.new_value === 'string' ? viewLog.new_value : JSON.stringify(viewLog.new_value, null, 2)}
                </pre>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
              <button onClick={() => setViewLog(null)} className="btn btn-secondary">
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
