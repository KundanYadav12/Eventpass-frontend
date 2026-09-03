import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { EventProvider } from './context/EventContext';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';

// Pages
import Dashboard from './pages/Dashboard';
import EventsManagement from './pages/EventsManagement';
import PassManagement from './pages/PassManagement';
import PassCategories from './pages/PassCategories';
import PassStyles from './pages/PassStyles';
import CustomerBilling from './pages/CustomerBilling';
import EventDeliverySettings from './pages/EventDeliverySettings';
import PrintBatches from './pages/PrintBatches';
import ScanHistory from './pages/ScanHistory';
import UserManagement from './pages/UserManagement';
import MessagesConfig from './pages/MessagesConfig';
import AuditLogs from './pages/AuditLogs';
import Settings from './pages/Settings';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import WebScanner from './pages/WebScanner';

function ProtectedLayout() {
  const { isAuthenticated, user, isSuperAdmin, hasPermission, loading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'var(--text-muted)' }}>Loading session...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const canViewPassStyles = isSuperAdmin || hasPermission('pass_styles.view') || hasPermission('pass_styles.use');
  const canBilling = isSuperAdmin || hasPermission('billing.create') || hasPermission('passes.generate');

  return (
    <EventProvider>
      <div className="app-layout">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="main-wrapper">
          <Navbar onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />
          <main style={{ flex: 1 }}>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              {isSuperAdmin && <Route path="/events" element={<EventsManagement />} />}
              <Route path="/passes" element={<PassManagement />} />
              <Route path="/categories" element={<PassCategories />} />
              {canViewPassStyles && <Route path="/pass-styles" element={<PassStyles />} />}
              {canBilling && <Route path="/billing" element={<CustomerBilling />} />}
              <Route path="/delivery-settings" element={<EventDeliverySettings />} />
              {isSuperAdmin && <Route path="/print-batches" element={<PrintBatches />} />}
              <Route path="/scan-history" element={<ScanHistory />} />
              {isSuperAdmin && <Route path="/users" element={<UserManagement />} />}
              {isSuperAdmin && <Route path="/messages" element={<MessagesConfig />} />}
              {isSuperAdmin && <Route path="/audit-logs" element={<AuditLogs />} />}
              <Route path="/settings" element={<Settings />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      </div>
    </EventProvider>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Auth Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* Standalone Gate Scanner with Back Button */}
        <Route path="/scanner" element={<WebScanner />} />

        {/* Protected Admin Routes */}
        <Route path="/*" element={<ProtectedLayout />} />
      </Routes>
    </BrowserRouter>
  );
}
