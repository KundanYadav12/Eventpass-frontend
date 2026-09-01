import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Ticket,
  Printer,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  QrCode,
  TrendingUp,
  Radio,
  ArrowRight,
  Sparkles,
  Calendar,
  Building2,
  MapPin,
  ShieldCheck,
  Zap,
  Users
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useEvent } from '../context/EventContext';
import Badge from '../components/Badge';

export default function Dashboard() {
  const { user } = useAuth();
  const { selectedEvent } = useEvent();
  const [statsData, setStatsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchStats = async () => {
    try {
      const url = selectedEvent ? `/dashboard/stats?eventId=${selectedEvent.id}` : '/dashboard/stats';
      const res = await api.get(url);
      if (res.success) {
        setStatsData(res);
      }
    } catch (err) {
      console.warn('Dashboard stats error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 5000);
    return () => clearInterval(interval);
  }, [selectedEvent]);

  const stats = statsData?.stats || {
    totalPasses: 0,
    totalPrinted: 0,
    totalUnprinted: 0,
    totalUsed: 0,
    totalUnused: 0,
    totalExpired: 0,
    totalVoid: 0,
    todayScans: 0,
    successfulScansToday: 0,
    failedScansToday: 0
  };

  const currentEvent = statsData?.currentEvent || selectedEvent;
  const isSuperAdmin = user?.role === 'SUPERADMIN';

  return (
    <div style={{ padding: '24px 32px', maxWidth: '1440px', margin: '0 auto' }}>
      {/* Event Header Banner with Quick Context */}
      <div className="card" style={{
        marginBottom: '24px',
        background: 'linear-gradient(135deg, var(--bg-surface), var(--bg-surface-hover))',
        border: '1px solid var(--border-color)',
        padding: '24px 28px',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', position: 'relative', zIndex: 1 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
              <div style={{
                padding: '3px 8px',
                borderRadius: 'var(--radius-full)',
                backgroundColor: 'var(--primary-100)',
                color: 'var(--primary-700)',
                fontSize: '11.5px',
                fontWeight: 800,
                letterSpacing: '0.5px'
              }}>
                {currentEvent ? currentEvent.event_code : 'GLOBAL VIEW'}
              </div>
              {currentEvent && (
                <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <MapPin size={13} />
                  {currentEvent.venue || 'Main Venue'}
                </span>
              )}
            </div>

            <h1 style={{ fontSize: '26px', fontWeight: 800, letterSpacing: '-0.5px' }}>
              {currentEvent ? currentEvent.event_name : 'Global Multi-Event Command Center'}
            </h1>
            <p style={{ fontSize: '13.5px', color: 'var(--text-muted)', marginTop: '2px' }}>
              {currentEvent
                ? `Operational dates: ${new Date(currentEvent.event_start_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} – ${new Date(currentEvent.event_end_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })} • Active Gate Authority`
                : 'Aggregating real-time pass inventory, admissions, and gate scanners across all events'}
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            {isSuperAdmin && (
              <Link to="/events" className="btn btn-outline" style={{ height: '40px' }}>
                <Calendar size={16} />
                <span>Switch Event</span>
              </Link>
            )}
            <button
              onClick={() => navigate('/scanner')}
              className="btn btn-primary"
              style={{ height: '40px', padding: '0 20px' }}
            >
              <QrCode size={17} />
              <span>Launch Gate Scanner</span>
            </button>
          </div>
        </div>
      </div>

      {/* Primary KPI Stats Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '18px',
        marginBottom: '24px'
      }}>
        {/* Total Passes */}
        <div className="stat-card">
          <div style={{
            width: '50px',
            height: '50px',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--primary-50)',
            color: 'var(--primary-600)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(79, 70, 229, 0.15)'
          }}>
            <Ticket size={24} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>Total Pass Inventory</div>
            <div style={{ fontSize: '26px', fontWeight: 800, lineHeight: 1.1, marginTop: '2px' }}>
              {Number(stats.totalPasses).toLocaleString()}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-subtle)', marginTop: '4px' }}>
              7-character unique codes
            </div>
          </div>
        </div>

        {/* Printed Passes */}
        <div className="stat-card">
          <div style={{
            width: '50px',
            height: '50px',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--info-bg)',
            color: 'var(--info-accent)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(59, 130, 246, 0.15)'
          }}>
            <Printer size={24} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>Labels Printed</div>
            <div style={{ fontSize: '26px', fontWeight: 800, lineHeight: 1.1, marginTop: '2px' }}>
              {Number(stats.totalPrinted).toLocaleString()}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-subtle)', marginTop: '4px' }}>
              {Number(stats.totalUnprinted).toLocaleString()} unprinted in queue
            </div>
          </div>
        </div>

        {/* Used / Scanned */}
        <div className="stat-card">
          <div style={{
            width: '50px',
            height: '50px',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--success-bg)',
            color: 'var(--success-accent)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(16, 185, 129, 0.15)'
          }}>
            <CheckCircle2 size={24} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>Admitted Passes</div>
            <div style={{ fontSize: '26px', fontWeight: 800, color: 'var(--success-accent)', lineHeight: 1.1, marginTop: '2px' }}>
              {Number(stats.totalUsed).toLocaleString()}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-subtle)', marginTop: '4px' }}>
              {Number(stats.totalUnused).toLocaleString()} passes unused
            </div>
          </div>
        </div>

        {/* Today's Scans */}
        <div className="stat-card">
          <div style={{
            width: '50px',
            height: '50px',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--warning-bg)',
            color: 'var(--warning-accent)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(245, 158, 11, 0.15)'
          }}>
            <Radio size={24} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>Today's Gate Traffic</div>
            <div style={{ fontSize: '26px', fontWeight: 800, lineHeight: 1.1, marginTop: '2px' }}>
              {Number(stats.todayScans).toLocaleString()}
            </div>
            <div style={{ fontSize: '11.5px', color: 'var(--success-accent)', fontWeight: 700, marginTop: '4px' }}>
              {stats.successfulScansToday} approved • {stats.failedScansToday} denied
            </div>
          </div>
        </div>
      </div>

      {/* Middle Section: Category Breakdown & Live Scans Feed */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))',
        gap: '20px',
        marginBottom: '24px'
      }}>
        {/* Pass Categories Breakdown */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
            <div>
              <h2 style={{ fontSize: '17px', fontWeight: 800 }}>Category Inventory Breakdown</h2>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Real-time print & scan completion by tier</div>
            </div>
            <Link to="/categories" style={{ fontSize: '12.5px', color: 'var(--primary-600)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span>Manage Tiers</span>
              <ArrowRight size={14} />
            </Link>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', flex: 1 }}>
            {statsData?.categoryStats && statsData.categoryStats.length > 0 ? (
              statsData.categoryStats.map(cat => {
                const total = cat.total_quantity || 1;
                const printedPercent = Math.min(100, Math.round(((cat.printed_count || 0) / total) * 100));
                const usedPercent = Math.min(100, Math.round(((cat.used_count || 0) / total) * 100));

                return (
                  <div key={cat.id} style={{
                    padding: '14px 16px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--bg-surface-hover)',
                    border: '1px solid var(--border-color)'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontWeight: 800, fontSize: '14px', color: 'var(--text-primary)' }}>{cat.name}</span>
                        {cat.category_prefix && (
                          <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', padding: '1px 6px', borderRadius: '4px', backgroundColor: 'var(--primary-50)', color: 'var(--primary-700)', fontWeight: 700 }}>
                            {cat.category_prefix}
                          </span>
                        )}
                      </div>
                      <span style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--text-primary)' }}>
                        {Number(cat.actual_in_db || 0).toLocaleString()} passes
                      </span>
                    </div>

                    {/* Multi-tier progress bar */}
                    <div style={{ width: '100%', height: '8px', backgroundColor: 'var(--border-color)', borderRadius: '4px', overflow: 'hidden', display: 'flex', marginBottom: '8px' }}>
                      <div style={{ width: `${printedPercent}%`, background: 'var(--primary-500)', borderRadius: '4px' }} title={`Printed: ${printedPercent}%`} />
                      <div style={{ width: `${usedPercent}%`, background: 'var(--success-accent)', borderRadius: '4px' }} title={`Used: ${usedPercent}%`} />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', color: 'var(--text-muted)' }}>
                      <span>Printed: <strong style={{ color: 'var(--primary-600)' }}>{cat.printed_count || 0}</strong> ({printedPercent}%)</span>
                      <span>Admitted: <strong style={{ color: 'var(--success-accent)' }}>{cat.used_count || 0}</strong> ({usedPercent}%)</span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)', margin: 'auto 0' }}>
                No pass categories configured for this event.
              </div>
            )}
          </div>
        </div>

        {/* Live Gate Stream Activity */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span className="live-indicator" />
              <div>
                <h2 style={{ fontSize: '17px', fontWeight: 800 }}>Live Gate Stream</h2>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Real-time gate pass validation feed</div>
              </div>
            </div>
            <Link to="/scan-history" style={{ fontSize: '12.5px', color: 'var(--primary-600)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span>Full Audit</span>
              <ArrowRight size={14} />
            </Link>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1, overflowY: 'auto', maxHeight: '380px' }}>
            {statsData?.recentScans && statsData.recentScans.length > 0 ? (
              statsData.recentScans.map(scan => (
                <div key={scan.id} style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--bg-surface-hover)',
                  border: '1px solid var(--border-color)',
                  fontSize: '13px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Badge variant={scan.result === 'approved' ? 'success' : 'danger'}>
                      {scan.result.toUpperCase()}
                    </Badge>
                    <span style={{ fontWeight: 800, fontFamily: 'var(--font-mono)', letterSpacing: '0.5px' }}>
                      {scan.pass_code}
                    </span>
                    <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>
                      {scan.device_id}
                    </span>
                  </div>
                  <div style={{ color: 'var(--text-subtle)', fontSize: '11.5px', fontWeight: 600 }}>
                    {new Date(scan.scan_time).toLocaleTimeString()}
                  </div>
                </div>
              ))
            ) : (
              <div style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)', margin: 'auto 0' }}>
                Waiting for gate scan events...
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
