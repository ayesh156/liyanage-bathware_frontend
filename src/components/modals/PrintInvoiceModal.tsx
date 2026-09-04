import { Invoice, Customer, InvoiceItem } from '../../types/index';
import { translateToSinhala, getInvoiceHeaderSinhala } from '../../lib/sinhalaTranslator';
import { generateReceiptHTML } from '../../lib/receiptGenerator';

// Extended invoice item type for discounts and quick add
interface ExtendedInvoiceItem extends InvoiceItem {
  originalPrice?: number;
  discountType?: 'percentage' | 'fixed' | null;
  discountValue?: number;
  isCustomPrice?: boolean;
  isQuickAdd?: boolean;
}

// ============================================================
// A5 PRINT DESIGN (148mm × 210mm) - COMMENTED OUT FOR LATER USE
// ============================================================
/*
const generatePrintContentA5 = (invoice: Invoice, customer?: Customer | null): string => {
  const isPaid = invoice.status === 'paid';
  
  // Calculate discount
  const discType = (invoice as any).discountType;
  const discValue = (invoice as any).discountValue;
  let discountLabel = 'Discount';
  let discountAmount = invoice.discount;

  if (discType === 'percentage') {
    const perc = typeof discValue === 'number' ? discValue : invoice.discount;
    discountLabel = `Discount (${perc}%)`;
    discountAmount = Math.round((invoice.subtotal * (perc || 0)) / 100);
  } else if (discType === 'fixed') {
    const val = typeof discValue === 'number' ? discValue : invoice.discount;
    discountLabel = 'Discount';
    discountAmount = val;
  }

  // Generate items rows
  const itemsHtml = invoice.items.map((item, idx) => {
    const extItem = item as ExtendedInvoiceItem;
    const discountBadge = extItem.discountType ? 
      `<span style="display: inline-block; padding: 2px 6px; border-radius: 3px; font-size: 11px; font-weight: 600; margin-left: 4px; border: 1px solid #666; background: white; color: #000;">${extItem.discountType === 'percentage' ? `${extItem.discountValue}%` : `${extItem.discountValue}`} off</span>` : '';
    const quickBadge = extItem.isQuickAdd ? 
      `<span style="display: inline-block; padding: 2px 6px; border-radius: 3px; font-size: 11px; font-weight: 600; margin-left: 4px; border: 1px solid #666; background: white; color: #000;">Quick</span>` : '';
    
    return `
      <tr style="border-bottom: 1px solid #ccc; background: ${idx % 2 === 1 ? '#f5f5f5' : 'white'};">
        <td style="padding: 8px 10px; text-align: center; color: #666; font-weight: 500; font-size: 14px;">${idx + 1}</td>
        <td style="padding: 8px 10px; font-size: 14px;">
          <span style="font-weight: 500; color: #000;">${item.productName}</span>${discountBadge}${quickBadge}
        </td>
        <td style="padding: 8px 10px; text-align: center; font-size: 14px;">${item.quantity}</td>
        <td style="padding: 8px 10px; text-align: right; font-family: 'SF Mono', Consolas, monospace; color: #333; font-size: 14px;">${item.unitPrice.toLocaleString()}</td>
        <td style="padding: 8px 10px; text-align: right; font-family: 'SF Mono', Consolas, monospace; font-weight: 600; color: #000; font-size: 14px;">${item.total.toLocaleString()}</td>
      </tr>
    `;
  }).join('');

  // Discount row HTML
  const discountHtml = invoice.discount > 0 ? `
    <div style="display: flex; justify-content: space-between; padding: 5px 0; font-size: 14px;">
      <span style="color: #333;">${discountLabel}</span>
      <span style="font-family: 'SF Mono', Consolas, monospace; color: #000;">- ${Number(discountAmount).toLocaleString()}</span>
    </div>
  ` : '';

  // Notes HTML
  const notesHtml = invoice.notes ? `
    <div style="background: #f5f5f5; border: 1px solid #ccc; border-radius: 4px; padding: 12px 14px; margin-bottom: 12px;">
      <p style="font-size: 12px; font-weight: 700; color: #000; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">Notes</p>
      <p style="font-size: 13px; color: #333; line-height: 1.5;">${invoice.notes}</p>
    </div>
  ` : '';

  // Customer info
  const customerHtml = customer && customer.id !== 'walk-in' ? `
    <p style="font-size: 14px; color: #333; margin-top: 2px;">
      ${customer.businessName || ''}<br/>
      Tel: ${customer.phone || ''}
    </p>
  ` : '';

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Invoice ${invoice.invoiceNumber}</title>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
        <style>
          @page { size: 148mm 210mm; margin: 6mm; }
          html, body { height: 100%; margin: 0; padding: 0; }
          * { box-sizing: border-box; margin: 0; padding: 0; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          body { font-family: 'Inter', -apple-system, sans-serif; background: white; color: #000; font-size: 15pt; line-height: 1.4; }
        </style>
      </head>
      <body>
        <div style="width: 136mm; max-width: 100%; padding: 3px; margin: 0 auto; background: white; position: relative; font-family: 'Inter', sans-serif; font-size: 15px; color: #000; box-sizing: border-box;">
          <!-- Header — Clean centered logo, no text redundancy -->
          <div style="display: flex; flex-direction: column; align-items: center; padding-bottom: 12px; border-bottom: 2px solid #000; margin-bottom: 12px;">
            <img src="/inv_logo.jpg" alt="" style="width: 150px; height: auto; display: block; margin-bottom: 8px;" />
            <div style="display: flex; justify-content: space-between; width: 100%; align-items: flex-start; margin-top: 4px;">
              <div style="text-align: left;">
                <p style="font-size: 13px; color: #333; line-height: 1.5;">Hakmana Rd, Deiyandara<br/>Tel: 0705237647 / 0702629352 | info@liyanage.lk</p>
              </div>
              <div style="text-align: right;">
                <h2 style="font-size: 28px; font-weight: 800; color: #000; letter-spacing: 1px; white-space: nowrap;">INVOICE</h2>
                <p style="font-size: 18px; font-weight: 600; color: #000; margin-top: 4px;">${invoice.invoiceNumber}</p>
                <span style="display: inline-block; padding: 4px 12px; border-radius: 4px; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.3px; margin-top: 6px; border: 2px solid #000; background: ${isPaid ? '#000' : 'white'}; color: ${isPaid ? 'white' : '#000'};">${isPaid ? 'PAID' : 'PENDING'}</span>
              </div>
            </div>
          </div>

          <!-- Customer & Date Info -->
          <div style="display: flex; gap: 12px; margin-bottom: 12px;">
            <div style="flex: 1; padding: 12px 14px; background: #f5f5f5; border-radius: 4px; border-left: 3px solid #000;">
              <p style="font-size: 12px; font-weight: 700; color: #000; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 4px;">Bill To</p>
              <p style="font-size: 17px; font-weight: 600; color: #000;">${customer?.name || 'Walk-in Customer'}</p>
              ${customerHtml}
            </div>
            <div style="width: 130px; padding: 12px 14px; background: #f5f5f5; border-radius: 4px; border-left: 3px solid #000;">
              <p style="font-size: 12px; font-weight: 700; color: #000; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 4px;">Date</p>
              <p style="font-size: 16px; font-weight: 600; color: #000;">${new Date(invoice.issueDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
              <p style="font-size: 13px; color: #333; margin-top: 3px;">Due: ${new Date(invoice.dueDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}</p>
            </div>
          </div>

          <!-- Items Table -->
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 12px; font-size: 14px;">
            <thead>
              <tr style="background: #000;">
                <th style="color: white; font-weight: 700; text-transform: uppercase; letter-spacing: 0.3px; padding: 10px; font-size: 12px; width: 6%;">#</th>
                <th style="color: white; font-weight: 700; text-transform: uppercase; letter-spacing: 0.3px; padding: 10px; font-size: 12px; text-align: left;">Item</th>
                <th style="color: white; font-weight: 700; text-transform: uppercase; letter-spacing: 0px; padding: 10px; font-size: 12px; width: 10%; text-align: center; white-space: nowrap;">QTY</th>
                <th style="color: white; font-weight: 700; text-transform: uppercase; letter-spacing: 0.3px; padding: 10px; font-size: 12px; width: 22%; text-align: right;">PRICE</th>
                <th style="color: white; font-weight: 700; text-transform: uppercase; letter-spacing: 0.3px; padding: 10px; font-size: 12px; width: 22%; text-align: right;">TOTAL</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>

          <!-- Totals + Payment -->
          <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 12px;">
            <!-- Payment Badge (left) -->
            <div>
              <span style="display: inline-flex; align-items: center; gap: 4px; padding: 6px 14px; border-radius: 4px; font-size: 14px; font-weight: 600; border: 2px solid #000; background: white; color: #000;">
                ${invoice.paymentMethod === 'cash' ? 'Cash' : invoice.paymentMethod === 'card' ? 'Card' : invoice.paymentMethod === 'bank_transfer' ? 'Bank Transfer' : 'Credit'} Payment
              </span>
            </div>
            <!-- Totals Block (right) -->
            <div style="width: 180px;">
              <div style="display: flex; justify-content: space-between; padding: 5px 0; font-size: 14px;">
                <span style="color: #333;">Subtotal</span>
                <span style="font-family: 'SF Mono', Consolas, monospace; color: #000;">${invoice.subtotal.toLocaleString()}</span>
                </div>
                ${invoice.discount > 0 ? `
                <div style="display: flex; justify-content: space-between; padding: 5px 0; font-size: 14px;">
                  <span style="color: #333;">Discount</span>
                  <span>- ${Number(finalDiscount1).toLocaleString()}</span>
                </div>
                ` : ''}
              ${invoice.tax > 0 ? `
              <div style="display: flex; justify-content: space-between; padding: 5px 0; font-size: 14px;">
                <span style="color: #333;">Tax</span>
                <span style="font-family: 'SF Mono', Consolas, monospace; color: #000;">${invoice.tax.toLocaleString()}</span>
              </div>
              ` : ''}
              <div style="display: flex; justify-content: space-between; padding: 10px 14px; margin-top: 6px; border-radius: 4px; background: #000; color: white; font-weight: 700; font-size: 18px;">
                <span>Total</span>
                <span style="font-family: 'SF Mono', Consolas, monospace;">${invoice.total.toLocaleString()}</span>
              </div>
            </div>
          </div>

          <!-- Footer -->
          <hr style="border: none; border-top: 1px dashed #999; margin: 12px 0 8px 0;" />
          <p style="text-align: center; font-size: 11px; color: #666; letter-spacing: 0.5px;">© 2025 Powered by Nebulainfinite - 0783233760</p>
        </div>
      </body>
    </html>
  `;
};
*/
// ============================================================
// END OF A5 PRINT DESIGN
// ============================================================

// ============================================================
// 80mm THERMAL RECEIPT PRINTER (Xprinter) - Variable Length
// Optimized for paper savings - Always Sinhala output
// ============================================================

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

const generate80mmReceiptContent = (invoice: Invoice, customer?: Customer | null, language: 'en' | 'si' = 'en'): string => {
  // DYNAMIC PAYMENT STATUS (Sinhala): Pending Balance = Total - Paid.
  //   Paid <  Total  => unpaid / partial ("ගෙවිය යුතු")
  //   Paid >= Total  => fully paid / overpaid ("ගෙවා ඇත")
  // Computed from amounts to stay in sync with receiptGenerator.ts.
  const pendingBalance = Number((invoice.total - (invoice.receivedAmount || 0)).toFixed(2));
  const isPaid = pendingBalance <= 0;
  // Force Sinhala for all printed receipts regardless of system language
  const isSinhala = true;
  
  // Final discount (fixed amount)
  const finalDiscount1 = invoice.discount || 0;
  const totalFinalDiscount = finalDiscount1;
  
  // Received amount and change
  const receivedAmount = invoice.receivedAmount || 0;
  const changeAmount = invoice.changeAmount || (receivedAmount > 0 ? receivedAmount - invoice.total : 0);
  
  // Calculate total customer savings: price gap (displayPrice - ourPrice) × qty + manual invoice discount
  const totalItemDiscounts = invoice.items.reduce((sum, item) => {
    const ext = item as any;
    const displayPrice = Number(ext.displayPrice || ext.originalPrice || item.unitPrice || 0);
    const ourPrice = Number(ext.ourPrice || ext.salesPrice || item.unitPrice || 0);
    const gap = (displayPrice - ourPrice) * item.quantity;
    return sum + (gap > 0 ? gap : 0);
  }, 0);

  // Get Sinhala headers if needed
  const headers = isSinhala ? getInvoiceHeaderSinhala() : {};

  // Generate items rows - compact format for 80mm with columnar layout
  // Layout: Item Name on top, then columns: Qty | සදහන් මිල (displayPrice) | අපේ මිල (ourPrice) | Total
  const itemsHtml = invoice.items.map((item, idx) => {
    const extItem = item as any; // cast to access QuickInvoiceItem extended fields
    // Always use Sinhala name - translate if needed
    const displayName = item.productNameSi || translateToSinhala(item.productName);

    // සදහන් මිල: the publicly advertised/display price
    const displayPrice = Number(
      extItem.displayPrice ||
      extItem.originalPrice ||
      item.unitPrice ||
      0
    );

    // අපේ මිල: our actual selling price
    const ourPrice = Number(
      extItem.ourPrice ||
      extItem.salesPrice ||
      item.unitPrice ||
      0
    );

    // Line total: ourPrice × qty
    const lineTotal = ourPrice * item.quantity;

    // Show strikethrough on displayPrice only when it differs from ourPrice
    const hasPriceGap = displayPrice > ourPrice;

    return `
      <div style="border-bottom: 1px solid #000000; padding: 4px 0;">
        <div style="font-weight: 800; font-size: 12px; color: #000000; margin-bottom: 2px;">
          ${displayName}
        </div>
        <div style="display: flex; justify-content: space-between; font-size: 11px; font-weight: 700; font-family: 'Courier New', monospace; color: #000000;">
          <span style="width: 15%; text-align: center;">${item.quantity}</span>
          <span class="${hasPriceGap ? 'strikethrough-price' : ''}" style="width: 25%; text-align: right; color: #000000;">${formatPrice(displayPrice)}</span>
          <span class="${hasPriceGap ? 'discounted-price' : ''}" style="width: 25%; text-align: right; color: #000000; font-weight: 800;">${formatPrice(ourPrice)}</span>
          <span style="width: 30%; text-align: right; font-weight: 900;">${formatPrice(lineTotal)}</span>
        </div>
      </div>
    `;
  }).join('');

  // Customer info for receipt - only show if not walk-in
  const isWalkIn = !customer || customer.id === 'walk-in';
  const customerName = customer?.name 
    ? (customer.nameSi || translateToSinhala(customer.name))
    : 'සාමාන්‍ය පාරිභෝගිකයා';
  const customerPhone = customer && customer.id !== 'walk-in' ? customer.phone : '';

  // Payment method label (Sinhala only)
  const paymentLabel = invoice.paymentMethod === 'cash' ? 'මුදල්' : 
                       invoice.paymentMethod === 'card' ? 'කාඩ්පත' : 
                       invoice.paymentMethod === 'bank_transfer' ? 'බැංකුව' : 'ණය';

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Receipt ${invoice.invoiceNumber}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=FM+Abhaya&display=swap');
          .true-fm-font-branding {
            font-family: 'FM Abhaya', serif !important;
            font-weight: 800 !important;
            font-style: normal !important;
          }
          @page { 
            size: 80mm auto; 
            margin: 0 2px; 
          }
          @media print {
            html, body { 
              width: 80mm; 
              margin: 0; 
              padding: 0;
            }
            body, .receipt-container { padding-left: 2px !important; padding-right: 2px !important; }
          }

          /* ════════════════════════════════════════════════════════
             THERMAL RECEIPT PRINT MASTER RESET — PrintInvoiceModal
             Gradient fallback: background-image:linear-gradient
             NEVER stripped. * color override REMOVED.
             ════════════════════════════════════════════════════════ */
          * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
          @media print {
            * {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              color-adjust: exact !important;
            }
          }
          /* ── Grand Total black box — gradient cannot be stripped ── */
          .total-box {
            background-color: #000000 !important;
            background-image: linear-gradient(#000000, #000000) !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
            border: 2px solid #000000 !important;
          }
          .total-box, .total-box *, .total-box span, .total-box div {
            color: #ffffff !important;
          }
          /* ── Paid badge — gradient black bg ── */
          .status-paid {
            background-color: #000000 !important;
            background-image: linear-gradient(#000000, #000000) !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
            border: 2px solid #000000 !important;
          }
          .status-paid, .status-paid * { color: #ffffff !important; }
          .strikethrough-price {
            text-decoration: line-through !important;
            font-weight: 700 !important;
          }
          .discounted-price { font-weight: 800 !important; }
          hr { border: none !important; border-top: 1px dashed #000000 !important; }
          body {
            font-family: 'Segoe UI', Arial, sans-serif;
            background: #ffffff;
            color: #000000;
            font-weight: 700;
            font-size: 12px;
            line-height: 1.4;
            width: 80mm;
          }
        </style>
      </head>
      <body>
        <div class="receipt-container" style="width: 76mm; max-width: 100%; padding: 2px; margin: 0 auto; background: #ffffff; font-family: 'Segoe UI', Arial, sans-serif; font-size: 12px; font-weight: 700; color: #000000;">
          
          <!-- ═══ HEADER - Centered inv_logo.png + Sinhala Brand Title ═══ -->
          <div style="text-align: center; padding-bottom: 2px; border-bottom: 2px double #000;">
            <img src="/inv_logo.png" alt="" style="width: 100px; height: auto; display: block; margin: 0 auto;" />
            <div style="text-align: center; margin: 6px 0 4px 0; border-bottom: 1px solid #000000; padding-bottom: 4px;">
              <h1 
                class="true-fm-font-branding"
                style="font-size: 28px; letter-spacing: 0.1px; color: #000000; line-height: 1.1; margin: 0; padding: 2px 0;"
              >
                ලියනගේ බාත්වෙයාර්
              </h1>
            </div>
            <div style="font-size: 11px; font-weight: 700; color: #000000; margin-top: 3px; line-height: 1.4;">
              හක්මන පාර, දෙයියන්දර<br/>
              දුරකථන: 0705237647 / 0702629352<br/>
              Email: liyanagehardware1986@gmail.com
            </div>
          </div>

          <!-- ═══ INVOICE INFO BAR ═══ -->
          <div style="display: flex; justify-content: space-between; align-items: center; padding: 4px 0; border-bottom: 2px dashed #000000;">
            <div>
              <div style="font-size: 10px; font-weight: 700; color: #000000;">බිල්පත</div>
              <div style="font-size: 13px; font-weight: 800; font-family: 'Courier New', monospace; color: #000000;">${invoice.invoiceNumber}</div>
            </div>
            <div style="text-align: center;">
              <div class="${isPaid ? 'status-paid' : ''}" style="display: inline-block; padding: 2px 6px; border: 2px solid #000000; border-radius: 3px; font-size: 10px; font-weight: 800; background-color: ${isPaid ? '#000000' : '#ffffff'} !important; background-image: ${isPaid ? 'linear-gradient(#000000,#000000)' : 'none'} !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; color-adjust: exact;">
                <span style="color: ${isPaid ? '#ffffff' : '#000000'} !important; font-weight: 800;">${isPaid ? '✓ ගෙවා ඇත' : '○ ගෙවිය යුතු'}</span>
              </div>
            </div>
            <div style="text-align: right;">
              <div style="font-size: 10px; font-weight: 700; color: #000000;">දිනය</div>
              <div style="font-size: 11px; font-weight: 800; color: #000000;">${new Date(invoice.issueDate).toLocaleDateString('si-LK', { day: '2-digit', month: 'short', year: '2-digit' })}</div>
            </div>
          </div>

          <!-- ═══ CUSTOMER (only if not walk-in) ═══ -->
          ${!isWalkIn ? `
          <div style="padding: 3px 0; border-bottom: 2px dashed #000000;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <div>
                <span style="font-size: 10px; font-weight: 700; color: #000000;">පාරිභෝගිකයා: </span>
                <span style="font-size: 12px; font-weight: 800; color: #000000;">${customerName}</span>
              </div>
              ${customerPhone ? `<span style="font-size: 11px; font-weight: 700; color: #000000;">${customerPhone}</span>` : ''}
            </div>
          </div>
          ` : ''}

          <!-- ═══ ITEMS HEADER ═══ -->
          <div style="padding: 3px 0 2px 0; border-bottom: 2px solid #000000;">
            <div style="font-size: 11px; font-weight: 800; color: #000000; margin-bottom: 3px;">
              භාණ්ඩය
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 10px; font-weight: 800; color: #000000;">
              <span style="width: 15%; text-align: center;">ප්‍රමාණය</span>
              <span style="width: 25%; text-align: right;">සදහන් මිල</span>
              <span style="width: 25%; text-align: right;">අපේ මිල</span>
              <span style="width: 30%; text-align: right;">එකතුව</span>
            </div>
          </div>

          <!-- ═══ ITEMS LIST ═══ -->
          <div style="padding: 2px 0;">
            ${itemsHtml}
          </div>

          <!-- ═══ TOTALS SECTION ═══ -->
          <div style="border-top: 2px solid #000000; padding-top: 4px; margin-top: 2px;">
            ${totalFinalDiscount > 0 ? `
            <div style="display: flex; justify-content: space-between; padding: 2px 0; font-size: 12px; font-weight: 700; color: #000000;">
              <span>වට්ටම්</span>
              <span style="font-family: 'Courier New', monospace; font-weight: 800;">-${formatPrice(totalFinalDiscount)}</span>
            </div>
            ` : ''}
            ${invoice.tax > 0 ? `
            <div style="display: flex; justify-content: space-between; padding: 2px 0; font-size: 12px; font-weight: 700; color: #000000;">
              <span>බදු</span>
              <span style="font-family: 'Courier New', monospace; font-weight: 800;">${formatPrice(invoice.tax)}</span>
            </div>
            ` : ''}

            <!-- ═══ GRAND TOTAL BOX ═══ -->
            <div class="total-box" style="background-color: #000000 !important; background-image: linear-gradient(#000000, #000000) !important; color: #ffffff !important; padding: 6px; margin-top: 4px; border-radius: 3px; border: 2px solid #000000; -webkit-print-color-adjust: exact; print-color-adjust: exact; color-adjust: exact;">
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <span style="font-size: 15px; font-weight: 800; color: #ffffff !important;">මුළු එකතුව</span>
                <span style="font-size: 19px; font-weight: 900; font-family: 'Courier New', monospace; letter-spacing: 1px; color: #ffffff !important;">${formatPrice(invoice.total)}</span>
              </div>
            </div>

            <!-- Item count -->
            <div style="display: flex; justify-content: space-between; padding: 3px 0; font-size: 12px; font-weight: 700; color: #000000; margin-top: 2px;">
              <span>භාණ්ඩ සංඛ්‍යාව</span>
              <span style="font-weight: 800;">[${invoice.items.reduce((acc, i) => acc + i.quantity, 0)}]</span>
            </div>

            <!-- ═══ ඔබ ලැබූ ලාභය — always rendered when savings > 0 ═══ -->
            ${(totalItemDiscounts + totalFinalDiscount) > 0 ? `
            <div style="display: flex; justify-content: space-between; padding: 4px 0; font-size: 13px; font-weight: 800; color: #000000; border-top: 2px dashed #000000; margin-top: 4px; padding-top: 4px;">
              <span>ඔබ ලැබූ ලාභය</span>
              <span style="font-family: 'Courier New', monospace; font-weight: 900;">${formatPrice(totalItemDiscounts + totalFinalDiscount)}</span>
            </div>
            ` : ''}
          </div>

          <!-- ═══ PAYMENT INFO SECTION ═══ -->
          <div style="border-top: 2px dashed #000000; margin-top: 4px; padding-top: 4px;">
            ${receivedAmount > 0 ? `
            <div style="border: 1px solid #000000; padding: 4px 6px; border-radius: 3px;">
              <div style="display: flex; justify-content: space-between; padding: 2px 0; font-size: 12px; font-weight: 700; color: #000000;">
                <span>ගෙවූ මුදල</span>
                <span style="font-family: 'Courier New', monospace; font-weight: 800;">${formatPrice(receivedAmount)}</span>
              </div>
              <div style="display: flex; justify-content: space-between; padding: 2px 0; font-size: 12px; font-weight: 700; color: #000000;">
                <span>ඉතිරි මුදල</span>
                <span style="font-family: 'Courier New', monospace; font-weight: 800;">${formatPrice(changeAmount)}</span>
              </div>
            </div>
            ` : ''}
          </div>

          <!-- ═══ CASHIER ═══ -->
          <div style="padding: 3px 0; border-top: 1px dashed #000000; margin-top: 3px;">
            <div style="font-size: 11px; font-weight: 700; color: #000000;">
              <span>කැෂියර්: </span>
              <span style="font-weight: 800;">Admin</span>
            </div>
          </div>

          <!-- ═══ FOOTER ═══ -->
          <div style="text-align: center; padding-top: 6px; border-top: 2px dashed #000000;">
            <div style="font-size: 13px; font-weight: 800; color: #000000;">ස්තූතියි නැවත එන්න !</div>
            <div style="margin: 4px 0; border-top: 1px solid #000000;"></div>
            <div style="font-size: 11px; font-weight: 700; color: #000000; letter-spacing: 0.3px;">Software by nebulainfinite - 078 3233 760</div>
          </div>

        </div>
      </body>
    </html>
  `;
};

export const printInvoice = (invoice: Invoice, customer?: Customer | null, language: 'en' | 'si' = 'en', cashierName: string = 'Admin User'): Promise<void> => {
  return new Promise((resolve, reject) => {
    try {
      const printContent = generateReceiptHTML(invoice, customer, language, cashierName);

      // Remove any stale print iframe from a prior job
      const existing = document.getElementById('pos-print-iframe');
      if (existing) existing.remove();

      // Create a hidden, zero-dimension iframe — no popup, no new tab
      const iframe = document.createElement('iframe');
      iframe.id = 'pos-print-iframe';
      iframe.style.cssText = [
        'position:fixed',
        'top:0',
        'left:0',
        'width:0',
        'height:0',
        'border:none',
        'opacity:0',
        'pointer-events:none',
        'z-index:-9999',
      ].join(';');
      document.body.appendChild(iframe);

      const doc = iframe.contentWindow?.document ?? iframe.contentDocument;
      if (!doc) {
        iframe.remove();
        reject(new Error('Cannot access iframe document'));
        return;
      }

      doc.open();
      doc.write(printContent);
      doc.close();

      const dispatchPrint = () => {
        try {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
        } catch (err) {
          // Browser may suppress focus — print still fires in most cases
        }
        // Clean up after the print dialog closes (1.5 s grace period)
        setTimeout(() => {
          try { iframe.remove(); } catch (_) {}
          resolve();
        }, 1500);
      };

      if (
        iframe.contentDocument?.readyState === 'complete' ||
        iframe.contentWindow?.document?.readyState === 'complete'
      ) {
        setTimeout(dispatchPrint, 300);
      } else {
        iframe.onload = () => setTimeout(dispatchPrint, 300);
      }
    } catch (err) {
      reject(err);
    }
  });
};