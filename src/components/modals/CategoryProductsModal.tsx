import React, { useMemo, useState, useCallback, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useTheme } from '../../contexts/ThemeContext';
import { useTranslation } from 'react-i18next';
import { X, Search, Package, Trash2, ArrowRightLeft, Loader2 } from 'lucide-react';
import { toast } from 'react-toastify';
import api from '../../lib/api';
import { useCatalog } from '../../contexts/CatalogContext';
import { InventoryProduct, Category } from '../../types';
import ProductNameTooltip from '../ProductNameTooltip';

interface CategoryProductsModalProps {
  isOpen: boolean;
  category: Category | null;
  onClose: () => void;
}

const HARDWARE_CATEGORY_NAME = 'HARDWARE';

interface ComboboxOption {
  value: string;
  label: string;
}

const stockBadgeClass = (stock: number) => {
  if (stock === 0) return 'bg-red-500/10 text-red-500 border-red-500/20';
  if (stock <= 10) return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
  return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
};

interface SearchComboboxProps {
  options: ComboboxOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  isDark: boolean;
  disabled?: boolean;
}

// ── Portal dropdown constants ──
const PORTAL_Z_INDEX = 9999;
const DROPDOWN_MAX_HEIGHT = 240; // px
const DROPDOWN_GAP = 6;          // px gap between trigger and dropdown
const VIEWPORT_PADDING = 8;      // px padding from viewport edges

const SearchCombobox: React.FC<SearchComboboxProps> = ({ options, value, onChange, placeholder, isDark, disabled }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [menuStyle, setMenuStyle] = useState<React.CSSProperties>({});
  const [direction, setDirection] = useState<'down' | 'up'>('down');

  useEffect(() => {
    const match = options.find((o) => o.value === value);
    setSearch(match ? match.label : value || '');
  }, [value, options]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return options;
    return options.filter(
      (o) => o.label.toLowerCase().includes(q) || o.value.toLowerCase().includes(q)
    );
  }, [search, options]);

  // ── Portal positioning: measure trigger in viewport, render fixed at body level ──
  const recalcPosition = useCallback(() => {
    const triggerEl = containerRef.current;
    const menuEl = dropdownRef.current;
    if (!triggerEl) return;

    const rect = triggerEl.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;

    // Measure actual dropdown height if rendered, otherwise estimate
    let menuHeight = DROPDOWN_MAX_HEIGHT;
    if (menuEl) {
      const menuRect = menuEl.getBoundingClientRect();
      if (menuRect.height > 0) menuHeight = menuRect.height;
    }

    const spaceBelow = viewportHeight - rect.bottom;
    const spaceAbove = rect.top;
    const openUp = spaceBelow < menuHeight + DROPDOWN_GAP && spaceAbove > spaceBelow;

    const left = Math.max(VIEWPORT_PADDING, Math.min(rect.left, viewportWidth - rect.width - VIEWPORT_PADDING));
    const width = Math.max(120, Math.min(rect.width, viewportWidth - left - VIEWPORT_PADDING));

    const gap = DROPDOWN_GAP;
    setDirection(openUp ? 'up' : 'down');
    setMenuStyle({
      position: 'fixed',
      top: openUp ? undefined : rect.bottom + gap,
      bottom: openUp ? viewportHeight - rect.top + gap : undefined,
      left,
      width,
      maxHeight: DROPDOWN_MAX_HEIGHT,
      zIndex: PORTAL_Z_INDEX,
    });
  }, []);

  // Recalculate on scroll/resize while open
  useEffect(() => {
    if (!open) return;
    recalcPosition();
    // Use two RAFs to ensure dropdown has painted for measurement
    const raf = requestAnimationFrame(() => requestAnimationFrame(recalcPosition));
    window.addEventListener('scroll', recalcPosition, { capture: true, passive: true });
    window.addEventListener('resize', recalcPosition, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', recalcPosition, { capture: true } as EventListenerOptions);
      window.removeEventListener('resize', recalcPosition);
    };
  }, [open, recalcPosition, search]);

  // Close on outside click — must account for BOTH the trigger and the portal menu
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (containerRef.current?.contains(target)) return;
      if (dropdownRef.current?.contains(target)) return;
      setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Focus the search input inside the portal dropdown when opened
  useEffect(() => {
    if (open) {
      // Small delay so the portal has painted and is focusable
      const t = setTimeout(() => {
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
      }, 10);
      return () => clearTimeout(t);
    }
  }, [open]);

  // Close dropdown on Escape (stop propagation so the modal doesn't also close)
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        setOpen(false);
      }
    };
    document.addEventListener('keydown', onKey, true);
    return () => document.removeEventListener('keydown', onKey, true);
  }, [open]);

  // ── Helpers ──
  const selectOption = (opt: ComboboxOption) => {
    onChange(opt.value);
    setSearch(opt.label);
    setOpen(false);
  };

  const handleTriggerKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.stopPropagation();
      setOpen(false);
    }
    if (e.key === 'Enter' && filtered.length === 1) {
      selectOption(filtered[0]);
    }
  };

  if (disabled) {
    return (
      <div className={`flex items-center gap-1 px-2 py-1.5 text-[10px] font-semibold rounded-lg border opacity-50 cursor-not-allowed ${
        isDark ? 'bg-slate-800 border-slate-600 text-slate-500' : 'bg-white border-slate-300 text-slate-400'
      }`}>
        <Loader2 className="w-3 h-3 animate-spin" />
        Moving...
      </div>
    );
  }

  const dropdownPanel = open ? (
    <div
      ref={dropdownRef}
      style={menuStyle}
      className={`fixed rounded-lg border shadow-2xl overflow-hidden animate-fade-in ${
        direction === 'up' ? 'mb-1' : 'mt-0'
      } ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}
    >
      {/* Inline search input inside the popover */}
      <div className={`px-1.5 pt-1.5 pb-1 border-b ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
        <div className="relative">
          <Search className={`absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
          <input
            ref={searchInputRef}
            type="text"
            autoComplete="off"
            value={search}
            onChange={(e) => { setSearch(e.target.value); recalcPosition(); }}
            placeholder={placeholder || 'Search categories...'}
            className={`w-full pl-7 pr-2 py-1.5 text-[10px] font-semibold border rounded-md focus:outline-none focus:ring-1 ${
              isDark
                ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-500 focus:ring-orange-500/50 focus:border-orange-500'
                : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400 focus:ring-orange-500/50 focus:border-orange-500'
            }`}
          />
        </div>
      </div>

      {/* Options list — scrollable with max-height 240px */}
      <div className="overflow-y-auto custom-scrollbar" style={{ maxHeight: DROPDOWN_MAX_HEIGHT - 42 }}>
        {filtered.length > 0 ? filtered.map((opt) => (
          <button
            key={opt.value}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => selectOption(opt)}
            className={`w-full text-left px-2.5 py-2 text-[10px] font-semibold transition-colors ${
              opt.value === value
                ? 'bg-orange-500/20 text-orange-400'
                : isDark ? 'text-slate-300 hover:bg-slate-700' : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            {opt.label}
          </button>
        )) : (
          <div className={`px-2.5 py-2 text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            No matching categories
          </div>
        )}
      </div>
    </div>
  ) : null;

  return (
    <>
      <div ref={containerRef} className="relative flex-shrink-0">
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setOpen(true); recalcPosition(); }}
            onFocus={() => setOpen(true)}
            onKeyDown={handleTriggerKeyDown}
            placeholder={placeholder || 'Search...'}
            className={`w-[150px] px-2 py-1.5 text-[10px] font-semibold border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 transition-all pr-7 cursor-pointer ${
              isDark
                ? 'bg-slate-800 border-slate-600 text-slate-300 placeholder:text-slate-500 hover:bg-slate-700'
                : 'bg-white border-slate-300 text-slate-600 placeholder:text-slate-400 hover:bg-slate-50'
            }`}
          />
          {search.length > 0 && (
            <button
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => { setSearch(''); setOpen(true); inputRef.current?.focus(); }}
              className={`absolute right-1.5 top-1/2 -translate-y-1/2 p-0.5 rounded transition-colors ${isDark ? 'text-slate-500 hover:text-white' : 'text-slate-400 hover:text-slate-700'}`}
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>
      {createPortal(dropdownPanel, document.body)}
    </>
  );
};

export const CategoryProductsModal: React.FC<CategoryProductsModalProps> = ({ isOpen, category, onClose }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const { i18n } = useTranslation();
  const isSinhala = i18n.language === 'si';

  const { inventoryItems, categories, updateInventoryItem, syncCategoriesFromServer } = useCatalog();

  const [filterQuery, setFilterQuery] = useState('');
  const [pendingMoveIds, setPendingMoveIds] = useState<Set<string>>(new Set());
  const [pendingReassignIds, setPendingReassignIds] = useState<Set<string>>(new Set());

  const handleClose = useCallback(() => {
    setFilterQuery('');
    setPendingMoveIds(new Set());
    setPendingReassignIds(new Set());
    onClose();
  }, [onClose]);

  // ── HOOKS CALLED UNCONDITIONALLY ──
  const categoryProducts = useMemo(() => {
    if (!category) return [];
    const catName = category.name.trim().toLowerCase();
    return inventoryItems.filter(p => {
      const matchByName = p.productCategory?.trim().toLowerCase() === catName;
      const matchById = p.categoryId === category.id;
      return matchByName || matchById;
    });
  }, [inventoryItems, category]);

  const filteredProducts = useMemo(() => {
    if (!filterQuery.trim()) return categoryProducts;
    const q = filterQuery.toLowerCase().trim();
    return categoryProducts.filter(item => {
      return (
        item.name?.toLowerCase().includes(q) ||
        item.nameSinhala?.toLowerCase().includes(q) ||
        item.nameSi?.toLowerCase().includes(q) ||
        item.searchKey?.toLowerCase().includes(q) ||
        item.barcode?.toLowerCase().includes(q)
      );
    });
  }, [categoryProducts, filterQuery]);

  const resolveCategoryIdByName = useCallback((categoryName: string): string | undefined => {
    const found = categories.find(c => c.name.toLowerCase() === categoryName.toLowerCase());
    return found?.id;
  }, [categories]);

  const reassignTargets = useMemo<ComboboxOption[]>(() => {
    return categories
      .filter(c => c.name.trim().toUpperCase() !== HARDWARE_CATEGORY_NAME)
      .sort((a, b) => a.name.localeCompare(b.name))
      .map(c => ({
        value: c.name,
        label: isSinhala && c.nameSinhala ? `${c.nameSinhala} (${c.name})` : c.name,
      }));
  }, [categories, isSinhala]);

  const getProductDisplayName = useCallback((item: InventoryProduct): string => {
    if (isSinhala) return item.nameSinhala || item.nameSi || item.name;
    return item.name;
  }, [isSinhala]);

  const getCategoryDisplayName = useCallback((cat: Category): string => {
    if (isSinhala && cat.nameSinhala) return cat.nameSinhala;
    return cat.name;
  }, [isSinhala]);

  // ── OPTIMISTIC MOVE TO HARDWARE ──
  const handleMoveToHardware = useCallback(async (item: InventoryProduct) => {
    if (pendingMoveIds.has(item.id)) return;
    setPendingMoveIds(prev => new Set(prev).add(item.id));
    const targetCategoryId = resolveCategoryIdByName(HARDWARE_CATEGORY_NAME) || item.categoryId;
    updateInventoryItem(item.id, {
      productCategory: HARDWARE_CATEGORY_NAME,
      categoryId: targetCategoryId,
    });
    try {
      const response: any = await api.patch(`/products/${item.id}`, {
        productCategory: HARDWARE_CATEGORY_NAME,
      }, true);
      if (response?.syncCategories && Array.isArray(response.syncCategories)) {
        syncCategoriesFromServer(response.syncCategories);
      }
      const serverProduct = response?.data;
      if (serverProduct && typeof serverProduct === 'object') {
        const serverPatch: Partial<InventoryProduct> = {};
        if (serverProduct.productCategory !== undefined) serverPatch.productCategory = serverProduct.productCategory;
        if (serverProduct.categoryId !== undefined) serverPatch.categoryId = serverProduct.categoryId;
        if (serverProduct.categorySi !== undefined) serverPatch.categorySi = serverProduct.categorySi;
        if (Object.keys(serverPatch).length > 0) {
          updateInventoryItem(item.id, serverPatch);
        }
      }
      const displayName = isSinhala
        ? (item.nameSinhala || item.nameSi || item.name)
        : item.name;
      toast.success(`"${displayName}" moved to HARDWARE`, { autoClose: 2500 });
    } catch (err: any) {
      updateInventoryItem(item.id, {
        productCategory: item.productCategory,
        categoryId: item.categoryId,
        categorySi: item.categorySi,
      });
      toast.error(err?.message || 'Failed to move product', { autoClose: 4000 });
    } finally {
      setPendingMoveIds(prev => {
        const next = new Set(prev);
        next.delete(item.id);
        return next;
      });
    }
  }, [pendingMoveIds, updateInventoryItem, syncCategoriesFromServer, resolveCategoryIdByName, isSinhala]);

  // ── REASSIGN FROM HARDWARE → TARGET CATEGORY ──
  const handleReassignFromHardware = useCallback(async (item: InventoryProduct, targetCategoryName: string) => {
    if (!targetCategoryName || targetCategoryName === HARDWARE_CATEGORY_NAME) return;
    if (pendingReassignIds.has(item.id)) return;
    setPendingReassignIds(prev => new Set(prev).add(item.id));
    const targetCategoryId = resolveCategoryIdByName(targetCategoryName) || item.categoryId;
    updateInventoryItem(item.id, {
      productCategory: targetCategoryName,
      categoryId: targetCategoryId,
    });
    try {
      const response: any = await api.patch(`/products/${item.id}`, {
        productCategory: targetCategoryName,
      }, true);
      if (response?.syncCategories && Array.isArray(response.syncCategories)) {
        syncCategoriesFromServer(response.syncCategories);
      }
      const serverProduct = response?.data;
      if (serverProduct && typeof serverProduct === 'object') {
        const serverPatch: Partial<InventoryProduct> = {};
        if (serverProduct.productCategory !== undefined) serverPatch.productCategory = serverProduct.productCategory;
        if (serverProduct.categoryId !== undefined) serverPatch.categoryId = serverProduct.categoryId;
        if (serverProduct.categorySi !== undefined) serverPatch.categorySi = serverProduct.categorySi;
        if (Object.keys(serverPatch).length > 0) {
          updateInventoryItem(item.id, serverPatch);
        }
      }
      const displayName = isSinhala
        ? (item.nameSinhala || item.nameSi || item.name)
        : item.name;
      toast.success(`"${displayName}" reassigned to ${targetCategoryName}`, { autoClose: 2500 });
    } catch (err: any) {
      updateInventoryItem(item.id, {
        productCategory: item.productCategory,
        categoryId: item.categoryId,
        categorySi: item.categorySi,
      });
      toast.error(err?.message || 'Failed to reassign product', { autoClose: 4000 });
    } finally {
      setPendingReassignIds(prev => {
        const next = new Set(prev);
        next.delete(item.id);
        return next;
      });
    }
  }, [pendingReassignIds, updateInventoryItem, syncCategoriesFromServer, resolveCategoryIdByName, isSinhala]);

  if (!isOpen || !category) return null;

  const isHardwareCategory = category.name.trim().toUpperCase() === HARDWARE_CATEGORY_NAME;

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleClose} />

      <div className={`relative w-[600px] max-w-[calc(100vw-16px)] mx-2 rounded-xl border shadow-2xl overflow-hidden animate-fade-in flex flex-col max-h-[85vh] ${
        isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'
      }`}>
        {/* HEADER */}
        <div className={`flex items-center justify-between px-4 py-3 border-b ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-orange-500 to-rose-500 flex items-center justify-center flex-shrink-0 shadow-lg shadow-orange-500/20">
              <Package className="w-3.5 h-3.5 text-white" />
            </div>
            <div className="min-w-0">
              <h2 className={`text-sm font-bold uppercase tracking-wide truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {getCategoryDisplayName(category)}
              </h2>
              <p className={`text-[10px] font-mono ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                {filteredProducts.length} / {categoryProducts.length} items
              </p>
            </div>
          </div>
          <button onClick={handleClose} className={`p-1.5 rounded transition-colors ${isDark ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-100 text-slate-500'}`} title="Close">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* SEARCH */}
        <div className={`px-4 pt-2.5 pb-3 border-b ${isDark ? 'border-slate-800/50' : 'border-slate-100'}`}>
          <div className="relative">
            <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
            <input
              type="text"
              autoFocus
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              placeholder={`Filter ${category.name} items (Name, Search Key, Barcode)...`}
              className={`w-full border rounded-xl py-2 pl-9 pr-8 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-orange-500/50 focus:border-orange-500/50 transition-all ${
                isDark
                  ? 'bg-slate-800 border-slate-700 text-white placeholder:text-slate-500'
                  : 'bg-white border-slate-200 text-slate-900 placeholder:text-slate-400'
              }`}
            />
            {filterQuery.length > 0 && (
              <button onClick={() => setFilterQuery('')} className={`absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded transition-colors ${isDark ? 'text-slate-400 hover:text-white hover:bg-slate-700' : 'text-slate-400 hover:text-slate-700 hover:bg-slate-200'}`}>
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* PRODUCT LIST */}
        <div className="overflow-y-auto overflow-x-hidden custom-scrollbar flex-1 min-h-0" style={{ maxHeight: 'calc(85vh - 9rem)' }}>
          {filteredProducts.length > 0 ? (
            <div className="flex flex-col gap-1 px-2 py-2">
              {filteredProducts.map((item) => {
                const isPending = pendingMoveIds.has(item.id) || pendingReassignIds.has(item.id);
                const displayName = getProductDisplayName(item);
                return (
                  <div
                    key={item.id}
                    className={`p-2.5 rounded-xl flex items-center gap-2.5 border-l-4 transition-all duration-150 ${
                      isDark
                        ? 'bg-slate-800/30 hover:bg-slate-800/70 border-l-transparent hover:border-slate-700'
                        : 'bg-slate-50 hover:bg-slate-100 border-l-transparent hover:border-slate-300'
                    } ${isPending ? 'opacity-50 pointer-events-none' : ''}`}
                  >
                    <span className={`inline-flex min-w-[2.35rem] items-center justify-center rounded-lg border px-2 py-1 text-[11px] font-bold flex-shrink-0 ${stockBadgeClass(item.storeQty)}`}>
                      {item.storeQty}
                    </span>

                    <div className="min-w-0 flex-1">
                      <ProductNameTooltip name={item.name} nameSinhala={item.nameSinhala} nameSi={item.nameSi}>
                        <p className={`truncate text-[11px] font-semibold ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
                          {displayName}
                        </p>
                      </ProductNameTooltip>
                      <div className="mt-0.5 flex items-center gap-1.5">
                        <span className={`text-[8px] font-mono ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                          {item.searchKey}
                        </span>
                        {item.barcode && (
                          <>
                            <span className={`text-[8px] ${isDark ? 'text-slate-600' : 'text-slate-300'}`}>•</span>
                            <span className={`text-[8px] font-mono ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                              {item.barcode}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <p className={`text-[11px] font-black ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>
                        Rs. {Number(item.salesPrice).toFixed(2)}
                      </p>
                      {item.cost > 0 && (
                        <p className={`text-[8px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                          Cost Rs. {Number(item.cost).toFixed(2)}
                        </p>
                      )}
                    </div>

                    {isHardwareCategory ? (
                      <SearchCombobox
                        options={reassignTargets}
                        value=""
                        onChange={(target) => handleReassignFromHardware(item, target)}
                        placeholder="Reassign category..."
                        isDark={isDark}
                        disabled={isPending}
                      />
                    ) : (
                      <button
                        onClick={() => handleMoveToHardware(item)}
                        disabled={isPending}
                        className={`flex items-center gap-1 px-2 py-1.5 rounded-lg text-[10px] font-semibold transition-all flex-shrink-0 ${
                          isDark
                            ? 'bg-slate-700/40 text-slate-300 hover:bg-rose-500/20 hover:text-rose-400 border border-slate-600/50'
                            : 'bg-white text-slate-600 hover:bg-rose-50 hover:text-rose-600 border border-slate-200'
                        } ${isPending ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                        title="Move to HARDWARE"
                      >
                        {isPending ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <Trash2 className="w-3 h-3" />
                        )}
                        <span className="hidden sm:inline">Move to HARDWARE</span>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12">
              <Package className={`w-10 h-10 mb-2 ${isDark ? 'text-slate-600' : 'text-slate-300'}`} />
              <p className={`text-xs font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                {filterQuery.trim() ? 'No products match your search in this category' : 'No products in this category'}
              </p>
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div className={`flex items-center justify-between px-4 py-2 border-t ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
          <div className={`flex items-center gap-1.5 text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
            <ArrowRightLeft className="w-3 h-3" />
            {isHardwareCategory
              ? 'Reassign items from HARDWARE to their permanent category'
              : `Moving an item reassigns it to ${HARDWARE_CATEGORY_NAME}`}
          </div>
          <button onClick={handleClose} className={`px-3 py-1.5 rounded-lg text-[10px] font-semibold transition-all ${
            isDark
              ? 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-600'
              : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
          }`}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default CategoryProductsModal;