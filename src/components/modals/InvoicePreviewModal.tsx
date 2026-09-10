import React, { useCallback, useRef, useEffect } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { Invoice, Customer, InvoiceItem } from '../../types/index';
import { X, Printer } from 'lucide-react';
import { useHiddenIframePrint } from '../../hooks/useHiddenIframePrint';

interface ExtendedInvoiceItem extends InvoiceItem {
  originalPrice?: number;
  discountType?: 'percentage' | 'fixed' | null;
  discountValue?: number;
  isCustomPrice?: boolean;
  isQuickAdd?: boolean;
  productNameSi?: string;
  displayPrice?: number;
  ourPrice?: number;
  salesPrice?: number;
}

interface InvoicePreviewModalProps {
  invoice: Invoice;
  customer?: Customer | null;
  onClose: () => void;
  onEdit?: () => void;
}

/**
 * InvoicePreviewModal
 *
 * Print Architecture: "Hidden Iframe Dynamic Print"
 * ---------------------------------------------------
 * Modal width locked to max-w-[400px] to match the 80mm thermal receipt profile.
 * Receipt styles synchronized with receiptGenerator.ts Pure Black Bold standard.
 */
/**
 * Format price: show no decimals for whole numbers, keep 2 decimals for fractional.
 */
function formatPrice(n: number): string {
  if (n % 1 === 0) {
    return n.toLocaleString('en-US');
  }
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export const InvoicePreviewModal: React.FC<InvoicePreviewModalProps> = ({
  invoice,
  customer,
  onClose,
  onEdit,
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const receiptRef = useRef<HTMLDivElement>(null);
  const printWrapperRef = useRef<HTMLDivElement>(null);

  const { printViaHiddenIframe } = useHiddenIframePrint();

  const handlePrint = useCallback(() => {
    if (printWrapperRef.current) {
      printViaHiddenIframe(printWrapperRef.current)
        .catch((err) => {
          console.warn('Iframe print failed, falling back to window.print():', err);
          window.print();
        });
    } else {
      window.print();
    }
  }, [printViaHiddenIframe]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const discountAmount = invoice.discountType === 'percentage'
    ? (invoice.subtotal * (invoice.discountValue || invoice.discount || 0)) / 100
    : (invoice.discountValue || invoice.discount || 0);

  const isWalkIn = !customer || customer.id === 'walk-in';

  const receivedAmount = invoice.receivedAmount || 0;

  // DYNAMIC PAYMENT STATUS (Sinhala): Pending Balance = Total - Paid.
  //   Paid <  Total  => unpaid / partial
  //   Paid >= Total  => fully paid / overpaid
  // Computed from amounts so the badge stays in sync with receiptGenerator.ts.
  const pendingBalance = Number((invoice.total - receivedAmount).toFixed(2));
  const isPaid = pendingBalance <= 0;

  const changeAmount = invoice.changeAmount || (receivedAmount > 0 ? receivedAmount - invoice.total : 0);

  // Customer savings: Σ((displayPrice - ourPrice) × qty) + manual discount — matches receiptGenerator logic
  const totalItemDiscounts = invoice.items.reduce((sum, item) => {
    const extItem = item as ExtendedInvoiceItem;
    const dp = Number(extItem.displayPrice || extItem.originalPrice || item.unitPrice || 0);
    const op = Number(extItem.ourPrice || extItem.salesPrice || item.unitPrice || 0);
    const gap = (dp - op) * item.quantity;
    return sum + (gap > 0 ? gap : 0);
  }, 0);

  const totalSavings = totalItemDiscounts + (invoice.discount || 0);

  // Pure Black style constants — mirrors receiptGenerator.ts
  const PB: React.CSSProperties = { color: '#000000', fontWeight: 700 };
  const PBBold: React.CSSProperties = { color: '#000000', fontWeight: 800 };
  const mono: React.CSSProperties = { fontFamily: "'Courier New', monospace" };

  return (
    <>
      {/* ── OVERLAY ── */}
      <div
        className="fixed inset-0 z-[100] flex items-center justify-center"
        style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
      >
        {/* ── MODAL CONTAINER — locked to receipt width ── */}
        <div
          className="relative w-full max-w-[400px] rounded-2xl border shadow-2xl animate-fade-in mx-2"
          style={{
            background: isDark ? '#1e293b' : '#f8fafc',
            borderColor: isDark ? 'rgba(51,65,85,0.5)' : '#e2e8f0',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* ── Fixed Action Bar ── */}
          <div className={`flex-shrink-0 flex items-center justify-between px-3 py-2 border-b rounded-t-2xl ${
            isDark ? 'bg-slate-900/95 border-slate-700/50' : 'bg-white/95 border-slate-200'
          }`}>
            <div className="flex items-center gap-2">
              <span className={`text-xs font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Receipt Preview
              </span>
              <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-semibold ${
                isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-500'
              }`}>
                {invoice.invoiceNumber}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={handlePrint}
                className="flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-orange-500 to-rose-500 text-white text-xs font-semibold rounded-lg hover:from-orange-600 hover:to-rose-600 transition-all shadow"
              >
                <Printer className="w-3.5 h-3.5" /> Print
              </button>
              {onEdit && (
                <button
                  onClick={onEdit}
                  className={`px-2.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                    isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700' : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200'
                  }`}
                >
                  Edit
                </button>
              )}
              <button onClick={onClose} className={`p-1.5 rounded-lg transition-colors ${isDark ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-100 text-slate-500'}`}>
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* ── SCROLLABLE RECEIPT CANVAS — zero side padding, receipt fills full width ── */}
          <div className="flex-1 overflow-y-auto scrollbar-thin" style={{ padding: '6px 4px' }}>
            {/*
              Double wrapper print strategy:
              - receiptRef (outer): screen preview container, 76mm centered
              - printWrapperRef (inner): iframe innerHTML extraction target
            */}
            <div
              id="thermal-receipt-print-area"
              ref={receiptRef}
              style={{
                background: '#ffffff',
                fontFamily: "'Segoe UI', 'Noto Sans Sinhala', Arial, sans-serif",
                fontSize: '12px',
                color: '#000000',
                fontWeight: 700,
                lineHeight: 1.4,
                width: '100%',
                maxWidth: '302px',
                margin: '0 auto',
                padding: '4px',
                boxSizing: 'border-box',
              }}
            >
              <div ref={printWrapperRef} style={{ width: '100%' }}>

                {/* ═══ HEADER ═══ */}
                <div style={{ textAlign: 'center', paddingBottom: '4px', borderBottom: '2px double #000' }}>
                  <img src="/inv_logo.png" alt="LHD Logo" style={{ width: '90px', height: 'auto', display: 'block', margin: '0 auto' }} />
                  <div style={{ margin: '5px 0 3px', borderBottom: '1px solid #000', paddingBottom: '3px' }}>
                    <div style={{ fontSize: '22px', fontWeight: 900, color: '#000', lineHeight: 1.1 }}>
                      ලියනගේ බාත්වෙයාර්
                    </div>
                  </div>
                  <div style={{ fontSize: '11px', ...PBBold, lineHeight: 1.5 }}>
                    හක්මන පාර, දෙයියන්දර<br />
                    දුරකථන: 070-5237647 / 070-2629352<br />
                    Email: liyanagehardware1986@gmail.com
                  </div>
                </div>

                {/* ═══ INVOICE META ═══ */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0', borderBottom: '2px dashed #000' }}>
                  <div>
                    <div style={{ fontSize: '10px', ...PB }}>බිල්පත</div>
                    <div style={{ fontSize: '13px', ...PBBold, ...mono }}>{invoice.invoiceNumber}</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    {isPaid ? (
                      /* PAID — gradient black bg (never stripped) + white text */
                      <span
                        className="print-badge-paid"
                        style={{
                          display: 'inline-block',
                          padding: '2px 6px',
                          borderRadius: '3px',
                          fontSize: '10px',
                          fontWeight: 800,
                          border: '2px solid #000000',
                          backgroundColor: '#000000',
                          backgroundImage: 'linear-gradient(#000000, #000000)',
                          WebkitPrintColorAdjust: 'exact',
                          printColorAdjust: 'exact',
                        } as React.CSSProperties}
                      >
                        <span style={{ color: '#ffffff', fontWeight: 800 }}>✓ ගෙවා ඇත</span>
                      </span>
                    ) : (
                      /* PENDING — white bg, black border, black text */
                      <span
                        className="print-badge-pending"
                        style={{
                          display: 'inline-block',
                          padding: '2px 6px',
                          borderRadius: '3px',
                          fontSize: '10px',
                          fontWeight: 800,
                          border: '2px solid #000000',
                          backgroundColor: '#ffffff',
                          color: '#000000',
                          WebkitPrintColorAdjust: 'exact',
                          printColorAdjust: 'exact',
                        } as React.CSSProperties}
                      >
                        <span style={{ color: '#000000', fontWeight: 800 }}>○ ගෙවිය යුතු</span>
                      </span>
                    )}
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '10px', ...PB }}>දිනය</div>
                    <div style={{ fontSize: '11px', ...PBBold }}>{new Date(invoice.issueDate).toISOString().split('T')[0]}</div>
                  </div>
                </div>

                {/* ═══ CUSTOMER — ALWAYS rendered, walk-in fallback to match print receipt 1:1 ═══ */}
                <div style={{ padding: '3px 0', borderBottom: '2px dashed #000' }}>
                  <span style={{ fontSize: '10px', ...PB }}>පාරිභෝගිකයා: </span>
                  <span style={{ fontSize: '12px', ...PBBold }}>
                    {customer?.name || invoice.customerName || 'walk-in customer'}
                  </span>
                </div>

                {/* ═══ ITEMS HEADER ═══ */}
                <div style={{ padding: '3px 0 2px', borderBottom: '2px solid #000' }}>
                  <div style={{ fontSize: '11px', fontWeight: 800, color: '#000', marginBottom: '3px' }}>භාණ්ඩය</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', fontWeight: 800, color: '#000' }}>
                    <span style={{ width: '15%', textAlign: 'center' }}>ප්‍රමාණය</span>
                    <span style={{ width: '25%', textAlign: 'right' }}>සදහන් මිල</span>
                    <span style={{ width: '25%', textAlign: 'right' }}>අපේ මිල</span>
                    <span style={{ width: '30%', textAlign: 'right' }}>එකතුව</span>
                  </div>
                </div>

                {/* ═══ ITEMS LIST ═══ */}
                <div style={{ padding: '2px 0' }}>
                  {invoice.items.map((item) => {
                    const extItem = item as ExtendedInvoiceItem;
                    const printedItemName = item.productNameSi || item.productName;
                    // 🌟 [PACKAGE CHECK] Package එකක්දැයි හඳුනා ගැනීම
                    const isPackage = printedItemName.includes('{') && printedItemName.includes('}');
                    
                    const displayPrice = Number(extItem.displayPrice || extItem.originalPrice || item.unitPrice || 0);
                    const ourPrice = Number(extItem.ourPrice || extItem.salesPrice || item.unitPrice || 0);
                    const lineTotal = ourPrice * item.quantity;
                    const hasPriceGap = !isPackage && displayPrice > ourPrice;

                    // ══════════════════════════════════════════════════════════
                    // 🌟 [PACKAGE ROW] Package sub-items <ul> bullet list එකක් ලෙස render කිරීම
                    // ══════════════════════════════════════════════════════════
                    if (isPackage) {
                      const [mainTitlePart, subPart] = printedItemName.split('{');
                      // 🌟 [Items: X] ඉවත් කර පිරිසිදු නම ලබා ගැනීම
                      const cleanMainTitle = mainTitlePart.replace(/\[Items:\s*\d+\]/gi, '').trim();
                      const subItemsList = subPart ? subPart.replace('}', '').trim() : '';
                      const subItemsArray = subItemsList.split('•').map((s) => s.trim()).filter(Boolean);

                      // 🌟 Package code එක [CODE] ලෙස ඉදිරියෙන් දැක්වීම
                      const pkgCode = (extItem as any).barcode || (extItem as any).no || (extItem as any).searchKey || '';
                      const hasCodeInTitle = cleanMainTitle.startsWith('[') && cleanMainTitle.includes(']');

                      return (
                        <div key={item.id} style={{ borderBottom: '1px dashed #000', padding: '5px 0', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '6px', width: '100%', boxSizing: 'border-box' }}>
                          <div style={{ flex: 1, minWidth: 0, maxWidth: 'calc(100% - 85px)', paddingRight: '4px' }}>
                            <div style={{ fontWeight: 900, fontSize: '13px', color: '#000', lineHeight: 1.2, marginBottom: '2px', whiteSpace: 'normal', wordBreak: 'break-word' }}>
                              {pkgCode && !hasCodeInTitle && (
                                <span style={{ fontFamily: "'Courier New', monospace", fontSize: '11px', background: '#000', color: '#fff', padding: '1px 4px', borderRadius: '2px', marginRight: '4px' }}>
                                  [{pkgCode}]
                                </span>
                              )}
                              {cleanMainTitle}
                            </div>
                            {subItemsArray.length > 0 && (
                              <ul style={{ fontSize: '10px', fontWeight: 700, color: '#222', lineHeight: 1.25, margin: '2px 0 0 14px', padding: 0, listStyleType: 'disc', whiteSpace: 'normal', wordBreak: 'break-word' }}>
                                {subItemsArray.map((sub, sIdx) => (
                                  <li key={sIdx} style={{ marginBottom: '2px' }}>{sub}</li>
                                ))}
                              </ul>
                            )}
                          </div>
                          <div style={{ width: '80px', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'flex-start', gap: '4px', flexShrink: 0, ...mono, color: '#000', paddingTop: '2px' }}>
                            <span style={{ fontSize: '11px', fontWeight: 800, color: '#333', whiteSpace: 'nowrap' }}>Qty: {item.quantity}</span>
                            <span style={{ fontSize: '15px', fontWeight: 900, whiteSpace: 'nowrap' }}>{formatPrice(lineTotal)}</span>
                          </div>
                        </div>
                      );
                    }

                    // ══════════════════════════════════════════════════════════
                    // STANDARD ROW
                    // ══════════════════════════════════════════════════════════
                    return (
                      <div key={item.id} style={{ borderBottom: '1px dashed #000', padding: '4px 0' }}>
                        <div style={{ fontWeight: 800, fontSize: '12px', color: '#000', marginBottom: '2px', whiteSpace: 'normal', wordBreak: 'break-word' }}>
                          {printedItemName}
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 700, color: '#000', ...mono }}>
                          <span style={{ width: '15%', textAlign: 'center' }}>{item.quantity}</span>
                          <span style={{ width: '25%', textAlign: 'right', ...(hasPriceGap ? { textDecoration: 'line-through' } : {}) }}>
                            {formatPrice(displayPrice)}
                          </span>
                          <span style={{ width: '25%', textAlign: 'right', fontWeight: 800 }}>
                            {formatPrice(ourPrice)}
                          </span>
                          <span style={{ width: '30%', textAlign: 'right', fontWeight: 900 }}>
                            {formatPrice(lineTotal)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>


                {/* ═══ TOTALS ═══ */}
                <div style={{ borderTop: '2px solid #000', paddingTop: '4px', marginTop: '2px' }}>
                  {discountAmount > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0', fontSize: '12px', ...PB }}>
                      <span>වට්ටම් {invoice.discountType === 'percentage' ? `(${invoice.discountValue || invoice.discount}%)` : ''}</span>
                      <span style={{ ...mono, fontWeight: 800 }}>-{formatPrice(discountAmount)}</span>
                    </div>
                  )}
                  {(invoice.tax ?? 0) > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0', fontSize: '11px', ...PB }}>
                      <span>බදු</span>
                      <span style={{ ...mono }}>{formatPrice(invoice.tax ?? 0)}</span>
                    </div>
                  )}

                  {/* Grand Total Box — gradient fallback, NEVER stripped by browser */}
                  <div
                    className="print-black-box"
                    style={{
                      backgroundColor: '#000000',
                      backgroundImage: 'linear-gradient(#000000, #000000)',
                      color: '#ffffff',
                      padding: '6px',
                      marginTop: '4px',
                      borderRadius: '3px',
                      border: '2px solid #000000',
                      WebkitPrintColorAdjust: 'exact',
                      printColorAdjust: 'exact',
                    } as React.CSSProperties}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '15px', fontWeight: 800, color: '#ffffff' }}>මුළු එකතුව</span>
                      <span style={{ fontSize: '19px', fontWeight: 900, ...mono, letterSpacing: '1px', color: '#ffffff' }}>
                        {formatPrice(invoice.total)}
                      </span>
                    </div>
                  </div>

                  {/* Item count — 🌟 Package sub-items ද එකතු කර ගණනය කිරීම */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', fontSize: '12px', ...PB, marginTop: '2px' }}>
                    <span>භාණ්ඩ සංඛ්‍යාව</span>
                    <span style={{ fontWeight: 800 }}>
                      [{invoice.items.reduce((total, item) => {
                        const name = item.productNameSi || item.productName || '';
                        const match = name.match(/\[Items:\s*(\d+)\]/i);
                        if (match && match[1]) {
                          return total + (parseInt(match[1], 10) * Number(item.quantity || 1));
                        }
                        return total + Number(item.quantity || 1);
                      }, 0)}]
                    </span>
                  </div>

                  {/* Customer savings — always shown when > 0, matches receiptGenerator */}
                  {totalSavings > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: '13px', fontWeight: 800, color: '#000', borderTop: '2px dashed #000', marginTop: '4px' }}>
                      <span>ඔබ ලැබූ ලාභය</span>
                      <span style={{ ...mono, fontWeight: 900 }}>{formatPrice(totalSavings)}</span>
                    </div>
                  )}
                </div>

                {/* ═══ PAYMENT INFO ═══ */}
                {receivedAmount > 0 && (
                  <div style={{ borderTop: '2px dashed #000', marginTop: '4px', paddingTop: '4px' }}>
                    <div style={{ border: '1px solid #000', padding: '4px 6px', borderRadius: '3px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0', fontSize: '12px', ...PB }}>
                        <span>ගෙවූ මුදල</span>
                        <span style={{ ...mono, fontWeight: 800 }}>{formatPrice(receivedAmount)}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0', fontSize: '12px', ...PB }}>
                        <span>ඉතිරි මුදල</span>
                        <span style={{ ...mono, fontWeight: 800 }}>{formatPrice(changeAmount)}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* ═══ CASHIER ═══ */}
                <div style={{ padding: '3px 0', borderTop: '1px dashed #000', marginTop: '3px' }}>
                  <span style={{ fontSize: '11px', ...PB }}>කැෂියර්: </span>
                  <span style={{ fontSize: '11px', ...PBBold }}>Admin</span>
                </div>

                

                {/* ═══ FOOTER ═══ */}
                <div style={{ textAlign: 'center', paddingTop: '6px', borderTop: '2px dashed #000', marginTop: '3px' }}>
                  <div style={{ fontSize: '13px', fontWeight: 800, color: '#000' }}>ස්තූතියි නැවත එන්න !</div>
                  <div style={{ margin: '4px 0', borderTop: '1px solid #000' }} />
                  <div style={{ fontSize: '11px', ...PB, letterSpacing: '0.3px' }}>Software by nebulainfinite - 078 3233 760</div>
                </div>

              </div>{/* end printWrapperRef */}
            </div>{/* end receiptRef */}
          </div>{/* end scrollable canvas */}
        </div>{/* end modal container */}
      </div>{/* end overlay */}
    </>
  );
};

export default InvoicePreviewModal;