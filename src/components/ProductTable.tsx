import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useTranslation } from 'react-i18next';
import {
  Search, Package, AlertTriangle, XCircle, CheckCircle,
  Filter, RefreshCw, SortAsc, SortDesc, DollarSign, Hash,
  Edit3, Trash2, Pencil, ChevronLeft, ChevronRight,
  ChevronsLeft, ChevronsRight, ChevronDown, X,
} from 'lucide-react';
import { toast } from 'react-toastify';
import api, { isNetworkError, getNetworkErrorMessage } from '../lib/api';
import { useCatalog } from '../contexts/CatalogContext';
import { useAuth } from '../contexts/AuthContext';
import SortButton from '../components/ui/SortButton';
import { InventoryProduct } from '../types';
import { CellPopover } from './CellPopover';
import { ProductFormModal } from './ProductFormModal';
import { DeleteConfirmationModal } from './modals/DeleteConfirmationModal';
import ProductNameTooltip from './ProductNameTooltip';
import { formatShortProductId } from '../lib/utils';

function deriveStatus(storeQty: number): InventoryProduct['status'] {
  if (storeQty === 0) return 'Out of Stock';
  if (storeQty <= 10) return 'Low Stock';
  return 'Available';
}

const editableNumericFields = ['cost', 'lastPrice', 'salesPrice', 'displayPrice', 'storeQty'] as const;
const ROWS_PER_PAGE_OPTIONS = [10, 25, 50, 100];

interface CellEditState { itemId: string; field: string; rect: DOMRect; }

const columns: { key: keyof InventoryProduct | null; label: string; align: 'left' | 'right' | 'center'; editable: boolean }[] = [
  { key: 'no', label: 'No', align: 'left', editable: true },
  { key: 'searchKey', label: 'Search Key', align: 'left', editable: false },
  { key: 'name', label: 'Name', align: 'left', editable: false },
  { key: 'productCategory', label: 'Product Category', align: 'left', editable: false },
  { key: 'barcode', label: 'Barcode', align: 'left', editable: false },
  { key: 'cost', label: 'Cost[0]', align: 'right', editable: true },
  { key: 'lastPrice', label: 'Last Price[1]', align: 'right', editable: true },
  { key: 'salesPrice', label: 'Sales Price[3]', align: 'right', editable: true },
  { key: 'displayPrice', label: 'Display Price[4]', align: 'right', editable: true },
  { key: 'storeQty', label: 'Store Qty', align: 'right', editable: true },
  { key: null, label: 'Sales Type', align: 'left', editable: false },
  { key: null, label: 'Status', align: 'center', editable: false },
  { key: null, label: 'Actions', align: 'center', editable: false },
];

const statusConfig: Record<string, { bg: string; text: string; border: string; icon: React.ReactNode }> = {
  Available: { bg: 'bg-green-500/10', text: 'text-green-400', border: 'border-green-500/20', icon: <CheckCircle className="w-3 h-3" /> },
  'Low Stock': { bg: 'bg-yellow-500/10', text: 'text-yellow-400', border: 'border-yellow-500/20', icon: <AlertTriangle className="w-3 h-3" /> },
  'Out of Stock': { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/20', icon: <XCircle className="w-3 h-3" /> },
  Discontinued: { bg: 'bg-gray-500/10', text: 'text-gray-400', border: 'border-gray-500/20', icon: <XCircle className="w-3 h-3" /> },
};

const formatPrice = (price: number) => `Rs. ${price.toLocaleString()}`;

// ── Searchable Combobox (glassmorphism, dark-theme) ──
interface SearchableSelectProps {
  options: string[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  isDark: boolean;
  allLabel?: string;
  getOptionLabel?: (value: string) => string;
}

const SearchableSelect: React.FC<SearchableSelectProps> = ({ options, value, onChange, placeholder, isDark, allLabel = 'All', getOptionLabel }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!search.trim()) return options;
    const q = search.toLowerCase();
    return options.filter((o) => {
      const label = (getOptionLabel ? getOptionLabel(o) : o).toLowerCase();
      return o.toLowerCase().includes(q) || label.includes(q);
    });
  }, [search, options, getOptionLabel]);

  const displayValue = value === 'all' ? allLabel : (getOptionLabel ? getOptionLabel(value) : value);

  useEffect(() => {
    if (!open) setSearch('');
  }, [open]);

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <button type="button" onClick={() => setOpen(!open)}
        className={`w-full flex items-center justify-between px-2.5 py-1.5 text-xs border rounded-lg transition-all ${isDark ? 'bg-slate-800 border-slate-700 text-white hover:border-slate-600' : 'bg-white border-slate-200 text-slate-900 hover:border-slate-300'
          }`}>
        <span className="truncate">{displayValue}</span>
        <ChevronDown className={`w-3 h-3 ml-1 flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''} ${isDark ? 'text-slate-400' : 'text-slate-500'}`} />
      </button>
      {open && (
        <div className={`absolute left-0 top-full mt-0.5 w-full min-w-[180px] rounded-lg border shadow-2xl z-50 overflow-hidden backdrop-blur-md ${isDark ? 'bg-slate-800/95 border-slate-700/50' : 'bg-white/95 border-slate-200'
          }`}>
          <div className="relative border-b border-slate-700/30">
            <input ref={inputRef} type="text" value={search}
              onChange={(e) => setSearch(e.target.value)} placeholder={placeholder || 'Search...'}
              className={`w-full px-2.5 py-1.5 text-xs border-0 focus:outline-none focus:ring-0 ${isDark ? 'bg-slate-800/50 text-white placeholder:text-slate-500' : 'bg-white text-slate-900 placeholder:text-slate-400'
                }`}
              autoFocus
            />
            {search.length > 0 && (
              <button onClick={() => setSearch('')}
                className={`absolute right-1.5 top-1/2 -translate-y-1/2 p-0.5 rounded ${isDark ? 'text-slate-500 hover:text-white' : 'text-slate-400 hover:text-slate-700'}`}>
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
          <div className="max-h-40 overflow-y-auto">
            <button onClick={() => { onChange('all'); setOpen(false); }}
              className={`w-full text-left px-2.5 py-1.5 text-xs font-medium transition-colors ${value === 'all' ? 'bg-orange-500/20 text-orange-400' : isDark ? 'text-slate-300 hover:bg-slate-700/50' : 'text-slate-700 hover:bg-slate-100'
                }`}>{allLabel}</button>
            {filtered.map((opt) => (
              <button key={opt} onClick={() => { onChange(opt); setOpen(false); }}
                className={`w-full text-left px-2.5 py-1.5 text-xs font-medium transition-colors ${opt === value ? 'bg-orange-500/20 text-orange-400' : isDark ? 'text-slate-300 hover:bg-slate-700/50' : 'text-slate-700 hover:bg-slate-100'
                }`}>{getOptionLabel ? getOptionLabel(opt) : opt}</button>
            ))}
            {filtered.length === 0 && (
              <div className={`px-2.5 py-1.5 text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>No results</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// ── Inline numeric input ──
interface InlineNumberInputProps {
  value: number; onSave: (value: number) => void; onCancel: () => void; isDark: boolean;
}
const InlineNumberInput: React.FC<InlineNumberInputProps> = ({ value, onSave, onCancel, isDark }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [editValue, setEditValue] = useState(String(value));
  useEffect(() => { inputRef.current?.focus(); inputRef.current?.select(); }, []);
  const commit = () => { const num = parseFloat(editValue); if (!isNaN(num)) onSave(num); else onCancel(); };
  return (
    <input ref={inputRef} type="number" value={editValue} step="0.01" min="0"
      onChange={(e) => {
        const val = e.target.value;
        const parsed = val.startsWith('0') && val.length > 1 ? val.replace(/^0+/, '') : val;
        setEditValue(parsed);
      }}
      onKeyDown={(e) => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') onCancel(); }}
      onBlur={commit}
      className={`w-full px-2 py-0.5 text-[11px] font-mono rounded border focus:outline-none focus:ring-1 focus:ring-amber-500 ${isDark ? 'bg-slate-950/80 border-amber-500 text-white' : 'bg-white border-amber-500 text-slate-900'
        }`}
      onClick={(e) => e.stopPropagation()}
    />
  );
};

// ── Inline text input ──
interface InlineTextInputProps {
  value: string; onSave: (value: string) => void; onCancel: () => void; isDark: boolean;
}
const InlineTextInput: React.FC<InlineTextInputProps> = ({ value, onSave, onCancel, isDark }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [editValue, setEditValue] = useState(value);
  useEffect(() => { inputRef.current?.focus(); inputRef.current?.select(); }, []);
  const commit = () => { if (editValue.trim().length > 0) onSave(editValue.trim()); else onCancel(); };
  return (
    <input ref={inputRef} type="text" value={editValue} onChange={(e) => setEditValue(e.target.value)}
      onKeyDown={(e) => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') onCancel(); }} onBlur={commit}
      className={`w-full px-2 py-0.5 text-[11px] rounded border focus:outline-none focus:ring-1 focus:ring-amber-500 ${isDark ? 'bg-slate-950/90 border-amber-500 text-white' : 'bg-white border-amber-500 text-slate-900'
        }`} onClick={(e) => e.stopPropagation()}
    />
  );
};

interface InlineCategorySelectProps {
  value: string; onSave: (value: string) => void; onCancel: () => void; isDark: boolean;
  options: string[];
}
const InlineCategorySelect: React.FC<InlineCategorySelectProps> = ({ value, onSave, onCancel, isDark, options }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [search, setSearch] = useState(value);
  const [open, setOpen] = useState(true);
  const filtered = useMemo(() => {
    if (!search.trim()) return options;
    return options.filter((c) => c.toLowerCase().includes(search.toLowerCase()));
  }, [search, options]);
  useEffect(() => { inputRef.current?.focus(); inputRef.current?.select(); }, []);
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) onCancel();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onCancel]);
  return (
    <div ref={containerRef} className="relative w-full" onClick={(e) => e.stopPropagation()}>
      <input ref={inputRef} type="text" value={search} onChange={(e) => { setSearch(e.target.value); setOpen(true); }}
        onKeyDown={(e) => { if (e.key === 'Escape') onCancel(); if (e.key === 'Enter' && filtered.length === 1) onSave(filtered[0]); }}
        placeholder="Search category..."
        className={`w-full px-2 py-0.5 text-[11px] rounded border focus:outline-none focus:ring-1 focus:ring-amber-500 ${isDark ? 'bg-slate-950/90 border-amber-500 text-white placeholder:text-slate-500' : 'bg-white border-amber-500 text-slate-900 placeholder:text-slate-400'
          }`}
      />
      {open && filtered.length > 0 && (
        <div className={`absolute left-0 top-full mt-1 w-full max-h-36 overflow-y-auto rounded-md border shadow-xl z-50 ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
          {filtered.map((cat) => (
            <button key={cat} onMouseDown={(e) => e.preventDefault()} onClick={() => { onSave(cat); setOpen(false); }}
              className={`w-full text-left px-2 py-1 text-[11px] font-medium transition-colors ${cat === value ? 'bg-orange-500/20 text-orange-400' : isDark ? 'text-slate-300 hover:bg-slate-700' : 'text-slate-700 hover:bg-slate-100'
                }`}>{cat}</button>
          ))}
        </div>
      )}
      {open && filtered.length === 0 && (
        <div className={`absolute left-0 top-full mt-1 w-full rounded-md border shadow-xl z-50 px-2 py-1.5 text-[10px] ${isDark ? 'bg-slate-800 border-slate-700 text-slate-400' : 'bg-white border-slate-200 text-slate-500'}`}>
          No matching categories
        </div>
      )}
    </div>
  );
};

interface ProductTableProps {
  items: InventoryProduct[];
  setItems?: React.Dispatch<React.SetStateAction<InventoryProduct[]>>;
  onDelete?: (id: string) => void;
}

export const ProductTable: React.FC<ProductTableProps> = ({ items, setItems, onDelete }) => {
  const { theme } = useTheme();
  const { user: currentUser } = useAuth();
  const isDark = theme === 'dark';
  const { categories: catalogCategories, updateInventoryItem, syncCategoriesFromServer } = useCatalog();
  const categoryIdMap = useMemo(() => {
    const map = new Map<string, string>();
    catalogCategories.forEach((cat) => map.set(cat.name, cat.id));
    return map;
  }, [catalogCategories]);

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [sortField, setSortField] = useState<keyof InventoryProduct>('createdAt');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  // ── CHECKBOX FILTER TOGGLES ──
  // Search Key defaults to true (ticked) on mount; Barcode, Product Name, Category, Product No default false
  const [searchByKey, setSearchByKey] = useState<boolean>(true);
  const [searchBarcode, setSearchBarcode] = useState<boolean>(true);
  const [searchByName, setSearchByName] = useState<boolean>(false);
  const [searchByCategory, setSearchByCategory] = useState<boolean>(false);
  const [searchByNo, setSearchByNo] = useState<boolean>(true);

  const [cellEdit, setCellEdit] = useState<CellEditState | null>(null);
  const [rowEditItem, setRowEditItem] = useState<InventoryProduct | null>(null);
  const [inlineEdit, setInlineEdit] = useState<{ itemId: string; field: string } | null>(null);

  const [activeBarcodeEditId, setActiveBarcodeEditId] = useState<string | null>(null);
  const [tempBarcodeValue, setTempBarcodeValue] = useState<string>('');
  const [barcodeRect, setBarcodeRect] = useState<DOMRect | null>(null);

  const { t, i18n } = useTranslation();
  const currentLang = (i18n.language || '').toLowerCase();
  const isSinhala = currentLang === 'si' || currentLang === 'sinhala';

  const categoryLookup = useMemo(() => {
    const byName = new Map<string, { name: string; nameSinhala?: string }>();
    const byId = new Map<string, { name: string; nameSinhala?: string }>();
    catalogCategories.forEach((cat) => {
      byName.set(cat.name, cat);
      byId.set(cat.id, cat);
    });
    return { byName, byId };
  }, [catalogCategories]);

  const resolveCategoryLabel = useCallback((item: InventoryProduct): string => {
    // 🚨 CRITICAL FIX: Handle null/empty productCategory gracefully with fallback
    if (!item.productCategory && !item.categoryId) return '-';
    const linkedCategory = (item.categoryId && categoryLookup.byId.get(item.categoryId))
      || categoryLookup.byName.get(item.productCategory);
    const englishName = linkedCategory?.name || item.productCategory || 'Uncategorized';
    const sinhalaName = linkedCategory?.nameSinhala?.trim();
    if (isSinhala && sinhalaName) return sinhalaName;
    return englishName;
  }, [categoryLookup, isSinhala]);

  const categories = useMemo(() => {
    const cats = new Set<string>();
    items.forEach((i) => {
      if (i.productCategory) cats.add(i.productCategory);
    });
    return Array.from(cats).sort();
  }, [items]);

  const categoryLabelByName = useMemo(() => {
    const labels = new Map<string, string>();
    (categories || []).forEach((categoryName) => {
      const cat = categoryLookup.byName.get(categoryName);
      const sinhala = cat?.nameSinhala?.trim();
      labels.set(categoryName, isSinhala && sinhala ? sinhala : categoryName);
    });
    return labels;
  }, [categories, categoryLookup, isSinhala]);
  const fieldLabels: Record<string, string> = {
    cost: t('products.costTitle'), lastPrice: t('products.lastPriceTitle'), salesPrice: t('products.salesPriceTitle'),
    displayPrice: t('products.displayPriceTitle'), storeQty: t('products.storeQtyTitle'),
    searchKey: t('products.searchKey'), name: t('common.name'),
    barcode: 'PRODUCT BARCODE',
  };

  // ── MODIFIED FILTER: respects 5 checkboxes + space exemption for Search Key ──
  // 🚨 CRITICAL FIX: Always search the `no` column when searchByKey is active OR
  // when no scope checkbox is explicitly ticked (fallback). This ensures typing
  // "1001" returns product 1001 immediately.
  const filteredItems = useMemo(() => {
    let result = [...items];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const hasAnyScopeSelected = searchByKey || searchBarcode || searchByName || searchByCategory || searchByNo;
      result = result.filter((i) => {
        let match = false;

        // Search Key (default ON) — STRICTLY NO whitespace stripping/exemption
        if (searchByKey) {
          // Strip and ignore all spaces from both the query and the database searchKey
          const cleanQuery = q.replace(/\s+/g, '').toLowerCase();
          const cleanSearchKey = i.searchKey ? i.searchKey.replace(/\s+/g, '').toLowerCase() : '';

          match = match || cleanSearchKey.startsWith(cleanQuery);
        }
        // Barcode
        if (searchBarcode) {
          match = match || (i.barcode && i.barcode.toLowerCase().includes(q));
        }

        // Product Name
        if (searchByName) {
          match = match || (i.name && i.name.toLowerCase().includes(q));
        }

        // Product Category
        if (searchByCategory) {
          match = match || (i.productCategory && i.productCategory.toLowerCase().includes(q));
        }

        // Product No (#1000, etc.)
        // 🚨 FIX: Search `no` when searchByNo is checked, OR when searchByKey
        // is active (default), OR when no scope is selected at all (fallback).
        if (searchByNo || searchByKey || !hasAnyScopeSelected) {
          match = match || (i.no && i.no.toLowerCase().includes(q));
        }

        return match;
      });
    }
    if (categoryFilter !== 'all') result = result.filter((i) => i.productCategory === categoryFilter);
    if (statusFilter !== 'all') result = result.filter((i) => i.status === statusFilter);
    result.sort((a, b) => {
      const aVal = a[sortField], bVal = b[sortField];
      if (typeof aVal === 'number' && typeof bVal === 'number') return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
      return sortDir === 'asc' ? String(aVal).toLowerCase().localeCompare(String(bVal).toLowerCase()) : String(bVal).toLowerCase().localeCompare(String(aVal).toLowerCase());
    });
    return result;
  }, [items, searchQuery, categoryFilter, statusFilter, sortField, sortDir, searchByKey, searchBarcode, searchByName, searchByCategory, searchByNo]);

  const totalPages = Math.ceil(filteredItems.length / rowsPerPage);
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return filteredItems.slice(start, start + rowsPerPage);
  }, [filteredItems, currentPage, rowsPerPage]);

  useEffect(() => { setCurrentPage(1); }, [searchQuery, categoryFilter, statusFilter, rowsPerPage]);

  const hasActiveFilters = searchQuery || categoryFilter !== 'all' || statusFilter !== 'all';
  const clearFilters = () => { setSearchQuery(''); setCategoryFilter('all'); setStatusFilter('all'); };
  const SortIcon = sortDir === 'asc' ? SortAsc : SortDesc;

  const handleSort = (field: keyof InventoryProduct) => {
    if (sortField === field) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortField(field); setSortDir('asc'); }
  };

  const [deleteTarget, setDeleteTarget] = useState<InventoryProduct | null>(null);

  const handleDeleteProduct = useCallback((id: string) => {
    if (onDelete) {
      onDelete(id);
    } else if (setItems) {
      setItems((prev) => prev.filter((i) => i.id !== id));
    }
  }, [onDelete, setItems]);

  const patchBackend = useCallback(async (itemId: string, field: string, value: string | number) => {
    try {
      const payload: Record<string, any> = { [field]: typeof value === 'number' ? Number(value) : value };
      if (field === 'productCategory' && typeof value === 'string') {
        const resolvedId = categoryIdMap.get(value);
        if (resolvedId) {
          payload.categoryId = resolvedId;
        }
      }
      const response: any = await api.patch(`/products/${itemId}`, payload, true);
      if (response?.syncCategories && Array.isArray(response.syncCategories)) {
        syncCategoriesFromServer(response.syncCategories);
      }
      // 🚨 INSTANT CATEGORY STATE UPDATE: The backend returns the canonical
      // product (with resolved categoryId + productCategory) inside response.data.
      // Apply it back into the CatalogContext state immediately so the table row
      // badge re-renders with the NEW category name without a manual refresh.
      const serverProduct = response?.data;
      if (serverProduct && typeof serverProduct === 'object') {
        const serverPatch: Partial<InventoryProduct> = {};
        if (field === 'productCategory') {
          if (serverProduct.productCategory !== undefined) serverPatch.productCategory = serverProduct.productCategory;
          if (serverProduct.categoryId !== undefined) serverPatch.categoryId = serverProduct.categoryId;
          if (serverProduct.categorySi !== undefined) serverPatch.categorySi = serverProduct.categorySi;
        } else if (serverProduct[field] !== undefined) {
          (serverPatch as Record<string, any>)[field] = serverProduct[field];
        }
        if (typeof updateInventoryItem === 'function' && Object.keys(serverPatch).length > 0) {
          updateInventoryItem(itemId, serverPatch);
        }
      }
      const product = items.find(i => i.id === itemId);
      const productName = product?.name || product?.searchKey || itemId;
      toast.success(`Product "${productName}" - ${field.toUpperCase()} updated successfully.`, {
        position: 'top-right',
        autoClose: 2500,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    } catch (err: any) {
      const errorMsg = err?.message || '';

      // 🚨 Explicit Network Error Toast — connection dropped / timeout on inline edit
      if (isNetworkError(err)) {
        console.warn('[ProductTable] Network failure while updating field:', errorMsg);
        toast.error(getNetworkErrorMessage(), {
          position: 'top-right',
          autoClose: 6000,
        });
      } else if (field === 'no' && (errorMsg.includes('already in use') || errorMsg.includes('already exists'))) {
        toast.error(`Product No already exists!`, {
          position: 'top-right',
          autoClose: 4000,
        });
      } else {
        toast.error(errorMsg || 'Failed to update field', {
          position: 'top-right',
          autoClose: 4000,
        });
      }
    }
  }, [items, syncCategoriesFromServer, updateInventoryItem]);

  const updateCatalogState = useCallback((itemId: string, field: string, value: string | number) => {
    const patchData: Partial<InventoryProduct> = { [field]: value };
    if (field === 'storeQty') {
      patchData.status = deriveStatus(value as number);
    }
    if (typeof updateInventoryItem === 'function') {
      updateInventoryItem(itemId, patchData);
    }
  }, [updateInventoryItem]);

  const handleCellSave = useCallback((itemId: string, field: string, value: string | number) => {
    const product = items.find(i => i.id === itemId);
    if (product) {
      const originalValue = product[field as keyof InventoryProduct] as string | number;
      if (String(originalValue) === String(value) || Number(originalValue) === Number(value)) {
        setCellEdit(null);
        return;
      }
    }
    updateCatalogState(itemId, field, value);
    setCellEdit(null);
    patchBackend(itemId, field, value);
  }, [items, updateCatalogState, patchBackend]);

  const handleInlineSave = useCallback((itemId: string, field: string, value: string | number) => {
    const product = items.find(i => i.id === itemId);
    if (product) {
      const originalValue = product[field as keyof InventoryProduct] as string | number;
      if (String(originalValue) === String(value) || Number(originalValue) === Number(value)) {
        setInlineEdit(null);
        return;
      }
    }

    // Client-side duplicate 'no' validation
    if (field === 'no' && typeof value === 'string' && value.trim()) {
      const duplicate = items.find(i => i.id !== itemId && i.no === value.trim());
      if (duplicate) {
        toast.error(`Product No "${value}" already exists!`, {
          position: 'top-right',
          autoClose: 4000,
        });
        setInlineEdit(null);
        return;
      }
    }

    updateCatalogState(itemId, field, value);
    setInlineEdit(null);
    patchBackend(itemId, field, value);
  }, [items, updateCatalogState, patchBackend]);

  const handleBarcodeSave = useCallback(async (itemId: string, barcode: string) => {
    const product = items.find(i => i.id === itemId);
    if (product) {
      const originalValue = product.barcode || '';
      if (originalValue === barcode) {
        setActiveBarcodeEditId(null);
        setBarcodeRect(null);
        return;
      }
    }
    updateCatalogState(itemId, 'barcode', barcode || '');
    setActiveBarcodeEditId(null);
    setBarcodeRect(null);
    try {
      const payload = { barcode: barcode || null };
      const response: any = await api.patch(`/products/${itemId}/barcode`, payload, true);
      if (response?.syncCategories && Array.isArray(response.syncCategories)) {
        syncCategoriesFromServer(response.syncCategories);
      }
      const productName = product?.name || product?.searchKey || itemId;
      toast.success(`Barcode updated for "${productName}".`, {
        position: 'top-right', autoClose: 2500, hideProgressBar: false,
        closeOnClick: true, pauseOnHover: true, draggable: true,
      });
    } catch (err: any) {
      if (product) {
        updateCatalogState(itemId, 'barcode', product.barcode || '');
      }

      // 🚨 Explicit Network Error Toast — connection dropped / timeout on barcode update
      if (isNetworkError(err)) {
        toast.error(getNetworkErrorMessage(), {
          position: 'top-right',
          autoClose: 6000,
        });
      } else {
        const msg = err?.message || 'Failed to update barcode';
        toast.error(msg, { position: 'top-right', autoClose: 4000 });
      }
    }
  }, [items, updateCatalogState, syncCategoriesFromServer]);

  const openCellEdit = useCallback((itemId: string, field: string, e: React.MouseEvent) => {
    setRowEditItem(null);
    if (field === 'barcode') {
      setInlineEdit(null);
      setCellEdit(null);
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      setBarcodeRect(rect);
      setTempBarcodeValue(items.find(i => i.id === itemId)?.barcode || '');
      setActiveBarcodeEditId(itemId);
    } else {
      setInlineEdit({ itemId, field });
      setCellEdit({ itemId, field, rect: (e.currentTarget as HTMLElement).getBoundingClientRect() });
    }
  }, [items]);

  const openRowEdit = useCallback((item: InventoryProduct) => {
    setCellEdit(null);
    setInlineEdit(null);
    setRowEditItem(item);
  }, []);

  const cellEditItem = cellEdit ? items.find((i) => i.id === cellEdit.itemId) : null;
  const cellEditValue = cellEdit && cellEditItem ? (cellEditItem[cellEdit.field as keyof InventoryProduct] as string | number) : undefined;

  const renderCellValue = (item: InventoryProduct, field: keyof InventoryProduct) => {
    const val = item[field];
    if (typeof val === 'number') {
      if (field === 'storeQty') return val.toLocaleString();
      return formatPrice(val);
    }
    return val;
  };

  const getCellColor = (item: InventoryProduct, field: string): string => {
    if (field === 'storeQty') {
      if (item.storeQty <= 20) return isDark ? 'text-red-400' : 'text-red-600';
      if (item.storeQty <= 50) return isDark ? 'text-yellow-400' : 'text-yellow-600';
      return isDark ? 'text-white' : 'text-slate-900';
    }
    switch (field) {
      case 'cost': case 'lastPrice': return isDark ? 'text-slate-300' : 'text-slate-700';
      case 'salesPrice': return isDark ? 'text-cyan-400' : 'text-cyan-600';
      case 'displayPrice': return isDark ? 'text-green-400' : 'text-green-600';
      default: return isDark ? 'text-white' : 'text-slate-900';
    }
  };

  const startItem = (currentPage - 1) * rowsPerPage + 1;
  const endItem = Math.min(currentPage * rowsPerPage, filteredItems.length);

  return (
    <div className="space-y-4">
      {cellEdit && cellEditItem && cellEditValue !== undefined && (
        <CellPopover value={cellEditValue} fieldLabel={fieldLabels[cellEdit.field] || cellEdit.field}
          type={cellEdit.field === 'productCategory' ? 'category' : editableNumericFields.includes(cellEdit.field as any) ? 'number' : 'text'}
          anchorRect={cellEdit.rect}
          options={catalogCategories.map(c => c.name)}
          onSave={(val) => handleCellSave(cellEdit.itemId, cellEdit.field, val)} onClose={() => setCellEdit(null)} />
      )}

      {/* Dedicated Barcode CellPopover */}
      {activeBarcodeEditId && barcodeRect && (
        <CellPopover value={tempBarcodeValue} fieldLabel="PRODUCT BARCODE"
          type="text" anchorRect={barcodeRect} onSave={(val) => handleBarcodeSave(activeBarcodeEditId, String(val))} onClose={() => { setActiveBarcodeEditId(null); setBarcodeRect(null); }} />
      )}

      {/* ── BALANCED HORIZONTAL TOOLBAR with permanently visible filters ── */}
      <div className={`p-4 rounded-lg border ${isDark ? 'bg-slate-800/50 border-slate-700/50' : 'bg-white border-slate-200 shadow-sm'}`}>
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-xl">
            <Search className={`absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`} />
            <input type="text" placeholder={t('products.searchPlaceholder')} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full pl-8 pr-9 py-2 text-xs border rounded-lg focus:outline-none focus:ring-1 focus:ring-orange-500/50 focus:border-orange-500/50 transition-all ${isDark ? 'bg-slate-900/50 border-slate-700 text-white placeholder:text-slate-500' : 'bg-slate-50 border-slate-200'}`} />
            {searchQuery.length > 0 && (
              <button onClick={() => setSearchQuery('')}
                className={`absolute right-1.5 top-1/2 -translate-y-1/2 p-0.5 rounded transition-colors ${isDark ? 'text-slate-400 hover:text-white hover:bg-slate-700' : 'text-slate-400 hover:text-slate-700 hover:bg-slate-200'}`}>
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <div className="relative min-w-[200px] w-64">
            <SearchableSelect options={categories} value={categoryFilter} onChange={(v) => setCategoryFilter(v)} placeholder="Search category..." isDark={isDark} allLabel={t('filters.allCategories')} getOptionLabel={(value) => categoryLabelByName.get(value) || value} />
            {categoryFilter !== 'all' && (
              <button onClick={() => setCategoryFilter('all')}
                className={`absolute -right-2 -top-2 z-10 w-4 h-4 rounded-full flex items-center justify-center transition-colors shadow-sm ${isDark ? 'bg-slate-700 text-slate-300 hover:bg-slate-600 border border-slate-600' : 'bg-white text-slate-500 hover:bg-slate-100 border border-slate-300'
                  }`} title="Reset category filter">
                <X className="w-2.5 h-2.5" />
              </button>
            )}
          </div>
          <div className="relative min-w-[180px] w-52">
            <SearchableSelect options={['Available', 'Low Stock', 'Out of Stock']} value={statusFilter} onChange={(v) => setStatusFilter(v)} placeholder="Search status..." isDark={isDark} allLabel={t('filters.allStatus')} />
            {statusFilter !== 'all' && (
              <button onClick={() => setStatusFilter('all')}
                className={`absolute -right-2 -top-2 z-10 w-4 h-4 rounded-full flex items-center justify-center transition-colors shadow-sm ${isDark ? 'bg-slate-700 text-slate-300 hover:bg-slate-600 border border-slate-600' : 'bg-white text-slate-500 hover:bg-slate-100 border border-slate-300'
                  }`} title="Reset status filter">
                <X className="w-2.5 h-2.5" />
              </button>
            )}
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <SortButton currentSortOrder={sortDir} onSortToggle={() => handleSort(sortField)} />
            {hasActiveFilters && <button onClick={clearFilters} className={`p-1.5 rounded-lg transition-colors flex-shrink-0 ${isDark ? 'text-slate-400 hover:text-white hover:bg-slate-700' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'}`}><RefreshCw className="w-3 h-3" /></button>}
            <span className={`text-[10px] font-medium whitespace-nowrap ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{t('products.itemsCount', { count: filteredItems.length })}</span>
          </div>
        </div>

        {/* ── TASK 2: 2-LINE CHECKBOX FILTER BAR ── */}
        <div className="mt-2.5 flex flex-col gap-1.5">
          {/* Line 1: "Search In:" label + Barcode + Search Key */}
          <div className="flex items-center gap-3">
            <span className={`text-[10px] font-semibold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Search In:
            </span>
            <label className={`flex items-center gap-1.5 cursor-pointer select-none text-[11px] font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
              <input
                type="checkbox"
                checked={searchBarcode}
                onChange={e => setSearchBarcode(e.target.checked)}
                className="accent-amber-500 w-3.5 h-3.5 rounded"
              />
              Barcode
            </label>
            <label className={`flex items-center gap-1.5 cursor-pointer select-none text-[11px] font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
              <input
                type="checkbox"
                checked={searchByKey}
                onChange={e => setSearchByKey(e.target.checked)}
                className="accent-amber-500 w-3.5 h-3.5 rounded"
              />
              Search Key
            </label>

            <label className={`flex items-center gap-1.5 cursor-pointer select-none text-[11px] font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
              <input
                type="checkbox"
                checked={searchByName}
                onChange={e => setSearchByName(e.target.checked)}
                className="accent-amber-500 w-3.5 h-3.5 rounded"
              />
              Product Name
            </label>
            <label className={`flex items-center gap-1.5 cursor-pointer select-none text-[11px] font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
              <input
                type="checkbox"
                checked={searchByCategory}
                onChange={e => setSearchByCategory(e.target.checked)}
                className="accent-amber-500 w-3.5 h-3.5 rounded"
              />
              Category
            </label>
            <label className={`flex items-center gap-1.5 cursor-pointer select-none text-[11px] font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
              <input
                type="checkbox"
                checked={searchByNo}
                onChange={e => setSearchByNo(e.target.checked)}
                className="accent-amber-500 w-3.5 h-3.5 rounded"
              />
              Product No
            </label>
          </div>
        </div>
      </div>

      {/* ── MAIN TABLE ── */}
      <div className={`rounded-lg border overflow-hidden max-w-full overflow-x-hidden ${isDark ? 'bg-slate-900/95 border-slate-700/50' : 'bg-white border-slate-200 shadow-sm'}`}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1300px]">
            <thead className={isDark ? 'bg-slate-800/80' : 'bg-slate-50'}>
              <tr>
                {columns.map((col, i) => {
                  const widthClass = col.key === 'no' ? 'w-[80px] min-w-[80px] max-w-[90px]' : 
                                     col.key === 'searchKey' ? 'min-w-[140px]' : 
                                     col.key === 'name' ? 'w-[220px] min-w-[200px] max-w-[240px]' : 
                                     col.key === 'productCategory' ? 'min-w-[140px]' :
                                     col.key === 'barcode' ? 'min-w-[120px] whitespace-nowrap' :
                                     col.label === 'Status' ? 'min-w-[100px] whitespace-nowrap' : '';
                  return (
                  <th key={i}
                    className={`px-2 py-2 text-[10px] font-semibold uppercase tracking-wider whitespace-nowrap ${widthClass} ${col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'} ${isDark ? 'text-slate-400' : 'text-slate-500'} ${col.key ? 'cursor-pointer select-none hover:text-orange-400 transition-colors' : ''}`}
                    onClick={() => col.key && handleSort(col.key as keyof InventoryProduct)}>
                    <div className={`flex items-center gap-1 ${col.key === 'no' ? 'justify-center' : col.align === 'right' ? 'justify-end' : col.align === 'center' ? 'justify-center' : ''}`}>
                      {(() => {
                        const labelMap: Record<string, string> = {
                          'No': isSinhala ? 'අංකය' : 'No',
                          'Name': t('productTable.name'),
                          'Product Category': t('productTable.category'),
                          'Barcode': t('productTable.barcode'),
                          'Cost[0]': t('productTable.cost'),
                          'Last Price[1]': t('productTable.lastPrice'),
                          'Sales Price[3]': t('productTable.salesPrice'),
                          'Display Price[4]': t('productTable.displayPrice'),
                          'Store Qty': t('productTable.storeQty'),
                          'Sales Type': t('productTable.salesType'),
                          'Status': t('productTable.status'),
                          'Actions': t('productTable.actions'),
                        };
                        return labelMap[col.label] || col.label;
                      })()}
                      {col.key && sortField === col.key && <SortIcon className="w-3 h-3 flex-shrink-0" />}
                    </div>
                  </th>
                );
                })}
              </tr>
            </thead>
            <tbody className={`divide-y ${isDark ? 'divide-slate-700/40' : 'divide-slate-200'}`}>
              {paginatedItems.map((item) => {
                const st = statusConfig[item.status] || statusConfig['Out of Stock'];
                return (
                  <tr key={item.id} className={`transition-colors ${isDark ? 'hover:bg-slate-700/25' : 'hover:bg-slate-50'}`}>
                    {(() => {
                      const field = 'no';
                      const isEditing = inlineEdit?.itemId === item.id && inlineEdit?.field === field;
                      const displayNo = item.no || formatShortProductId(item.id) || '—';
                      return (
                        <td className="px-2 py-1.5 relative group cursor-pointer w-[80px] min-w-[80px] max-w-[90px] whitespace-nowrap" onClick={(e) => !isEditing && openCellEdit(item.id, field, e)}>
                          {isEditing ? (
                            <InlineTextInput value={item.no || ''} isDark={isDark} onSave={(val) => handleInlineSave(item.id, field, val)} onCancel={() => setInlineEdit(null)} />
                          ) : (
                            <span className={`text-[11px] font-mono font-semibold text-center whitespace-nowrap ${isDark ? 'text-amber-400' : 'text-amber-600'} hover:text-orange-400 transition-colors`}>{displayNo}</span>
                          )}
                        </td>
                      );
                    })()}

                    {(() => {
                      const field = 'searchKey';
                      const isEditing = inlineEdit?.itemId === item.id && inlineEdit?.field === field;
                      return (
                        <td className="px-2 py-1.5 relative group cursor-pointer min-w-[140px]" onClick={(e) => !isEditing && openCellEdit(item.id, field, e)}>
                          {isEditing ? (
                            <InlineTextInput value={item.searchKey} isDark={isDark} onSave={(val) => handleInlineSave(item.id, field, val)} onCancel={() => setInlineEdit(null)} />
                          ) : (
                            <span className={`text-[11px] font-mono font-semibold ${isDark ? 'text-indigo-400' : 'text-indigo-600'} hover:text-orange-400 transition-colors`}>{item.searchKey}</span>
                          )}
                        </td>
                      );
                    })()}

                    {(() => {
                      const field = 'name';
                      const isEditing = inlineEdit?.itemId === item.id && inlineEdit?.field === field;
                      const displayName = isSinhala ? (item.nameSinhala || item.name) : item.name;
                      return (
                        <td className="w-[220px] max-w-[220px] truncate px-3 py-2 text-sm relative group cursor-pointer" onClick={(e) => !isEditing && openCellEdit(item.id, field, e)}>
                          {isEditing ? (
                            <InlineTextInput value={item.name} isDark={isDark} onSave={(val) => handleInlineSave(item.id, field, val)} onCancel={() => setInlineEdit(null)} />
                          ) : (
                            <ProductNameTooltip name={item.name} nameSinhala={item.nameSinhala} nameSi={item.nameSi}>
                              <div className="flex items-center gap-1.5 min-w-0 max-w-full">
                                <div className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 ${isDark ? 'bg-slate-700' : 'bg-slate-100'}`}>
                                  <Package className={`w-2.5 h-2.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`} />
                                </div>
                                <span className={`block text-[11px] font-medium leading-tight truncate ${isDark ? 'text-white' : 'text-slate-900'} hover:text-orange-400 transition-colors`}>{displayName}</span>
                              </div>
                            </ProductNameTooltip>
                          )}
                        </td>
                      );
                    })()}

                    {(() => {
                      const field = 'productCategory';
                      const isEditing = inlineEdit?.itemId === item.id && inlineEdit?.field === field;
                      const categoryLabel = resolveCategoryLabel(item);
                      return (
                        <td className="px-2 py-1.5 relative group cursor-pointer min-w-[140px]" onClick={(e) => !isEditing && openCellEdit(item.id, field, e)}>
                          {isEditing ? (
                            <InlineCategorySelect
                              value={item.productCategory}
                              isDark={isDark}
                              options={catalogCategories.map(c => c.name)}
                              onSave={(val) => handleInlineSave(item.id, field, val)}
                              onCancel={() => setInlineEdit(null)}
                            />
                          ) : (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-medium bg-purple-500/10 text-purple-400 border border-purple-500/20 hover:bg-purple-500/20 transition-colors cursor-pointer">{categoryLabel}</span>
                          )}
                        </td>
                      );
                    })()}

                    {/* Barcode cell — floating popover with orange border */}
                    {(() => {
                      const field = 'barcode';
                      const isBarcodeActive = activeBarcodeEditId === item.id;
                      return (
                        <td
                          className={`px-2 py-1.5 relative group cursor-pointer transition-all min-w-[120px] whitespace-nowrap ${isBarcodeActive
                              ? 'ring-2 ring-orange-500 ring-inset rounded-sm'
                              : ''
                            }`}
                          onClick={(e) => !isBarcodeActive && openCellEdit(item.id, field, e)}
                        >
                          <span className={`text-[10px] font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'} hover:text-orange-400 transition-colors`}>
                            {item.barcode || '—'}
                          </span>
                        </td>
                      );
                    })()}

                    {(['cost', 'lastPrice', 'salesPrice', 'displayPrice'] as const).map((field) => {
                      const isEditing = inlineEdit?.itemId === item.id && inlineEdit?.field === field;
                      return (
                        <td key={field} className={`px-2 py-1.5 text-right relative group cursor-pointer`} onClick={(e) => !isEditing && openCellEdit(item.id, field, e)}>
                          {isEditing ? (
                            <InlineNumberInput value={item[field] as number} isDark={isDark} onSave={(val) => handleInlineSave(item.id, field, val)} onCancel={() => setInlineEdit(null)} />
                          ) : (
                            <>
                              <span className={`text-[11px] font-mono ${field === 'displayPrice' || field === 'salesPrice' ? 'font-bold' : ''} ${getCellColor(item, field)} hover:text-orange-400 transition-colors`}>{renderCellValue(item, field)}</span>
                              <span className={`absolute -right-0.5 top-0.5 w-2.5 h-2.5 opacity-0 group-hover:opacity-100 transition-opacity ${isDark ? 'text-slate-500' : 'text-slate-400'}`}><Pencil className="w-2.5 h-2.5" /></span>
                            </>
                          )}
                        </td>
                      );
                    })}

                    {(() => {
                      const field = 'storeQty';
                      const isEditing = inlineEdit?.itemId === item.id && inlineEdit?.field === field;
                      return (
                        <td className="px-2 py-1.5 text-right relative group cursor-pointer" onClick={(e) => !isEditing && openCellEdit(item.id, field, e)}>
                          {isEditing ? (
                            <InlineNumberInput value={item.storeQty} isDark={isDark} onSave={(val) => handleInlineSave(item.id, field, val)} onCancel={() => setInlineEdit(null)} />
                          ) : (
                            <>
                              <span className={`text-[11px] font-mono font-bold ${getCellColor(item, 'storeQty')} hover:text-orange-400 transition-colors`}>{item.storeQty.toLocaleString()}</span>
                              <span className={`absolute -right-0.5 top-0.5 w-2.5 h-2.5 opacity-0 group-hover:opacity-100 transition-opacity ${isDark ? 'text-slate-500' : 'text-slate-400'}`}><Pencil className="w-2.5 h-2.5" /></span>
                            </>
                          )}
                        </td>
                      );
                    })()}

                    <td className="px-2 py-1.5">
                      <span className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{item.salesType}</span>
                    </td>

                    <td className="px-2 py-1.5 text-center min-w-[100px] whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-medium ${st.bg} ${st.text} ${st.border} border`}>
                        {st.icon}<span>{item.status}</span>
                      </span>
                    </td>

                    <td className="px-2 py-1.5 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={() => openRowEdit(item)}
                          className={`p-1.5 rounded-lg transition-all hover:scale-110 active:scale-90 ${isDark ? 'text-slate-400 hover:text-orange-400 hover:bg-orange-500/15' : 'text-slate-500 hover:text-orange-600 hover:bg-orange-50'}`} title="Edit full row">
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        {currentUser?.role === 'ADMIN' && (
                          <button onClick={() => setDeleteTarget(item)}
                          className={`p-1.5 rounded-lg transition-all hover:scale-110 active:scale-90 ${isDark ? 'text-slate-400 hover:text-rose-500 hover:bg-rose-500/15' : 'text-slate-500 hover:text-rose-600 hover:bg-rose-50'}`} title="Delete item">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* ── ADVANCED PAGINATION ── */}
        <div className={`flex items-center justify-between px-4 py-2.5 border-t ${isDark ? 'border-slate-700/40' : 'border-slate-200'}`}>
          <div className="flex items-center gap-3">
            <span className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Showing {startItem}-{endItem} of {filteredItems.length}
            </span>
            <div className={`flex items-center gap-1.5 text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              <span>Rows:</span>
              <select value={rowsPerPage} onChange={(e) => setRowsPerPage(Number(e.target.value))}
                className={`px-1.5 py-0.5 text-[10px] border rounded transition-colors focus:outline-none focus:ring-1 focus:ring-orange-500/50 ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'
                  }`}>
                {ROWS_PER_PAGE_OPTIONS.map((n) => (<option key={n} value={n}>{n}</option>))}
              </select>
            </div>
          </div>
          <div className="flex items-center gap-0.5">
            <button onClick={() => setCurrentPage(1)} disabled={currentPage === 1}
              className={`p-1.5 rounded transition-colors disabled:opacity-30 ${isDark ? 'text-slate-400 hover:text-white hover:bg-slate-700' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'}`} title="First page">
              <ChevronsLeft className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1}
              className={`p-1.5 rounded transition-colors disabled:opacity-30 ${isDark ? 'text-slate-400 hover:text-white hover:bg-slate-700' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'}`} title="Previous page">
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const start = Math.max(1, Math.min(currentPage - 2, totalPages - 4));
              const page = start + i;
              if (page > totalPages) return null;
              return (
                <button key={page} onClick={() => setCurrentPage(page)}
                  className={`w-7 h-7 text-[10px] font-semibold rounded transition-all ${page === currentPage
                      ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                      : isDark ? 'text-slate-300 hover:bg-slate-700' : 'text-slate-600 hover:bg-slate-100'
                    }`}>{page}</button>
              );
            })}
            <button onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}
              className={`p-1.5 rounded transition-colors disabled:opacity-30 ${isDark ? 'text-slate-400 hover:text-white hover:bg-slate-700' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'}`} title="Next page">
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages}
              className={`p-1.5 rounded transition-colors disabled:opacity-30 ${isDark ? 'text-slate-400 hover:text-white hover:bg-slate-700' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'}`} title="Last page">
              <ChevronsRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {rowEditItem && (
        <ProductFormModal
          isOpen={!!rowEditItem}
          onClose={() => setRowEditItem(null)}
          mode="edit"
          initialData={rowEditItem}
        />
      )}
      <DeleteConfirmationModal
        isOpen={!!deleteTarget}
        title={t('products.deleteTitle')}
        message={t('products.deleteMessage')}
        itemName={deleteTarget?.name}
        onConfirm={() => {
          if (deleteTarget) handleDeleteProduct(deleteTarget.id);
          setDeleteTarget(null);
        }}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};