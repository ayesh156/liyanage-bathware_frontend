import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../contexts/ThemeContext';
import { LanguageSwitcher } from './LanguageSwitcher';
import { Package, FileText, Users, Home, Sparkles, Moon, Sun, Menu, X } from 'lucide-react';
import { useIsMobile } from '../hooks/use-mobile';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { t } = useTranslation();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const isMobile = useIsMobile();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Track scroll for mobile nav visibility
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems = [
    { path: '/', icon: Home, label: 'nav.home' },
    { path: '/invoices', icon: FileText, label: 'nav.invoices' },
    { path: '/products', icon: Package, label: 'nav.products' },
    { path: '/customers', icon: Users, label: 'nav.customers' },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className={`min-h-screen transition-colors duration-300 ${theme === 'dark' ? 'bg-[#0a0f1a]' : 'bg-slate-100'}`}>
      {/* Ambient background effects - only in dark mode */}
      <div className={`fixed inset-0 overflow-hidden pointer-events-none transition-opacity duration-300 ${theme === 'dark' ? 'opacity-100' : 'opacity-0'}`}>
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-orange-500/10 rounded-full blur-[120px]" />
        <div className="absolute top-1/2 -left-40 w-80 h-80 bg-purple-500/10 rounded-full blur-[100px]" />
        <div className="absolute -bottom-40 right-1/3 w-72 h-72 bg-blue-500/10 rounded-full blur-[100px]" />
      </div>

      {/* Header */}
      <header className={`sticky top-0 z-50 border-b backdrop-blur-xl transition-colors duration-300 ${theme === 'dark' ? 'border-slate-800/50 bg-[#0a0f1a]/80' : 'border-slate-200 bg-white/90'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo and Brand */}
            <Link to="/" className="flex items-center gap-3 group">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl blur-lg opacity-50 group-hover:opacity-75 transition-opacity" />
                <div className="relative w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg">
                  {/* Creative hardware wrench/hammer logo */}
                  <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
                  </svg>
                </div>
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-bold dark:text-white text-slate-900">
                  Liyanage<span className="text-amber-500"> Hardware</span>
                </span>
                <span className="text-[10px] dark:text-slate-500 text-slate-400 -mt-1 tracking-wider uppercase">Quality Building Materials</span>
              </div>
            </Link>

            {/* Navigation */}
            <nav className={`hidden md:flex items-center gap-1 rounded-full p-1 border transition-colors duration-300 ${theme === 'dark' ? 'bg-slate-800/30 border-slate-700/50' : 'bg-slate-100 border-slate-200'}`}>
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.path);
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`relative flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                      active
                        ? theme === 'dark' ? 'text-white' : 'text-slate-900'
                        : theme === 'dark' ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {active && (
                      <div className={`absolute inset-0 rounded-full border shadow-sm ${
                        theme === 'dark' 
                          ? 'bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border-blue-500/30' 
                          : 'bg-white border-slate-200'
                      }`} />
                    )}
                    <Icon className={`relative w-4 h-4 ${active ? (theme === 'dark' ? 'text-blue-400' : 'text-blue-500') : ''}`} />
                    <span className="relative">{t(item.label)}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Right side */}
            <div className="flex items-center gap-3">
              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                className="relative w-10 h-10 rounded-xl dark:bg-slate-800/50 bg-slate-100 dark:border-slate-700/50 border-slate-200 border flex items-center justify-center dark:hover:bg-slate-700/50 hover:bg-slate-200 transition-all duration-300 group"
                title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                <Sun className={`w-5 h-5 text-amber-500 absolute transition-all duration-300 ${theme === 'dark' ? 'opacity-0 rotate-90 scale-0' : 'opacity-100 rotate-0 scale-100'}`} />
                <Moon className={`w-5 h-5 text-blue-400 absolute transition-all duration-300 ${theme === 'dark' ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-0'}`} />
              </button>
              
              <LanguageSwitcher />
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-orange-500/10 to-rose-500/10 rounded-full border border-orange-500/20">
                <Sparkles className="w-3.5 h-3.5 text-orange-400" />
                <span className="text-xs font-medium text-orange-400">Pro</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation - Creative Floating Nav */}
      {isMobile && (
        <nav className={`fixed bottom-0 left-0 right-0 z-50 px-4 pb-4 pt-2 transition-all duration-500 ${scrolled ? 'translate-y-0' : 'translate-y-0'}`}>
          {/* Glassmorphic container */}
          <div className={`relative mx-auto max-w-md rounded-2xl border backdrop-blur-xl shadow-2xl overflow-hidden ${
            theme === 'dark' 
              ? 'bg-slate-900/80 border-slate-700/50 shadow-black/30' 
              : 'bg-white/80 border-slate-200 shadow-slate-200/50'
          }`}>
            {/* Animated gradient border effect */}
            <div className="absolute inset-0 rounded-2xl overflow-hidden">
              <div 
                className={`absolute inset-[-50%] animate-spin-slow ${theme === 'light' ? 'opacity-10' : 'opacity-20'}`} 
                style={{ 
                  animationDuration: '8s',
                  background: 'conic-gradient(from 0deg, #f97316, #a855f7, #3b82f6, #10b981, #f97316)'
                }} 
              />
            </div>
            
            {/* Nav items container */}
            <div className="relative flex items-center justify-around py-2 px-2">
              {navItems.map((item, index) => {
                const Icon = item.icon;
                const active = isActive(item.path);
                
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className="relative flex flex-col items-center group"
                  >
                    {/* Active indicator - animated blob */}
                    <div className={`absolute -inset-1 rounded-2xl transition-all duration-500 ${
                      active 
                        ? `${theme === 'dark' ? 'bg-gradient-to-r from-orange-500/20 to-rose-500/20' : 'bg-gradient-to-r from-orange-500/10 to-rose-500/10'} scale-100 opacity-100` 
                        : 'scale-75 opacity-0'
                    }`} />
                    
                    {/* Icon container with bounce effect */}
                    <div className={`relative p-3 rounded-xl transition-all duration-300 ${
                      active 
                        ? 'scale-110' 
                        : 'scale-100 group-hover:scale-105'
                    }`}>
                      {/* Ripple effect on active */}
                      {active && (
                        <div className="absolute inset-0 rounded-xl">
                          <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-orange-500 to-rose-500 animate-ping opacity-20" style={{ animationDuration: '2s' }} />
                        </div>
                      )}
                      
                      <Icon className={`relative w-5 h-5 transition-all duration-300 ${
                        active 
                          ? 'text-orange-500 drop-shadow-[0_0_8px_rgba(249,115,22,0.5)]' 
                          : theme === 'dark' ? 'text-slate-400 group-hover:text-slate-300' : 'text-slate-500 group-hover:text-slate-700'
                      }`} />
                    </div>
                    
                    {/* Label with slide-up animation */}
                    <span className={`text-[10px] font-medium mt-0.5 transition-all duration-300 ${
                      active 
                        ? 'text-orange-500 opacity-100 translate-y-0' 
                        : `opacity-70 translate-y-0 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`
                    }`}>
                      {t(item.label)}
                    </span>
                    
                    {/* Active dot indicator */}
                    <div className={`absolute -bottom-1 w-1 h-1 rounded-full bg-orange-500 transition-all duration-300 ${
                      active ? 'opacity-100 scale-100' : 'opacity-0 scale-0'
                    }`} />
                  </Link>
                );
              })}
            </div>
          </div>
        </nav>
      )}

      {/* Main Content - add bottom padding for mobile nav */}
      <main className={`relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 ${isMobile ? 'pb-28' : ''}`}>
        {children}
      </main>

      {/* Footer */}
      <footer className={`relative mt-20 border-t ${theme === 'dark' ? 'border-slate-800/50 bg-[#070a12]' : 'border-slate-200 bg-slate-50'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-10">
            {/* Brand */}
            <div className="md:col-span-1">
              <Link to="/" className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
                  </svg>
                </div>
                <span className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                  Liyanage<span className="text-amber-500"> Hardware</span>
                </span>
              </Link>
              <p className={`text-sm leading-relaxed ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                Your trusted partner for quality building materials and hardware solutions in Sri Lanka.
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className={`text-sm font-semibold mb-4 uppercase tracking-wider ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Navigation</h3>
              <ul className="space-y-3">
                {navItems.map((item) => (
                  <li key={item.path}>
                    <Link 
                      to={item.path} 
                      className={`hover:text-orange-400 transition-colors text-sm flex items-center gap-2 group ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}
                    >
                      <div className={`w-1 h-1 rounded-full group-hover:bg-orange-500 transition-colors ${theme === 'dark' ? 'bg-slate-600' : 'bg-slate-400'}`} />
                      {t(item.label)}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Features */}
            <div>
              <h3 className={`text-sm font-semibold mb-4 uppercase tracking-wider ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Features</h3>
              <ul className={`space-y-3 text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                <li className="flex items-center gap-2">
                  <div className="w-1 h-1 rounded-full bg-green-500" />
                  Real-time Analytics
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1 h-1 rounded-full bg-blue-500" />
                  Invoice Management
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1 h-1 rounded-full bg-purple-500" />
                  Inventory Control
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1 h-1 rounded-full bg-orange-500" />
                  Customer Tracking
                </li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h3 className={`text-sm font-semibold mb-4 uppercase tracking-wider ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Contact</h3>
              <ul className={`space-y-3 text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                <li>info@liyanage.lk</li>
                <li>+94 71 000 0000</li>
                <li>Colombo, Sri Lanka</li>
              </ul>
              <div className="flex gap-3 mt-4">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${theme === 'dark' ? 'bg-slate-800 hover:bg-slate-700' : 'bg-slate-200 hover:bg-slate-300'}`}>
                  <svg className={`w-4 h-4 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`} fill="currentColor" viewBox="0 0 24 24"><path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/></svg>
                </div>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${theme === 'dark' ? 'bg-slate-800 hover:bg-slate-700' : 'bg-slate-200 hover:bg-slate-300'}`}>
                  <svg className={`w-4 h-4 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`} fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom bar */}
          <div className={`pt-8 border-t flex flex-col sm:flex-row justify-between items-center gap-4 ${theme === 'dark' ? 'border-slate-800/50' : 'border-slate-200'}`}>
            <div className="flex items-center gap-2">
              <p className={`text-sm ${theme === 'dark' ? 'text-slate-500' : 'text-slate-500'}`}>
                © 2025 <span className="font-semibold bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">Nebulainfinite</span>. All rights reserved.
              </p>
            </div>
            <div className={`flex items-center gap-6 text-sm ${theme === 'dark' ? 'text-slate-500 hover:[&>span]:text-slate-400' : 'text-slate-500 hover:[&>span]:text-slate-700'}`}>
              <span className="cursor-pointer transition-colors">Privacy Policy</span>
              <span className="cursor-pointer transition-colors">Terms of Service</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
