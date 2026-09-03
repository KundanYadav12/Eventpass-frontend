import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Calendar,
  Ticket,
  Tags,
  Palette,
  CreditCard,
  Send,
  Printer,
  History,
  Users,
  MessageSquare,
  ShieldAlert,
  Settings,
  QrCode,
  X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';

export default function Sidebar({ isOpen, onClose }) {
  const { user, isSuperAdmin, hasPermission } = useAuth();
  const { platformName } = useSettings();

  const canViewPassStyles = isSuperAdmin || hasPermission('pass_styles.view') || hasPermission('pass_styles.use');
  const canBilling = isSuperAdmin || hasPermission('billing.create') || hasPermission('passes.generate');

  const navItems = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    ...(isSuperAdmin ? [{ to: '/events', label: 'Events Management', icon: Calendar }] : []),
    { to: '/passes', label: 'Pass Inventory', icon: Ticket },
    { to: '/categories', label: 'Pass Categories', icon: Tags },
    ...(canViewPassStyles ? [{ to: '/pass-styles', label: 'Pass Styles', icon: Palette }] : []),
    ...(canBilling ? [{ to: '/billing', label: 'Billing & Issue', icon: CreditCard }] : []),
    { to: '/delivery-settings', label: 'Email & WhatsApp', icon: Send },
    ...(isSuperAdmin ? [{ to: '/print-batches', label: 'Print Batches', icon: Printer }] : []),
    { to: '/scan-history', label: 'Scan History', icon: History },
    ...(isSuperAdmin
      ? [
          { to: '/users', label: 'Admin Accounts', icon: Users },
          { to: '/messages', label: 'Scanner Messages', icon: MessageSquare },
          { to: '/audit-logs', label: 'Audit Logs', icon: ShieldAlert }
        ]
      : []),
    { to: '/settings', label: 'Settings', icon: Settings }
  ];

  return (
    <>
      {/* Mobile Drawer Overlay Backdrop */}
      {isOpen && (
        <div
          className="sidebar-backdrop"
          onClick={onClose}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(4px)',
            zIndex: 35
          }}
        />
      )}

      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        {/* Brand Header */}
        <div style={{
          padding: '24px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid var(--border-color)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div className="logo-badge">
              <QrCode size={22} />
            </div>
            <div>
              <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>
                {platformName}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 500 }}>
                Multi-Event Pass Platform
              </div>
            </div>
          </div>

          {isOpen && (
            <button onClick={onClose} className="btn btn-outline btn-icon" style={{ display: 'flex' }}>
              <X size={18} />
            </button>
          )}
        </div>

        {/* Navigation List */}
        <nav style={{ padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: '4px', flex: 1, overflowY: 'auto' }}>
          <div style={{ padding: '4px 10px', fontSize: '11px', fontWeight: 700, color: 'var(--text-subtle)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Navigation
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={onClose}
                className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Footer Banner */}
        <div style={{
          padding: '16px',
          borderTop: '1px solid var(--border-color)',
          fontSize: '11.5px',
          color: 'var(--text-subtle)',
          textAlign: 'center'
        }}>
          <div>{platformName} Pass Platform</div>
          <div style={{ marginTop: '2px', fontWeight: 600, color: 'var(--primary-600)' }}>
            {isSuperAdmin ? '⚡ SuperAdmin Access' : '👤 Operator Access'}
          </div>
        </div>
      </aside>
    </>
  );
}
