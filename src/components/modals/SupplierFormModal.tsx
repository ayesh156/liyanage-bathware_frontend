import React, { useState, useEffect } from 'react';
import { Supplier, SupplierDelivery } from '../../types/index';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../contexts/ThemeContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { 
  Truck, User, Mail, Phone, MapPin, Save, Banknote, CreditCard,
  DollarSign, Calendar, Plus, Trash2, Package
} from 'lucide-react';

interface SupplierFormModalProps {
  isOpen: boolean;
  supplier?: Supplier;
  onClose: () => void;
  onSave: (supplier: Supplier) => void;
}

interface SupplierFormData {
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  paymentType: 'cash' | 'credit';
  creditLimit?: number;
  creditBalance?: number;
  creditDueDate?: string;
  isActive: boolean;
}

export const SupplierFormModal: React.FC<SupplierFormModalProps> = ({
  isOpen,
  supplier,
  onClose,
  onSave,
}) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  
  const [formData, setFormData] = useState<SupplierFormData>({
    name: '',
    contactPerson: '',
    email: '',
    phone: '',
    address: '',
    paymentType: 'cash',
    creditLimit: 0,
    creditBalance: 0,
    creditDueDate: '',
    isActive: true,
  });

  useEffect(() => {
    if (supplier) {
      setFormData({
        name: supplier.name,
        contactPerson: supplier.contactPerson,
        email: supplier.email,
        phone: supplier.phone,
        address: supplier.address,
        paymentType: supplier.paymentType,
        creditLimit: supplier.creditLimit || 0,
        creditBalance: supplier.creditBalance || 0,
        creditDueDate: supplier.creditDueDate || '',
        isActive: supplier.isActive,
      });
    } else {
      setFormData({
        name: '',
        contactPerson: '',
        email: '',
        phone: '',
        address: '',
        paymentType: 'cash',
        creditLimit: 0,
        creditBalance: 0,
        creditDueDate: '',
        isActive: true,
      });
    }
  }, [supplier, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newSupplier: Supplier = {
      id: supplier?.id || `sup-${Date.now()}`,
      name: formData.name,
      contactPerson: formData.contactPerson,
      email: formData.email,
      phone: formData.phone,
      address: formData.address,
      paymentType: formData.paymentType,
      creditLimit: formData.paymentType === 'credit' ? formData.creditLimit : undefined,
      creditBalance: formData.paymentType === 'credit' ? formData.creditBalance : undefined,
      creditDueDate: formData.paymentType === 'credit' ? formData.creditDueDate : undefined,
      isActive: formData.isActive,
      deliveries: supplier?.deliveries || [],
    };
    onSave(newSupplier);
  };

  if (!isOpen) return null;

  const isEditing = !!supplier;
  const inputClasses = `w-full px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all text-sm ${
    theme === 'dark'
      ? 'border-slate-700 bg-slate-800/50 text-white placeholder-slate-500'
      : 'border-slate-300 bg-slate-50 text-slate-900 placeholder-slate-400'
  }`;
  const labelClasses = `text-xs font-medium ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={`max-w-2xl max-h-[90vh] overflow-y-auto p-0 ${
        theme === 'dark' ? 'bg-slate-900 border-slate-700/50' : 'bg-white border-slate-200'
      }`}>
        <DialogHeader className="sr-only">
          <DialogTitle>{isEditing ? t('suppliers.editSupplier') : t('suppliers.addSupplier')}</DialogTitle>
          <DialogDescription>
            {isEditing ? t('suppliers.editDescription') : t('suppliers.addDescription')}
          </DialogDescription>
        </DialogHeader>
        {/* Gradient Header */}
        <div className={`p-5 text-white ${isEditing 
          ? 'bg-gradient-to-r from-amber-500 via-orange-500 to-red-500' 
          : 'bg-gradient-to-r from-orange-500 via-rose-500 to-pink-500'
        }`} aria-hidden="true">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold">
                {isEditing ? t('suppliers.editSupplier') : t('suppliers.addSupplier')}
              </h2>
              <p className="text-white/80 text-sm">
                {t('suppliers.subtitle')}
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className={`${labelClasses} flex items-center gap-1`}>
                <Truck className="w-3.5 h-3.5" /> {t('suppliers.supplierName')} *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className={inputClasses}
                placeholder="e.g., INSEE Cement Ltd."
              />
            </div>
            <div className="space-y-1.5">
              <label className={`${labelClasses} flex items-center gap-1`}>
                <User className="w-3.5 h-3.5" /> {t('suppliers.contactPerson')} *
              </label>
              <input
                type="text"
                required
                value={formData.contactPerson}
                onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                className={inputClasses}
                placeholder="e.g., John Silva"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className={`${labelClasses} flex items-center gap-1`}>
                <Mail className="w-3.5 h-3.5" /> {t('suppliers.email')} *
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className={inputClasses}
                placeholder="supplier@example.com"
              />
            </div>
            <div className="space-y-1.5">
              <label className={`${labelClasses} flex items-center gap-1`}>
                <Phone className="w-3.5 h-3.5" /> {t('suppliers.phone')} *
              </label>
              <input
                type="tel"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className={inputClasses}
                placeholder="077 123 4567"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className={`${labelClasses} flex items-center gap-1`}>
              <MapPin className="w-3.5 h-3.5" /> {t('suppliers.address')}
            </label>
            <textarea
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              rows={2}
              className={`${inputClasses} resize-none`}
              placeholder="Full address..."
            />
          </div>

          {/* Payment Type Selection */}
          <div className="space-y-3">
            <label className={`${labelClasses} flex items-center gap-1`}>
              <DollarSign className="w-3.5 h-3.5" /> {t('suppliers.paymentType')} *
            </label>
            <div className="flex gap-3">
              <label className={`flex-1 flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
                formData.paymentType === 'cash'
                  ? theme === 'dark' 
                    ? 'border-green-500 bg-green-500/10 text-green-400' 
                    : 'border-green-500 bg-green-50 text-green-700'
                  : theme === 'dark'
                    ? 'border-slate-700 bg-slate-800/50 text-slate-400 hover:border-slate-600'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
              }`}>
                <input
                  type="radio"
                  name="paymentType"
                  value="cash"
                  checked={formData.paymentType === 'cash'}
                  onChange={() => setFormData({ ...formData, paymentType: 'cash' })}
                  className="sr-only"
                />
                <Banknote className="w-6 h-6" />
                <div>
                  <p className="font-medium">{t('suppliers.cashTab')}</p>
                  <p className={`text-xs ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>
                    Pay on delivery
                  </p>
                </div>
              </label>
              <label className={`flex-1 flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
                formData.paymentType === 'credit'
                  ? theme === 'dark' 
                    ? 'border-orange-500 bg-orange-500/10 text-orange-400' 
                    : 'border-orange-500 bg-orange-50 text-orange-700'
                  : theme === 'dark'
                    ? 'border-slate-700 bg-slate-800/50 text-slate-400 hover:border-slate-600'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
              }`}>
                <input
                  type="radio"
                  name="paymentType"
                  value="credit"
                  checked={formData.paymentType === 'credit'}
                  onChange={() => setFormData({ ...formData, paymentType: 'credit' })}
                  className="sr-only"
                />
                <CreditCard className="w-6 h-6" />
                <div>
                  <p className="font-medium">{t('suppliers.creditTab')}</p>
                  <p className={`text-xs ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>
                    Pay later with terms
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* Credit Fields (shown only for credit suppliers) */}
          {formData.paymentType === 'credit' && (
            <div className={`p-4 rounded-xl border ${theme === 'dark' ? 'border-orange-500/30 bg-orange-500/5' : 'border-orange-200 bg-orange-50'}`}>
              <h4 className={`font-medium mb-4 flex items-center gap-2 ${theme === 'dark' ? 'text-orange-400' : 'text-orange-700'}`}>
                <CreditCard className="w-4 h-4" />
                Credit Details
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className={labelClasses}>{t('suppliers.creditLimit')}</label>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    value={formData.creditLimit}
                    onChange={(e) => setFormData({ ...formData, creditLimit: parseFloat(e.target.value) || 0 })}
                    className={inputClasses}
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className={labelClasses}>{t('suppliers.creditBalance')}</label>
                  <input
                    type="number"
                    min="0"
                    step="100"
                    value={formData.creditBalance}
                    onChange={(e) => setFormData({ ...formData, creditBalance: parseFloat(e.target.value) || 0 })}
                    className={inputClasses}
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className={labelClasses}>{t('suppliers.creditDueDate')}</label>
                  <input
                    type="date"
                    value={formData.creditDueDate}
                    onChange={(e) => setFormData({ ...formData, creditDueDate: e.target.value })}
                    className={inputClasses}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Form Actions */}
          <div className={`flex justify-end gap-3 pt-4 border-t ${theme === 'dark' ? 'border-slate-700/50' : 'border-slate-200'}`}>
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2 rounded-xl font-medium transition-colors ${
                theme === 'dark' ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-gradient-to-r from-orange-500 to-rose-500 text-white rounded-xl font-medium shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 transition-all flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {t('common.save')}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
