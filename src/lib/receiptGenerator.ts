import { Invoice, Customer } from '../types/index';
import { translateToSinhala } from './sinhalaTranslator';

/**
 * Format price: show no decimals for whole numbers, keep 2 decimals for fractional.
 * Preserves thousand separators.
 */
function formatPrice(n: number): string {
  if (n % 1 === 0) {
    return n.toLocaleString('en-US');
  }
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/**
 * Safely format an invoice date to YYYY-MM-DD for the thermal receipt.
 * Guards against "Invalid Date" by validating timestamps and falling back to 
 * the current date whenever the raw value is null, undefined, empty, or unparseable.
 */
function formatInvoiceDate(rawDate: string | Date | undefined | null): string {
  if (!rawDate) {
    return new Date().toLocaleDateString('en-CA');
  }
  const parsed = new Date(rawDate);
  const isValid = !isNaN(parsed.getTime());
  const safeDate = isValid ? parsed : new Date();
  return safeDate.toLocaleDateString('en-CA');
}

/**
 * Normalize a customer phone number for receipt display.
 * Returns an empty string when the value is null, undefined, empty,
 * or a placeholder like "000000000" / "0000000000".
 */
function sanitizeCustomerPhone(phone: unknown): string {
  if (phone === null || phone === undefined) return '';
  const str = String(phone).trim();
  if (!str) return '';
  if (/^0+$/.test(str)) return ''; // all-zeros placeholder
  return str;
}

/**
 * Generates the complete 80mm thermal receipt HTML string.
 * Used by both the print executor (PrintInvoiceModal) and the
 * live ThermalReceiptPreview component — single source of truth.
 */
export const generateReceiptHTML = (
  invoice: Invoice,
  customer?: Customer | null,
  language: 'en' | 'si' = 'si',
  cashierName: string = 'Admin User'
): string => {
  const finalDiscount = invoice.discount || 0;
  const receivedAmount = invoice.receivedAmount || 0;

  // DYNAMIC PAYMENT STATUS (Sinhala):
  //   Pending Balance = Total Amount - Paid Amount
  //   Condition 1: Paid <  Total  -> "ගෙවිය යුතු" (unpaid / partial)
  //   Condition 2: Paid >= Total  -> "ගෙවා ඇත"   (fully paid / overpaid)
  // Computed from amounts (NOT invoice.status) so the live preview and
  // printed receipt update instantly as the user edits the payment input.
  const pendingBalance = Number((invoice.total - receivedAmount).toFixed(2));
  const isPaid = pendingBalance <= 0;

  // Signed changeAmount: positive = change (surplus), negative = deficit (amount still due)
  // If the backend stored a negative value, preserve it. Otherwise compute with sign.
  const changeAmount =
    invoice.changeAmount !== undefined
      ? invoice.changeAmount
      : (receivedAmount > 0 ? receivedAmount - invoice.total : 0);
  const isDeficit = receivedAmount > 0 && changeAmount < 0;
  const changeLabel = isDeficit ? 'හිග මුදල' : 'ඉතිරි මුදල';
  const displayChangeValue = isDeficit ? Math.abs(changeAmount) : changeAmount;

  // Customer savings: Σ((displayPrice - salesPrice) × qty) + manual discount
  const totalItemDiscounts = invoice.items.reduce((sum, item) => {
    const ext = item as any;
    const dp   = Number(ext.displayPrice ?? ext.originalPrice ?? item.unitPrice ?? 0);
    const sp   = Number(ext.salesPrice   ?? ext.ourPrice      ?? ext.lastPrice ?? item.unitPrice ?? 0);
    const gap  = (dp - sp) * item.quantity;
    return sum + (gap > 0 ? gap : 0);
  }, 0);

  const isWalkIn = !customer || customer.id === 'walk-in';
  const customerName = customer?.name
    ? ((customer as any).nameSi || translateToSinhala(customer.name))
    : 'සාමාන්‍ය පාරිභෝගිකයා';
  const customerPhone = !isWalkIn ? sanitizeCustomerPhone(customer?.phone) : '';

  const itemsHtml = invoice.items
    .map((item) => {
      const ext = item as any;
      const printedItemName = item.productNameSi || item.productName;
      const isPackage = printedItemName.includes('{') && printedItemName.includes('}');
      
      let titleHtml = '';
    if (isPackage) {
      const [mainTitlePart, subPart] = printedItemName.split('{');
      // 🌟 [Items: X] කොටසක් තිබේ නම් එය සම්පූර්ණයෙන්ම ඉවත් කර නම පමණක් ගැනීම
      const cleanMainTitle = mainTitlePart.replace(/\[Items:\s*\d+\]/gi, '').trim();
      
      const subItemsList = subPart ? subPart.replace('}', '').trim() : '';
      const subItemsArray = subItemsList
        .split('•')
        .map((s) => s.trim())
        .filter(Boolean);

      // 🌟 Package code එක නම ඉදිරියේ නොමැති නම් පමණක් [CODE] prefix එක එක් කිරීම
      const pkgCode = ext.barcode || ext.no || ext.searchKey || '';
      const hasCodeInTitle = cleanMainTitle.startsWith('[') && cleanMainTitle.includes(']');
      const codePrefix = (pkgCode && !hasCodeInTitle)
        ? `<span style="font-family:'Courier New',monospace;font-size:11px;background:#000;color:#fff;padding:1px 4px;border-radius:2px;margin-right:4px;">[${pkgCode}]</span>`
        : '';

      const ulItemsHtml = subItemsArray.map(itemStr => `<li style="margin-bottom:2px;list-style-type:disc;line-height:1.2;">${itemStr}</li>`).join('');

      titleHtml = `
        <div class="pkg-desc" style="white-space:normal !important;word-break:break-word !important;overflow-wrap:break-word !important;max-width:100%;">
          <div style="font-weight:900;font-size:13px;color:#000;line-height:1.2;margin-bottom:2px;">
            ${codePrefix}${cleanMainTitle}
          </div>
          ${ulItemsHtml ? `<ul style="font-size:10px;font-weight:700;color:#222;line-height:1.25;margin:2px 0 0 14px;padding:0;">${ulItemsHtml}</ul>` : ''}
        </div>
      `;
    } else {
      titleHtml = `<div style="font-weight:bold;font-size:13px;color:#000;margin-bottom:2px;line-height:1.15;max-width:100%;white-space:normal !important;word-break:break-word !important;overflow-wrap:break-word !important;display:block;">${printedItemName}</div>`;
    }

      const displayPrice = Number(
        ext.displayPrice ?? ext.originalPrice ?? item.unitPrice ?? 0
      );
      const salesPrice = Number(
        ext.salesPrice ?? ext.ourPrice ?? ext.lastPrice ?? item.unitPrice ?? 0
      );
      const lineTotal = salesPrice * item.quantity;
      const showStrikethrough = !isPackage && salesPrice < displayPrice;

      const displayPriceText = salesPrice > displayPrice ? '-' : formatPrice(displayPrice);
      const salesPriceText = formatPrice(salesPrice);

      const displayQty = Number(item.quantity) % 1 === 0
        ? Number(item.quantity).toString()
        : Number(item.quantity).toFixed(3).replace(/\.?0+$/, '');

      // ══════════════════════════════════════════════════════════
      // PACKAGE ROW — title + inline sub-items on the left; Qty and
      // Line Total stacked and vertically centered on the right with
      // a clean visual gap between them (no unit/display price dashes).
      // ══════════════════════════════════════════════════════════
      if (isPackage) {
        return `
      <div style="border-bottom:1px dashed #000;padding:5px 0;display:flex;align-items:flex-start;justify-content:space-between;gap:6px;width:100%;box-sizing:border-box;">
        <div style="flex:1;min-width:0;max-width:calc(100% - 85px);padding-right:4px;">
          ${titleHtml}
        </div>
        <div style="width:80px;display:flex;flex-direction:column;align-items:flex-end;justify-content:flex-start;gap:4px;flex-shrink:0;font-family:'Courier New',monospace;color:#000;padding-top:2px;">
          <span style="font-size:11px;font-weight:800;color:#333;white-space:nowrap !important;">Qty: ${displayQty}</span>
          <span style="font-size:15px;font-weight:900;white-space:nowrap !important;">${formatPrice(lineTotal)}</span>
        </div>
      </div>`;
      }

      return `
      <div style="border-bottom:1px dashed #000;padding:5px 0;">
        ${titleHtml}
        <div class="receipt-row" style="display:flex;justify-content:space-between;font-size:14px;font-weight:800;font-family:'Courier New',monospace;color:#000;width:100%;min-width:0;word-break:keep-all;overflow-wrap:normal;white-space:nowrap;">
          <span style="width:12%;text-align:center;flex-shrink:0;">${displayQty}</span>
          <span style="width:18%;text-align:right;padding-right:6px;flex-shrink:0;${showStrikethrough ? 'text-decoration:line-through;' : ''}color:#000;opacity:1;">${displayPriceText}</span>
          <span style="width:18%;text-align:right;font-weight:900;color:#000;flex-shrink:0;">${salesPriceText}</span>
          <span style="width:22%;text-align:right;font-weight:900;color:#000;flex-shrink:0;word-break:keep-all;overflow-wrap:normal;white-space:nowrap;">${formatPrice(lineTotal)}</span>
        </div>
      </div>`;
    })
    .join('');

  const totalSavings = totalItemDiscounts + finalDiscount;

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8"/>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Sinhala:wght@400;700;900&display=swap');
  /* ════════════════════════════════════════════════════════
     THERMAL RECEIPT PRINT MASTER RESET — receiptGenerator
     Gradient fallback strategy: background-image:linear-gradient
     is NEVER stripped by any browser print engine.
     * color override REMOVED — it silently kills white text.
     ════════════════════════════════════════════════════════ */
  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
    color-adjust: exact !important;
    word-break: keep-all !important;
    overflow-wrap: normal !important;
    white-space: nowrap !important;
  }
  /* 🌟 [PACKAGE SUB-ITEMS WRAPPING FIX] Sub-items මිල මත නොවැටී ස්වභාවිකව බිඳී පහළ පේළි වලට යාමට */
  .pkg-desc, .pkg-desc ul, .pkg-desc li, .pkg-desc div {
    white-space: normal !important;
    word-break: break-word !important;
    overflow-wrap: break-word !important;
  }
  @media print {
    * {
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
      color-adjust: exact !important;
      word-break: keep-all !important;
      overflow-wrap: normal !important;
      white-space: nowrap !important;
      min-width: 0 !important;
    }
  }
  .receipt-root, .receipt-row, .receipt-columns {
    width: 100% !important;
    min-width: 0 !important;
    table-layout: fixed !important;
    word-break: keep-all !important;
    overflow-wrap: normal !important;
    white-space: nowrap !important;
  }
  /* ── Grand Total black box — gradient cannot be stripped ── */
  .wb {
    background-color: #000000 !important;
    background-image: linear-gradient(#000000, #000000) !important;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
    color-adjust: exact !important;
    border: 2px solid #000000 !important;
  }
  .wb, .wb *, .wb span, .wb div { color: #ffffff !important; }
  /* ── Paid badge — gradient black bg ── */
  .status-paid-text {
    background-color: #000000 !important;
    background-image: linear-gradient(#000000, #000000) !important;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
    color-adjust: exact !important;
    border: 2px solid #000000 !important;
    color: #ffffff !important;
  }
  .status-paid-text * { color: #ffffff !important; }
  hr { border: none !important; border-top: 1px dashed #000000 !important; }
  @page {
    size: 80mm auto;
    margin: 0;
  }
  body {
    font-family: 'Segoe UI', 'Noto Sans Sinhala', Arial, sans-serif;
    background: #ffffff;
    font-weight: 700;
    font-size: 12px;
    line-height: 1.4;
    width: 80mm;
    color: #000000;
  }
</style>
</head>
<body>
<div class="receipt-root" style="width:80mm;padding:8px 12px;margin:0 auto;background:#fff;font-family:'Segoe UI','Noto Sans Sinhala',Arial,sans-serif;font-size:12px;font-weight:700;color:#000;">

  <!-- HEADER -->
  <div style="text-align:center;padding-bottom:4px;border-bottom:2px double #000;">
    <img src="/inv_logo.png" alt="" style="width:90px;height:auto;display:block;margin:0 auto;"/>
    <div style="margin:5px 0 3px;border-bottom:1px solid #000;padding-bottom:3px;">
      <div style="font-size:24px;font-weight:900;color:#000;line-height:1.1;">ලියනගේ බාත්වෙයාර්</div>
    </div>
    <div style="font-size:14px;font-weight:800;color:#000;line-height:1.5;">
      හක්මන පාර, දෙයියන්දර<br/>
      දුරකථන: 070-5237647 / 070-2629352<br/>
      Email: liyanagehardware1986@gmail.com
    </div>
  </div>

  <!-- INVOICE META -->
  <div style="display:flex;justify-content:space-between;align-items:center;padding:4px 0;border-bottom:2px dashed #000;">
    <div>
      <div style="font-size:11px;font-weight:700;">බිල්පත</div>
      <div style="font-size:15px;font-weight:900;font-family:'Courier New',monospace;">${invoice.invoiceNumber}</div>
    </div>
    <div style="text-align:center;">
      <div style="display:inline-block;padding:2px 6px;border:2px solid #000000;border-radius:3px;font-size:11px;font-weight:800;background-color:${isPaid ? '#000000' : '#ffffff'} !important;background-image:${isPaid ? 'linear-gradient(#000000,#000000)' : 'none'} !important;-webkit-print-color-adjust:exact;print-color-adjust:exact;color-adjust:exact;">
        <span style="color:${isPaid ? '#ffffff' : '#000000'} !important;font-weight:800;">${isPaid ? '✓ ගෙවා ඇත' : '○ ගෙවිය යුතු'}</span>
      </div>
    </div>
    <div style="text-align:right;">
      <div style="font-size:11px;font-weight:700;">දිනය</div>
      <div style="font-size:13px;font-weight:800;">${formatInvoiceDate(invoice.issueDate || (invoice as any).createdAt)}</div>
    </div>
  </div>

  ${!isWalkIn ? `
  <!-- CUSTOMER -->
  <div style="padding:3px 0;border-bottom:2px dashed #000;">
    <span style="font-size:11px;font-weight:700;">පාරිභෝගිකයා: </span>
    <span style="font-size:13px;font-weight:800;">${customerName}</span>
    ${customerPhone ? `<span style="float:right;font-size:12px;font-weight:700;">${customerPhone}</span>` : ''}
  </div>` : ''}

  <!-- ITEMS HEADER -->
  <div style="padding:3px 0 2px;border-bottom:2px solid #000;">
    <div style="font-size:13px;font-weight:800;margin-bottom:3px;">භාණ්ඩය</div>
    <div class="receipt-row" style="display:flex;justify-content:space-between;font-size:13px;font-weight:800;font-family:'Courier New',monospace;width:100%;min-width:0;word-break:keep-all;overflow-wrap:normal;white-space:nowrap;">
      <span style="width:12%;text-align:center;flex-shrink:0;">ප්‍රමාණය</span>
      <span style="width:18%;text-align:right;padding-right:6px;flex-shrink:0;">සඳහන් මිල</span>
      <span style="width:18%;text-align:right;flex-shrink:0;">අපේ මිල</span>
      <span style="width:22%;text-align:right;flex-shrink:0;">එකතුව</span>
    </div>
  </div>

  <!-- ITEMS -->
  <div style="padding:2px 0;">${itemsHtml}</div>

  <!-- TOTALS -->
  <div style="border-top:2px solid #000;padding-top:4px;margin-top:2px;">
    ${finalDiscount > 0 ? `
    <div style="display:flex;justify-content:space-between;padding:2px 0;font-size:13px;font-weight:800;">
      <span>වට්ටම්</span>
      <span style="font-family:'Courier New',monospace;font-weight:800;">-${formatPrice(finalDiscount)}</span>
    </div>` : ''}

    <!-- GRAND TOTAL -->
    <div class="wb" style="background-color:#000000 !important;background-image:linear-gradient(#000000,#000000) !important;color:#ffffff !important;padding:6px;margin-top:4px;border-radius:3px;border:2px solid #000000;-webkit-print-color-adjust:exact;print-color-adjust:exact;color-adjust:exact;">
      <div style="display:flex;justify-content:space-between;align-items:center;">
        <span style="font-size:15px;font-weight:800;color:#ffffff !important;">මුළු එකතුව</span>
        <span style="font-size:19px;font-weight:900;font-family:'Courier New',monospace;letter-spacing:1px;color:#ffffff !important;">${formatPrice(invoice.total)}</span>
      </div>
    </div>

    <!-- ITEM COUNT -->
    <div style="display:flex;justify-content:space-between;padding:3px 0;font-size:14px;font-weight:800;margin-top:2px;">
      <span>භාණ්ඩ සංඛ්‍යාව</span>
      <span style="font-weight:900;">[${(() => {
        return invoice.items.reduce((total, item) => {
          const name = item.productNameSi || item.productName || '';
          if (name.includes('{') && name.includes('}')) {
            const openIdx = name.indexOf('{');
            const closeIdx = name.lastIndexOf('}');
            const subItemsStr = name.slice(openIdx + 1, closeIdx);
            const matches = subItemsStr.match(/\(x(\d+)\)/g);
            let pkgCount = 0;
            if (matches) {
              pkgCount = matches.reduce((acc, m) => acc + parseInt(m.replace(/[^0-9]/g, ''), 10), 0);
            } else {
              pkgCount = subItemsStr.split('•').filter(Boolean).length;
            }
            return total + (pkgCount > 0 ? pkgCount * Number(item.quantity || 1) : Number(item.quantity || 1));
          }
          return total + Number(item.quantity || 1);
        }, 0);
      })()}]</span>
    </div>

    ${totalSavings > 0 ? `
    <!-- SAVINGS -->
    <div style="display:flex;justify-content:space-between;padding:4px 0;font-size:15px;font-weight:800;border-top:2px dashed #000;margin-top:4px;">
      <span>ඔබ ලැබූ ලාභය</span>
      <span style="font-family:'Courier New',monospace;font-weight:900;">${formatPrice(totalSavings)}</span>
    </div>` : ''}
  </div>

  ${receivedAmount > 0 ? `
  <!-- PAYMENT -->
  <div style="border-top:2px dashed #000;margin-top:4px;padding-top:4px;">
    <div style="border:1px solid #000;padding:4px 6px;border-radius:3px;">
      <div style="display:flex;justify-content:space-between;padding:2px 0;font-size:13px;font-weight:800;">
        <span>ගෙවූ මුදල</span>
        <span style="font-family:'Courier New',monospace;font-weight:800;">${formatPrice(receivedAmount)}</span>
      </div>
      <div style="display:flex;justify-content:space-between;padding:2px 0;font-size:13px;font-weight:800;">
        <span>${changeLabel}</span>
        <span style="font-family:'Courier New',monospace;font-weight:800;">${formatPrice(displayChangeValue)}</span>
      </div>
    </div>
  </div>` : ''}

  <!-- CASHIER -->
  <div style="padding:3px 0;border-top:1px dashed #000;margin-top:3px;">
    <span style="font-size:12px;font-weight:700;">කැෂියර්: </span>
    <span style="font-size:12px;font-weight:800;">${cashierName || 'Admin User'}</span>
  </div>

  <!-- FOOTER -->
  <div style="text-align:center;padding-top:6px;border-top:2px dashed #000;">
    <div style="font-size:14px;font-weight:800;">ස්තූතියි නැවත එන්න !</div>
    <div style="margin:4px 0;border-top:1px solid #000;"></div>
    <div style="font-size:12px;font-weight:700;letter-spacing:0.3px;">Software by nebulainfinite - 078 3233 760</div>
  </div>

</div>
</body>
</html>`;
};