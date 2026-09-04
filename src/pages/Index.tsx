import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../contexts/ThemeContext';
import { useIsMobile } from '../hooks/use-mobile';
import { mockInvoices, mockProducts, mockCustomers } from '../data/mockData';
import { Package, FileText, Users, TrendingUp, ArrowRight, Zap, Shield, BarChart3 } from 'lucide-react';

export const Index: React.FC = () => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const isMobile = useIsMobile();

  const features = [
    {
      icon: FileText,
      titleKey: 'home.feature1Title',
      descKey: 'home.feature1Desc',
      gradient: 'from-blue-500 to-cyan-500',
      bg: 'bg-blue-500/10',
    },
    {
      icon: Package,
      titleKey: 'home.feature2Title',
      descKey: 'home.feature2Desc',
      gradient: 'from-purple-500 to-pink-500',
      bg: 'bg-purple-500/10',
    },
    {
      icon: Users,
      titleKey: 'home.feature3Title',
      descKey: 'home.feature3Desc',
      gradient: 'from-orange-500 to-rose-500',
      bg: 'bg-orange-500/10',
    },
    {
      icon: TrendingUp,
      titleKey: 'home.feature4Title',
      descKey: 'home.feature4Desc',
      gradient: 'from-emerald-500 to-teal-500',
      bg: 'bg-emerald-500/10',
    },
  ];

  const paidInvoices = mockInvoices.filter((inv) => inv.status === 'paid').length;
  const totalRevenue = mockInvoices.reduce((sum, inv) => sum + inv.total, 0);
  const totalProducts = mockProducts.length;
  const lowStockProducts = mockProducts.filter((p) => p.stock < 50).length;

  return (
    <div className={`space-y-20 ${isMobile ? 'pb-20' : ''}`}>
      {/* Hero Section */}
      <section className="relative pt-10 pb-16">
        {/* Decorative elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-1/4 w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
          <div className="absolute top-40 right-1/4 w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse delay-300" />
          <div className="absolute bottom-20 left-1/3 w-1 h-1 bg-purple-500 rounded-full animate-pulse delay-500" />
        </div>

        <div className="relative text-center max-w-4xl mx-auto">
          {/* Badge */}
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border mb-8 ${theme === 'dark' ? 'bg-slate-800/50 border-slate-700/50' : 'bg-slate-100 border-slate-200'}`}>
            <Zap className="w-4 h-4 text-orange-400" />
            <span className={`text-sm ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>Enterprise-Grade Hardware Management</span>
          </div>

          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
            <span className={theme === 'dark' ? 'text-white' : 'text-slate-900'}>Manage Your</span>
            <br />
            <span className="bg-gradient-to-r from-orange-400 via-rose-400 to-purple-400 bg-clip-text text-transparent">
              Hardware Business
            </span>
          </h1>

          <p className={`text-xl mb-10 max-w-2xl mx-auto leading-relaxed ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
            {t('home.subtitle')}
          </p>

          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link
              to="/invoices"
              className="group relative inline-flex items-center justify-center gap-2 px-8 py-4 overflow-hidden rounded-xl font-semibold transition-all duration-300"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-rose-500 transition-all duration-300 group-hover:scale-105" />
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-r from-orange-400 to-rose-400" />
              <span className="relative text-white">{t('home.getStarted')}</span>
              <ArrowRight className="relative w-4 h-4 text-white group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              to="/products"
              className={`inline-flex items-center justify-center gap-2 px-8 py-4 font-semibold rounded-xl border transition-all duration-300 ${theme === 'dark' ? 'bg-slate-800/50 text-white border-slate-700 hover:bg-slate-700/50 hover:border-slate-600' : 'bg-white text-slate-900 border-slate-200 hover:bg-slate-50 hover:border-slate-300'}`}
            >
              <Package className="w-4 h-4" />
              {t('nav.products')}
            </Link>
          </div>

          {/* Trust indicators */}
          <div className={`flex flex-wrap justify-center items-center gap-8 mt-12 pt-8 border-t ${theme === 'dark' ? 'border-slate-800/50' : 'border-slate-200'}`}>
            <div className={`flex items-center gap-2 ${theme === 'dark' ? 'text-slate-500' : 'text-slate-600'}`}>
              <Shield className="w-4 h-4 text-green-500" />
              <span className="text-sm">Secure & Reliable</span>
            </div>
            <div className={`flex items-center gap-2 ${theme === 'dark' ? 'text-slate-500' : 'text-slate-600'}`}>
              <Zap className="w-4 h-4 text-yellow-500" />
              <span className="text-sm">Lightning Fast</span>
            </div>
            <div className={`flex items-center gap-2 ${theme === 'dark' ? 'text-slate-500' : 'text-slate-600'}`}>
              <BarChart3 className="w-4 h-4 text-blue-500" />
              <span className="text-sm">Real-time Analytics</span>
            </div>
          </div>
        </div>
      </section>

      {/* Key Features */}
      <section className="space-y-12">
        <div className="text-center">
          <h2 className={`text-3xl md:text-4xl font-bold mb-4 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
            {t('home.features')}
          </h2>
          <p className={`text-lg max-w-2xl mx-auto ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
            Everything you need to manage your hardware business efficiently
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, idx) => {
            const Icon = feature.icon;
            return (
              <div
                key={idx}
                className={`group relative p-6 rounded-2xl border transition-all duration-300 card-hover ${theme === 'dark' ? 'bg-slate-800/30 border-slate-700/50 hover:border-slate-600/50' : 'bg-white border-slate-200 hover:border-slate-300 shadow-sm'}`}
              >
                <div className={`w-12 h-12 ${feature.bg} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                  <Icon className={`w-6 h-6 bg-gradient-to-r ${feature.gradient} bg-clip-text`} style={{ color: 'transparent', backgroundClip: 'text', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }} />
                  <Icon className={`w-6 h-6 absolute text-transparent bg-gradient-to-r ${feature.gradient}`} style={{ WebkitBackgroundClip: 'text' }} />
                </div>
                <div className={`w-12 h-12 ${feature.bg} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 -mt-16`}>
                  <div className={`w-6 h-6 bg-gradient-to-r ${feature.gradient} rounded-lg opacity-80`} />
                </div>
                <h3 className={`text-lg font-semibold mb-2 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                  {t(feature.titleKey)}
                </h3>
                <p className={`text-sm leading-relaxed ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                  {t(feature.descKey)}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Dashboard Overview */}
      <section className="space-y-8">
        <div className="flex items-center gap-3">
          <div className="w-1 h-8 bg-gradient-to-b from-orange-500 to-rose-500 rounded-full" />
          <h2 className={`text-3xl font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
            {t('home.dashboard')}
          </h2>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className={`group relative p-6 rounded-2xl border overflow-hidden card-hover ${theme === 'dark' ? 'bg-slate-800/30 border-slate-700/50' : 'bg-white border-slate-200 shadow-sm'}`}>
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <h3 className={`text-sm font-medium ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                  {t('nav.invoices')}
                </h3>
                <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center">
                  <FileText className="w-5 h-5 text-blue-400" />
                </div>
              </div>
              <div className={`text-4xl font-bold mb-1 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                {mockInvoices.length}
              </div>
              <p className={`text-sm ${theme === 'dark' ? 'text-slate-500' : 'text-slate-500'}`}>
                <span className="text-green-400">{paidInvoices}</span> paid invoices
              </p>
            </div>
          </div>

          <div className={`group relative p-6 rounded-2xl border overflow-hidden card-hover ${theme === 'dark' ? 'bg-slate-800/30 border-slate-700/50' : 'bg-white border-slate-200 shadow-sm'}`}>
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-teal-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <h3 className={`text-sm font-medium ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                  Total Revenue
                </h3>
                <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-emerald-400" />
                </div>
              </div>
              <div className={`text-4xl font-bold mb-1 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                Rs. {(totalRevenue / 1000).toFixed(0)}K
              </div>
              <p className={`text-sm ${theme === 'dark' ? 'text-slate-500' : 'text-slate-500'}`}>
                Across all invoices
              </p>
            </div>
          </div>

          <div className={`group relative p-6 rounded-2xl border overflow-hidden card-hover ${theme === 'dark' ? 'bg-slate-800/30 border-slate-700/50' : 'bg-white border-slate-200 shadow-sm'}`}>
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <h3 className={`text-sm font-medium ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                  {t('nav.products')}
                </h3>
                <div className="w-10 h-10 bg-purple-500/10 rounded-xl flex items-center justify-center">
                  <Package className="w-5 h-5 text-purple-400" />
                </div>
              </div>
              <div className={`text-4xl font-bold mb-1 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                {totalProducts}
              </div>
              <p className={`text-sm ${theme === 'dark' ? 'text-slate-500' : 'text-slate-500'}`}>
                <span className="text-yellow-400">{lowStockProducts}</span> low stock
              </p>
            </div>
          </div>

          <div className={`group relative p-6 rounded-2xl border overflow-hidden card-hover ${theme === 'dark' ? 'bg-slate-800/30 border-slate-700/50' : 'bg-white border-slate-200 shadow-sm'}`}>
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-rose-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <h3 className={`text-sm font-medium ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                  {t('nav.customers')}
                </h3>
                <div className="w-10 h-10 bg-orange-500/10 rounded-xl flex items-center justify-center">
                  <Users className="w-5 h-5 text-orange-400" />
                </div>
              </div>
              <div className={`text-4xl font-bold mb-1 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                {mockCustomers.length}
              </div>
              <p className={`text-sm ${theme === 'dark' ? 'text-slate-500' : 'text-slate-500'}`}>
                Active customers
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Recent Invoices Preview */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-1 h-6 bg-gradient-to-b from-blue-500 to-cyan-500 rounded-full" />
            <h3 className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
              {t('home.recentInvoices')}
            </h3>
          </div>
          <Link
            to="/invoices"
            className="text-orange-400 hover:text-orange-300 font-medium flex items-center gap-2 transition-colors"
          >
            View All <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className={`rounded-2xl border overflow-hidden ${theme === 'dark' ? 'bg-slate-800/30 border-slate-700/50' : 'bg-white border-slate-200 shadow-sm'}`}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px]">
              <thead>
                <tr className={`border-b ${theme === 'dark' ? 'border-slate-700/50 bg-slate-800/50' : 'border-slate-200 bg-slate-50'}`}>
                  <th className={`px-6 py-4 text-left text-sm font-semibold whitespace-nowrap ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>
                    {t('invoices.invoiceNumber')}
                  </th>
                  <th className={`px-6 py-4 text-left text-sm font-semibold whitespace-nowrap ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>
                    {t('invoices.customer')}
                  </th>
                  <th className={`px-6 py-4 text-left text-sm font-semibold whitespace-nowrap ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>
                    {t('invoices.totalAmount')}
                  </th>
                  <th className={`px-6 py-4 text-left text-sm font-semibold whitespace-nowrap ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>
                    {t('common.status')}
                  </th>
                  <th className={`px-6 py-4 text-left text-sm font-semibold whitespace-nowrap ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>
                    {t('invoices.dueDate')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {mockInvoices.slice(0, 5).map((invoice) => (
                  <tr
                    key={invoice.id}
                    className={`border-b transition-colors ${theme === 'dark' ? 'border-slate-700/30 hover:bg-slate-700/20' : 'border-slate-100 hover:bg-slate-50'}`}
                  >
                    <td className={`px-6 py-4 text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                      {invoice.invoiceNumber}
                    </td>
                    <td className={`px-6 py-4 text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                      {invoice.customerName}
                    </td>
                    <td className={`px-6 py-4 text-sm font-semibold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                      Rs. {invoice.total.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                          invoice.status === 'paid'
                            ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                            : invoice.status === 'pending'
                              ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
                              : 'bg-red-500/10 text-red-400 border border-red-500/20'
                        }`}
                      >
                        {t(`invoices.${invoice.status}`)}
                      </span>
                    </td>
                    <td className={`px-6 py-4 text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                      {new Date(invoice.dueDate).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Top Products Preview */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-1 h-6 bg-gradient-to-b from-purple-500 to-pink-500 rounded-full" />
            <h3 className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
              {t('home.topProducts')}
            </h3>
          </div>
          <Link
            to="/products"
            className="text-orange-400 hover:text-orange-300 font-medium flex items-center gap-2 transition-colors"
          >
            View All <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mockProducts.slice(0, 6).map((product) => (
            <div
              key={product.id}
              className={`group p-6 rounded-2xl border transition-all duration-300 card-hover ${theme === 'dark' ? 'bg-slate-800/30 border-slate-700/50 hover:border-slate-600/50' : 'bg-white border-slate-200 hover:border-slate-300 shadow-sm'}`}
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h4 className={`font-semibold text-lg mb-1 group-hover:text-orange-400 transition-colors ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                    {product.name}
                  </h4>
                  <p className={`text-xs ${theme === 'dark' ? 'text-slate-500' : 'text-slate-500'}`}>
                    SKU: {product.sku}
                  </p>
                </div>
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  {t(`products.${product.category}`)}
                </span>
              </div>
              <p className={`text-sm mb-4 line-clamp-2 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                {product.description}
              </p>
              <div className={`flex items-end justify-between pt-4 border-t ${theme === 'dark' ? 'border-slate-700/50' : 'border-slate-200'}`}>
                <div>
                  <p className={`text-xs ${theme === 'dark' ? 'text-slate-500' : 'text-slate-500'}`}>Price</p>
                  <p className={`text-lg font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                    Rs. {(product.retailPrice || product.price || 0).toLocaleString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className={`text-xs ${theme === 'dark' ? 'text-slate-500' : 'text-slate-500'}`}>Stock</p>
                  <p
                    className={`text-lg font-bold ${
                      product.stock > 100
                        ? 'text-green-400'
                        : product.stock > 50
                          ? 'text-yellow-400'
                          : 'text-red-400'
                    }`}
                  >
                    {product.stock}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-2xl p-12 text-center text-white overflow-hidden relative">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-40 h-40 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-40 h-40 bg-white rounded-full blur-3xl" />
        </div>
        <div className="relative">
          <h3 className="text-3xl font-bold mb-4">Ready to get started?</h3>
          <p className="text-lg opacity-90 mb-8 max-w-2xl mx-auto">
            Start managing your hardware business efficiently with our comprehensive management system
          </p>
          <Link
            to="/invoices"
            className="inline-flex items-center justify-center gap-2 px-8 py-3 bg-white text-blue-700 font-semibold rounded-lg hover:bg-blue-50 transition-all"
          >
            {t('home.getStarted')}
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </div>
  );
};
