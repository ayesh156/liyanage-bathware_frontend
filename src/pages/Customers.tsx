import React, { useState, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../contexts/ThemeContext';
import { useIsMobile } from '../hooks/use-mobile';
import {
  Users, Plus, AlertTriangle, Wallet, UserCheck, UserX,
  CreditCard, Crown, ShoppingBag, BarChart3,
} from 'lucide-react';
import { toast } from 'react-toastify';
import api from '../lib/api';
import { Customer } from '../types';
import { CustomerTable } from '../components/CustomerTable';
import { CustomerFormModal } from '../components/modals/CustomerFormModal';
import { DeleteConfirmationModal } from '../components/modals/DeleteConfirmationModal';

// ── Server response type ──
interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    perPage: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

const isLoanOverdue = (customer: Customer) => {
  return customer.loanBalance > 0;
};

export const Customers: React.FC = () => {
  const { t, i18n: i18nInstance } = useTranslation();
  const { theme } = useTheme();
  const isMobile = useIsMobile();
  const isDark = theme === 'dark';

  // ── State ──
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  // Modal state
  const [showFormModal, setShowFormModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // ── Fetch customers from API ──
  const fetchCustomers = useCallback(async (search?: string, page?: number, perPage?: number) => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = {};
      if (search) params.search = search;
      if (page) params.page = page;
      if (perPage) params.perPage = perPage;

      const res = await api.get<PaginatedResponse<Customer>>('/customers', params, true);
      setCustomers(res?.data ?? []);
      setTotalItems(res?.meta?.total ?? 0);
      setTotalPages(res?.meta?.totalPages ?? 1);
    } catch (err: any) {
      toast.error('Failed to refresh customer list. Connection refused.');
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Initial load & refetch on search/page/pageSize change ──
  useEffect(() => {
    fetchCustomers(searchQuery || undefined, currentPage, pageSize);
  }, [fetchCustomers, currentPage, pageSize]);

  // Reset page on search change
  const handleSearchChange = useCallback((q: string) => {
    setSearchQuery(q);
    setCurrentPage(1);
    // Fetch immediately when search changes (debounce-free for now — acceptable for admin UX)
    fetchCustomers(q || undefined, 1, pageSize);
  }, [fetchCustomers, pageSize]);

  const handleRefresh = useCallback(() => {
    fetchCustomers(searchQuery || undefined, currentPage, pageSize);
  }, [fetchCustomers, searchQuery, currentPage, pageSize]);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  const handlePageSizeChange = useCallback((size: number) => {
    setPageSize(size);
    setCurrentPage(1);
  }, []);

  // ── Stats computation from API data ──
  const stats = React.useMemo(() => {
    const total = totalItems;
    const withLoans = customers.filter(c => c.loanBalance > 0).length;
    const totalLoanBalance = customers.reduce((sum, c) => sum + c.loanBalance, 0);
    const overdue = customers.filter(c => isLoanOverdue(c)).length;
    return { total, withLoans, totalLoanBalance, overdue };
  }, [customers, totalItems]);

  // ── CRUD Handlers ──
  const handleAddCustomer = () => {
    setSelectedCustomer(null);
    setShowFormModal(true);
  };

  const handleEditCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setShowFormModal(true);
  };

  const handleSaveCustomer = async (customer: Customer) => {
    try {
      if (selectedCustomer) {
        await api.put(`/customers/${customer.id}`, customer);
        toast.success(`Customer "${customer.name}" updated successfully.`);
      } else {
        await api.post('/customers', customer);
        toast.success(`Customer "${customer.name}" created successfully.`);
      }
      setShowFormModal(false);
      setSelectedCustomer(null);
      handleRefresh();
    } catch (err: any) {
      toast.error(err.message || 'Failed to save customer.');
    }
  };

  const handleDeleteClick = (customer: Customer) => {
    setCustomerToDelete(customer);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!customerToDelete) return;
    try {
      const customerName = customerToDelete.name;
      await api.delete(`/customers/${customerToDelete.id}`);
      toast.success(`Customer "${customerName}" deleted successfully.`);
      setShowDeleteModal(false);
      setCustomerToDelete(null);
      handleRefresh();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete customer.');
    }
  };

  // ── Localized display name for delete confirmation ──
  const isSinhala = i18nInstance.language === 'si';
  const displayDeleteName = customerToDelete
    ? isSinhala && customerToDelete.nameSi
      ? customerToDelete.nameSi
      : customerToDelete.name
    : undefined;

  // ── Filter detection ──
  const hasFilters = searchQuery.length > 0;
  const clearFilters = () => {
    setSearchQuery('');
    setCurrentPage(1);
    fetchCustomers(undefined, 1, pageSize);
  };

  // ── Card definitions matching Product Category aesthetic ──
  const statCards = [
    {
      label: 'Total Customers',
      value: stats.total,
      icon: Users,
      color: 'blue',
    },
    {
      label: 'Credit Customers',
      value: stats.withLoans,
      icon: CreditCard,
      color: 'purple',
    },
    {
      label: 'Total Due Balance',
      value: `Rs.${(stats.totalLoanBalance / 1000000).toFixed(1)}M`,
      icon: Wallet,
      color: 'green',
    },
    {
      label: 'Overdue Customers',
      value: stats.overdue,
      icon: AlertTriangle,
      color: 'red',
    },
  ];

  return (
    <div className={`space-y-4 ${isMobile ? 'pb-20' : ''}`}>
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
            {t('customers.title')}
          </h1>
          <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            {t('customers.allCustomers')} ({totalItems})
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleAddCustomer}
            className="flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600 text-white rounded-lg font-medium transition-all shadow shadow-orange-500/20 text-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            {t('customers.addCustomer')}
          </button>
        </div>
      </div>

      {/* ── Metrics Cards (Product Category style) ── */}
      <div className="grid grid-cols-4 gap-2">
        {statCards.map((item, i) => {
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

      {/* ── High-Density Customer Table ── */}
      <CustomerTable
        customers={customers}
        loading={loading}
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
        onEdit={handleEditCustomer}
        onDelete={handleDeleteClick}
        onRefresh={handleRefresh}
        hasFilters={hasFilters}
        onClearFilters={clearFilters}
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalItems}
        onPageChange={handlePageChange}
        pageSize={pageSize}
        onPageSizeChange={handlePageSizeChange}
      />

      {/* ── Modals ── */}
      <CustomerFormModal
        isOpen={showFormModal}
        customer={selectedCustomer || undefined}
        onClose={() => { setShowFormModal(false); setSelectedCustomer(null); }}
        onSave={handleSaveCustomer}
      />

      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        title={t('customers.deleteCustomer')}
        message={t('customers.deleteConfirmation')}
        itemName={displayDeleteName}
        onConfirm={handleConfirmDelete}
        onCancel={() => setShowDeleteModal(false)}
      />
    </div>
  );
};