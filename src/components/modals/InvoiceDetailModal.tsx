import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { Invoice, Customer } from '../../types/index';
import { useTheme } from '../../contexts/ThemeContext';
import { 
  X, FileText, Calendar, User, Package, CreditCard, 
  Clock, CheckCircle2, AlertCircle, XCircle, Printer 
} from 'lucide-react';

interface InvoiceDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: Invoice | null;
  customer?: Customer;
  onPrint?: () => void;
}

export const InvoiceDetailModal: React.FC<InvoiceDetailModalProps> = ({
  isOpen,
  onClose,
  invoice,
  customer,
  onPrint,
}) => {
  const { theme } = useTheme();
  
  if (!invoice) return null;

  const formatCurrency = (amount: number) => {
    return `Rs. ${amount.toLocaleString('en-LK', { minimumFractionDigits: 2 })}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'overdue':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      default:
        return <XCircle className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30';
      case 'pending':
        return 'bg-amber-500/15 text-amber-400 border border-amber-500/30';
      case 'overdue':
        return 'bg-red-500/15 text-red-400 border border-red-500/30';
      default:
        return 'bg-slate-500/15 text-slate-400 border border-slate-500/30';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={`max-w-5xl max-h-[90vh] overflow-y-auto p-0 ${
        theme === 'dark' ? 'bg-slate-900 border-slate-700/50' : 'bg-white border-slate-200'
      }`}>
        <DialogHeader className="sr-only">
          <DialogTitle>{invoice.invoiceNumber}</DialogTitle>
          <DialogDescription>View complete invoice details and information</DialogDescription>
        </DialogHeader>
        {/* Header with gradient */}
        <div className="bg-gradient-to-r from-blue-600 to-cyan-600 p-6 text-white">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">{invoice.invoiceNumber}</h2>
                <p className="text-blue-100 text-sm">Invoice Details</p>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Status & Dates Row */}
          <div className="flex flex-wrap gap-4">
            <div className={`flex-1 min-w-[200px] rounded-xl p-4 border ${
              theme === 'dark' ? 'bg-slate-800/50 border-slate-700/50' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className={`flex items-center gap-2 text-sm mb-2 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                {getStatusIcon(invoice.status)}
                <span>Status</span>
              </div>
              <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-semibold ${getStatusColor(invoice.status)}`}>
                {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
              </span>
            </div>
            <div className={`flex-1 min-w-[200px] rounded-xl p-4 border ${
              theme === 'dark' ? 'bg-slate-800/50 border-slate-700/50' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className={`flex items-center gap-2 text-sm mb-2 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                <Calendar className="w-4 h-4" />
                <span>Issue Date</span>
              </div>
              <p className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                {formatDate(invoice.issueDate)}
              </p>
            </div>
            <div className={`flex-1 min-w-[200px] rounded-xl p-4 border ${
              theme === 'dark' ? 'bg-slate-800/50 border-slate-700/50' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className={`flex items-center gap-2 text-sm mb-2 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                <Calendar className="w-4 h-4" />
                <span>Due Date</span>
              </div>
              <p className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                {formatDate(invoice.dueDate)}
              </p>
            </div>
          </div>

          {/* Customer Info */}
          <div className={`rounded-xl p-4 border ${
            theme === 'dark' ? 'bg-slate-800/50 border-slate-700/50' : 'bg-slate-50 border-slate-200'
          }`}>
            <div className={`flex items-center gap-2 text-sm mb-3 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
              <User className="w-4 h-4" />
              <span>Customer Information</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className={`font-semibold text-lg ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                  {invoice.customerName}
                </p>
                {customer && (
                  <>
                    <p className={theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}>{customer.businessName}</p>
                    <p className={`text-sm mt-2 ${theme === 'dark' ? 'text-slate-500' : 'text-slate-500'}`}>{customer.address}</p>
                  </>
                )}
              </div>
              {customer && (
                <div className="text-sm space-y-1">
                  <p className={theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}>
                    <span className={theme === 'dark' ? 'text-slate-500' : 'text-slate-500'}>Email:</span> {customer.email}
                  </p>
                  <p className={theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}>
                    <span className={theme === 'dark' ? 'text-slate-500' : 'text-slate-500'}>Phone:</span> {customer.phone}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Items */}
          <div>
            <div className={`flex items-center gap-2 text-sm mb-3 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
              <Package className="w-4 h-4" />
              <span>Invoice Items ({invoice.items.length})</span>
            </div>
            <div className={`rounded-xl overflow-hidden border ${
              theme === 'dark' ? 'bg-slate-800/50 border-slate-700/50' : 'bg-slate-50 border-slate-200'
            }`}>
              <table className="w-full">
                <thead>
                  <tr className={theme === 'dark' ? 'bg-slate-700/50' : 'bg-slate-200'}>
                    <th className={`px-4 py-3 text-left text-xs font-semibold uppercase ${
                      theme === 'dark' ? 'text-slate-300' : 'text-slate-600'
                    }`}>Product</th>
                    <th className={`px-4 py-3 text-center text-xs font-semibold uppercase ${
                      theme === 'dark' ? 'text-slate-300' : 'text-slate-600'
                    }`}>Qty</th>
                    <th className={`px-4 py-3 text-right text-xs font-semibold uppercase ${
                      theme === 'dark' ? 'text-slate-300' : 'text-slate-600'
                    }`}>Price</th>
                    <th className={`px-4 py-3 text-right text-xs font-semibold uppercase ${
                      theme === 'dark' ? 'text-slate-300' : 'text-slate-600'
                    }`}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.items.map((item, index) => (
                    <tr key={item.id} className={
                      theme === 'dark' 
                        ? (index % 2 === 0 ? 'bg-slate-800/30' : 'bg-slate-800/10')
                        : (index % 2 === 0 ? 'bg-white' : 'bg-slate-50')
                    }>
                      <td className={`px-4 py-3 text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                        {item.productName}
                      </td>
                      <td className={`px-4 py-3 text-sm text-center ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                        {item.quantity}
                      </td>
                      <td className={`px-4 py-3 text-sm text-right ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                        {formatCurrency(item.unitPrice)}
                      </td>
                      <td className="px-4 py-3 text-sm text-right font-semibold text-emerald-400">
                        {formatCurrency(item.quantity * item.unitPrice)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Totals */}
          <div className="flex justify-end">
            <div className="w-72 space-y-2">
              <div className={`flex justify-between py-2 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                <span>Subtotal</span>
                <span>{formatCurrency(invoice.subtotal)}</span>
              </div>
              <div className={`flex justify-between py-2 border-b ${
                theme === 'dark' ? 'text-slate-400 border-slate-700' : 'text-slate-600 border-slate-200'
              }`}>
                <span>Tax (15%)</span>
                <span>{formatCurrency(invoice.tax)}</span>
              </div>
              <div className={`flex justify-between py-3 text-lg font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                <span>Total</span>
                <span className="text-emerald-400">{formatCurrency(invoice.total)}</span>
              </div>
            </div>
          </div>

          {/* Notes */}
          {invoice.notes && (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
              <p className="text-xs font-semibold text-amber-400 uppercase mb-2">Notes</p>
              <p className="text-sm text-amber-300">{invoice.notes}</p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className={`border-t p-4 flex justify-end gap-3 ${
          theme === 'dark' ? 'border-slate-700/50' : 'border-slate-200'
        }`}>
          {onPrint && (
            <button
              onClick={onPrint}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white rounded-xl font-medium transition-all"
            >
              <Printer className="w-4 h-4" />
              Print Invoice
            </button>
          )}
          <button
            onClick={onClose}
            className={`px-4 py-2 rounded-xl font-medium transition-colors border ${
              theme === 'dark'
                ? 'bg-slate-700/50 hover:bg-slate-700 text-white border-slate-600/50'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-900 border-slate-300'
            }`}
          >
            Close
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default InvoiceDetailModal;
