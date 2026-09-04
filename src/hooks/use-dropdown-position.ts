import { useState, useRef, useEffect, useCallback } from 'react';

export interface DropdownPositionResult {
  direction: 'down' | 'up';
  style: React.CSSProperties;
}

const DEFAULT_ESTIMATED_HEIGHT = 240; // px – max-h-60 in Tailwind
const DROPDOWN_MARGIN = 8;            // px gap between trigger and dropdown

/**
 * Enhanced hook that detects available viewport space and returns
 * positioning styles for a dropdown/combobox.
 *
 * Features:
 * - Measures the actual rendered dropdown height (via dropdownRef)
 *   after opening, for precise flipping decisions.
 * - Falls back to `estimatedHeight` if the dropdown element is not
 *   yet measured.
 * - Recalculates on scroll (capture phase) and resize while open.
 * - Returns 'up' or 'down' direction + absolute positioning style.
 */
export function useDropdownPosition<T extends HTMLElement, D extends HTMLElement = HTMLDivElement>(
  estimatedHeight: number = DEFAULT_ESTIMATED_HEIGHT,
) {
  const triggerRef = useRef<T | null>(null);
  const dropdownRef = useRef<D | null>(null);

  const [position, setPosition] = useState<DropdownPositionResult>({
    direction: 'down',
    style: {
      position: 'absolute',
      top: '100%',
      left: 0,
      width: '100%',
      marginTop: DROPDOWN_MARGIN,
      zIndex: 50,
    },
  });

  /** Core calculation – measures trigger & dropdown, picks direction. */
  const recalc = useCallback(() => {
    const triggerEl = triggerRef.current;
    if (!triggerEl) return;

    const triggerRect = triggerEl.getBoundingClientRect();
    const viewportHeight = window.innerHeight;

    // Try to get the actual rendered height of the dropdown element.
    // If it hasn't been measured yet, fall back to estimatedHeight.
    let dropdownHeight = estimatedHeight;
    const dropdownEl = dropdownRef.current;
    if (dropdownEl) {
      const dropdownRect = dropdownEl.getBoundingClientRect();
      if (dropdownRect.height > 0) {
        dropdownHeight = dropdownRect.height;
      }
    }

    const spaceBelow = viewportHeight - triggerRect.bottom;
    const spaceAbove = triggerRect.top;
    const fitsBelow = spaceBelow >= dropdownHeight + DROPDOWN_MARGIN;

    if (fitsBelow) {
      setPosition({
        direction: 'down',
        style: {
          position: 'absolute',
          top: '100%',
          left: 0,
          width: '100%',
          marginTop: DROPDOWN_MARGIN,
          zIndex: 50,
        },
      });
    } else {
      setPosition({
        direction: 'up',
        style: {
          position: 'absolute',
          bottom: '100%',
          left: 0,
          width: '100%',
          marginBottom: DROPDOWN_MARGIN,
          zIndex: 50,
        },
      });
    }
  }, [estimatedHeight]);

  // ── Open / close controller ──
  const [open, setOpen] = useState(false);

  const toggle = useCallback(
    (val: boolean) => {
      setOpen(val);
      if (val) {
        // Use two RAFs to ensure the DOM has painted the dropdown
        // so we can measure it on the second frame.
        requestAnimationFrame(() => {
          requestAnimationFrame(() => recalc());
        });
      }
    },
    [recalc],
  );

  // Recalculate whenever the dropdown dimensions might change
  useEffect(() => {
    if (!open) return;

    // Use capture phase for scroll so we catch all scroll events
    window.addEventListener('scroll', recalc, { capture: true, passive: true });
    window.addEventListener('resize', recalc, { passive: true });

    return () => {
      window.removeEventListener('scroll', recalc, { capture: true } as EventListenerOptions);
      window.removeEventListener('resize', recalc);
    };
  }, [open, recalc]);

  // Re-measure when the dropdown element itself changes size
  useEffect(() => {
    if (!open || !dropdownRef.current) return;

    const el = dropdownRef.current;
    const observer = new ResizeObserver(() => recalc());
    observer.observe(el);

    return () => observer.disconnect();
  }, [open, recalc]);

  return {
    triggerRef,
    dropdownRef,
    position,
    open,
    setOpen: toggle,
    recalc,
  };
}