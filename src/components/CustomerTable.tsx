import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useTranslation } from 'react-i18next';
import {
  Search, Users, Filter, RefreshCw, SortAsc, SortDesc,
  Edit3, Trash2, ChevronLeft, ChevronRight,
  ChevronsLeft, ChevronsRight, X, CreditCard, Crown, ShoppingBag,
  AlertTriangle, Mail, Phone, MapPin, Eye,
} from 'lucide-react';
import { toast } from 'react-toastify';
import api from '../lib/api';
import { Customer, CustomerType } from '../types';

const ROWS_PER_PAGE_OPTIONS = [10, 25, 50, 100];

const customerTypeConfig: Record<CustomerType, { labelKey: string; icon: React.ReactNode; className: string }> = {
  regular: {
    labelKey: 'customers.regular',
    icon: <ShoppingBag className="w-3 h-3" />,
    className: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  },
  wholesale: {
    labelKey: 'customers.wholesale',
    icon: <Crown className="w-3 h-3" />,
    className: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  },
  credit: {
    labelKey: 'customers.credit',
    icon: <CreditCard className="w-3 h-3" />,
    className: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  },
};

const formatCurrency = (val: number) => `Rs. ${val.toLocaleString()}`;

interface CustomerTableProps {
  customers: Customer[];
  loading: boolean;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onEdit: (customer: Customer) => void;
  onDelete: (customer: Customer) => void;
  onRefresh: () => void;
  hasFilters: boolean;
  onClearFilters: () => void;
  currentPage: number;
  totalPages: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  pageSize: number;
  onPageSizeChange: (size: number) => void;
}

export const CustomerTable: React.FC<CustomerTableProps> = ({
  customers,
  loading,
  searchQuery,
  onSearchChange,
  onEdit,
  onDelete,
  onRefresh,
  hasFilters,
  onClearFilters,
  currentPage,
  totalPages,
  totalItems,
  onPageChange,
  pageSize,
  onPageSizeChange,
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const { t, i18n } = useTranslation();

  const isLoanOverdue = (customer: Customer) => {
    return customer.loanBalance > 0;
  };

  const startItem = totalItems > 0 ? (currentPage - 1) * pageSize + 1 : 0;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  return (
    <div className="space-y-4">
      {/* ── SEARCH TOOLBAR ── */}
      <div className={`p-4 rounded-lg border ${isDark ? 'bg-slate-800/50 border-slate-700/50' : 'bg-white border-slate-200 shadow-sm'}`}>
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-xl">
            <Search className={`absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`} />
            <input
              type="text"
              placeholder={t('customers.searchPlaceholder') || 'Search customers...'}
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className={`w-full pl-8 pr-9 py-2 text-xs border rounded-lg focus:outline-none focus:ring-1 focus:ring-orange-500/50 focus:border-orange-500/50 transition-all ${isDark ? 'bg-slate-900/50 border-slate-700 text-white placeholder:text-slate-500' : 'bg-slate-50 border-slate-200'}`}
            />
            {searchQuery.length > 0 && (
              <button
                onClick={() => onSearchChange('')}
                className={`absolute right-1.5 top-1/2 -translate-y-1/2 p-0.5 rounded transition-colors ${isDark ? 'text-slate-400 hover:text-white hover:bg-slate-700' : 'text-slate-400 hover:text-slate-700 hover:bg-slate-200'}`}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={onRefresh}
              className={`p-1.5 rounded-lg transition-colors ${isDark ? 'text-slate-400 hover:text-white hover:bg-slate-700' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'}`}
              title="Refresh"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
            {hasFilters && (
              <button
                onClick={onClearFilters}
                className={`p-1.5 rounded-lg transition-colors ${isDark ? 'text-slate-400 hover:text-white hover:bg-slate-700' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'}`}
                title="Clear filters"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
            <span className={`text-[10px] font-medium whitespace-nowrap ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              {totalItems} customers
            </span>
          </div>
        </div>
      </div>

      {/* ── MAIN TABLE ── */}
      <div className={`rounded-lg border overflow-hidden ${isDark ? 'bg-slate-900/95 border-slate-700/50' : 'bg-white border-slate-200 shadow-sm'}`}>
        {loading ? (
          <div className={`flex items-center justify-center py-12 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs">Loading customers...</p>
            </div>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1000px]">
                <thead className={isDark ? 'bg-slate-800/80' : 'bg-slate-50'}>
                  <tr>
                    <th className={`px-3 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-left ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      <div className="flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-orange-400" />
                        NAME
                      </div>
                    </th>
                    <th className={`px-3 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-left ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      <div className="flex items-center gap-1.5">
                        <Mail className="w-3 h-3 text-blue-400" />
                        NIC / EMAIL
                      </div>
                    </th>
                    <th className={`px-3 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-left ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      <div className="flex items-center gap-1.5">
                        <Phone className="w-3 h-3 text-emerald-400" />
                        PHONE / ADDRESS
                      </div>
                    </th>
                    <th className={`px-3 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-right ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      <div className="flex items-center justify-end gap-1.5">
                        <CreditCard className="w-3 h-3 text-purple-400" />
                        DUE BALANCE
                      </div>
                    </th>
                    <th className={`px-3 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-center ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      ACTIONS
                    </th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${isDark ? 'divide-slate-700/40' : 'divide-slate-200'}`}>
                  {customers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className={`py-12 text-center ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        <div className="flex flex-col items-center gap-2">
                          <Users className="w-10 h-10 opacity-30" />
                          <p className="text-sm font-medium">{t('customers.noCustomers')}</p>
                          <p className="text-xs">{t('common.tryDifferentFilters')}</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    customers.map((customer) => {
                      const typeCfg = customerTypeConfig[customer.customerType];
                      const overdue = isLoanOverdue(customer);
                      const displayName = (i18n.language === 'si' && customer.nameSi) ? customer.nameSi : customer.name;
                      const avatarInitial = displayName ? displayName.charAt(0).toUpperCase() : '';

                      return (
                        <tr
                          key={customer.id}
                          className={`transition-colors ${isDark ? 'hover:bg-slate-700/25' : 'hover:bg-slate-50'}`}
                        >
                          {/* NAME + customerType badge */}
                          <td className="px-3 py-2.5">
                            <div className="flex items-center gap-2.5">
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                                isDark ? 'bg-gradient-to-br from-orange-500/20 to-rose-500/20 text-orange-400' : 'bg-gradient-to-br from-orange-100 to-rose-100 text-orange-600'
                              }`}>
                                {avatarInitial}
                              </div>
                              <div className="min-w-0">
                                <div className={`text-[11px] font-semibold leading-tight truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                  {displayName}
                                </div>
                                <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-medium border mt-0.5 ${typeCfg.className}`}>
                                  {typeCfg.icon}
                                  {t(typeCfg.labelKey)}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* NIC / EMAIL */}
                          <td className="px-3 py-2.5">
                            <div className="flex flex-col gap-0.5">
                              <span className={`text-[10px] font-mono ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                                {customer.nic || '—'}
                              </span>
                              <span className={`text-[10px] truncate max-w-[180px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                {customer.email || '—'}
                              </span>
                            </div>
                          </td>

                          {/* PHONE / ADDRESS */}
                          <td className="px-3 py-2.5">
                            <div className="flex flex-col gap-0.5">
                              <span className={`text-[11px] font-mono font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                {customer.phone}
                              </span>
                              <span className={`text-[10px] truncate max-w-[200px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                <MapPin className="w-2.5 h-2.5 inline mr-0.5" />
                                {customer.address || '—'}
                              </span>
                            </div>
                          </td>

                          {/* DUE BALANCE */}
                          <td className="px-3 py-2.5 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <span className={`inline-flex items-center px-2 py-1 rounded-lg text-[11px] font-bold font-mono ${
                                overdue
                                  ? 'bg-red-500/15 text-red-400 border border-red-500/20'
                                  : customer.loanBalance > 0
                                    ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                                    : isDark ? 'bg-slate-800 text-slate-400 border border-slate-700/50' : 'bg-slate-100 text-slate-500 border border-slate-200'
                              }`}>
                                {formatCurrency(customer.loanBalance)}
                              </span>
                              {overdue && (
                                <span className="flex items-center gap-0.5 px-1 py-0.5 bg-red-500 text-white text-[9px] font-bold rounded animate-pulse">
                                  <AlertTriangle className="w-2.5 h-2.5" />
                                </span>
                              )}
                            </div>
                          </td>

                          {/* ACTIONS */}
                          <td className="px-3 py-2.5 text-center">
                            <div className="flex items-center justify-center gap-0.5">
                              <button
                                onClick={() => onEdit(customer)}
                                className={`p-1.5 rounded-lg transition-all hover:scale-110 active:scale-90 ${isDark ? 'text-slate-400 hover:text-orange-400 hover:bg-orange-500/15' : 'text-slate-500 hover:text-orange-600 hover:bg-orange-50'}`}
                                title="Edit customer"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => onDelete(customer)}
                                className={`p-1.5 rounded-lg transition-all hover:scale-110 active:scale-90 ${isDark ? 'text-slate-400 hover:text-rose-500 hover:bg-rose-500/15' : 'text-slate-500 hover:text-rose-600 hover:bg-rose-50'}`}
                                title="Delete customer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* ── PAGINATION ── */}
            {totalPages > 0 && (
              <div className={`flex items-center justify-between px-4 py-2.5 border-t ${isDark ? 'border-slate-700/40' : 'border-slate-200'}`}>
                <div className="flex items-center gap-3">
                  <span className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    Showing {startItem}-{endItem} of {totalItems}
                  </span>
                  <div className={`flex items-center gap-1.5 text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    <span>Rows:</span>
                    <select
                      value={pageSize}
                      onChange={(e) => onPageSizeChange(Number(e.target.value))}
                      className={`px-1.5 py-0.5 text-[10px] border rounded transition-colors focus:outline-none focus:ring-1 focus:ring-orange-500/50 ${
                        isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'
                      }`}
                    >
                      {ROWS_PER_PAGE_OPTIONS.map((n) => (<option key={n} value={n}>{n}</option>))}
                    </select>
                  </div>
                </div>
                <div className="flex items-center gap-0.5">
                  <button
                    onClick={() => onPageChange(1)}
                    disabled={currentPage === 1}
                    className={`p-1.5 rounded transition-colors disabled:opacity-30 ${isDark ? 'text-slate-400 hover:text-white hover:bg-slate-700' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'}`}
                    title="First page"
                  >
                    <ChevronsLeft className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className={`p-1.5 rounded transition-colors disabled:opacity-30 ${isDark ? 'text-slate-400 hover:text-white hover:bg-slate-700' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'}`}
                    title="Previous page"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const start = Math.max(1, Math.min(currentPage - 2, totalPages - 4));
                    const page = start + i;
                    if (page > totalPages) return null;
                    return (
                      <button
                        key={page}
                        onClick={() => onPageChange(page)}
                        className={`w-7 h-7 text-[10px] font-semibold rounded transition-all ${
                          page === currentPage
                            ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                            : isDark ? 'text-slate-300 hover:bg-slate-700' : 'text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        {page}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className={`p-1.5 rounded transition-colors disabled:opacity-30 ${isDark ? 'text-slate-400 hover:text-white hover:bg-slate-700' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'}`}
                    title="Next page"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onPageChange(totalPages)}
                    disabled={currentPage === totalPages}
                    className={`p-1.5 rounded transition-colors disabled:opacity-30 ${isDark ? 'text-slate-400 hover:text-white hover:bg-slate-700' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'}`}
                    title="Last page"
                  >
                    <ChevronsRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};