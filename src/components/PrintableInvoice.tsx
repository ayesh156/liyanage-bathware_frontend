import React, { forwardRef } from 'react';
import { Invoice, Customer } from '../types/index';

interface PrintableInvoiceProps {
  invoice: Invoice;
  customer?: Customer;
}

export const PrintableInvoice = forwardRef<HTMLDivElement, PrintableInvoiceProps>(
  ({ invoice, customer }, ref) => {
    const formatCurrency = (amount: number) => {
      return `Rs. ${amount.toLocaleString('en-LK', { minimumFractionDigits: 2 })}`;
    };

    const formatDate = (dateString: string) => {
      return new Date(dateString).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    };

    return (
      <div ref={ref} className="print-invoice">
        <style>{`
          @media print {
            @page {
              size: A4;
              margin: 10mm 12mm;
            }
            
            * {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            
            body {
              margin: 0;
              padding: 0;
              background: white;
            }
            
            .print-invoice {
              width: 100%;
              max-width: 180mm;
              padding: 0;
              margin: 0 auto;
              background: white !important;
              color: #000 !important;
              font-family: 'Segoe UI', 'Inter', -apple-system, sans-serif;
              font-size: 11pt;
              line-height: 1.4;
            }
            
            .no-print {
              display: none !important;
            }

            table {
              page-break-inside: avoid;
            }
          }
          
          .print-invoice {
            width: 210mm;
            min-height: 297mm;
            padding: 12mm 15mm;
            margin: 0 auto;
            background: white;
            color: #000;
            font-family: 'Segoe UI', 'Inter', -apple-system, sans-serif;
            font-size: 11pt;
            line-height: 1.4;
            box-sizing: border-box;
          }

          .invoice-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 3px solid #1e40af;
          }

          .company-info h1 {
            font-size: 28pt;
            font-weight: 700;
            color: #1e40af;
            margin: 0 0 5px 0;
            letter-spacing: -0.5px;
          }

          .company-info .tagline {
            font-size: 9pt;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 2px;
            margin-bottom: 15px;
          }

          .company-info .details {
            font-size: 9pt;
            color: #475569;
            line-height: 1.6;
          }

          .invoice-title {
            text-align: right;
          }

          .invoice-title h2 {
            font-size: 32pt;
            font-weight: 700;
            color: #1e40af;
            margin: 0;
            letter-spacing: 3px;
          }

          .invoice-title .invoice-number {
            font-size: 14pt;
            font-weight: 600;
            color: #334155;
            margin-top: 10px;
          }

          .invoice-meta {
            display: flex;
            justify-content: space-between;
            margin-bottom: 25px;
            gap: 30px;
          }

          .meta-box {
            flex: 1;
            padding: 15px 20px;
            background: #f8fafc;
            border-left: 4px solid #1e40af;
          }

          .meta-box.right {
            border-left: none;
            border-right: 4px solid #1e40af;
            text-align: right;
          }

          .meta-box label {
            display: block;
            font-size: 8pt;
            font-weight: 600;
            color: #1e40af;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 8px;
          }

          .meta-box .name {
            font-size: 13pt;
            font-weight: 600;
            color: #0f172a;
            margin-bottom: 5px;
          }

          .meta-box .info {
            font-size: 9pt;
            color: #475569;
            line-height: 1.5;
          }

          .items-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 25px;
          }

          .items-table thead th {
            background: #1e40af;
            color: white;
            font-size: 9pt;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            padding: 12px 15px;
            text-align: left;
          }

          .items-table thead th:first-child {
            width: 8%;
            text-align: center;
          }

          .items-table thead th:nth-child(3) {
            width: 10%;
            text-align: center;
          }

          .items-table thead th:nth-child(4),
          .items-table thead th:nth-child(5) {
            width: 18%;
            text-align: right;
          }

          .items-table tbody tr {
            border-bottom: 1px solid #e2e8f0;
          }

          .items-table tbody tr:nth-child(even) {
            background: #f8fafc;
          }

          .items-table tbody td {
            padding: 12px 15px;
            font-size: 10pt;
            color: #334155;
          }

          .items-table tbody td:first-child {
            text-align: center;
            color: #64748b;
            font-weight: 500;
          }

          .items-table tbody td:nth-child(2) {
            font-weight: 500;
            color: #0f172a;
          }

          .items-table tbody td:nth-child(3) {
            text-align: center;
          }

          .items-table tbody td:nth-child(4),
          .items-table tbody td:nth-child(5) {
            text-align: right;
            font-family: 'Consolas', 'Monaco', monospace;
          }

          .items-table tbody td:nth-child(5) {
            font-weight: 600;
            color: #0f172a;
          }

          .totals-section {
            display: flex;
            justify-content: flex-end;
            margin-bottom: 30px;
          }

          .totals-box {
            width: 280px;
          }

          .totals-row {
            display: flex;
            justify-content: space-between;
            padding: 8px 15px;
            font-size: 10pt;
          }

          .totals-row.subtotal {
            border-bottom: 1px solid #e2e8f0;
          }

          .totals-row .label {
            color: #64748b;
          }

          .totals-row .value {
            font-family: 'Consolas', 'Monaco', monospace;
            color: #334155;
            font-weight: 500;
          }

          .totals-row.total {
            background: #1e40af;
            color: white;
            font-size: 12pt;
            font-weight: 700;
            margin-top: 8px;
            padding: 12px 15px;
          }

          .totals-row.total .value {
            color: white;
            font-size: 14pt;
          }

          .status-badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 12px;
            font-size: 8pt;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }

          .status-paid {
            background: #dcfce7;
            color: #166534;
          }

          .status-pending {
            background: #fef3c7;
            color: #92400e;
          }

          .status-overdue {
            background: #fee2e2;
            color: #dc2626;
          }

          .notes-section {
            background: #fffbeb;
            border: 1px solid #fde68a;
            border-radius: 6px;
            padding: 15px 20px;
            margin-bottom: 20px;
          }

          .notes-section label {
            display: block;
            font-size: 8pt;
            font-weight: 600;
            color: #92400e;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 8px;
          }

          .notes-section p {
            font-size: 9pt;
            color: #78350f;
            margin: 0;
            line-height: 1.5;
          }

          .terms-section {
            background: #f8fafc;
            border-radius: 6px;
            padding: 15px 20px;
            margin-bottom: 25px;
          }

          .terms-section label {
            display: block;
            font-size: 8pt;
            font-weight: 600;
            color: #475569;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 10px;
          }

          .terms-section ul {
            margin: 0;
            padding-left: 18px;
            font-size: 8pt;
            color: #64748b;
            line-height: 1.7;
          }

          .footer {
            border-top: 2px solid #e2e8f0;
            padding-top: 20px;
            text-align: center;
          }

          .footer .thank-you {
            font-size: 12pt;
            font-weight: 600;
            color: #1e40af;
            margin-bottom: 8px;
          }

          .footer .contact {
            font-size: 9pt;
            color: #64748b;
          }

          .footer .contact a {
            color: #1e40af;
            text-decoration: none;
            font-weight: 500;
          }

          .footer .tagline-footer {
            margin-top: 15px;
            padding-top: 15px;
            border-top: 1px solid #e2e8f0;
            font-size: 8pt;
            color: #94a3b8;
            letter-spacing: 0.5px;
          }
        `}</style>

        {/* Header */}
        <div className="invoice-header">
          <div className="company-info">
            <h1>Liyanage Hardware</h1>
            <div className="tagline">Professional Hardware Solutions</div>
            <div className="details">
              No. 45, Galle Road, Colombo 03, Sri Lanka<br />
              Tel: +94 11 234 5678 | Mobile: +94 77 123 4567<br />
              Email: billing@liyanage.lk<br />
              Web: www.liyanage.lk
            </div>
          </div>
          <div className="invoice-title">
            <h2>INVOICE</h2>
            <div className="invoice-number">{invoice.invoiceNumber}</div>
          </div>
        </div>

        {/* Bill To & Invoice Details */}
        <div className="invoice-meta">
          <div className="meta-box">
            <label>Bill To</label>
            <div className="name">{invoice.customerName}</div>
            {customer && (
              <div className="info">
                {customer.businessName}<br />
                {customer.address}<br />
                {customer.phone}<br />
                {customer.email}
              </div>
            )}
          </div>
          <div className="meta-box right">
            <label>Invoice Details</label>
            <div className="info">
              <strong>Issue Date:</strong> {formatDate(invoice.issueDate)}<br />
              <strong>Due Date:</strong> {formatDate(invoice.dueDate)}<br />
              <strong>Status:</strong>{' '}
              <span className={`status-badge status-${invoice.status}`}>
                {invoice.status}
              </span>
            </div>
          </div>
        </div>

        {/* Items Table */}
        <table className="items-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Description</th>
              <th>Qty</th>
              <th>Unit Price</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            {invoice.items.map((item, index) => (
              <tr key={item.id}>
                <td>{String(index + 1).padStart(2, '0')}</td>
                <td>{item.productName}</td>
                <td>{item.quantity}</td>
                <td>{formatCurrency(item.unitPrice)}</td>
                <td>{formatCurrency(item.quantity * item.unitPrice)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals */}
        <div className="totals-section">
          <div className="totals-box">
            {/* Calculate original subtotal and item discounts */}
            {(() => {
              const originalSubtotal = invoice.items.reduce((sum, item) => {
                const origPrice = item.originalPrice || item.unitPrice;
                return sum + (origPrice * item.quantity);
              }, 0);
              const totalItemDiscounts = invoice.items.reduce((sum, item) => {
                const origPrice = item.originalPrice || item.unitPrice;
                const discount = (origPrice - item.unitPrice) * item.quantity;
                return sum + (discount > 0 ? discount : 0);
              }, 0);
              const invoiceDiscount = invoice.discount || 0;
              
              return (
                <>
                  {/* Show original subtotal if there are item discounts */}
                  {totalItemDiscounts > 0 && (
                    <div className="totals-row">
                      <span className="label">Original Subtotal</span>
                      <span className="value">{formatCurrency(originalSubtotal)}</span>
                    </div>
                  )}
                  {/* Item Discounts */}
                  {totalItemDiscounts > 0 && (
                    <div className="totals-row discount">
                      <span className="label">- Item Discounts</span>
                      <span className="value">-{formatCurrency(totalItemDiscounts)}</span>
                    </div>
                  )}
                  {/* Subtotal (after item discounts) */}
                  <div className="totals-row subtotal">
                    <span className="label">Subtotal</span>
                    <span className="value">{formatCurrency(invoice.subtotal)}</span>
                  </div>
                  {/* Invoice-level discount */}
                  {invoiceDiscount > 0 && (
                    <div className="totals-row discount">
                      <span className="label">- Discount</span>
                      <span className="value">-{formatCurrency(invoiceDiscount)}</span>
                    </div>
                  )}
                  {/* Tax */}
                  {invoice.tax > 0 && (
                    <div className="totals-row">
                      <span className="label">Tax ({invoice.taxRate || 15}%)</span>
                      <span className="value">{formatCurrency(invoice.tax)}</span>
                    </div>
                  )}
                </>
              );
            })()}
            <div className="totals-row total">
              <span className="label">Total Amount</span>
              <span className="value">{formatCurrency(invoice.total)}</span>
            </div>
          </div>
        </div>

        {/* Notes */}
        {invoice.notes && (
          <div className="notes-section">
            <label>Notes</label>
            <p>{invoice.notes}</p>
          </div>
        )}

        {/* Terms */}
        <div className="terms-section">
          <label>Terms & Conditions</label>
          <ul>
            <li>Payment is due within 30 days of invoice date.</li>
            <li>Please include invoice number with your payment.</li>
            <li>Late payments may incur additional charges.</li>
            <li>Goods remain property of Liyanage Hardware until full payment is received.</li>
          </ul>
        </div>

        {/* Footer */}
        <div className="footer">
          <div className="thank-you">Thank you for your business!</div>
          <div className="contact">
            Questions? Contact us at <a href="mailto:info@liyanage.lk">info@liyanage.lk</a> or call <a href="tel:+94112345678">+94 11 234 5678</a>
          </div>
          <div className="tagline-footer">
            Quality Products • Fast Delivery • Customer Satisfaction Guaranteed
          </div>
        </div>
      </div>
    );
  }
);

PrintableInvoice.displayName = 'PrintableInvoice';

export default PrintableInvoice;
