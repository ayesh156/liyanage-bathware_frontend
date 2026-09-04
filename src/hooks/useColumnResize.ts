import { useState, useCallback, useEffect, useRef } from 'react';

export interface ColumnResizeConfig {
  /** Unique key for the column */
  key: string;
  /** Initial width as a percentage of total (0-100) */
  defaultWidth: number;
  /** Minimum width in percentage */
  minWidth?: number;
  /** Maximum width in percentage */
  maxWidth?: number;
}

const STORAGE_KEY = 'hardware-quickcheckout-column-widths';

function loadSavedWidths(defaults: ColumnResizeConfig[]): Record<string, number> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const saved = JSON.parse(raw) as Record<string, number>;
    const result: Record<string, number> = {};
    for (const col of defaults) {
      const savedVal = saved[col.key];
      if (typeof savedVal === 'number' && savedVal > 0) {
        result[col.key] = savedVal;
      } else {
        result[col.key] = col.defaultWidth;
      }
    }
    return result;
  } catch {
    return {};
  }
}

function saveWidths(widths: Record<string, number>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(widths));
  } catch {
    // Silently fail if localStorage is unavailable
  }
}

export function useColumnResize(columns: ColumnResizeConfig[]) {
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>(() => {
    return loadSavedWidths(columns);
  });
  const [isResizing, setIsResizing] = useState(false);
  const resizeRef = useRef<{
    columnKey: string;
    startX: number;
    startWidth: number;
  } | null>(null);

  // Build a stable default map from the config
  useEffect(() => {
    setColumnWidths(prev => {
      const updated = { ...prev };
      let changed = false;
      for (const col of columns) {
        if (updated[col.key] === undefined || updated[col.key] <= 0) {
          updated[col.key] = col.defaultWidth;
          changed = true;
        }
      }
      return changed ? updated : prev;
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleMouseDown = useCallback(
    (e: React.MouseEvent, columnKey: string) => {
      e.preventDefault();
      e.stopPropagation();
      const currentWidth = columnWidths[columnKey] ?? columns.find(c => c.key === columnKey)?.defaultWidth ?? 8;
      resizeRef.current = {
        columnKey,
        startX: e.clientX,
        startWidth: currentWidth,
      };
      setIsResizing(true);

      const handleMouseMove = (moveEvent: MouseEvent) => {
        if (!resizeRef.current) return;
        const delta = moveEvent.clientX - resizeRef.current.startX;
        // Convert pixel delta to percentage (container ≈ 100% = 100 units)
        const deltaPct = (delta / 8) * 0.1; // fine-grained control
        const col = columns.find(c => c.key === resizeRef.current!.columnKey);
        const minW = col?.minWidth ?? 3;
        const maxW = col?.maxWidth ?? 50;
        const newWidth = Math.min(maxW, Math.max(minW, resizeRef.current.startWidth + deltaPct));

        setColumnWidths(prev => ({
          ...prev,
          [resizeRef.current!.columnKey]: Math.round(newWidth * 100) / 100,
        }));
      };

      const handleMouseUp = () => {
        if (resizeRef.current) {
          setColumnWidths(prev => {
            saveWidths(prev);
            return prev;
          });
        }
        resizeRef.current = null;
        setIsResizing(false);
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    },
    [columnWidths, columns]
  );

  const getColumnWidth = useCallback(
    (key: string): string => {
      const w = columnWidths[key];
      if (w !== undefined && w > 0) return `${w}%`;
      const col = columns.find(c => c.key === key);
      return col ? `${col.defaultWidth}%` : '8%';
    },
    [columnWidths, columns]
  );

  const getGridTemplateColumns = useCallback(
    (): string => {
      return columns
        .map(col => {
          const w = columnWidths[col.key] ?? col.defaultWidth;
          return `${Math.max(col.minWidth ?? 3, w)}%`;
        })
        .join(' ');
    },
    [columns, columnWidths]
  );

  const getResizeHandlerProps = useCallback(
    (columnKey: string) => ({
      onMouseDown: (e: React.MouseEvent) => handleMouseDown(e, columnKey),
      style: {
        cursor: 'col-resize' as const,
        userSelect: 'none' as const,
      },
    }),
    [handleMouseDown]
  );

  return {
    columnWidths,
    isResizing,
    getColumnWidth,
    getGridTemplateColumns,
    getResizeHandlerProps,
    resetWidths: useCallback(() => {
      const defaults: Record<string, number> = {};
      for (const col of columns) {
        defaults[col.key] = col.defaultWidth;
      }
      setColumnWidths(defaults);
      saveWidths(defaults);
    }, [columns]),
  };
}