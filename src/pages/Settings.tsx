import React, { useState, useEffect, useCallback } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useTranslation } from 'react-i18next';
import { useIsMobile } from '../hooks/use-mobile';
import { useAuth } from '../contexts/AuthContext';
import api from '../lib/api';
import {
  Settings as SettingsIcon,
  Building2,
  Phone,
  Mail,
  MapPin,
  Globe,
  CreditCard,
  Receipt,
  Printer,
  Bell,
  Shield,
  Database,
  Download,
  Upload,
  Save,
  Check,
  Sun,
  Moon,
  Languages,
  Palette,
  FileText,
  Calculator,
  Percent,
  Clock,
  AlertCircle,
  HelpCircle,
  Users,
  UserPlus,
  UserCog,
  Key,
  Lock,
  Trash2,
  X,
  Edit3,
  RefreshCw
} from 'lucide-react';

// ── Types ──

interface BusinessSettings {
  businessName: string;
  businessNameSinhala: string;
  tagline: string;
  address: string;
  phone: string;
  phone2: string;
  email: string;
  website: string;
  registrationNo: string;
  taxNo: string;
}

interface InvoiceSettings {
  invoicePrefix: string;
  startingNumber: number;
  defaultDueDays: number;
  defaultTaxRate: number;
  showLogo: boolean;
  showWatermark: boolean;
  footerNote: string;
  termsAndConditions: string;
}

interface NotificationSettings {
  lowStockAlerts: boolean;
  lowStockThreshold: number;
  overdueInvoiceAlerts: boolean;
  dailySummary: boolean;
  emailNotifications: boolean;
}

interface UserRecord {
  id: number;
  name: string;
  username: string | null;
  email: string | null;
  role: string;
  active: boolean;
  createdAt: string;
}

interface UserFormData {
  username: string;
  name: string;
  email: string;
  password: string;
  role: 'ADMIN' | 'CASHIER' | 'STAFF';
}

// ── Helper: derive a safe username fallback from the user record ──
// When the database username is null, gracefully uses the email substring
// or generates a default editable placeholder to satisfy front-end validation.
function deriveSafeUsername(user: UserRecord): string {
  if (user.username && user.username.trim().length > 0) {
    return user.username;
  }
  // Fallback 1: extract email prefix (before @)
  if (user.email && user.email.trim().length > 0) {
    const emailPrefix = user.email.split('@')[0];
    if (emailPrefix.length > 0) return emailPrefix;
  }
  // Fallback 2: use name-based placeholder
  const safeName = user.name?.trim()?.toLowerCase()?.replace(/\s+/g, '_') || 'user';
  return safeName;
}

// ── Component ──

export const Settings: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const { i18n } = useTranslation();
  const isMobile = useIsMobile();

  const [activeTab, setActiveTab] = useState<'business' | 'invoice' | 'notifications' | 'appearance' | 'backup' | 'users'>('business');
  const [saved, setSaved] = useState(false);

  // Users State
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState<string | null>(null);
  const [showUserForm, setShowUserForm] = useState(false);
  const [editingUserId, setEditingUserId] = useState<number | null>(null);
  const [userForm, setUserForm] = useState<UserFormData>({
    username: '',
    name: '',
    email: '',
    password: '',
    role: 'CASHIER',
  });
  const [userFormError, setUserFormError] = useState<string | null>(null);
  const [userFormSuccess, setUserFormSuccess] = useState<string | null>(null);
  const [userSaving, setUserSaving] = useState(false);

  // Business Settings
  const [businessSettings, setBusinessSettings] = useState<BusinessSettings>({
    businessName: 'Liyanage Bathware',
    businessNameSinhala: 'ලියනගේ බාත්වෙයාර්',
    tagline: 'Quality Building Materials',
    address: 'Hakmana Rd, Deiyandara',
    phone: '0705237647',
    phone2: '0702629352',
    email: 'info@liyanage.lk',
    website: 'www.liyanage.lk',
    registrationNo: 'PV00012345',
    taxNo: '123456789-7000'
  });

  // Invoice Settings
  const [invoiceSettings, setInvoiceSettings] = useState<InvoiceSettings>({
    invoicePrefix: 'INV',
    startingNumber: 1001,
    defaultDueDays: 30,
    defaultTaxRate: 15,
    showLogo: true,
    showWatermark: false,
    footerNote: 'Thank you for your business!',
    termsAndConditions: 'Goods once sold cannot be returned. Payment due within the specified period.'
  });

  // Notification Settings
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    lowStockAlerts: true,
    lowStockThreshold: 10,
    overdueInvoiceAlerts: true,
    dailySummary: false,
    emailNotifications: true
  });

  // ── Current user from auth context ──
  const { user: currentUser } = useAuth();

  // ── Load users ──
  const loadUsers = useCallback(async () => {
    setUsersLoading(true);
    setUsersError(null);
    try {
      const res: UserRecord[] = await api.get('/users');
      setUsers(res || []);
    } catch (err: any) {
      setUsersError(err.message);
    } finally {
      setUsersLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'users') {
      loadUsers();
    }
  }, [activeTab, loadUsers]);

  // ── User Form Handlers ──
  const resetUserForm = () => {
    setUserForm({ username: '', name: '', email: '', password: '', role: 'CASHIER' });
    setEditingUserId(null);
    setUserFormError(null);
    setUserFormSuccess(null);
    setShowUserForm(false);
  };

  const openCreateUser = () => {
    setEditingUserId(null);
    setUserForm({ username: '', name: '', email: '', password: '', role: 'CASHIER' });
    setUserFormError(null);
    setUserFormSuccess(null);
    setShowUserForm(true);
  };

  const openEditUser = (user: UserRecord) => {
    setEditingUserId(user.id);
    setUserForm({
      username: deriveSafeUsername(user),
      name: user.name,
      email: user.email || '',
      password: '',
      role: user.role as 'ADMIN' | 'CASHIER' | 'STAFF',
    });
    setUserFormError(null);
    setUserFormSuccess(null);
    setShowUserForm(true);
  };

  const handleUserFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUserFormError(null);
    setUserFormSuccess(null);

    if (!userForm.username.trim()) {
      setUserFormError('Username is required');
      return;
    }
    if (!userForm.name.trim()) {
      setUserFormError('Name is required');
      return;
    }
    if (!editingUserId && !userForm.password) {
      setUserFormError('Password is required for new users');
      return;
    }

    setUserSaving(true);
    try {
      if (editingUserId) {
        const payload: any = { username: userForm.username, name: userForm.name, role: userForm.role };
        if (userForm.password) payload.password = userForm.password;
        await api.put(`/users/${editingUserId}`, payload);
        setUserFormSuccess('User updated successfully');
      } else {
        await api.post('/users', userForm);
        setUserFormSuccess('User created successfully');
      }
      loadUsers();
      setTimeout(resetUserForm, 1500);
    } catch (err: any) {
      setUserFormError(err.message);
    } finally {
      setUserSaving(false);
    }
  };

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const tabs = [
    { id: 'business' as const, label: 'Business Info', icon: Building2 },
    { id: 'invoice' as const, label: 'Invoice Settings', icon: Receipt },
    { id: 'notifications' as const, label: 'Notifications', icon: Bell },
    { id: 'appearance' as const, label: 'Appearance', icon: Palette },
    { id: 'users' as const, label: 'Manage Users', icon: Users },
    { id: 'backup' as const, label: 'Data & Backup', icon: Database }
  ];

  const inputClass = `w-full px-4 py-2.5 rounded-xl border ${
    theme === 'dark'
      ? 'bg-slate-800 border-slate-600 text-white placeholder-slate-500'
      : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400'
  }`;

  const labelClass = `block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`;

  return (
    <div className={`space-y-6 ${isMobile ? 'pb-20' : ''}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
            Settings
          </h1>
          <p className={`text-sm mt-1 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
            Configure your business settings and preferences
          </p>
        </div>
        <button
          onClick={handleSave}
          className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-medium transition-all ${
            saved
              ? 'bg-green-500 text-white'
              : 'bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600 text-white shadow-lg shadow-orange-500/20'
          }`}
        >
          {saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          {saved ? 'Saved!' : 'Save Changes'}
        </button>
      </div>

      {/* Tab Navigation */}
      <div className={`flex gap-2 overflow-x-auto pb-2 ${isMobile ? 'flex-nowrap' : 'flex-wrap'}`}>
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-orange-500 to-rose-500 text-white shadow-lg'
                  : theme === 'dark'
                    ? 'bg-slate-800/50 text-slate-400 hover:text-white border border-slate-700/50'
                    : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200 shadow-sm'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className={`rounded-2xl border p-6 ${
        theme === 'dark' ? 'bg-slate-800/30 border-slate-700/50' : 'bg-white border-slate-200 shadow-sm'
      }`}>
        {/* Business Info Tab */}
        {activeTab === 'business' && (
          <div className="space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-200 dark:border-slate-700">
              <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center">
                <Building2 className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <h2 className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                  Business Information
                </h2>
                <p className={`text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                  This information appears on your invoices and reports
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className={labelClass}>Business Name (English)</label>
                <input type="text" value={businessSettings.businessName} onChange={(e) => setBusinessSettings({ ...businessSettings, businessName: e.target.value })} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Business Name (සිංහල)</label>
                <input type="text" value={businessSettings.businessNameSinhala} onChange={(e) => setBusinessSettings({ ...businessSettings, businessNameSinhala: e.target.value })} className={inputClass} />
              </div>
              <div className="md:col-span-2">
                <label className={labelClass}>Address</label>
                <textarea value={businessSettings.address} onChange={(e) => setBusinessSettings({ ...businessSettings, address: e.target.value })} rows={2} className={`${inputClass} resize-none`} />
              </div>
              <div>
                <label className={labelClass}>Primary Phone</label>
                <input type="tel" value={businessSettings.phone} onChange={(e) => setBusinessSettings({ ...businessSettings, phone: e.target.value })} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Secondary Phone</label>
                <input type="tel" value={businessSettings.phone2} onChange={(e) => setBusinessSettings({ ...businessSettings, phone2: e.target.value })} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Email</label>
                <input type="email" value={businessSettings.email} onChange={(e) => setBusinessSettings({ ...businessSettings, email: e.target.value })} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Website</label>
                <input type="url" value={businessSettings.website} onChange={(e) => setBusinessSettings({ ...businessSettings, website: e.target.value })} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Business Registration No.</label>
                <input type="text" value={businessSettings.registrationNo} onChange={(e) => setBusinessSettings({ ...businessSettings, registrationNo: e.target.value })} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Tax Identification No. (TIN)</label>
                <input type="text" value={businessSettings.taxNo} onChange={(e) => setBusinessSettings({ ...businessSettings, taxNo: e.target.value })} className={inputClass} />
              </div>
            </div>
          </div>
        )}

        {/* Invoice Settings Tab */}
        {activeTab === 'invoice' && (
          <div className="space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-200 dark:border-slate-700">
              <div className="w-10 h-10 bg-purple-500/10 rounded-xl flex items-center justify-center">
                <Receipt className="w-5 h-5 text-purple-500" />
              </div>
              <div>
                <h2 className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                  Invoice Configuration
                </h2>
                <p className={`text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                  Customize your invoice format and default values
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className={labelClass}>Invoice Number Prefix</label>
                <input type="text" value={invoiceSettings.invoicePrefix} onChange={(e) => setInvoiceSettings({ ...invoiceSettings, invoicePrefix: e.target.value })} className={inputClass} />
                <p className={`text-xs mt-1 ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>
                  Example: {invoiceSettings.invoicePrefix}-2024-{invoiceSettings.startingNumber}
                </p>
              </div>
              <div>
                <label className={labelClass}>Starting Number</label>
                <input type="number" value={invoiceSettings.startingNumber} onChange={(e) => setInvoiceSettings({ ...invoiceSettings, startingNumber: parseInt(e.target.value) || 1 })} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Default Payment Due (Days)</label>
                <input type="number" value={invoiceSettings.defaultDueDays} onChange={(e) => setInvoiceSettings({ ...invoiceSettings, defaultDueDays: parseInt(e.target.value) || 30 })} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Default Tax Rate (%)</label>
                <input type="number" value={invoiceSettings.defaultTaxRate} onChange={(e) => setInvoiceSettings({ ...invoiceSettings, defaultTaxRate: parseFloat(e.target.value) || 0 })} className={inputClass} />
              </div>
              <div className="md:col-span-2">
                <label className={labelClass}>Invoice Footer Note</label>
                <input type="text" value={invoiceSettings.footerNote} onChange={(e) => setInvoiceSettings({ ...invoiceSettings, footerNote: e.target.value })} className={inputClass} />
              </div>
              <div className="md:col-span-2">
                <label className={labelClass}>Terms & Conditions</label>
                <textarea value={invoiceSettings.termsAndConditions} onChange={(e) => setInvoiceSettings({ ...invoiceSettings, termsAndConditions: e.target.value })} rows={3} className={`${inputClass} resize-none`} />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
              <h3 className={`text-sm font-semibold mb-4 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Print Options</h3>
              <div className="space-y-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked={invoiceSettings.showLogo} onChange={(e) => setInvoiceSettings({ ...invoiceSettings, showLogo: e.target.checked })} className="w-4 h-4 rounded border-slate-300 text-orange-500 focus:ring-orange-500" />
                  <span className={theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}>Show business logo on invoices</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked={invoiceSettings.showWatermark} onChange={(e) => setInvoiceSettings({ ...invoiceSettings, showWatermark: e.target.checked })} className="w-4 h-4 rounded border-slate-300 text-orange-500 focus:ring-orange-500" />
                  <span className={theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}>Show "PAID" watermark on paid invoices</span>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Notifications Tab */}
        {activeTab === 'notifications' && (
          <div className="space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-200 dark:border-slate-700">
              <div className="w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center">
                <Bell className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <h2 className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Notification Preferences</h2>
                <p className={`text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>Configure alerts and notification settings</p>
              </div>
            </div>
            <div className="space-y-4">
              <div className={`p-4 rounded-xl border ${theme === 'dark' ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-amber-500" />
                    <div>
                      <p className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Low Stock Alerts</p>
                      <p className={`text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>Get notified when product stock is low</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" checked={notificationSettings.lowStockAlerts} onChange={(e) => setNotificationSettings({ ...notificationSettings, lowStockAlerts: e.target.checked })} className="sr-only peer" />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 dark:peer-focus:ring-orange-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-orange-500"></div>
                  </label>
                </div>
                {notificationSettings.lowStockAlerts && (
                  <div className="mt-4 flex items-center gap-4">
                    <label className={`text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>Alert when stock falls below:</label>
                    <input type="number" value={notificationSettings.lowStockThreshold} onChange={(e) => setNotificationSettings({ ...notificationSettings, lowStockThreshold: parseInt(e.target.value) || 10 })} className={`w-20 px-3 py-1.5 rounded-lg border text-center ${theme === 'dark' ? 'bg-slate-800 border-slate-600 text-white' : 'bg-white border-slate-200 text-slate-900'}`} />
                    <span className={`text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>units</span>
                  </div>
                )}
              </div>
              <div className={`p-4 rounded-xl border ${theme === 'dark' ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-red-500" />
                    <div>
                      <p className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Overdue Invoice Alerts</p>
                      <p className={`text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>Get notified when invoices become overdue</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" checked={notificationSettings.overdueInvoiceAlerts} onChange={(e) => setNotificationSettings({ ...notificationSettings, overdueInvoiceAlerts: e.target.checked })} className="sr-only peer" />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 dark:peer-focus:ring-orange-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-orange-500"></div>
                  </label>
                </div>
              </div>
              <div className={`p-4 rounded-xl border ${theme === 'dark' ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-blue-500" />
                    <div>
                      <p className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Email Notifications</p>
                      <p className={`text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>Receive alerts via email</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" checked={notificationSettings.emailNotifications} onChange={(e) => setNotificationSettings({ ...notificationSettings, emailNotifications: e.target.checked })} className="sr-only peer" />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 dark:peer-focus:ring-orange-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-orange-500"></div>
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Appearance Tab */}
        {activeTab === 'appearance' && (
          <div className="space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-200 dark:border-slate-700">
              <div className="w-10 h-10 bg-pink-500/10 rounded-xl flex items-center justify-center">
                <Palette className="w-5 h-5 text-pink-500" />
              </div>
              <div>
                <h2 className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Appearance Settings</h2>
                <p className={`text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>Customize the look and feel of your application</p>
              </div>
            </div>
            <div className="space-y-4">
              <div className={`p-4 rounded-xl border ${theme === 'dark' ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                <p className={`font-medium mb-4 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Theme</p>
                <div className="flex gap-4">
                  <button onClick={() => theme === 'dark' && toggleTheme()} className={`flex-1 p-4 rounded-xl border-2 transition-all ${theme === 'light' ? 'border-orange-500 bg-orange-500/10' : 'border-slate-600 hover:border-slate-500'}`}>
                    <div className="flex items-center justify-center gap-2">
                      <Sun className={`w-5 h-5 ${theme === 'light' ? 'text-orange-500' : 'text-slate-400'}`} />
                      <span className={theme === 'light' ? 'text-orange-500 font-medium' : 'text-slate-400'}>Light</span>
                    </div>
                  </button>
                  <button onClick={() => theme === 'light' && toggleTheme()} className={`flex-1 p-4 rounded-xl border-2 transition-all ${theme === 'dark' ? 'border-orange-500 bg-orange-500/10' : 'border-slate-200 hover:border-slate-300'}`}>
                    <div className="flex items-center justify-center gap-2">
                      <Moon className={`w-5 h-5 ${theme === 'dark' ? 'text-orange-500' : 'text-slate-400'}`} />
                      <span className={theme === 'dark' ? 'text-orange-500 font-medium' : 'text-slate-400'}>Dark</span>
                    </div>
                  </button>
                </div>
              </div>
              <div className={`p-4 rounded-xl border ${theme === 'dark' ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                <p className={`font-medium mb-4 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Language / භාෂාව</p>
                <div className="flex gap-4">
                  <button onClick={() => i18n.changeLanguage('en')} className={`flex-1 p-4 rounded-xl border-2 transition-all ${i18n.language === 'en' ? 'border-orange-500 bg-orange-500/10' : theme === 'dark' ? 'border-slate-600 hover:border-slate-500' : 'border-slate-200 hover:border-slate-300'}`}>
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-xl">🇬🇧</span>
                      <span className={i18n.language === 'en' ? 'text-orange-500 font-medium' : theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}>English</span>
                    </div>
                  </button>
                  <button onClick={() => i18n.changeLanguage('si')} className={`flex-1 p-4 rounded-xl border-2 transition-all ${i18n.language === 'si' ? 'border-orange-500 bg-orange-500/10' : theme === 'dark' ? 'border-slate-600 hover:border-slate-500' : 'border-slate-200 hover:border-slate-300'}`}>
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-xl">🇱🇰</span>
                      <span className={i18n.language === 'si' ? 'text-orange-500 font-medium' : theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}>සිංහල</span>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Users Tab - Manage Users */}
        {activeTab === 'users' && (
          <div className="space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-200 dark:border-slate-700">
              <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center">
                <Users className="w-5 h-5 text-emerald-500" />
              </div>
              <div>
                <h2 className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                  Manage Users
                </h2>
                <p className={`text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                  Create and manage cashier and staff accounts
                </p>
              </div>
            </div>

            {/* User form modal */}
            {showUserForm && (
              <div className={`p-5 rounded-xl border mb-6 ${
                theme === 'dark' ? 'bg-slate-800/70 border-slate-600' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className={`font-semibold flex items-center gap-2 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                    {editingUserId ? <UserCog className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
                    {editingUserId ? 'Edit User' : 'Create New User'}
                  </h3>
                  <button onClick={resetUserForm} className={`p-2 rounded-lg hover:bg-slate-700/30 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {userFormError && (
                  <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-500 text-sm">
                    {userFormError}
                  </div>
                )}
                {userFormSuccess && (
                  <div className="mb-4 p-3 rounded-lg bg-green-500/10 border border-green-500/30 text-green-500 text-sm">
                    {userFormSuccess}
                  </div>
                )}

                <form onSubmit={handleUserFormSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className={labelClass}>Username</label>
                      <input
                        type="text"
                        value={userForm.username}
                        onChange={(e) => setUserForm({ ...userForm, username: e.target.value })}
                        placeholder="e.g. cashier01"
                        className={inputClass}
                        disabled={!!editingUserId}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Email Address</label>
                      <div className="relative">
                        <input
                          type="email"
                          value={userForm.email}
                          onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                          placeholder={editingUserId ? 'Locked — cannot be changed' : 'e.g. user@example.com'}
                          className={`${inputClass} pr-10`}
                          disabled={!!editingUserId}
                          readOnly={!!editingUserId}
                        />
                        {editingUserId && (
                          <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        )}
                      </div>
                      {editingUserId && (
                        <p className={`text-xs mt-1 ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>
                          Email identity is locked and cannot be modified
                        </p>
                      )}
                    </div>
                    <div>
                      <label className={labelClass}>Full Name</label>
                      <input
                        type="text"
                        value={userForm.name}
                        onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                        placeholder="e.g. Kasun Perera"
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>
                        {editingUserId ? 'New Password (leave blank to keep)' : 'Password'}
                      </label>
                      <input
                        type="password"
                        value={userForm.password}
                        onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                        placeholder={editingUserId ? 'Leave blank to keep current' : 'Min 4 characters'}
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Role</label>
                      <select
                        value={userForm.role}
                        onChange={(e) => setUserForm({ ...userForm, role: e.target.value as any })}
                        className={`${inputClass} appearance-none`}
                      >
                        <option value="CASHIER">Cashier</option>
                        <option value="STAFF">Staff</option>
                        <option value="ADMIN">Admin</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={resetUserForm}
                      className={`px-4 py-2 rounded-xl font-medium border ${
                        theme === 'dark' ? 'border-slate-600 text-slate-300 hover:bg-slate-700' : 'border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={userSaving}
                      className="px-5 py-2 rounded-xl font-medium bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white shadow-lg shadow-emerald-500/20 disabled:opacity-50 flex items-center gap-2"
                    >
                      {userSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      {userSaving ? 'Saving...' : editingUserId ? 'Update User' : 'Create User'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Users list */}
            {!showUserForm && (
              <button
                onClick={openCreateUser}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white shadow-lg shadow-emerald-500/20 mb-4"
              >
                <UserPlus className="w-4 h-4" />
                Add New User
              </button>
            )}

            {usersLoading ? (
              <div className={`text-center py-8 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                Loading users...
              </div>
            ) : usersError ? (
              <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-500 text-sm">
                {usersError}
              </div>
            ) : users.length === 0 ? (
              <div className={`text-center py-8 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                No users found. Create your first user above.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className={`border-b ${theme === 'dark' ? 'border-slate-700 text-slate-400' : 'border-slate-200 text-slate-600'}`}>
                      <th className="text-left py-3 px-2 font-medium">Username</th>
                      <th className="text-left py-3 px-2 font-medium">Name</th>
                      <th className="text-left py-3 px-2 font-medium">Role</th>
                      <th className="text-center py-3 px-2 font-medium">Active</th>
                      <th className="text-right py-3 px-2 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user.id} className={`border-b ${theme === 'dark' ? 'border-slate-700/50' : 'border-slate-100'}`}>
                        <td className={`py-3 px-2 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                          <span className="font-mono text-xs">{user.username || user.email || user.name || '—'}</span>
                        </td>
                        <td className={`py-3 px-2 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
                          {user.name}
                        </td>
                        <td className="py-3 px-2">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            user.role === 'ADMIN' ? 'bg-purple-500/10 text-purple-500' :
                            user.role === 'CASHIER' ? 'bg-blue-500/10 text-blue-500' :
                            'bg-slate-500/10 text-slate-500'
                          }`}>
                            {user.role}
                          </span>
                        </td>
                        <td className="py-3 px-2 text-center">
                          <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full ${
                            user.active ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'
                          }`}>
                            {user.active ? '✓' : '✗'}
                          </span>
                        </td>
                        <td className="py-3 px-2 text-right">
                          {currentUser?.role === 'ADMIN' || user.role !== 'ADMIN' ? (
                            <button
                              onClick={() => openEditUser(user)}
                              className={`p-2 rounded-lg hover:bg-slate-700/30 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}
                              title="Edit user"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                          ) : null}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Backup Tab */}
        {activeTab === 'backup' && (
          <div className="space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-200 dark:border-slate-700">
              <div className="w-10 h-10 bg-green-500/10 rounded-xl flex items-center justify-center">
                <Database className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <h2 className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Data & Backup</h2>
                <p className={`text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>Export your data and manage backups</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className={`p-6 rounded-xl border ${theme === 'dark' ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                <div className="flex items-center gap-3 mb-4">
                  <Download className="w-6 h-6 text-blue-500" />
                  <h3 className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Export Data</h3>
                </div>
                <p className={`text-sm mb-4 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>Download all your business data including customers, products, and invoices.</p>
                <button className="w-full px-4 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-medium transition-all">Export All Data (JSON)</button>
              </div>
              <div className={`p-6 rounded-xl border ${theme === 'dark' ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                <div className="flex items-center gap-3 mb-4">
                  <Upload className="w-6 h-6 text-green-500" />
                  <h3 className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Import Data</h3>
                </div>
                <p className={`text-sm mb-4 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>Restore your data from a previous backup file.</p>
                <button className="w-full px-4 py-2.5 bg-green-500 hover:bg-green-600 text-white rounded-xl font-medium transition-all">Import Backup File</button>
              </div>
              <div className={`p-6 rounded-xl border md:col-span-2 ${theme === 'dark' ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                <div className="flex items-center gap-3 mb-4">
                  <FileText className="w-6 h-6 text-purple-500" />
                  <h3 className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Export Reports</h3>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <button className={`px-4 py-3 rounded-xl border font-medium transition-all ${theme === 'dark' ? 'border-slate-600 hover:bg-slate-700 text-slate-300' : 'border-slate-200 hover:bg-slate-100 text-slate-700'}`}>Customers (CSV)</button>
                  <button className={`px-4 py-3 rounded-xl border font-medium transition-all ${theme === 'dark' ? 'border-slate-600 hover:bg-slate-700 text-slate-300' : 'border-slate-200 hover:bg-slate-100 text-slate-700'}`}>Products (CSV)</button>
                  <button className={`px-4 py-3 rounded-xl border font-medium transition-all ${theme === 'dark' ? 'border-slate-600 hover:bg-slate-700 text-slate-300' : 'border-slate-200 hover:bg-slate-100 text-slate-700'}`}>Invoices (CSV)</button>
                  <button className={`px-4 py-3 rounded-xl border font-medium transition-all ${theme === 'dark' ? 'border-slate-600 hover:bg-slate-700 text-slate-300' : 'border-slate-200 hover:bg-slate-100 text-slate-700'}`}>Financial (PDF)</button>
                </div>
              </div>
            </div>
            <div className={`p-4 rounded-xl border ${theme === 'dark' ? 'bg-amber-500/10 border-amber-500/30' : 'bg-amber-50 border-amber-200'}`}>
              <div className="flex items-start gap-3">
                <HelpCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className={`font-medium ${theme === 'dark' ? 'text-amber-400' : 'text-amber-800'}`}>Regular Backups Recommended</p>
                  <p className={`text-sm mt-1 ${theme === 'dark' ? 'text-amber-300/70' : 'text-amber-700'}`}>We recommend exporting your data regularly to prevent data loss. Store backup files in a secure location.</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};