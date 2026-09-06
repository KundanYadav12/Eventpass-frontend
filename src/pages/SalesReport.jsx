import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  TrendingUp,
  ShoppingBag,
  Percent,
  Users,
  Calendar,
  Filter,
  Download,
  RefreshCw,
  Search,
  CreditCard,
  Tag,
  Building2,
  CheckCircle2,
  Ban,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  PieChart,
  BarChart3,
  FileText,
  SlidersHorizontal,
  Clock,
  Layers,
  Phone,
  Mail
} from 'lucide-react';
import { api } from '../services/api';
import { useEvent } from '../context/EventContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Pagination from '../components/Pagination';
import Badge from '../components/Badge';
import { formatDateIST, formatTimeIST, formatDateTimeIST } from '../utils/dateUtil';

export default function SalesReport() {
  const { user, isSuperAdmin } = useAuth();
  const { events, selectedEvent, setSelectedEvent } = useEvent();
  const toast = useToast();

  const [activeTab, setActiveTab] = useState('transactions'); // 'transactions' | 'categories' | 'events' | 'trends' | 'customers' | 'payment'

  // Summary KPIs State
  const [summary, setSummary] = useState({
    totalInvoices: 0,
    totalPassesSold: 0,
    totalSalesAmount: 0,
    totalGst: 0,
    totalDiscount: 0,
    netRevenue: 0,
    totalSubtotal: 0,
    averagePassValue: 0,
    totalCustomers: 0,
    totalVoidedPasses: 0
  });

  // Table Data State
  const [transactions, setTransactions] = useState([]);
  const [categorySales, setCategorySales] = useState([]);
  const [eventSales, setEventSales] = useState([]);
  const [salesTrend, setSalesTrend] = useState([]);
  const [trendGrouping, setTrendGrouping] = useState('daily'); // 'daily' | 'weekly' | 'monthly'
  const [customerSales, setCustomerSales] = useState([]);
  const [customerPagination, setCustomerPagination] = useState({ page: 1, limit: 20, totalRecords: 0, totalPages: 1 });
  const [paymentSummary, setPaymentSummary] = useState([]);
  const [categories, setCategories] = useState([]);

  // Pagination State for Transactions
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    totalRecords: 0,
    totalPages: 1
  });

  // Filter State
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState('all');
  const [datePreset, setDatePreset] = useState('all'); // 'all' | 'today' | 'yesterday' | 'last_7_days' | 'last_30_days' | 'this_month' | 'previous_month' | 'custom'
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [sharingMethod, setSharingMethod] = useState('all');
  const [passStatus, setPassStatus] = useState('all');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  const [loading, setLoading] = useState(false);
  const [exportingExcel, setExportingExcel] = useState(false);

  const buildQueryParams = (page = 1, extra = {}) => {
    return new URLSearchParams({
      page,
      limit: pagination.limit,
      ...(selectedEvent ? { eventId: selectedEvent.id } : {}),
      ...(categoryId !== 'all' ? { categoryId } : {}),
      ...(datePreset !== 'all' ? { datePreset } : {}),
      ...(dateFrom ? { dateFrom } : {}),
      ...(dateTo ? { dateTo } : {}),
      ...(search ? { search } : {}),
      ...(sharingMethod !== 'all' ? { sharingMethod } : {}),
      ...(passStatus !== 'all' ? { passStatus } : {}),
      ...extra
    });
  };

  const fetchSalesData = async (page = 1) => {
    setLoading(true);
    try {
      const params = buildQueryParams(page);

      // Fetch summary and transactions in parallel
      const [sumRes, txRes] = await Promise.all([
        api.get(`/sales/summary?${params.toString()}`),
        api.get(`/sales/transactions?${params.toString()}`)
      ]);

      if (sumRes.success) setSummary(sumRes.data);
      if (txRes.success) {
        setTransactions(txRes.transactions || []);
        setPagination(txRes.pagination);
      }

      // If active tab is categories, trends, customers, or events, fetch corresponding data
      if (activeTab === 'categories') {
        const catRes = await api.get(`/sales/categories?${params.toString()}`);
        if (catRes.success) setCategorySales(catRes.data || []);
      } else if (activeTab === 'events' && isSuperAdmin) {
        const evRes = await api.get(`/sales/events?${params.toString()}`);
        if (evRes.success) setEventSales(evRes.data || []);
      } else if (activeTab === 'trends') {
        const trendRes = await api.get(`/sales/trend?${params.toString()}&grouping=${trendGrouping}`);
        if (trendRes.success) setSalesTrend(trendRes.data || []);
      } else if (activeTab === 'customers') {
        const custRes = await api.get(`/sales/customers?${params.toString()}&page=${customerPagination.page}`);
        if (custRes.success) {
          setCustomerSales(custRes.customers || []);
          setCustomerPagination(custRes.pagination);
        }
      } else if (activeTab === 'payment') {
        const payRes = await api.get(`/sales/payment-summary?${params.toString()}`);
        if (payRes.success) setPaymentSummary(payRes.data || []);
      }
    } catch (err) {
      toast.error('Failed to load sales report data');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const url = selectedEvent ? `/categories?eventId=${selectedEvent.id}` : '/categories';
      const res = await api.get(url);
      if (res.success) setCategories(res.data || []);
    } catch (e) {
      // Ignore
    }
  };

  useEffect(() => {
    fetchSalesData(1);
    fetchCategories();
  }, [
    selectedEvent, categoryId, datePreset, dateFrom, dateTo,
    sharingMethod, passStatus, activeTab, trendGrouping, pagination.limit
  ]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchSalesData(1);
  };

  const handleResetFilters = () => {
    setSearch('');
    setCategoryId('all');
    setDatePreset('all');
    setDateFrom('');
    setDateTo('');
    setSharingMethod('all');
    setPassStatus('all');
    fetchSalesData(1);
  };

  const handleExportExcel = async () => {
    setExportingExcel(true);
    try {
      const params = buildQueryParams(1);
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5006/api/sales/export-excel?${params.toString()}`, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      });

      if (!response.ok) {
        throw new Error('Sales Excel export failed');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `SalesReport_${new Date().toISOString().slice(0, 10)}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Sales Report Excel downloaded successfully!');
    } catch (err) {
      toast.error('Failed to export sales Excel');
    } finally {
      setExportingExcel(false);
    }
  };

  const handleDrilldownEvent = (eventId) => {
    const target = events.find(e => e.id === eventId);
    if (target) {
      setSelectedEvent(target);
      setActiveTab('transactions');
      toast.info(`Filtered to ${target.event_name}`);
    }
  };

  return (
    <div style={{ padding: '24px 32px', maxWidth: '1560px', margin: '0 auto' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span style={{
              padding: '2px 8px',
              borderRadius: '4px',
              backgroundColor: '#EFF6FF',
              color: '#1D4ED8',
              fontSize: '11px',
              fontWeight: 800,
              letterSpacing: '0.5px'
            }}>
              FINANCIAL ANALYTICS
            </span>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>IST (Asia/Kolkata, UTC+5:30)</span>
          </div>
          <h1 style={{ fontSize: '26px', fontWeight: 800, letterSpacing: '-0.5px' }}>
            Pass Sales & Revenue Performance Report
          </h1>
          <p style={{ fontSize: '13.5px', color: 'var(--text-muted)', marginTop: '2px' }}>
            Comprehensive pass sales ledger, tax computation, category breakdown, customer spend, and trend analytics
            {selectedEvent && <span> for <strong>{selectedEvent.event_name}</strong></span>}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={handleExportExcel}
            disabled={exportingExcel || loading}
            className="btn btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700 }}
            title="Download full sales report in .xlsx format"
          >
            <Download size={15} />
            <span>{exportingExcel ? 'Exporting...' : 'Export Excel (.xlsx)'}</span>
          </button>

          <button onClick={() => fetchSalesData(pagination.page)} className="btn btn-outline btn-icon" title="Refresh Sales Data">
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {/* 8 Primary Financial Summary KPI Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '16px',
        marginBottom: '24px'
      }}>
        {/* 1. Total Passes Sold */}
        <div className="stat-card" style={{ padding: '16px 18px' }}>
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '10px',
            backgroundColor: '#EFF6FF',
            color: '#2563EB',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <ShoppingBag size={22} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
              Total Passes Sold
            </div>
            <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)', marginTop: '2px' }}>
              {Number(summary.totalPassesSold).toLocaleString()}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-subtle)', marginTop: '2px' }}>
              Across {summary.totalInvoices} invoice(s)
            </div>
          </div>
        </div>

        {/* 2. Total Gross Sales Amount */}
        <div className="stat-card" style={{ padding: '16px 18px' }}>
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '10px',
            backgroundColor: '#ECFDF5',
            color: '#059669',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <DollarSign size={22} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
              Gross Sales
            </div>
            <div style={{ fontSize: '24px', fontWeight: 800, color: '#059669', marginTop: '2px' }}>
              ₹{Number(summary.totalSalesAmount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-subtle)', marginTop: '2px' }}>
              Total collected revenue
            </div>
          </div>
        </div>

        {/* 3. Total GST Amount */}
        <div className="stat-card" style={{ padding: '16px 18px' }}>
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '10px',
            backgroundColor: '#FFFBEB',
            color: '#D97706',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Percent size={22} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
              GST Tax Amount
            </div>
            <div style={{ fontSize: '24px', fontWeight: 800, color: '#D97706', marginTop: '2px' }}>
              ₹{Number(summary.totalGst).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-subtle)', marginTop: '2px' }}>
              18% GST tax liability
            </div>
          </div>
        </div>

        {/* 4. Net Subtotal Revenue */}
        <div className="stat-card" style={{ padding: '16px 18px' }}>
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '10px',
            backgroundColor: '#F3E8FF',
            color: '#9333EA',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <TrendingUp size={22} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
              Net Subtotal
            </div>
            <div style={{ fontSize: '24px', fontWeight: 800, color: '#9333EA', marginTop: '2px' }}>
              ₹{Number(summary.totalSubtotal).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-subtle)', marginTop: '2px' }}>
              Excluding tax component
            </div>
          </div>
        </div>

        {/* 5. Average Pass Selling Price */}
        <div className="stat-card" style={{ padding: '16px 18px' }}>
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '10px',
            backgroundColor: '#EEF2FF',
            color: '#4F46E5',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Tag size={22} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
              Avg Pass Value
            </div>
            <div style={{ fontSize: '24px', fontWeight: 800, color: '#4F46E5', marginTop: '2px' }}>
              ₹{Number(summary.averagePassValue).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-subtle)', marginTop: '2px' }}>
              Per pass issued
            </div>
          </div>
        </div>

        {/* 6. Total Distinct Customers */}
        <div className="stat-card" style={{ padding: '16px 18px' }}>
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '10px',
            backgroundColor: '#F0FDF4',
            color: '#16A34A',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Users size={22} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
              Total Customers
            </div>
            <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)', marginTop: '2px' }}>
              {Number(summary.totalCustomers).toLocaleString()}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-subtle)', marginTop: '2px' }}>
              Distinct buyers
            </div>
          </div>
        </div>

        {/* 7. Voided / Cancelled Passes */}
        <div className="stat-card" style={{ padding: '16px 18px' }}>
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '10px',
            backgroundColor: '#FEF2F2',
            color: '#DC2626',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Ban size={22} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
              Voided Passes
            </div>
            <div style={{ fontSize: '24px', fontWeight: 800, color: '#DC2626', marginTop: '2px' }}>
              {Number(summary.totalVoidedPasses).toLocaleString()}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-subtle)', marginTop: '2px' }}>
              Cancelled / invalid
            </div>
          </div>
        </div>
      </div>

      {/* Date Presets and Filters Card */}
      <div className="card" style={{ marginBottom: '20px', padding: '16px 20px' }}>
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Quick Date Presets Row (IST) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12.5px', fontWeight: 700, color: 'var(--text-muted)', marginRight: '6px' }}>
              <Calendar size={15} />
              <span>IST Time Range:</span>
            </div>

            {[
              { key: 'all', label: 'All Time' },
              { key: 'today', label: 'Today' },
              { key: 'yesterday', label: 'Yesterday' },
              { key: 'last_7_days', label: 'Last 7 Days' },
              { key: 'last_30_days', label: 'Last 30 Days' },
              { key: 'this_month', label: 'This Month' },
              { key: 'previous_month', label: 'Previous Month' }
            ].map(p => (
              <button
                key={p.key}
                type="button"
                onClick={() => {
                  setDatePreset(p.key);
                  if (p.key !== 'custom') {
                    setDateFrom('');
                    setDateTo('');
                  }
                }}
                style={{
                  padding: '5px 12px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: 700,
                  border: '1px solid var(--border-color)',
                  backgroundColor: datePreset === p.key ? 'var(--primary-600)' : 'var(--bg-surface)',
                  color: datePreset === p.key ? '#FFFFFF' : 'var(--text-primary)',
                  cursor: 'pointer'
                }}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Search and Secondary Dropdowns */}
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '260px', position: 'relative' }}>
              <input
                type="text"
                placeholder="Search by Customer Name, Email, WhatsApp Phone, Invoice #, or Pass Code..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ width: '100%', paddingLeft: '38px' }}
              />
              <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            </div>

            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              style={{ padding: '6px 12px', fontSize: '13px' }}
            >
              <option value="all">All Pass Categories</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name} ({c.code})</option>
              ))}
            </select>

            <select
              value={sharingMethod}
              onChange={(e) => setSharingMethod(e.target.value)}
              style={{ padding: '6px 12px', fontSize: '13px' }}
            >
              <option value="all">All Sharing Channels</option>
              <option value="EMAIL">Email</option>
              <option value="WHATSAPP">WhatsApp</option>
              <option value="BOTH">Both Channels</option>
              <option value="NONE">Direct / None</option>
            </select>

            <button type="submit" className="btn btn-primary" style={{ padding: '0 20px' }}>
              Apply Filters
            </button>

            <button
              type="button"
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className={`btn ${showAdvancedFilters ? 'btn-primary' : 'btn-outline'}`}
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <SlidersHorizontal size={14} />
              <span>Custom Dates</span>
            </button>

            {(search || categoryId !== 'all' || datePreset !== 'all' || dateFrom || dateTo || sharingMethod !== 'all' || passStatus !== 'all') && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="btn btn-secondary"
              >
                Reset
              </button>
            )}
          </div>

          {/* Custom Date Range Collapsible */}
          {showAdvancedFilters && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              backgroundColor: 'var(--bg-surface-hover, #F8FAFC)',
              padding: '12px 16px',
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
              flexWrap: 'wrap'
            }}>
              <span style={{ fontSize: '12.5px', fontWeight: 700 }}>Custom IST Date Range:</span>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => {
                  setDateFrom(e.target.value);
                  setDatePreset('custom');
                }}
                style={{ padding: '5px 10px', fontSize: '12.5px' }}
              />
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>to</span>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => {
                  setDateTo(e.target.value);
                  setDatePreset('custom');
                }}
                style={{ padding: '5px 10px', fontSize: '12.5px' }}
              />
            </div>
          )}
        </form>
      </div>

      {/* Main Tab Navigation */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px', marginBottom: '20px', overflowX: 'auto' }}>
        <button
          onClick={() => setActiveTab('transactions')}
          className={`btn btn-sm ${activeTab === 'transactions' ? 'btn-primary' : 'btn-ghost'}`}
          style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <FileText size={15} />
          <span>Sales Ledger & Passes ({pagination.totalRecords})</span>
        </button>

        <button
          onClick={() => setActiveTab('categories')}
          className={`btn btn-sm ${activeTab === 'categories' ? 'btn-primary' : 'btn-ghost'}`}
          style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <Layers size={15} />
          <span>Category Performance</span>
        </button>

        {isSuperAdmin && (
          <button
            onClick={() => setActiveTab('events')}
            className={`btn btn-sm ${activeTab === 'events' ? 'btn-primary' : 'btn-ghost'}`}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Building2 size={15} />
            <span>Event-Wise Sales</span>
          </button>
        )}

        <button
          onClick={() => setActiveTab('trends')}
          className={`btn btn-sm ${activeTab === 'trends' ? 'btn-primary' : 'btn-ghost'}`}
          style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <BarChart3 size={15} />
          <span>Sales Trends</span>
        </button>

        <button
          onClick={() => setActiveTab('customers')}
          className={`btn btn-sm ${activeTab === 'customers' ? 'btn-primary' : 'btn-ghost'}`}
          style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <Users size={15} />
          <span>Customer Sales Summary</span>
        </button>

        <button
          onClick={() => setActiveTab('payment')}
          className={`btn btn-sm ${activeTab === 'payment' ? 'btn-primary' : 'btn-ghost'}`}
          style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <CreditCard size={15} />
          <span>Payment Methods</span>
        </button>
      </div>

      {/* TAB 1: Sales Transactions Table */}
      {activeTab === 'transactions' && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Sale Date (IST)</th>
                  <th>Invoice #</th>
                  <th>Pass Code</th>
                  <th>Event & Category</th>
                  <th>Customer Details</th>
                  <th>Base Price</th>
                  <th>GST Tax</th>
                  <th>Final Amount</th>
                  <th>Sharing Channel</th>
                  <th>Gate Scan Status</th>
                  <th>Issued By</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={11} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                      Loading sales transactions...
                    </td>
                  </tr>
                ) : transactions.length === 0 ? (
                  <tr>
                    <td colSpan={11} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                      No sales records found matching the active filters.
                    </td>
                  </tr>
                ) : (
                  transactions.map((t) => (
                    <tr key={t.pass_id}>
                      {/* Sale Date in IST */}
                      <td>
                        <div style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text-primary)' }}>
                          {formatDateIST(t.sale_date)}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                          {formatTimeIST(t.sale_date)}
                        </div>
                      </td>

                      {/* Invoice # */}
                      <td>
                        <span style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--primary-600)' }}>
                          {t.bill_number}
                        </span>
                      </td>

                      {/* Pass Code */}
                      <td>
                        <span className="pass-code-pill" style={{ fontSize: '12px', padding: '3px 8px' }}>
                          {t.pass_code}
                        </span>
                      </td>

                      {/* Event & Category */}
                      <td>
                        <div style={{ fontWeight: 700, fontSize: '13px' }}>{t.category_name}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{t.event_name}</div>
                      </td>

                      {/* Customer Details */}
                      <td>
                        <div style={{ fontWeight: 700, fontSize: '13px' }}>{t.customer_name}</div>
                        {t.customer_email && (
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{t.customer_email}</div>
                        )}
                        {t.customer_phone && (
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{t.customer_phone}</div>
                        )}
                        {t.sponsor_name && (
                          <div style={{ fontSize: '10.5px', color: '#D97706', fontWeight: 600 }}>
                            ★ {t.sponsor_name}
                          </div>
                        )}
                      </td>

                      {/* Base Price */}
                      <td>
                        <span style={{ fontSize: '12.5px' }}>₹{t.base_price.toFixed(2)}</span>
                      </td>

                      {/* GST Tax */}
                      <td>
                        <span style={{ fontSize: '12px', color: '#D97706', fontWeight: 600 }}>
                          ₹{(t.gst_amount / Math.max(1, t.billing_quantity)).toFixed(2)}
                        </span>
                      </td>

                      {/* Final Amount */}
                      <td>
                        <strong style={{ color: '#047857', fontSize: '13.5px' }}>
                          ₹{t.final_amount.toFixed(2)}
                        </strong>
                      </td>

                      {/* Sharing Channel */}
                      <td>
                        <Badge variant={
                          t.sharing_method === 'EMAIL' ? 'info' :
                          t.sharing_method === 'WHATSAPP' ? 'success' :
                          t.sharing_method === 'BOTH' ? 'primary' : 'neutral'
                        }>
                          {t.sharing_method}
                        </Badge>
                      </td>

                      {/* Scan Status */}
                      <td>
                        <div>
                          <Badge variant={
                            t.pass_status === 'active' ? 'success' :
                            t.pass_status === 'used' ? 'info' :
                            t.pass_status === 'expired' ? 'warning' : 'danger'
                          }>
                            {t.pass_status.toUpperCase()}
                          </Badge>
                          {t.scan_count > 0 && (
                            <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', marginTop: '2px' }}>
                              {t.scan_count} scan(s)
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Issued By */}
                      <td>
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                          {t.created_by_name || 'Admin'}
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
            onPageChange={(page) => fetchSalesData(page)}
            onPageSizeChange={(limit) => setPagination(prev => ({ ...prev, limit, page: 1 }))}
          />
        </div>
      )}

      {/* TAB 2: Category Performance Breakdown */}
      {activeTab === 'categories' && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-color)' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 800 }}>Category Performance Breakdown</h3>
            <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', margin: 0 }}>
              Actual ticket sales volume and gross revenue generated per pass tier.
            </p>
          </div>

          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Pass Category</th>
                  <th>Event</th>
                  <th>Total Passes Sold</th>
                  <th>Gross Revenue (₹)</th>
                  <th>Avg Price / Pass (₹)</th>
                  <th>GST Tax (₹)</th>
                  <th>Net Revenue (₹)</th>
                  <th style={{ width: '220px' }}>% of Total Sales</th>
                </tr>
              </thead>
              <tbody>
                {categorySales.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                      No category sales data found for the selected filters.
                    </td>
                  </tr>
                ) : (
                  categorySales.map((c) => (
                    <tr key={`${c.categoryId}-${c.eventName}`}>
                      <td>
                        <div style={{ fontWeight: 800, fontSize: '14px' }}>{c.categoryName}</div>
                        <span style={{ fontSize: '11px', fontFamily: 'monospace', color: 'var(--text-muted)' }}>{c.categoryCode}</span>
                      </td>
                      <td>{c.eventName}</td>
                      <td>
                        <strong style={{ fontSize: '14px' }}>{c.totalSold.toLocaleString()}</strong>
                      </td>
                      <td>
                        <strong style={{ color: '#047857', fontSize: '14px' }}>
                          ₹{c.grossRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </strong>
                      </td>
                      <td>₹{c.avgSellingPrice.toFixed(2)}</td>
                      <td>₹{c.totalGst.toFixed(2)}</td>
                      <td>₹{c.netRevenue.toFixed(2)}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ flex: 1, height: '8px', backgroundColor: '#E2E8F0', borderRadius: '4px', overflow: 'hidden' }}>
                            <div style={{ width: `${c.percentageOfTotalSales}%`, height: '100%', backgroundColor: 'var(--primary-600)', borderRadius: '4px' }} />
                          </div>
                          <span style={{ fontSize: '12px', fontWeight: 700, minWidth: '40px' }}>{c.percentageOfTotalSales}%</span>
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

      {/* TAB 3: Event-Wise Sales Comparison (SuperAdmin) */}
      {activeTab === 'events' && isSuperAdmin && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-color)' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 800 }}>Multi-Event Revenue Comparison</h3>
            <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', margin: 0 }}>
              Cross-event sales volume, customer reach, and admission scan utilization.
            </p>
          </div>

          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Event Name</th>
                  <th>Event Code</th>
                  <th>Passes Sold</th>
                  <th>Customers</th>
                  <th>Gross Sales (₹)</th>
                  <th>GST Tax (₹)</th>
                  <th>Net Revenue (₹)</th>
                  <th>Admitted Scans</th>
                  <th>Unused Passes</th>
                  <th style={{ textAlign: 'right' }}>Drilldown</th>
                </tr>
              </thead>
              <tbody>
                {eventSales.length === 0 ? (
                  <tr>
                    <td colSpan={10} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                      No event sales data found.
                    </td>
                  </tr>
                ) : (
                  eventSales.map((ev) => (
                    <tr key={ev.eventId}>
                      <td>
                        <strong style={{ fontSize: '14px' }}>{ev.eventName}</strong>
                      </td>
                      <td>
                        <Badge variant="neutral">{ev.eventCode}</Badge>
                      </td>
                      <td>
                        <strong>{ev.totalPassesSold.toLocaleString()}</strong>
                      </td>
                      <td>{ev.totalCustomers.toLocaleString()}</td>
                      <td>
                        <strong style={{ color: '#047857' }}>
                          ₹{ev.grossSales.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </strong>
                      </td>
                      <td>₹{ev.totalGst.toFixed(2)}</td>
                      <td>₹{ev.netRevenue.toFixed(2)}</td>
                      <td>
                        <span style={{ color: '#059669', fontWeight: 700 }}>{ev.scannedPasses}</span>
                      </td>
                      <td>{ev.unusedPasses}</td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          onClick={() => handleDrilldownEvent(ev.eventId)}
                          className="btn btn-primary btn-sm"
                        >
                          View Sales
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: Sales Trends Chart */}
      {activeTab === 'trends' && (
        <div className="card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h3 style={{ fontSize: '17px', fontWeight: 800 }}>Revenue & Pass Sales Over Time</h3>
              <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', margin: 0 }}>
                Grouped strictly by Indian Standard Time (IST) calendar periods.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '6px', backgroundColor: 'var(--bg-body)', padding: '3px', borderRadius: '6px' }}>
              {['daily', 'weekly', 'monthly'].map(g => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setTrendGrouping(g)}
                  className={`btn btn-sm ${trendGrouping === g ? 'btn-primary' : 'btn-ghost'}`}
                  style={{ textTransform: 'capitalize' }}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          {/* Visual Trend Bar Grid */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {salesTrend.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                No trend data recorded for the selected time window.
              </div>
            ) : (
              salesTrend.map(t => {
                const maxRev = Math.max(...salesTrend.map(item => item.revenue), 1);
                const pct = Math.min(100, Math.round((t.revenue / maxRev) * 100));

                return (
                  <div key={t.timeBucket} style={{
                    padding: '12px 16px',
                    borderRadius: '8px',
                    backgroundColor: 'var(--bg-surface-hover)',
                    border: '1px solid var(--border-color)'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <span style={{ fontWeight: 800, fontSize: '13.5px', fontFamily: 'monospace' }}>
                        {t.timeBucket} (IST)
                      </span>
                      <div style={{ display: 'flex', gap: '16px', fontSize: '13px' }}>
                        <span>Passes Sold: <strong>{t.passesSold}</strong></span>
                        <span style={{ color: '#047857', fontWeight: 800 }}>₹{t.revenue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                      </div>
                    </div>

                    <div style={{ width: '100%', height: '10px', backgroundColor: '#E2E8F0', borderRadius: '5px', overflow: 'hidden' }}>
                      <div style={{ width: `${pct}%`, height: '100%', backgroundColor: 'var(--primary-600)', borderRadius: '5px', transition: 'width 0.3s ease' }} />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* TAB 5: Customer Sales Summary */}
      {activeTab === 'customers' && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-color)' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 800 }}>Customer Purchase Summary</h3>
            <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', margin: 0 }}>
              Aggregated spend, total passes bought, and delivery channels per customer.
            </p>
          </div>

          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Customer Name</th>
                  <th>Email</th>
                  <th>WhatsApp Number</th>
                  <th>Passes Bought</th>
                  <th>Categories</th>
                  <th>Total Spent (₹)</th>
                  <th>First Purchase (IST)</th>
                  <th>Latest Purchase (IST)</th>
                  <th>Sharing Channel</th>
                  <th>Gate Status</th>
                </tr>
              </thead>
              <tbody>
                {customerSales.length === 0 ? (
                  <tr>
                    <td colSpan={10} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                      No customer purchase records found.
                    </td>
                  </tr>
                ) : (
                  customerSales.map((c, idx) => (
                    <tr key={idx}>
                      <td><strong style={{ fontSize: '13.5px' }}>{c.customerName}</strong></td>
                      <td>{c.customerEmail}</td>
                      <td>{c.customerPhone}</td>
                      <td><strong>{c.passesPurchased} pass(es)</strong></td>
                      <td><span style={{ fontSize: '12px' }}>{c.categoriesPurchased}</span></td>
                      <td>
                        <strong style={{ color: '#047857', fontSize: '13.5px' }}>
                          ₹{c.totalSpent.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </strong>
                      </td>
                      <td><span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{c.firstPurchase}</span></td>
                      <td><span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{c.latestPurchase}</span></td>
                      <td><Badge variant="info">{c.sharingMethod}</Badge></td>
                      <td><span style={{ fontSize: '12px', fontWeight: 600 }}>{c.scanStatus}</span></td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 6: Payment Methods Breakdown */}
      {activeTab === 'payment' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
          {paymentSummary.map((p, idx) => (
            <div key={idx} className="card" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '8px', backgroundColor: '#EFF6FF', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <CreditCard size={20} />
                </div>
                <div>
                  <h4 style={{ fontSize: '15px', fontWeight: 800, margin: 0 }}>{p.paymentMethod}</h4>
                  <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>{p.percentageOfSales}% of total volume</span>
                </div>
              </div>

              <div style={{ fontSize: '24px', fontWeight: 900, color: '#047857', marginBottom: '4px' }}>
                ₹{p.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                {p.transactionCount} transaction(s) recorded
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
