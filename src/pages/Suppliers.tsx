import React, { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../contexts/ThemeContext';
import { useIsMobile } from '../hooks/use-mobile';
import { Supplier, SupplierDelivery, Product } from '../types/index';
import { mockSuppliers, mockProducts } from '../data/mockData';
import { 
  Truck, Plus, Search, Filter, RefreshCw, Edit2, Trash2, 
  Banknote, CreditCard, Phone, Mail, MapPin, Calendar,
  AlertTriangle, Clock, ChevronDown, ChevronUp, Package,
  DollarSign, User, Building2, FileText, Bell, X, MoreVertical, SortAsc, SortDesc
} from 'lucide-react';
import { DeleteConfirmationModal } from '../components/modals/DeleteConfirmationModal';
import { SupplierFormModal } from '../components/modals/SupplierFormModal';
import { SearchableSelect } from '../components/ui/searchable-select';
import { toast } from 'react-toastify';

type TabFilter = 'all' | 'cash' | 'credit';

export default function Suppliers() {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const isMobile = useIsMobile();
  
  const [suppliers, setSuppliers] = useState<Supplier[]>(mockSuppliers);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<TabFilter>('all');
  const [expandedSupplier, setExpandedSupplier] = useState<string | null>(null);
  const [mobileActionSupplier, setMobileActionSupplier] = useState<Supplier | null>(null);
  
  // Filter and sort states
  const [showFilters, setShowFilters] = useState(false);
  const [locationFilter, setLocationFilter] = useState<string>('all');
  const [creditStatusFilter, setCreditStatusFilter] = useState<string>('all'); // all, overdue, due_soon, ok
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  
  // Modal states
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | undefined>(undefined);
  const [supplierToDelete, setSupplierToDelete] = useState<Supplier | null>(null);

  // Calculate credit alerts
  const creditAlerts = useMemo(() => {
    const today = new Date();
    return suppliers
      .filter(s => s.paymentType === 'credit' && s.creditDueDate && s.creditBalance && s.creditBalance > 0)
      .map(s => {
        const dueDate = new Date(s.creditDueDate!);
        const diffTime = dueDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return { supplier: s, daysUntilDue: diffDays };
      })
      .filter(a => a.daysUntilDue <= 7) // Alert for due within 7 days
      .sort((a, b) => a.daysUntilDue - b.daysUntilDue);
  }, [suppliers]);

  // Show notifications for upcoming due dates
  useEffect(() => {
    creditAlerts.forEach(alert => {
      if (alert.daysUntilDue <= 0) {
      toast.error(
          `${alert.supplier.name}: ${t('suppliers.overdue', { days: Math.abs(alert.daysUntilDue) })}`,
          { autoClose: 10000 }
        );
      } else if (alert.daysUntilDue <= 3) {
        toast.warning(
          `${alert.supplier.name}: ${t('suppliers.dueIn', { days: alert.daysUntilDue })}`,
          { autoClose: 8000 }
        );
      }
    });
  }, []);

  // Helper function to get due date status
  const getDueDateStatus = (dueDate: string) => {
    const today = new Date();
    const due = new Date(dueDate);
    const diffDays = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return { status: 'overdue', days: Math.abs(diffDays), color: 'red' };
    if (diffDays === 0) return { status: 'today', days: 0, color: 'orange' };
    if (diffDays <= 7) return { status: 'soon', days: diffDays, color: 'yellow' };
    return { status: 'ok', days: diffDays, color: 'green' };
  };

  // Get unique locations for filter
  const allLocations = useMemo(() => {
    const locations = Array.from(new Set(suppliers.map(s => s.address).filter(Boolean)));
    return locations.sort();
  }, [suppliers]);

  // Filter and sort suppliers
  const filteredSuppliers = useMemo(() => {
    let filtered = suppliers.filter(supplier => {
      const matchesSearch = 
        supplier.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        supplier.contactPerson.toLowerCase().includes(searchQuery.toLowerCase()) ||
        supplier.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (supplier.address && supplier.address.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesTab = 
        activeTab === 'all' || supplier.paymentType === activeTab;
      
      const matchesLocation = 
        locationFilter === 'all' || supplier.address === locationFilter;
      
      // Credit status filter logic
      let matchesCreditStatus = true;
      if (creditStatusFilter !== 'all' && supplier.paymentType === 'credit') {
        if (supplier.creditDueDate && supplier.creditBalance && supplier.creditBalance > 0) {
          const dueStatus = getDueDateStatus(supplier.creditDueDate);
          if (creditStatusFilter === 'overdue') {
            matchesCreditStatus = dueStatus.status === 'overdue';
          } else if (creditStatusFilter === 'due_soon') {
            matchesCreditStatus = dueStatus.status === 'soon' || dueStatus.status === 'today';
          } else if (creditStatusFilter === 'ok') {
            matchesCreditStatus = dueStatus.status === 'ok';
          }
        } else {
          matchesCreditStatus = false;
        }
      }
      
      return matchesSearch && matchesTab && matchesLocation && matchesCreditStatus && supplier.isActive;
    });

    // Apply sorting
    filtered.sort((a, b) => {
      const comparison = a.name.localeCompare(b.name);
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [suppliers, searchQuery, activeTab, locationFilter, creditStatusFilter, sortOrder]);

  // Stats
  const stats = useMemo(() => ({
    total: suppliers.filter(s => s.isActive).length,
    cash: suppliers.filter(s => s.isActive && s.paymentType === 'cash').length,
    credit: suppliers.filter(s => s.isActive && s.paymentType === 'credit').length,
    alerts: creditAlerts.length,
  }), [suppliers, creditAlerts]);

  const handleAddSupplier = () => {
    setSelectedSupplier(undefined);
    setIsFormModalOpen(true);
  };

  const handleEditSupplier = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setIsFormModalOpen(true);
  };

  const handleDeleteClick = (supplier: Supplier) => {
    setSupplierToDelete(supplier);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (supplierToDelete) {
      setSuppliers(prev => prev.filter(s => s.id !== supplierToDelete.id));
      toast.success(t('suppliers.supplierDeleted'));
      setIsDeleteModalOpen(false);
      setSupplierToDelete(null);
    }
  };

  const handleSaveSupplier = (supplier: Supplier) => {
    if (selectedSupplier) {
      setSuppliers(prev => prev.map(s => s.id === supplier.id ? supplier : s));
    } else {
      setSuppliers(prev => [...prev, supplier]);
    }
    toast.success(t('suppliers.supplierSaved'));
    setIsFormModalOpen(false);
  };

  const toggleSupplierExpand = (supplierId: string) => {
    setExpandedSupplier(prev => prev === supplierId ? null : supplierId);
  };

  const formatCurrency = (amount: number) => {
    return `Rs. ${amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
  };

  return (
    <div className={`${isMobile ? 'pb-20' : ''} space-y-4 md:space-y-6`}>
        {/* Mobile Header - Compact */}
        {isMobile ? (
          <div className="sticky top-0 z-10 -mx-4 -mt-4 px-4 py-3 backdrop-blur-lg bg-opacity-90 border-b" style={{
            backgroundColor: theme === 'dark' ? 'rgba(15, 23, 42, 0.9)' : 'rgba(255, 255, 255, 0.9)',
            borderColor: theme === 'dark' ? 'rgba(51, 65, 85, 0.5)' : 'rgba(226, 232, 240, 0.8)'
          }}>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h1 className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                  {t('suppliers.title')}
                </h1>
                <p className={`text-xs mt-0.5 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                  {stats.total} {t('suppliers.totalSuppliers')}
                </p>
              </div>
              <button
                onClick={handleAddSupplier}
                className="p-3 bg-gradient-to-r from-orange-500 to-rose-500 text-white rounded-full shadow-lg shadow-orange-500/30 active:scale-95 transition-transform"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
            
            {/* Mobile Search Bar */}
            <div className="relative">
              <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`} />
              <input
                type="text"
                placeholder={t('suppliers.searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full pl-10 pr-4 py-2.5 rounded-xl border transition-colors text-sm ${
                  theme === 'dark'
                    ? 'bg-slate-800/50 border-slate-700 text-white placeholder-slate-500 focus:border-orange-500'
                    : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-orange-500'
                } focus:outline-none focus:ring-2 focus:ring-orange-500/20`}
              />
            </div>
          </div>
        ) : (
          /* Desktop Header */
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                {t('suppliers.title')}
              </h1>
              <p className={`text-sm mt-1 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                {t('suppliers.subtitle')}
              </p>
            </div>
            <button
              onClick={handleAddSupplier}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-orange-500 to-rose-500 text-white rounded-xl font-medium shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 transition-all"
            >
              <Plus className="w-5 h-5" />
              {t('suppliers.addSupplier')}
            </button>
          </div>
        )}

        {/* Credit Alerts Banner */}
        {creditAlerts.length > 0 && (
          <div className={`p-4 rounded-xl border ${theme === 'dark' ? 'bg-amber-500/10 border-amber-500/20' : 'bg-amber-50 border-amber-200'}`}>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/20">
                <Bell className="w-5 h-5 text-amber-500" />
              </div>
              <div className="flex-1">
                <h3 className={`font-semibold ${theme === 'dark' ? 'text-amber-400' : 'text-amber-700'}`}>
                  {t('suppliers.creditAlert')} ({creditAlerts.length})
                </h3>
                <p className={`text-sm ${theme === 'dark' ? 'text-amber-400/70' : 'text-amber-600'}`}>
                  {creditAlerts.map(a => a.supplier.name).join(', ')}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Stats Cards - Mobile Grid (2x2) */}
        {isMobile ? (
          <div className="-mx-4 px-4">
            <div className="grid grid-cols-2 gap-3">
              <div className={`p-3 rounded-xl border ${theme === 'dark' ? 'bg-slate-800/50 border-slate-700/50' : 'bg-white border-slate-200 shadow-sm'}`}>
                <div className={`p-2 rounded-lg w-fit ${theme === 'dark' ? 'bg-purple-500/20' : 'bg-purple-100'}`}>
                  <Truck className="w-4 h-4 text-purple-500" />
                </div>
                <p className={`text-2xl font-bold mt-2 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{stats.total}</p>
                <p className={`text-xs mt-0.5 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>{t('suppliers.totalSuppliers')}</p>
              </div>
              <div className={`p-3 rounded-xl border ${theme === 'dark' ? 'bg-slate-800/50 border-slate-700/50' : 'bg-white border-slate-200 shadow-sm'}`}>
                <div className={`p-2 rounded-lg w-fit ${theme === 'dark' ? 'bg-green-500/20' : 'bg-green-100'}`}>
                  <Banknote className="w-4 h-4 text-green-500" />
                </div>
                <p className={`text-2xl font-bold mt-2 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{stats.cash}</p>
                <p className={`text-xs mt-0.5 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>{t('suppliers.cashSuppliers')}</p>
              </div>
              <div className={`p-3 rounded-xl border ${theme === 'dark' ? 'bg-slate-800/50 border-slate-700/50' : 'bg-white border-slate-200 shadow-sm'}`}>
                <div className={`p-2 rounded-lg w-fit ${theme === 'dark' ? 'bg-orange-500/20' : 'bg-orange-100'}`}>
                  <CreditCard className="w-4 h-4 text-orange-500" />
                </div>
                <p className={`text-2xl font-bold mt-2 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{stats.credit}</p>
                <p className={`text-xs mt-0.5 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>{t('suppliers.creditSuppliers')}</p>
              </div>
              <div className={`p-3 rounded-xl border ${theme === 'dark' ? 'bg-slate-800/50 border-slate-700/50' : 'bg-white border-slate-200 shadow-sm'}`}>
                <div className={`p-2 rounded-lg w-fit ${stats.alerts > 0 ? 'bg-red-500/20' : theme === 'dark' ? 'bg-slate-700' : 'bg-slate-100'}`}>
                  <AlertTriangle className={`w-4 h-4 ${stats.alerts > 0 ? 'text-red-500' : theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`} />
                </div>
                <p className={`text-2xl font-bold mt-2 ${stats.alerts > 0 ? 'text-red-500' : theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{stats.alerts}</p>
                <p className={`text-xs mt-0.5 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>{t('suppliers.paymentDue')}</p>
              </div>
            </div>
          </div>
        ) : (
          /* Desktop Stats Grid */
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className={`p-4 rounded-xl border ${theme === 'dark' ? 'bg-slate-800/50 border-slate-700/50' : 'bg-white border-slate-200 shadow-sm'}`}>
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${theme === 'dark' ? 'bg-purple-500/20' : 'bg-purple-100'}`}>
                  <Truck className="w-5 h-5 text-purple-500" />
                </div>
                <div>
                  <p className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{stats.total}</p>
                  <p className={`text-xs ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>{t('suppliers.totalSuppliers')}</p>
                </div>
              </div>
            </div>
            <div className={`p-4 rounded-xl border ${theme === 'dark' ? 'bg-slate-800/50 border-slate-700/50' : 'bg-white border-slate-200 shadow-sm'}`}>
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${theme === 'dark' ? 'bg-green-500/20' : 'bg-green-100'}`}>
                  <Banknote className="w-5 h-5 text-green-500" />
                </div>
                <div>
                  <p className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{stats.cash}</p>
                  <p className={`text-xs ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>{t('suppliers.cashSuppliers')}</p>
                </div>
              </div>
            </div>
            <div className={`p-4 rounded-xl border ${theme === 'dark' ? 'bg-slate-800/50 border-slate-700/50' : 'bg-white border-slate-200 shadow-sm'}`}>
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${theme === 'dark' ? 'bg-orange-500/20' : 'bg-orange-100'}`}>
                  <CreditCard className="w-5 h-5 text-orange-500" />
                </div>
                <div>
                  <p className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{stats.credit}</p>
                  <p className={`text-xs ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>{t('suppliers.creditSuppliers')}</p>
                </div>
              </div>
            </div>
            <div className={`p-4 rounded-xl border ${theme === 'dark' ? 'bg-slate-800/50 border-slate-700/50' : 'bg-white border-slate-200 shadow-sm'}`}>
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${stats.alerts > 0 ? 'bg-red-500/20' : theme === 'dark' ? 'bg-slate-700' : 'bg-slate-100'}`}>
                  <AlertTriangle className={`w-5 h-5 ${stats.alerts > 0 ? 'text-red-500' : theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`} />
                </div>
                <div>
                  <p className={`text-2xl font-bold ${stats.alerts > 0 ? 'text-red-500' : theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{stats.alerts}</p>
                  <p className={`text-xs ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>{t('suppliers.paymentDue')}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Toolbar - Desktop Only */}
        {!isMobile && (
          <div className={`p-4 rounded-xl border ${theme === 'dark' ? 'bg-slate-800/30 border-slate-700/50' : 'bg-white border-slate-200 shadow-sm'}`}>
            <div className="flex flex-col gap-4">
              {/* Top row - Tabs and Search */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                {/* Tabs */}
                <div className={`flex items-center gap-1 p-1 rounded-lg ${theme === 'dark' ? 'bg-slate-900/50' : 'bg-slate-100'}`}>
                  <button
                    onClick={() => setActiveTab('all')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      activeTab === 'all'
                        ? 'bg-gradient-to-r from-orange-500 to-rose-500 text-white shadow-lg'
                        : theme === 'dark' ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {t('suppliers.allSuppliers')} ({stats.total})
                  </button>
                  <button
                    onClick={() => setActiveTab('cash')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                      activeTab === 'cash'
                        ? 'bg-green-500 text-white shadow-lg'
                        : theme === 'dark' ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Banknote className="w-4 h-4" />
                    {t('suppliers.cashTab')} ({stats.cash})
                  </button>
                  <button
                    onClick={() => setActiveTab('credit')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                      activeTab === 'credit'
                        ? 'bg-orange-500 text-white shadow-lg'
                        : theme === 'dark' ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <CreditCard className="w-4 h-4" />
                    {t('suppliers.creditTab')} ({stats.credit})
                  </button>
                </div>

                {/* Search and Controls */}
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`} />
                    <input
                      type="text"
                      placeholder={t('suppliers.searchPlaceholder')}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className={`w-full md:w-64 pl-10 pr-4 py-2 rounded-lg border transition-colors ${
                        theme === 'dark'
                          ? 'bg-slate-900/50 border-slate-700 text-white placeholder-slate-500 focus:border-orange-500'
                          : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-orange-500'
                      } focus:outline-none focus:ring-2 focus:ring-orange-500/20`}
                    />
                  </div>

                  {/* Filter Button */}
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all border ${
                      locationFilter !== 'all' || creditStatusFilter !== 'all'
                        ? 'bg-orange-500 text-white border-orange-500'
                        : theme === 'dark' 
                          ? 'border-slate-700 bg-slate-800/50 text-slate-300 hover:bg-slate-700' 
                          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Filter className="w-4 h-4" />
                    {t('common.filter')}
                    {(locationFilter !== 'all' || creditStatusFilter !== 'all') && (
                      <span className="bg-white/20 px-1.5 py-0.5 rounded text-xs">
                        {[locationFilter !== 'all', creditStatusFilter !== 'all'].filter(Boolean).length}
                      </span>
                    )}
                    <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Sort Button */}
                  <button
                    onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                    className={`p-2 rounded-lg border transition-colors ${
                      theme === 'dark' ? 'border-slate-700 hover:bg-slate-800' : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {sortOrder === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />}
                  </button>

                  {/* Clear Filters */}
                  {(locationFilter !== 'all' || creditStatusFilter !== 'all' || searchQuery) && (
                    <button
                      onClick={() => {
                        setSearchQuery('');
                        setLocationFilter('all');
                        setCreditStatusFilter('all');
                        setSortOrder('asc');
                      }}
                      className={`px-3 py-2 rounded-lg transition-colors ${
                        theme === 'dark'
                          ? 'text-slate-400 hover:text-white hover:bg-slate-800'
                          : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                      }`}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Expanded Filters */}
              {showFilters && (
                <div className={`flex flex-wrap gap-4 pt-4 border-t ${theme === 'dark' ? 'border-slate-700/50' : 'border-slate-200'}`}>
                  {/* Location Filter */}
                  <div className="flex-1 min-w-[200px]">
                    <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
                      <MapPin className="w-4 h-4 inline mr-1" />
                      {t('filters.location')}
                    </label>
                    <SearchableSelect
                      value={locationFilter}
                      onValueChange={setLocationFilter}
                      placeholder={t('filters.allLocations')}
                      theme={theme}
                      options={[
                        { value: 'all', label: t('filters.allLocations') },
                        ...allLocations.map(location => ({
                          value: location,
                          label: location
                        }))
                      ]}
                    />
                  </div>

                  {/* Credit Status Filter */}
                  {activeTab !== 'cash' && (
                    <div className="flex-1 min-w-[200px]">
                      <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
                        <Clock className="w-4 h-4 inline mr-1" />
                        {t('filters.creditStatus')}
                      </label>
                      <SearchableSelect
                        value={creditStatusFilter}
                        onValueChange={setCreditStatusFilter}
                        placeholder={t('filters.allCreditStatus')}
                        theme={theme}
                        options={[
                          { value: 'all', label: t('filters.allCreditStatus') },
                          { value: 'overdue', label: t('filters.overdue') },
                          { value: 'due_soon', label: t('filters.dueSoon') },
                          { value: 'ok', label: t('filters.onTrack') }
                        ]}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Mobile Filter Tabs and Controls */}
        {isMobile && (
          <div className="-mx-4 px-4 space-y-3">
            {/* Tabs */}
            <div className="overflow-x-auto pb-2 no-scrollbar -mx-4 px-4">
              <div className={`flex items-center gap-2 p-1 rounded-lg min-w-max ${theme === 'dark' ? 'bg-slate-800/50' : 'bg-slate-100'}`}>
                <button
                  onClick={() => setActiveTab('all')}
                  className={`px-3 py-2 rounded-lg text-xs font-medium transition-all whitespace-nowrap overflow-hidden truncate max-w-[140px] ${
                    activeTab === 'all'
                      ? 'bg-gradient-to-r from-orange-500 to-rose-500 text-white shadow-lg'
                      : theme === 'dark' ? 'text-slate-400' : 'text-slate-600'
                  }`}
                >
                  {t('suppliers.allSuppliers')} ({stats.total})
                </button>
                <button
                  onClick={() => setActiveTab('cash')}
                  className={`px-3 py-2 rounded-lg text-xs font-medium transition-all flex items-center gap-2 whitespace-nowrap overflow-hidden truncate max-w-[140px] ${
                    activeTab === 'cash'
                      ? 'bg-green-500 text-white shadow-lg'
                      : theme === 'dark' ? 'text-slate-400' : 'text-slate-600'
                  }`}
                >
                  <Banknote className="w-3 h-3" />
                  {t('suppliers.cashTab')} ({stats.cash})
                </button>
                <button
                  onClick={() => setActiveTab('credit')}
                  className={`px-3 py-2 rounded-lg text-xs font-medium transition-all flex items-center gap-2 whitespace-nowrap overflow-hidden truncate max-w-[140px] ${
                    activeTab === 'credit'
                      ? 'bg-orange-500 text-white shadow-lg'
                      : theme === 'dark' ? 'text-slate-400' : 'text-slate-600'
                  }`}
                >
                  <CreditCard className="w-3 h-3" />
                  {t('suppliers.creditTab')} ({stats.credit})
                </button>
              </div>
            </div>

            {/* Mobile Controls Row */}
            <div className="flex items-center gap-2">
              {/* Filter Button */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all border flex-shrink-0 ${
                  locationFilter !== 'all' || creditStatusFilter !== 'all'
                    ? 'bg-orange-500 text-white border-orange-500'
                    : theme === 'dark' 
                      ? 'border-slate-700 bg-slate-800/50 text-slate-300' 
                      : 'border-slate-200 bg-white text-slate-600'
                }`}
              >
                <Filter className="w-4 h-4" />
                {t('common.filter')}
                {(locationFilter !== 'all' || creditStatusFilter !== 'all') && (
                  <span className="bg-white/20 px-1.5 py-0.5 rounded text-xs">
                    {[locationFilter !== 'all', creditStatusFilter !== 'all'].filter(Boolean).length}
                  </span>
                )}
              </button>

              {/* Sort Button */}
              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className={`p-2 rounded-lg border transition-transform ${
                  theme === 'dark' ? 'border-slate-700 hover:bg-slate-800' : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <SortAsc className={`w-4 h-4 transition-transform ${sortOrder === 'desc' ? 'rotate-180' : ''}`} />
              </button>

              {/* Clear Filters */}
              {(locationFilter !== 'all' || creditStatusFilter !== 'all') && (
                <button
                  onClick={() => {
                    setLocationFilter('all');
                    setCreditStatusFilter('all');
                    setSortOrder('asc');
                  }}
                  className={`p-2 rounded-lg transition-colors ${
                    theme === 'dark'
                      ? 'text-slate-400 hover:bg-slate-800'
                      : 'text-slate-500 hover:bg-slate-100'
                  }`}
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Mobile Expanded Filters */}
            {showFilters && (
              <div className={`p-3 rounded-xl border space-y-3 ${
                theme === 'dark' ? 'bg-slate-800/30 border-slate-700/50' : 'bg-white border-slate-200'
              }`}>
                {/* Location Filter */}
                <div>
                  <label className={`block text-xs font-medium mb-1.5 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
                    <MapPin className="w-3 h-3 inline mr-1" />
                    {t('filters.location')}
                  </label>
                  <SearchableSelect
                    value={locationFilter}
                    onValueChange={setLocationFilter}
                    placeholder={t('filters.allLocations')}
                    theme={theme}
                    options={[
                      { value: 'all', label: t('filters.allLocations') },
                      ...allLocations.map(location => ({
                        value: location,
                        label: location
                      }))
                    ]}
                  />
                </div>

                {/* Credit Status Filter */}
                {activeTab !== 'cash' && (
                  <div>
                    <label className={`block text-xs font-medium mb-1.5 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
                      <Clock className="w-3 h-3 inline mr-1" />
                      {t('filters.creditStatus')}
                    </label>
                    <SearchableSelect
                      value={creditStatusFilter}
                      onValueChange={setCreditStatusFilter}
                      placeholder={t('filters.allCreditStatus')}
                      theme={theme}
                      options={[
                        { value: 'all', label: t('filters.allCreditStatus') },
                        { value: 'overdue', label: t('filters.overdue') },
                        { value: 'due_soon', label: t('filters.dueSoon') },
                        { value: 'ok', label: t('filters.onTrack') }
                      ]}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Suppliers List */}
        <div className="space-y-4">
          {filteredSuppliers.length > 0 ? (
            filteredSuppliers.map(supplier => {
              const isExpanded = expandedSupplier === supplier.id;
              const dueStatus = supplier.creditDueDate ? getDueDateStatus(supplier.creditDueDate) : null;
              
              return (
                <div
                  key={supplier.id}
                  className={`rounded-xl border overflow-hidden transition-all ${
                    theme === 'dark' ? 'bg-slate-800/30 border-slate-700/50' : 'bg-white border-slate-200 shadow-sm'
                  }`}
                >
                  {/* Supplier Header - Mobile Optimized */}
                  <div className={isMobile ? 'p-3' : 'p-4'}>
                    {isMobile ? (
                      /* Mobile Compact Layout */
                      <>
                        {/* Top Row: Icon + Name + Credit Badge */}
                        <div className="flex items-start gap-2.5 mb-3">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                            supplier.paymentType === 'cash'
                              ? 'bg-green-500/20 text-green-500'
                              : 'bg-orange-500/20 text-orange-500'
                          }`}>
                            {supplier.paymentType === 'cash' ? <Banknote className="w-6 h-6" /> : <CreditCard className="w-6 h-6" />}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <h3 className={`text-base font-semibold leading-tight mb-1.5 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                              {supplier.name}
                            </h3>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium flex-shrink-0 ${
                                supplier.paymentType === 'cash'
                                  ? 'bg-green-500/10 text-green-500 border border-green-500/20'
                                  : 'bg-orange-500/10 text-orange-500 border border-orange-500/20'
                              }`}>
                                {supplier.paymentType === 'cash' ? t('suppliers.cashTab') : t('suppliers.creditTab')}
                              </span>
                              {dueStatus && dueStatus.status !== 'ok' && (
                                <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-medium flex items-center gap-1 ${
                                  dueStatus.color === 'red' ? 'bg-red-500/10 text-red-500 border border-red-500/20' :
                                  dueStatus.color === 'orange' ? 'bg-orange-500/10 text-orange-500 border border-orange-500/20' :
                                  'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20'
                                }`}>
                                  <AlertTriangle className="w-2.5 h-2.5" />
                                  {dueStatus.status === 'overdue' ? `${Math.abs(dueStatus.days)}d overdue` :
                                   dueStatus.status === 'today' ? 'Due today' :
                                   `${dueStatus.days}d left`}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <button
                              onClick={() => setMobileActionSupplier(supplier)}
                              className={`p-2 rounded-lg transition-colors ${theme === 'dark' ? 'hover:bg-slate-700 active:bg-slate-600' : 'hover:bg-slate-100 active:bg-slate-200'}`}
                            >
                              <MoreVertical className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => toggleSupplierExpand(supplier.id)}
                              className={`p-2 rounded-lg transition-colors ${theme === 'dark' ? 'hover:bg-slate-700 active:bg-slate-600' : 'hover:bg-slate-100 active:bg-slate-200'}`}
                            >
                              {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                            </button>
                          </div>
                        </div>

                        {/* Contact Info Row */}
                        <div className={`flex flex-col gap-2 p-2.5 rounded-lg ${theme === 'dark' ? 'bg-slate-800/30' : 'bg-slate-50'}`}>
                          <div className={`flex items-center gap-2 text-xs ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>
                            <User className="w-3.5 h-3.5 flex-shrink-0 text-slate-400" />
                            <span className="truncate">{supplier.contactPerson}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <a 
                              href={`tel:${supplier.phone}`}
                              className={`flex items-center gap-1.5 text-xs font-medium ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'} active:opacity-70`}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Phone className="w-3.5 h-3.5 flex-shrink-0" />
                              {supplier.phone}
                            </a>
                            <a 
                              href={`mailto:${supplier.email}`}
                              className={`flex items-center gap-1.5 text-xs font-medium truncate ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'} active:opacity-70`}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Mail className="w-3.5 h-3.5 flex-shrink-0" />
                              <span className="truncate">{supplier.email}</span>
                            </a>
                          </div>
                        </div>

                        {/* Credit Amount - Mobile */}
                        {supplier.paymentType === 'credit' && supplier.creditBalance && (
                          <div className={`mt-2.5 p-2.5 rounded-lg flex items-center justify-between ${theme === 'dark' ? 'bg-orange-500/10 border border-orange-500/20' : 'bg-orange-50 border border-orange-200'}`}>
                            <span className={`text-xs font-medium ${theme === 'dark' ? 'text-orange-400' : 'text-orange-700'}`}>
                              {t('suppliers.outstandingCredit')}
                            </span>
                            <span className="text-lg font-bold text-orange-500">
                              {formatCurrency(supplier.creditBalance)}
                            </span>
                          </div>
                        )}
                      </>
                    ) : (
                      /* Desktop Layout */
                      <>
                        <div className="flex items-start justify-between gap-3">
                          {/* Left: Avatar + Info */}
                          <div className="flex items-start gap-3 flex-1 min-w-0">
                            {/* Avatar */}
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                          supplier.paymentType === 'cash'
                            ? 'bg-green-500/20 text-green-500'
                            : 'bg-orange-500/20 text-orange-500'
                        }`}>
                          {supplier.paymentType === 'cash' ? <Banknote className="w-6 h-6" /> : <CreditCard className="w-6 h-6" />}
                        </div>
                        
                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                              {supplier.name}
                            </h3>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${
                              supplier.paymentType === 'cash'
                                ? 'bg-green-500/10 text-green-500 border border-green-500/20'
                                : 'bg-orange-500/10 text-orange-500 border border-orange-500/20'
                            }`}>
                              {supplier.paymentType === 'cash' ? t('suppliers.cashTab') : t('suppliers.creditTab')}
                            </span>
                            {dueStatus && dueStatus.status !== 'ok' && (
                              <span className={`px-2 py-0.5 rounded-full text-xs font-medium flex items-center gap-1 ${
                                dueStatus.color === 'red' ? 'bg-red-500/10 text-red-500 border border-red-500/20' :
                                dueStatus.color === 'orange' ? 'bg-orange-500/10 text-orange-500 border border-orange-500/20' :
                                'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20'
                              }`}>
                                <AlertTriangle className="w-3 h-3" />
                                {dueStatus.status === 'overdue' ? t('suppliers.overdue', { days: dueStatus.days }) :
                                 dueStatus.status === 'today' ? t('suppliers.dueToday') :
                                 t('suppliers.dueIn', { days: dueStatus.days })}
                              </span>
                            )}
                          </div>
                          
                          {/* Contact Info - Desktop */}
                          <div className={`flex items-center gap-4 mt-1 text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                              <span className="flex items-center gap-1">
                                <User className="w-3.5 h-3.5" />
                                {supplier.contactPerson}
                              </span>
                              <a 
                                href={`tel:${supplier.phone}`}
                                className={`flex items-center gap-1 ${theme === 'dark' ? 'hover:text-blue-400' : 'hover:text-blue-600'} transition-colors`}
                                onClick={(e) => e.stopPropagation()}
                              >
                                <Phone className="w-3.5 h-3.5" />
                                {supplier.phone}
                              </a>
                              <a 
                                href={`mailto:${supplier.email}`}
                                className={`flex items-center gap-1 ${theme === 'dark' ? 'hover:text-blue-400' : 'hover:text-blue-600'} transition-colors`}
                                onClick={(e) => e.stopPropagation()}
                              >
                                <Mail className="w-3.5 h-3.5" />
                                {supplier.email}
                              </a>
                            </div>

                        </div>
                      </div>

                      {/* Right: Credit Amount + Actions */}
                      <div className="flex items-start gap-2 flex-shrink-0">
                        {supplier.paymentType === 'credit' && supplier.creditBalance && (
                          <div className={`text-right ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
                            <p className="text-xs text-slate-500">{t('suppliers.outstandingCredit')}</p>
                            <p className="text-lg font-bold text-orange-500">{formatCurrency(supplier.creditBalance)}</p>
                          </div>
                        )}
                        <button
                          onClick={() => handleEditSupplier(supplier)}
                          className={`p-2 rounded-lg transition-colors ${theme === 'dark' ? 'hover:bg-slate-700' : 'hover:bg-slate-100'}`}
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(supplier)}
                          className="p-2 rounded-lg text-red-500 hover:bg-red-500/10 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => toggleSupplierExpand(supplier.id)}
                          className={`p-2 rounded-lg transition-colors ${theme === 'dark' ? 'hover:bg-slate-700' : 'hover:bg-slate-100'}`}
                        >
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                      </>
                    )}
                  </div>

                  {/* Expanded Content - Delivery History */}
                  {isExpanded && (
                    <div className={`border-t ${theme === 'dark' ? 'border-slate-700/50' : 'border-slate-200'}`}>
                      <div className="p-4">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className={`font-semibold flex items-center gap-2 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                            <Package className="w-4 h-4" />
                            {t('suppliers.deliveryHistory')}
                          </h4>
                        </div>

                        {supplier.deliveries && supplier.deliveries.length > 0 ? (
                          isMobile ? (
                            /* Mobile Card Layout */
                            <div className="space-y-3">
                              {supplier.deliveries.map(delivery => (
                                <div key={delivery.id} className={`p-3 rounded-lg border ${theme === 'dark' ? 'bg-slate-800/50 border-slate-700/50' : 'bg-slate-50 border-slate-200'}`}>
                                  <div className="flex items-start justify-between mb-2">
                                    <div className="flex-1">
                                      <p className={`font-medium text-sm ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                                        {delivery.productName}
                                      </p>
                                      <div className={`flex items-center gap-1 mt-1 text-xs ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                                        <Calendar className="w-3 h-3" />
                                        {new Date(delivery.deliveryDate).toLocaleDateString()}
                                      </div>
                                    </div>
                                    <div className="text-right">
                                      <p className="text-lg font-bold text-green-500">{formatCurrency(delivery.totalAmount)}</p>
                                      <p className={`text-xs ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>
                                        {t('suppliers.totalAmount')}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="grid grid-cols-2 gap-2 text-xs">
                                    <div>
                                      <p className={theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}>{t('suppliers.quantity')}</p>
                                      <p className={`font-medium ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>{delivery.quantity}</p>
                                    </div>
                                    <div>
                                      <p className={theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}>{t('suppliers.unitPrice')}</p>
                                      <p className={`font-medium ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>{formatCurrency(delivery.unitPrice)}</p>
                                    </div>
                                  </div>
                                  {delivery.invoiceNumber && (
                                    <div className={`mt-2 pt-2 border-t ${theme === 'dark' ? 'border-slate-700' : 'border-slate-200'}`}>
                                      <div className="flex items-center gap-1 text-xs">
                                        <FileText className="w-3 h-3 text-slate-400" />
                                        <span className={theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}>{delivery.invoiceNumber}</span>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          ) : (
                            /* Desktop Table Layout */
                            <div className="overflow-x-auto">
                              <table className="w-full">
                                <thead>
                                  <tr className={theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}>
                                    <th className="text-left text-xs font-medium py-2 px-3">{t('suppliers.deliveryDate')}</th>
                                    <th className="text-left text-xs font-medium py-2 px-3">{t('suppliers.productDelivered')}</th>
                                    <th className="text-right text-xs font-medium py-2 px-3">{t('suppliers.quantity')}</th>
                                    <th className="text-right text-xs font-medium py-2 px-3">{t('suppliers.unitPrice')}</th>
                                    <th className="text-right text-xs font-medium py-2 px-3">{t('suppliers.totalAmount')}</th>
                                    <th className="text-left text-xs font-medium py-2 px-3">{t('suppliers.invoiceNumber')}</th>
                                  </tr>
                                </thead>
                                <tbody className={`divide-y ${theme === 'dark' ? 'divide-slate-700/50' : 'divide-slate-100'}`}>
                                  {supplier.deliveries.map(delivery => (
                                    <tr key={delivery.id} className={theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}>
                                      <td className="py-2 px-3 text-sm">
                                        <span className="flex items-center gap-1">
                                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                          {new Date(delivery.deliveryDate).toLocaleDateString()}
                                        </span>
                                      </td>
                                      <td className="py-2 px-3 text-sm font-medium">{delivery.productName}</td>
                                      <td className="py-2 px-3 text-sm text-right">{delivery.quantity}</td>
                                      <td className="py-2 px-3 text-sm text-right">{formatCurrency(delivery.unitPrice)}</td>
                                      <td className="py-2 px-3 text-sm text-right font-medium text-green-500">{formatCurrency(delivery.totalAmount)}</td>
                                      <td className="py-2 px-3 text-sm">
                                        {delivery.invoiceNumber && (
                                          <span className="flex items-center gap-1">
                                            <FileText className="w-3.5 h-3.5 text-slate-400" />
                                            {delivery.invoiceNumber}
                                          </span>
                                        )}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )
                        ) : (
                          <div className={`text-center py-8 ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>
                            <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
                            <p>{t('suppliers.noDeliveries')}</p>
                          </div>
                        )}

                        {/* Credit Details for Credit Suppliers */}
                        {supplier.paymentType === 'credit' && (
                          <div className={`mt-4 p-${isMobile ? '3' : '4'} rounded-lg ${theme === 'dark' ? 'bg-slate-900/50' : 'bg-slate-50'}`}>
                            <div className={`grid ${isMobile ? 'grid-cols-2 gap-3' : 'grid-cols-2 md:grid-cols-4 gap-4'}`}>
                              <div>
                                <p className={`text-xs ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>{t('suppliers.creditLimit')}</p>
                                <p className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                                  {supplier.creditLimit ? formatCurrency(supplier.creditLimit) : '-'}
                                </p>
                              </div>
                              <div>
                                <p className={`text-xs ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>{t('suppliers.creditBalance')}</p>
                                <p className="font-semibold text-orange-500">
                                  {supplier.creditBalance ? formatCurrency(supplier.creditBalance) : formatCurrency(0)}
                                </p>
                              </div>
                              <div>
                                <p className={`text-xs ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>{t('suppliers.creditDueDate')}</p>
                                <p className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                                  {supplier.creditDueDate ? new Date(supplier.creditDueDate).toLocaleDateString() : '-'}
                                </p>
                              </div>
                              <div>
                                <p className={`text-xs ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>{t('suppliers.lastPaymentDate')}</p>
                                <p className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                                  {supplier.lastPaymentDate ? new Date(supplier.lastPaymentDate).toLocaleDateString() : '-'}
                                </p>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Products from this Supplier */}
                        {(() => {
                          const supplierProducts = mockProducts.filter(p => p.supplierId === supplier.id);
                          return (
                            <div className={`mt-4 pt-4 border-t ${theme === 'dark' ? 'border-slate-700/50' : 'border-slate-200'}`}>
                              <h4 className={`font-semibold flex items-center gap-2 mb-3 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                                <Package className="w-4 h-4" />
                                {t('suppliers.productsFromSupplier')} ({supplierProducts.length})
                              </h4>
                              {supplierProducts.length > 0 ? (
                                <div className={`grid gap-3 ${isMobile ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'}`}>
                                  {supplierProducts.map(product => (
                                    <div
                                      key={product.id}
                                      className={`p-3 rounded-lg border ${theme === 'dark' ? 'bg-slate-800/50 border-slate-700/50' : 'bg-white border-slate-200'}`}
                                    >
                                      <div className="flex items-center justify-between">
                                        <div>
                                          <p className={`font-medium text-sm ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                                            {product.name}
                                          </p>
                                          {product.nameAlt && (
                                            <p className={`text-xs ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>
                                              {product.nameAlt}
                                            </p>
                                          )}
                                          <p className={`text-xs mt-1 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                                            SKU: {product.sku}
                                          </p>
                                        </div>
                                        <div className="text-right">
                                          <p className="text-sm font-bold text-green-500">
                                            {formatCurrency(product.retailPrice || product.price || 0)}
                                          </p>
                                          <p className={`text-xs ${
                                            product.stock <= (product.minStock || 10) 
                                              ? product.stock === 0 ? 'text-red-500' : 'text-yellow-500' 
                                              : theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
                                          }`}>
                                            {t('products.stockLabel')}: {product.stock}
                                          </p>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className={`text-center py-4 ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>
                                  <Package className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                  <p className="text-sm">{t('suppliers.noProductsLinked')}</p>
                                </div>
                              )}
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className={`text-center py-16 rounded-xl border ${theme === 'dark' ? 'bg-slate-800/30 border-slate-700/50' : 'bg-white border-slate-200'}`}>
              <Truck className={`w-16 h-16 mx-auto mb-4 ${theme === 'dark' ? 'text-slate-600' : 'text-slate-300'}`} />
              <h3 className={`text-lg font-semibold mb-2 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                {t('suppliers.noSuppliersFound')}
              </h3>
              <p className={`text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                {t('suppliers.adjustFilters')}
              </p>
            </div>
          )}
        </div>

        {/* Modals */}
        <SupplierFormModal
          isOpen={isFormModalOpen}
          supplier={selectedSupplier}
          onClose={() => setIsFormModalOpen(false)}
          onSave={handleSaveSupplier}
        />

        <DeleteConfirmationModal
          isOpen={isDeleteModalOpen}
          title={t('suppliers.deleteSupplier')}
          message={t('suppliers.deleteConfirm')}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setIsDeleteModalOpen(false)}
        />

        {/* Mobile Action Sheet - Bottom Drawer */}
        {isMobile && mobileActionSupplier && (
          <>
            {/* Backdrop */}
            <div 
              className="fixed inset-0 bg-black/50 z-50 animate-in fade-in duration-200"
            />
            {/* Action Sheet */}
            <div className={`fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl border-t animate-in slide-in-from-bottom duration-300 ${
              theme === 'dark' ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'
            }`}>
              <div className="p-4">
                {/* Handle Bar */}
                <div className="w-12 h-1 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto mb-6" />
                
                {/* Supplier Info */}
                <div className="mb-4 pb-4 border-b dark:border-slate-700">
                  <h3 className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                    {mobileActionSupplier.name}
                  </h3>
                  <p className={`text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                    {mobileActionSupplier.contactPerson}
                  </p>
                </div>

                {/* Actions */}
                <div className="space-y-2">
                  <button
                    onClick={() => {
                      handleEditSupplier(mobileActionSupplier);
                      setMobileActionSupplier(null);
                    }}
                    className={`w-full flex items-center gap-3 p-4 rounded-xl transition-colors ${
                      theme === 'dark' 
                        ? 'bg-slate-800/50 hover:bg-slate-800 active:bg-slate-700' 
                        : 'bg-slate-50 hover:bg-slate-100 active:bg-slate-200'
                    }`}
                  >
                    <Edit2 className={`w-5 h-5 ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`} />
                    <span className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                      {t('suppliers.editSupplier')}
                    </span>
                  </button>

                  <button
                    onClick={() => {
                      handleDeleteClick(mobileActionSupplier);
                      setMobileActionSupplier(null);
                    }}
                    className="w-full flex items-center gap-3 p-4 rounded-xl transition-colors bg-red-500/10 hover:bg-red-500/20 active:bg-red-500/30"
                  >
                    <Trash2 className="w-5 h-5 text-red-500" />
                    <span className="font-medium text-red-500">
                      {t('suppliers.deleteSupplier')}
                    </span>
                  </button>

                  <button
                    onClick={() => setMobileActionSupplier(null)}
                    className={`w-full p-4 rounded-xl font-medium transition-colors ${
                      theme === 'dark'
                        ? 'bg-slate-800/50 text-slate-300 hover:bg-slate-800 active:bg-slate-700'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200 active:bg-slate-300'
                    }`}
                  >
                    {t('common.cancel')}
                  </button>
                </div>

                {/* Safe area spacing for mobile */}
                <div className="h-safe-area-inset-bottom" />
              </div>
            </div>
          </>
        )}
      </div>
  );
}
