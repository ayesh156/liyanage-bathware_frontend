import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../contexts/ThemeContext';
import { mockInvoices, mockProducts, mockCustomers } from '../data/mockData';
import { 
  Package, FileText, Users, TrendingUp, ArrowRight, ArrowUpRight, ArrowDownRight,
  DollarSign, ShoppingCart, Clock, AlertTriangle, CheckCircle, Eye, Calendar,
  Activity, Award, BarChart3, PieChart, Layers, RefreshCw, Zap
} from 'lucide-react';

export const Dashboard: React.FC = () => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const [selectedPeriod, setSelectedPeriod] = useState('7d');

  // Calculate statistics
  const paidInvoices = mockInvoices.filter((inv) => inv.status === 'paid').length;
  const pendingInvoices = mockInvoices.filter((inv) => inv.status === 'pending').length;
  const overdueInvoices = mockInvoices.filter((inv) => inv.status === 'overdue').length;
  const totalRevenue = mockInvoices.filter(inv => inv.status === 'paid').reduce((sum, inv) => sum + inv.total, 0);
  const pendingRevenue = mockInvoices.filter(inv => inv.status === 'pending').reduce((sum, inv) => sum + inv.total, 0);
  const totalProducts = mockProducts.length;
  const lowStockProducts = mockProducts.filter((p) => p.stock < 50).length;
  const totalCustomers = mockCustomers.length;
  const totalCustomerSpent = mockCustomers.reduce((sum, c) => sum + c.totalSpent, 0);

  // Mock chart data for revenue
  const revenueData = [
    { day: t('common.days.mon'), value: 125000 },
    { day: t('common.days.tue'), value: 180000 },
    { day: t('common.days.wed'), value: 150000 },
    { day: t('common.days.thu'), value: 220000 },
    { day: t('common.days.fri'), value: 190000 },
    { day: t('common.days.sat'), value: 280000 },
    { day: t('common.days.sun'), value: 160000 },
  ];
  const maxRevenue = Math.max(...revenueData.map(d => d.value));

  // Category distribution
  const categoryData = [
    { name: t('dashboard.categories.hardware'), value: 45, color: 'from-blue-500 to-cyan-500' },
    { name: t('dashboard.categories.electrical'), value: 25, color: 'from-purple-500 to-pink-500' },
    { name: t('dashboard.categories.tools'), value: 20, color: 'from-orange-500 to-rose-500' },
    { name: t('dashboard.categories.other'), value: 10, color: 'from-emerald-500 to-teal-500' },
  ];

  // Recent activities
  const recentActivities = [
    { id: 1, type: 'invoice', message: t('dashboard.activities.invoicePaid', { id: 'INV-2024-0156' }), time: t('common.time.minAgo', { count: 2 }), icon: CheckCircle, color: 'text-green-500' },
    { id: 2, type: 'customer', message: t('dashboard.activities.newCustomer', { name: 'Kasun Bandara' }), time: t('common.time.minAgo', { count: 15 }), icon: Users, color: 'text-blue-500' },
    { id: 3, type: 'stock', message: t('dashboard.activities.lowStock', { product: 'Cordless Impact Driver' }), time: t('common.time.hourAgo', { count: 1 }), icon: AlertTriangle, color: 'text-amber-500' },
    { id: 4, type: 'invoice', message: t('dashboard.activities.invoiceCreated', { id: 'INV-2024-0155' }), time: t('common.time.hoursAgo', { count: 2 }), icon: FileText, color: 'text-purple-500' },
    { id: 5, type: 'order', message: t('dashboard.activities.orderShipped', { id: '#1234' }), time: t('common.time.hoursAgo', { count: 3 }), icon: Package, color: 'text-cyan-500' },
  ];

  // Top customers
  const topCustomers = mockCustomers.sort((a, b) => b.totalSpent - a.totalSpent).slice(0, 5);

  return (
    <div className="space-y-6 pb-8">
      {/* Page Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className={`text-2xl lg:text-3xl font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
            {t('home.dashboard')}
          </h1>
          <p className={`mt-1 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
            {t('dashboard.welcomeBack')}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Period Selector */}
          <div className={`flex items-center p-1 rounded-xl border ${
            theme === 'dark' ? 'bg-slate-800/50 border-slate-700/50' : 'bg-white border-slate-200'
          }`}>
            {['24h', '7d', '30d', '90d'].map((period) => (
              <button
                key={period}
                onClick={() => setSelectedPeriod(period)}
                className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-all ${
                  selectedPeriod === period
                    ? 'bg-gradient-to-r from-orange-500 to-rose-500 text-white shadow-lg'
                    : theme === 'dark' ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {period}
              </button>
            ))}
          </div>
          <button className={`p-2.5 rounded-xl border transition-all ${
            theme === 'dark' 
              ? 'bg-slate-800/50 border-slate-700/50 hover:bg-slate-700/50 text-slate-400' 
              : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-600'
          }`}>
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        {/* Total Revenue */}
        <div className={`group relative p-5 lg:p-6 rounded-2xl border overflow-hidden transition-all duration-300 hover:shadow-xl ${
          theme === 'dark' 
            ? 'bg-gradient-to-br from-slate-800/80 to-slate-900/80 border-slate-700/50 hover:border-emerald-500/30' 
            : 'bg-gradient-to-br from-white to-slate-50 border-slate-200 hover:border-emerald-300'
        }`}>
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-500" />
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-2.5 rounded-xl ${theme === 'dark' ? 'bg-emerald-500/10' : 'bg-emerald-50'}`}>
                <DollarSign className="w-5 h-5 text-emerald-500" />
              </div>
              <div className="flex items-center gap-1 text-emerald-500 text-sm font-medium">
                <ArrowUpRight className="w-4 h-4" />
                +12.5%
              </div>
            </div>
            <p className={`text-sm font-medium mb-1 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
              {t('dashboard.totalRevenue')}
            </p>
            <p className={`text-2xl lg:text-3xl font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
              {t('common.currency')} {(totalRevenue / 1000).toFixed(0)}K
            </p>
            <div className={`mt-3 pt-3 border-t ${theme === 'dark' ? 'border-slate-700/50' : 'border-slate-200'}`}>
              <p className={`text-xs ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>
                {t('dashboard.pending')}: <span className="text-amber-500 font-semibold">{t('common.currency')} {(pendingRevenue / 1000).toFixed(0)}K</span>
              </p>
            </div>
          </div>
        </div>

        {/* Total Orders/Invoices */}
        <div className={`group relative p-5 lg:p-6 rounded-2xl border overflow-hidden transition-all duration-300 hover:shadow-xl ${
          theme === 'dark' 
            ? 'bg-gradient-to-br from-slate-800/80 to-slate-900/80 border-slate-700/50 hover:border-blue-500/30' 
            : 'bg-gradient-to-br from-white to-slate-50 border-slate-200 hover:border-blue-300'
        }`}>
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-500" />
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-2.5 rounded-xl ${theme === 'dark' ? 'bg-blue-500/10' : 'bg-blue-50'}`}>
                <FileText className="w-5 h-5 text-blue-500" />
              </div>
              <div className="flex items-center gap-1 text-blue-500 text-sm font-medium">
                <ArrowUpRight className="w-4 h-4" />
                +8.2%
              </div>
            </div>
            <p className={`text-sm font-medium mb-1 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
              {t('dashboard.totalInvoices')}
            </p>
            <p className={`text-2xl lg:text-3xl font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
              {mockInvoices.length}
            </p>
            <div className={`mt-3 pt-3 border-t flex items-center gap-3 ${theme === 'dark' ? 'border-slate-700/50' : 'border-slate-200'}`}>
              <span className="flex items-center gap-1 text-xs text-green-500">
                <CheckCircle className="w-3 h-3" /> {paidInvoices}
              </span>
              <span className="flex items-center gap-1 text-xs text-amber-500">
                <Clock className="w-3 h-3" /> {pendingInvoices}
              </span>
              <span className="flex items-center gap-1 text-xs text-red-500">
                <AlertTriangle className="w-3 h-3" /> {overdueInvoices}
              </span>
            </div>
          </div>
        </div>

        {/* Products */}
        <div className={`group relative p-5 lg:p-6 rounded-2xl border overflow-hidden transition-all duration-300 hover:shadow-xl ${
          theme === 'dark' 
            ? 'bg-gradient-to-br from-slate-800/80 to-slate-900/80 border-slate-700/50 hover:border-purple-500/30' 
            : 'bg-gradient-to-br from-white to-slate-50 border-slate-200 hover:border-purple-300'
        }`}>
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-500" />
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-2.5 rounded-xl ${theme === 'dark' ? 'bg-purple-500/10' : 'bg-purple-50'}`}>
                <Package className="w-5 h-5 text-purple-500" />
              </div>
              <div className="flex items-center gap-1 text-purple-500 text-sm font-medium">
                <Layers className="w-4 h-4" />
                {totalProducts}
              </div>
            </div>
            <p className={`text-sm font-medium mb-1 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
              {t('dashboard.products')}
            </p>
            <p className={`text-2xl lg:text-3xl font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
              {totalProducts}
            </p>
            <div className={`mt-3 pt-3 border-t ${theme === 'dark' ? 'border-slate-700/50' : 'border-slate-200'}`}>
              {lowStockProducts > 0 ? (
                <p className="flex items-center gap-1.5 text-xs text-amber-500">
                  <AlertTriangle className="w-3 h-3" />
                  {lowStockProducts} {t('dashboard.productsLowStock')}
                </p>
              ) : (
                <p className="flex items-center gap-1.5 text-xs text-green-500">
                  <CheckCircle className="w-3 h-3" />
                  {t('dashboard.allWellStocked')}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Customers */}
        <div className={`group relative p-5 lg:p-6 rounded-2xl border overflow-hidden transition-all duration-300 hover:shadow-xl ${
          theme === 'dark' 
            ? 'bg-gradient-to-br from-slate-800/80 to-slate-900/80 border-slate-700/50 hover:border-orange-500/30' 
            : 'bg-gradient-to-br from-white to-slate-50 border-slate-200 hover:border-orange-300'
        }`}>
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-orange-500/10 to-rose-500/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-500" />
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-2.5 rounded-xl ${theme === 'dark' ? 'bg-orange-500/10' : 'bg-orange-50'}`}>
                <Users className="w-5 h-5 text-orange-500" />
              </div>
              <div className="flex items-center gap-1 text-green-500 text-sm font-medium">
                <ArrowUpRight className="w-4 h-4" />
                +3
              </div>
            </div>
            <p className={`text-sm font-medium mb-1 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
              {t('dashboard.customers')}
            </p>
            <p className={`text-2xl lg:text-3xl font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
              {totalCustomers}
            </p>
            <div className={`mt-3 pt-3 border-t ${theme === 'dark' ? 'border-slate-700/50' : 'border-slate-200'}`}>
              <p className={`text-xs ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>
                {t('dashboard.totalSpent')}: <span className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-slate-700'}`}>{t('common.currency')} {(totalCustomerSpent / 1000000).toFixed(1)}M</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
        {/* Revenue Chart */}
        <div className={`lg:col-span-2 p-5 lg:p-6 rounded-2xl border ${
          theme === 'dark' ? 'bg-slate-800/50 border-slate-700/50' : 'bg-white border-slate-200'
        }`}>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                {t('dashboard.revenueOverview')}
              </h3>
              <p className={`text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                {t('dashboard.weeklyPerformance')}
              </p>
            </div>
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${
              theme === 'dark' ? 'bg-emerald-500/10' : 'bg-emerald-50'
            }`}>
              <TrendingUp className="w-4 h-4 text-emerald-500" />
              <span className="text-sm font-semibold text-emerald-500">+15.3%</span>
            </div>
          </div>
          
          {/* Bar Chart */}
          <div className="flex items-end justify-between gap-2 h-48">
            {revenueData.map((item, index) => (
              <div key={item.day} className="flex-1 flex flex-col items-center gap-2">
                <div className="relative w-full flex justify-center">
                  <div 
                    className={`w-full max-w-[40px] rounded-t-lg transition-all duration-500 hover:opacity-80 cursor-pointer ${
                      index === 5 
                        ? 'bg-gradient-to-t from-orange-500 to-rose-500' 
                        : theme === 'dark' 
                          ? 'bg-gradient-to-t from-slate-600 to-slate-500' 
                          : 'bg-gradient-to-t from-slate-300 to-slate-200'
                    }`}
                    style={{ height: `${(item.value / maxRevenue) * 100}%`, minHeight: '20px' }}
                  />
                </div>
                <span className={`text-xs font-medium ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>
                  {item.day}
                </span>
              </div>
            ))}
          </div>
          
          <div className={`mt-4 pt-4 border-t flex items-center justify-between ${
            theme === 'dark' ? 'border-slate-700/50' : 'border-slate-200'
          }`}>
            <div>
              <p className={`text-xs ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>{t('dashboard.thisWeek')}</p>
              <p className={`text-lg font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                {t('common.currency')} 1,305,000
              </p>
            </div>
            <div>
              <p className={`text-xs ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>{t('dashboard.lastWeek')}</p>
              <p className={`text-lg font-bold ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                {t('common.currency')} 1,132,000
              </p>
            </div>
            <div>
              <p className={`text-xs ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>{t('dashboard.avgDaily')}</p>
              <p className={`text-lg font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                {t('common.currency')} 186,400
              </p>
            </div>
          </div>
        </div>

        {/* Category Distribution */}
        <div className={`p-5 lg:p-6 rounded-2xl border ${
          theme === 'dark' ? 'bg-slate-800/50 border-slate-700/50' : 'bg-white border-slate-200'
        }`}>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                {t('dashboard.salesByCategory')}
              </h3>
              <p className={`text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                {t('dashboard.productDistribution')}
              </p>
            </div>
            <PieChart className={`w-5 h-5 ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`} />
          </div>

          {/* Donut Chart Placeholder */}
          <div className="relative flex items-center justify-center h-40 mb-6">
            <div className={`absolute w-32 h-32 rounded-full border-[12px] ${
              theme === 'dark' ? 'border-slate-700' : 'border-slate-200'
            }`} />
            <svg className="w-32 h-32 -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="38" fill="none" stroke="url(#gradient1)" strokeWidth="12" strokeDasharray="107.44 238.76" />
              <circle cx="50" cy="50" r="38" fill="none" stroke="url(#gradient2)" strokeWidth="12" strokeDasharray="59.69 238.76" strokeDashoffset="-107.44" />
              <circle cx="50" cy="50" r="38" fill="none" stroke="url(#gradient3)" strokeWidth="12" strokeDasharray="47.75 238.76" strokeDashoffset="-167.13" />
              <circle cx="50" cy="50" r="38" fill="none" stroke="url(#gradient4)" strokeWidth="12" strokeDasharray="23.88 238.76" strokeDashoffset="-214.88" />
              <defs>
                <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#3b82f6" />
                  <stop offset="100%" stopColor="#06b6d4" />
                </linearGradient>
                <linearGradient id="gradient2" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#a855f7" />
                  <stop offset="100%" stopColor="#ec4899" />
                </linearGradient>
                <linearGradient id="gradient3" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#f97316" />
                  <stop offset="100%" stopColor="#f43f5e" />
                </linearGradient>
                <linearGradient id="gradient4" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#10b981" />
                  <stop offset="100%" stopColor="#14b8a6" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute flex flex-col items-center">
              <p className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                {totalProducts}
              </p>
              <p className={`text-xs ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>{t('dashboard.total')}</p>
            </div>
          </div>

          {/* Legend */}
          <div className="space-y-3">
            {categoryData.map((category) => (
              <div key={category.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full bg-gradient-to-r ${category.color}`} />
                  <span className={`text-sm ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>
                    {category.name}
                  </span>
                </div>
                <span className={`text-sm font-semibold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                  {category.value}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
        {/* Recent Activity */}
        <div className={`lg:col-span-2 p-5 lg:p-6 rounded-2xl border ${
          theme === 'dark' ? 'bg-slate-800/50 border-slate-700/50' : 'bg-white border-slate-200'
        }`}>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                {t('dashboard.recentActivity')}
              </h3>
              <p className={`text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                {t('dashboard.latestUpdates')}
              </p>
            </div>
            <button className={`text-sm font-medium transition-colors ${
              theme === 'dark' ? 'text-orange-400 hover:text-orange-300' : 'text-orange-500 hover:text-orange-600'
            }`}>
              {t('dashboard.viewAll')}
            </button>
          </div>

          <div className="space-y-4">
            {recentActivities.map((activity, index) => {
              const Icon = activity.icon;
              return (
                <div 
                  key={activity.id} 
                  className={`flex items-start gap-4 p-3 rounded-xl transition-colors ${
                    theme === 'dark' ? 'hover:bg-slate-700/30' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className={`p-2 rounded-lg ${
                    theme === 'dark' ? 'bg-slate-700/50' : 'bg-slate-100'
                  }`}>
                    <Icon className={`w-4 h-4 ${activity.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm ${theme === 'dark' ? 'text-slate-200' : 'text-slate-700'}`}>
                      {activity.message}
                    </p>
                    <p className={`text-xs mt-1 ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>
                      {activity.time}
                    </p>
                  </div>
                  <button className={`p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity ${
                    theme === 'dark' ? 'hover:bg-slate-700' : 'hover:bg-slate-200'
                  }`}>
                    <Eye className={`w-4 h-4 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top Customers */}
        <div className={`p-5 lg:p-6 rounded-2xl border ${
          theme === 'dark' ? 'bg-slate-800/50 border-slate-700/50' : 'bg-white border-slate-200'
        }`}>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                {t('dashboard.topCustomers')}
              </h3>
              <p className={`text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                {t('dashboard.byTotalSpending')}
              </p>
            </div>
            <Award className={`w-5 h-5 text-amber-500`} />
          </div>

          <div className="space-y-4">
            {topCustomers.map((customer, index) => (
              <div key={customer.id} className="flex items-center gap-3">
                <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${
                  index === 0 
                    ? 'bg-gradient-to-br from-amber-500 to-orange-500 text-white' 
                    : index === 1 
                      ? 'bg-gradient-to-br from-slate-400 to-slate-500 text-white'
                      : index === 2 
                        ? 'bg-gradient-to-br from-amber-700 to-amber-800 text-white'
                        : theme === 'dark' 
                          ? 'bg-slate-700 text-slate-300' 
                          : 'bg-slate-200 text-slate-600'
                }`}>
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium truncate ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                    {customer.name}
                  </p>
                  <p className={`text-xs truncate ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>
                    {customer.businessName}
                  </p>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-semibold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                    {t('common.currency')} {(customer.totalSpent / 1000).toFixed(0)}K
                  </p>
                </div>
              </div>
            ))}
          </div>

          <Link 
            to="/customers"
            className={`mt-6 flex items-center justify-center gap-2 py-2.5 rounded-xl border transition-all ${
              theme === 'dark' 
                ? 'border-slate-700 hover:bg-slate-700/50 text-slate-300' 
                : 'border-slate-200 hover:bg-slate-50 text-slate-600'
            }`}
          >
            {t('dashboard.viewAllCustomers')}
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Quick Actions */}
      <div className={`p-5 lg:p-6 rounded-2xl border ${
        theme === 'dark' ? 'bg-gradient-to-r from-slate-800/50 to-slate-900/50 border-slate-700/50' : 'bg-gradient-to-r from-white to-slate-50 border-slate-200'
      }`}>
        <h3 className={`text-lg font-semibold mb-4 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
          {t('dashboard.quickActions')}
        </h3>
        
        {/* Quick Checkout - Featured Action */}
        <Link 
          to="/invoices/quick-checkout"
          className={`flex items-center justify-between p-4 mb-4 rounded-xl border-2 transition-all hover:scale-[1.01] ${
            theme === 'dark' 
              ? 'bg-gradient-to-r from-amber-500/20 to-orange-500/20 border-amber-500/40 hover:border-amber-400' 
              : 'bg-gradient-to-r from-amber-50 to-orange-50 border-amber-300 hover:border-amber-400'
          }`}
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/30">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className={`text-lg font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                {t('quickCheckout.title')}
              </span>
              <p className={`text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                {t('quickCheckout.subtitle')}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <kbd className={`hidden sm:inline px-2 py-1 rounded text-xs font-mono ${theme === 'dark' ? 'bg-slate-700 text-slate-300' : 'bg-slate-200 text-slate-600'}`}>
              F2
            </kbd>
            <ArrowRight className={`w-5 h-5 ${theme === 'dark' ? 'text-amber-400' : 'text-amber-600'}`} />
          </div>
        </Link>
        
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Link 
            to="/invoices/create"
            className={`flex items-center gap-3 p-4 rounded-xl border transition-all hover:scale-[1.02] ${
              theme === 'dark' 
                ? 'bg-blue-500/10 border-blue-500/20 hover:bg-blue-500/20' 
                : 'bg-blue-50 border-blue-200/50 hover:bg-blue-100'
            }`}
          >
            <FileText className="w-5 h-5 text-blue-500" />
            <span className={`text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
              {t('dashboard.newInvoice')}
            </span>
          </Link>
          <Link 
            to="/products"
            className={`flex items-center gap-3 p-4 rounded-xl border transition-all hover:scale-[1.02] ${
              theme === 'dark' 
                ? 'bg-purple-500/10 border-purple-500/20 hover:bg-purple-500/20' 
                : 'bg-purple-50 border-purple-200/50 hover:bg-purple-100'
            }`}
          >
            <Package className="w-5 h-5 text-purple-500" />
            <span className={`text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
              {t('dashboard.addProduct')}
            </span>
          </Link>
          <Link 
            to="/customers"
            className={`flex items-center gap-3 p-4 rounded-xl border transition-all hover:scale-[1.02] ${
              theme === 'dark' 
                ? 'bg-orange-500/10 border-orange-500/20 hover:bg-orange-500/20' 
                : 'bg-orange-50 border-orange-200/50 hover:bg-orange-100'
            }`}
          >
            <Users className="w-5 h-5 text-orange-500" />
            <span className={`text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
              {t('dashboard.addCustomer')}
            </span>
          </Link>
          <button 
            className={`flex items-center gap-3 p-4 rounded-xl border transition-all hover:scale-[1.02] ${
              theme === 'dark' 
                ? 'bg-emerald-500/10 border-emerald-500/20 hover:bg-emerald-500/20' 
                : 'bg-emerald-50 border-emerald-200/50 hover:bg-emerald-100'
            }`}
          >
            <BarChart3 className="w-5 h-5 text-emerald-500" />
            <span className={`text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
              {t('dashboard.viewReports')}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
