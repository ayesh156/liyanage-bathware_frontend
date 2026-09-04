import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { mockCategories } from '../data/mockData';
import { Category, InventoryProduct } from '../types/index';
import { useTheme } from '../contexts/ThemeContext';
import { useCatalog } from '../contexts/CatalogContext';
import { Search, Package, ChevronDown, ChevronUp, Plus } from 'lucide-react';

interface CategoryGridProps {
  onItemSelect: (item: { id: string; sku: string; name: string; nameSi?: string; unitRate: number; stock: number; unit: string }, category: Category) => void;
  inventoryItems?: InventoryProduct[];
}

// ── Pinned category baseline — manual priority order from inventory blueprint ──
const PINNED_CATEGORIES = [
  'තීන්ත',
  'ග්‍රයින්ඩර් තල',
  'සිමෙන්ති',
  'වතුර බට',
  'එනමල් 1L',
  'එනමල් 500ml',
  'එනමල් 200ml',
  'සිවිලින් ලයිට්',
  'LED බල්බ්',
  'ORANGE ELECTRIC',
  'කම්බි කූරු',
  'කටු කම්බි',
  'වැලිකොල',
  'පින්සල්',
  'රෝල් බ්‍රෂ්',
  'ටිනර්',
  'රැම්කො සීට්',
  'වයර් යාර',
  'කැළණි වයර්',
  'සියෙරා වයර්',
];

/** Number of categories to show before "Show More" */
const DEFAULT_ROW_COUNT = 3;
const ITEMS_PER_ROW = 6;
const DEFAULT_VISIBLE = DEFAULT_ROW_COUNT * ITEMS_PER_ROW;

/** Display-friendly version of InventoryProduct for the grid popover */
interface CatalogDisplayItem {
  id: string;
  sku: string;
  name: string;
  nameSi?: string;
  unitRate: number;
  stock: number;
  unit: string;
  categoryId: string;
}

/** Convert InventoryProduct to display item */
function toDisplayItem(item: InventoryProduct): CatalogDisplayItem {
  return {
    id: item.id,
    sku: item.searchKey,
    name: item.name,
    unitRate: item.salesPrice,
    stock: item.storeQty,
    unit: 'piece',
    categoryId: item.categoryId || '',
  };
}

export const CategoryGrid: React.FC<CategoryGridProps> = ({ onItemSelect }) => {
  const { theme } = useTheme();
  const { i18n } = useTranslation();
  const isDark = theme === 'dark';
  const isSinhala = i18n.language === 'si';

  const [expanded, setExpanded] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');
  const [modalFilter, setModalFilter] = useState('');
  const [activeCategory, setActiveCategory] = useState<Category | null>(null);
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const mountedRef = useRef(true);
  const modalSearchRef = useRef<HTMLInputElement>(null);

  // Autofocus modal search input when popover opens
  useEffect(() => {
    if (activeCategory && anchorRect) {
      const timer = setTimeout(() => {
        modalSearchRef.current?.focus();
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [activeCategory, anchorRect]);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const { inventoryItems } = useCatalog();

  // ── 1. Compute live usage counts per productCategory name ──
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    inventoryItems.forEach(item => {
      if (item.productCategory) {
        counts[item.productCategory] = (counts[item.productCategory] || 0) + 1;
      }
    });
    return counts;
  }, [inventoryItems]);

  // ── 2. Hybrid pinned-sort engine — top 20 cap with "සියල්ල" prepended ──
  const optimizedCategoryNames = useMemo(() => {
    // All unique category names present in live inventory
    const rawUnique = Array.from(
      new Set(inventoryItems.map(item => item.productCategory).filter(Boolean))
    );

    // Pinned items that actually exist in live inventory (preserve blueprint order)
    const pinnedPart = PINNED_CATEGORIES.filter(cat => rawUnique.includes(cat));

    // Remaining categories not in the pinned list, sorted by volume descending
    const unpinnedPart = rawUnique
      .filter(cat => !PINNED_CATEGORIES.includes(cat))
      .sort((a, b) => (categoryCounts[b] || 0) - (categoryCounts[a] || 0));

    // Merge and hard-cap at 19 so "සියල්ල" fills slot 0 for a total of 20
    return ['සියල්ල', ...[...pinnedPart, ...unpinnedPart].slice(0, 19)];
  }, [inventoryItems, categoryCounts]);

  // ── 3. Map optimized name list back to Category objects for the grid ──
  // "සියල්ල" gets a synthetic Category entry; all others resolve from mockCategories.
  const ALL_CATEGORY_SENTINEL: Category = {
    id: '__all__',
    name: 'සියල්ල',
    nameAlt: 'සියල්ල',
    icon: 'all',
    description: 'Show all categories',
    usageCount: inventoryItems.length,
  };

  const sortedCategories = useMemo(() => {
    return optimizedCategoryNames.map(catName => {
      if (catName === 'සියල්ල') return ALL_CATEGORY_SENTINEL;
      // Match by name or nameAlt against the dynamic mockCategories array
      return (
        mockCategories.find(
          c => c.name === catName || c.nameAlt === catName
        ) ?? {
          id: `cat-inline-${catName}`,
          name: catName,
          nameAlt: catName,
          icon: 'hardware',
          description: `${catName} category`,
          usageCount: categoryCounts[catName] || 0,
        }
      );
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [optimizedCategoryNames, categoryCounts]);

  const filteredCategories = useMemo(() => {
    if (!searchFilter.trim()) return sortedCategories;
    const q = searchFilter.toLowerCase();
    return sortedCategories.filter(cat =>
      cat.name.toLowerCase().includes(q) ||
      (cat.nameAlt && cat.nameAlt.includes(q))
    );
  }, [sortedCategories, searchFilter]);

  const visibleCategories = useMemo(() => {
    return expanded ? filteredCategories : filteredCategories.slice(0, DEFAULT_VISIBLE);
  }, [filteredCategories, expanded]);

  const hasMore = filteredCategories.length > DEFAULT_VISIBLE;

  // ── Get linked products for the active category from live inventoryItems ──
  const activeCategoryItems = useMemo((): CatalogDisplayItem[] => {
    if (!activeCategory) return [];
    // "සියල්ල" sentinel: return all inventory items
    if (activeCategory.id === '__all__') {
      return inventoryItems.map(toDisplayItem);
    }
    const catName = activeCategory.name.toLowerCase();
    const items = inventoryItems.filter(item =>
      (item.productCategory && item.productCategory.toLowerCase() === catName) ||
      (item.categoryId && item.categoryId === activeCategory.id)
    );
    return items.map(toDisplayItem);
  }, [activeCategory, inventoryItems]);

  const closePopover = useCallback(() => {
    if (mountedRef.current) {
      setActiveCategory(null);
      setAnchorRect(null);
      setSearchFilter('');
    }
  }, []);

  const handleCategoryClick = useCallback((cat: Category, e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setAnchorRect(rect);
    setActiveCategory(cat);
    setSearchFilter('');
  }, []);

  const handleItemSelect = useCallback((item: CatalogDisplayItem) => {
    if (activeCategory && mountedRef.current) {
      onItemSelect({
        id: item.id,
        sku: item.sku,
        name: item.name,
        nameSi: item.nameSi,
        unitRate: item.unitRate,
        stock: item.stock,
        unit: item.unit,
      }, activeCategory);
    }
  }, [activeCategory, onItemSelect]);

  // Click-outside for popover
  useEffect(() => {
    if (!activeCategory) return;
    const handler = (e: MouseEvent) => {
      if (!popoverRef.current || !document.body.contains(popoverRef.current)) return;
      if (!popoverRef.current.contains(e.target as Node)) {
        const target = e.target as HTMLElement;
        if (!target.closest('.category-grid-btn')) {
          closePopover();
        }
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [activeCategory, closePopover]);

  // Popover positioning
  const POPOVER_HEIGHT = 320;
  const popoverTop = anchorRect
    ? Math.max(8, anchorRect.top + window.scrollY - POPOVER_HEIGHT)
    : 0;
  const popoverWidth = Math.min(360, window.innerWidth - 16);
  const popoverLeft = anchorRect
    ? Math.max(8, Math.min(anchorRect.left + window.scrollX, window.innerWidth - popoverWidth - 8))
    : 0;

  const getCategoryColor = (index: number) => {
    const colors = [
      'from-cyan-500 to-blue-600', 'from-amber-500 to-yellow-600',
      'from-orange-500 to-red-600', 'from-slate-600 to-slate-800',
      'from-pink-500 to-purple-600', 'from-slate-500 to-gray-700',
      'from-teal-500 to-emerald-600', 'from-green-500 to-emerald-700',
      'from-rose-500 to-pink-600', 'from-blue-500 to-indigo-600',
    ];
    return colors[index % colors.length];
  };

  return (
    <div className="relative">
      <div
        ref={containerRef}
        className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-1.5 overflow-hidden transition-all duration-300 ease-in-out"
        style={{
          maxHeight: expanded ? `${visibleCategories.length * 60 + 20}px` : `${DEFAULT_ROW_COUNT * 60}px`,
        }}
      >
        {visibleCategories.map((cat, index) => (
          <button
            key={cat.id}
            onClick={(e) => handleCategoryClick(cat, e)}
            className={`category-grid-btn group relative flex flex-col items-center justify-center p-1.5 rounded-lg border transition-all duration-200 hover:scale-[1.02] active:scale-95 ${
              isDark
                ? 'bg-slate-800/60 border-slate-700/60 hover:border-orange-500/50 hover:bg-slate-700/60'
                : 'bg-white border-slate-200 hover:border-orange-400/50 hover:bg-slate-50 shadow-sm'
            }`}
          >
            <div className={`w-6 h-6 rounded-lg bg-gradient-to-br ${getCategoryColor(index)} flex items-center justify-center mb-0.5 shadow-lg`}>
              <Package className="w-3 h-3 text-white" />
            </div>
            <span className={`text-[9px] font-semibold text-center leading-tight line-clamp-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
              {isSinhala ? (cat.nameAlt || cat.name) : cat.name}
            </span>
          </button>
        ))}
      </div>

      {hasMore && (
        <button
          onClick={() => setExpanded(!expanded)}
          className={`w-full flex items-center justify-center gap-1 mt-1.5 py-1.5 rounded-lg border text-[10px] font-medium transition-all ${
            isDark
              ? 'border-slate-700/50 text-slate-400 hover:bg-slate-800 hover:text-white'
              : 'border-slate-200 text-slate-500 hover:bg-slate-100 hover:text-slate-700'
          }`}
        >
          {expanded ? (
            <>Show Less <ChevronUp className="w-3 h-3" /></>
          ) : (
            <>Show More ({filteredCategories.length - DEFAULT_VISIBLE} more) <ChevronDown className="w-3 h-3" /></>
          )}
        </button>
      )}

      {activeCategory && anchorRect && (
        <>
          <div className="fixed inset-0 z-40" onMouseDown={closePopover} />
          <div
            ref={popoverRef}
            className={`fixed z-50 rounded-xl border shadow-2xl overflow-hidden ${
              isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'
            }`}
            style={{
              top: popoverTop,
              left: popoverLeft,
              width: popoverWidth,
              maxHeight: Math.min(POPOVER_HEIGHT, anchorRect.top - 16),
            }}
          >
            <div className={`flex items-center justify-between px-3 py-2 border-b ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
              <div className="flex items-center gap-2">
                <Package className={`w-4 h-4 ${isDark ? 'text-orange-400' : 'text-orange-500'}`} />
                <span className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {activeCategory.name}
                </span>
                <span className={`text-[10px] font-mono ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                  {activeCategoryItems.length} items
                </span>
              </div>
              <button onClick={closePopover} className={`p-0.5 rounded transition-colors ${isDark ? 'hover:bg-slate-800 text-slate-500' : 'hover:bg-slate-100 text-slate-400'}`}>
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className={`px-3 py-1.5 border-b ${isDark ? 'border-slate-700/50' : 'border-slate-100'}`}>
              <div className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border ${
                isDark ? 'bg-slate-800 border-slate-600' : 'bg-slate-50 border-slate-200'
              }`}>
                <Search className={`w-3 h-3 flex-shrink-0 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
                <input
                  ref={modalSearchRef}
                  type="text"
                  value={modalFilter}
                  onChange={(e) => { e.stopPropagation(); setModalFilter(e.target.value); }}
                  onClick={(e) => e.stopPropagation()}
                  onKeyDown={(e) => e.stopPropagation()}
                  placeholder={`Filter ${activeCategoryItems.length} items...`}
                  className={`flex-1 bg-transparent text-xs outline-none ${
                    isDark ? 'text-white placeholder:text-slate-500' : 'text-slate-900 placeholder:text-slate-400'
                  }`}
                />
              </div>
            </div>

            <div className="overflow-y-auto" style={{ maxHeight: Math.min(240, anchorRect.top - 80) }}>
              {activeCategoryItems.length > 0 ? (
                activeCategoryItems.filter(item => {
                  if (!modalFilter.trim()) return true;
                  const q = modalFilter.toLowerCase();
                  return item.name.toLowerCase().includes(q) ||
                    item.sku.toLowerCase().includes(q) ||
                    (item.nameSi && item.nameSi.includes(q));
                }).map((item) => (
                  <button
                    key={item.id}
                    onClick={() => { handleItemSelect(item); closePopover(); }}
                    className={`w-full flex items-center gap-2 px-3 py-2 text-left transition-colors border-b last:border-b-0 ${
                      isDark ? 'hover:bg-slate-800/80 border-slate-700/20' : 'hover:bg-slate-50 border-slate-100'
                    }`}
                  >
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`}>
                      <Package className={`w-3.5 h-3.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-semibold truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>{item.name}</p>
                      <div className="flex items-center gap-1.5">
                        <span className={`text-[9px] font-mono ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{item.sku}</span>
                        <span className={`text-[9px] px-1 py-0.5 rounded-full ${
                          item.stock > 10 ? 'bg-emerald-500/10 text-emerald-500' : item.stock > 0 ? 'bg-amber-500/10 text-amber-500' : 'bg-red-500/10 text-red-500'
                        }`}>{item.stock}</span>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className={`text-xs font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Rs.{item.unitRate.toLocaleString()}</p>
                    </div>
                    <div className={`w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 ${isDark ? 'bg-orange-500/15' : 'bg-orange-100'}`}>
                      <Plus className={`w-3 h-3 ${isDark ? 'text-orange-400' : 'text-orange-600'}`} />
                    </div>
                  </button>
                ))
              ) : (
                <div className={`p-4 text-center ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                  <Package className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-xs font-medium">No items found</p>
                  <p className={`text-[10px] mt-1 ${isDark ? 'text-slate-600' : 'text-slate-500'}`}>
                    {modalFilter ? `"${modalFilter}" didn't match any items` : 'This category has no linked products'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};