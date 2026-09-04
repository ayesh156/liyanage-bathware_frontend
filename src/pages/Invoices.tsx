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
  ChevronsLeft, ChevronsRight, ChevronDown, X,
} from 'lucide-react';
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
  paid:     { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20', icon: <CheckCircle className="w-3 h-3" /> },
  pending:  { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20', icon: <Clock className="w-3 h-3" /> },
  overdue:  { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/20', icon: <AlertTriangle className="w-3 h-3" /> },
  cancelled:{ bg: 'bg-gray-500/10', text: 'text-gray-400', border: 'border-gray-500/20', icon: <XCircle className="w-3 h-3" /> },
};

const formatPrice = (price: number) => `Rs. ${price.toLocaleString()}`;

// Format any date-like value to strict ISO YYYY-MM-DD. Falls back to the
// raw string (or '—') if the value can't be parsed, instead of throwing.
const formatDateISO = (value: string | Date | undefined | null): string => {
  if (!value) return '—';
  const d = new Date(value);
  if (isNaN(d.getTime())) return typeof value === 'string' ? value : '—';
  return d.toISOString().split('T')[0];
};

// ── Searchable Combobox (matches ProductTable style) ──
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
        className={`w-full flex items-center justify-between px-2.5 py-1.5 text-xs border rounded-lg transition-all ${
          isDark ? 'bg-slate-800 border-slate-700 text-white hover:border-slate-600' : 'bg-white border-slate-200 text-slate-900 hover:border-slate-300'
        }`}>
        <span className="truncate">{displayValue}</span>
        <ChevronDown className={`w-3 h-3 ml-1 flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''} ${isDark ? 'text-slate-400' : 'text-slate-500'}`} />
      </button>
      {open && (
        <div className={`absolute left-0 top-full mt-0.5 w-full min-w-[180px] rounded-lg border shadow-2xl z-50 overflow-hidden backdrop-blur-md ${
          isDark ? 'bg-slate-800/95 border-slate-700/50' : 'bg-white/95 border-slate-200'
        }`}>
          <div className="relative border-b border-slate-700/30">
            <input ref={inputRef} type="text" value={search}
              onChange={(e) => setSearch(e.target.value)} placeholder={placeholder || 'Search...'}
              className={`w-full px-2.5 py-1.5 text-xs border-0 focus:outline-none focus:ring-0 ${
                isDark ? 'bg-slate-800/50 text-white placeholder:text-slate-500' : 'bg-white text-slate-900 placeholder:text-slate-400'
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
                className={`w-full text-left px-2.5 py-1.5 text-xs font-medium transition-colors ${
                  opt.value === value ? 'bg-orange-500/20 text-orange-400' : isDark ? 'text-slate-300 hover:bg-slate-700/50' : 'text-slate-700 hover:bg-slate-100'
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
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [invoiceToDelete, setInvoiceToDelete] = useState<Invoice | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [previewInvoice, setPreviewInvoice] = useState<Invoice | null>(null);

  // ── Fetch invoices from live backend API ──
  const fetchInvoicesHistory = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get<any[]>('/invoices', { perPage: 1000 }, true) as any;
      // Handle response envelope { success, data, meta } or plain array
      const data = response?.data || response || [];
      setInvoices(data);
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

  const filteredInvoices = useMemo(() => {
    const filtered = invoices.filter((invoice) => {
      const matchesSearch =
        invoice.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (invoice.customerName || '').toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
    return filtered.sort((a, b) => {
      const dateA = new Date(a.issueDate).getTime();
      const dateB = new Date(b.issueDate).getTime();
      return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
    });
  }, [invoices, searchQuery, statusFilter, sortOrder]);

  const totalPages = Math.ceil(filteredInvoices.length / rowsPerPage);
  const paginatedInvoices = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return filteredInvoices.slice(start, start + rowsPerPage);
  }, [filteredInvoices, currentPage, rowsPerPage]);

  useEffect(() => { setCurrentPage(1); }, [searchQuery, statusFilter, rowsPerPage]);

  const stats = useMemo(() => {
    const total = invoices.length;
    const totalRevenue = invoices.filter(i => i.status === 'paid').reduce((sum, i) => sum + i.total, 0);
    const pendingAmount = invoices.filter(i => i.status === 'pending').reduce((sum, i) => sum + i.total, 0);
    const overdueAmount = invoices.filter(i => i.status === 'overdue').reduce((sum, i) => sum + i.total, 0);
    return { total, totalRevenue, pendingAmount, overdueAmount };
  }, [invoices]);

  const clearFilters = () => { setSearchQuery(''); setStatusFilter('all'); };
  const hasActiveFilters = searchQuery || statusFilter !== 'all';
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
    printInvoice(invoice, customer, 'en', currentUser?.name || 'Admin User').catch(() => {});
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

      {/* Stats Cards — compact 4-col */}
      <div className="grid grid-cols-4 gap-2">
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

      {/* ── BALANCED HORIZONTAL TOOLBAR with permanently visible filters ── */}
      <div className={`p-4 rounded-lg border ${isDark ? 'bg-slate-800/50 border-slate-700/50' : 'bg-white border-slate-200 shadow-sm'}`}>
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-xl">
            <Search className={`absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`} />
            <input type="text" placeholder={t('invoices.searchByInvoiceOrCustomer')} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full pl-8 pr-9 py-2 text-xs border rounded-lg focus:outline-none focus:ring-1 focus:ring-orange-500/50 focus:border-orange-500/50 transition-all ${isDark ? 'bg-slate-900/50 border-slate-700 text-white placeholder:text-slate-500' : 'bg-slate-50 border-slate-200'}`} />
            {searchQuery.length > 0 && (
              <button onClick={() => setSearchQuery('')}
                className={`absolute right-1.5 top-1/2 -translate-y-1/2 p-0.5 rounded transition-colors ${isDark ? 'text-slate-400 hover:text-white hover:bg-slate-700' : 'text-slate-400 hover:text-slate-700 hover:bg-slate-200'}`}>
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <div className="relative min-w-[200px] w-56">
            <SearchableSelect options={[
              { value: 'all', label: t('invoices.allStatuses') },
              { value: 'paid', label: t('invoices.paidLabel') },
              { value: 'pending', label: t('invoices.pendingLabel') },
              { value: 'overdue', label: t('invoices.overdueLabel') },
              { value: 'cancelled', label: t('invoices.cancelledLabel') },
            ]} value={statusFilter} onChange={(v) => setStatusFilter(v)} placeholder={t('invoices.searchStatus')} isDark={isDark} />
            {statusFilter !== 'all' && (
              <button onClick={() => setStatusFilter('all')}
                className={`absolute -right-2 -top-2 z-10 w-4 h-4 rounded-full flex items-center justify-center transition-colors shadow-sm ${isDark ? 'bg-slate-700 text-slate-300 hover:bg-slate-600 border border-slate-600' : 'bg-white text-slate-500 hover:bg-slate-100 border border-slate-300'}`} title="Reset status filter">
                <X className="w-2.5 h-2.5" />
              </button>
            )}
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <SortButton currentSortOrder={sortOrder} onSortToggle={() => setSortOrder(s => s === 'asc' ? 'desc' : 'asc')} />
            {hasActiveFilters && <button onClick={clearFilters} className={`p-1.5 rounded-lg transition-colors flex-shrink-0 ${isDark ? 'text-slate-400 hover:text-white hover:bg-slate-700' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'}`}><RefreshCw className="w-3 h-3" /></button>}
            <span className={`text-[10px] font-medium whitespace-nowrap ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{t('invoices.invoicesCount', { count: filteredInvoices.length })}</span>
          </div>
        </div>
      </div>

      {/* Unified Table — matches ProductTable compact style */}
      <div className={`rounded-lg border overflow-hidden ${isDark ? 'bg-slate-900/95 border-slate-700/50' : 'bg-white border-slate-200 shadow-sm'}`}>
        <div className="overflow-x-auto">
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

        {/* Advanced Pagination — matches ProductTable */}
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
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const start = Math.max(1, Math.min(currentPage - 2, totalPages - 4));
              const page = start + i;
              if (page > totalPages) return null;
              return (
                <button key={page} onClick={() => setCurrentPage(page)}
                  className={`w-7 h-7 text-[10px] font-semibold rounded transition-all ${page === currentPage ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20' : isDark ? 'text-slate-300 hover:bg-slate-700' : 'text-slate-600 hover:bg-slate-100'}`}>{page}</button>
              );
            })}
            <button onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}
              className={`p-1.5 rounded transition-colors disabled:opacity-30 ${isDark ? 'text-slate-400 hover:text-white hover:bg-slate-700' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'}`} title="Next page">
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages}
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

      {/* Invoice Preview Modal */}
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