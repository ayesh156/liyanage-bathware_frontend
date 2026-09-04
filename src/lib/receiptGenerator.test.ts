import { describe, it, expect } from 'vitest';
import { generateReceiptHTML } from './receiptGenerator';
import type { Invoice } from '../types/index';

const baseInvoice: Invoice = {
  id: 'inv-test',
  invoiceNumber: 'INV-1001',
  customerId: 'walk-in',
  customerName: 'Walk-in Customer',
  items: [
    {
      id: 'item-1',
      productId: 'prod-1',
      productName: 'Test Item',
      productNameSi: 'පරීක්ෂණ අයිතමය',
      quantity: 2,
      unitPrice: 1200,
      originalPrice: 1500,
      total: 2400,
    },
  ],
  subtotal: 2400,
  discount: 0,
  tax: 0,
  total: 2400,
  receivedAmount: 2500,
  changeAmount: 100,
  issueDate: '2026-07-05',
  dueDate: '2026-08-04',
  status: 'paid',
  paymentMethod: 'cash',
} as Invoice;

describe('generateReceiptHTML', () => {
  it('uses the 80mm thermal layout and keeps display prices fully black', () => {
    const html = generateReceiptHTML(baseInvoice, null, 'si', 'Cashier Name');

    expect(html).toContain('width: 80mm');
    expect(html).toContain('size: 80mm auto');
    expect(html).not.toContain('opacity:0.6');
    expect(html).toContain('color:#000000');
  });

  it('wraps long product names onto multiple lines with ZERO ellipsis truncation', () => {
    // No productNameSi → the strict printing rule (productNameSi || productName)
    // falls back to this long English name, which is what the receipt emits.
    const longNameInvoice: Invoice = {
      ...baseInvoice,
      items: [
        {
          ...baseInvoice.items[0],
          id: 'item-long-1',
          productNameSi: undefined,
          productName:
            'GI GALVANIZED STEEL WATER PIPE 2 INCH CLASS C 6 METER LENGTH (G.I PIPE - HEAVY DUTY INDUSTRIAL GRADE)',
        },
      ],
    };

    const html = generateReceiptHTML(longNameInvoice, null, 'si', 'Cashier Name');

    // 1. Ellipsis truncation styles are GONE from the item name container
    expect(html).not.toContain('text-overflow:ellipsis');
    expect(html).not.toContain('overflow:hidden');

    // 2. Natural multi-line wrap styles are applied (inline !important beats
    //    the receipt master reset * { white-space:nowrap !important })
    expect(html).toContain('white-space:normal !important');
    expect(html).toContain('word-break:break-word !important');
    expect(html).toContain('overflow-wrap:break-word !important');
    expect(html).toContain('line-height:1.15');

    // 3. The FULL product name is emitted — nothing is cut off by CSS ellipsis
    expect(html).toContain(
      'GI GALVANIZED STEEL WATER PIPE 2 INCH CLASS C 6 METER LENGTH (G.I PIPE - HEAVY DUTY INDUSTRIAL GRADE)'
    );
  });
});
