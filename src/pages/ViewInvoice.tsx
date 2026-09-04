import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { mockInvoices, mockCustomers, mockProducts } from '../data/mockData';
import { Invoice, Customer, InvoiceItem } from '../types/index';
import { printInvoice } from '../components/modals/PrintInvoiceModal';
import {
  FileText, ArrowLeft, Printer, Edit3, Calendar, User, Phone,
  Building2, CreditCard, DollarSign, Package, CheckCircle, Clock,
  AlertTriangle, XCircle, Receipt, Percent, Tag, Zap, Mail, MapPin,
  Copy, Download, Share2, MoreVertical, TrendingUp, Banknote
} from 'lucide-react';

// Extended invoice item type
interface ExtendedInvoiceItem extends InvoiceItem {
  originalPrice?: number;
  discountType?: 'percentage' | 'fixed' | null;
  discountValue?: number;
  isCustomPrice?: boolean;
  isQuickAdd?: boolean;
}

export const ViewInvoice: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { theme } = useTheme();
  const { user: currentUser } = useAuth();
  const isSinhala = i18n.language === 'si';

  const [showActions, setShowActions] = useState(false);

  // Find the invoice
  const invoice = useMemo(() => {
    return mockInvoices.find(inv => inv.id === id) || null;
  }, [id]);

  // Find the customer
  const customer = useMemo(() => {
    if (!invoice) return null;
    if (invoice.customerId === 'walk-in') {
      return {
        id: 'walk-in',
        name: 'Walk-in Customer',
        businessName: 'Walk-in Customer',
        email: '',
        phone: '',
        address: '',
        registrationDate: new Date().toISOString(),
        totalSpent: 0,
        customerType: 'regular' as const,
        isActive: true,
        loanBalance: 0
      };
    }
    return mockCustomers.find(c => c.id === invoice.customerId) || null;
  }, [invoice]);

  // Get product details for items
  const getProductDetails = (productId: string) => {
    return mockProducts.find(p => p.id === productId);
  };

  const handleCopyInvoiceNumber = () => {
    if (invoice) {
      navigator.clipboard.writeText(invoice.invoiceNumber);
    }
  };

  if (!invoice) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${
        theme === 'dark' ? 'bg-slate-900' : 'bg-slate-50'
      }`}>
        <div className="text-center">
          <div className={`w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center ${
            theme === 'dark' ? 'bg-red-500/20' : 'bg-red-100'
          }`}>
            <XCircle className="w-10 h-10 text-red-500" />
          </div>
          <h2 className={`text-2xl font-bold mb-2 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
            Invoice Not Found
          </h2>
          <p className={`mb-6 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
            The invoice you're looking for doesn't exist or has been deleted.
          </p>
          <button
            onClick={() => navigate('/invoices')}
            className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-medium transition-all"
          >
            Back to Invoices
          </button>
        </div>
      </div>
    );
  }

  const statusConfig = {
    paid: { 
      label: 'Paid', 
      icon: CheckCircle, 
      color: 'emerald',
      bgClass: 'bg-emerald-500/10 border-emerald-500/30',
      textClass: 'text-emerald-400'
    },
    pending: { 
      label: 'Pending', 
      icon: Clock, 
      color: 'amber',
      bgClass: 'bg-amber-500/10 border-amber-500/30',
      textClass: 'text-amber-400'
    },
    overdue: { 
      label: 'Overdue', 
      icon: AlertTriangle, 
      color: 'red',
      bgClass: 'bg-red-500/10 border-red-500/30',
      textClass: 'text-red-400'
    },
    cancelled: { 
      label: 'Cancelled', 
      icon: XCircle, 
      color: 'slate',
      bgClass: 'bg-slate-500/10 border-slate-500/30',
      textClass: 'text-slate-400'
    }
  };

  const paymentMethodConfig = {
    cash: { label: 'Cash', icon: Banknote, emoji: '💵', color: 'emerald' },
    card: { label: 'Card', icon: CreditCard, emoji: '💳', color: 'blue' },
    bank_transfer: { label: 'Bank Transfer', icon: Building2, emoji: '🏦', color: 'purple' },
    credit: { label: 'Credit/Due', icon: Receipt, emoji: '📝', color: 'amber' }
  };

  const status = statusConfig[invoice.status];
  const StatusIcon = status.icon;
  const paymentMethod = paymentMethodConfig[invoice.paymentMethod || 'cash'];
  const PaymentIcon = paymentMethod.icon;

  // Calculate discount amount based on type
  const discountAmount = invoice.discountType === 'percentage' 
    ? (invoice.subtotal * (invoice.discountValue || invoice.discount || 0)) / 100 
    : (invoice.discountValue || invoice.discount || 0);

  return (
    <div className={`min-h-screen p-6 ${theme === 'dark' ? 'bg-slate-900' : 'bg-slate-50'}`}>
      {/* Header */}
      <div className="max-w-6xl mx-auto mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/invoices')}
              className={`p-2.5 rounded-xl border transition-all ${
                theme === 'dark'
                  ? 'border-slate-700 hover:bg-slate-800 text-slate-400'
                  : 'border-slate-200 hover:bg-slate-100 text-slate-600'
              }`}
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                  {invoice.invoiceNumber}
                </h1>
                <button
                  onClick={handleCopyInvoiceNumber}
                  className={`p-1.5 rounded-lg transition-all ${
                    theme === 'dark' ? 'hover:bg-slate-800 text-slate-500' : 'hover:bg-slate-200 text-slate-400'
                  }`}
                  title="Copy invoice number"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
              <p className={`text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                Created on {new Date(invoice.issueDate).toLocaleDateString('en-GB', { 
                  weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' 
                })}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Status Badge */}
            <div className={`px-4 py-2 rounded-xl border ${status.bgClass}`}>
              <div className="flex items-center gap-2">
                <StatusIcon className={`w-4 h-4 ${status.textClass}`} />
                <span className={`font-semibold ${status.textClass}`}>{status.label}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <button
              onClick={() => {
                if (invoice && customer) {
                  printInvoice(invoice, customer, 'en', currentUser?.name || 'Admin User').catch(() => {});
                }
              }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all ${
                theme === 'dark'
                  ? 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700'
                  : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-sm'
              }`}
            >
              <Printer className="w-4 h-4" />
              Print
            </button>

            <button
              onClick={() => navigate(`/invoices/${id}/edit`)}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white rounded-xl font-medium transition-all shadow-lg shadow-blue-500/20"
            >
              <Edit3 className="w-4 h-4" />
              Edit Invoice
            </button>

            {/* More Actions */}
            <div className="relative">
              <button
                onClick={() => setShowActions(!showActions)}
                className={`p-2.5 rounded-xl border transition-all ${
                  theme === 'dark'
                    ? 'border-slate-700 hover:bg-slate-800 text-slate-400'
                    : 'border-slate-200 hover:bg-slate-100 text-slate-600'
                }`}
              >
                <MoreVertical className="w-5 h-5" />
              </button>
              {showActions && (
                <div className={`absolute right-0 mt-2 w-48 rounded-xl border shadow-xl z-10 ${
                  theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'
                }`}>
                  <button className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-all ${
                    theme === 'dark' ? 'hover:bg-slate-700 text-slate-300' : 'hover:bg-slate-50 text-slate-700'
                  }`}>
                    <Download className="w-4 h-4" /> Download PDF
                  </button>
                  <button className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-all ${
                    theme === 'dark' ? 'hover:bg-slate-700 text-slate-300' : 'hover:bg-slate-50 text-slate-700'
                  }`}>
                    <Share2 className="w-4 h-4" /> Share Invoice
                  </button>
                  <button className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-all ${
                    theme === 'dark' ? 'hover:bg-slate-700 text-slate-300' : 'hover:bg-slate-50 text-slate-700'
                  }`}>
                    <Copy className="w-4 h-4" /> Duplicate
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Main Invoice Preview */}
        <div className="xl:col-span-2">
          <div className={`rounded-2xl overflow-hidden shadow-2xl ${
            theme === 'dark' ? 'shadow-black/50' : 'shadow-slate-300/50'
          }`}>
            {/* Invoice Header */}
            <div className="bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 p-8 text-white">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-3xl font-bold tracking-tight">LIYANAGE HARDWARE</h2>
                  <p className="text-amber-200 text-sm mt-1 tracking-widest">QUALITY BUILDING MATERIALS</p>
                  <div className="mt-4 text-amber-100 text-sm space-y-1">
                    <p className="flex items-center gap-2"><MapPin className="w-4 h-4" /> Hakmana Rd, Deiyandara</p>
                    <p className="flex items-center gap-2"><Phone className="w-4 h-4" /> 0773751805 • 0412268217</p>
                    <p className="flex items-center gap-2"><Mail className="w-4 h-4" /> info@liyanage.lk</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-4xl font-bold tracking-wider">INVOICE</p>
                  <p className="text-blue-200 text-lg mt-2">{invoice.invoiceNumber}</p>
                  <div className={`inline-flex items-center gap-2 mt-3 px-4 py-2 rounded-full ${
                    invoice.status === 'paid' ? 'bg-emerald-500' :
                    invoice.status === 'pending' ? 'bg-amber-500' :
                    invoice.status === 'overdue' ? 'bg-red-500' : 'bg-slate-500'
                  }`}>
                    <StatusIcon className="w-4 h-4" />
                    <span className="font-semibold">{status.label.toUpperCase()}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Invoice Body */}
            <div className={`p-8 ${theme === 'dark' ? 'bg-slate-900' : 'bg-white'}`}>
              {/* Customer & Date Row */}
              <div className="grid grid-cols-2 gap-6 mb-8">
                <div className={`p-5 rounded-xl border-l-4 border-blue-500 ${
                  theme === 'dark' ? 'bg-slate-800/50' : 'bg-slate-50'
                }`}>
                  <p className={`text-xs font-bold uppercase tracking-wider mb-2 ${
                    theme === 'dark' ? 'text-blue-400' : 'text-blue-600'
                  }`}>Bill To</p>
                  <p className={`text-lg font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                    {isSinhala && customer && customer.id !== 'walk-in' && customer.nameSi ? customer.nameSi : invoice.customerName}
                  </p>
                  {customer && customer.id !== 'walk-in' && (
                    <>
                      <p className={`text-sm mt-1 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                        {customer.businessName}
                      </p>
                      <p className={`text-sm ${theme === 'dark' ? 'text-slate-500' : 'text-slate-500'}`}>
                        📞 {customer.phone}
                      </p>
                      {customer.customerType === 'wholesale' && (
                        <span className="inline-block mt-2 px-2 py-1 text-xs font-semibold bg-purple-500/10 text-purple-400 rounded">
                          Wholesale Customer
                        </span>
                      )}
                    </>
                  )}
                </div>

                <div className={`p-5 rounded-xl border-l-4 border-purple-500 ${
                  theme === 'dark' ? 'bg-slate-800/50' : 'bg-slate-50'
                }`}>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className={`text-xs font-bold uppercase tracking-wider mb-1 ${
                        theme === 'dark' ? 'text-purple-400' : 'text-purple-600'
                      }`}>Issue Date</p>
                      <p className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                        {new Date(invoice.issueDate).toLocaleDateString('en-GB', { 
                          day: '2-digit', month: 'short', year: 'numeric' 
                        })}
                      </p>
                    </div>
                    <div>
                      <p className={`text-xs font-bold uppercase tracking-wider mb-1 ${
                        theme === 'dark' ? 'text-purple-400' : 'text-purple-600'
                      }`}>Due Date</p>
                      <p className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                        {new Date(invoice.dueDate).toLocaleDateString('en-GB', { 
                          day: '2-digit', month: 'short', year: 'numeric' 
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4">
                    <p className={`text-xs font-bold uppercase tracking-wider mb-1 ${
                      theme === 'dark' ? 'text-purple-400' : 'text-purple-600'
                    }`}>Payment Method</p>
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{invoice.paymentMethod === 'cash' ? '💵' : invoice.paymentMethod === 'card' ? '💳' : invoice.paymentMethod === 'bank_transfer' ? '🏦' : '📝'}</span>
                      <span className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                        {paymentMethod.label}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Items Table */}
              <div className="mb-8">
                <div className={`rounded-xl overflow-hidden border ${
                  theme === 'dark' ? 'border-slate-700' : 'border-slate-200'
                }`}>
                  <table className="w-full">
                    <thead>
                      <tr className={theme === 'dark' ? 'bg-slate-800' : 'bg-slate-100'}>
                        <th className={`py-4 px-4 text-left text-xs font-bold uppercase tracking-wider ${
                          theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
                        }`}>#</th>
                        <th className={`py-4 px-4 text-left text-xs font-bold uppercase tracking-wider ${
                          theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
                        }`}>{t('tableHeaders.itemDescription')}</th>
                        <th className={`py-4 px-4 text-center text-xs font-bold uppercase tracking-wider ${
                          theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
                        }`}>{t('tableHeaders.qty')}</th>
                        <th className={`py-4 px-4 text-right text-xs font-bold uppercase tracking-wider ${
                          theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
                        }`}>{t('tableHeaders.unitPrice')}</th>
                        <th className={`py-4 px-4 text-right text-xs font-bold uppercase tracking-wider ${
                          theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
                        }`}>{t('tableHeaders.total')}</th>
                      </tr>
                    </thead>
                    <tbody className={`divide-y ${theme === 'dark' ? 'divide-slate-700' : 'divide-slate-200'}`}>
                      {invoice.items.map((item, index) => {
                        const extItem = item as ExtendedInvoiceItem;
                        const product = getProductDetails(item.productId);
                        return (
                          <tr key={item.id} className={
                            index % 2 === 1 ? (theme === 'dark' ? 'bg-slate-800/30' : 'bg-slate-50/50') : ''
                          }>
                            <td className={`py-4 px-4 ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>
                              {index + 1}
                            </td>
                            <td className="py-4 px-4">
                              <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                                  theme === 'dark' ? 'bg-blue-500/20' : 'bg-blue-100'
                                }`}>
                                  <Package className="w-5 h-5 text-blue-500" />
                                </div>
                                <div>
                                  <p className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                                    {isSinhala ? ((item as any).productNameSi || item.productName) : item.productName}
                                  </p>
                                  <div className="flex items-center gap-2 mt-1">
                                    {extItem.discountType && (
                                      <span className="px-2 py-0.5 text-xs font-semibold bg-pink-500/10 text-pink-400 rounded-full flex items-center gap-1">
                                        <Percent className="w-3 h-3" />
                                        {extItem.discountType === 'percentage' 
                                          ? `${extItem.discountValue}% off` 
                                          : `Rs.${extItem.discountValue} off`}
                                      </span>
                                    )}
                                    {extItem.isCustomPrice && (
                                      <span className="px-2 py-0.5 text-xs font-semibold bg-cyan-500/10 text-cyan-400 rounded-full flex items-center gap-1">
                                        <Tag className="w-3 h-3" /> Custom
                                      </span>
                                    )}
                                    {extItem.isQuickAdd && (
                                      <span className="px-2 py-0.5 text-xs font-semibold bg-amber-500/10 text-amber-400 rounded-full flex items-center gap-1">
                                        <Zap className="w-3 h-3" /> Quick Add
                                      </span>
                                    )}
                                    {product && (
                                      <span className={`text-xs ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>
                                        SKU: {product.sku}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className={`py-4 px-4 text-center font-medium ${
                              theme === 'dark' ? 'text-slate-300' : 'text-slate-700'
                            }`}>
                              {item.quantity}
                            </td>
                            <td className={`py-4 px-4 text-right font-mono ${
                              theme === 'dark' ? 'text-slate-400' : 'text-slate-600'
                            }`}>
                              Rs. {item.unitPrice.toLocaleString()}
                            </td>
                            <td className={`py-4 px-4 text-right font-mono font-bold ${
                              theme === 'dark' ? 'text-white' : 'text-slate-900'
                            }`}>
                              Rs. {item.total.toLocaleString()}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Totals */}
              <div className="flex justify-end">
                <div className="w-80">
                  <div className={`space-y-3 p-5 rounded-xl ${
                    theme === 'dark' ? 'bg-slate-800/50' : 'bg-slate-50'
                  }`}>
                    <div className="flex justify-between">
                      <span className={theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}>Subtotal</span>
                      <span className={`font-mono ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                        Rs. {invoice.subtotal.toLocaleString()}
                      </span>
                    </div>
                    {discountAmount > 0 && (
                      <div className="flex justify-between text-pink-400">
                        <span>
                          Discount {invoice.discountType === 'percentage' 
                            ? `(${invoice.discountValue || invoice.discount}%)` 
                            : '(Fixed)'}
                        </span>
                        <span className="font-mono">- Rs. {discountAmount.toLocaleString()}</span>
                      </div>
                    )}
                    {(invoice.enableTax || invoice.tax > 0) && (
                      <div className="flex justify-between">
                        <span className={theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}>
                          Tax {invoice.taxRate ? `(${invoice.taxRate}%)` : ''}
                        </span>
                        <span className={`font-mono ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                          Rs. {invoice.tax.toLocaleString()}
                        </span>
                      </div>
                    )}
                    <div className={`flex justify-between pt-4 mt-2 border-t ${
                      theme === 'dark' ? 'border-slate-700' : 'border-slate-200'
                    }`}>
                      <span className={`text-lg font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                        Total
                      </span>
                      <span className="text-2xl font-bold text-emerald-500">
                        Rs. {invoice.total.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {invoice.notes && (
                <div className={`mt-6 p-4 rounded-xl ${
                  theme === 'dark' ? 'bg-amber-500/5 border border-amber-500/20' : 'bg-amber-50 border border-amber-200'
                }`}>
                  <p className={`text-xs font-bold uppercase tracking-wider mb-2 ${
                    theme === 'dark' ? 'text-amber-400' : 'text-amber-700'
                  }`}>📝 Notes</p>
                  <p className={`text-sm ${theme === 'dark' ? 'text-amber-200/70' : 'text-amber-800'}`}>
                    {invoice.notes}
                  </p>
                </div>
              )}
            </div>

            {/* Invoice Footer */}
            <div className={`px-8 py-6 ${
              theme === 'dark' ? 'bg-slate-800/50 border-t border-slate-700' : 'bg-slate-50 border-t border-slate-200'
            }`}>
              <p className={`text-center text-sm font-medium ${
                theme === 'dark' ? 'text-amber-400' : 'text-amber-600'
              }`}>
                Thank you for your business!
              </p>
              <p className={`text-center text-xs mt-1 ${theme === 'dark' ? 'text-slate-500' : 'text-slate-500'}`}>
                Liyanage Hardware • Hakmana Rd, Deiyandara • 📞 0773751805 / 0412268217 • info@liyanage.lk
              </p>
              <p className={`text-center text-[10px] mt-2 ${theme === 'dark' ? 'text-slate-600' : 'text-slate-400'}`}>
                © 2025 Powered by <span className="font-semibold">Nebulainfinite</span>
              </p>
            </div>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          {/* Quick Stats */}
          <div className={`p-6 rounded-2xl border ${
            theme === 'dark' ? 'bg-slate-800/30 border-slate-700' : 'bg-white border-slate-200 shadow-sm'
          }`}>
            <h3 className={`font-bold mb-4 flex items-center gap-2 ${
              theme === 'dark' ? 'text-white' : 'text-slate-900'
            }`}>
              <TrendingUp className="w-5 h-5 text-blue-500" />
              Invoice Summary
            </h3>
            
            <div className="space-y-4">
              <div className={`p-4 rounded-xl ${theme === 'dark' ? 'bg-slate-800' : 'bg-slate-50'}`}>
                <p className={`text-xs font-medium mb-1 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                  Total Amount
                </p>
                <p className="text-2xl font-bold text-emerald-500">
                  Rs. {invoice.total.toLocaleString()}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className={`p-3 rounded-xl ${theme === 'dark' ? 'bg-slate-800' : 'bg-slate-50'}`}>
                  <p className={`text-xs font-medium mb-1 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                    Items
                  </p>
                  <p className={`text-lg font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                    {invoice.items.length}
                  </p>
                </div>
                <div className={`p-3 rounded-xl ${theme === 'dark' ? 'bg-slate-800' : 'bg-slate-50'}`}>
                  <p className={`text-xs font-medium mb-1 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                    Quantity
                  </p>
                  <p className={`text-lg font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                    {invoice.items.reduce((sum, item) => sum + item.quantity, 0)}
                  </p>
                </div>
              </div>

              {invoice.discount && invoice.discount > 0 && (
                <div className={`p-3 rounded-xl ${theme === 'dark' ? 'bg-pink-500/10' : 'bg-pink-50'}`}>
                  <p className={`text-xs font-medium mb-1 text-pink-400`}>
                    Discount Applied
                  </p>
                  <p className="text-lg font-bold text-pink-400">
                    {invoice.discount}% (Rs. {discountAmount.toLocaleString()})
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Customer Card */}
          {customer && (
            <div className={`p-6 rounded-2xl border ${
              theme === 'dark' ? 'bg-slate-800/30 border-slate-700' : 'bg-white border-slate-200 shadow-sm'
            }`}>
              <h3 className={`font-bold mb-4 flex items-center gap-2 ${
                theme === 'dark' ? 'text-white' : 'text-slate-900'
              }`}>
                <User className="w-5 h-5 text-purple-500" />
                Customer Details
              </h3>
              
              <div className="flex items-center gap-4 mb-4">
                <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-xl font-bold ${
                  theme === 'dark' ? 'bg-purple-500/20 text-purple-400' : 'bg-purple-100 text-purple-600'
                }`}>
                  {customer.name.charAt(0)}
                </div>
                <div>
                  <p className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                    {customer.name}
                  </p>
                  <p className={`text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                    {customer.businessName}
                  </p>
                </div>
              </div>

              {customer.id !== 'walk-in' && (
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Phone className={`w-4 h-4 ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`} />
                    <span className={theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}>{customer.phone}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Mail className={`w-4 h-4 ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`} />
                    <span className={theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}>{customer.email}</span>
                  </div>
                  {customer.customerType && (
                    <div className={`mt-3 px-3 py-2 rounded-lg text-center ${
                      customer.customerType === 'wholesale' 
                        ? 'bg-purple-500/10 text-purple-400' 
                        : customer.customerType === 'credit'
                        ? 'bg-amber-500/10 text-amber-400'
                        : 'bg-blue-500/10 text-blue-400'
                    }`}>
                      <span className="text-sm font-semibold capitalize">{customer.customerType} Customer</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Timeline / Activity */}
          <div className={`p-6 rounded-2xl border ${
            theme === 'dark' ? 'bg-slate-800/30 border-slate-700' : 'bg-white border-slate-200 shadow-sm'
          }`}>
            <h3 className={`font-bold mb-4 flex items-center gap-2 ${
              theme === 'dark' ? 'text-white' : 'text-slate-900'
            }`}>
              <Clock className="w-5 h-5 text-cyan-500" />
              Activity
            </h3>
            
            <div className="space-y-4">
              <div className="flex gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  theme === 'dark' ? 'bg-emerald-500/20' : 'bg-emerald-100'
                }`}>
                  <FileText className="w-4 h-4 text-emerald-500" />
                </div>
                <div>
                  <p className={`text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                    Invoice Created
                  </p>
                  <p className={`text-xs ${theme === 'dark' ? 'text-slate-500' : 'text-slate-500'}`}>
                    {new Date(invoice.issueDate).toLocaleDateString('en-GB', { 
                      day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>

              {invoice.status === 'paid' && (
                <div className="flex gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    theme === 'dark' ? 'bg-blue-500/20' : 'bg-blue-100'
                  }`}>
                    <CheckCircle className="w-4 h-4 text-blue-500" />
                  </div>
                  <div>
                    <p className={`text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                      Payment Received
                    </p>
                    <p className={`text-xs ${theme === 'dark' ? 'text-slate-500' : 'text-slate-500'}`}>
                      Via {paymentMethod.label}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};

export default ViewInvoice;
