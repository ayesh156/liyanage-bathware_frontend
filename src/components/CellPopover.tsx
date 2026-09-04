import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { Check, X } from 'lucide-react';

// ── Searchable category combobox for inline popover ──
interface CategoryComboboxProps {
  value: string;
  onSelect: (value: string) => void;
  isDark: boolean;
  options?: string[];
}

const CategoryCombobox: React.FC<CategoryComboboxProps> = ({ value, onSelect, isDark, options = [] }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [search, setSearch] = useState(value);
  const [open, setOpen] = useState(true);

  const filtered = useMemo(() => {
    if (!options || options.length === 0) return [];
    if (!search.trim()) return options;
    return options.filter((c) => c.toLowerCase().includes(search.toLowerCase()));
  }, [search, options]);

  useEffect(() => { inputRef.current?.focus(); inputRef.current?.select(); }, []);

  return (
    <div className="relative">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setOpen(true); }}
          onKeyDown={(e) => {
            if (e.key === 'Escape') { setOpen(false); onSelect(search); }
            if (e.key === 'Enter' && filtered.length === 1) { onSelect(filtered[0]); }
          }}
          placeholder="Search category..."
          className={`w-full px-2.5 py-1.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all pr-7 ${
            isDark
              ? 'bg-slate-700 border-slate-600 text-white placeholder:text-slate-500'
              : 'bg-white border-slate-200 text-slate-900 placeholder:text-slate-400'
          }`}
        />
        {search.length > 0 && (
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => { setSearch(''); setOpen(true); inputRef.current?.focus(); }}
            className={`absolute right-1.5 top-1/2 -translate-y-1/2 p-0.5 rounded transition-colors ${
              isDark ? 'text-slate-500 hover:text-white' : 'text-slate-400 hover:text-slate-700'
            }`}
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
      {open && filtered.length > 0 && (
        <div className={`absolute left-0 top-full mt-1 w-full max-h-36 overflow-y-auto rounded-md border shadow-xl z-50 ${
          isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'
        }`}>
          {filtered.map((cat) => (
            <button
              key={cat}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => { onSelect(cat); setOpen(false); }}
              className={`w-full text-left px-2.5 py-1.5 text-sm transition-colors ${
                cat === value
                  ? 'bg-orange-500/20 text-orange-400'
                  : isDark ? 'text-slate-300 hover:bg-slate-700' : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}
      {open && filtered.length === 0 && (
        <div className={`absolute left-0 top-full mt-1 w-full rounded-md border shadow-xl z-50 px-2.5 py-1.5 text-xs ${
          isDark ? 'bg-slate-800 border-slate-700 text-slate-400' : 'bg-white border-slate-200 text-slate-500'
        }`}>
          No matching categories
        </div>
      )}
    </div>
  );
};

// ── Input with clear button ──
interface ClearableInputProps {
  value: string | number;
  type?: 'text' | 'number';
  onChange: (value: string) => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  hasError: boolean;
  isDark: boolean;
  inputRef: React.RefObject<HTMLInputElement | null>;
}

const ClearableInput: React.FC<ClearableInputProps> = ({ value, type = 'text', onChange, onKeyDown, hasError, isDark, inputRef }) => {
  const strValue = String(value);
  return (
    <div className="relative">
      <input
        ref={inputRef}
        type={type === 'number' ? 'number' : 'text'}
        value={value}
        onChange={(e) => { onChange(e.target.value); }}
        onKeyDown={onKeyDown}
        step={type === 'number' ? '0.01' : undefined}
        min={type === 'number' ? '0' : undefined}
        className={`w-full px-2.5 py-1.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all pr-7 ${
          hasError
            ? 'ring-2 ring-red-500/50 border-red-500'
            : isDark
              ? 'bg-slate-700 border-slate-600 text-white placeholder:text-slate-500'
              : 'bg-white border-slate-200 text-slate-900 placeholder:text-slate-400'
        }`}
      />
      {strValue.length > 0 && (
        <button
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => { onChange(''); inputRef.current?.focus(); }}
          className={`absolute right-1.5 top-1/2 -translate-y-1/2 p-0.5 rounded transition-colors ${
            isDark ? 'text-slate-500 hover:text-white' : 'text-slate-400 hover:text-slate-700'
          }`}
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
};

interface CellPopoverProps {
  value: string | number;
  fieldLabel: string;
  type?: 'text' | 'number' | 'category';
  anchorRect: DOMRect;
  onSave: (value: string | number) => void;
  onClose: () => void;
  options?: string[];
}

export const CellPopover: React.FC<CellPopoverProps> = ({
  value,
  fieldLabel,
  type = 'text',
  anchorRect,
  onSave,
  onClose,
  options = [],
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const inputRef = useRef<HTMLInputElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const [editValue, setEditValue] = useState(String(value));
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (type !== 'category') {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [type]);

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 0);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  const handleSubmit = () => {
    if (type === 'number') {
      const num = parseFloat(editValue);
      if (isNaN(num) || num < 0) {
        setHasError(true);
        return;
      }
      onSave(num);
    } else {
      if (editValue.trim().length === 0) {
        setHasError(true);
        return;
      }
      onSave(editValue);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSubmit();
    if (e.key === 'Escape') onClose();
  };

  const handleEditChange = (val: string) => {
    setEditValue(val);
    setHasError(false);
  };

  // Position the popover anchored to the cell
  const top = anchorRect.top - 8;
  const popoverWidth = 220;
  const left = Math.max(
    8,
    Math.min(
      anchorRect.left + anchorRect.width / 2 - popoverWidth / 2,
      window.innerWidth - popoverWidth - 8
    )
  );

  return (
    <div
      ref={popoverRef}
      className={`fixed z-[200] rounded-xl border shadow-2xl p-3 animate-fade-in ${
        isDark ? 'bg-slate-800 border-slate-600' : 'bg-white border-slate-200'
      }`}
      style={{ top, left, width: popoverWidth }}
    >
      {/* Label */}
      <p className={`text-[10px] font-semibold mb-1.5 uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
        {fieldLabel}
      </p>

      {/* Input: category combobox or clearable text/number */}
      {type === 'category' ? (
        <CategoryCombobox
          value={String(editValue)}
          isDark={isDark}
          options={options}
          onSelect={(val) => { onSave(val); }}
        />
      ) : (
        <ClearableInput
          value={editValue}
          type={type}
          onChange={handleEditChange}
          onKeyDown={handleKeyDown}
          hasError={hasError}
          isDark={isDark}
          inputRef={inputRef}
        />
      )}

      {/* Error message */}
      {hasError && (
        <p className="text-[9px] text-red-400 mt-1">
          {type === 'number' ? 'Enter a valid positive number' : 'Value cannot be empty'}
        </p>
      )}

      {/* Actions (only for text/number) */}
      {type !== 'category' && (
        <div className="flex items-center gap-1.5 mt-2">
          <button
            onClick={handleSubmit}
            className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-gradient-to-r from-orange-500 to-rose-500 text-white text-xs font-semibold rounded-lg hover:from-orange-600 hover:to-rose-600 transition-all"
          >
            <Check className="w-3 h-3" />
            Save
          </button>
          <button
            onClick={onClose}
            className={`flex items-center justify-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              isDark
                ? 'text-slate-400 hover:bg-slate-700'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <X className="w-3 h-3" />
            Cancel
          </button>
        </div>
      )}
    </div>
  );
};