import React, { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../contexts/ThemeContext';
import {
  Keyboard, X, Search, Package, ShoppingCart, CreditCard,
  Percent, ArrowLeft, ArrowRight, ArrowUp, ArrowDown,
  CheckCircle, User, Printer, RotateCcw, Barcode, Calculator,
  Zap, ChevronLeft, ChevronRight
} from 'lucide-react';

export type InvoiceStep = 'customer' | 'products' | 'review';
export type CheckoutMode = 'search' | 'quantity' | 'cart' | 'payment' | 'discount' | 'priceMode' | 'itemDiscount';

interface ShortcutItem {
  key: string;
  label: string;
  icon?: React.ReactNode;
  color?: string;
}

interface ShortcutGroup {
  title: string;
  icon: React.ReactNode;
  color: string;
  shortcuts: ShortcutItem[];
}

interface ShortcutMapOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  currentStep?: InvoiceStep;
  currentMode?: CheckoutMode;
  isQuickCheckout?: boolean;
  stepIndex?: number;
  totalSteps?: number;
}

export const ShortcutMapOverlay: React.FC<ShortcutMapOverlayProps> = ({
  isOpen,
  onClose,
  currentStep = 'products',
  currentMode = 'search',
  isQuickCheckout = false,
  stepIndex = 1,
  totalSteps = 3,
}) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Build shortcut groups based on current step and mode
  const getShortcutGroups = (): ShortcutGroup[] => {
    const groups: ShortcutGroup[] = [];

    // Global Navigation - Always visible
    const globalNav: ShortcutGroup = {
      title: t('shortcuts.navigation') || 'Navigation',
      icon: <ChevronLeft className="w-4 h-4" />,
      color: 'blue',
      shortcuts: [
        { key: '←', label: t('shortcuts.previousStep') || 'Previous Step' },
        { key: '→', label: t('shortcuts.nextStep') || 'Next Step' },
        { key: 'Esc', label: t('shortcuts.cancelOrBack') || 'Cancel / Back' },
      ],
    };
    groups.push(globalNav);

    if (isQuickCheckout || currentStep === 'products') {
      // Quick Actions for Product Selection
      const quickActions: ShortcutGroup = {
        title: t('shortcuts.quickActions') || 'Quick Actions',
        icon: <Zap className="w-4 h-4" />,
        color: 'amber',
        shortcuts: [
          { key: 'F2', label: t('quickCheckout.shortcut.search') || 'Search / Barcode' },
          { key: 'F3', label: t('quickCheckout.shortcut.quantity') || 'Quantity' },
          { key: 'F4', label: t('quickCheckout.shortcut.cart') || 'Cart' },
          { key: 'F5', label: t('quickCheckout.shortcut.payment') || 'Payment' },
          { key: 'F6', label: t('quickCheckout.shortcut.discount') || 'Discount' },
          { key: 'F7', label: t('quickCheckout.shortcut.received') || 'Received Amount' },
          { key: 'F9', label: t('quickCheckout.shortcut.quickSave') || 'Quick Save' },
        ],
      };
      groups.push(quickActions);

      // Mode-specific shortcuts
      if (currentMode === 'search') {
        groups.push({
          title: t('shortcuts.searchMode') || 'Search Mode',
          icon: <Search className="w-4 h-4" />,
          color: 'cyan',
          shortcuts: [
            { key: '↑ / ↓', label: t('shortcuts.navigateProducts') || 'Navigate Products' },
            { key: 'Enter', label: t('shortcuts.selectProduct') || 'Add Selected Product' },
            { key: 'Tab', label: t('shortcuts.toggleBarcodeName') || 'Toggle Barcode / Name Search' },
          ],
        });
      }

      if (currentMode === 'quantity') {
        groups.push({
          title: t('quickCheckout.quantityMode') || 'Quantity Mode',
          icon: <Calculator className="w-4 h-4" />,
          color: 'emerald',
          shortcuts: [
            { key: '←', label: t('quickCheckout.shortcut.decreaseQty') || 'Decrease Quantity' },
            { key: '→', label: t('quickCheckout.shortcut.increaseQty') || 'Increase Quantity' },
            { key: 'Enter', label: t('shortcuts.confirmAndAdd') || 'Confirm & Add to Cart' },
            { key: 'Esc', label: t('shortcuts.cancelSelection') || 'Cancel Selection' },
          ],
        });
      }

      if (currentMode === 'cart') {
        groups.push({
          title: t('quickCheckout.cartMode') || 'Cart Mode',
          icon: <ShoppingCart className="w-4 h-4" />,
          color: 'purple',
          shortcuts: [
            { key: '↑ / ↓', label: t('quickCheckout.shortcut.navigateItems') || 'Navigate Items' },
            { key: '←', label: t('quickCheckout.shortcut.decreaseQty') || 'Decrease Quantity' },
            { key: '→', label: t('quickCheckout.shortcut.increaseQty') || 'Increase Quantity' },
            { key: 'Del', label: t('shortcuts.removeItem') || 'Remove Item' },
          ],
        });
      }

      if (currentMode === 'payment') {
        groups.push({
          title: t('quickCheckout.paymentMode') || 'Payment Mode',
          icon: <CreditCard className="w-4 h-4" />,
          color: 'teal',
          shortcuts: [
            { key: '←', label: t('invoice.cash') || 'Cash' },
            { key: '→', label: t('quickCheckout.credit') || 'Credit' },
            { key: '1', label: t('invoice.cash') || 'Cash (Quick)' },
            { key: '2', label: t('invoice.card') || 'Card (Quick)' },
            { key: '3', label: t('invoice.bankTransfer') || 'Bank Transfer' },
            { key: '4', label: t('quickCheckout.credit') || 'Credit' },
          ],
        });
      }

      if (currentMode === 'priceMode') {
        groups.push({
          title: t('shortcuts.priceMode') || 'Price Mode',
          icon: <Percent className="w-4 h-4" />,
          color: 'pink',
          shortcuts: [
            { key: '←', label: t('shortcuts.previousPriceMode') || 'Previous Mode' },
            { key: '→', label: t('shortcuts.nextPriceMode') || 'Next Mode' },
            { key: '1', label: t('invoice.auto') || 'Auto (Customer Type)' },
            { key: '2', label: t('invoice.retail') || 'Retail' },
            { key: '3', label: t('invoice.wholesale') || 'Wholesale' },
            { key: '4', label: t('invoice.custom') || 'Custom Price' },
          ],
        });
      }

      if (currentMode === 'itemDiscount') {
        groups.push({
          title: t('shortcuts.itemDiscount') || 'Item Discount',
          icon: <Percent className="w-4 h-4" />,
          color: 'rose',
          shortcuts: [
            { key: '←', label: t('shortcuts.previousOption') || 'Previous Option' },
            { key: '→', label: t('shortcuts.nextOption') || 'Next Option' },
            { key: '0', label: t('invoice.none') || 'No Discount' },
            { key: 'P', label: t('invoice.percentage') || 'Percentage' },
            { key: 'F', label: t('invoice.fixed') || 'Fixed Amount' },
          ],
        });
      }
    }

    if (currentStep === 'customer') {
      groups.push({
        title: t('shortcuts.customerSelection') || 'Customer Selection',
        icon: <User className="w-4 h-4" />,
        color: 'blue',
        shortcuts: [
          { key: '↑ / ↓', label: t('shortcuts.navigateCustomers') || 'Navigate Customers' },
          { key: 'Enter', label: t('shortcuts.selectCustomer') || 'Select Customer' },
          { key: 'W', label: t('shortcuts.walkIn') || 'Walk-in Customer' },
          { key: 'Tab', label: t('shortcuts.focusSearch') || 'Focus Search' },
        ],
      });
    }

    if (currentStep === 'review') {
      groups.push({
        title: t('shortcuts.reviewActions') || 'Review & Pay',
        icon: <CheckCircle className="w-4 h-4" />,
        color: 'emerald',
        shortcuts: [
          { key: 'F9', label: t('quickCheckout.shortcut.quickSave') || 'Quick Save' },
          { key: 'F12', label: t('shortcuts.completeInvoice') || 'Complete & Print' },
          { key: 'P', label: t('shortcuts.printPreview') || 'Print Preview' },
          { key: '1-4', label: t('shortcuts.paymentQuick') || 'Payment Method (1-4)' },
          { key: 'D', label: t('shortcuts.focusDiscount') || 'Overall Discount' },
          { key: 'T', label: t('shortcuts.toggleTax') || 'Toggle Tax' },
          { key: 'N', label: t('shortcuts.focusNotes') || 'Notes Field' },
        ],
      });
      
      // Checkout Action
      groups.push({
        title: t('shortcuts.checkoutActions') || 'Checkout',
        icon: <Printer className="w-4 h-4" />,
        color: 'amber',
        shortcuts: [
          { key: 'F12', label: t('quickCheckout.shortcut.checkout') || 'Complete Checkout' },
          { key: 'Ctrl+P', label: t('shortcuts.printInvoice') || 'Print Invoice' },
          { key: 'Esc', label: t('shortcuts.backToEdit') || 'Back to Edit' },
        ],
      });
    }

    return groups;
  };

  const shortcutGroups = getShortcutGroups();

  const getColorClasses = (color: string) => {
    const colors: Record<string, { bg: string; text: string; border: string }> = {
      blue: {
        bg: isDark ? 'bg-blue-500/10' : 'bg-blue-50',
        text: isDark ? 'text-blue-400' : 'text-blue-600',
        border: isDark ? 'border-blue-500/30' : 'border-blue-200',
      },
      cyan: {
        bg: isDark ? 'bg-cyan-500/10' : 'bg-cyan-50',
        text: isDark ? 'text-cyan-400' : 'text-cyan-600',
        border: isDark ? 'border-cyan-500/30' : 'border-cyan-200',
      },
      emerald: {
        bg: isDark ? 'bg-emerald-500/10' : 'bg-emerald-50',
        text: isDark ? 'text-emerald-400' : 'text-emerald-600',
        border: isDark ? 'border-emerald-500/30' : 'border-emerald-200',
      },
      amber: {
        bg: isDark ? 'bg-amber-500/10' : 'bg-amber-50',
        text: isDark ? 'text-amber-400' : 'text-amber-600',
        border: isDark ? 'border-amber-500/30' : 'border-amber-200',
      },
      purple: {
        bg: isDark ? 'bg-purple-500/10' : 'bg-purple-50',
        text: isDark ? 'text-purple-400' : 'text-purple-600',
        border: isDark ? 'border-purple-500/30' : 'border-purple-200',
      },
      pink: {
        bg: isDark ? 'bg-pink-500/10' : 'bg-pink-50',
        text: isDark ? 'text-pink-400' : 'text-pink-600',
        border: isDark ? 'border-pink-500/30' : 'border-pink-200',
      },
      rose: {
        bg: isDark ? 'bg-rose-500/10' : 'bg-rose-50',
        text: isDark ? 'text-rose-400' : 'text-rose-600',
        border: isDark ? 'border-rose-500/30' : 'border-rose-200',
      },
      teal: {
        bg: isDark ? 'bg-teal-500/10' : 'bg-teal-50',
        text: isDark ? 'text-teal-400' : 'text-teal-600',
        border: isDark ? 'border-teal-500/30' : 'border-teal-200',
      },
    };
    return colors[color] || colors.blue;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />
      
      {/* Modal */}
      <div className={`relative w-full max-w-4xl max-h-[85vh] mx-4 rounded-2xl overflow-hidden shadow-2xl ${
        isDark ? 'bg-slate-900 border border-slate-700' : 'bg-white'
      }`}>
        {/* Header */}
        <div className={`sticky top-0 z-10 px-6 py-4 border-b ${
          isDark ? 'bg-slate-900/95 backdrop-blur border-slate-700' : 'bg-white/95 backdrop-blur border-slate-200'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/30">
                <Keyboard className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {t('quickCheckout.keyboardShortcuts')}
                </h2>
                <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  {isQuickCheckout 
                    ? t('shortcuts.quickCheckoutContext') || 'Quick Checkout Mode'
                    : `${t('shortcuts.step') || 'Step'} ${stepIndex} ${t('shortcuts.of') || 'of'} ${totalSteps}`
                  }
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {/* Current Mode Indicator */}
              <div className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
                isDark ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30' : 'bg-amber-50 text-amber-700 border border-amber-200'
              }`}>
                {currentStep === 'customer' && (
                  <span className="flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5" />
                    {t('invoice.stepCustomer')}
                  </span>
                )}
                {currentStep === 'products' && (
                  <span className="flex items-center gap-1.5">
                    <Package className="w-3.5 h-3.5" />
                    {t('invoice.stepProducts')}
                  </span>
                )}
                {currentStep === 'review' && (
                  <span className="flex items-center gap-1.5">
                    <CheckCircle className="w-3.5 h-3.5" />
                    {t('invoice.stepReview')}
                  </span>
                )}
              </div>
              
              <button
                onClick={onClose}
                className={`p-2 rounded-lg transition-colors ${
                  isDark ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-100 text-slate-600'
                }`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(85vh-80px)]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {shortcutGroups.map((group, groupIndex) => {
              const colors = getColorClasses(group.color);
              return (
                <div
                  key={groupIndex}
                  className={`p-4 rounded-xl border ${colors.bg} ${colors.border}`}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <div className={colors.text}>{group.icon}</div>
                    <h3 className={`font-semibold ${colors.text}`}>{group.title}</h3>
                  </div>
                  <div className="space-y-2">
                    {group.shortcuts.map((shortcut, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <kbd className={`px-2 py-1 rounded font-mono text-sm font-medium ${
                          isDark 
                            ? 'bg-slate-800 text-slate-300 border border-slate-700' 
                            : 'bg-white text-slate-700 border border-slate-300 shadow-sm'
                        }`}>
                          {shortcut.key}
                        </kbd>
                        <span className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                          {shortcut.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer hint */}
          <div className={`mt-6 pt-4 border-t ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
            <p className={`text-center text-sm ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
              {t('shortcuts.pressToClose') || 'Press'} <kbd className={`px-1.5 py-0.5 rounded font-mono text-xs ${
                isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-600'
              }`}>Esc</kbd> {t('shortcuts.orClickOutside') || 'or click outside to close'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Mini Shortcut Hints Component - shows at bottom of screen
interface ShortcutHintsBarProps {
  currentStep: InvoiceStep;
  currentMode: CheckoutMode;
  isQuickCheckout?: boolean;
  onShowFullMap: () => void;
}

export const ShortcutHintsBar: React.FC<ShortcutHintsBarProps> = ({
  currentStep,
  currentMode,
  isQuickCheckout = false,
  onShowFullMap,
}) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const getContextualHints = () => {
    if (currentStep === 'customer') {
      return [
        { key: '↑↓', label: t('shortcuts.navigate') || 'Navigate' },
        { key: 'Enter', label: t('shortcuts.select') || 'Select' },
        { key: 'W', label: t('shortcuts.walkIn') || 'Walk-in' },
        { key: '→', label: t('shortcuts.next') || 'Next Step' },
      ];
    }

    if (currentStep === 'products') {
      if (currentMode === 'search') {
        return [
          { key: 'F2', label: t('quickCheckout.shortcut.search') || 'Search' },
          { key: '↑↓', label: t('shortcuts.navigate') || 'Navigate' },
          { key: 'Enter', label: t('shortcuts.add') || 'Add' },
          { key: '←→', label: t('shortcuts.steps') || 'Steps' },
        ];
      }
      if (currentMode === 'quantity') {
        return [
          { key: '←→', label: t('shortcuts.adjustQty') || 'Adjust Qty' },
          { key: 'Enter', label: t('shortcuts.confirm') || 'Confirm' },
          { key: 'Esc', label: t('shortcuts.cancel') || 'Cancel' },
        ];
      }
      if (currentMode === 'cart') {
        return [
          { key: '↑↓', label: t('quickCheckout.shortcut.navigateItems') || 'Navigate' },
          { key: '←→', label: t('quickCheckout.shortcut.adjustQty') || 'Adjust Qty' },
          { key: 'Del', label: t('shortcuts.remove') || 'Remove' },
        ];
      }
      if (currentMode === 'priceMode' || currentMode === 'itemDiscount') {
        return [
          { key: '←→', label: t('shortcuts.toggle') || 'Toggle Options' },
          { key: 'Tab', label: t('shortcuts.nextField') || 'Next Field' },
          { key: 'Enter', label: t('shortcuts.confirm') || 'Confirm' },
        ];
      }
    }

    if (currentStep === 'review') {
      return [
        { key: 'F12', label: t('shortcuts.complete') || 'Complete' },
        { key: '1-4', label: t('shortcuts.payment') || 'Payment' },
        { key: 'D', label: t('shortcuts.discount') || 'Discount' },
        { key: '←', label: t('shortcuts.back') || 'Back' },
      ];
    }

    return [
      { key: '?', label: t('shortcuts.help') || 'Help' },
      { key: '←→', label: t('shortcuts.steps') || 'Steps' },
    ];
  };

  const hints = getContextualHints();

  return (
    <div className={`fixed bottom-0 left-0 right-0 z-40 px-4 py-2 ${
      isDark ? 'bg-slate-900/95 backdrop-blur border-t border-slate-700' : 'bg-white/95 backdrop-blur border-t border-slate-200 shadow-lg'
    }`}>
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-4">
          {hints.map((hint, index) => (
            <div key={index} className="flex items-center gap-1.5">
              <kbd className={`px-1.5 py-0.5 rounded text-xs font-mono font-medium ${
                isDark 
                  ? 'bg-slate-800 text-slate-300 border border-slate-700' 
                  : 'bg-slate-100 text-slate-600 border border-slate-200'
              }`}>
                {hint.key}
              </kbd>
              <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                {hint.label}
              </span>
            </div>
          ))}
        </div>
        
        <button
          onClick={onShowFullMap}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            isDark 
              ? 'bg-slate-800 text-amber-400 hover:bg-slate-700 border border-slate-700' 
              : 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200'
          }`}
        >
          <Keyboard className="w-3.5 h-3.5" />
          {t('shortcuts.allShortcuts') || 'All Shortcuts'}
          <kbd className={`ml-1 px-1 py-0.5 rounded text-[10px] font-mono ${
            isDark ? 'bg-slate-700 text-slate-400' : 'bg-amber-100 text-amber-600'
          }`}>?</kbd>
        </button>
      </div>
    </div>
  );
};
