import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../contexts/ThemeContext';
import { useCatalog } from '../../contexts/CatalogContext';
import { Category } from '../../types/index';
import { X, Eye, EyeOff, GripVertical, Search, ArrowUpDown, CheckCircle } from 'lucide-react';
import { toast } from 'react-toastify';

interface DisplaySettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// ── Strict visibility-sort helper ──
// All visible items (showInQuickInvoice === true) float to the TOP,
// sorted numerically by sortOrder (1, 2, 3...).
// All hidden items drop to the BOTTOM (sortOrder === 0).
function sortByVisibility(cats: Category[]): Category[] {
  const visible = cats
    .filter(c => c.showInQuickInvoice)
    .sort((a, b) => a.sortOrder - b.sortOrder);
  const hidden = cats
    .filter(c => !c.showInQuickInvoice)
    .sort((a, b) => a.name.localeCompare(b.name));
  return [...visible, ...hidden];
}

// ════════════════════════════════════════════════════════════════
// enforceGaplessSequence(itemsArray)
// ── Defensive Sequential Indexing Algorithm ──
//
// 1. Split items into Visible (showInQuickInvoice === true) and
//    Hidden (showInQuickInvoice === false).
// 2. Sort Visible by current sortOrder ascending.
// 3. Forcibly re-assign Visible sortOrder from 1 to N (gapless).
// 4. Lock Hidden items at sortOrder: 0.
// 5. Return the full gapless re-indexed array (visible first,
//    then hidden).
// ════════════════════════════════════════════════════════════════
function enforceGaplessSequence(itemsArray: Category[]): Category[] {
  // Separate into visible and hidden groups
  const visible = itemsArray
    .filter(c => c.showInQuickInvoice)
    .sort((a, b) => a.sortOrder - b.sortOrder);
  const hidden = itemsArray
    .filter(c => !c.showInQuickInvoice)
    .sort((a, b) => a.name.localeCompare(b.name));

  // Re-assign sequential sortOrder starting from 1, completely gapless
  let visibleIndex = 0;
  const reindexedVisible = visible.map(c => {
    visibleIndex++;
    return { ...c, sortOrder: visibleIndex };
  });

  // Lock hidden items at 0
  const reindexedHidden = hidden.map(c => ({
    ...c,
    sortOrder: 0,
  }));

  return [...reindexedVisible, ...reindexedHidden];
}

export const DisplaySettingsModal: React.FC<DisplaySettingsModalProps> = ({ isOpen, onClose }) => {
  const { i18n } = useTranslation();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const currentLanguage = (i18n.language || '').toLowerCase();
  const isSinhala = currentLanguage === 'si' || currentLanguage === 'sinhala';
  const { categories, bulkUpdateDisplaySettings, isCategoriesLoading } = useCatalog();

  const [localCategories, setLocalCategories] = useState<Category[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  // Track raw input values per category during editing
  // This prevents the shifting algorithm from interfering with multi-digit typing
  const [editingValues, setEditingValues] = useState<Record<string, string>>({});

  // Initialize local state from context categories — strictly sorted by visibility
  // AND gaplessly re-indexed so the user never sees skipped numbers (e.g. 9 → 12).
  useEffect(() => {
    if (isOpen) {
      const sorted = sortByVisibility(categories);
      setLocalCategories(enforceGaplessSequence(sorted));
      setSearchQuery('');
      setEditingValues({});
      setTimeout(() => searchRef.current?.focus(), 100);
    }
  }, [isOpen, categories]);

  // ── displayCategories: always derived from localCategories via enforceGaplessSequence ──
  // This is the authoritative ordering used for rendering.
  // By running enforceGaplessSequence here, any state mutation that changes sortOrder
  // is immediately normalized before the UI re-renders.
  const displayCategories = useMemo(() => {
    return enforceGaplessSequence(localCategories);
  }, [localCategories]);

  // Filtered version preserves the visibility-sorted order
  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return displayCategories;
    const q = searchQuery.toLowerCase();
    return displayCategories.filter(c =>
      c.name.toLowerCase().includes(q) ||
      (c.nameSinhala && c.nameSinhala.toLowerCase().includes(q))
    );
  }, [displayCategories, searchQuery]);

  // Toggle visibility for a single category
  // Rule A: Hidden → sortOrder = 0, toggle showInQuickInvoice = false
  // Rule B: Visible → auto-assign next sequential index (1, 2, 3...)
  // After toggle, run enforceGaplessSequence to close any gaps.
  const toggleVisibility = useCallback((id: string) => {
    setLocalCategories(prev => {
      const target = prev.find(c => c.id === id);
      if (!target) return prev;
      const willBeVisible = !target.showInQuickInvoice;

      const updated = prev.map(c => {
        if (c.id !== id) return c;
        if (!willBeVisible) {
          // Rule A: Hidden
          return { ...c, showInQuickInvoice: false, sortOrder: 0 };
        } else {
          // Rule B: Visible → grab next sequential index
          const maxOrder = prev.reduce((max, cat) => {
            if (cat.id !== id && cat.showInQuickInvoice && cat.sortOrder > 0) {
              return Math.max(max, cat.sortOrder);
            }
            return max;
          }, 0);
          return { ...c, showInQuickInvoice: true, sortOrder: maxOrder + 1 };
        }
      });

      // Enforce gapless sequence to eliminate structural index gaps
      return enforceGaplessSequence(updated);
    });
  }, []);

  // ── Auto-shifting sequential re-indexing algorithm ──
  // Called when the user finishes editing a sortOrder value (onBlur).
  //
  // Algorithm:
  // 1. Extract the targetCategory that was changed.
  // 2. For all OTHER visible categories:
  //    - If a category's current sortOrder >= newOrder, increment by 1 (shift downward).
  // 3. Assign newOrder to the targetCategory.
  // 4. Hidden categories stay locked at sortOrder: 0.
  // 5. Run enforceGaplessSequence to close any gaps created by the shift.
  const applyOrderShift = useCallback((id: string, rawValue: string) => {
    const newOrder = Math.max(0, parseInt(rawValue) || 0);

    // Clear the editing value for this category
    setEditingValues(prev => {
      const next = { ...prev };
      delete next[id];
      return next;
    });

    setLocalCategories(prev => {
      const target = prev.find(c => c.id === id);
      if (!target) return prev;

      // Separate into visible and hidden groups
      const hidden = prev
        .filter(c => !c.showInQuickInvoice)
        .map(c => ({ ...c, sortOrder: 0 }));

      // Apply the shift algorithm to visible items
      const visible = prev
        .filter(c => c.showInQuickInvoice)
        .map(c => {
          if (c.id === id) {
            // Assign the new order directly to the target category
            return { ...c, sortOrder: newOrder };
          }
          // Shift all items whose current sortOrder >= newOrder
          if (c.sortOrder >= newOrder) {
            return { ...c, sortOrder: c.sortOrder + 1 };
          }
          return c;
        });

      // Re-sort visible group ascending by the newly computed sortOrder
      visible.sort((a, b) => a.sortOrder - b.sortOrder);

      // Merge: visible first (sorted), then hidden at bottom
      const merged = [...visible, ...hidden];

      // Enforce gapless sequence to eliminate structural index gaps
      return enforceGaplessSequence(merged);
    });
  }, []);

  // Handles real-time keystroke updates to the input field
  // This stores the raw string so the user can freely type multi-digit numbers
  // without the shifting algorithm disrupting the editing UX
  const onOrderNumberChange = useCallback((id: string, value: string) => {
    setEditingValues(prev => ({ ...prev, [id]: value }));
  }, []);

  // Handles blur event - triggers the shifting algorithm with the final value
  const onOrderNumberBlur = useCallback((id: string, value: string) => {
    applyOrderShift(id, value);
  }, [applyOrderShift]);

  const getCategoryDisplayName = useCallback((category: Category) => {
    const sinhalaName = category.nameSinhala?.trim();
    if (isSinhala && sinhalaName) return sinhalaName;
    return category.name;
  }, [isSinhala]);

  // ── Drag reorder with visibility group boundary protection ──
  const handleDragStart = useCallback((index: number) => {
    setDraggedIndex(index);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    // Determine visibility groups from the displayCategories ordering
    const sourceItem = displayCategories[draggedIndex];
    const targetItem = displayCategories[index];

    // Block dragging a visible item into the hidden block and vice versa
    if (sourceItem.showInQuickInvoice !== targetItem.showInQuickInvoice) return;

    setLocalCategories(prev => {
      const sorted = sortByVisibility(prev);
      const [moved] = sorted.splice(draggedIndex, 1);
      // Recalculate insertion index after removal
      const adjustedTarget = index > draggedIndex ? index - 1 : index;
      sorted.splice(adjustedTarget, 0, moved);
      return sorted;
    });
    setDraggedIndex(index);
  }, [draggedIndex, displayCategories]);

  const handleDragEnd = useCallback(() => {
    setDraggedIndex(null);

    // Auto-reindex using gapless sequential algorithm
    setLocalCategories(prev => {
      return enforceGaplessSequence(prev);
    });
  }, []);

  // Auto-assign sort orders using the gapless sequential algorithm
  const normalizeOrders = useCallback(() => {
    setEditingValues({});
    setLocalCategories(prev => {
      return enforceGaplessSequence(prev);
    });
  }, []);

  // Save all changes
  const handleSave = useCallback(async () => {
    setIsSaving(true);
    try {
      // Run enforceGaplessSequence one final time before saving to guarantee
      // the payload sent to the backend has a perfectly gapless indexed sequence.
      const finalCategories = enforceGaplessSequence(localCategories);
      const settings = finalCategories.map(c => ({
        id: c.id,
        sortOrder: c.sortOrder,
        showInQuickInvoice: c.showInQuickInvoice,
      }));
      await bulkUpdateDisplaySettings(settings);
      onClose();
    } catch (err) {
      // Error handled in context
    } finally {
      setIsSaving(false);
    }
  }, [localCategories, bulkUpdateDisplaySettings, onClose]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop — intentionally NOT clickable; use X or Cancel to close */}
      <div className="fixed inset-0 z-[300] bg-black/60 backdrop-blur-sm" />

      {/* Modal */}
      <div className={`fixed z-[301] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl max-h-[85vh] rounded-2xl border shadow-2xl flex flex-col ${
        isDark ? 'bg-slate-800 border-slate-700/50' : 'bg-white border-slate-200'
      }`}>
        {/* Header */}
        <div className={`flex items-center justify-between px-5 py-4 border-b flex-shrink-0 ${
          isDark ? 'border-slate-700/60' : 'border-slate-100'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center`}>
              <Eye className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Display Settings
              </h2>
              <p className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Configure category visibility & ordering for Quick Invoice
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-1.5 rounded-lg transition-colors ${isDark ? 'hover:bg-slate-700 text-slate-400' : 'hover:bg-slate-100 text-slate-500'}`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Toolbar */}
        <div className={`px-5 py-3 border-b flex items-center gap-3 ${isDark ? 'border-slate-700/60' : 'border-slate-100'}`}>
          <div className="relative flex-1 max-w-xs">
            <Search className={`absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`} />
            <input
              ref={searchRef}
              type="text"
              placeholder="Search categories..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className={`w-full pl-8 pr-3 py-1.5 text-xs border rounded-lg focus:outline-none focus:ring-1 focus:ring-purple-500/50 ${
                isDark ? 'bg-slate-700/50 border-slate-600 text-white placeholder-slate-500' : 'bg-slate-50 border-slate-200 text-slate-900'
              }`}
            />
          </div>
          <button
            onClick={normalizeOrders}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-semibold transition-all ${
              isDark ? 'bg-slate-700 text-slate-300 hover:bg-slate-600 border border-slate-600' : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200'
            }`}
          >
            <ArrowUpDown className="w-3 h-3" />
            Normalize
          </button>
          <span className={`text-[10px] ml-auto ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            {displayCategories.length} categories
          </span>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1 custom-scrollbar">
          {isCategoriesLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-6 h-6 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
            </div>
          ) : filteredCategories.length === 0 ? (
            <div className={`text-center py-12 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
              <EyeOff className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p className="text-xs font-medium">No categories found</p>
            </div>
          ) : (
            filteredCategories.map((cat, index) => {
              // Determine if we're at a visibility group boundary
              const prevCat = index > 0 ? filteredCategories[index - 1] : null;
              const isFirstHidden = !cat.showInQuickInvoice && prevCat && prevCat.showInQuickInvoice;

              // Use editing value if available, otherwise use the category's sortOrder
              const inputValue = editingValues[cat.id] !== undefined
                ? editingValues[cat.id]
                : cat.sortOrder.toString();

              return (
                <div
                  key={cat.id}
                  draggable={false}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all cursor-grab active:cursor-grabbing border ${
                    draggedIndex === index
                      ? isDark
                        ? 'bg-purple-500/20 border-purple-500/50 shadow-lg opacity-60'
                        : 'bg-purple-50 border-purple-400 shadow-lg opacity-60'
                      : isDark
                        ? 'bg-slate-700/30 border-transparent hover:bg-slate-700/50 hover:border-slate-600'
                        : 'bg-white border-transparent hover:bg-slate-50 hover:border-slate-200'
                  }`}
                  style={isFirstHidden ? { marginTop: '12px', borderTop: `2px dashed ${isDark ? '#475569' : '#cbd5e1'}` } : {}}
                >
                  {/* Drag handle — manually controlled to respect visibility groups */}
                  <div
                    className={`flex-shrink-0 cursor-grab active:cursor-grabbing ${isDark ? 'text-slate-500' : 'text-slate-400'}`}
                    draggable
                    onDragStart={() => handleDragStart(index)}
                    onDragOver={e => handleDragOver(e, index)}
                    onDragEnd={handleDragEnd}
                  >
                    <GripVertical className="w-4 h-4" />
                  </div>

                  {/* Sort Order Input */}
                  <div className="w-20 flex-shrink-0">
                    <input
                      type="number"
                      value={inputValue}
                      onClick={e => e.stopPropagation()}
                      onChange={e => onOrderNumberChange(cat.id, e.target.value)}
                      onBlur={e => onOrderNumberBlur(cat.id, e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          (e.target as HTMLInputElement).blur();
                        }
                      }}
                      className={`w-full px-1.5 py-1 text-[11px] font-mono font-bold text-center rounded-lg border focus:outline-none focus:ring-1 focus:ring-purple-500/50 ${
                        isDark ? 'bg-slate-800 border-slate-600 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                      }`}
                    />
                  </div>

                  {/* Category info */}
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-semibold truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      {getCategoryDisplayName(cat)}
                    </p>
                    {cat.nameSinhala && !isSinhala && (
                      <p className={`text-[10px] truncate ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                        {cat.nameSinhala}
                      </p>
                    )}
                  </div>

                  {/* Usage count */}
                  <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded-full flex-shrink-0 ${
                    isDark ? 'bg-slate-700 text-slate-400' : 'bg-slate-100 text-slate-500'
                  }`}>
                    {cat.usageCount || 0}
                  </span>

                  {/* Visibility toggle */}
                  <button
                    onClick={e => { e.stopPropagation(); toggleVisibility(cat.id); }}
                    className={`p-1.5 rounded-lg transition-all flex-shrink-0 ${
                      cat.showInQuickInvoice
                        ? isDark
                          ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
                          : 'bg-emerald-100 text-emerald-600 hover:bg-emerald-200'
                        : isDark
                          ? 'bg-slate-700 text-slate-500 hover:bg-slate-600'
                          : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                    }`}
                    title={cat.showInQuickInvoice ? 'Visible in Quick Invoice' : 'Hidden in Quick Invoice'}
                  >
                    {cat.showInQuickInvoice ? (
                      <Eye className="w-3.5 h-3.5" />
                    ) : (
                      <EyeOff className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className={`flex items-center justify-end gap-2 px-5 py-3 border-t flex-shrink-0 ${
          isDark ? 'border-slate-700/60' : 'border-slate-100'
        }`}>
          <button
            onClick={onClose}
            className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
              isDark ? 'text-slate-300 hover:bg-slate-700' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg shadow-purple-500/20 transition-all disabled:opacity-50"
          >
            {isSaving ? (
              <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <CheckCircle className="w-3.5 h-3.5" />
            )}
            {isSaving ? 'Saving...' : `Save ${displayCategories.length} Settings`}
          </button>
        </div>
      </div>
    </>
  );
};

export default DisplaySettingsModal;