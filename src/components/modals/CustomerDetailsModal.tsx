import React from 'react';
import { Customer } from '../../types/index';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { 
  User, 
  Building2, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  TrendingUp,
  Edit2,
  X,
  Sparkles,
  CreditCard,
  Clock,
  Star,
  Crown,
  ShoppingBag,
  Wallet,
  AlertTriangle,
  IdCard,
  UserCheck,
  UserX
} from 'lucide-react';

interface CustomerDetailsModalProps {
  isOpen: boolean;
  customer: Customer | null;
  onClose: () => void;
  onEdit: (customer: Customer) => void;
}

export const CustomerDetailsModal: React.FC<CustomerDetailsModalProps> = ({
  isOpen,
  customer,
  onClose,
  onEdit,
}) => {
  const { t } = useTranslation();

  if (!isOpen || !customer) return null;

  // Generate initials from customer name
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Calculate customer tier based on total spent
  const getCustomerTier = (totalSpent: number) => {
    if (totalSpent >= 1000000) return { name: 'Platinum', color: 'from-slate-400 to-slate-600', badge: 'bg-slate-500' };
    if (totalSpent >= 500000) return { name: 'Gold', color: 'from-amber-400 to-amber-600', badge: 'bg-amber-500' };
    if (totalSpent >= 200000) return { name: 'Silver', color: 'from-gray-300 to-gray-500', badge: 'bg-gray-400' };
    return { name: 'Bronze', color: 'from-orange-400 to-orange-600', badge: 'bg-orange-500' };
  };

  // Calculate days since registration
  const getDaysSinceRegistration = (date: string) => {
    const regDate = new Date(date);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - regDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Check if loan is overdue
  const isLoanOverdue = () => {
    if (!customer.loanDueDate || customer.loanBalance <= 0) return false;
    return new Date(customer.loanDueDate) < new Date();
  };

  // Get customer type info
  const getCustomerTypeInfo = () => {
    const types = {
      regular: { icon: ShoppingBag, label: t('customers.regular'), color: 'text-blue-500', bg: 'bg-blue-500/10' },
      wholesale: { icon: Crown, label: t('customers.wholesale'), color: 'text-amber-500', bg: 'bg-amber-500/10' },
      credit: { icon: CreditCard, label: t('customers.credit'), color: 'text-purple-500', bg: 'bg-purple-500/10' },
    };
    return types[customer.customerType];
  };

  const tier = getCustomerTier(customer.totalSpent);
  const daysSinceReg = getDaysSinceRegistration(customer.registrationDate);
  const overdue = isLoanOverdue();
  const typeInfo = getCustomerTypeInfo();
  const TypeIcon = typeInfo.icon;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] p-0 overflow-hidden bg-white dark:bg-slate-900 border-0 shadow-2xl flex flex-col">
        <DialogHeader className="sr-only">
          <DialogTitle>{customer.name}</DialogTitle>
          <DialogDescription>View customer details, statistics, and recent invoices</DialogDescription>
        </DialogHeader>
        {/* Animated Background Header */}
        <div className={`relative h-36 flex-shrink-0 overflow-hidden ${
          overdue 
            ? 'bg-gradient-to-br from-red-500 via-orange-500 to-amber-500' 
            : 'bg-gradient-to-br from-orange-500 via-rose-500 to-purple-600'
        }`}>
          {/* Decorative circles */}
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
          <div className="absolute -bottom-20 -left-10 w-60 h-60 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute top-10 left-1/2 w-20 h-20 bg-white/5 rounded-full" />
          
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/20 hover:bg-white/30 text-white transition-all duration-200 backdrop-blur-sm"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Customer tier badge */}
          <div className="absolute top-4 left-4 flex items-center gap-2 flex-wrap">
            <span className={`px-3 py-1 rounded-full text-xs font-bold text-white ${tier.badge} flex items-center gap-1 shadow-lg`}>
              <Star className="w-3 h-3" />
              {tier.name}
            </span>
            <span className={`px-3 py-1 rounded-full text-xs font-bold text-white ${typeInfo.bg} flex items-center gap-1 shadow-lg`}>
              <TypeIcon className="w-3 h-3" />
              {typeInfo.label}
            </span>
            {!customer.isActive && (
              <span className="px-3 py-1 rounded-full text-xs font-bold text-white bg-slate-500/80 flex items-center gap-1 shadow-lg">
                <UserX className="w-3 h-3" />
                {t('common.inactive')}
              </span>
            )}
            {overdue && (
              <span className="px-3 py-1 rounded-full text-xs font-bold text-white bg-red-600 flex items-center gap-1 shadow-lg animate-pulse">
                <AlertTriangle className="w-3 h-3" />
                {t('customers.overdue')}
              </span>
            )}
          </div>

          {/* Avatar positioned to overlap header and content */}
          <div className="absolute -bottom-12 left-1/2 -translate-x-1/2">
            {customer.photo ? (
              <img 
                src={customer.photo} 
                alt={customer.name}
                className={`w-24 h-24 rounded-2xl object-cover shadow-xl border-4 border-white dark:border-slate-900 rotate-3 hover:rotate-0 transition-transform duration-300`}
              />
            ) : (
              <div className={`w-24 h-24 rounded-2xl bg-gradient-to-br ${tier.color} flex items-center justify-center text-white text-2xl font-bold shadow-xl border-4 border-white dark:border-slate-900 rotate-3 hover:rotate-0 transition-transform duration-300`}>
                {getInitials(customer.name)}
              </div>
            )}
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto pt-14 pb-6 px-6">
          {/* Name and Business */}
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">
              {customer.name}
            </h2>
            <p className="text-slate-500 dark:text-slate-400 flex items-center justify-center gap-2">
              <Building2 className="w-4 h-4" />
              {customer.businessName}
            </p>
            {customer.nic && (
              <p className="text-sm text-slate-400 dark:text-slate-500 flex items-center justify-center gap-1 mt-1">
                <IdCard className="w-3.5 h-3.5" />
                NIC: {customer.nic}
              </p>
            )}
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-3 text-center border border-green-100 dark:border-green-800/30">
              <div className="w-8 h-8 bg-green-500/10 rounded-lg flex items-center justify-center mx-auto mb-1">
                <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-400" />
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-0.5">{t('customers.totalSpent')}</p>
              <p className="text-sm font-bold text-green-600 dark:text-green-400">
                Rs. {customer.totalSpent.toLocaleString()}
              </p>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-3 text-center border border-blue-100 dark:border-blue-800/30">
              <div className="w-8 h-8 bg-blue-500/10 rounded-lg flex items-center justify-center mx-auto mb-1">
                <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-0.5">{t('customers.memberSince')}</p>
              <p className="text-sm font-bold text-blue-600 dark:text-blue-400">
                {new Date(customer.registrationDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
              </p>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl p-3 text-center border border-purple-100 dark:border-purple-800/30">
              <div className="w-8 h-8 bg-purple-500/10 rounded-lg flex items-center justify-center mx-auto mb-1">
                <Clock className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-0.5">{t('customers.daysActive')}</p>
              <p className="text-sm font-bold text-purple-600 dark:text-purple-400">
                {daysSinceReg}
              </p>
            </div>
          </div>

          {/* Loan/Credit Information - Only for credit or wholesale customers with loan */}
          {(customer.customerType === 'credit' || customer.customerType === 'wholesale') && (customer.loanBalance > 0 || customer.creditLimit) && (
            <div className={`mb-4 rounded-xl p-4 border ${
              overdue 
                ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800/50' 
                : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700'
            }`}>
              <h3 className={`text-sm font-semibold flex items-center gap-2 mb-3 ${
                overdue ? 'text-red-700 dark:text-red-400' : 'text-slate-900 dark:text-white'
              }`}>
                <Wallet className="w-4 h-4" />
                {t('customers.creditInfo')}
              </h3>
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {customer.creditLimit && (
                  <div className="bg-white dark:bg-slate-800 rounded-lg p-3 border border-slate-200 dark:border-slate-700">
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">{t('customers.creditLimit')}</p>
                    <p className="text-lg font-bold text-amber-600 dark:text-amber-400">
                      Rs. {customer.creditLimit.toLocaleString()}
                    </p>
                  </div>
                )}
                
                <div className={`rounded-lg p-3 border ${
                  overdue 
                    ? 'bg-red-100 dark:bg-red-900/30 border-red-300 dark:border-red-700' 
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                }`}>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">{t('customers.loanBalance')}</p>
                  <p className={`text-lg font-bold ${
                    overdue ? 'text-red-600 dark:text-red-400' : customer.loanBalance > 0 ? 'text-purple-600 dark:text-purple-400' : 'text-slate-600 dark:text-slate-400'
                  }`}>
                    Rs. {customer.loanBalance.toLocaleString()}
                  </p>
                </div>
                
                {customer.loanDueDate && customer.loanBalance > 0 && (
                  <div className={`rounded-lg p-3 border ${
                    overdue 
                      ? 'bg-red-100 dark:bg-red-900/30 border-red-300 dark:border-red-700' 
                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                  }`}>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">{t('customers.dueDate')}</p>
                    <p className={`text-lg font-bold ${overdue ? 'text-red-600 dark:text-red-400' : 'text-slate-900 dark:text-white'}`}>
                      {new Date(customer.loanDueDate).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>

              {/* Credit utilization bar */}
              {customer.creditLimit && customer.creditLimit > 0 && (
                <div className="mt-3">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-500 dark:text-slate-400">{t('customers.creditUsed')}</span>
                    <span className={customer.loanBalance / customer.creditLimit > 0.8 ? 'text-red-500' : 'text-slate-600 dark:text-slate-300'}>
                      {Math.round((customer.loanBalance / customer.creditLimit) * 100)}%
                    </span>
                  </div>
                  <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all ${
                        customer.loanBalance / customer.creditLimit > 0.8 
                          ? 'bg-red-500' 
                          : customer.loanBalance / customer.creditLimit > 0.5 
                            ? 'bg-amber-500' 
                            : 'bg-emerald-500'
                      }`}
                      style={{ width: `${Math.min((customer.loanBalance / customer.creditLimit) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Contact Information */}
          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 space-y-3 mb-4">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-orange-500" />
              {t('customers.contactInfo')}
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <a 
                href={`mailto:${customer.email}`}
                className="flex items-center gap-3 p-3 bg-white dark:bg-slate-800 rounded-lg hover:shadow-md transition-all duration-200 group border border-slate-200 dark:border-slate-700"
              >
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Mail className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="overflow-hidden">
                  <p className="text-xs text-slate-500 dark:text-slate-400">{t('common.email')}</p>
                  <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                    {customer.email}
                  </p>
                </div>
              </a>

              <a 
                href={`tel:${customer.phone}`}
                className="flex items-center gap-3 p-3 bg-white dark:bg-slate-800 rounded-lg hover:shadow-md transition-all duration-200 group border border-slate-200 dark:border-slate-700"
              >
                <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Phone className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <div className="overflow-hidden">
                  <p className="text-xs text-slate-500 dark:text-slate-400">{t('common.phone')}</p>
                  <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                    {customer.phone}
                  </p>
                </div>
              </a>

              {customer.phone2 && (
                <a 
                  href={`tel:${customer.phone2}`}
                  className="flex items-center gap-3 p-3 bg-white dark:bg-slate-800 rounded-lg hover:shadow-md transition-all duration-200 group border border-slate-200 dark:border-slate-700"
                >
                  <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Phone className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-xs text-slate-500 dark:text-slate-400">{t('customers.phone2')}</p>
                    <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                      {customer.phone2}
                    </p>
                  </div>
                </a>
              )}
            </div>

            <div className="flex items-start gap-3 p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
              <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                <MapPin className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">{t('common.address')}</p>
                <p className="text-sm font-medium text-slate-900 dark:text-white">
                  {customer.address}
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={() => {
                onEdit(customer);
                onClose();
              }}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600 text-white rounded-xl font-medium transition-all duration-200 shadow-lg shadow-orange-500/25 hover:shadow-xl hover:shadow-orange-500/30 hover:-translate-y-0.5"
            >
              <Edit2 className="w-4 h-4" />
              {t('common.edit')} {t('customers.customer')}
            </button>
            <button
              onClick={onClose}
              className="px-6 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-medium transition-all duration-200"
            >
              {t('common.close')}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
