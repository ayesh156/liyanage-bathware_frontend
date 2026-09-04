import React, { useEffect, useRef, memo } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { Invoice, InvoiceItem, Customer } from '../types/index';
import { generateReceiptHTML } from '../lib/receiptGenerator';

export interface ThermalReceiptPreviewProps {
  /** Live cart items from QuickCheckout state */
  items: Array<InvoiceItem & {
    displayPrice?: number;
    ourPrice?: number;
    salesPrice?: number;
    lastPrice?: number;
    productNameSi?: string;
  }>;
  discount: number;
  receivedAmount: number;
  paymentMethod: 'cash' | 'credit';
  subtotal: number;
  total: number;
  customer?: Customer | null;
  invoiceNumber?: string;
  language?: 'en' | 'si';
  /** Dynamically rendered cashier's full name from logged-in user */
  cashierName?: string;
}

const ThermalReceiptPreview: React.FC<ThermalReceiptPreviewProps> = memo(({
  items,
  discount,
  receivedAmount,
  paymentMethod,
  subtotal,
  total,
  customer,
  invoiceNumber = 'PREVIEW',
  language = 'si',
  cashierName = 'Admin User',
}) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const previewShellRef = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  useEffect(() => {
    const today = new Date().toISOString();
    const changeAmount = receivedAmount > 0 ? receivedAmount - total : 0;

    // Build a live Invoice object mirroring what handleCheckout produces
    const previewInvoice: Invoice = {
      id: 'preview',
      invoiceNumber,
      customerId: customer?.id ?? 'walk-in',
      customerName: customer?.name ?? 'සාමාන්‍ය පාරිභෝගිකයා',
      items: items.map(item => ({
        ...item,
        // Strict field extraction — no || fallback that would corrupt 0-value prices
        salesPrice:   Number(item.salesPrice  ?? item.ourPrice ?? item.unitPrice),
        unitPrice:    Number(item.salesPrice  ?? item.ourPrice ?? item.unitPrice),
        total:        Number(item.salesPrice  ?? item.ourPrice ?? item.unitPrice) * item.quantity,
        displayPrice: Number(item.displayPrice ?? item.unitPrice),
        ourPrice:     Number(item.salesPrice  ?? item.ourPrice ?? item.unitPrice),
        cost:         Number((item as any).cost      ?? 0),
        lastPrice:    Number((item as any).lastPrice ?? 0),
      })) as any,
      subtotal,
      discount,
      tax: 0,
      total,
      receivedAmount: receivedAmount > 0 ? receivedAmount : undefined,
      changeAmount: changeAmount !== 0 ? changeAmount : undefined,
      issueDate: today,
      dueDate: today,
      status: paymentMethod === 'credit' ? 'pending' : 'paid',
      paymentMethod,
    };

    const html = generateReceiptHTML(previewInvoice, customer ?? null, language, cashierName);

    const iframe = iframeRef.current;
    if (!iframe) return;
    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!doc) return;
    doc.open();
    doc.write(html);
    doc.close();

    const applyPreviewScaling = () => {
      try {
        const body = doc.body;
        const shell = previewShellRef.current;
        const receiptRoot = body?.firstElementChild as HTMLElement | null;
        const previewScale = 1.05;

        if (body) {
          body.style.margin = '0';
          body.style.padding = '0';
          body.style.background = '#ffffff';
          body.style.display = 'flex';
          body.style.justifyContent = 'center';
          body.style.alignItems = 'flex-start';
          body.style.overflowX = 'hidden';
          body.style.width = '100%';
          body.style.minHeight = '100%';
          body.style.boxSizing = 'border-box';
        }

        if (receiptRoot) {
          receiptRoot.style.display = 'block';
          receiptRoot.style.margin = '0 auto';
          receiptRoot.style.transform = `scale(${previewScale})`;
          receiptRoot.style.transformOrigin = 'top left';
          receiptRoot.style.width = `${100 / previewScale}%`;
          receiptRoot.style.maxWidth = `${100 / previewScale}%`;
          receiptRoot.style.boxSizing = 'border-box';
          receiptRoot.style.minWidth = '0';
        }

        const contentHeight = Math.max(320, receiptRoot?.scrollHeight || body?.scrollHeight || 320);
        iframe.style.height = `${Math.ceil(contentHeight * previewScale)}px`;
        iframe.style.width = '100%';
        iframe.style.maxWidth = '100%';
      } catch (_) {}
    };

    iframe.onload = applyPreviewScaling;
    requestAnimationFrame(applyPreviewScaling);
    setTimeout(applyPreviewScaling, 180);
    window.addEventListener('resize', applyPreviewScaling);

    return () => window.removeEventListener('resize', applyPreviewScaling);
  }, [items, discount, receivedAmount, paymentMethod, subtotal, total, customer, invoiceNumber, language, cashierName]);

  return (
    <div className={`${isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-700'} border-2 shadow-lg rounded-xl p-4 flex flex-col gap-3`}>
      {/* Header bar */}
      <div className={`flex items-center justify-between border-b pb-2 ${isDark ? 'border-slate-700' : 'border-slate-600'}`}>
        <span className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse inline-block" />
          Live Receipt Preview
        </span>
        <span className={`text-[10px] font-bold font-mono ${isDark ? 'text-slate-300' : 'text-slate-800'}`}>{invoiceNumber}</span>
      </div>

      {/* Paper receipt container */}
      <div
        ref={previewShellRef}
        className={`w-full h-full flex flex-col items-center p-0 m-0 overflow-y-auto overflow-x-hidden bg-slate-900/5 box-border ${isDark ? 'rounded-xl shadow-slate-950/80 ring-1 ring-slate-800' : 'rounded-xl shadow-slate-700/40 ring-1 ring-slate-700'}`}
      >
        <div className="w-full min-w-full bg-white text-black px-1 py-4 shadow-none border-x-0 flex flex-col break-words box-border" style={{ width: '100% !important' }}>
          <iframe
            ref={iframeRef}
            title="receipt-preview"
            sandbox="allow-scripts allow-same-origin allow-modals"
            scrolling="no"
            style={{
              width: '100%',
              maxWidth: '100%',
              border: 'none',
              display: 'block',
              minHeight: '320px',
              backgroundColor: '#ffffff',
              overflow: 'visible',
              boxSizing: 'border-box',
              minWidth: '0',
            }}
          />
        </div>
      </div>
    </div>
  );
});

ThermalReceiptPreview.displayName = 'ThermalReceiptPreview';
export default ThermalReceiptPreview;