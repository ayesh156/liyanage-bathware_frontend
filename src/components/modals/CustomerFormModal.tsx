import React, { useState, useEffect } from 'react';
import { Customer } from '../../types/index';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../contexts/ThemeContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { User, Languages, IdCard, Phone, Mail, MapPin } from 'lucide-react';

interface CustomerFormModalProps {
  isOpen: boolean;
  customer?: Customer;
  onClose: () => void;
  onSave: (customer: Customer) => void;
}

export const CustomerFormModal: React.FC<CustomerFormModalProps> = ({
  isOpen,
  customer,
  onClose,
  onSave,
}) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const isEditing = !!customer;
  const isDark = theme === 'dark';

  const [formData, setFormData] = useState({
    name: '',
    nameSi: '',
    nic: '',
    phone: '',
    email: '',
    address: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (customer) {
      setFormData({
        name: customer.name,
        nameSi: customer.nameSi || '',
        nic: customer.nic || '',
        phone: customer.phone,
        email: customer.email,
        address: customer.address,
      });
    } else {
      setFormData({
        name: '',
        nameSi: '',
        nic: '',
        phone: '',
        email: '',
        address: '',
      });
    }
    setErrors({});
  }, [customer, isOpen]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) {
      newErrors.name = 'Customer name is required';
    }
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    }
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    }
    if (!formData.address.trim()) {
      newErrors.address = 'Address is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    const newCustomer: Customer = {
      id: customer?.id || `cust-${Date.now()}`,
      name: formData.name,
      nameSi: formData.nameSi || undefined,
      nic: formData.nic || undefined,
      phone: formData.phone,
      email: formData.email,
      address: formData.address,
      customerType: customer?.customerType || 'regular',
      loanBalance: customer?.loanBalance || 0,
    };
    onSave(newCustomer);
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleDialogOpenChange = (open: boolean) => {
    if (!open) onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleDialogOpenChange}>
      <DialogContent className={`sm:max-w-[460px] max-h-[90vh] overflow-y-auto ${
        isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
      }`}>
        <form onSubmit={handleSubmit}>
          <DialogHeader className="pb-2">
            <DialogTitle className={`flex items-center gap-2 text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>
              <div className="p-1.5 rounded-lg bg-gradient-to-br from-orange-500 to-rose-500">
                <User className="w-3.5 h-3.5 text-white" />
              </div>
              {isEditing ? t('common.edit') + ' ' + t('customers.customer') : t('customers.addCustomer')}
            </DialogTitle>
            <DialogDescription className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              {isEditing
                ? t('customers.updateInfo')
                : t('customers.addNewCustomer')}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-3 py-2">
            {/* Customer Name */}
            <div className="space-y-1">
              <Label htmlFor="name" className={`flex items-center gap-1.5 text-[11px] ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                <User className="w-3.5 h-3.5" />
                {t('customers.customerName')} <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="e.g., Ayesh Chathuranga"
                className={`h-8 text-xs ${
                  isDark
                    ? 'bg-slate-800 border-slate-700 text-white placeholder:text-slate-500'
                    : 'bg-white border-slate-200'
                } ${errors.name ? 'border-red-500' : ''}`}
              />
              {errors.name && (
                <p className="text-[10px] text-red-500">{errors.name}</p>
              )}
            </div>

            {/* Name (Sinhala) */}
            <div className="space-y-1">
              <Label htmlFor="nameSi" className={`flex items-center gap-1.5 text-[11px] ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                <Languages className="w-3.5 h-3.5" />
                {t('customers.sinhalaName')}
              </Label>
              <Input
                id="nameSi"
                value={formData.nameSi}
                onChange={(e) => handleChange('nameSi', e.target.value)}
                placeholder="e.g., අයේෂ් චතුරංග"
                className={`h-8 text-xs ${
                  isDark
                    ? 'bg-slate-800 border-slate-700 text-white placeholder:text-slate-500'
                    : 'bg-white border-slate-200'
                }`}
              />
            </div>

            {/* NIC Number */}
            <div className="space-y-1">
              <Label htmlFor="nic" className={`flex items-center gap-1.5 text-[11px] ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                <IdCard className="w-3.5 h-3.5" />
                {t('customers.nic')}
              </Label>
              <Input
                id="nic"
                value={formData.nic}
                onChange={(e) => handleChange('nic', e.target.value)}
                placeholder="e.g., 19921100xxxx or xxxxxxxxV"
                className={`h-8 text-xs ${
                  isDark
                    ? 'bg-slate-800 border-slate-700 text-white placeholder:text-slate-500'
                    : 'bg-white border-slate-200'
                }`}
              />
            </div>

            {/* Phone Number */}
            <div className="space-y-1">
              <Label htmlFor="phone" className={`flex items-center gap-1.5 text-[11px] ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                <Phone className="w-3.5 h-3.5" />
                {t('common.phone')} <span className="text-red-500">*</span>
              </Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                placeholder="e.g., +94 7x xxx xxxx"
                className={`h-8 text-xs ${
                  isDark
                    ? 'bg-slate-800 border-slate-700 text-white placeholder:text-slate-500'
                    : 'bg-white border-slate-200'
                } ${errors.phone ? 'border-red-500' : ''}`}
              />
              {errors.phone && (
                <p className="text-[10px] text-red-500">{errors.phone}</p>
              )}
            </div>

            {/* Email Address */}
            <div className="space-y-1">
              <Label htmlFor="email" className={`flex items-center gap-1.5 text-[11px] ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                <Mail className="w-3.5 h-3.5" />
                {t('common.email')} <span className="text-red-500">*</span>
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                placeholder="e.g., name@example.com"
                className={`h-8 text-xs ${
                  isDark
                    ? 'bg-slate-800 border-slate-700 text-white placeholder:text-slate-500'
                    : 'bg-white border-slate-200'
                } ${errors.email ? 'border-red-500' : ''}`}
              />
              {errors.email && (
                <p className="text-[10px] text-red-500">{errors.email}</p>
              )}
            </div>

            {/* Physical Address */}
            <div className="space-y-1">
              <Label htmlFor="address" className={`flex items-center gap-1.5 text-[11px] ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                <MapPin className="w-3.5 h-3.5" />
                {t('common.address')} <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="address"
                value={formData.address}
                onChange={(e) => handleChange('address', e.target.value)}
                placeholder={t('customers.enterAddress')}
                rows={2}
                className={`resize-none text-xs ${
                  isDark
                    ? 'bg-slate-800 border-slate-700 text-white placeholder:text-slate-500'
                    : 'bg-white border-slate-200'
                } ${errors.address ? 'border-red-500' : ''}`}
              />
              {errors.address && (
                <p className="text-[10px] text-red-500">{errors.address}</p>
              )}
            </div>
          </div>

          <DialogFooter className="pt-3 gap-1.5 sm:gap-1.5">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              size="sm"
              className={`text-xs h-8 ${isDark ? 'border-slate-700 hover:bg-slate-800' : ''}`}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              className="text-xs h-8 bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600 text-white"
            >
              {isEditing ? 'Save Changes' : 'Create Customer'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};