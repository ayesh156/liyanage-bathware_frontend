import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { useDropdownPosition } from '../hooks/use-dropdown-position';
import { Check, ChevronsUpDown, X, Search } from 'lucide-react';

// ── Types ──
export interface ComboboxOption {
  value: string;
  label: string;
  /** Optional secondary label (e.g. phone, email) displayed below the main label */
  subtitle?: string;
  /** Optional left icon / indicator */
  icon?: React.ReactNode;
}

interface SmartComboboxProps {
  /** Currently selected value (matches option.value) */
  value: string;
  /** Called when user selects an option */
  onSelect: (option: ComboboxOption) => void;
  /** Full list of options to filter from */
  options: ComboboxOption[];
  /** Placeholder text shown when nothing is selected */
  placeholder?: string;
  /** Label displayed above the combobox */
  label?: string;
  /** Whether the component is in a dark theme context */
  isDark: boolean;
  /** Optional CSS class applied to the outer wrapper */
  className?: string;
  /** Optional – overrides the default empty-state message */
  emptyMessage?: string;
  /** Max height of the dropdown list (Tailwind class e.g. 'max-h-48') */
  dropdownMaxHeight?: string;
  /** Whether to show a search icon on the left of the input */
  showSearchIcon?: boolean;
  /** Ref forwarded to the input element for external focus control */
  inputRef?: React.RefObject<HTMLInputElement | null>;
  /** Called when the dropdown opens or closes */
  onOpenChange?: (open: boolean) => void;
  /** Optional – renders the selected value differently inside the trigger */
  renderTrigger?: (selectedOption: ComboboxOption | undefined) => React.ReactNode;
}

// ── Component ──
export const SmartCombobox: React.FC<SmartComboboxProps> = ({
  value,
  onSelect,
  options,
  placeholder = 'Search...',
  label,
  isDark,
  className = '',
  emptyMessage = 'No matches found',
  dropdownMaxHeight = 'max-h-60',
  showSearchIcon = false,
  inputRef: externalInputRef,
  onOpenChange,
  renderTrigger,
}) => {
  // ── Refs ──
  const containerRef = useRef<HTMLDivElement>(null);
  const internalInputRef = useRef<HTMLInputElement>(null);
  const activeInputRef = externalInputRef ?? internalInputRef;
  const listRef = useRef<HTMLDivElement>(null);

  // ── Position hook ──
  const {
    triggerRef,
    dropdownRef,
    position,
    open,
    setOpen,
  } = useDropdownPosition<HTMLDivElement, HTMLDivElement>(240);

  // ── Local state ──
  const [search, setSearch] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  // Find the currently selected option object
  const selectedOption = useMemo(
    () => options.find((o) => o.value === value),
    [options, value],
  );

  // Filtered options based on search text
  const filteredOptions = useMemo(() => {
    if (!search.trim()) return options;
    const q = search.toLowerCase().trim();
    return options.filter(
      (o) =>
        o.label.toLowerCase().includes(q) ||
        (o.subtitle && o.subtitle.toLowerCase().includes(q)),
    );
  }, [options, search]);

  // Reset highlighted index when filtered results change
  useEffect(() => {
    setHighlightedIndex(-1);
  }, [filteredOptions.length]);

  // Notify parent of open/close state changes
  useEffect(() => {
    onOpenChange?.(open);
  }, [open, onOpenChange]);

  // ── Click Outside handler (Requirement 2) ──
  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (e: MouseEvent) => {
      // If the click is inside either the trigger wrapper or the dropdown panel, ignore.
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
        setSearch('');
      }
    };

    // Use mousedown for earlier detection (prevents race conditions with blur)
    // Use a small delay to allow the click event that opened us to pass through
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 0);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [open, setOpen]);

  // ── Close on Escape ──
  useEffect(() => {
    if (!open) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        setOpen(false);
        setSearch('');
        activeInputRef.current?.focus();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [open, setOpen, activeInputRef]);

  // ── Open / toggle ──
  const handleToggle = useCallback(() => {
    setOpen(!open);
    if (!open) {
      // Focus input when opening
      setTimeout(() => activeInputRef.current?.focus(), 50);
    } else {
      setSearch('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // ── Select an option ──
  const handleSelect = useCallback(
    (option: ComboboxOption) => {
      onSelect(option);
      setSearch('');
      setOpen(false);
      activeInputRef.current?.focus();
    },
    [onSelect, activeInputRef],
  );

  // ── Keyboard navigation ──
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!open) {
        // If closed, open on any character or Enter
        if (
          e.key === 'Enter' ||
          e.key === 'ArrowDown' ||
          e.key === 'ArrowUp'
        ) {
          e.preventDefault();
          setOpen(true);
        }
        return;
      }

      switch (e.key) {
        case 'ArrowDown': {
          e.preventDefault();
          setHighlightedIndex((prev) =>
            prev < filteredOptions.length - 1 ? prev + 1 : 0,
          );
          break;
        }
        case 'ArrowUp': {
          e.preventDefault();
          setHighlightedIndex((prev) =>
            prev > 0 ? prev - 1 : filteredOptions.length - 1,
          );
          break;
        }
        case 'Enter': {
          e.preventDefault();
          if (
            highlightedIndex >= 0 &&
            highlightedIndex < filteredOptions.length
          ) {
            handleSelect(filteredOptions[highlightedIndex]);
          }
          break;
        }
        case 'Escape': {
          // Already handled globally, but prevent default anyway
          e.preventDefault();
          setOpen(false);
          setSearch('');
          break;
        }
      }
    },
    [open, filteredOptions, highlightedIndex, handleSelect],
  );

  // Scroll highlighted item into view
  useEffect(() => {
    if (!open || highlightedIndex < 0 || !listRef.current) return;
    const items = listRef.current.querySelectorAll<HTMLButtonElement>(
      '[data-combobox-option]',
    );
    const target = items[highlightedIndex];
    if (target) {
      target.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [highlightedIndex, open]);

  // ── Sync triggerRef with the container for positioning ──
  const setTriggerRef = useCallback(
    (el: HTMLDivElement | null) => {
      (triggerRef as React.MutableRefObject<HTMLDivElement | null>).current = el;
    },
    [triggerRef],
  );

  // ── Render ──
  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* ── Label ── */}
      {label && (
        <label
          className={`block text-[10px] font-semibold mb-1.5 uppercase tracking-wider ${
            isDark ? 'text-slate-400' : 'text-slate-500'
          }`}
        >
          {label}
        </label>
      )}

      {/* ── Trigger / Input wrapper (anchor for dropdown positioning) ── */}
      <div
        ref={setTriggerRef}
        className={`relative flex items-center border-2 rounded-lg transition-all cursor-pointer ${
          open
            ? isDark
              ? 'border-orange-500 bg-slate-700/80 ring-1 ring-orange-500/20'
              : 'border-orange-500 bg-white ring-1 ring-orange-200'
            : isDark
              ? 'border-slate-600 bg-slate-700/50 hover:border-slate-500'
              : 'border-slate-200 bg-slate-50 hover:border-slate-300'
        }`}
        onClick={handleToggle}
      >
        {/* Search icon (optional) */}
        {showSearchIcon && (
          <Search
            className={`ml-3 w-4 h-4 flex-shrink-0 ${
              open
                ? 'text-orange-500'
                : isDark
                  ? 'text-slate-400'
                  : 'text-slate-400'
            }`}
          />
        )}

        {/* Custom trigger or default selected-value display */}
        {renderTrigger ? (
          <div className="flex-1 px-3 py-2 text-sm">
            {renderTrigger(selectedOption)}
          </div>
        ) : (
          <span
            className={`flex-1 px-3 py-2 text-sm truncate ${
              selectedOption
                ? isDark
                  ? 'text-white'
                  : 'text-slate-900'
                : isDark
                  ? 'text-slate-500'
                  : 'text-slate-400'
            }`}
          >
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        )}

        {/* Chevron + clear button */}
        <div className="flex items-center gap-0.5 pr-2">
          {selectedOption && !open && (
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              onClick={(e) => {
                e.stopPropagation();
                handleSelect({ value: '', label: '' });
              }}
              className={`p-0.5 rounded transition-colors ${
                isDark
                  ? 'text-slate-500 hover:text-slate-300 hover:bg-slate-600'
                  : 'text-slate-400 hover:text-slate-600 hover:bg-slate-200'
              }`}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <ChevronsUpDown
            className={`w-4 h-4 transition-colors ${
              open
                ? 'text-orange-500'
                : isDark
                  ? 'text-slate-500'
                  : 'text-slate-400'
            }`}
          />
        </div>
      </div>

      {/* ── Hidden input for search when dropdown is open ── */}
      {open && (
        <input
          ref={activeInputRef}
          type="text"
          autoComplete="off"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setHighlightedIndex(-1);
          }}
          onKeyDown={handleKeyDown}
          placeholder="Type to filter..."
          className="sr-only"
          aria-hidden="true"
        />
      )}

      {/* ── Dropdown panel ── */}
      {open && (
        <div
          ref={dropdownRef as React.RefObject<HTMLDivElement>}
          style={position.style}
          className={`w-full rounded-lg border shadow-2xl overflow-hidden backdrop-blur-md animate-fade-in ${
            position.direction === 'up' ? 'mb-1' : 'mt-1'
          } ${
            isDark
              ? 'bg-slate-800/95 border-slate-700/50'
              : 'bg-white/95 border-slate-200'
          }`}
        >
          {/* Inline search input inside dropdown */}
          <div className={`p-1.5 border-b ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
            <div className="relative">
              <Search
                className={`absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 ${
                  isDark ? 'text-slate-500' : 'text-slate-400'
                }`}
              />
              <input
                type="text"
                autoComplete="off"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setHighlightedIndex(-1);
                }}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                autoFocus
                className={`w-full pl-8 pr-2 py-1.5 text-xs border rounded-md focus:outline-none focus:ring-1 ${
                  isDark
                    ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-500 focus:ring-orange-500/50 focus:border-orange-500'
                    : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400 focus:ring-orange-500/50 focus:border-orange-500'
                }`}
              />
            </div>
          </div>

          {/* Options list */}
          <div
            ref={listRef}
            className={`overflow-y-auto ${dropdownMaxHeight} no-scrollbar`}
          >
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option, index) => {
                const isSelected = option.value === value;
                const isHighlighted = index === highlightedIndex;

                return (
                  <button
                    key={option.value}
                    data-combobox-option
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    onClick={() => handleSelect(option)}
                    onMouseEnter={() => setHighlightedIndex(index)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 text-left text-xs transition-colors ${
                      isSelected
                        ? isDark
                          ? 'bg-orange-500/20 text-orange-400'
                          : 'bg-orange-50 text-orange-700'
                        : isHighlighted
                          ? isDark
                            ? 'bg-slate-700/80 text-white'
                            : 'bg-slate-100 text-slate-900'
                          : isDark
                            ? 'text-slate-300 hover:bg-slate-700/50'
                            : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {/* Icon */}
                    {option.icon && (
                      <span className="flex-shrink-0 w-5 h-5 flex items-center justify-center">
                        {option.icon}
                      </span>
                    )}

                    {/* Label & subtitle */}
                    <div className="flex-1 min-w-0">
                      <span
                        className={`font-medium truncate block ${
                          isSelected
                            ? isDark
                              ? 'text-orange-400'
                              : 'text-orange-700'
                            : isHighlighted
                              ? isDark
                                ? 'text-white'
                                : 'text-slate-900'
                              : ''
                        }`}
                      >
                        {option.label}
                      </span>
                      {option.subtitle && (
                        <span
                          className={`text-[10px] truncate block ${
                            isSelected
                              ? isDark
                                ? 'text-orange-400/70'
                                : 'text-orange-600/70'
                              : isDark
                                ? 'text-slate-500'
                                : 'text-slate-400'
                          }`}
                        >
                          {option.subtitle}
                        </span>
                      )}
                    </div>

                    {/* Checkmark for selected */}
                    {isSelected && (
                      <Check
                        className={`w-4 h-4 flex-shrink-0 ${
                          isDark ? 'text-orange-500' : 'text-orange-600'
                        }`}
                      />
                    )}
                  </button>
                );
              })
            ) : (
              <div
                className={`px-3 py-4 text-center text-xs ${
                  isDark ? 'text-slate-500' : 'text-slate-400'
                }`}
              >
                <Search className="w-5 h-5 mx-auto mb-1 opacity-40" />
                {emptyMessage}
              </div>
            )}
          </div>

          {/* Footer – count indicator */}
          {filteredOptions.length > 0 && (
            <div
              className={`px-3 py-1 text-[10px] font-medium border-t ${
                isDark
                  ? 'border-slate-700 text-slate-500'
                  : 'border-slate-200 text-slate-400'
              }`}
            >
              {filteredOptions.length} of {options.length}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SmartCombobox;