import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sun,
  Moon,
  LogOut,
  User,
  QrCode,
  Calendar,
  ChevronDown,
  Check,
  Building2,
  Menu,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useEvent } from '../context/EventContext';

export default function Navbar({ onMenuToggle }) {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const { events, selectedEvent, selectEvent } = useEvent();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isSuperAdmin = user?.role === 'SUPERADMIN';

  return (
    <header className="navbar">
      {/* Left side: Hamburger & Event Selector */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <button
          onClick={onMenuToggle}
          className="btn btn-outline btn-icon mobile-menu-btn"
          title="Toggle Navigation"
        >
          <Menu size={20} />
        </button>

        {/* Multi-Event Selector Dropdown */}
        <div style={{ position: 'relative' }} ref={dropdownRef}>
          <div style={{ fontSize: '10.5px', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.5px', color: 'var(--text-subtle)', marginBottom: '2px' }}>
            Active Event Context
          </div>
          <button
            onClick={() => isSuperAdmin && setDropdownOpen(!dropdownOpen)}
            className="btn btn-outline"
            style={{
              padding: '6px 12px',
              height: 'auto',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: 'var(--bg-surface)',
              borderColor: 'var(--border-color)',
              cursor: isSuperAdmin ? 'pointer' : 'default',
              minWidth: '220px',
              justifyContent: 'space-between'
            }}
            title={isSuperAdmin ? 'Switch Selected Event' : 'Assigned Event'}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
              <Building2 size={16} color="var(--primary-600)" />
              <span style={{ fontWeight: 700, fontSize: '13.5px', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {selectedEvent ? selectedEvent.event_name : (isSuperAdmin ? 'All Events (Global)' : 'Assigned Event')}
              </span>
            </div>
            {isSuperAdmin && <ChevronDown size={14} color="var(--text-muted)" />}
          </button>

          {/* SuperAdmin Event Selector Dropdown Menu */}
          {dropdownOpen && isSuperAdmin && (
            <div style={{
              position: 'absolute',
              top: 'calc(100% + 6px)',
              left: 0,
              width: '280px',
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-lg)',
              boxShadow: 'var(--shadow-xl)',
              zIndex: 100,
              padding: '6px',
              animation: 'fadeIn 0.15s ease'
            }}>
              <div style={{ padding: '6px 10px', fontSize: '11px', fontWeight: 700, color: 'var(--text-subtle)', textTransform: 'uppercase' }}>
                Select Event
              </div>

              <div style={{ maxHeight: '240px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                {events.map((ev) => {
                  const isSelected = selectedEvent?.id === ev.id;
                  return (
                    <button
                      key={ev.id}
                      onClick={() => {
                        selectEvent(ev);
                        setDropdownOpen(false);
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '8px 10px',
                        borderRadius: 'var(--radius-md)',
                        backgroundColor: isSelected ? 'var(--primary-50)' : 'transparent',
                        color: isSelected ? 'var(--primary-700)' : 'var(--text-primary)',
                        border: 'none',
                        textAlign: 'left',
                        cursor: 'pointer',
                        width: '100%',
                        transition: 'var(--transition)'
                      }}
                      className="dropdown-item-hover"
                    >
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 600 }}>{ev.event_name}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                          {ev.event_code} • {ev.venue || 'Main Venue'}
                        </div>
                      </div>
                      {isSelected && <Check size={16} color="var(--primary-600)" />}
                    </button>
                  );
                })}

                {/* All Events option for SuperAdmin global overview */}
                <button
                  onClick={() => {
                    selectEvent(null);
                    setDropdownOpen(false);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 10px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: !selectedEvent ? 'var(--primary-50)' : 'transparent',
                    color: !selectedEvent ? 'var(--primary-700)' : 'var(--text-primary)',
                    border: 'none',
                    textAlign: 'left',
                    cursor: 'pointer',
                    width: '100%',
                    borderTop: '1px solid var(--border-color)',
                    marginTop: '4px'
                  }}
                  className="dropdown-item-hover"
                >
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 700 }}>🌐 All Events (Global Overview)</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Aggregate across all events</div>
                  </div>
                  {!selectedEvent && <Check size={16} color="var(--primary-600)" />}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right side controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {/* Open Gate Scanner Quick Action */}
        <button
          onClick={() => navigate('/scanner')}
          className="btn btn-primary"
          style={{ padding: '6px 14px', fontSize: '12.5px', height: '36px' }}
        >
          <QrCode size={16} />
          <span>Open Scanner</span>
        </button>

        {/* Light / Dark Mode Toggle */}
        <button
          onClick={toggleTheme}
          className="btn btn-outline btn-icon"
          title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {isDark ? <Sun size={18} color="#FBBF24" /> : <Moon size={18} color="#6366F1" />}
        </button>

        {/* User Pill & Role */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '4px 10px',
          borderRadius: 'var(--radius-full)',
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-color)',
          fontSize: '13px'
        }}>
          <div style={{
            width: '24px',
            height: '24px',
            borderRadius: '50%',
            backgroundColor: 'var(--primary-100)',
            color: 'var(--primary-700)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 700,
            fontSize: '11px'
          }}>
            {user?.name?.charAt(0) || 'U'}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontWeight: 600, lineHeight: 1.2 }}>{user?.name || 'User'}</span>
            <span style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>{user?.role}</span>
          </div>
        </div>

        {/* Logout Button */}
        <button
          onClick={logout}
          className="btn btn-outline btn-icon"
          title="Sign Out"
          style={{ color: 'var(--danger-accent)' }}
        >
          <LogOut size={18} />
        </button>
      </div>
    </header>
  );
}
