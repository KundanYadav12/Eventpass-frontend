import React, { useState, useEffect } from 'react';
import {
  History,
  Search,
  Filter,
  RefreshCw,
  Sliders,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Building2
} from 'lucide-react';
import { api } from '../services/api';
import { useEvent } from '../context/EventContext';
import { useToast } from '../context/ToastContext';
import Pagination from '../components/Pagination';
import Badge from '../components/Badge';

import { formatDateIST, formatTimeWithSecondsIST } from '../utils/dateUtil';

export default function ScanHistory() {
  const { selectedEvent } = useEvent();
  const [history, setHistory] = useState([]);
  const [devices, setDevices] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    totalRecords: 0,
    totalPages: 1
  });

  const [search, setSearch] = useState('');
  const [result, setResult] = useState('all');
  const [deviceId, setDeviceId] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [loading, setLoading] = useState(false);

  const toast = useToast();

  const fetchHistory = async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page,
        limit: pagination.limit,
        ...(selectedEvent ? { eventId: selectedEvent.id } : {}),
        ...(search ? { search } : {}),
        ...(result !== 'all' ? { result } : {}),
        ...(deviceId !== 'all' ? { deviceId } : {}),
        ...(dateFrom ? { dateFrom } : {}),
        ...(dateTo ? { dateTo } : {})
      });

      const res = await api.get(`/scan/history?${params.toString()}`);
      if (res.success) {
        setHistory(res.history);
        setDevices(res.devices || []);
        setPagination(res.pagination);
      }
    } catch (err) {
      toast.error('Failed to load scan history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory(1);
  }, [selectedEvent, result, deviceId, dateFrom, dateTo, pagination.limit]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchHistory(1);
  };

  return (
    <div style={{ padding: '24px 32px', maxWidth: '1440px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800 }}>Gate Scan History</h1>
          <p style={{ fontSize: '13.5px', color: 'var(--text-muted)' }}>
            Real-time immutable log of all gate pass verifications, approvals, and denials
            {selectedEvent && <span> for <strong>{selectedEvent.event_name}</strong></span>}
          </p>
        </div>

        <button onClick={() => fetchHistory(pagination.page)} className="btn btn-outline btn-icon" title="Refresh">
          <RefreshCw size={16} />
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="card" style={{ marginBottom: '20px', padding: '16px 20px' }}>
        <form onSubmit={handleSearch} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '240px' }}>
              <input
                type="text"
                placeholder="Search by 7-character Pass Code..."
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
            <select value={result} onChange={(e) => setResult(e.target.value)} style={{ padding: '6px 10px', fontSize: '13px' }}>
              <option value="all">All Verification Results</option>
              <option value="approved">Approved</option>
              <option value="already_used">Already Used</option>
              <option value="expired">Expired</option>
              <option value="wrong_date">Wrong Date</option>
              <option value="voided">Voided</option>
              <option value="invalid">Invalid Code</option>
            </select>

            <select value={deviceId} onChange={(e) => setDeviceId(e.target.value)} style={{ padding: '6px 10px', fontSize: '13px' }}>
              <option value="all">All Gates / Devices</option>
              {devices.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>

            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              style={{ padding: '5px 8px', fontSize: '12.5px' }}
              title="From Date"
            />
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>to</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              style={{ padding: '5px 8px', fontSize: '12.5px' }}
              title="To Date"
            />
          </div>
        </form>
      </div>

      {/* History Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Pass Code (7-Digit)</th>
                <th>Event & Category</th>
                <th>Result</th>
                <th>Gate / Device</th>
                <th>Reason / Notice</th>
                <th>Operator</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                    Loading scan history...
                  </td>
                </tr>
              ) : history.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                    No scan entries found matching criteria.
                  </td>
                </tr>
              ) : (
                history.map((s) => (
                  <tr key={s.id}>
                    <td>
                      <div style={{ fontSize: '13px', fontWeight: 600 }}>
                        {formatTimeWithSecondsIST(s.scan_time)}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        {formatDateIST(s.scan_time)}
                      </div>
                    </td>

                    <td>
                      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, color: 'var(--primary-600)', fontSize: '14px' }}>
                        {s.pass_code}
                      </span>
                    </td>

                    <td>
                      <div style={{ fontWeight: 600 }}>{s.category_name || s.pass_type || 'General'}</div>
                      <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>{s.event_name || 'Event 2026'}</div>
                    </td>

                    <td>
                      <Badge variant={s.result === 'approved' ? 'success' : 'danger'}>
                        {s.result.toUpperCase()}
                      </Badge>
                    </td>

                    <td>
                      <span style={{ fontWeight: 700, fontSize: '12.5px' }}>{s.device_id}</span>
                    </td>

                    <td>
                      <span style={{ fontSize: '12.5px', color: s.result === 'approved' ? 'var(--success-accent)' : 'var(--danger-accent)' }}>
                        {s.reason || (s.result === 'approved' ? 'Entry Approved' : 'Denied')}
                      </span>
                    </td>

                    <td>
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        {s.operator_name || 'System / Scanner'}
                      </span>
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
          onPageChange={(page) => fetchHistory(page)}
          onPageSizeChange={(limit) => setPagination(prev => ({ ...prev, limit, page: 1 }))}
        />
      </div>
    </div>
  );
}
