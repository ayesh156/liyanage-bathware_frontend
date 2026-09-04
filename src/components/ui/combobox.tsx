import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronDown, Search, X } from 'lucide-react';

export interface ComboboxOption {
  value: string;
  label: string;
  count?: number;
}

interface ComboboxProps {
  value: string;
  onChange: (value: string) => void;
  options: ComboboxOption[];
  placeholder?: string;
  emptyMessage?: string;
  isDark: boolean;
  allLabel?: string;
  /** Whether to show the "All" option */
  showAll?: boolean;
}

/**
 * SearchableCombobox
 *
 * A modern, dark-theme combobox with:
 * - Fuzzy search filtering
 * - Clear button when value selected
 * - Smooth open/close with click-outside dismiss
 * - Glassmorphism dropdown layer
 * - Count badges for each option
 */
export const SearchableCombobox: React.FC<ComboboxProps> = ({
  value,
  onChange,
  options,
  placeholder = 'Search...',
  emptyMessage = 'No options found',
  isDark,
  allLabel = 'All',
  showAll = true,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!search.trim()) return options;
    const q = search.toLowerCase();
    return options.filter((o) => o.label.toLowerCase().includes(q));
  }, [search, options]);

  const selectedLabel = value === 'all' ? allLabel : options.find((o) => o.value === value)?.label || '';

  // Focus input when opening
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  // Reset search on close
  useEffect(() => {
    if (!open) setSearch('');
  }, [open]);

  // Click-outside dismiss
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const selectOption = (val: string) => {
    onChange(val);
    setOpen(false);
  };

  return (
    <div ref={containerRef} className="relative w-full">
      {/* ── Trigger Button ── */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`w-full flex items-center justify-between px-2 py-1.5 text-xs border rounded-lg transition-all ${
          isDark
            ? 'bg-slate-900/50 border-slate-700 hover:border-slate-600'
            : 'bg-slate-50 border-slate-200 hover:border-slate-300'
        } ${value !== 'all' ? 'border-orange-500/50 ring-1 ring-orange-500/20' : ''}`}
      >
        <span className={`truncate ${value !== 'all' ? 'text-orange-400 font-medium' : isDark ? 'text-white' : 'text-slate-900'}`}>
          {selectedLabel || placeholder}
        </span>
        <div className="flex items-center gap-1">
          {value !== 'all' && (
            <span
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                selectOption('all');
              }}
              className={`p-0.5 rounded transition-colors ${isDark ? 'text-slate-500 hover:text-white' : 'text-slate-400 hover:text-slate-700'}`}
            >
              <X className="w-3 h-3" />
            </span>
          )}
          <ChevronDown className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''} ${isDark ? 'text-slate-400' : 'text-slate-500'}`} />
        </div>
      </button>

      {/* ── Dropdown ── */}
      {open && (
        <div
          className={`absolute left-0 top-full mt-0.5 w-full min-w-[200px] rounded-lg border shadow-2xl z-[200] overflow-hidden backdrop-blur-md ${
            isDark ? 'bg-slate-800/95 border-slate-700/50' : 'bg-white/95 border-slate-200'
          }`}
        >
          {/* Search Input */}
          <div className="relative border-b border-slate-700/30">
            <Search className={`absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 ${isDark ? 'text-slate-400' : 'text-slate-500'}`} />
            <input
              ref={inputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={placeholder}
              className={`w-full pl-8 pr-2.5 py-1.5 text-xs border-0 focus:outline-none focus:ring-0 ${
                isDark ? 'bg-slate-800/50 text-white placeholder:text-slate-500' : 'bg-white text-slate-900 placeholder:text-slate-400'
              }`}
            />
            {search.length > 0 && (
              <button
                onClick={() => setSearch('')}
                className={`absolute right-1.5 top-1/2 -translate-y-1/2 p-0.5 rounded ${isDark ? 'text-slate-500 hover:text-white' : 'text-slate-400 hover:text-slate-700'}`}
              >
                <X className="w-2.5 h-2.5" />
              </button>
            )}
          </div>

          {/* Options List */}
          <div className="max-h-40 overflow-y-auto">
            {showAll && (
              <button
                onClick={() => selectOption('all')}
                className={`w-full text-left px-2.5 py-1.5 text-xs font-medium transition-colors ${
                  value === 'all'
                    ? 'bg-orange-500/20 text-orange-400'
                    : isDark
                      ? 'text-slate-300 hover:bg-slate-700/50'
                      : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                {allLabel}
              </button>
            )}
            {filtered.map((opt) => (
              <button
                key={opt.value}
                onClick={() => selectOption(opt.value)}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 text-xs font-medium transition-colors ${
                  opt.value === value
                    ? 'bg-orange-500/20 text-orange-400'
                    : isDark
                      ? 'text-slate-300 hover:bg-slate-700/50'
                      : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <span>{opt.label}</span>
                {opt.count !== undefined && (
                  <span className={`text-[9px] font-mono ${
                    opt.value === value ? 'text-orange-400/70' : isDark ? 'text-slate-500' : 'text-slate-400'
                  }`}>
                    {opt.count}
                  </span>
                )}
              </button>
            ))}
            {filtered.length === 0 && (
              <div className={`px-2.5 py-1.5 text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                {emptyMessage}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};