import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Invoice, Customer } from '../types/index';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { FileText, ArrowLeft, Printer, Download } from 'lucide-react';
import { printInvoice } from '../components/modals/PrintInvoiceModal';

interface InvoiceDetailProps {
  invoices: Invoice[];
  customers?: Customer[];
}

export const InvoiceDetail: React.FC<InvoiceDetailProps> = ({ invoices, customers = [] }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { theme } = useTheme();
  const { user: currentUser } = useAuth();

  const invoice = invoices.find((inv) => inv.id === id);
  const customer = customers.find(c => c.id === invoice?.customerId);

  if (!invoice) {
    return (
      <div className="text-center py-12">
        <FileText className={`w-12 h-12 mx-auto mb-4 ${theme === 'dark' ? 'text-slate-600' : 'text-slate-400'}`} />
        <h2 className={`text-2xl font-bold mb-2 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
          {t('invoices.noInvoices')}
        </h2>
        <button
          onClick={() => navigate('/invoices')}
          className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white rounded-xl font-medium transition-all mt-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Invoices
        </button>
      </div>
    );
  }

  const handlePrint = () => {
    if (!invoice) return;
    const printCustomer = customer || {
      id: invoice.customerId || 'walk-in',
      name: invoice.customerName,
      businessName: invoice.customerName,
      email: '',
      phone: '',
      address: '',
      registrationDate: new Date().toISOString(),
      totalSpent: 0,
      customerType: 'regular' as const,
      isActive: true,
      loanBalance: 0
    };
    printInvoice(invoice, printCustomer, i18n.language as 'en' | 'si', currentUser?.name || 'Admin User').catch(() => {});
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header with Actions */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/invoices')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-colors ${theme === 'dark' ? 'text-slate-300 hover:bg-slate-700/50' : 'text-slate-600 hover:bg-slate-100'}`}
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          <h1 className={`text-3xl font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
            {invoice.invoiceNumber}
          </h1>
        </div>
        <div className="flex gap-2 print:hidden">
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white rounded-xl font-medium transition-all"
          >
            <Printer className="w-4 h-4" />
            Print
          </button>
          <button className={`flex items-center gap-2 px-4 py-2 border rounded-xl font-medium transition-colors ${theme === 'dark' ? 'bg-slate-800/50 hover:bg-slate-700/50 text-white border-slate-700/50' : 'bg-white hover:bg-slate-50 text-slate-900 border-slate-200'}`}>
            <Download className="w-4 h-4" />
            PDF
          </button>
        </div>
      </div>

      {/* Invoice */}
      <div className={`backdrop-blur-sm rounded-2xl border overflow-hidden shadow-xl ${theme === 'dark' ? 'bg-slate-800/30 border-slate-700/50' : 'bg-white border-slate-200'}`}>
        {/* Invoice Header */}
        <div className={`p-8 border-b ${theme === 'dark' ? 'border-slate-700/50' : 'border-slate-200'}`}>
          <div className="flex items-start justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold bg-clip-text text-amber-400 mb-2">
                LIYANAGE HARDWARE
              </h2>
              <p className={theme === 'dark' ? 'text-slate-400' : 'text-amber-600'}>
                Liyanage Hardware Management System
              </p>
            </div>
            <div className="text-right">
              <p className={`text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>Invoice Number</p>
              <p className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                {invoice.invoiceNumber}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-sm">
            <div>
              <p className={`mb-1 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                {t('invoices.issueDate')}
              </p>
              <p className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                {new Date(invoice.issueDate).toLocaleDateString()}
              </p>
            </div>
            <div>
              <p className={`mb-1 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                {t('invoices.dueDate')}
              </p>
              <p className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                {new Date(invoice.dueDate).toLocaleDateString()}
              </p>
            </div>
            <div>
              <p className={`mb-1 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>{t('common.status')}</p>
              <span
                className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                  invoice.status === 'paid'
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                    : invoice.status === 'pending'
                      ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                      : 'bg-red-500/15 text-red-400 border border-red-500/30'
                }`}
              >
                {t(`invoices.${invoice.status}`)}
              </span>
            </div>
          </div>
        </div>

        {/* Customer & Company Info */}
        <div className={`p-8 border-b ${theme === 'dark' ? 'border-slate-700/50' : 'border-slate-200'}`}>
          <div className="grid grid-cols-2 gap-8">
            <div>
              <p className={`text-xs font-semibold uppercase tracking-wide mb-2 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                Bill To
              </p>
              <p className={`text-lg font-semibold mb-1 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                {invoice.customerName}
              </p>
              <p className={`text-sm mb-4 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                Email: (Customer Details)
              </p>
            </div>
            <div>
              <p className={`text-xs font-semibold uppercase tracking-wide mb-2 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                Company Details
              </p>
              <p className={`text-sm mb-1 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                Liyanage Hardware Management System
              </p>
              <p className={`text-sm mb-1 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                Colombo, Sri Lanka
              </p>
              <p className={`text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                info@liyanage.lk
              </p>
            </div>
          </div>
        </div>

        {/* Items Table */}
        <div className={`p-8 border-b ${theme === 'dark' ? 'border-slate-700/50' : 'border-slate-200'}`}>
          <table className="w-full">
            <thead>
              <tr className={`border-b-2 ${theme === 'dark' ? 'border-slate-700' : 'border-slate-200'}`}>
                <th className={`p-3 text-left text-sm font-semibold ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>
                  {t('invoices.itemName')}
                </th>
                <th className={`p-3 text-right text-sm font-semibold ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>
                  {t('invoices.quantity')}
                </th>
                <th className={`p-3 text-right text-sm font-semibold ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>
                  {t('invoices.unitPrice')}
                </th>
                <th className={`p-3 text-right text-sm font-semibold ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>
                  {t('common.total')}
                </th>
              </tr>
            </thead>
            <tbody>
              {invoice.items.map((item) => (
                <tr
                  key={item.id}
                  className={`border-b ${theme === 'dark' ? 'border-slate-700/30 hover:bg-slate-700/20' : 'border-slate-100 hover:bg-slate-50'}`}
                >
                  <td className={`p-3 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{item.productName}</td>
                  <td className={`p-3 text-right ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                    {item.quantity}
                  </td>
                  <td className={`p-3 text-right ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                    Rs. {item.unitPrice.toLocaleString()}
                  </td>
                  <td className="p-3 text-right font-semibold text-emerald-400">
                    Rs. {(item.quantity * item.unitPrice).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className={`p-8 ${theme === 'dark' ? 'bg-gradient-to-r from-slate-800/50 to-slate-900/50' : 'bg-slate-50'}`}>
          <div className="flex justify-end max-w-sm ml-auto">
            <div className="w-full space-y-3">
              <div className={`flex justify-between ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>
                <span className="font-medium">{t('invoices.subtotal')}:</span>
                <span>Rs. {invoice.subtotal.toLocaleString()}</span>
              </div>
              <div className={`flex justify-between ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>
                <span className="font-medium">{t('invoices.tax')} (15%):</span>
                <span>Rs. {invoice.tax.toLocaleString()}</span>
              </div>
              <div className={`flex justify-between text-lg font-bold pt-3 border-t-2 ${theme === 'dark' ? 'border-slate-700 text-white' : 'border-slate-300 text-slate-900'}`}>
                <span>{t('invoices.totalAmount')}:</span>
                <span className="text-emerald-400">
                  Rs. {invoice.total.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className={`p-8 border-t text-center text-sm space-y-2 ${theme === 'dark' ? 'bg-slate-800/30 border-slate-700/50 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
          <p>Thank you for your business!</p>
          <p>
            If you have any questions about this invoice, please contact us at
            info@liyanage.lk
          </p>
          <p className={`text-xs mt-4 ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>
            This is a computer-generated invoice. No signature is required.
          </p>
        </div>
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          body {
            background: white;
          }
          .print\\:hidden {
            display: none !important;
          }
          .max-w-4xl {
            max-width: 100%;
          }
        }
      `}</style>
    </div>
  );
};
