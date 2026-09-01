import React from 'react';
import { Settings as SettingsIcon, Server, Database, Printer, Shield, Globe, Cpu } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Settings() {
  const { user } = useAuth();

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">System Settings & Infrastructure</h1>
          <p className="page-subtitle">Server status, port 5006 configuration, database health, and printer specifications</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px' }}>
        {/* Backend & Domain Info */}
        <div className="card">
          <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Server size={18} color="var(--primary-600)" />
            Server & Network Routing
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13.5px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-color)' }}>
              <span style={{ color: 'var(--text-muted)' }}>Backend Port</span>
              <strong>Port 5006 (http://127.0.0.1:5006)</strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-color)' }}>
              <span style={{ color: 'var(--text-muted)' }}>Production Domain</span>
              <strong style={{ color: 'var(--primary-600)' }}>https://eventgen.duckdns.org</strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-color)' }}>
              <span style={{ color: 'var(--text-muted)' }}>Nginx API Proxy</span>
              <code>/api → http://127.0.0.1:5006</code>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
              <span style={{ color: 'var(--text-muted)' }}>PM2 Process Name</span>
              <code>eventgen-backend</code>
            </div>
          </div>
        </div>

        {/* Database & Concurrency */}
        <div className="card">
          <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Database size={18} color="var(--primary-600)" />
            Database & Concurrency Protection
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13.5px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-color)' }}>
              <span style={{ color: 'var(--text-muted)' }}>Database Engine</span>
              <strong>MySQL 8.0 (eventgen_db)</strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-color)' }}>
              <span style={{ color: 'var(--text-muted)' }}>Concurrency Locking</span>
              <span className="badge badge-active">Distributed Mutex / Row Lock</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-color)' }}>
              <span style={{ color: 'var(--text-muted)' }}>Pass Cryptography</span>
              <strong>HMAC-SHA256 Signatures</strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
              <span style={{ color: 'var(--text-muted)' }}>Daily Unlock Boundary</span>
              <strong>1:00 AM (Server-Side Clock)</strong>
            </div>
          </div>
        </div>

        {/* Printer Specifications */}
        <div className="card">
          <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Printer size={18} color="var(--primary-600)" />
            TSC TE244 Thermal Printer Configuration
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13.5px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-color)' }}>
              <span style={{ color: 'var(--text-muted)' }}>Printer Model</span>
              <strong>TSC TE244 Direct Thermal</strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-color)' }}>
              <span style={{ color: 'var(--text-muted)' }}>Label Size</span>
              <strong>50mm × 50mm (2 Labels Per Row)</strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-color)' }}>
              <span style={{ color: 'var(--text-muted)' }}>Command Protocol</span>
              <strong>TSPL / TSPL2 Dual-Column</strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
              <span style={{ color: 'var(--text-muted)' }}>Safe Print Queue</span>
              <span className="badge badge-active">Active (Roll pause/resume)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
