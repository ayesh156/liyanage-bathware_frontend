import * as React from "react";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from 'react-i18next';

// ============================================================================
// DataTable Types
// ============================================================================

export interface DataTableColumn<T> {
  id: string;
  header: React.ReactNode;
  cell: (row: T, index: number) => React.ReactNode;
  className?: string;
  headerClassName?: string;
}

export interface DataTableProps<T> {
  data: T[];
  columns: DataTableColumn<T>[];
  pageSize?: number;
  currentPage?: number;
  onPageChange?: (page: number) => void;
  totalItems?: number;
  title?: string;
  icon?: React.ReactNode;
  emptyState?: {
    icon?: React.ReactNode;
    title?: string;
    description?: string;
  };
  theme?: 'light' | 'dark';
  className?: string;
  showHeader?: boolean;
  stickyHeader?: boolean;
  striped?: boolean;
  hoverable?: boolean;
  bordered?: boolean;
  compact?: boolean;
  loading?: boolean;
  getRowKey?: (row: T, index: number) => string | number;
  onRowClick?: (row: T, index: number) => void;
  rowClassName?: (row: T, index: number) => string;
}

// ============================================================================
// Pagination Component
// ============================================================================

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems: number;
  pageSize: number;
  theme?: 'light' | 'dark';
  className?: string;
  showPageNumbers?: boolean;
  maxVisiblePages?: number;
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  pageSize,
  theme = 'light',
  className,
  showPageNumbers = true,
  maxVisiblePages = 5,
}: PaginationProps) {
  const { t } = useTranslation();
  const startItem = totalItems > 0 ? (currentPage - 1) * pageSize + 1 : 0;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  // Calculate visible page numbers
  const getVisiblePages = (): (number | 'ellipsis')[] => {
    if (totalPages <= maxVisiblePages) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const pages: (number | 'ellipsis')[] = [];
    const halfVisible = Math.floor(maxVisiblePages / 2);
    
    let startPage = Math.max(currentPage - halfVisible, 1);
    let endPage = Math.min(startPage + maxVisiblePages - 1, totalPages);
    
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(endPage - maxVisiblePages + 1, 1);
    }

    // Always show first page
    if (startPage > 1) {
      pages.push(1);
      if (startPage > 2) pages.push('ellipsis');
    }

    // Middle pages
    for (let i = startPage; i <= endPage; i++) {
      if (i !== 1 && i !== totalPages) {
        pages.push(i);
      }
    }

    // Always show last page
    if (endPage < totalPages) {
      if (endPage < totalPages - 1) pages.push('ellipsis');
      pages.push(totalPages);
    }

    return pages;
  };

  if (totalPages <= 1) return null;

  return (
    <div className={cn(
      "px-4 py-4 border-t flex flex-col sm:flex-row items-center justify-between gap-3 rounded-b-2xl",
      theme === 'dark' ? 'border-slate-700/50 bg-slate-900/50' : 'border-slate-200 bg-slate-50',
      className
    )}>
      {/* Items info */}
      <div className={cn(
        "text-sm",
        theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
      )}>
        {t('pagination.showing')} <span className={cn("font-semibold", theme === 'dark' ? 'text-orange-400' : 'text-orange-600')}>{startItem}</span> {t('pagination.to')}{' '}
        <span className={cn("font-semibold", theme === 'dark' ? 'text-orange-400' : 'text-orange-600')}>{endItem}</span> {t('pagination.of')}{' '}
        <span className={cn("font-semibold", theme === 'dark' ? 'text-white' : 'text-slate-900')}>{totalItems}</span> {t('pagination.results')}
      </div>

      {/* Pagination controls */}
      <div className="flex items-center gap-1">
        {/* First page */}
        <button
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          className={cn(
            "p-2 rounded-lg transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed",
            theme === 'dark'
              ? 'hover:bg-slate-700/80 text-slate-400 hover:text-orange-400 disabled:hover:bg-transparent disabled:hover:text-slate-500'
              : 'hover:bg-slate-200 text-slate-500 hover:text-orange-600 disabled:hover:bg-transparent disabled:hover:text-slate-400'
          )}
          title={t('pagination.firstPage')}
          aria-label={t('pagination.firstPage')}
        >
          <ChevronsLeft className="w-4 h-4" />
        </button>

        {/* Previous page */}
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className={cn(
            "p-2 rounded-lg transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed",
            theme === 'dark'
              ? 'hover:bg-slate-700/80 text-slate-400 hover:text-orange-400 disabled:hover:bg-transparent disabled:hover:text-slate-500'
              : 'hover:bg-slate-200 text-slate-500 hover:text-orange-600 disabled:hover:bg-transparent disabled:hover:text-slate-400'
          )}
          title={t('pagination.previousPage')}
          aria-label={t('pagination.previousPage')}
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* Page numbers */}
        {showPageNumbers && (
          <div className="flex items-center gap-1.5 mx-2">
            {getVisiblePages().map((page, index) => (
              page === 'ellipsis' ? (
                <span
                  key={`ellipsis-${index}`}
                  className={cn(
                    "px-2 py-1 text-sm",
                    theme === 'dark' ? 'text-slate-600' : 'text-slate-400'
                  )}
                >
                  •••
                </span>
              ) : (
                <button
                  key={page}
                  onClick={() => onPageChange(page)}
                  className={cn(
                    "min-w-[38px] h-9 px-3 rounded-xl font-semibold text-sm transition-all duration-200",
                    currentPage === page
                      ? 'bg-gradient-to-r from-orange-500 to-rose-500 text-white shadow-lg shadow-orange-500/30'
                      : theme === 'dark'
                      ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/50'
                      : 'bg-white hover:bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200'
                  )}
                  aria-label={`Go to page ${page}`}
                  aria-current={currentPage === page ? 'page' : undefined}
                >
                  {page}
                </button>
              )
            ))}
          </div>
        )}

        {/* Next page */}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className={cn(
            "p-2 rounded-lg transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed",
            theme === 'dark'
              ? 'hover:bg-slate-700/80 text-slate-400 hover:text-orange-400 disabled:hover:bg-transparent disabled:hover:text-slate-500'
              : 'hover:bg-slate-200 text-slate-500 hover:text-orange-600 disabled:hover:bg-transparent disabled:hover:text-slate-400'
          )}
          title={t('pagination.nextPage')}
          aria-label={t('pagination.nextPage')}
        >
          <ChevronRight className="w-4 h-4" />
        </button>

        {/* Last page */}
        <button
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
          className={cn(
            "p-2 rounded-lg transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed",
            theme === 'dark'
              ? 'hover:bg-slate-700/80 text-slate-400 hover:text-orange-400 disabled:hover:bg-transparent disabled:hover:text-slate-500'
              : 'hover:bg-slate-200 text-slate-500 hover:text-orange-600 disabled:hover:bg-transparent disabled:hover:text-slate-400'
          )}
          title={t('pagination.lastPage')}
          aria-label={t('pagination.lastPage')}
        >
          <ChevronsRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// DataTable Component
// ============================================================================

export function DataTable<T>({
  data,
  columns,
  pageSize = 10,
  currentPage = 1,
  onPageChange,
  totalItems,
  title,
  icon,
  emptyState,
  theme = 'light',
  className,
  showHeader = true,
  stickyHeader = false,
  striped = true,
  hoverable = true,
  bordered = true,
  compact = false,
  loading = false,
  getRowKey,
  onRowClick,
  rowClassName,
}: DataTableProps<T>) {
  // If no external pagination control, manage internally
  const [internalPage, setInternalPage] = React.useState(1);
  const activePage = onPageChange ? currentPage : internalPage;
  const handlePageChange = onPageChange || setInternalPage;

  // Calculate pagination
  const total = totalItems ?? data.length;
  const totalPages = Math.ceil(total / pageSize);
  
  // Get paginated data (only if not externally controlled)
  const paginatedData = React.useMemo(() => {
    if (totalItems !== undefined) {
      // External pagination - data is already paginated
      return data;
    }
    // Internal pagination
    const startIndex = (activePage - 1) * pageSize;
    return data.slice(startIndex, startIndex + pageSize);
  }, [data, activePage, pageSize, totalItems]);

  // Reset page when data changes (internal pagination only)
  React.useEffect(() => {
    if (!onPageChange && activePage > 1 && paginatedData.length === 0 && data.length > 0) {
      setInternalPage(1);
    }
  }, [data.length, activePage, paginatedData.length, onPageChange]);

  const startItem = total > 0 ? (activePage - 1) * pageSize + 1 : 0;
  const endItem = Math.min(activePage * pageSize, total);

  return (
    <div className={cn(
      "rounded-2xl border overflow-hidden",
      theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200',
      className
    )}>
      {/* Table Header */}
      {showHeader && (title || icon) && (
        <div className={cn(
          "px-4 py-3 border-b flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2",
          theme === 'dark' ? 'border-slate-700 bg-slate-800/50' : 'border-slate-200 bg-slate-50'
        )}>
          <div className="flex items-center gap-2">
            {icon || <FileText className={cn("w-5 h-5", theme === 'dark' ? 'text-slate-400' : 'text-slate-500')} />}
            {title && (
              <span className={cn("font-semibold", theme === 'dark' ? 'text-white' : 'text-slate-900')}>
                {title}
              </span>
            )}
            <span className={cn(
              "text-sm px-2 py-0.5 rounded-full",
              theme === 'dark' ? 'bg-slate-700 text-slate-300' : 'bg-slate-200 text-slate-600'
            )}>
              {total} records
            </span>
          </div>
          <div className={cn("text-sm", theme === 'dark' ? 'text-slate-400' : 'text-slate-500')}>
            Showing {startItem} - {endItem} of {total}
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className={cn(
          "flex items-center justify-center py-12",
          theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
        )}>
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-current border-t-transparent rounded-full animate-spin" />
            <p className="text-sm">Loading data...</p>
          </div>
        </div>
      )}

      {/* Table */}
      {!loading && (
        <div className="overflow-x-auto">
          <table className="w-full min-w-max">
            <thead className={cn(
              stickyHeader && "sticky top-0 z-10",
              theme === 'dark' ? 'bg-slate-900/50' : 'bg-slate-50'
            )}>
              <tr className={cn(
                "border-b",
                theme === 'dark' ? 'border-slate-700' : 'border-slate-200'
              )}>
                {columns.map((column) => (
                  <th
                    key={column.id}
                    className={cn(
                      "text-left font-semibold text-sm tracking-wide whitespace-nowrap",
                      compact ? 'py-2 px-3' : 'py-3 px-4',
                      theme === 'dark' ? 'text-slate-300' : 'text-slate-700',
                      column.headerClassName
                    )}
                  >
                    {column.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginatedData.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length}
                    className={cn(
                      "py-12 text-center",
                      theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
                    )}
                  >
                    <div className="flex flex-col items-center gap-2">
                      {emptyState?.icon || <FileText className="w-12 h-12 opacity-30" />}
                      <p className="font-medium">{emptyState?.title || 'No data found'}</p>
                      {emptyState?.description && (
                        <p className="text-sm">{emptyState.description}</p>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedData.map((row, index) => {
                  const key = getRowKey ? getRowKey(row, index) : index;
                  const globalIndex = (activePage - 1) * pageSize + index;
                  return (
                    <tr
                      key={key}
                      onClick={onRowClick ? () => onRowClick(row, globalIndex) : undefined}
                      className={cn(
                        "border-b transition-colors",
                        theme === 'dark' 
                          ? 'border-slate-700/50' 
                          : 'border-slate-100',
                        striped && index % 2 !== 0 && (
                          theme === 'dark' ? 'bg-slate-800/30' : 'bg-slate-50/50'
                        ),
                        hoverable && (
                          theme === 'dark' 
                            ? 'hover:bg-slate-700/30' 
                            : 'hover:bg-slate-50'
                        ),
                        onRowClick && 'cursor-pointer',
                        rowClassName?.(row, globalIndex)
                      )}
                    >
                      {columns.map((column) => (
                        <td
                          key={column.id}
                          className={cn(
                            "whitespace-nowrap",
                            compact ? 'py-2 px-3' : 'py-3 px-4',
                            column.className
                          )}
                        >
                          {column.cell(row, globalIndex)}
                        </td>
                      ))}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <Pagination
          currentPage={activePage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
          totalItems={total}
          pageSize={pageSize}
          theme={theme}
        />
      )}
    </div>
  );
}
