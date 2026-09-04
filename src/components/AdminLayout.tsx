import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { LanguageSwitcher } from './LanguageSwitcher';
import { SidebarTooltip } from './SidebarTooltip';
import { Navbar } from './layout/Navbar';
import { 
  Package, FileText, Users, LayoutDashboard, Settings, LogOut,
  Moon, Sun, Menu, X, ChevronLeft, ChevronRight, Bell, Search,
  User, HelpCircle, ChevronDown, Sparkles, TrendingUp, Shield,
  FolderTree, Building, Truck, Zap, Clock
} from 'lucide-react';
import { useIsMobile } from '../hooks/use-mobile';

interface AdminLayoutProps {
  children: React.ReactNode;
}

// ── Localized Clock Component ──
const LocalizedClock: React.FC = () => {
  const { i18n } = useTranslation();
  const { theme } = useTheme();
  const [timeString, setTimeString] = useState<string>('');

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      // Force Asia/Colombo timezone
      const colomboTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Colombo' }));
      const year = colomboTime.getFullYear();
      const month = String(colomboTime.getMonth() + 1).padStart(2, '0');
      const day = String(colomboTime.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;

      let hours = colomboTime.getHours();
      const minutes = String(colomboTime.getMinutes()).padStart(2, '0');
      const isPM = hours >= 12;
      const h12 = hours % 12 || 12;

      const lang = i18n.language;

      if (lang === 'si') {
        const period = isPM ? 'ප.ව.' : 'පෙ.ව.';
        setTimeString(`${dateStr} | ${period} ${h12}.${minutes}`);
      } else {
        const period = isPM ? 'p.m.' : 'a.m.';
        setTimeString(`${dateStr} | ${h12}.${minutes} ${period}`);
      }
    };

    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, [i18n.language]);

  return (
    <span className="flex items-center gap-1.5 text-sm md:text-base font-bold font-mono tabular-nums tracking-wide whitespace-nowrap">
      <span className={`font-bold ${theme === 'dark' ? 'text-slate-300' : 'text-slate-900'}`}>{timeString.split(' | ')[0]}</span>
      <span className={theme === 'dark' ? 'text-slate-500/30' : 'text-slate-300/50'}>|</span>
      <span className={`tracking-wider ${theme === 'dark' ? 'text-amber-400' : 'text-slate-900'}`}>{timeString.split(' | ')[1]}</span>
    </span>
  );
};

// ── Route definition for the Omnibox suggestions ──
interface SearchRoute {
  path: string;
  label: string;
  keywords: string[];
  icon: React.ElementType;
}

// ── Omnibox Suggestion Dropdown ──
const OmniboxDropdown: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const searchRoutes: SearchRoute[] = [
    { path: '/invoices/quick-checkout', label: t('quickCheckout.title'), keywords: ['quick', 'checkout', 'invoice', 'sale', 'billing', 'fast'], icon: Zap },
    { path: '/invoices', label: t('nav.invoices'), keywords: ['invoice', 'billing', 'sales', 'receipt'], icon: FileText },
    { path: '/products', label: t('nav.products'), keywords: ['product', 'inventory', 'stock', 'item', 'goods'], icon: Package },
    { path: '/product-category', label: t('nav.productCategory'), keywords: ['category', 'product category', 'group'], icon: FolderTree },
    { path: '/customers', label: t('nav.customers'), keywords: ['customer', 'client', 'buyer', 'person'], icon: Users },
    // { path: '/suppliers', label: t('nav.suppliers'), keywords: ['supplier', 'vendor', 'provider'], icon: Truck },
    // { path: '/financial-reports', label: t('nav.financialReports'), keywords: ['financial', 'report', 'analytics', 'revenue', 'profit', 'money'], icon: TrendingUp },
    { path: '/settings', label: t('nav.settings'), keywords: ['settings', 'configuration', 'preferences', 'options'], icon: Settings },
    { path: '/help', label: t('nav.helpCenter'), keywords: ['help', 'support', 'faq', 'guide', 'contact'], icon: HelpCircle },
  ];

  // Filter routes based on query
  const filteredRoutes = query.trim()
    ? searchRoutes.filter((route) => {
        const q = query.toLowerCase();
        const labelMatch = route.label.toLowerCase().includes(q);
        const keywordMatch = route.keywords.some((kw) => kw.toLowerCase().includes(q));
        return labelMatch || keywordMatch;
      })
    : searchRoutes;

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
        setActiveIndex(-1);
      }
    };
    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showDropdown]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((prev) => (prev < filteredRoutes.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((prev) => (prev > 0 ? prev - 1 : filteredRoutes.length - 1));
    } else if (e.key === 'Enter' && activeIndex >= 0 && activeIndex < filteredRoutes.length) {
      e.preventDefault();
      const route = filteredRoutes[activeIndex];
      setQuery('');
      setShowDropdown(false);
      setActiveIndex(-1);
      navigate(route.path);
    } else if (e.key === 'Escape') {
      setShowDropdown(false);
      setActiveIndex(-1);
      inputRef.current?.blur();
    }
  };

  const handleSelect = (route: SearchRoute) => {
    setQuery('');
    setShowDropdown(false);
    setActiveIndex(-1);
    navigate(route.path);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    setShowDropdown(true);
    setActiveIndex(-1);
  };

  const handleFocus = () => {
    setShowDropdown(true);
  };

  return (
    <div ref={containerRef} className="relative w-full max-w-xs md:max-w-sm lg:max-w-md">
      <div className={`relative hidden sm:flex items-center rounded-xl border transition-all ${theme === 'dark' ? 'bg-slate-800/50 border-slate-700/50 focus-within:border-orange-500/50' : 'bg-slate-50 border-slate-200 focus-within:border-orange-500/50'}`}>
        <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`} />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={handleFocus}
          onKeyDown={handleKeyDown}
          placeholder={t('header.searchAnything')}
          className={`bg-transparent outline-none text-sm w-full py-2 pl-9 pr-12 ${theme === 'dark' ? 'text-white placeholder-slate-500' : 'text-slate-900 placeholder-slate-400'}`}
        />
        <kbd className={`absolute right-3 top-1/2 -translate-y-1/2 hidden lg:inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono rounded ${theme === 'dark' ? 'bg-slate-700 text-slate-400' : 'bg-slate-200 text-slate-500'}`}>⌘K</kbd>
      </div>

      {/* Dropdown Overlay — fully theme-aware */}
      {showDropdown && (
        <div className={`absolute top-full left-0 z-[60] w-full rounded-xl shadow-2xl mt-1 overflow-hidden ${
          theme === 'dark'
            ? 'bg-slate-900 border border-slate-800'
            : 'bg-white border border-slate-200 shadow-xl'
        }`}>
          {filteredRoutes.length > 0 ? (
            <div className="py-1 max-h-72 overflow-y-auto">
              {filteredRoutes.map((route, index) => {
                const Icon = route.icon;
                const isActive = index === activeIndex;
                return (
                  <button
                    key={route.path}
                    onClick={() => handleSelect(route)}
                    onMouseEnter={() => setActiveIndex(index)}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left transition-colors ${
                      isActive
                        ? theme === 'dark'
                          ? 'bg-orange-500/20 text-orange-400'
                          : 'bg-orange-500/10 text-orange-600'
                        : theme === 'dark'
                          ? 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <Icon className={`w-4 h-4 flex-shrink-0 ${theme === 'dark' ? 'opacity-70' : 'opacity-60'}`} />
                    <span>{route.label}</span>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className={`px-4 py-3 text-sm text-center ${
              theme === 'dark' ? 'text-slate-500' : 'text-slate-400'
            }`}>
              No results found
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const { t } = useTranslation();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const isMobile = useIsMobile();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [notificationCount] = useState(3);

  useEffect(() => { setMobileSidebarOpen(false); }, [location.pathname]);

  useEffect(() => {
    const handleClickOutside = () => setProfileDropdownOpen(false);
    if (profileDropdownOpen) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [profileDropdownOpen]);

  const navItems = [
    { path: '/invoices/quick-checkout', icon: Zap, label: 'quickCheckout.title', badge: null },
    { path: '/invoices', icon: FileText, label: 'nav.invoices', badge: '12' },
    { path: '/products', icon: Package, label: 'nav.products', badge: null },
    { path: '/product-category', icon: FolderTree, label: 'nav.productCategory', badge: null },
    { path: '/customers', icon: Users, label: 'nav.customers', badge: '3' },
    // { path: '/suppliers', icon: Truck, label: 'nav.suppliers', badge: null },
    // { path: '/financial-reports', icon: TrendingUp, label: 'nav.financialReports', badge: null },
  ];

  const bottomNavItems = [
    { path: '/settings', icon: Settings, label: 'nav.settings' },
    { path: '/help', icon: HelpCircle, label: 'nav.helpCenter' },
  ];

  const isActive = (path: string) => location.pathname === path;
  const sidebarWidth = sidebarCollapsed ? 'w-16' : 'w-64';

  // ── Sidebar ──
  const Sidebar = () => (
    <aside 
      className={`fixed left-0 top-0 z-40 h-screen ${sidebarWidth} transition-all duration-300 ease-in-out ${
        theme === 'dark' 
          ? 'bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border-r border-slate-800/50' 
          : 'bg-gradient-to-b from-white via-white to-slate-50 border-r border-slate-200 shadow-xl'
      }`}
    >
      <div className={`flex items-center ${sidebarCollapsed ? 'justify-center' : 'px-4'} h-16 border-b ${theme === 'dark' ? 'border-slate-800/50' : 'border-slate-200'}`}>
        <Link to="/" className="flex items-center gap-3 group">
          <div className="relative flex-shrink-0">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl blur-lg opacity-50 group-hover:opacity-75 transition-opacity" />
            <div className="relative w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg overflow-hidden">
              <img src="/logo.jpg" alt="Liyanage Hardware" className="w-full h-full object-cover" />
            </div>
          </div>
          {!sidebarCollapsed && (
            <div className="flex flex-col overflow-hidden">
              <span className={`text-base font-bold whitespace-nowrap ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                Liyanage<span className="text-amber-500"> Hardware</span>
              </span>
              <span className={`text-[9px] -mt-0.5 tracking-wider uppercase whitespace-nowrap ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>
                {t('sidebar.adminPanel')}
              </span>
            </div>
          )}
        </Link>
      </div>

      <nav className="flex flex-col h-[calc(100%-4rem)] px-2 py-3 overflow-y-auto">
        <div className="flex-1 space-y-0.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`group relative flex items-center ${sidebarCollapsed ? 'justify-center w-full' : 'gap-3 px-3'} h-10 rounded-xl font-medium transition-all duration-200 ${
                  active
                    ? theme === 'dark' 
                      ? 'bg-gradient-to-r from-orange-500/20 to-rose-500/10 text-orange-400 shadow-lg shadow-orange-500/10' 
                      : 'bg-gradient-to-r from-orange-500/10 to-rose-500/5 text-orange-600 shadow-lg shadow-orange-500/10'
                    : theme === 'dark' 
                      ? 'text-slate-400 hover:text-white hover:bg-slate-800/50' 
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                {active && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-gradient-to-b from-orange-500 to-rose-500 rounded-r-full" />
                )}
                {!sidebarCollapsed && (
                  <Icon className={`w-5 h-5 flex-shrink-0 transition-transform group-hover:scale-110 ${active ? 'text-orange-500' : ''}`} />
                )}
                {!sidebarCollapsed && (
                  <>
                    <span className="flex-1 text-xs">{t(item.label)}</span>
                    {item.badge && (
                      <span className={`px-1.5 py-0.5 text-[10px] font-semibold rounded-full ${
                        theme === 'dark' ? 'bg-orange-500/20 text-orange-400' : 'bg-orange-100 text-orange-600'
                      }`}>{item.badge}</span>
                    )}
                  </>
                )}
                {sidebarCollapsed && (
                  <SidebarTooltip label={t(item.label)} badge={item.badge}>
                    <Icon className={`w-5 h-5 flex-shrink-0 ${active ? 'text-orange-500' : ''}`} />
                  </SidebarTooltip>
                )}
              </Link>
            );
          })}
        </div>

        <div className="pt-3 space-y-0.5 border-t border-slate-800/30">
          {bottomNavItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`group relative flex items-center ${sidebarCollapsed ? 'justify-center w-full' : 'gap-3 px-3'} h-10 rounded-xl font-medium transition-all duration-200 ${
                  active
                    ? theme === 'dark' 
                      ? 'bg-gradient-to-r from-orange-500/20 to-rose-500/10 text-orange-400 shadow-lg shadow-orange-500/10' 
                      : 'bg-gradient-to-r from-orange-500/10 to-rose-500/5 text-orange-600 shadow-lg shadow-orange-500/10'
                    : theme === 'dark' 
                      ? 'text-slate-400 hover:text-white hover:bg-slate-800/50' 
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                {active && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-gradient-to-b from-orange-500 to-rose-500 rounded-r-full" />}
                {!sidebarCollapsed && (
                  <Icon className={`w-5 h-5 flex-shrink-0 transition-transform group-hover:scale-110 ${active ? 'text-orange-500' : ''}`} />
                )}
                {!sidebarCollapsed && <span className="text-xs">{t(item.label)}</span>}
                {sidebarCollapsed && (
                  <SidebarTooltip label={t(item.label)}>
                    <Icon className={`w-5 h-5 flex-shrink-0 ${active ? 'text-orange-500' : ''}`} />
                  </SidebarTooltip>
                )}
              </Link>
            );
          })}

          {!isMobile && (
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className={`group relative flex items-center ${sidebarCollapsed ? 'justify-center w-full' : 'gap-3 px-3'} h-10 rounded-xl font-medium transition-all duration-200 ${
                theme === 'dark' ? 'text-slate-500 hover:text-white hover:bg-slate-800/50' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
              }`}
              title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {sidebarCollapsed ? (
                <ChevronRight className="w-5 h-5" />
              ) : (
                <>
                  <ChevronLeft className="w-5 h-5" />
                  <span className="text-xs">{t('sidebar.collapse')}</span>
                </>
              )}
              {sidebarCollapsed && (
                <SidebarTooltip label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}>
                  <div />
                </SidebarTooltip>
              )}
            </button>
          )}
        </div>
      </nav>
    </aside>
  );

  // Mobile Sidebar
  const MobileSidebar = () => (
    <>
      <div 
        className={`fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${
          mobileSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setMobileSidebarOpen(false)}
      />
      <aside 
        className={`fixed left-0 top-0 z-50 h-screen w-72 transition-transform duration-300 ease-in-out ${
          mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } ${theme === 'dark' ? 'bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border-r border-slate-800/50' : 'bg-gradient-to-b from-white via-white to-slate-50 border-r border-slate-200 shadow-2xl'}`}
      >
        <button onClick={() => setMobileSidebarOpen(false)} className={`absolute top-4 right-4 p-2 rounded-lg transition-colors ${theme === 'dark' ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-100 text-slate-600'}`}>
          <X className="w-5 h-5" />
        </button>
        <div className={`flex items-center h-16 px-4 border-b ${theme === 'dark' ? 'border-slate-800/50' : 'border-slate-200'}`}>
          <Link to="/" className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-orange-500 to-rose-500 rounded-xl blur-lg opacity-50" />
              <div className="relative w-10 h-10 bg-gradient-to-br from-orange-500 to-rose-600 rounded-xl flex items-center justify-center shadow-lg">
                <Package className="w-5 h-5 text-white" />
              </div>
            </div>
            <div className="flex flex-col">
              <span className={`text-lg font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Hardware<span className="text-orange-500">Pro</span></span>
              <span className={`text-[10px] -mt-0.5 tracking-wider uppercase ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>{t('sidebar.adminPanel')}</span>
            </div>
          </Link>
        </div>
        <nav className="flex flex-col h-[calc(100%-4rem)] px-3 py-4 overflow-y-auto">
          <div className="flex-1 space-y-1">
            <span className={`px-3 text-[10px] font-semibold uppercase tracking-wider ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>{t('sidebar.mainMenu')}</span>
            <div className="mt-2 space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.path);
                return (
                  <Link key={item.path} to={item.path} className={`group relative flex items-center gap-3 px-3 py-3 rounded-xl font-medium transition-all duration-200 ${
                    active ? theme === 'dark' ? 'bg-gradient-to-r from-orange-500/20 to-rose-500/10 text-orange-400' : 'bg-gradient-to-r from-orange-500/10 to-rose-500/5 text-orange-600'
                    : theme === 'dark' ? 'text-slate-400 hover:text-white hover:bg-slate-800/50' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}>
                    {active && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-gradient-to-b from-orange-500 to-rose-500 rounded-r-full" />}
                    <Icon className={`w-5 h-5 flex-shrink-0 ${active ? 'text-orange-500' : ''}`} />
                    <span className="flex-1">{t(item.label)}</span>
                    {item.badge && <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${theme === 'dark' ? 'bg-orange-500/20 text-orange-400' : 'bg-orange-100 text-orange-600'}`}>{item.badge}</span>}
                  </Link>
                );
              })}
            </div>
          </div>
          <div className={`mt-4 p-4 rounded-2xl border ${theme === 'dark' ? 'bg-gradient-to-br from-orange-500/10 to-rose-500/5 border-orange-500/20' : 'bg-gradient-to-br from-orange-50 to-rose-50 border-orange-200/50'}`}>
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-orange-500" />
              <span className={`text-sm font-semibold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{t('sidebar.proFeatures')}</span>
            </div>
            <p className={`text-xs mb-3 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>{t('sidebar.proDescription')}</p>
            <button className="w-full py-2 px-3 bg-gradient-to-r from-orange-500 to-rose-500 text-white text-sm font-medium rounded-lg">{t('sidebar.upgradeNow')}</button>
          </div>
        </nav>
      </aside>
    </>
  );

  return (
    <div className={`min-h-screen transition-colors duration-300 ${theme === 'dark' ? 'bg-[#0a0f1a]' : 'bg-slate-100'}`}>
      <div className={`fixed inset-0 overflow-hidden pointer-events-none transition-opacity duration-300 ${theme === 'dark' ? 'opacity-100' : 'opacity-0'}`}>
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-orange-500/5 rounded-full blur-[120px]" />
        <div className="absolute top-1/2 -left-40 w-80 h-80 bg-purple-500/5 rounded-full blur-[100px]" />
        <div className="absolute -bottom-40 right-1/3 w-72 h-72 bg-blue-500/5 rounded-full blur-[100px]" />
      </div>

      {!isMobile && <Sidebar />}
      {isMobile && <MobileSidebar />}

      <div className={`transition-all duration-300 ${!isMobile ? (sidebarCollapsed ? 'ml-16' : 'ml-64') : 'ml-0'}`}>
        <header className={`sticky top-0 z-40 h-16 border-b backdrop-blur-xl transition-colors duration-300 ${theme === 'dark' ? 'border-slate-800/50 bg-[#0a0f1a]/80' : 'border-slate-200 bg-white/80'}`}>
          <div className="flex items-center justify-between h-full px-4 lg:px-6">
            <div className="flex items-center gap-4 flex-1 max-w-lg">
              {isMobile && (
                <button onClick={() => setMobileSidebarOpen(true)} className={`p-2 rounded-xl transition-colors ${theme === 'dark' ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-100 text-slate-600'}`}>
                  <Menu className="w-5 h-5" />
                </button>
              )}
              {/* Omnibox Search + Suggestion Dropdown */}
              <OmniboxDropdown />
            </div>
            <div className="flex items-center gap-2 lg:gap-3">
              {/* Localized Clock Display */}
              <div className={`hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl border ${theme === 'dark' ? 'bg-slate-800/50 border-slate-700/50 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'}`}>
                <Clock className="w-3.5 h-3.5 flex-shrink-0 opacity-60" />
                <LocalizedClock />
              </div>

              {/* Shaa FM Live Radio — headless audio engine */}
              <Navbar />

              <button onClick={toggleTheme} className={`relative p-2.5 rounded-xl border transition-all duration-300 ${theme === 'dark' ? 'bg-slate-800/50 border-slate-700/50 hover:bg-slate-700/50' : 'bg-white border-slate-200 hover:bg-slate-50'}`} title={theme === 'dark' ? t('common.switchToLight') : t('common.switchToDark')}>
                <Sun className={`w-4 h-4 text-amber-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 transition-all duration-300 ${theme === 'dark' ? 'opacity-0 rotate-90 scale-0' : 'opacity-100 rotate-0 scale-100'}`} />
                <Moon className={`w-4 h-4 text-blue-400 transition-all duration-300 ${theme === 'dark' ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-0'}`} />
              </button>
              <LanguageSwitcher />
              <button className={`relative p-2.5 rounded-xl border transition-all ${theme === 'dark' ? 'bg-slate-800/50 border-slate-700/50 hover:bg-slate-700/50' : 'bg-white border-slate-200 hover:bg-slate-50'}`}>
                <Bell className={`w-4 h-4 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`} />
                {notificationCount > 0 && <span className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-r from-orange-500 to-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-lg">{notificationCount}</span>}
              </button>
              <div className={`hidden lg:block w-px h-8 ${theme === 'dark' ? 'bg-slate-700' : 'bg-slate-200'}`} />
              <div className="relative">
                <button onClick={(e) => { e.stopPropagation(); setProfileDropdownOpen(!profileDropdownOpen); }} className={`flex items-center gap-3 p-1.5 pr-3 rounded-xl border transition-all ${theme === 'dark' ? 'bg-slate-800/50 border-slate-700/50 hover:bg-slate-700/50' : 'bg-white border-slate-200 hover:bg-slate-50'}`}>
                  <div className="relative">
                    <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-rose-500 rounded-lg flex items-center justify-center"><User className="w-4 h-4 text-white" /></div>
                    <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-slate-900" />
                  </div>
                  <div className="hidden lg:block text-left">
                    <p className={`text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{user?.name || user?.username || 'User'}</p>
                    <p className={`text-xs ${theme === 'dark' ? 'text-slate-500' : 'text-slate-500'}`}>{user?.email || user?.username || 'user@liyanage.lk'}</p>
                  </div>
                  <ChevronDown className={`hidden lg:block w-4 h-4 transition-transform ${profileDropdownOpen ? 'rotate-180' : ''} ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`} />
                </button>
                {profileDropdownOpen && (
                  <div className={`absolute right-0 top-full mt-2 w-56 rounded-xl border shadow-2xl overflow-hidden ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
                    <div className={`px-4 py-3 border-b ${theme === 'dark' ? 'border-slate-700' : 'border-slate-100'}`}>
                      <p className={`text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{user?.name || user?.username || 'User'}</p>
                      <p className={`text-xs ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>{user?.email || user?.username || 'user@liyanage.lk'}</p>
                    </div>
                    <div className="py-1">
                      <button className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${theme === 'dark' ? 'text-slate-300 hover:bg-slate-700/50' : 'text-slate-700 hover:bg-slate-50'}`}><User className="w-4 h-4" />{t('header.profileSettings')}</button>
                      <button className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${theme === 'dark' ? 'text-slate-300 hover:bg-slate-700/50' : 'text-slate-700 hover:bg-slate-50'}`}><Shield className="w-4 h-4" />{t('header.security')}</button>
                      <button className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${theme === 'dark' ? 'text-slate-300 hover:bg-slate-700/50' : 'text-slate-700 hover:bg-slate-50'}`}><TrendingUp className="w-4 h-4" />{t('header.activityLog')}</button>
                    </div>
                    <div className={`border-t py-1 ${theme === 'dark' ? 'border-slate-700' : 'border-slate-100'}`}>
                      <button
                        onClick={async () => {
                          setProfileDropdownOpen(false);
                          await logout();
                          navigate('/login');
                        }}
                        className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 transition-colors ${theme === 'dark' ? 'hover:bg-red-500/10' : 'hover:bg-red-50'}`}
                      >
                        <LogOut className="w-4 h-4" />
                        {t('header.signOut')}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        <main className="relative p-4 lg:p-6 overflow-x-hidden">
          {children}
        </main>
      </div>

      {/* Bottom floating navbar removed for split-screen usability */}
      {false && (
        <nav className="fixed bottom-0 left-0 right-0 z-30 px-4 pb-4 pt-2">
          <div className={`relative mx-auto max-w-md rounded-2xl border backdrop-blur-xl shadow-2xl overflow-hidden ${theme === 'dark' ? 'bg-slate-900/90 border-slate-700/50' : 'bg-white/90 border-slate-200'}`}>
            <div className="relative flex items-center justify-around py-2 px-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.path);
                return (
                  <Link key={item.path} to={item.path} className="relative flex flex-col items-center group py-1">
                    <div className={`relative p-2.5 rounded-xl transition-all duration-300 ${active ? 'bg-gradient-to-r from-orange-500/20 to-rose-500/20 scale-110' : 'scale-100 group-hover:scale-105'}`}>
                      <Icon className={`w-5 h-5 transition-all duration-300 ${active ? 'text-orange-500' : theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`} />
                      {item.badge && <span className="absolute -top-1 -right-1 w-4 h-4 bg-orange-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">{parseInt(item.badge) > 9 ? '9+' : item.badge}</span>}
                    </div>
                    <span className={`text-[10px] font-medium mt-0.5 transition-all duration-300 ${active ? 'text-orange-500' : theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>{t(item.label)}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </nav>
      )}
    </div>
  );
};