import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useTranslation } from 'react-i18next';
import { useIsMobile } from '../hooks/use-mobile';
import { 
  TrendingUp, TrendingDown, DollarSign, Calendar, Download, 
  FileText, ArrowUpRight, ArrowDownRight,
  Filter, Eye, X, Info, MapPin, Clock, CreditCard as CardIcon, Banknote,
  Building2, Wallet, ChevronDown, Search, Package, Paintbrush, Wrench, Zap,
  Droplets, ShieldCheck, Users, Truck, Receipt, Megaphone, FileCheck, CalendarDays,
  SortAsc, SortDesc, Grid, List, RefreshCw
} from 'lucide-react';
import { SearchableSelect, SearchableSelectOption } from '../components/ui/searchable-select';
import { DataTable, DataTableColumn } from '../components/ui/data-table';
import { 
  mockFinancialTransactions, 
  calculateFinancialSummary,
  expenseCategories,
  revenueCategories,
  FinancialTransaction 
} from '../data/mockData';

type TimePeriod = 'daily' | 'weekly' | 'monthly' | 'yearly';

export const FinancialReports: React.FC = () => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const printRef = useRef<HTMLDivElement>(null);
  
  const [period, setPeriod] = useState<TimePeriod>('monthly');
  const [selectedMonth, setSelectedMonth] = useState(11); // December (0-indexed)
  const [selectedYear, setSelectedYear] = useState(2024);
  const [selectedTransaction, setSelectedTransaction] = useState<FinancialTransaction | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(12);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'revenue' | 'expense'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showFilters, setShowFilters] = useState(false);

  // Calculate date ranges based on period
  const dateRange = useMemo(() => {
    const now = new Date(selectedYear, selectedMonth, 16); // Dec 16, 2024
    let start: Date, end: Date;

    switch (period) {
      case 'daily':
        start = new Date(now);
        start.setHours(0, 0, 0, 0);
        end = new Date(now);
        end.setHours(23, 59, 59, 999);
        break;
      case 'weekly':
        start = new Date(now);
        start.setDate(now.getDate() - 6);
        start.setHours(0, 0, 0, 0);
        end = new Date(now);
        end.setHours(23, 59, 59, 999);
        break;
      case 'monthly':
        start = new Date(selectedYear, selectedMonth, 1);
        end = new Date(selectedYear, selectedMonth + 1, 0);
        break;
      case 'yearly':
        start = new Date(selectedYear, 0, 1);
        end = new Date(selectedYear, 11, 31);
        break;
    }

    return { start, end };
  }, [period, selectedMonth, selectedYear]);

  // Filter transactions for current period and filters
  const filteredTransactions = useMemo(() => {
    const filtered = mockFinancialTransactions.filter(t => {
      const tDate = new Date(t.date);
      const matchesDate = tDate >= dateRange.start && tDate <= dateRange.end;
      const matchesSearch = searchQuery === '' || 
        t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.category.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = typeFilter === 'all' || t.type === typeFilter;
      const matchesCategory = categoryFilter === 'all' || t.category === categoryFilter;
      
      return matchesDate && matchesSearch && matchesType && matchesCategory;
    });

    // Apply sorting by date
    return filtered.sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
    });
  }, [dateRange, searchQuery, typeFilter, categoryFilter, sortOrder]);

  // Check if any filters are active
  const hasActiveFilters = searchQuery !== '' || typeFilter !== 'all' || categoryFilter !== 'all';

  // Clear all filters
  const clearFilters = () => {
    setSearchQuery('');
    setTypeFilter('all');
    setCategoryFilter('all');
  };

  // Calculate summary from filtered transactions
  const summary = useMemo(() => {
    const revenue = filteredTransactions
      .filter(t => t.type === 'revenue')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const expenses = filteredTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const profit = revenue - expenses;
    const profitMargin = revenue > 0 ? (profit / revenue) * 100 : 0;
    
    return { revenue, expenses, profit, profitMargin };
  }, [filteredTransactions]);

  // Get unique categories
  const allCategories = useMemo(() => {
    const cats = new Set(mockFinancialTransactions.map(t => t.category));
    return Array.from(cats);
  }, []);

  // Category options with icons for SearchableSelect
  const getCategoryIcon = (category: string) => {
    const iconMap: Record<string, React.ReactNode> = {
      'Paint Sales': <Paintbrush className="w-4 h-4 text-orange-500" />,
      'Cement Sales': <Package className="w-4 h-4 text-slate-500" />,
      'Tools': <Wrench className="w-4 h-4 text-blue-500" />,
      'Electrical': <Zap className="w-4 h-4 text-yellow-500" />,
      'Plumbing': <Droplets className="w-4 h-4 text-cyan-500" />,
      'Hardware': <Wrench className="w-4 h-4 text-purple-500" />,
      'Safety Equipment': <ShieldCheck className="w-4 h-4 text-green-500" />,
      'Inventory Purchase': <Package className="w-4 h-4 text-indigo-500" />,
      'Salaries': <Users className="w-4 h-4 text-pink-500" />,
      'Utilities': <Zap className="w-4 h-4 text-amber-500" />,
      'Transportation': <Truck className="w-4 h-4 text-teal-500" />,
      'Maintenance': <Wrench className="w-4 h-4 text-red-500" />,
      'Marketing': <Megaphone className="w-4 h-4 text-violet-500" />,
      'Insurance': <ShieldCheck className="w-4 h-4 text-emerald-500" />,
      'Professional Fees': <FileCheck className="w-4 h-4 text-sky-500" />,
    };
    return iconMap[category] || <Receipt className="w-4 h-4 text-slate-400" />;
  };

  const categoryOptions: SearchableSelectOption[] = useMemo(() => {
    // Count transactions per category
    const categoryCounts = mockFinancialTransactions.reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const options: SearchableSelectOption[] = [
      { value: 'all', label: 'All Categories', icon: <Filter className="w-4 h-4 text-slate-400" /> }
    ];

    allCategories.forEach(cat => {
      options.push({
        value: cat,
        label: cat,
        icon: getCategoryIcon(cat),
        count: categoryCounts[cat]
      });
    });

    return options;
  }, [allCategories]);

  // Type filter options for SearchableSelect
  const typeOptions: SearchableSelectOption[] = useMemo(() => {
    const revenueCount = mockFinancialTransactions.filter(t => t.type === 'revenue').length;
    const expenseCount = mockFinancialTransactions.filter(t => t.type === 'expense').length;
    return [
      { value: 'all', label: t('financial.allTypes'), icon: <Filter className="w-4 h-4 text-slate-400" />, count: mockFinancialTransactions.length },
      { value: 'revenue', label: t('financial.revenueType'), icon: <TrendingUp className="w-4 h-4 text-emerald-500" />, count: revenueCount },
      { value: 'expense', label: t('financial.expenseType'), icon: <TrendingDown className="w-4 h-4 text-red-500" />, count: expenseCount },
    ];
  }, [t]);

  // Month options for SearchableSelect
  const monthOptions: SearchableSelectOption[] = useMemo(() => {
    const months = [
      'january', 'february', 'march', 'april', 'may', 'june',
      'july', 'august', 'september', 'october', 'november', 'december'
    ];

    return Array.from({ length: 12 }, (_, i) => ({
      value: i.toString(),
      label: t(`financial.${months[i]}`),
      icon: <CalendarDays className="w-4 h-4 text-blue-500" />
    }));
  }, [t]);

  // Year options for SearchableSelect
  const yearOptions: SearchableSelectOption[] = useMemo(() => {
    return [2022, 2023, 2024, 2025].map(year => ({
      value: year.toString(),
      label: year.toString(),
      icon: <Calendar className="w-4 h-4 text-purple-500" />
    }));
  }, []);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, typeFilter, categoryFilter, period, selectedMonth, selectedYear]);

  // Creative PDF Export - All Records
  const handleExportPDF = () => {
    const periodLabel = periodLabels[period];
    const months = [
      'january', 'february', 'march', 'april', 'may', 'june',
      'july', 'august', 'september', 'october', 'november', 'december'
    ];
    const monthName = t(`financial.${months[selectedMonth]}`) + ` ${selectedYear}`;
    const reportTitle = period === 'yearly' 
      ? `${t('financial.annualReport')} - ${selectedYear}`
      : period === 'monthly'
      ? `${monthName} ${t('financial.report')}`
      : `${periodLabel} ${t('financial.report')}`;

    // Generate transaction rows HTML
    const transactionRows = filteredTransactions.map((t, index) => `
      <tr class="${index % 2 === 0 ? 'row-even' : 'row-odd'}">
        <td class="cell-index">${index + 1}</td>
        <td class="cell-date">${new Date(t.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
        <td class="cell-type">
          <span class="type-badge ${t.type === 'revenue' ? 'revenue-badge' : 'expense-badge'}">
            ${t.type === 'revenue' ? '↑ Revenue' : '↓ Expense'}
          </span>
        </td>
        <td class="cell-category">${t.category}</td>
        <td class="cell-description">${t.description}</td>
        <td class="cell-payment">${t.paymentMethod ? t.paymentMethod.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'N/A'}</td>
        <td class="cell-amount ${t.type === 'revenue' ? 'amount-revenue' : 'amount-expense'}">
          ${t.type === 'revenue' ? '+' : '-'}Rs. ${t.amount.toLocaleString()}
        </td>
      </tr>
    `).join('');

    // Calculate category breakdown
    const categoryBreakdown = filteredTransactions.reduce((acc, t) => {
      if (!acc[t.category]) {
        acc[t.category] = { revenue: 0, expense: 0, count: 0 };
      }
      if (t.type === 'revenue') {
        acc[t.category].revenue += t.amount;
      } else {
        acc[t.category].expense += t.amount;
      }
      acc[t.category].count++;
      return acc;
    }, {} as Record<string, { revenue: number; expense: number; count: number }>);

    const categoryRows = Object.entries(categoryBreakdown)
      .sort((a, b) => (b[1].revenue + b[1].expense) - (a[1].revenue + a[1].expense))
      .slice(0, 8)
      .map(([cat, data], index) => `
        <tr class="${index % 2 === 0 ? 'row-even' : 'row-odd'}">
          <td>${cat}</td>
          <td class="amount-revenue">Rs. ${data.revenue.toLocaleString()}</td>
          <td class="amount-expense">Rs. ${data.expense.toLocaleString()}</td>
          <td style="text-align: center; font-weight: 600;">${data.count}</td>
        </tr>
      `).join('');

    const printWindow = window.open('', '', 'width=1200,height=800');
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>${reportTitle}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
            
            * { margin: 0; padding: 0; box-sizing: border-box; }
            
            body { 
              font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; 
              background: #f8fafc;
              min-height: 100vh;
              padding: 40px;
              color: #1e293b;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            
            .container {
              max-width: 1000px;
              margin: 0 auto;
              background: white;
              border-radius: 16px;
              box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
              overflow: hidden;
            }
            
            /* Header */
            .header {
              padding: 32px 40px;
              border-bottom: 1px solid #e5e7eb;
            }
            
            .logo-section {
              display: flex;
              align-items: center;
              gap: 14px;
              margin-bottom: 28px;
            }
            
            .logo {
              width: 52px;
              height: 52px;
              background: linear-gradient(135deg, #f3e8ff 0%, #e9d5ff 100%);
              border-radius: 14px;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 26px;
            }
            
            .company-info {
              display: flex;
              flex-direction: column;
            }
            
            .company-name {
              font-size: 24px;
              font-weight: 700;
              color: #1e293b;
              letter-spacing: -0.3px;
            }
            
            .company-tagline {
              font-size: 14px;
              color: #94a3b8;
              font-weight: 500;
            }
            
            .report-title {
              font-size: 32px;
              font-weight: 700;
              color: #64748b;
              margin-bottom: 12px;
              letter-spacing: -0.5px;
            }
            
            .report-meta {
              display: flex;
              align-items: center;
              gap: 24px;
              color: #94a3b8;
              font-size: 14px;
              font-weight: 500;
            }
            
            .report-meta span {
              display: flex;
              align-items: center;
              gap: 6px;
            }
            
            /* Metrics Grid */
            .metrics-section {
              padding: 32px 40px;
              border-bottom: 1px solid #e5e7eb;
            }
            
            .metrics-grid {
              display: grid;
              grid-template-columns: repeat(4, 1fr);
              gap: 16px;
            }
            
            .metric-card {
              padding: 20px 24px;
              border-radius: 12px;
              border: 1px solid #e5e7eb;
              background: white;
            }
            
            .metric-icon {
              font-size: 28px;
              margin-bottom: 16px;
              line-height: 1;
            }
            
            .metric-label {
              font-size: 11px;
              font-weight: 700;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              color: #94a3b8;
              margin-bottom: 8px;
            }
            
            .metric-value {
              font-size: 26px;
              font-weight: 700;
              letter-spacing: -0.5px;
            }
            
            .metric-value.revenue-text { color: #10b981; }
            .metric-value.expense-text { color: #ef4444; }
            .metric-value.profit-text { color: #10b981; }
            .metric-value.margin-text { color: #10b981; }
            
            /* Category Breakdown */
            .breakdown-section {
              padding: 32px 40px;
              border-bottom: 1px solid #e5e7eb;
            }
            
            .section-title {
              font-size: 16px;
              font-weight: 700;
              color: #1e293b;
              margin-bottom: 20px;
              display: flex;
              align-items: center;
              gap: 10px;
            }
            
            .section-icon {
              font-size: 18px;
            }
            
            /* Tables */
            .table-container {
              padding: 32px 40px;
            }
            
            .summary-table {
              width: 100%;
              border-collapse: collapse;
              font-size: 14px;
              border: 1px solid #e5e7eb;
              border-radius: 8px;
              overflow: hidden;
            }
            
            .summary-table thead {
              background: #f8fafc;
            }
            
            .summary-table th {
              padding: 14px 20px;
              text-align: left;
              font-weight: 700;
              font-size: 11px;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              color: #64748b;
              border-bottom: 1px solid #e5e7eb;
            }
            
            .summary-table td {
              padding: 14px 20px;
              border-bottom: 1px solid #f1f5f9;
            }
            
            table {
              width: 100%;
              border-collapse: collapse;
              font-size: 13px;
            }
            
            thead {
              background: #f8fafc;
            }
            
            th {
              padding: 14px 16px;
              text-align: left;
              font-weight: 700;
              font-size: 11px;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              color: #64748b;
              border-bottom: 1px solid #e5e7eb;
            }
            
            td {
              padding: 14px 16px;
              border-bottom: 1px solid #f1f5f9;
              vertical-align: middle;
            }
            
            .row-even { background: white; }
            .row-odd { background: #fafafa; }
            
            .cell-index {
              font-weight: 600;
              color: #94a3b8;
              width: 50px;
            }
            
            .cell-date {
              color: #64748b;
              font-weight: 500;
              white-space: nowrap;
            }
            
            .cell-category {
              font-weight: 600;
              color: #1e293b;
            }
            
            .cell-description {
              color: #64748b;
              max-width: 200px;
            }
            
            .cell-payment {
              color: #64748b;
              font-size: 12px;
            }
            
            .type-badge {
              display: inline-block;
              padding: 5px 12px;
              border-radius: 20px;
              font-size: 11px;
              font-weight: 700;
              white-space: nowrap;
            }
            
            .revenue-badge {
              background: #dcfce7;
              color: #15803d;
            }
            
            .expense-badge {
              background: #fee2e2;
              color: #dc2626;
            }
            
            .amount-revenue {
              color: #10b981;
              font-weight: 700;
              text-align: right;
            }
            
            .amount-expense {
              color: #ef4444;
              font-weight: 700;
              text-align: right;
            }
            
            .cell-amount {
              white-space: nowrap;
              text-align: right;
            }
            
            .table-header-bar {
              background: #f8fafc;
              padding: 16px 20px;
              border: 1px solid #e5e7eb;
              border-bottom: none;
              border-radius: 8px 8px 0 0;
              display: flex;
              justify-content: space-between;
              align-items: center;
            }
            
            .table-title {
              font-size: 16px;
              font-weight: 700;
              color: #1e293b;
            }
            
            .table-count {
              color: #64748b;
              font-size: 14px;
              font-weight: 500;
            }
            
            .transactions-table {
              border: 1px solid #e5e7eb;
              border-top: none;
              border-radius: 0 0 8px 8px;
              overflow: hidden;
            }
            
            /* Footer */
            .footer {
              padding: 20px 40px;
              background: #f8fafc;
              border-top: 1px solid #e5e7eb;
              display: flex;
              justify-content: space-between;
              align-items: center;
            }
            
            .footer-left {
              font-size: 12px;
              color: #94a3b8;
            }
            
            .footer-right {
              font-size: 12px;
              color: #64748b;
              font-weight: 500;
            }
            
            /* Print Styles */
            @media print {
              body { 
                background: white; 
                padding: 20px;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              .container {
                box-shadow: none;
                border-radius: 0;
              }
              .metric-value.revenue-text { color: #10b981 !important; }
              .metric-value.expense-text { color: #ef4444 !important; }
              .metric-value.profit-text { color: #10b981 !important; }
              .metric-value.margin-text { color: #10b981 !important; }
              .amount-revenue { color: #10b981 !important; }
              .amount-expense { color: #ef4444 !important; }
              .revenue-badge { background: #dcfce7 !important; color: #15803d !important; }
              .expense-badge { background: #fee2e2 !important; color: #dc2626 !important; }
              @page {
                margin: 0.5cm;
                size: A4;
              }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <!-- Header -->
            <div class="header">
              <div class="logo-section">
                <div class="logo">🔧</div>
                <div class="company-info">
                  <div class="company-name">Liyanage Hardware</div>
                  <div class="company-tagline">Hardware & Construction Materials</div>
                </div>
              </div>
              <div class="report-title">${reportTitle}</div>
              <div class="report-meta">
                <span>📅 ${dateRange.start.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} - ${dateRange.end.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                <span>${filteredTransactions.length} Transactions</span>
              </div>
            </div>
            
            <!-- Metrics -->
            <div class="metrics-section">
              <div class="metrics-grid">
                <div class="metric-card">
                  <div class="metric-icon">📈</div>
                  <div class="metric-label">Total Revenue</div>
                  <div class="metric-value revenue-text">Rs. ${summary.revenue.toLocaleString()}</div>
                </div>
                <div class="metric-card">
                  <div class="metric-icon">📉</div>
                  <div class="metric-label">Total Expenses</div>
                  <div class="metric-value expense-text">Rs. ${summary.expenses.toLocaleString()}</div>
                </div>
                <div class="metric-card">
                  <div class="metric-icon">💰</div>
                  <div class="metric-label">Net ${summary.profit >= 0 ? 'Profit' : 'Loss'}</div>
                  <div class="metric-value profit-text">Rs. ${Math.abs(summary.profit).toLocaleString()}</div>
                </div>
                <div class="metric-card">
                  <div class="metric-icon">📊</div>
                  <div class="metric-label">Profit Margin</div>
                  <div class="metric-value margin-text">${summary.profitMargin.toFixed(1)}%</div>
                </div>
              </div>
            </div>
            
            <!-- Category Breakdown -->
            <div class="breakdown-section">
              <div class="section-title">
                <span class="section-icon">📁</span>
                Category Breakdown (Top 8)
              </div>
              <table class="summary-table">
                <thead>
                  <tr>
                    <th>Category</th>
                    <th style="text-align: right;">Revenue</th>
                    <th style="text-align: right;">Expenses</th>
                    <th style="text-align: center;">Transactions</th>
                  </tr>
                </thead>
                <tbody>
                  ${categoryRows}
                </tbody>
              </table>
            </div>
            
            <!-- Transactions Table -->
            <div class="table-container">
              <div class="table-header-bar">
                <span class="table-title">📋 All Transactions</span>
                <span class="table-count">${filteredTransactions.length} records</span>
              </div>
              <table class="transactions-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Date</th>
                    <th>Type</th>
                    <th>Category</th>
                    <th>Description</th>
                    <th>Payment</th>
                    <th style="text-align: right;">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  ${transactionRows}
                </tbody>
              </table>
            </div>
            
            <!-- Footer -->
            <div class="footer">
              <div class="footer-left">
                Generated on ${new Date().toLocaleString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </div>
              <div class="footer-right">
                Liyanage Hardware Financial Management System
              </div>
            </div>
          </div>
        </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
      }, 500);
    }
  };

  const periodLabels = {
    daily: t('financial.daily'),
    weekly: t('financial.weekly'),
    monthly: t('financial.monthly'),
    yearly: t('financial.yearly')
  };

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'cash': return <Banknote className="w-4 h-4" />;
      case 'card': return <CardIcon className="w-4 h-4" />;
      case 'bank_transfer': return <Building2 className="w-4 h-4" />;
      case 'credit': return <Wallet className="w-4 h-4" />;
      default: return <Wallet className="w-4 h-4" />;
    }
  };

  const getPaymentMethodLabel = (method: string) => {
    switch (method) {
      case 'cash': return t('financial.cash');
      case 'card': return t('financial.card');
      case 'bank_transfer': return t('financial.bankTransfer');
      case 'credit': return t('financial.cheque');
      default: return method;
    }
  };

  return (
    <div className={`min-h-screen p-6 ${isMobile ? 'pb-24' : ''} ${theme === 'dark' ? 'bg-slate-900' : 'bg-slate-50'}`}>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
              {t('financial.title')}
            </h1>
            <p className={`text-sm mt-1 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
              {t('financial.subtitle')}
            </p>
          </div>
          <button
            onClick={handleExportPDF}
            className="no-print flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600 text-white rounded-xl font-medium transition-all shadow-lg shadow-orange-500/20"
          >
            <Download className="w-4 h-4" />
            {t('financial.exportPdf')}
          </button>
        </div>

        {/* Period Selector Cards */}
        <div className={`p-4 rounded-xl border ${theme === 'dark' ? 'bg-slate-800/50 border-slate-700/50' : 'bg-white border-slate-200 shadow-sm'}`}>
          <div className="no-print flex flex-wrap items-center gap-3">
            <div className="flex gap-2">
              {(['daily', 'weekly', 'monthly', 'yearly'] as TimePeriod[]).map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    period === p
                      ? 'bg-gradient-to-r from-orange-500 to-rose-500 text-white shadow-lg'
                      : theme === 'dark'
                      ? 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {periodLabels[p]}
                </button>
              ))}
            </div>

            <div className="w-40">
              <SearchableSelect
                options={monthOptions}
                value={selectedMonth.toString()}
                onValueChange={(val) => setSelectedMonth(parseInt(val))}
                placeholder={t('financial.selectMonth')}
                searchPlaceholder={t('financial.searchMonth')}
                emptyMessage={t('financial.noMonthFound')}
                theme={theme}
              />
            </div>

            <div className="w-28">
              <SearchableSelect
                options={yearOptions}
                value={selectedYear.toString()}
                onValueChange={(val) => setSelectedYear(parseInt(val))}
                placeholder={t('financial.selectYear')}
                searchPlaceholder={t('financial.searchYear')}
                emptyMessage={t('financial.noYearFound')}
                theme={theme}
              />
            </div>
          </div>
        </div>

        <div id="print-area">
          {/* Key Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Revenue Card */}
            <div className={`p-6 rounded-2xl border ${
              theme === 'dark' ? 'bg-gradient-to-br from-emerald-500/10 to-green-500/10 border-emerald-500/20' : 'bg-gradient-to-br from-emerald-50 to-green-50 border-emerald-200'
            }`}>
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  theme === 'dark' ? 'bg-emerald-500/20' : 'bg-emerald-100'
                }`}>
                  <TrendingUp className="w-6 h-6 text-emerald-500" />
                </div>
                <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                  theme === 'dark' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-100 text-emerald-700'
                }`}>
                  +12.5%
                </span>
              </div>
              <p className={`text-sm font-medium mb-1 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                {t('financial.revenue')}
              </p>
              <p className={`text-3xl font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                Rs. {summary.revenue.toLocaleString()}
              </p>
            </div>

            {/* Expenses Card */}
            <div className={`p-6 rounded-2xl border ${
              theme === 'dark' ? 'bg-gradient-to-br from-red-500/10 to-pink-500/10 border-red-500/20' : 'bg-gradient-to-br from-red-50 to-pink-50 border-red-200'
            }`}>
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  theme === 'dark' ? 'bg-red-500/20' : 'bg-red-100'
                }`}>
                  <TrendingDown className="w-6 h-6 text-red-500" />
                </div>
                <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                  theme === 'dark' ? 'bg-red-500/20 text-red-400' : 'bg-red-100 text-red-700'
                }`}>
                  -5.2%
                </span>
              </div>
              <p className={`text-sm font-medium mb-1 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                {t('financial.expenses')}
              </p>
              <p className={`text-3xl font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                Rs. {summary.expenses.toLocaleString()}
              </p>
            </div>

            {/* Profit Card */}
            <div className={`p-6 rounded-2xl border ${
              summary.profit >= 0
                ? theme === 'dark' ? 'bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-blue-500/20' : 'bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200'
                : theme === 'dark' ? 'bg-gradient-to-br from-orange-500/10 to-red-500/10 border-orange-500/20' : 'bg-gradient-to-br from-orange-50 to-red-50 border-orange-200'
            }`}>
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  summary.profit >= 0
                    ? theme === 'dark' ? 'bg-blue-500/20' : 'bg-blue-100'
                    : theme === 'dark' ? 'bg-orange-500/20' : 'bg-orange-100'
                }`}>
                  <DollarSign className={`w-6 h-6 ${summary.profit >= 0 ? 'text-blue-500' : 'text-orange-500'}`} />
                </div>
                <span className={`text-xs font-medium px-2 py-1 rounded-full flex items-center gap-1 ${
                  summary.profit >= 0
                    ? theme === 'dark' ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-100 text-blue-700'
                    : theme === 'dark' ? 'bg-orange-500/20 text-orange-400' : 'bg-orange-100 text-orange-700'
                }`}>
                  {summary.profit >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                  {summary.profitMargin.toFixed(1)}%
                </span>
              </div>
              <p className={`text-sm font-medium mb-1 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                {t('financial.profit')}
              </p>
              <p className={`text-3xl font-bold ${
                summary.profit >= 0
                  ? theme === 'dark' ? 'text-white' : 'text-slate-900'
                  : 'text-orange-500'
              }`}>
                Rs. {summary.profit.toLocaleString()}
              </p>
            </div>

            {/* Profit Margin Card */}
            <div className={`p-6 rounded-2xl border ${
              theme === 'dark' ? 'bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/20' : 'bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200'
            }`}>
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  theme === 'dark' ? 'bg-purple-500/20' : 'bg-purple-100'
                }`}>
                  <TrendingUp className="w-6 h-6 text-purple-500" />
                </div>
                <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                  theme === 'dark' ? 'bg-purple-500/20 text-purple-400' : 'bg-purple-100 text-purple-700'
                }`}>
                  Target: 25%
                </span>
              </div>
              <p className={`text-sm font-medium mb-1 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                {t('financial.profitMargin')}
              </p>
              <p className={`text-3xl font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                {summary.profitMargin.toFixed(1)}%
              </p>
            </div>
          </div>

          {/* Toolbar */}
          <div className={`p-4 rounded-xl border mb-6 ${
            theme === 'dark' ? 'bg-slate-800/50 border-slate-700/50' : 'bg-white border-slate-200 shadow-sm'
          }`}>
            <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
              <div className="flex flex-col sm:flex-row gap-3 flex-1 w-full">
                {/* Search */}
                <div className="relative flex-1 sm:max-w-xs">
                  <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`} />
                  <input
                    type="text"
                    placeholder={t('financial.searchTransactions')}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 transition-all ${
                      theme === 'dark' 
                        ? 'bg-slate-900/50 border-slate-700 text-white placeholder:text-slate-500' 
                        : 'bg-slate-50 border-slate-200'
                    }`}
                  />
                </div>

                {/* Filter Toggle */}
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-all border ${
                    hasActiveFilters
                      ? 'bg-orange-500 text-white border-orange-500'
                      : theme === 'dark' 
                        ? 'border-slate-700 bg-slate-800/50 text-slate-300 hover:bg-slate-700' 
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Filter className="w-4 h-4" />
                  {t('common.filter')}
                  {hasActiveFilters && (
                    <span className="w-5 h-5 bg-white/20 rounded-full text-xs flex items-center justify-center">
                      {[typeFilter !== 'all', categoryFilter !== 'all'].filter(Boolean).length}
                    </span>
                  )}
                  <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
                </button>

                {/* Clear Filters */}
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                      theme === 'dark' ? 'text-slate-400 hover:text-white hover:bg-slate-700' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    {t('financial.clearFilters')}
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                {/* Sort Button */}
                <button
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  className={`p-2 rounded-lg border transition-colors ${
                    theme === 'dark' ? 'border-slate-700 hover:bg-slate-800' : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {sortOrder === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Expanded Filters */}
            {showFilters && (
              <div className={`flex flex-wrap gap-4 pt-4 mt-4 border-t ${theme === 'dark' ? 'border-slate-700/50' : 'border-slate-200'}`}>
                {/* Type Filter */}
                <div className="flex-1 min-w-[180px]">
                  <label className={`block text-xs font-medium mb-1.5 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                    Transaction Type
                  </label>
                  <SearchableSelect
                    options={typeOptions}
                    value={typeFilter}
                    onValueChange={(val) => setTypeFilter(val as 'all' | 'revenue' | 'expense')}
                    placeholder="All Types"
                    searchPlaceholder="Search type..."
                    emptyMessage="No type found."
                    theme={theme}
                  />
                </div>

                {/* Category Filter */}
                <div className="flex-1 min-w-[180px]">
                  <label className={`block text-xs font-medium mb-1.5 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                    Category
                  </label>
                  <SearchableSelect
                    options={categoryOptions}
                    value={categoryFilter}
                    onValueChange={setCategoryFilter}
                    placeholder="All Categories"
                    searchPlaceholder="Search categories..."
                    emptyMessage="No category found."
                    theme={theme}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Interactive Transactions Table */}
          <DataTable
            data={filteredTransactions}
            columns={[
              {
                id: 'date',
                header: t('tableHeaders.date'),
                cell: (transaction) => (
                  <div className="flex items-center gap-2">
                    <Calendar className={`w-4 h-4 ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`} />
                    <span className={theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}>
                      {new Date(transaction.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>
                ),
              },
              {
                id: 'type',
                header: t('tableHeaders.type'),
                cell: (transaction) => (
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                    transaction.type === 'revenue'
                      ? theme === 'dark' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-100 text-emerald-700'
                      : theme === 'dark' ? 'bg-red-500/20 text-red-400' : 'bg-red-100 text-red-700'
                  }`}>
                    {transaction.type === 'revenue' ? (
                      <><TrendingUp className="w-3 h-3" /> {t('financial.revenueType')}</>
                    ) : (
                      <><TrendingDown className="w-3 h-3" /> {t('financial.expenseType')}</>
                    )}
                  </span>
                ),
              },
              {
                id: 'category',
                header: t('tableHeaders.category'),
                cell: (transaction) => (
                  <div className="flex items-center gap-2">
                    {getCategoryIcon(transaction.category)}
                    <span className={`font-medium ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
                      {transaction.category}
                    </span>
                  </div>
                ),
              },
              {
                id: 'description',
                header: t('tableHeaders.description'),
                cell: (transaction) => (
                  <span className={`max-w-xs truncate block ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                    {transaction.description}
                  </span>
                ),
              },
              {
                id: 'amount',
                header: t('tableHeaders.amount'),
                headerClassName: 'text-right',
                className: 'text-right',
                cell: (transaction) => (
                  <span className={`font-bold ${
                    transaction.type === 'revenue' ? 'text-emerald-500' : 'text-red-500'
                  }`}>
                    {transaction.type === 'revenue' ? '+' : '-'}Rs. {transaction.amount.toLocaleString()}
                  </span>
                ),
              },
            ] as DataTableColumn<typeof filteredTransactions[0]>[]}
            pageSize={itemsPerPage}
            currentPage={currentPage}
            onPageChange={setCurrentPage}
            title={t('financial.transactionHistory')}
            icon={<FileText className={`w-5 h-5 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`} />}
            emptyState={{
              icon: <FileText className="w-12 h-12 opacity-30" />,
              title: t('financial.noTransactions'),
              description: t('financial.adjustFilters')
            }}
            theme={theme}
            getRowKey={(row) => row.id}
          />
        </div>
      </div>
    </div>
  );
};
