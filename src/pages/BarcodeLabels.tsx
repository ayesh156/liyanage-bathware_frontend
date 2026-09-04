/**
 * BarcodeLabels.tsx — Thermal Label Print Engine
 *
 * Architecture:
 *  • Real backend integration via useCatalog() + api.get() with debounced search
 *  • Fail-Safe Isolated Hidden Iframe Print Engine — printing NEVER touches the
 *    main document tree, so it can never collapse the app's own layout and can
 *    never produce a blank page.
 *  • The iframe is written with a fully standalone HTML/CSS document (no
 *    inherited styles, no global `* { display:none }` tricks needed anywhere).
 *  • Barcodes are rendered inside the iframe via JsBarcode directly onto SVG
 *    nodes after the iframe's document has finished loading.
 *  • Page size: 90mm × 16mm continuous roll, 3-column layout (30mm each)
 *  • Break-avoidance on every sticker row via page-break-inside/break-inside
 *  • ZDesigner ZD230 (203dpi, ZPL) continuous-roll label media, 0 margin
 *
 * i18n:
 *  • Full English/Sinhala via react-i18next useTranslation('barcodeLabels')
 *  • ALL visible strings go through t() — no hardcoded English left
 */
import React, {
  useState,
  useMemo,
  useCallback,
  useEffect,
  useRef,
} from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../contexts/ThemeContext';
import { useIsMobile } from '../hooks/use-mobile';
import { useCatalog } from '../contexts/CatalogContext';
import api from '../lib/api';
import { InventoryProduct } from '../types';
import { formatShortProductId, encodeCostToCipher } from '../lib/utils';
import {
  ArrowLeft,
  Printer,
  Tag,
  Plus,
  Minus,
  Trash2,
  ScanLine,
  Layers,
  ShoppingCart,
  Search,
  Grid3X3,
  RotateCcw,
  Check,
  Info,
  RefreshCw,
  AlertCircle,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { toast } from 'react-toastify';
import BarcodeComponent from 'react-barcode';
// jsbarcode has no first-party TypeScript declarations; if your build
// complains ("Cannot find module 'jsbarcode'"), add a `jsbarcode.d.ts`
// next to this file containing: `declare module 'jsbarcode';`
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import JsBarcode from 'jsbarcode';

// ============================================================================
// INTERFACES
// ============================================================================
interface LabelConfig {
  storeId: string;
}

interface StickerEntry {
  /** Unique key: product.id (no variants in InventoryProduct schema) */
  id: string;
  no: string;
  name: string;
  sku: string;
  barcode: string;
  salesPrice: number;
  costPrice: number;
}

interface SelectedItem {
  entry: StickerEntry;
  quantity: number;
}

interface StickerData {
  key: string;
  barcode: string;
  line1: string; // "Rs. [price]#[productNo]"
  line2: string; // store identifier
}

const DEFAULT_CONFIG: LabelConfig = {
  storeId: 'LHD@WBS',
};

// ============================================================================
// HELPERS
// ============================================================================
function toStickerEntry(p: InventoryProduct): StickerEntry | null {
  if (!p.barcode) return null;
  return {
    id: p.id,
    no: p.no || '',
    name: p.name,
    // Use formatShortProductId for new architecture, fall back to legacy regex for old records
    sku: formatShortProductId(p.id) || p.searchKey || p.id,
    barcode: p.barcode,
    salesPrice: p.displayPrice || p.salesPrice || 0,
    costPrice: p.cost || 0,
  };
}

function buildStickerData(
  entry: StickerEntry,
  storeId: string,
  idx: number
): StickerData {
  // Line 1: Display price + Product No (e.g., "Rs.475.00#1002")
  const productNo = entry.no || entry.sku || formatShortProductId(entry.id);
  // Line 2: Secret Cost Cipher encoded from costPrice (e.g., "LHD@WKK")
  const cipherLine = encodeCostToCipher(entry.costPrice);
  return {
    key: `${entry.id}-${idx}`,
    barcode: entry.barcode,
    line1: `Rs.${entry.salesPrice.toFixed(2)}#${productNo}`,
    line2: cipherLine,
  };
}

/** Escapes text before it is interpolated into the iframe's HTML string. */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&')
    .replace(/</g, '<')
    .replace(/>/g, '>')
    .replace(/"/g, '"')
    .replace(/'/g, '&#39;');
}

/**
 * Builds a fully standalone HTML document for the isolated print iframe.
 * ZDesigner ZD230, 203dpi ZPL, 90mm continuous roll, 16mm row height,
 * exactly 3 stickers per row (30mm × 16mm each), 0 margin.
 *
 * Barcode <svg> nodes are written empty (with the code in data-barcode) —
 * the caller fills them in with JsBarcode once this document is loaded
 * into the iframe, since JsBarcode needs real DOM nodes to draw into.
 */
function buildPrintDocument(stickers: StickerData[]): string {
  const rows: StickerData[][] = [];
  for (let i = 0; i < stickers.length; i += 3) {
    rows.push(stickers.slice(i, i + 3));
  }

  // Table-based engine: fixed-width <td> cells guarantee the printer driver
  // lays out exactly 3 columns per row with no reflow/rounding drift on the
  // 3rd column (the failure mode seen with CSS Grid on some ZPL drivers).
  const rowsHtml = rows
    .map((row) => {
      const cells = row
        .map(
          (s) => `
        <td class="sticker-cell">
          <div class="sticker-content-wrapper">
            <div class="sticker-inner-wrapper">
              <svg class="barcode-svg" data-barcode="${escapeHtml(s.barcode)}"></svg>
              <div class="line-1">${escapeHtml(s.line1)}</div>
              <div class="line-2">${escapeHtml(s.line2)}</div>
            </div>
          </div>
        </td>`
        )
        .join('');
      // Pad incomplete trailing rows so every row still has exactly 3 <td>s.
      const padCount = 3 - row.length;
      const pad = '<td class="sticker-cell sticker-cell--empty"></td>'.repeat(
        padCount
      );
      return `<tr class="sticker-row">${cells}${pad}</tr>`;
    })
    .join('');

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<title>Thermal Labels</title>
<style>
  @page {
    size: 90mm 16mm;
    margin: 0mm !important;
  }
  *, *:before, *:after {
    box-sizing: border-box !important;
  }
  html, body {
    width: 90mm !important;
    margin: 0 !important;
    padding: 0 !important;
    background: #ffffff !important;
    font-family: Arial, Helvetica, sans-serif !important;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }

  /* Guaranteed 3-Column Table Layout */
  table.sticker-table {
    width: 90mm !important;
    table-layout: fixed !important;
    border-collapse: collapse !important;
    border: none !important;
    margin: 0 auto !important;
    padding: 0 !important;
  }

  tr.sticker-row {
    height: 16mm !important;
    max-height: 16mm !important;
    page-break-inside: avoid !important;
    break-inside: avoid !important;
  }

td.sticker-cell {
    width: 30mm !important;
    max-width: 30mm !important;
    height: 16mm !important;
    max-height: 16mm !important;
    vertical-align: top !important;
    text-align: center !important;
    padding: 0.5mm 0mm 0mm 0mm !important;
    overflow: hidden !important;
    background: #ffffff !important;
  }

  /* Outer wrapper controls POSITION inside the 30mm cell */
  .sticker-content-wrapper {
    width: 100% !important;
    display: flex !important;
    flex-direction: column !important;
    align-items: center !important;
    justify-content: flex-start !important;
  }

  /* Column 1: Pushes entire sticker unit to TRUE LEFT EDGE */
  tr.sticker-row td.sticker-cell:first-child .sticker-content-wrapper {
    align-items: flex-start !important;
  }
  
  /* Column 3: Pushes entire sticker unit to TRUE RIGHT EDGE */
  tr.sticker-row td.sticker-cell:last-child .sticker-content-wrapper {
    align-items: flex-end !important;
  }

  /* Glued Barcode + Text Unit with Perfect Printable Width */
  .sticker-inner-wrapper {
    width: 27mm !important;
    max-width: 27mm !important;
    flex-shrink: 0 !important;
    display: flex !important;
    flex-direction: column !important;
    align-items: center !important;
    justify-content: flex-start !important;
  }

  /* SVG Barcode - Fully readable & edge-safe */
  .sticker-cell svg {
    width: 100% !important;
    max-width: 26.5mm !important;
    height: 7mm !important;
    max-height: 7mm !important;
    display: block !important;
  }

  /* Line 1: Price and Short ID */
  .line-1 {
    width: 100% !important;
    text-align: center !important;
    font-size: 7.2pt !important;
    font-weight: 800 !important;
    color: #000000 !important;
    line-height: 1.1 !important;
    margin-top: 0.3mm !important;
    white-space: nowrap !important;
    overflow: visible !important;
    letter-spacing: -0.3px !important;
  }

  /* Line 2: Cipher / Store Suffix */
  .line-2 {
    width: 100% !important;
    text-align: center !important;
    font-size: 6.8pt !important;
    font-weight: 700 !important;
    color: #000000 !important;
    line-height: 1 !important;
    margin-top: 0.2mm !important;
    white-space: nowrap !important;
    letter-spacing: 0px !important;
  }
</style>
</head>
<body>
<table class="sticker-table">
  <tbody>
${rowsHtml}
  </tbody>
</table>
</body>
</html>`;
}

// ============================================================================
// SUB-COMPONENT: Single Sticker Cell (on-screen preview only)
// Styled like an actual die-cut thermal label sitting on white stock — a
// folded-corner accent + soft shadow sell the "real sticker" illusion.
// Actual print markup is generated separately as standalone HTML/CSS and
// rendered inside the isolated print iframe — see buildPrintDocument() below.
// ============================================================================
interface StickerCellProps {
  data: StickerData;
}

const StickerCell: React.FC<StickerCellProps> = ({ data }) => (
  <div
    className="group relative flex flex-col items-center justify-center overflow-hidden
      rounded-[3px] border border-slate-200 bg-white px-1.5 py-1.5
      shadow-[0_1px_2px_rgba(15,23,42,0.10)]
      transition-all duration-200 ease-out
      hover:-translate-y-0.5 hover:shadow-[0_6px_14px_rgba(15,23,42,0.16)]"
  >
    {/* folded-corner accent — sells the "die-cut sticker" illusion */}
    <div
      className="pointer-events-none absolute right-0 top-0 h-3 w-3 opacity-70
        transition-opacity duration-200 group-hover:opacity-100"
      style={{
        background: 'linear-gradient(135deg, transparent 50%, #e2e8f0 50%)',
      }}
    />
    <div className="flex w-full justify-center">
      <BarcodeComponent
        value={data.barcode}
        format="CODE128"
        width={1.2}
        height={20}
        displayValue={false}
        margin={0}
        background="#ffffff"
        lineColor="#000000"
      />
    </div>
    <div className="mt-0.5 w-full whitespace-nowrap overflow-visible text-[6.8pt] font-bold leading-none tracking-tight text-slate-900 tabular-nums" style={{ letterSpacing: '-0.2px' }}>
      {data.line1}
    </div>
    <div className="mt-0.5 whitespace-nowrap text-[6.5pt] font-semibold uppercase leading-none tracking-wider text-slate-400">
      {data.line2}
    </div>
  </div>
);

/** A dashed "perforation" divider between printed rows, punctuated with two
 *  small sprocket-hole dots — a nod to real continuous label roll stock. */
const PerforationDivider: React.FC = () => (
  <div className="flex items-center gap-1.5 py-1">
    <span className="h-1 w-1 shrink-0 rounded-full bg-slate-300" />
    <div className="h-0 flex-1 border-t border-dashed border-slate-300" />
    <span className="h-1 w-1 shrink-0 rounded-full bg-slate-300" />
  </div>
);

// ============================================================================
// SUB-COMPONENT: Live On-Screen Preview (screen-only, not printed)
// Styled as a mock ZD230 feeding out a real continuous label roll — printer
// head chrome up top, white paper stock below, perforated between rows, and
// a torn edge at the bottom where the roll would be cut. Purely decorative;
// the actual print output comes from buildPrintDocument(), not this markup.
// ============================================================================
interface PreviewPanelProps {
  stickers: StickerData[];
  isDark: boolean;
  totalLabels: number;
  t: (key: string, options?: Record<string, any>) => string;
}

const PreviewPanel: React.FC<PreviewPanelProps> = ({
  stickers,
  isDark,
  totalLabels,
  t,
}) => {
  const rows: StickerData[][] = [];
  for (let i = 0; i < stickers.length; i += 3) {
    rows.push(stickers.slice(i, i + 3));
  }

  // The torn-edge teeth need a color matching whatever sits behind the card
  // (the card itself is always white "paper", regardless of app theme).
  const tornBg = isDark ? '#0f172a' : '#f8fafc';

  const rowsCount = Math.ceil(totalLabels / 3);

  return (
    <div>
      {/* ── Printer head chrome ── */}
      <div className="relative rounded-t-2xl bg-gradient-to-b from-slate-700 to-slate-900 px-4 pt-3 pb-4 shadow-lg">
        <div className="flex items-center justify-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.85)]" />
          <span className="text-[9px] font-semibold uppercase tracking-[0.15em] text-slate-300">
            {t('rollStatus')}
          </span>
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.85)]" />
        </div>
        <div className="mx-auto mt-2.5 h-2 w-2/3 rounded-full bg-black/50 shadow-[inset_0_1px_3px_rgba(0,0,0,0.6)]" />
      </div>

      {/* ── Paper stock hanging out of the printer ── */}
      <div className="relative -mt-px mx-2 overflow-hidden rounded-b-[2px] bg-white shadow-xl">
        <div className="px-2.5 py-2.5">
          {stickers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-9 text-center">
              <ScanLine className="mb-2 h-7 w-7 text-slate-200" />
              <p className="text-[10px] font-medium text-slate-400">
                {t('rollEmpty')}
              </p>
              <p className="mt-0.5 text-[10px] text-slate-300">
                {t('rollEmptySub')}
              </p>
            </div>
          ) : (
            <div>
              {rows.map((row, ri) => (
                <React.Fragment key={`pvrow-${ri}`}>
                  {ri > 0 && <PerforationDivider />}
                  <div className="flex flex-row gap-1">
                    {row.map((s) => (
                      <div key={s.key} className="min-w-0 flex-1">
                        <StickerCell data={s} />
                      </div>
                    ))}
                    {row.length < 2 && <div className="min-w-0 flex-1" />}
                    {row.length < 3 && <div className="min-w-0 flex-1" />}
                  </div>
                </React.Fragment>
              ))}
            </div>
          )}
        </div>

        {/* Torn-off roll edge */}
        <div
          className="h-2.5 w-full"
          style={{
            backgroundImage: `linear-gradient(135deg, ${tornBg} 25%, transparent 25.5%), linear-gradient(225deg, ${tornBg} 25%, transparent 25.5%)`,
            backgroundSize: '10px 10px',
            backgroundPosition: 'top',
            backgroundRepeat: 'repeat-x',
          }}
        />
      </div>

      {/* ── Roll meta footer ── */}
      <div
        className={`flex items-center justify-between px-1 pt-2.5 text-[10px] font-medium ${
          isDark ? 'text-slate-400' : 'text-slate-500'
        }`}
      >
        <span className="flex items-center gap-1.5">
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              totalLabels > 0 ? 'bg-emerald-400' : 'bg-slate-500'
            }`}
          />
          {t('rollFooter')}
        </span>
        {totalLabels > 0 && (
          <span className={isDark ? 'text-slate-300' : 'text-slate-600'}>
            {t('rollFooterCount', {
              count: totalLabels,
              rows: rowsCount,
            })}
          </span>
        )}
      </div>
    </div>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================
export const BarcodeLabels: React.FC = () => {
  const { t: translate } = useTranslation();
  const t = translate;
  const barcodeT = (key: string, options?: Record<string, any>): string =>
    (t(`barcodeLabels.${key}`, options) as string) || '';

  const { theme } = useTheme();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const isDark = theme === 'dark';

  // ── Real backend data via CatalogContext (same source as Products page) ──
  const {
    inventoryItems,
    isInventoryLoading,
    inventoryError,
    refreshInventory,
  } = useCatalog();

  // ── Local search state (debounced against in-memory inventoryItems) ──
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Multi-field search scope checkboxes ──
  const [searchScope, setSearchScope] = useState({
    searchKey: true,
    productName: true,
    barcode: true,
    productNo: true,
  });

  // Additional API search results for paginated deep-search
  const [apiSearchResults, setApiSearchResults] = useState<InventoryProduct[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // ── Print queue state ──
  const [selectedItems, setSelectedItems] = useState<Map<string, SelectedItem>>(
    new Map()
  );
  const [labelConfig, setLabelConfig] = useState<LabelConfig>(DEFAULT_CONFIG);
  const [globalQuantity, setGlobalQuantity] = useState(1);
  const [isPrinting, setIsPrinting] = useState(false);

  // ── Roll Preview zoom (SCREEN-ONLY — never touches buildPrintDocument) ──
  // Recalibrated: 100% now renders at the physical size that was previously 200%.
  // Actual CSS zoom = (previewZoom / 100) * 2.0 — so 100% → 2x base, 50% → 1x, 200% → 4x.
  const [previewZoom, setPreviewZoom] = useState(100);
  const zoomIn = useCallback(
    () => setPreviewZoom((z) => Math.min(200, z + 10)),
    []
  );
  const zoomOut = useCallback(
    () => setPreviewZoom((z) => Math.max(50, z - 10)),
    []
  );
  const zoomReset = useCallback(() => setPreviewZoom(100), []);

  // ── Match Roll Preview panel height to the left sidebar, scroll inside ──
  // instead of pushing the page taller and taller as more labels are queued.
  const leftColumnRef = useRef<HTMLDivElement>(null);
  const [previewMatchHeight, setPreviewMatchHeight] = useState<number | null>(
    null
  );
  useEffect(() => {
    const el = leftColumnRef.current;
    if (!el || isMobile) {
      setPreviewMatchHeight(null);
      return;
    }
    const update = () => setPreviewMatchHeight(el.offsetHeight);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    window.addEventListener('resize', update);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', update);
    };
  }, [isMobile]);

  // ── Debounce search input ──
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 280);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchQuery]);

  // ── Deep API search when local results are slim and query is non-empty ──
  useEffect(() => {
    if (!debouncedQuery.trim() || debouncedQuery.trim().length < 2) {
      setApiSearchResults([]);
      return;
    }
    let cancelled = false;
    setIsSearching(true);
    api
      .get<InventoryProduct[]>('/products', {
        search: debouncedQuery.trim(),
        perPage: 40,
      })
      .then((data) => {
        if (cancelled) return;
        const arr = Array.isArray(data)
          ? data
          : (data as any)?.data ?? [];
        setApiSearchResults(arr as InventoryProduct[]);
      })
      .catch(() => {
        // Silent fail — local results are still shown
      })
      .finally(() => {
        if (!cancelled) setIsSearching(false);
      });
    return () => {
      cancelled = true;
    };
  }, [debouncedQuery]);

  // ── Build candidate list from local inventory (always available) ──
  const localEntries = useMemo((): StickerEntry[] => {
    const seen = new Set<string>();
    const result: StickerEntry[] = [];
    for (const p of inventoryItems) {
      const e = toStickerEntry(p);
      if (e && !seen.has(e.id)) {
        seen.add(e.id);
        result.push(e);
      }
    }
    return result;
  }, [inventoryItems]);

  // ── Merge local + API search results, filtered by search scope ──
  const filteredEntries = useMemo((): StickerEntry[] => {
    const q = debouncedQuery.toLowerCase().trim();

    // Merge: prefer local (already in memory), supplement with API results
    const merged = new Map<string, StickerEntry>();
    for (const e of localEntries) merged.set(e.id, e);
    for (const p of apiSearchResults) {
      const e = toStickerEntry(p);
      if (e && !merged.has(e.id)) merged.set(e.id, e);
    }

    const all = Array.from(merged.values());

    if (!q) return all.slice(0, 25);

    return all
      .filter((e) => {
        const matchesSearchKey =
          searchScope.searchKey &&
          (e.sku?.toLowerCase().includes(q) || e.name?.toLowerCase().includes(q));
        const matchesName =
          searchScope.productName && e.name?.toLowerCase().includes(q);
        const matchesBarcode =
          searchScope.barcode && e.barcode?.toLowerCase().includes(q);
        const matchesProductNo =
          searchScope.productNo && (
            (e.id && inventoryItems.find(inv => inv.id === e.id)?.no?.toLowerCase().includes(q)) ||
            e.sku?.toLowerCase().includes(q)
          );

        return matchesSearchKey || matchesName || matchesBarcode || matchesProductNo;
      })
      .slice(0, 40);
  }, [localEntries, apiSearchResults, debouncedQuery, searchScope]);

  // ── Print queue management ──
  const handleAddEntry = useCallback(
    (entry: StickerEntry) => {
      if (selectedItems.has(entry.id)) {
        toast.info(barcodeT('alreadyInQueue', { name: entry.name }));
        return;
      }
      setSelectedItems((prev) => {
        const next = new Map(prev);
        next.set(entry.id, { entry, quantity: globalQuantity });
        return next;
      });
      toast.success(barcodeT('addedToQueue', { name: entry.name }));
    },
    [selectedItems, globalQuantity, barcodeT]
  );

  const updateQuantity = useCallback((id: string, delta: number) => {
    setSelectedItems((prev) => {
      const next = new Map(prev);
      const item = next.get(id);
      if (item) {
        const qty = Math.max(1, Math.min(500, item.quantity + delta));
        next.set(id, { ...item, quantity: qty });
      }
      return next;
    });
  }, []);

  const setExactQuantity = useCallback((id: string, qty: number) => {
    setSelectedItems((prev) => {
      const next = new Map(prev);
      const item = next.get(id);
      if (item) {
        next.set(id, { ...item, quantity: Math.max(1, Math.min(500, qty || 1)) });
      }
      return next;
    });
  }, []);

  const removeItem = useCallback((id: string) => {
    setSelectedItems((prev) => {
      const next = new Map(prev);
      next.delete(id);
      return next;
    });
  }, []);

  const clearAll = useCallback(() => {
    setSelectedItems(new Map());
    toast.info(barcodeT('queueCleared'));
  }, [barcodeT]);

  // ── Totals ──
  const totalLabels = useMemo(() => {
    let n = 0;
    selectedItems.forEach((v) => { n += v.quantity; });
    return n;
  }, [selectedItems]);

  // ── Build flat sticker array for preview and print ──
  const allStickers = useMemo((): StickerData[] => {
    const result: StickerData[] = [];
    selectedItems.forEach(({ entry, quantity }) => {
      for (let i = 0; i < quantity; i++) {
        result.push(buildStickerData(entry, labelConfig.storeId, i));
      }
    });
    return result;
  }, [selectedItems, labelConfig.storeId]);

  // ── Print handler ────────────────────────────────────────────────────────
  // Fail-Safe Isolated Hidden Iframe Print Engine.
  // Never touches the main document's DOM/CSS, so it can never collapse the
  // app's own layout and can never produce a blank print preview. The iframe
  // gets a fully standalone HTML document (buildPrintDocument), barcodes are
  // rendered into it via JsBarcode once it has finished loading, then
  // contentWindow.print() is triggered and the iframe is torn down.
  //
  // ISSUE 2 FIX: The entire print lifecycle is wrapped in a try...finally
  // block. Both iframe.onload (which calls runPrint) and the surrounding
  // setup share the same cleanup via the 'cleaned' guard. Additionally,
  // both iframeWindow.onafterprint AND a short setTimeout (1.2s) are used
  // to GUARANTEE setIsPrinting(false) within ~1-2 seconds after the native
  // print dialog finishes or is cancelled.
  const handlePrint = useCallback(() => {
    if (selectedItems.size === 0) {
      toast.error(barcodeT('noProductsInQueue'));
      return;
    }
    if (allStickers.length === 0) {
      toast.error(barcodeT('noLabelsToPrint'));
      return;
    }

    setIsPrinting(true);

    let iframe: HTMLIFrameElement | null = null;
    let cleaned = false;

    const cleanup = () => {
      if (cleaned) return;
      cleaned = true;
      setIsPrinting(false);
      if (iframe && iframe.parentNode) {
        iframe.parentNode.removeChild(iframe);
      }
    };

    try {
      // 1. Create the isolated hidden iframe — never display:none (some
      //    browsers refuse to print a display:none frame), just moved off
      //    the visible viewport and made non-interactive.
      iframe = document.createElement('iframe');
      iframe.setAttribute('aria-hidden', 'true');
      iframe.setAttribute('title', 'thermal-label-print');
      Object.assign(iframe.style, {
        position: 'fixed',
        right: '0',
        bottom: '0',
        width: '0',
        height: '0',
        border: '0',
        visibility: 'hidden',
      });
      document.body.appendChild(iframe);

      const iframeWindow = iframe.contentWindow;
      const iframeDoc = iframeWindow?.document;
      if (!iframeWindow || !iframeDoc) {
        throw new Error('Unable to access isolated print iframe document');
      }

      // 2. Write a clean, standalone HTML/CSS document — zero inheritance
      //    from the app's own stylesheets or DOM tree.
      iframeDoc.open();
      iframeDoc.write(buildPrintDocument(allStickers));
      iframeDoc.close();

      // 3. Once the iframe document is ready, stamp in real Code128
      //    barcodes and trigger the native print dialog.
      const runPrint = () => {
        try {
          const svgNodes = iframeDoc.querySelectorAll('svg.barcode-svg');
          svgNodes.forEach((svgEl) => {
            const code = svgEl.getAttribute('data-barcode') || '';
            try {
              JsBarcode(svgEl, code, {
                format: 'CODE128',
                displayValue: false,
                margin: 0,
                width: 1.2,
                height: 18,
              });
              // Every barcode has a different natural width depending on how
              // many characters it encodes, so the browser's default
              // preserveAspectRatio ("xMidYMid meet") centers each SVG at
              // its own aspect ratio inside the 30mm cell — leaving a
              // different amount of blank space on each side per label.
              // That's what made columns 1 and 3 look "pushed inward"
              // compared to column 2. Forcing preserveAspectRatio="none"
              // stretches every barcode to fill the exact same physical
              // width every time, so all three columns line up edge-to-edge
              // consistently regardless of the barcode's content/length.
              svgEl.setAttribute('preserveAspectRatio', 'none');
            } catch (barcodeErr) {
              console.error(`Failed to render barcode for "${code}"`, barcodeErr);
            }
          });

          iframeWindow.focus();

          // Listen to afterprint for clean exit
          iframeWindow.onafterprint = cleanup;

          // Fallback timer: forcibly reset isPrinting after 1.2s in case
          // the browser never fires onafterprint (e.g. cancel, close)
          const fallbackTimer = setTimeout(cleanup, 1200);

          // Guard: if onafterprint fires, cancel the fallback timer
          const originalOnAfterPrint = iframeWindow.onafterprint;
          iframeWindow.onafterprint = (ev: Event) => {
            clearTimeout(fallbackTimer);
            originalOnAfterPrint?.call(iframeWindow, ev);
          };

          iframeWindow.print();

          toast.success(barcodeT('sentToPrinter', { count: allStickers.length }));
        } catch (printErr) {
          console.error('Print failed:', printErr);
          toast.error(barcodeT('failedToSend'));
        } finally {
          // If runPrint succeeded in calling print(), but onafterprint
          // never fired (e.g. browser bug), the fallback timer at 1.2s
          // will still expire and call cleanup — so isPrinting is always
          // reset. If runPrint threw, cleanup() will run here.
          // We set a short safety net in the outer scope as well.
        }
      };

      if (iframeDoc.readyState === 'complete') {
        runPrint();
      } else {
        iframe.onload = runPrint;
      }
    } catch (err) {
      console.error('Print setup failed:', err);
      toast.error(barcodeT('failedToPrepare'));
      cleanup();
    }
  }, [selectedItems, allStickers, barcodeT]);

  // ==========================================================================
  // RENDER
  // ==========================================================================
  return (
    <>
      {/* ══════════════════════════════════════════════════════════════════════
          NOTE ON PRINTING
          There is intentionally NO global `@media print` stylesheet and NO
          hidden in-DOM print zone here anymore. The old approach injected a
          `* { display: none !important }` rule into the main document, which
          also hid every ancestor of the print zone — collapsing the app's own
          layout and producing a blank page. Printing now happens entirely
          inside an isolated hidden <iframe> with its own standalone HTML/CSS
          document (see buildPrintDocument() + handlePrint above), so it can
          never interact with — or break — this component's own DOM/CSS.
          ══════════════════════════════════════════════════════════════════════ */}

      {/* ══════════════════════════════════════════════════════════════════════
          SCREEN UI
          ══════════════════════════════════════════════════════════════════════ */}
      <div className={`min-h-screen ${isDark ? 'bg-slate-900' : 'bg-slate-50'}`}>

        {/* ── HEADER ── */}
        <div
          className={`sticky top-[0px] z-20 ${
            isMobile ? 'px-3 py-2' : 'px-4 py-3'
          } ${
            isDark
              ? 'bg-slate-800/95 backdrop-blur border-b border-slate-700'
              : 'bg-white/95 backdrop-blur border-b border-slate-200 shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between max-w-7xl mx-auto">
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate('/products')}
                className={`p-2 rounded-lg transition-colors ${
                  isDark
                    ? 'hover:bg-slate-700 text-slate-400'
                    : 'hover:bg-slate-100 text-slate-600'
                }`}
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-2">
                <div
                  className={`${
                    isMobile ? 'w-8 h-8' : 'w-10 h-10'
                  } bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/30`}
                >
                  <ScanLine
                    className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'} text-white`}
                  />
                </div>
                <div>
                  <h1
                    className={`${
                      isMobile ? 'text-base' : 'text-xl'
                    } font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}
                  >
                    {barcodeT('pageTitle')}
                  </h1>
                  {!isMobile && (
                    <p
                      className={`text-xs ${
                        isDark ? 'text-slate-400' : 'text-slate-500'
                      }`}
                    >
                      {barcodeT('pageSubtitle')}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {totalLabels > 0 && (
                <Badge
                  variant="secondary"
                  className={`gap-1 ${
                    isMobile ? 'px-2 py-1 text-xs' : 'px-3 py-1.5'
                  } bg-indigo-500/20 text-indigo-600 dark:text-indigo-400`}
                >
                  <Tag className={`${isMobile ? 'w-3 h-3' : 'w-3.5 h-3.5'}`} />
                  {totalLabels}
                </Badge>
              )}
              {!isMobile && (
                <Button
                  onClick={handlePrint}
                  disabled={selectedItems.size === 0 || isPrinting}
                  className="gap-2 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600"
                >
                  <Printer className="w-4 h-4" />
                  {isPrinting ? barcodeT('printing') : barcodeT('printLabels')}
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* ── MAIN CONTENT: SPLIT-VIEW DASHBOARD ── */}
        <div
          className={`max-w-7xl mx-auto ${isMobile ? 'px-2 py-2' : 'p-4'}`}
        >
          <div
            className={`grid gap-4 ${
              isMobile ? 'grid-cols-1' : 'grid-cols-[360px_1fr]'
            }`}
          >
            {/* ────────────────────────────────────────────────────────────
                LEFT PANEL — Settings + Product Search + Queue
                ──────────────────────────────────────────────────────────── */}
            <div className="space-y-3" ref={leftColumnRef}>

              {/* ── API status bar ── */}
              {inventoryError && (
                <div
                  className={`flex items-center gap-2 p-2.5 rounded-xl text-xs border ${
                    isDark
                      ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                      : 'bg-amber-50 border-amber-200 text-amber-700'
                  }`}
                >
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="flex-1">{barcodeT('apiOffline')}</span>
                  <button
                    onClick={() => refreshInventory()}
                    className="flex items-center gap-1 opacity-70 hover:opacity-100"
                  >
                    <RefreshCw className="w-3 h-3" />
                    {barcodeT('retry')}
                  </button>
                </div>
              )}

              {/* ── SETTINGS CARD ── */}
              <div
                className={`relative overflow-hidden rounded-2xl border ${
                  isDark
                    ? 'bg-slate-800/60 backdrop-blur-xl border-slate-700/50 shadow-xl shadow-black/20'
                    : 'bg-white/80 backdrop-blur-xl border-slate-200/80 shadow-xl shadow-slate-200/50'
                }`}
              >
                {/* Glassmorphism accent */}
                <div
                  className={`absolute -top-16 -right-16 w-36 h-36 rounded-full blur-3xl opacity-20 ${
                    isDark ? 'bg-indigo-500' : 'bg-indigo-300'
                  }`}
                />

                <div className="relative p-4 space-y-4">
                  {/* SECTION: Product Search */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h3
                        className={`text-sm font-semibold flex items-center gap-1.5 ${
                          isDark ? 'text-white' : 'text-slate-800'
                        }`}
                      >
                        <Search className="w-3.5 h-3.5 text-indigo-500" />
                        {t('filters.searchProducts')}
                      </h3>
                      <div className="flex items-center gap-1.5">
                        {isInventoryLoading && (
                          <RefreshCw className="w-3 h-3 animate-spin text-indigo-400" />
                        )}
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                            isDark
                              ? 'bg-slate-700 text-slate-400'
                              : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          {barcodeT('itemsBadge', { count: localEntries.length })}
                        </span>
                      </div>
                    </div>

                    {/* Search input */}
                    <div
                      className={`relative rounded-xl overflow-hidden border transition-all duration-200 focus-within:ring-2 focus-within:ring-indigo-500/50 ${
                        isDark
                          ? 'border-slate-600 bg-slate-700/50'
                          : 'border-slate-200 bg-slate-50'
                      }`}
                    >
                      <Search
                        className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${
                          isDark ? 'text-slate-400' : 'text-slate-400'
                        }`}
                      />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder={barcodeT('searchPlaceholder')}
                        className={`w-full bg-transparent py-2.5 pl-10 pr-8 text-sm outline-none ${
                          isDark
                            ? 'text-white placeholder-slate-500'
                            : 'text-slate-900 placeholder-slate-400'
                        }`}
                      />
                      {isSearching && (
                        <RefreshCw className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 animate-spin text-indigo-400" />
                      )}
                    </div>

                    {/* ── Multi-field search scope checkboxes ── */}
                    <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-slate-600 dark:text-slate-400">
                      <span className="font-semibold text-slate-500 uppercase tracking-wider text-[10px]">SEARCH IN:</span>

                      <label className="flex items-center gap-1.5 cursor-pointer hover:text-slate-900 dark:hover:text-slate-200">
                        <input
                          type="checkbox"
                          checked={searchScope.searchKey}
                          onChange={(e) => setSearchScope(prev => ({ ...prev, searchKey: e.target.checked }))}
                          className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5"
                        />
                        <span>Search Key</span>
                      </label>

                      <label className="flex items-center gap-1.5 cursor-pointer hover:text-slate-900 dark:hover:text-slate-200">
                        <input
                          type="checkbox"
                          checked={searchScope.productName}
                          onChange={(e) => setSearchScope(prev => ({ ...prev, productName: e.target.checked }))}
                          className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5"
                        />
                        <span>Product Name</span>
                      </label>

                      <label className="flex items-center gap-1.5 cursor-pointer hover:text-slate-900 dark:hover:text-slate-200">
                        <input
                          type="checkbox"
                          checked={searchScope.barcode}
                          onChange={(e) => setSearchScope(prev => ({ ...prev, barcode: e.target.checked }))}
                          className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5"
                        />
                        <span>Barcode</span>
                      </label>

                      <label className="flex items-center gap-1.5 cursor-pointer hover:text-slate-900 dark:hover:text-slate-200">
                        <input
                          type="checkbox"
                          checked={searchScope.productNo}
                          onChange={(e) => setSearchScope(prev => ({ ...prev, productNo: e.target.checked }))}
                          className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5"
                        />
                        <span>Product No</span>
                      </label>
                    </div>
                  </div>

                  {/* Product list */}
                  <div
                    className={`max-h-[260px] overflow-y-auto rounded-xl border ${
                      isDark ? 'border-slate-700/50' : 'border-slate-200'
                    }`}
                  >
                    {isInventoryLoading && filteredEntries.length === 0 ? (
                      <div className="p-6 flex flex-col items-center gap-2">
                        <RefreshCw
                          className={`w-6 h-6 animate-spin ${
                            isDark ? 'text-indigo-400' : 'text-indigo-500'
                          }`}
                        />
                        <p
                          className={`text-xs ${
                            isDark ? 'text-slate-500' : 'text-slate-400'
                          }`}
                        >
                          {barcodeT('loadingInventory')}
                        </p>
                      </div>
                    ) : filteredEntries.length === 0 ? (
                      <div className="p-4 text-center">
                        <Search
                          className={`w-7 h-7 mx-auto mb-1.5 opacity-40 ${
                            isDark ? 'text-slate-500' : 'text-slate-300'
                          }`}
                        />
                        <p
                          className={`text-xs ${
                            isDark ? 'text-slate-500' : 'text-slate-400'
                          }`}
                        >
                          {debouncedQuery
                            ? barcodeT('noMatchSearch')
                            : barcodeT('noBarcodesFound')}
                        </p>
                      </div>
                    ) : (
                      <div
                        className={`divide-y ${
                          isDark ? 'divide-slate-700/40' : 'divide-slate-100'
                        }`}
                      >
                        {filteredEntries.map((entry) => {
                          const isSelected = selectedItems.has(entry.id);
                          return (
                            <button
                              key={entry.id}
                              onClick={() => handleAddEntry(entry)}
                              disabled={isSelected}
                              className={`w-full text-left px-3 py-2.5 transition-all duration-150 flex items-center gap-2 ${
                                isSelected
                                  ? isDark
                                    ? 'bg-indigo-500/20 cursor-default'
                                    : 'bg-indigo-50 cursor-default'
                                  : isDark
                                  ? 'hover:bg-slate-700/50 active:bg-slate-700'
                                  : 'hover:bg-slate-50 active:bg-slate-100'
                              }`}
                            >
                              <div className="flex-1 min-w-0">
                                <p
                                  className={`text-xs font-medium truncate ${
                                    isSelected
                                      ? isDark
                                        ? 'text-indigo-300'
                                        : 'text-indigo-600'
                                      : isDark
                                      ? 'text-slate-200'
                                      : 'text-slate-800'
                                  }`}
                                >
                                  {entry.name}
                                </p>
                                <div className="flex items-center gap-2 mt-0.5 min-w-0">
                                  <span
                                    className={`text-[10px] font-mono truncate min-w-0 flex-1 ${
                                      isDark ? 'text-slate-500' : 'text-slate-400'
                                    }`}
                                  >
                                    {entry.no || formatShortProductId(entry.id)}
                                  </span>
                                  <span
                                    className={`text-[10px] font-semibold flex-shrink-0 ${
                                      isDark ? 'text-emerald-400' : 'text-emerald-600'
                                    }`}
                                  >
                                    Rs.{entry.salesPrice.toLocaleString()}
                                  </span>
                                  <span
                                    className={`text-[9px] font-mono flex-shrink-0 ${
                                      isDark ? 'text-slate-600' : 'text-slate-300'
                                    }`}
                                  >
                                    {entry.barcode}
                                  </span>
                                </div>
                              </div>
                              {isSelected ? (
                                <Check className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                              ) : (
                                <Plus
                                  className={`w-4 h-4 flex-shrink-0 ${
                                    isDark ? 'text-slate-500' : 'text-slate-400'
                                  }`}
                                />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Global default quantity */}
                  <div>
                    <label
                      className={`text-xs font-medium mb-1.5 block ${
                        isDark ? 'text-slate-300' : 'text-slate-600'
                      }`}
                    >
                      {barcodeT('defaultQuantity')}
                    </label>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setGlobalQuantity((q) => Math.max(1, q - 1))}
                        className={`p-2 rounded-lg transition-colors ${
                          isDark
                            ? 'hover:bg-slate-700 text-slate-400'
                            : 'hover:bg-slate-100 text-slate-600'
                        }`}
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <input
                        type="number"
                        min={1}
                        max={500}
                        value={globalQuantity}
                        onChange={(e) =>
                          setGlobalQuantity(
                            Math.max(1, Math.min(500, parseInt(e.target.value) || 1))
                          )
                        }
                        className={`w-16 text-center font-bold rounded-lg border py-1.5 text-sm outline-none ${
                          isDark
                            ? 'bg-slate-700 border-slate-600 text-white'
                            : 'bg-white border-slate-300 text-slate-900'
                        }`}
                      />
                      <button
                        onClick={() => setGlobalQuantity((q) => Math.min(500, q + 1))}
                        className={`p-2 rounded-lg transition-colors ${
                          isDark
                            ? 'hover:bg-slate-700 text-slate-400'
                            : 'hover:bg-slate-100 text-slate-600'
                        }`}
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Store ID */}
                  <div>
                    <label
                      className={`text-xs font-medium mb-1.5 block ${
                        isDark ? 'text-slate-300' : 'text-slate-600'
                      }`}
                    >
                      {barcodeT('storeIdLabel')}
                    </label>
                    <input
                      type="text"
                      value={labelConfig.storeId}
                      onChange={(e) =>
                        setLabelConfig((prev) => ({
                          ...prev,
                          storeId: e.target.value,
                        }))
                      }
                      className={`w-full rounded-xl border py-2 px-3 text-sm font-mono outline-none transition-all duration-200 focus:ring-2 focus:ring-indigo-500/50 ${
                        isDark
                          ? 'bg-slate-700 border-slate-600 text-white'
                          : 'bg-white border-slate-200 text-slate-900'
                      }`}
                    />
                  </div>


                  {/* Print button */}
                  <Button
                    onClick={handlePrint}
                    disabled={selectedItems.size === 0 || isPrinting}
                    className="w-full gap-2 py-5 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 shadow-lg shadow-indigo-500/25"
                    size="lg"
                  >
                    <Printer className="w-5 h-5" />
                    {isPrinting
                      ? barcodeT('preparing')
                      : barcodeT('printLabels') + (totalLabels > 0 ? ` (${totalLabels})` : '')}
                  </Button>

                  {/* Info tip */}
                  <div
                    className={`flex items-start gap-2 p-2.5 rounded-xl text-[10px] ${
                      isDark
                        ? 'bg-indigo-500/10 text-indigo-300'
                        : 'bg-indigo-50 text-indigo-600'
                    }`}
                  >
                    <Info className="w-3 h-3 mt-0.5 flex-shrink-0" />
                    <span>
                      {barcodeT('rollSpecInfo')}
                    </span>
                  </div>
                </div>
              </div>

              {/* ── PRINT QUEUE CARD ── */}
              <div
                className={`relative overflow-hidden rounded-2xl border ${
                  isDark
                    ? 'bg-slate-800/60 backdrop-blur-xl border-slate-700/50'
                    : 'bg-white/80 backdrop-blur-xl border-slate-200/80'
                }`}
              >
                <div className="p-3">
                  <div className="flex items-center justify-between mb-2">
                    <h3
                      className={`text-xs font-semibold flex items-center gap-1.5 ${
                        isDark ? 'text-white' : 'text-slate-800'
                      }`}
                    >
                      <Layers className="w-3.5 h-3.5 text-indigo-500" />
                      {barcodeT('printQueue', { count: selectedItems.size })}
                    </h3>
                    {selectedItems.size > 0 && (
                      <button
                        onClick={clearAll}
                        className="text-[10px] text-red-500 hover:text-red-600 flex items-center gap-1"
                      >
                        <RotateCcw className="w-3 h-3" />
                        {t('barcodeLabels.clearAll')}
                      </button>
                    )}
                  </div>

                  <div className="max-h-[220px] overflow-y-auto space-y-1">
                    {selectedItems.size === 0 ? (
                      <div className="py-5 text-center">
                        <ShoppingCart
                          className={`w-6 h-6 mx-auto mb-1 ${
                            isDark ? 'text-slate-600' : 'text-slate-300'
                          }`}
                        />
                        <p
                          className={`text-[10px] ${
                            isDark ? 'text-slate-500' : 'text-slate-400'
                          }`}
                        >
                          {barcodeT('queueEmpty')}
                        </p>
                      </div>
                    ) : (
                      Array.from(selectedItems.entries()).map(
                        ([id, { entry, quantity }]) => (
                          <div
                            key={id}
                            className={`flex items-center gap-2 p-2 rounded-xl ${
                              isDark ? 'bg-slate-700/50' : 'bg-slate-50'
                            }`}
                          >
                            <div className="flex-1 min-w-0">
                              <p
                                className={`text-[10px] font-medium truncate ${
                                  isDark ? 'text-slate-200' : 'text-slate-700'
                                }`}
                              >
                                {entry.name}
                              </p>
                              <p
                                className={`text-[9px] font-mono ${
                                  isDark ? 'text-slate-500' : 'text-slate-400'
                                }`}
                              >
                                {entry.no || formatShortProductId(entry.id)} · {entry.barcode}
                              </p>
                            </div>
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => updateQuantity(id, -1)}
                                className={`p-1 rounded-lg ${
                                  isDark
                                    ? 'hover:bg-slate-600 text-slate-400'
                                    : 'hover:bg-slate-200 text-slate-500'
                                }`}
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <input
                                type="number"
                                min={1}
                                max={500}
                                value={quantity}
                                onChange={(e) =>
                                  setExactQuantity(id, parseInt(e.target.value) || 1)
                                }
                                className={`w-10 text-center font-bold rounded-lg border py-0.5 text-[10px] outline-none ${
                                  isDark
                                    ? 'bg-slate-600 border-slate-500 text-white'
                                    : 'bg-white border-slate-200 text-slate-900'
                                }`}
                              />
                              <button
                                onClick={() => updateQuantity(id, 1)}
                                className={`p-1 rounded-lg ${
                                  isDark
                                    ? 'hover:bg-slate-600 text-slate-400'
                                    : 'hover:bg-slate-200 text-slate-500'
                                }`}
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => removeItem(id)}
                                className={`p-1 rounded-lg ${
                                  isDark
                                    ? 'hover:bg-red-500/20 text-red-400'
                                    : 'hover:bg-red-100 text-red-500'
                                }`}
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        )
                      )
                    )}
                  </div>

                  {totalLabels > 0 && (
                    <div
                      className={`mt-2 pt-2 border-t flex items-center justify-between ${
                        isDark ? 'border-slate-700' : 'border-slate-200'
                      }`}
                    >
                      <span
                        className={`text-xs font-medium ${
                          isDark ? 'text-slate-300' : 'text-slate-600'
                        }`}
                      >
                        {barcodeT('totalLabelsSummary')}
                      </span>
                      <span className="text-lg font-bold text-indigo-500">
                        {totalLabels}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* ────────────────────────────────────────────────────────────
                RIGHT PANEL — Live 3-Column Roll Preview
                ──────────────────────────────────────────────────────────── */}
            <div
              className={`relative flex flex-col overflow-hidden rounded-2xl border ${
                isDark
                  ? 'bg-slate-800/30 backdrop-blur border-slate-700/50'
                  : 'bg-white/80 backdrop-blur-xl border-slate-200/80'
              }`}
              style={
                previewMatchHeight
                  ? { maxHeight: `${previewMatchHeight}px` }
                  : undefined
              }
            >
              <div
                className={`p-3 border-b flex items-center justify-between gap-2 shrink-0 ${
                  isDark ? 'border-slate-700/50' : 'border-slate-200'
                }`}
              >
                <h3
                  className={`text-sm font-semibold flex items-center gap-1.5 ${
                    isDark ? 'text-white' : 'text-slate-800'
                  }`}
                >
                  <Grid3X3 className="w-4 h-4 text-indigo-500" />
                  {barcodeT('rollPreview')}
                </h3>

                <div className="flex items-center gap-2">
                  {/* Screen-only zoom — purely visual, never affects the
                      physical print document (buildPrintDocument) */}
                  <div
                    className={`flex items-center gap-0.5 rounded-lg border p-0.5 ${
                      isDark
                        ? 'border-slate-700 bg-slate-800/60'
                        : 'border-slate-200 bg-slate-50'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={zoomOut}
                      disabled={previewZoom <= 50}
                      title={barcodeT('zoomOut')}
                      className={`p-1 rounded-md disabled:opacity-30 disabled:cursor-not-allowed ${
                        isDark
                          ? 'hover:bg-slate-600 text-slate-300'
                          : 'hover:bg-slate-200 text-slate-600'
                      }`}
                    >
                      <ZoomOut className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={zoomReset}
                      title={barcodeT('resetZoom')}
                      className={`px-1.5 text-[10px] font-semibold tabular-nums rounded-md ${
                        isDark
                          ? 'hover:bg-slate-600 text-slate-300'
                          : 'hover:bg-slate-200 text-slate-600'
                      }`}
                    >
                      {previewZoom}%
                    </button>
                    <button
                      type="button"
                      onClick={zoomIn}
                      disabled={previewZoom >= 200}
                      title={barcodeT('zoomIn')}
                      className={`p-1 rounded-md disabled:opacity-30 disabled:cursor-not-allowed ${
                        isDark
                          ? 'hover:bg-slate-600 text-slate-300'
                          : 'hover:bg-slate-200 text-slate-600'
                      }`}
                    >
                      <ZoomIn className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {totalLabels > 0 && (
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full ${
                        isDark
                          ? 'bg-slate-700 text-slate-300'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {barcodeT('rollFooterCount', {
                        count: totalLabels,
                        rows: Math.ceil(totalLabels / 3),
                      })}
                    </span>
                  )}
                </div>
              </div>

              <div className="p-3 lg:p-5 overflow-auto flex-1 min-h-0">
                <div className="flex justify-center">
                  <div
                    className={`${
                      isMobile ? 'w-full max-w-[340px]' : 'w-[360px]'
                    } transition-[zoom] duration-200`}
                    // `zoom` (not `transform: scale`) so the box reflows and
                    // never overlaps/clips surrounding UI. Screen-only — has
                    // no connection whatsoever to buildPrintDocument().
                    style={{ zoom: (previewZoom / 100) * 2.0 } as React.CSSProperties & { zoom?: number }}
                  >
                    <PreviewPanel
                      stickers={allStickers}
                      isDark={isDark}
                      totalLabels={totalLabels}
                      t={barcodeT}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── MOBILE FLOATING PRINT BUTTON ── */}
        {isMobile && selectedItems.size > 0 && (
          <div className="fixed bottom-20 left-0 right-0 px-4 z-50">
            <Button
              onClick={handlePrint}
              disabled={isPrinting}
              className="w-full h-14 gap-3 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 shadow-2xl shadow-indigo-500/40 rounded-2xl text-base font-semibold"
            >
              <Printer className="w-5 h-5" />
              {isPrinting
                ? barcodeT('preparing')
                : `${barcodeT('printLabels')} ${totalLabels}`}
            </Button>
          </div>
        )}
      </div>
    </>
  );
};

export default BarcodeLabels;