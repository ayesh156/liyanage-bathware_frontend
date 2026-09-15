import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import {
  FileText, Search, Plus, Eye, Edit2, Trash2, Printer,
  Clock, CheckCircle, AlertTriangle, XCircle, Filter, RefreshCw,
  TrendingUp, ChevronLeft, ChevronRight,
  ChevronsLeft, ChevronsRight, ChevronDown, X, Calendar as CalendarIcon, SlidersHorizontal
} from 'lucide-react';

// 🛠️ NEW: Date Picker Component එක import කරගැනීම
import { Calendar } from '../components/ui/calendar'; // Calendar component path එක තහවුරු කරගන්න
import { DateRange } from 'react-day-picker';
import { format } from 'date-fns';
import SortButton from '../components/ui/SortButton';
import { Invoice } from '../types/index';
import { DeleteConfirmationModal } from '../components/modals/DeleteConfirmationModal';
import { InvoicePreviewModal } from '../components/modals/InvoicePreviewModal';
import { printInvoice } from '../components/modals/PrintInvoiceModal';
import { useIsMobile } from '../hooks/use-mobile';
import { toast } from 'react-toastify';

const ROWS_PER_PAGE_OPTIONS = [10, 25, 50, 100];

// ── Status config ──
const statusConfig: Record<string, { bg: string; text: string; border: string; icon: React.ReactNode }> = {
  paid: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20', icon: <CheckCircle className="w-3 h-3" /> },
  pending: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20', icon: <Clock className="w-3 h-3" /> },
  overdue: { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/20', icon: <AlertTriangle className="w-3 h-3" /> },
  cancelled: { bg: 'bg-gray-500/10', text: 'text-gray-400', border: 'border-gray-500/20', icon: <XCircle className="w-3 h-3" /> },
};

const formatPrice = (price: number) => `Rs. ${price.toLocaleString()}`;

const formatDateISO = (value: string | Date | undefined | null): string => {
  if (!value) return '—';
  const d = new Date(value);
  if (isNaN(d.getTime())) return typeof value === 'string' ? value : '—';
  return d.toISOString().split('T')[0];
};

const calculateDueDate = (issueDate: string | Date): string => {
  const date = new Date(issueDate);
  if (isNaN(date.getTime())) return '—';
  date.setDate(date.getDate() + 7);
  return date.toISOString().split('T')[0];
};

interface SearchableSelectProps {
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  isDark: boolean;
  allLabel?: string;
}

const SearchableSelect: React.FC<SearchableSelectProps> = ({ options, value, onChange, placeholder, isDark, allLabel = 'All' }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!search.trim()) return options;
    return options.filter((o) => o.label.toLowerCase().includes(search.toLowerCase()));
  }, [search, options]);

  const displayValue = options.find(o => o.value === value)?.label || allLabel;

  useEffect(() => { if (!open) setSearch(''); }, [open]);
  useEffect(() => {
    const handler = (e: MouseEvent) => { if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <button type="button" onClick={() => setOpen(!open)}
        className={`w-full flex items-center justify-between px-2.5 py-1.5 text-xs border rounded-lg transition-all ${isDark ? 'bg-slate-800 border-slate-700 text-white hover:border-slate-600' : 'bg-white border-slate-200 text-slate-900 hover:border-slate-300'
          }`}>
        <span className="truncate">{displayValue}</span>
        <ChevronDown className={`w-3 h-3 ml-1 flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''} ${isDark ? 'text-slate-400' : 'text-slate-500'}`} />
      </button>
      {open && (
        <div className={`absolute left-0 top-full mt-0.5 w-full min-w-[180px] rounded-lg border shadow-2xl z-50 overflow-hidden backdrop-blur-md ${isDark ? 'bg-slate-800/95 border-slate-700/50' : 'bg-white/95 border-slate-200'
          }`}>
          <div className="relative border-b border-slate-700/30">
            <input ref={inputRef} type="text" value={search}
              onChange={(e) => setSearch(e.target.value)} placeholder={placeholder || 'Search...'}
              className={`w-full px-2.5 py-1.5 text-xs border-0 focus:outline-none focus:ring-0 ${isDark ? 'bg-slate-800/50 text-white placeholder:text-slate-500' : 'bg-white text-slate-900 placeholder:text-slate-400'
                }`} autoFocus />
            {search.length > 0 && (
              <button onClick={() => setSearch('')}
                className={`absolute right-1.5 top-1/2 -translate-y-1/2 p-0.5 rounded ${isDark ? 'text-slate-500 hover:text-white' : 'text-slate-400 hover:text-slate-700'}`}>
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
          <div className="max-h-40 overflow-y-auto">
            {filtered.map((opt) => (
              <button key={opt.value} onClick={() => { onChange(opt.value); setOpen(false); }}
                className={`w-full text-left px-2.5 py-1.5 text-xs font-medium transition-colors ${opt.value === value ? 'bg-orange-500/20 text-orange-400' : isDark ? 'text-slate-300 hover:bg-slate-700/50' : 'text-slate-700 hover:bg-slate-100'
                  }`}>{opt.label}</button>
            ))}
            {filtered.length === 0 && (
              <div className={`px-2.5 py-1.5 text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>No results</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export const Invoices: React.FC = () => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const isDark = theme === 'dark';
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFilterType, setDateFilterType] = useState<'all' | 'today' | 'yesterday' | 'month' | 'custom'>('all');
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [invoiceToDelete, setInvoiceToDelete] = useState<Invoice | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [previewInvoice, setPreviewInvoice] = useState<Invoice | null>(null);
  // 🛠️ NEW: Collapse toggle state & Date Range state
  const [isFilterExpanded, setIsFilterExpanded] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);

  // 🛠️ NEW: Sync dateRange state with custom filter values
  const handleDateRangeSelect = (range: DateRange | undefined) => {
    setDateRange(range);
    if (range?.from) {
      setStartDate(format(range.from, 'yyyy-MM-dd'));
      setDateFilterType('custom');
    } else {
      setStartDate('');
    }
    if (range?.to) {
      setEndDate(format(range.to, 'yyyy-MM-dd'));
    } else {
      setEndDate('');
    }
  };

  const fetchInvoicesHistory = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get<any[]>('/invoices', { perPage: 1000, limit: 1000 }, true) as any;
      const rawData = Array.isArray(response) ? response : (response?.data || []);
      const formattedData = rawData.map((inv: Invoice) => ({
        ...inv,
        dueDate: inv.issueDate ? calculateDueDate(inv.issueDate) : inv.dueDate
      }));
      setInvoices(formattedData);
    } catch (err) {
      console.error('[Invoices] Failed to fetch invoices:', err);
      toast.error('Failed to sync live server invoices');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInvoicesHistory();
  }, [fetchInvoicesHistory]);

  // ── FIX: Added filteredInvoices calculation with Memo ──
  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      const matchesSearch =
        inv.invoiceNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        inv.customerName?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = statusFilter === 'all' || inv.status === statusFilter;

      let matchesDate = true;
      if (dateFilterType === 'today') {
        const todayStr = new Date().toISOString().split('T')[0];
        matchesDate = formatDateISO(inv.issueDate) === todayStr;
      } else if (dateFilterType === 'yesterday') {
        const d = new Date();
        d.setDate(d.getDate() - 1);
        const yestStr = d.toISOString().split('T')[0];
        matchesDate = formatDateISO(inv.issueDate) === yestStr;
      } else if (dateFilterType === 'month' && selectedMonth) {
        matchesDate = formatDateISO(inv.issueDate).startsWith(selectedMonth);
      } else if (dateFilterType === 'custom') {
        const invDate = formatDateISO(inv.issueDate);
        if (startDate && invDate < startDate) matchesDate = false;
        if (endDate && invDate > endDate) matchesDate = false;
      }

      return matchesSearch && matchesStatus && matchesDate;
    }).sort((a, b) => {
      const dateA = new Date(a.issueDate || 0).getTime();
      const dateB = new Date(b.issueDate || 0).getTime();
      return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
    });
  }, [invoices, searchQuery, statusFilter, dateFilterType, selectedMonth, startDate, endDate, sortOrder]);

  const totalPages = Math.ceil(filteredInvoices.length / rowsPerPage);
  const paginatedInvoices = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return filteredInvoices.slice(start, start + rowsPerPage);
  }, [filteredInvoices, currentPage, rowsPerPage]);

  useEffect(() => { setCurrentPage(1); }, [searchQuery, statusFilter, dateFilterType, rowsPerPage]);

  const stats = useMemo(() => {
    const total = invoices.length;
    const totalRevenue = invoices.filter(i => i.status === 'paid').reduce((sum, i) => sum + (i.total || 0), 0);
    const pendingAmount = invoices.filter(i => i.status === 'pending').reduce((sum, i) => sum + (i.total || 0), 0);
    const overdueAmount = invoices.filter(i => i.status === 'overdue').reduce((sum, i) => sum + (i.total || 0), 0);
    return { total, totalRevenue, pendingAmount, overdueAmount };
  }, [invoices]);

  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setDateFilterType('all');
    setSelectedMonth('');
    setStartDate('');
    setEndDate('');
  };
  const hasActiveFilters = searchQuery || statusFilter !== 'all' || dateFilterType !== 'all';
  const startItem = (currentPage - 1) * rowsPerPage + 1;
  const endItem = Math.min(currentPage * rowsPerPage, filteredInvoices.length);

  const handlePrintClick = (invoice: Invoice) => {
    const customer = {
      id: invoice.customerId || 'walk-in',
      name: invoice.customerName,
      phone: '',
      email: '',
      address: '',
      customerType: 'regular' as const,
      loanBalance: 0,
      creditLimit: 0,
      nic: undefined,
      nameSi: undefined,
    };
    printInvoice(invoice, customer, 'en', currentUser?.name || 'Admin User').catch(() => { });
  };

  const handleConfirmDelete = async () => {
    if (!invoiceToDelete) return;
    try {
      await api.delete(`/invoices/${invoiceToDelete.id}`);
      toast.success(`Invoice ${invoiceToDelete.invoiceNumber} deleted`);
      setInvoices(invoices.filter((inv) => inv.id !== invoiceToDelete.id));
      setShowDeleteModal(false);
      setInvoiceToDelete(null);
    } catch (err) {
      toast.error('Failed to delete invoice');
      console.error('[Invoices] Delete failed:', err);
    }
  };

  const handleRefresh = () => {
    fetchInvoicesHistory();
  };

  return (
    <div className={`space-y-4 ${isMobile ? 'pb-20' : ''}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{t('invoices.title')}</h1>
          <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{t('invoices.description')}</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleRefresh}
            className="flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-slate-500 to-slate-600 hover:from-slate-600 hover:to-slate-700 text-white rounded-lg font-medium transition-all shadow shadow-slate-500/20 text-xs">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> {loading ? 'Syncing...' : 'Refresh'}
          </button>
          <button onClick={() => navigate('/invoices/quick-checkout')}
            className="flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600 text-white rounded-lg font-medium transition-all shadow shadow-orange-500/20 text-xs">
            <Plus className="w-3.5 h-3.5" /> {t('invoices.addInvoice')}
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
        {[
          { label: 'Total Invoices', value: stats.total, icon: FileText, color: 'blue' },
          { label: 'Paid Revenue', value: `Rs.${(stats.totalRevenue / 1000000).toFixed(1)}M`, icon: TrendingUp, color: 'green' },
          { label: 'Pending', value: `Rs.${(stats.pendingAmount / 1000).toFixed(0)}K`, icon: Clock, color: 'yellow' },
          { label: 'Overdue', value: `Rs.${(stats.overdueAmount / 1000).toFixed(0)}K`, icon: AlertTriangle, color: 'red' },
        ].map((item, i) => {
          const Icon = item.icon;
          return (
            <div key={i} className={`p-3 rounded-lg border ${isDark ? 'bg-slate-800/30 border-slate-700/50' : 'bg-white border-slate-200 shadow-sm'}`}>
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 bg-${item.color}-500/10 rounded-lg flex items-center justify-center`}>
                  <Icon className={`w-4 h-4 text-${item.color}-400`} />
                </div>
                <div>
                  <p className={`text-lg font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{item.value}</p>
                  <p className={`text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>{item.label}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 🛠️ NEW: Clean Responsive Collapsible Filter Bar */}
      {/* 🛠️ FIX: overflow-hidden ඉවත් කර z-index නිවැරදි කිරීම */}
      <div className={`rounded-xl border transition-all duration-300 relative ${isDark ? 'bg-slate-800/60 border-slate-700/60' : 'bg-white border-slate-200 shadow-sm'
        }`}>

        {/* Always Visible Primary Bar */}
        <div className="p-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 flex-1">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className={`absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`} />
              <input
                type="text"
                placeholder={t('invoices.searchByInvoiceOrCustomer')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full pl-8 pr-8 py-1.5 text-xs border rounded-lg focus:outline-none focus:ring-1 focus:ring-orange-500 ${isDark ? 'bg-slate-900/60 border-slate-700 text-white placeholder:text-slate-500' : 'bg-slate-50 border-slate-200 text-slate-900'
                  }`}
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white">
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Desktop Quick Status Search */}
            <div className="hidden md:block w-40">
              <SearchableSelect
                options={[
                  { value: 'all', label: t('invoices.allStatuses') },
                  { value: 'paid', label: t('invoices.paidLabel') },
                  { value: 'pending', label: t('invoices.pendingLabel') },
                  { value: 'overdue', label: t('invoices.overdueLabel') },
                  { value: 'cancelled', label: t('invoices.cancelledLabel') },
                ]}
                value={statusFilter}
                onChange={(v) => setStatusFilter(v)}
                isDark={isDark}
              />
            </div>
          </div>

          {/* Filter Action Controls */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setIsFilterExpanded(!isFilterExpanded)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg border transition-colors ${hasActiveFilters || isFilterExpanded
                  ? 'bg-orange-500/10 border-orange-500/30 text-orange-400'
                  : isDark ? 'bg-slate-700/50 border-slate-600 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-700'
                }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Filters</span>
              {hasActiveFilters && <span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span>}
              <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${isFilterExpanded ? 'rotate-180' : ''}`} />
            </button>

            <button
              onClick={handleRefresh}
              className={`p-2 rounded-lg border transition-colors ${isDark ? 'bg-slate-700/50 border-slate-600 text-slate-300 hover:text-white' : 'bg-slate-100 border-slate-200 text-slate-700'}`}
              title="Refresh"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Collapsible Filter Expansion Drawer */}
        {isFilterExpanded && (
          <div className={`px-3 py-3 border-t space-y-3 ${isDark ? 'border-slate-700/40 bg-slate-900/40' : 'border-slate-100 bg-slate-50/50'}`}>

            {/* Mobile-only Status Selector */}
            <div className="block md:hidden">
              <label className="text-[10px] font-semibold text-slate-400 mb-1 block">Status Filter</label>
              <SearchableSelect
                options={[
                  { value: 'all', label: t('invoices.allStatuses') },
                  { value: 'paid', label: t('invoices.paidLabel') },
                  { value: 'pending', label: t('invoices.pendingLabel') },
                  { value: 'overdue', label: t('invoices.overdueLabel') },
                  { value: 'cancelled', label: t('invoices.cancelledLabel') },
                ]}
                value={statusFilter}
                onChange={(v) => setStatusFilter(v)}
                isDark={isDark}
              />
            </div>

            {/* Modern Date Selection Bar */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-semibold text-slate-400">Date Range:</span>

              {/* Quick Date Presets */}
              <div className="flex items-center gap-1 flex-wrap">
                {(['all', 'today', 'yesterday', 'month'] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => {
                      setDateFilterType(type);
                      if (type !== 'month') setSelectedMonth('');
                    }}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium capitalize transition-all ${dateFilterType === type
                        ? 'bg-orange-500 text-white shadow-sm'
                        : isDark ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                      }`}
                  >
                    {type}
                  </button>
                ))}
              </div>

              {/* 🛠️ Modern Floating Popover Date Range Picker */}
              <div className="relative">
                <button
                  onClick={() => {
                    setDateFilterType('custom');
                    setShowDatePicker(!showDatePicker);
                  }}
                  className={`flex items-center gap-2 px-2.5 py-1 rounded-md text-xs border font-medium transition-all ${dateFilterType === 'custom'
                      ? 'bg-orange-500 text-white border-orange-500'
                      : isDark ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-white border-slate-200 text-slate-700'
                    }`}
                >
                  <CalendarIcon className="w-3.5 h-3.5" />
                  <span>
                    {startDate && endDate ? `${startDate} ~ ${endDate}` : 'Custom Range'}
                  </span>
                </button>

                {/* 🛠️ NEW: Responsive Calendar Overlay (Desktop Popover & Mobile Bottom Sheet) */}
                {showDatePicker && (
  <>
    {/* Backdrop: onClick එක ඉවත් කර ඇත, එබැවින් පිටත click කලද close නොවෙයි */}
    <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-xs" />

    {/* Calendar Container */}
    <div className={`
      fixed inset-x-4 bottom-6 z-50 p-2 rounded-2xl border shadow-2xl transition-all duration-300 max-w-sm mx-auto
      md:absolute md:inset-auto md:left-0 md:top-full md:mt-2 md:w-auto md:max-w-none md:mx-0
      ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'}
    `}>
      <Calendar
        selected={dateRange}
        onSelect={handleDateRangeSelect}
        onClose={() => setShowDatePicker(false)}
        isDark={isDark}
      />
    </div>
  </>
)}
              </div>

              {/* Total Invoices Count & Reset */}
              <div className="ml-auto flex items-center gap-2">
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="text-xs text-orange-400 hover:underline flex items-center gap-1"
                  >
                    <X className="w-3 h-3" /> Clear Filters
                  </button>
                )}
                <span className="text-[11px] font-semibold text-slate-400 border-l pl-2 border-slate-700/40">
                  {filteredInvoices.length} Invoices
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Table & Cards */}
      <div className={`rounded-lg border overflow-hidden ${isDark ? 'bg-slate-900/95 border-slate-700/50' : 'bg-white border-slate-200 shadow-sm'}`}>

        {/* Mobile View */}
        <div className="block md:hidden divide-y divide-slate-700/30 p-2 space-y-2">
          {loading && (
            <div className="text-center py-6 text-xs text-slate-400">
              <RefreshCw className="w-6 h-6 mx-auto mb-2 animate-spin text-orange-500" />
              Loading invoices...
            </div>
          )}

          {!loading && filteredInvoices.length === 0 && (
            <div className="text-center py-6 text-xs text-slate-400">
              <FileText className="w-6 h-6 mx-auto mb-2 text-slate-500" />
              No invoices found
            </div>
          )}

          {!loading && paginatedInvoices.map((invoice) => {
            const st = statusConfig[invoice.status] || statusConfig.pending;
            return (
              <div
                key={invoice.id}
                className={`p-3 rounded-lg border transition-all ${isDark ? 'bg-slate-800/40 border-slate-700/60' : 'bg-slate-50 border-slate-200'
                  }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <button
                    onClick={() => navigate(`/invoices/${invoice.id}`)}
                    className="font-mono font-bold text-xs text-indigo-400 hover:underline"
                  >
                    {invoice.invoiceNumber}
                  </button>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${st.bg} ${st.text} ${st.border} border`}>
                    {st.icon}
                    <span>{invoice.status}</span>
                  </span>
                </div>

                <div className="flex justify-between items-center text-xs mb-2">
                  <span className={`font-semibold ${isDark ? 'text-white' : 'text-slate-800'}`}>
                    {invoice.customerName}
                  </span>
                  <span className="font-bold text-emerald-400 font-mono">
                    {formatPrice(invoice.total)}
                  </span>
                </div>

                <div className="flex justify-between items-center text-[10px] text-slate-400 pt-2 border-t border-slate-700/20">
                  <span>Date: {formatDateISO(invoice.issueDate)}</span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setPreviewInvoice(invoice)}
                      className="p-1 rounded bg-indigo-500/10 text-indigo-400"
                      title="Preview"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handlePrintClick(invoice)}
                      className="p-1 rounded bg-cyan-500/10 text-cyan-400"
                      title="Print"
                    >
                      <Printer className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => navigate(`/invoices/quick-checkout?edit=${invoice.id}`)}
                      className="p-1 rounded bg-orange-500/10 text-orange-400"
                      title="Edit"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full min-w-[900px]">
            <thead className={isDark ? 'bg-slate-800/80' : 'bg-slate-50'}>
              <tr>
                <th className={`px-2 py-2 text-[10px] font-semibold uppercase tracking-wider whitespace-nowrap text-left ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{t('invoices.invoiceHash')}</th>
                <th className={`px-2 py-2 text-[10px] font-semibold uppercase tracking-wider whitespace-nowrap text-left ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{t('invoices.customer')}</th>
                <th className={`px-2 py-2 text-[10px] font-semibold uppercase tracking-wider whitespace-nowrap text-left ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{t('invoices.issueDate')}</th>
                <th className={`px-2 py-2 text-[10px] font-semibold uppercase tracking-wider whitespace-nowrap text-left ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{t('invoices.dueDate')}</th>
                <th className={`px-2 py-2 text-[10px] font-semibold uppercase tracking-wider whitespace-nowrap text-right ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{t('invoices.totalLabel')}</th>
                <th className={`px-2 py-2 text-[10px] font-semibold uppercase tracking-wider whitespace-nowrap text-center ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{t('invoices.status')}</th>
                <th className={`px-2 py-2 text-[10px] font-semibold uppercase tracking-wider whitespace-nowrap text-center ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{t('tableHeaders.actions')}</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDark ? 'divide-slate-700/40' : 'divide-slate-200'}`}>
              {loading && (
                <tr>
                  <td colSpan={7} className={`px-2 py-8 text-center text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                    <RefreshCw className={`w-8 h-8 mx-auto mb-2 animate-spin ${isDark ? 'text-slate-600' : 'text-slate-300'}`} />
                    Loading invoices from server...
                  </td>
                </tr>
              )}
              {!loading && filteredInvoices.length === 0 && (
                <tr>
                  <td colSpan={7} className={`px-2 py-8 text-center text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                    <FileText className={`w-8 h-8 mx-auto mb-2 ${isDark ? 'text-slate-600' : 'text-slate-300'}`} />
                    No invoices found
                  </td>
                </tr>
              )}
              {!loading && paginatedInvoices.map((invoice) => {
                const st = statusConfig[invoice.status] || statusConfig.pending;
                const isOverdue = new Date(invoice.dueDate) < new Date() && invoice.status !== 'paid';
                return (
                  <tr key={invoice.id} className={`transition-colors ${isDark ? 'hover:bg-slate-700/25' : 'hover:bg-slate-50'}`}>
                    <td className="px-2 py-1.5">
                      <button onClick={() => navigate(`/invoices/${invoice.id}`)}
                        className={`text-[11px] font-mono font-semibold ${isDark ? 'text-indigo-400 hover:text-indigo-300' : 'text-indigo-600 hover:text-indigo-700'}`}>
                        {invoice.invoiceNumber}
                      </button>
                    </td>
                    <td className="px-2 py-1.5">
                      <div className="flex items-center gap-1.5">
                        <div className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 ${isDark ? 'bg-slate-700' : 'bg-slate-100'}`}>
                          <FileText className={`w-2.5 h-2.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`} />
                        </div>
                        <span className={`text-[11px] font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>{invoice.customerName}</span>
                      </div>
                    </td>
                    <td className="px-2 py-1.5">
                      <span className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{formatDateISO(invoice.issueDate)}</span>
                    </td>
                    <td className="px-2 py-1.5">
                      <span className={`text-[11px] ${isOverdue ? 'text-red-400 font-medium' : isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                        {formatDateISO(invoice.dueDate)}
                      </span>
                    </td>
                    <td className="px-2 py-1.5 text-right">
                      <span className={`text-[11px] font-mono font-bold ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>{formatPrice(invoice.total)}</span>
                    </td>
                    <td className="px-2 py-1.5 text-center">
                      <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-medium ${st.bg} ${st.text} ${st.border} border`}>
                        {st.icon}<span>{invoice.status}</span>
                      </span>
                    </td>
                    <td className="px-2 py-1.5 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={() => setPreviewInvoice(invoice)}
                          className={`p-1.5 rounded-lg transition-all hover:scale-110 active:scale-90 ${isDark ? 'text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/15' : 'text-slate-500 hover:text-indigo-600 hover:bg-indigo-50'}`} title="Preview">
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => handlePrintClick(invoice)}
                          className={`p-1.5 rounded-lg transition-all hover:scale-110 active:scale-90 ${isDark ? 'text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/15' : 'text-slate-500 hover:text-cyan-600 hover:bg-cyan-50'}`} title="Print">
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => navigate(`/invoices/quick-checkout?edit=${invoice.id}`)}
                          className={`p-1.5 rounded-lg transition-all hover:scale-110 active:scale-90 ${isDark ? 'text-slate-400 hover:text-orange-400 hover:bg-orange-500/15' : 'text-slate-500 hover:text-orange-600 hover:bg-orange-50'}`} title="Edit">
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        {currentUser?.role === 'ADMIN' && (
                          <button onClick={() => { setInvoiceToDelete(invoice); setShowDeleteModal(true); }}
                            className={`p-1.5 rounded-lg transition-all hover:scale-110 active:scale-90 ${isDark ? 'text-slate-400 hover:text-rose-500 hover:bg-rose-500/15' : 'text-slate-500 hover:text-rose-600 hover:bg-rose-50'}`} title="Delete">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className={`flex items-center justify-between px-4 py-2.5 border-t ${isDark ? 'border-slate-700/40' : 'border-slate-200'}`}>
          <div className="flex items-center gap-3">
            <span className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Showing {filteredInvoices.length > 0 ? `${startItem}-${endItem}` : '0-0'} of {filteredInvoices.length}
            </span>
            <div className={`flex items-center gap-1.5 text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              <span>Rows:</span>
              <select value={rowsPerPage} onChange={(e) => setRowsPerPage(Number(e.target.value))}
                className={`px-1.5 py-0.5 text-[10px] border rounded transition-colors focus:outline-none focus:ring-1 focus:ring-orange-500/50 ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'}`}>
                {ROWS_PER_PAGE_OPTIONS.map((n) => (<option key={n} value={n}>{n}</option>))}
              </select>
            </div>
          </div>
          <div className="flex items-center gap-0.5">
            <button onClick={() => setCurrentPage(1)} disabled={currentPage === 1}
              className={`p-1.5 rounded transition-colors disabled:opacity-30 ${isDark ? 'text-slate-400 hover:text-white hover:bg-slate-700' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'}`} title="First page">
              <ChevronsLeft className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1}
              className={`p-1.5 rounded transition-colors disabled:opacity-30 ${isDark ? 'text-slate-400 hover:text-white hover:bg-slate-700' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'}`} title="Previous page">
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            {Array.from({ length: Math.min(5, totalPages || 1) }, (_, i) => {
              const start = Math.max(1, Math.min(currentPage - 2, (totalPages || 1) - 4));
              const page = start + i;
              if (page > totalPages) return null;
              return (
                <button key={page} onClick={() => setCurrentPage(page)}
                  className={`w-7 h-7 text-[10px] font-semibold rounded transition-all ${page === currentPage ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20' : isDark ? 'text-slate-300 hover:bg-slate-700' : 'text-slate-600 hover:bg-slate-100'}`}>{page}</button>
              );
            })}
            <button onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages || totalPages === 0}
              className={`p-1.5 rounded transition-colors disabled:opacity-30 ${isDark ? 'text-slate-400 hover:text-white hover:bg-slate-700' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'}`} title="Next page">
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages || totalPages === 0}
              className={`p-1.5 rounded transition-colors disabled:opacity-30 ${isDark ? 'text-slate-400 hover:text-white hover:bg-slate-700' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'}`} title="Last page">
              <ChevronsRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        title="Delete Invoice"
        message="Are you sure you want to delete this invoice? This action cannot be undone."
        itemName={invoiceToDelete?.invoiceNumber}
        onConfirm={handleConfirmDelete}
        onCancel={() => setShowDeleteModal(false)}
      />

      {previewInvoice && (
        <InvoicePreviewModal
          invoice={previewInvoice}
          customer={null}
          onClose={() => setPreviewInvoice(null)}
          onEdit={() => {
            setPreviewInvoice(null);
            navigate(`/invoices/quick-checkout?edit=${previewInvoice.id}`);
          }}
        />
      )}
    </div>
  );
};