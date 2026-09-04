import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useTranslation } from 'react-i18next';
import { useCatalog } from '../contexts/CatalogContext';
import { CategoryFormModal } from '../components/modals/CategoryFormModal';
import { X, Save, AlertTriangle, DollarSign, Package, Hash, Layers, Tag, BarChart3, ShoppingCart, Plus } from 'lucide-react';
import { InventoryProduct } from '../types';
import { Category } from '../types';

interface AddProductModalProps {
  onSave: (product: InventoryProduct) => void;
  onClose: () => void;
  prefillCategory?: string;
}

function deriveStatus(storeQty: number): InventoryProduct['status'] {
  if (storeQty === 0) return 'Out of Stock';
  if (storeQty <= 10) return 'Low Stock';
  return 'Available';
}

// ── Sales Type localization ──
// The underlying database/form value is the clean English enum string
// (e.g. 'Piece', 'Kg'), while the dropdown UI renders a localized label
// based on the active system language.
interface ComboboxOption {
  value: string;
  label: string;
}

const SALES_TYPE_OPTIONS: ComboboxOption[] = [
  { value: 'Piece', label: 'Piece' },
  { value: 'Full', label: 'Full' },
  { value: 'Half', label: 'Half' },
  { value: 'Quarter', label: 'Quarter' },
  { value: 'Kg', label: 'Kg' },
  { value: 'Meter', label: 'Meter' },
  { value: 'Liter', label: 'Liter' },
  { value: 'Packet', label: 'Packet' },
  { value: 'Box', label: 'Box' },
  { value: 'Set', label: 'Set' },
];

const SALES_TYPE_SINHALA_LABELS: Record<string, string> = {
  Piece: 'කෑල්ල (Piece)',
  Full: 'සම්පූර්ණ (Full)',
  Half: 'අර්ධ (Half)',
  Quarter: 'කාර්තුව (Quarter)',
  Kg: 'කිලෝග්‍රෑම් (Kg)',
  Meter: 'මීටර් (Meter)',
  Liter: 'ලීටර් (Liter)',
  Packet: 'පැකට් (Packet)',
  Box: 'පෙට්ටි (Box)',
  Set: 'කට්ටල (Set)',
};

// ── Searchable combobox with "+ Add Category" mini button ──
interface SearchComboboxProps {
  options: ComboboxOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  isDark: boolean;
  onAddCategory?: () => void;
}

const SearchCombobox: React.FC<SearchComboboxProps> = ({ options, value, onChange, placeholder, isDark, onAddCategory }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);

  // CRITICAL SYNC: Keep the inner search text in perfect lockstep with the
  // parent form state (form.productCategory). Without this, the combobox can
  // visually display a stale category while the actual form state is empty,
  // causing phantom "Please select a category" validation errors on save.
  // 🚀 LOCALIZATION: When the active language is Sinhala, the input displays
  // the localized label (nameSinhala / categorySi / sales type Sinhala) while
  // still storing the clean English database value in the parent form state.
  useEffect(() => {
    const match = options.find((o) => o.value === value);
    setSearch(match ? match.label : value);
  }, [value, options]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return options;
    // 🔍 Search BOTH the localized label and the raw English value so users can
    // filter in Sinhala or English regardless of the active display language.
    return options.filter(
      (o) => o.label.toLowerCase().includes(q) || o.value.toLowerCase().includes(q)
    );
  }, [search, options]);

  useEffect(() => { if (open) { inputRef.current?.focus(); inputRef.current?.select(); } }, [open]);
  useEffect(() => {
    const handler = (e: MouseEvent) => { if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={containerRef} className="relative flex items-center gap-1">
      <div className="relative flex-1">
        <input ref={inputRef} type="text" value={search}
          onChange={(e) => { setSearch(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => { if (e.key === 'Escape') setOpen(false); if (e.key === 'Enter' && filtered.length === 1) { onChange(filtered[0].value); setSearch(filtered[0].label); setOpen(false); } }}
          placeholder={placeholder || 'Search...'}
          className={`w-full px-2.5 py-1.5 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 transition-all pr-7 ${
            isDark ? 'bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500' : 'bg-white border-slate-200 text-slate-900 placeholder:text-slate-400'
          }`}
        />
        {search.length > 0 && (
          <button onMouseDown={(e) => e.preventDefault()} onClick={() => { setSearch(''); setOpen(true); inputRef.current?.focus(); }}
            className={`absolute right-1.5 top-1/2 -translate-y-1/2 p-0.5 rounded transition-colors ${isDark ? 'text-slate-500 hover:text-white' : 'text-slate-400 hover:text-slate-700'}`}>
            <X className="w-3.5 h-3.5" />
          </button>
        )}
        {open && (
          <div className={`absolute left-0 top-full mt-0.5 w-full max-h-32 overflow-y-auto rounded-md border shadow-xl z-50 ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
            {filtered.length > 0 ? filtered.map((opt) => (
              <button key={opt.value} onMouseDown={(e) => e.preventDefault()} onClick={() => { onChange(opt.value); setSearch(opt.label); setOpen(false); }}
                className={`w-full text-left px-2.5 py-1.5 text-xs font-medium transition-colors ${opt.value === value ? 'bg-orange-500/20 text-orange-400' : isDark ? 'text-slate-300 hover:bg-slate-700' : 'text-slate-700 hover:bg-slate-100'}`}>{opt.label}</button>
            )) : <div className={`px-2.5 py-1.5 text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>No results</div>}
          </div>
        )}
      </div>
      {onAddCategory && (
        <button type="button" onClick={(e) => { e.stopPropagation(); onAddCategory(); }} title="Add new category"
          className={`flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-lg border transition-all hover:scale-105 active:scale-95 ${
            isDark ? 'border-slate-600 bg-slate-700 hover:bg-slate-600 text-orange-400' : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-orange-600'
          }`}>
          <Plus className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
};

// ── Clearable input ──
interface ClearableInputProps {
  value: string | number;
  type?: 'text' | 'number';
  isNumeric?: boolean;
  onChange: (value: string) => void;
  placeholder?: string;
  hasError?: boolean;
  isDark: boolean;
  className?: string;
  min?: string;
  step?: string;
}

function sanitizeNumericInput(raw: string): string {
  if (raw === '' || raw === '.') return raw;
  return raw.replace(/^0+(?=\d)/, '');
}

const ClearableInput: React.FC<ClearableInputProps> = ({ value, type = 'text', isNumeric, onChange, placeholder, hasError, isDark, className = '', min, step }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const strValue = String(value);
  const handleFocus = () => { if (isNumeric && strValue === '0') onChange(''); };
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => { const raw = e.target.value; onChange(isNumeric ? sanitizeNumericInput(raw) : raw); };
  const handleBlur = () => { if (isNumeric && strValue === '') onChange('0'); };
  return (
    <div className="relative">
      <input ref={inputRef} type={type === 'number' ? 'number' : 'text'} value={value} onChange={handleChange} onFocus={handleFocus} onBlur={handleBlur}
        placeholder={placeholder} min={min} step={step}
        className={`w-full px-2.5 py-1.5 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 transition-all pr-7 ${
          hasError ? 'ring-2 ring-red-500/50 border-red-500'
            : isDark ? 'bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500'
            : 'bg-white border-slate-200 text-slate-900 placeholder:text-slate-400'
        } ${className}`}
      />
      {strValue.length > 0 && (
        <button onMouseDown={(e) => e.preventDefault()} onClick={() => { onChange(''); inputRef.current?.focus(); }}
          className={`absolute right-1.5 top-1/2 -translate-y-1/2 p-0.5 rounded transition-colors ${isDark ? 'text-slate-500 hover:text-white' : 'text-slate-400 hover:text-slate-700'}`}>
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
};

interface FieldGroupProps {
  label: string; icon?: React.ReactNode; children: React.ReactNode;
}

const FieldGroup: React.FC<FieldGroupProps> = ({ label, icon, children }) => (
  <div className="space-y-1">
    <label className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">{icon}{label}</label>
    {children}
  </div>
);

export const AddProductModal: React.FC<AddProductModalProps> = ({ onSave, onClose, prefillCategory }) => {
  const { theme } = useTheme();
  const { t, i18n } = useTranslation();
  const { categories, addCategory } = useCatalog();
  const isDark = theme === 'dark';
  const modalRef = useRef<HTMLDivElement>(null);
  // 🚀 LOCALIZATION: Detect active system language for displaying localized
  // Category names (nameSinhala / nameSi) and Sales Type labels.
  const isSinhala = i18n.language?.toLowerCase() === 'si';

  const [form, setForm] = useState({
    searchKey: '',
    name: '',
    // 🚨 FIX: New product form strictly starts with empty category
    productCategory: '',
    cost: 0,
    lastPrice: 0,
    salesPrice: 0,
    displayPrice: 0,
    storeQty: 0,
    salesType: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showAddCategory, setShowAddCategory] = useState(false);

  const derivedStatus = deriveStatus(form.storeQty);

  // 🚀 LOCALIZATION: Build category dropdown options as { value, label } pairs.
  // The raw English category name (c.name) is the stored value so the backend
  // payload stays unchanged. When Sinhala is active, the dropdown displays
  // nameSinhala / nameSi.
  const categoryOptions = useMemo((): ComboboxOption[] => {
    return categories.map((c) => {
      const sinhalaName = c.nameSinhala || (c as any).nameSi || (c as any).categorySi;
      const label = isSinhala && sinhalaName ? sinhalaName : c.name;
      return { value: c.name, label };
    });
  }, [categories, isSinhala]);

  // 🚀 LOCALIZATION: Sales Type dropdown — display localized labels in Sinhala
  // mode (e.g. 'කෑල්ල (Piece)') while keeping the clean enum value ('Piece').
  const salesTypeOptions = useMemo((): ComboboxOption[] => {
    if (!isSinhala) return SALES_TYPE_OPTIONS;
    return SALES_TYPE_OPTIONS.map((opt) => ({
      value: opt.value,
      label: SALES_TYPE_SINHALA_LABELS[opt.value] || opt.label,
    }));
  }, [isSinhala]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', handleKeyDown); document.body.style.overflow = ''; };
  }, [onClose]);

  const updateField = (key: string, value: string | number) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => { const n = { ...prev }; delete n[key]; return n; });
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!form.searchKey.trim()) errs.searchKey = t('addProductModal.searchKeyRequired');
    if (!form.name.trim()) errs.name = t('addProductModal.productNameRequired');
    if (form.cost < 0) errs.cost = t('addProductModal.costRequired');
    if (form.lastPrice < 0) errs.lastPrice = t('addProductModal.lastPriceRequired');
    if (form.salesPrice < 0) errs.salesPrice = t('addProductModal.salesPriceRequired');
    if (form.displayPrice < 0) errs.displayPrice = t('addProductModal.displayPriceRequired');
    if (form.storeQty < 0) errs.storeQty = t('addProductModal.storeQtyRequired');
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = () => {
    if (validate()) {
      const newProduct: InventoryProduct = {
        id: `inv-${Date.now()}`,
        searchKey: form.searchKey,
        name: form.name,
        productCategory: form.productCategory,
        cost: form.cost,
        lastPrice: form.lastPrice,
        salesPrice: form.salesPrice,
        displayPrice: form.displayPrice,
        storeQty: form.storeQty,
        salesType: (form.salesType || 'Piece') as InventoryProduct['salesType'],
        status: derivedStatus,
      };
      onSave(newProduct);
    }
  };

  const handleKeyDownEvent = (e: React.KeyboardEvent) => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleSubmit(); };

  const handleStrUpdate = (key: string, val: string) => {
    if (val === '') { updateField(key, ''); return; }
    if (key === 'searchKey' || key === 'name' || key === 'productCategory' || key === 'salesType') {
      updateField(key, val);
    } else {
      updateField(key, parseFloat(val) || 0);
    }
  };

  // Nested category save: creates category, auto-selects in combobox, closes sub-modal
  const handleNewCategory = async (catData: Partial<Category>) => {
    const newCat = await addCategory(catData as any);
    updateField('productCategory', newCat.name);
    setShowAddCategory(false);
  };

  return (
    <>
      {showAddCategory && (
        <CategoryFormModal
          isOpen={showAddCategory}
          onClose={() => setShowAddCategory(false)}
          onSave={handleNewCategory}
          category={null}
          categories={categories}
        />
      )}

      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
        <div ref={modalRef} onKeyDown={handleKeyDownEvent} className={`relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl border shadow-2xl animate-slide-in ${isDark ? 'bg-slate-800 border-slate-700/50' : 'bg-white border-slate-200'}`}>
          {/* Header */}
          <div className={`sticky top-0 z-10 flex items-center justify-between px-5 py-3 border-b backdrop-blur-xl ${isDark ? 'bg-slate-800/90 border-slate-700/50' : 'bg-white/90 border-slate-200'}`}>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-rose-500 flex items-center justify-center"><Package className="w-4 h-4 text-white" /></div>
              <div>
                <h2 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{t('addProductModal.title')}</h2>
                <p className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{t('addProductModal.subtitle')}</p>
              </div>
            </div>
            <button onClick={onClose} className={`p-1.5 rounded-lg transition-colors ${isDark ? 'text-slate-400 hover:text-white hover:bg-slate-700' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'}`}><X className="w-4 h-4" /></button>
          </div>

          {/* Body */}
          <div className="p-5">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Search Key */}
              <div className="lg:col-span-2">
                <FieldGroup label={t('addProductModal.searchKey')} icon={<Tag className="w-3 h-3" />}>
                  <ClearableInput value={form.searchKey} isDark={isDark} onChange={(v) => handleStrUpdate('searchKey', v)} placeholder={t('addProductModal.searchKeyPlaceholder')} hasError={!!errors.searchKey} />
                  {errors.searchKey && <p className="text-[9px] text-red-400 mt-0.5">{errors.searchKey}</p>}
                </FieldGroup>
              </div>
              <div>
                <FieldGroup label={t('addProductModal.status')} icon={<AlertTriangle className="w-3 h-3" />}>
                  <input type="text" value={derivedStatus} disabled className={`w-full px-2.5 py-1.5 text-xs border rounded-lg opacity-70 cursor-not-allowed ${isDark ? 'bg-slate-700/30 border-slate-600 text-slate-400' : 'bg-slate-100 border-slate-200 text-slate-500'}`} />
                </FieldGroup>
              </div>
              {/* Name */}
              <div className="lg:col-span-3">
                <FieldGroup label={t('addProductModal.productName')} icon={<Package className="w-3 h-3" />}>
                  <ClearableInput value={form.name} isDark={isDark} onChange={(v) => handleStrUpdate('name', v)} placeholder={t('addProductModal.productNamePlaceholder')} hasError={!!errors.name} />
                  {errors.name && <p className="text-[9px] text-red-400 mt-0.5">{errors.name}</p>}
                </FieldGroup>
              </div>
              {/* Product Category — dynamic + nested add button */}
              <div className="lg:col-span-2">
                <FieldGroup label={t('addProductModal.category')} icon={<Layers className="w-3 h-3" />}>
                  <SearchCombobox options={categoryOptions} value={form.productCategory} onChange={(v) => updateField('productCategory', v)} placeholder={t('addProductModal.categoryPlaceholder')} isDark={isDark} onAddCategory={() => setShowAddCategory(true)} />
                </FieldGroup>
              </div>
              {/* Sales Type */}
              <div>
                <FieldGroup label={t('addProductModal.salesType')} icon={<ShoppingCart className="w-3 h-3" />}>
                  <SearchCombobox options={salesTypeOptions} value={form.salesType} onChange={(v) => updateField('salesType', v)} placeholder={t('addProductModal.salesTypePlaceholder')} isDark={isDark} />
                </FieldGroup>
              </div>
              {/* Pricing */}
              <div className={`lg:col-span-3 p-3 rounded-lg border ${isDark ? 'bg-slate-900/30 border-slate-700/30' : 'bg-slate-50 border-slate-200'}`}>
                <div className="flex items-center gap-1.5 mb-2">
                  <DollarSign className="w-3.5 h-3.5 text-orange-400" />
                  <span className={`text-[10px] font-semibold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{t('addProductModal.pricing')}</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <FieldGroup label={t('addProductModal.cost')} icon={<DollarSign className="w-3 h-3" />}>
                    <ClearableInput value={form.cost} type="number" isNumeric isDark={isDark} onChange={(v) => handleStrUpdate('cost', v)} hasError={!!errors.cost} min="0" step="0.01" />
                    {errors.cost && <p className="text-[9px] text-red-400 mt-0.5">{errors.cost}</p>}
                  </FieldGroup>
                  <FieldGroup label={t('addProductModal.lastPrice')} icon={<BarChart3 className="w-3 h-3" />}>
                    <ClearableInput value={form.lastPrice} type="number" isNumeric isDark={isDark} onChange={(v) => handleStrUpdate('lastPrice', v)} hasError={!!errors.lastPrice} min="0" step="0.01" />
                    {errors.lastPrice && <p className="text-[9px] text-red-400 mt-0.5">{errors.lastPrice}</p>}
                  </FieldGroup>
                  <FieldGroup label={t('addProductModal.salesPrice')} icon={<Tag className="w-3 h-3" />}>
                    <ClearableInput value={form.salesPrice} type="number" isNumeric isDark={isDark} onChange={(v) => handleStrUpdate('salesPrice', v)} hasError={!!errors.salesPrice} className="font-medium text-cyan-400" min="0" step="0.01" />
                    {errors.salesPrice && <p className="text-[9px] text-red-400 mt-0.5">{errors.salesPrice}</p>}
                  </FieldGroup>
                  <FieldGroup label={t('addProductModal.displayPrice')} icon={<Tag className="w-3 h-3" />}>
                    <ClearableInput value={form.displayPrice} type="number" isNumeric isDark={isDark} onChange={(v) => handleStrUpdate('displayPrice', v)} hasError={!!errors.displayPrice} className="font-bold text-green-400" min="0" step="0.01" />
                    {errors.displayPrice && <p className="text-[9px] text-red-400 mt-0.5">{errors.displayPrice}</p>}
                  </FieldGroup>
                </div>
              </div>
              {/* Stock */}
              <div className={`lg:col-span-3 p-3 rounded-lg border ${isDark ? 'bg-slate-900/30 border-slate-700/30' : 'bg-slate-50 border-slate-200'}`}>
                <div className="flex items-center gap-1.5 mb-2">
                  <Package className="w-3.5 h-3.5 text-orange-400" />
                  <span className={`text-[10px] font-semibold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{t('addProductModal.stock')}</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <FieldGroup label={t('addProductModal.storeQty')} icon={<Hash className="w-3 h-3" />}>
                    <ClearableInput value={form.storeQty} type="number" isNumeric isDark={isDark} onChange={(v) => handleStrUpdate('storeQty', v)} hasError={!!errors.storeQty} className="font-bold" min="0" />
                    {errors.storeQty && <p className="text-[9px] text-red-400 mt-0.5">{errors.storeQty}</p>}
                  </FieldGroup>
                  <div className="flex items-center justify-center">
                    <div className={`text-center p-2 rounded-lg border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
                      <p className={`text-[9px] font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{t('addProductModal.stockValue')}</p>
                      <p className={`text-sm font-bold ${isDark ? 'text-green-400' : 'text-green-600'}`}>Rs. {(form.cost * form.storeQty).toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className={`sticky bottom-0 flex items-center justify-between px-5 py-3 border-t backdrop-blur-xl ${isDark ? 'bg-slate-800/90 border-slate-700/50' : 'bg-white/90 border-slate-200'}`}>
            <div className="flex items-center gap-2">
              <kbd className={`hidden md:inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-mono rounded ${isDark ? 'bg-slate-700 text-slate-400' : 'bg-slate-200 text-slate-500'}`}><span className="text-[9px]">⌘</span> Enter</kbd>
              <span className={`text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{t('addProductModal.toSave')}</span>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={onClose} className={`px-4 py-2 text-xs font-medium rounded-lg transition-colors ${isDark ? 'text-slate-300 hover:bg-slate-700' : 'text-slate-600 hover:bg-slate-100'}`}>{t('addProductModal.cancel')}</button>
              <button onClick={handleSubmit} className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600 text-white shadow-lg shadow-orange-500/20 transition-all">
                <Save className="w-3.5 h-3.5" /> {t('addProductModal.addProduct')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};