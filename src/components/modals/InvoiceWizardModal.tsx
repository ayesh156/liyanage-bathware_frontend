import React, { useState, useMemo } from 'react';
import { Customer, Product, Invoice, InvoiceItem } from '../../types/index';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { ChevronLeft, ChevronRight, Plus, Trash2, Search, FileText, User, Package, Calendar, CheckCircle } from 'lucide-react';
import { printInvoice } from './PrintInvoiceModal';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';

interface InvoiceWizardModalProps {
  isOpen: boolean;
  customers: Customer[];
  products: Product[];
  onClose: () => void;
  onCreateInvoice: (invoice: Omit<Invoice, 'id'>) => Invoice;
}

type Step = 1 | 2 | 3;

interface TempInvoice {
  customerId: string;
  items: InvoiceItem[];
  issueDate: string;
  dueDate: string;
}

export const InvoiceWizardModal: React.FC<InvoiceWizardModalProps> = ({
  isOpen,
  customers,
  products,
  onClose,
  onCreateInvoice,
}) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { user: currentUser } = useAuth();
  const [step, setStep] = useState<Step>(1);
  const [selectedCustomer, setSelectedCustomer] = useState<string>('');
  const [customerSearch, setCustomerSearch] = useState<string>('');
  const [productSearch, setProductSearch] = useState<string>('');
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState(
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );

  const currentCustomer = customers.find((c) => c.id === selectedCustomer);
  const currentProduct = products.find((p) => p.id === selectedProductId);

  // Filter customers by search
  const filteredCustomers = useMemo(() => {
    if (!customerSearch.trim()) return customers;
    const searchLower = customerSearch.toLowerCase();
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(searchLower) ||
        c.businessName.toLowerCase().includes(searchLower) ||
        c.email.toLowerCase().includes(searchLower)
    );
  }, [customers, customerSearch]);

  // Filter products by search
  const filteredProducts = useMemo(() => {
    if (!productSearch.trim()) return products;
    // If search matches a selected product name exactly, show all products
    const selectedProduct = products.find(p => p.id === selectedProductId);
    if (selectedProduct && productSearch === selectedProduct.name) return products;
    
    const searchLower = productSearch.toLowerCase();
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(searchLower) ||
        p.sku.toLowerCase().includes(searchLower) ||
        p.category.toLowerCase().includes(searchLower)
    );
  }, [products, productSearch, selectedProductId]);

  const addItem = () => {
    if (!selectedProductId || quantity <= 0) return;
    const product = products.find((p) => p.id === selectedProductId);
    if (!product) return;

    const unitPrice = product.retailPrice || product.price || 0;
    const newItem: InvoiceItem = {
      id: `item-${Date.now()}`,
      productId: product.id,
      productName: product.name,
      quantity,
      unitPrice,
      total: quantity * unitPrice,
    };

    const existingItem = items.find((i) => i.productId === selectedProductId);
    if (existingItem) {
      setItems(
        items.map((i) =>
          i.productId === selectedProductId
            ? { ...i, quantity: i.quantity + quantity, total: (i.quantity + quantity) * i.unitPrice }
            : i
        )
      );
    } else {
      setItems([...items, newItem]);
    }

    setSelectedProductId('');
    setProductSearch('');
    setQuantity(1);
  };

  const removeItem = (itemId: string) => {
    setItems(items.filter((i) => i.id !== itemId));
  };

  const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const tax = subtotal * 0.15; // 15% tax
  const total = subtotal + tax;

  const handleCreateInvoice = () => {
    if (!selectedCustomer || items.length === 0) return;

    const customer = customers.find((c) => c.id === selectedCustomer);
    if (!customer) return;

    const invoiceNumber = `INV-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;
    const invoice: Omit<Invoice, 'id'> = {
      invoiceNumber,
      customerId: selectedCustomer,
      customerName: customer.name,
      items,
      subtotal: Math.round(subtotal * 100) / 100,
      tax: Math.round(tax * 100) / 100,
      total: Math.round(total * 100) / 100,
      issueDate,
      dueDate,
      status: 'pending',
      notes: '',
    };

    const createdInv = onCreateInvoice(invoice);
    
    // Print directly without preview modal
    printInvoice(createdInv, customer, 'en', currentUser?.name || 'Admin User').then(() => {
      handleClose();
    }).catch(() => {
      handleClose();
    });
  };

  const handleClose = () => {
    setStep(1);
    setSelectedCustomer('');
    setItems([]);
    setSelectedProductId('');
    setQuantity(1);
    setCustomerSearch('');
    setProductSearch('');
    setIssueDate(new Date().toISOString().split('T')[0]);
    setDueDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
    onClose();
  };

  const canProceedToStep2 = selectedCustomer;
  const canProceedToStep3 = items.length > 0;

  const getStepIcon = (stepNum: number) => {
    switch (stepNum) {
      case 1: return <User className="w-4 h-4" />;
      case 2: return <Package className="w-4 h-4" />;
      case 3: return <CheckCircle className="w-4 h-4" />;
      default: return null;
    }
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className={`max-w-5xl max-h-[90vh] overflow-y-auto p-0 ${
        theme === 'dark' ? 'bg-slate-900 border-slate-700/50' : 'bg-white border-slate-200'
      }`}>
        <DialogHeader className="sr-only">
          <DialogTitle>{t('invoices.addInvoice')}</DialogTitle>
          <DialogDescription>Create a new invoice in 3 easy steps</DialogDescription>
        </DialogHeader>
        {/* Gradient Header */}
        <div className="bg-gradient-to-r from-blue-600 via-cyan-600 to-teal-600 p-6 text-white" aria-hidden="true">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
              <FileText className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">{t('invoices.addInvoice')}</h2>
              <p className="text-blue-100 text-sm">Create a new invoice in 3 easy steps</p>
            </div>
          </div>
        </div>

        {/* Creative Progress Indicator */}
        <div className={`px-6 py-4 border-b ${
          theme === 'dark' ? 'bg-slate-800/50 border-slate-700/50' : 'bg-slate-100 border-slate-200'
        }`}>
          <div className="flex items-center justify-between max-w-lg mx-auto">
            {[1, 2, 3].map((s) => (
              <React.Fragment key={s}>
                <div className="flex flex-col items-center">
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-sm transition-all shadow-sm ${
                      s < step
                        ? 'bg-emerald-500 text-white'
                        : s === step
                        ? 'bg-blue-600 text-white ring-4 ring-blue-500/30'
                        : theme === 'dark' ? 'bg-slate-700 text-slate-400' : 'bg-slate-200 text-slate-500'
                    }`}
                  >
                    {s < step ? <CheckCircle className="w-5 h-5" /> : getStepIcon(s)}
                  </div>
                  <p className={`mt-2 text-xs font-medium ${
                    s <= step ? (theme === 'dark' ? 'text-white' : 'text-slate-900') : (theme === 'dark' ? 'text-slate-400' : 'text-slate-500')
                  }`}>
                    {s === 1 ? t('invoices.customer') : s === 2 ? t('invoices.items') : 'Review'}
                  </p>
                </div>
                {s < 3 && (
                  <div className={`flex-1 h-1 mx-3 rounded-full transition-colors ${
                    s < step ? 'bg-emerald-500' : (theme === 'dark' ? 'bg-slate-700' : 'bg-slate-200')
                  }`} />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 min-h-[400px]">
          {/* Step 1: Customer Selection */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                  <User className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <h3 className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Select a Customer</h3>
                  <p className={`text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>Choose who this invoice is for</p>
                </div>
              </div>
              
              {/* Customer Search */}
              <div className="relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search customers by name, business, or email..."
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                  className={`w-full pl-10 pr-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    theme === 'dark'
                      ? 'border-slate-700 bg-slate-800/50 text-white placeholder-slate-500'
                      : 'border-slate-300 bg-slate-50 text-slate-900 placeholder-slate-400'
                  }`}
                />
              </div>

              {filteredCustomers.length === 0 ? (
                <div className={`text-center py-8 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                  <p>No customers found matching "{customerSearch}"</p>
                </div>
              ) : (
              <div className="grid grid-cols-1 gap-3 max-h-[300px] overflow-y-auto">
                {filteredCustomers.map((customer) => (
                  <button
                    key={customer.id}
                    onClick={() => setSelectedCustomer(customer.id)}
                    className={`p-4 border-2 rounded-xl text-left transition-all ${
                      selectedCustomer === customer.id
                        ? 'border-blue-500 bg-blue-500/10'
                        : theme === 'dark' ? 'border-slate-700 hover:border-blue-500/50' : 'border-slate-200 hover:border-blue-500/50'
                    }`}
                  >
                    <p className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                      {customer.name}
                    </p>
                    <p className={`text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                      {customer.businessName}
                    </p>
                    <p className={`text-xs mt-1 ${theme === 'dark' ? 'text-slate-500' : 'text-slate-500'}`}>
                      {customer.email} • {customer.phone}
                    </p>
                  </button>
                ))}
              </div>
              )}
            </div>
          )}

          {/* Step 2: Add Items */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-cyan-500/20 rounded-lg flex items-center justify-center">
                  <Package className="w-5 h-5 text-cyan-400" />
                </div>
                <div>
                  <h3 className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Add Invoice Items</h3>
                  <p className={`text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>Select products and quantities</p>
                </div>
              </div>

              {/* Product Selection with Search */}
              <div className="space-y-2">
                <label className={`block text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                  Select Product
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Search and select a product..."
                    value={productSearch}
                    onChange={(e) => {
                      setProductSearch(e.target.value);
                      setSelectedProductId('');
                    }}
                    className={`w-full pl-10 pr-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      theme === 'dark'
                        ? 'border-slate-700 bg-slate-800/50 text-white placeholder-slate-500'
                        : 'border-slate-300 bg-slate-50 text-slate-900 placeholder-slate-400'
                    }`}
                  />
                </div>
                
                {/* Product List */}
                <div className={`max-h-[200px] overflow-y-auto border rounded-xl ${
                  theme === 'dark' ? 'border-slate-700' : 'border-slate-200'
                }`}>
                  {filteredProducts.length === 0 ? (
                    <div className={`p-4 text-center text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                      No products found
                    </div>
                  ) : (
                    filteredProducts.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => {
                          setSelectedProductId(p.id);
                          setProductSearch(p.name);
                        }}
                        className={`w-full px-4 py-3 text-left border-b last:border-b-0 transition-colors ${
                          theme === 'dark' ? 'border-slate-700/50' : 'border-slate-100'
                        } ${
                          selectedProductId === p.id
                            ? 'bg-blue-500/10'
                            : theme === 'dark' ? 'hover:bg-slate-800/50' : 'hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <p className={`font-medium ${selectedProductId === p.id ? 'text-blue-400' : (theme === 'dark' ? 'text-white' : 'text-slate-900')}`}>
                              {p.name}
                            </p>
                            <p className={`text-xs ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                              SKU: {p.sku} • {p.category}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                              Rs. {(p.retailPrice || p.price || 0).toLocaleString()}
                            </p>
                            <p className={`text-xs ${theme === 'dark' ? 'text-slate-500' : 'text-slate-500'}`}>Stock: {p.stock}</p>
                          </div>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>

              {currentProduct && (
                <div className="p-3 bg-blue-500/10 rounded-xl border border-blue-500/30">
                  <p className={`text-sm ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>
                    Available Stock: <span className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{currentProduct.stock}</span>
                  </p>
                </div>
              )}

              {/* Quantity */}
              <div className="flex gap-2 items-end">
                <div className="flex-1">
                  <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                    {t('invoices.quantity')}
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(parseInt(e.target.value))}
                    className={`w-full px-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      theme === 'dark'
                        ? 'border-slate-700 bg-slate-800/50 text-white'
                        : 'border-slate-300 bg-slate-50 text-slate-900'
                    }`}
                  />
                </div>
                <button
                  onClick={addItem}
                  disabled={!selectedProductId || quantity <= 0}
                  className="px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 disabled:opacity-50 text-white rounded-xl font-medium flex items-center gap-2 transition-all"
                >
                  <Plus className="w-4 h-4" />
                  {t('common.add')}
                </button>
              </div>

              {/* Items List */}
              <div className="space-y-2 mt-6">
                <h4 className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                  Items ({items.length})
                </h4>
                {items.length === 0 ? (
                  <p className={`text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                    No items added yet
                  </p>
                ) : (
                  <div className="space-y-2">
                    {items.map((item) => (
                      <div
                        key={item.id}
                        className={`p-3 rounded-xl border flex items-center justify-between ${
                          theme === 'dark' ? 'bg-slate-800/50 border-slate-700/50' : 'bg-slate-50 border-slate-200'
                        }`}
                      >
                        <div className="flex-1">
                          <p className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                            {item.productName}
                          </p>
                          <p className={`text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                            {item.quantity} × Rs. {item.unitPrice} = <span className="text-emerald-400">Rs.{' '}
                            {(item.quantity * item.unitPrice).toLocaleString()}</span>
                          </p>
                        </div>
                        <button
                          onClick={() => removeItem(item.id)}
                          className="p-2 hover:bg-red-500/10 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4 text-red-400" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 3: Review */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-teal-500/20 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-teal-400" />
                </div>
                <div>
                  <h3 className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Review Invoice</h3>
                  <p className={`text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>Confirm details before creating</p>
                </div>
              </div>

              {/* Customer Info */}
              <div className={`p-4 rounded-xl border ${
                theme === 'dark' ? 'bg-slate-800/50 border-slate-700/50' : 'bg-slate-50 border-slate-200'
              }`}>
                <p className={`text-sm mb-1 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                  Customer
                </p>
                <p className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                  {currentCustomer?.name}
                </p>
                <p className={`text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                  {currentCustomer?.businessName}
                </p>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                    {t('invoices.issueDate')}
                  </label>
                  <input
                    type="date"
                    value={issueDate}
                    onChange={(e) => setIssueDate(e.target.value)}
                    className={`w-full px-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      theme === 'dark'
                        ? 'border-slate-700 bg-slate-800/50 text-white'
                        : 'border-slate-300 bg-slate-50 text-slate-900'
                    }`}
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                    {t('invoices.dueDate')}
                  </label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className={`w-full px-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      theme === 'dark'
                        ? 'border-slate-700 bg-slate-800/50 text-white'
                        : 'border-slate-300 bg-slate-50 text-slate-900'
                    }`}
                  />
                </div>
              </div>

              {/* Items Table */}
              <div className={`rounded-xl overflow-hidden border ${
                theme === 'dark' ? 'bg-slate-800/50 border-slate-700/50' : 'bg-slate-50 border-slate-200'
              }`}>
                <table className="w-full text-sm">
                  <thead>
                    <tr className={`border-b ${theme === 'dark' ? 'border-slate-700' : 'border-slate-200'}`}>
                      <th className={`p-3 text-left ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>
                        Product
                      </th>
                      <th className={`p-3 text-right ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>
                        Qty
                      </th>
                      <th className={`p-3 text-right ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>
                        Price
                      </th>
                      <th className={`p-3 text-right ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item) => (
                      <tr key={item.id} className={`border-b ${theme === 'dark' ? 'border-slate-700/50' : 'border-slate-100'}`}>
                        <td className={`p-3 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                          {item.productName}
                        </td>
                        <td className={`p-3 text-right ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                          {item.quantity}
                        </td>
                        <td className={`p-3 text-right ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                          Rs. {item.unitPrice.toLocaleString()}
                        </td>
                        <td className="p-3 text-right font-semibold text-emerald-400">
                          Rs. {(item.quantity * item.unitPrice).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals */}
              <div className={`space-y-2 p-4 rounded-xl border ${
                theme === 'dark' ? 'bg-slate-800/50 border-slate-700/50' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className={`flex justify-between ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>
                  <span>Subtotal:</span>
                  <span>Rs. {subtotal.toLocaleString()}</span>
                </div>
                <div className={`flex justify-between ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>
                  <span>Tax (15%):</span>
                  <span>Rs. {tax.toLocaleString()}</span>
                </div>
                <div className={`flex justify-between font-bold text-lg pt-2 border-t ${
                  theme === 'dark' ? 'border-slate-700 text-white' : 'border-slate-200 text-slate-900'
                }`}>
                  <span>Total:</span>
                  <span className="text-emerald-400">
                    Rs. {total.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={`border-t p-4 flex gap-3 ${
          theme === 'dark' ? 'border-slate-700/50 bg-slate-800/30' : 'border-slate-200 bg-slate-50'
        }`}>
          {step > 1 && (
            <button
              onClick={() => setStep((prev) => (prev - 1) as Step)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium transition-colors border ${
                theme === 'dark'
                  ? 'bg-slate-700/50 hover:bg-slate-700 text-white border-slate-600/50'
                  : 'bg-white hover:bg-slate-100 text-slate-900 border-slate-300'
              }`}
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </button>
          )}

          <div className="flex-1" />

          {step < 3 && (
            <button
              onClick={() => setStep((prev) => (prev + 1) as Step)}
              disabled={step === 1 ? !canProceedToStep2 : !canProceedToStep3}
              className="flex items-center justify-center gap-2 px-6 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-medium transition-all shadow-lg shadow-blue-500/25"
            >
              Continue
              <ChevronRight className="w-4 h-4" />
            </button>
          )}

          {step === 3 && (
            <button
              onClick={handleCreateInvoice}
              className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl font-medium transition-all shadow-lg shadow-emerald-500/25"
            >
              <CheckCircle className="w-4 h-4" />
              Create Invoice
            </button>
          )}

          <button
            onClick={handleClose}
            className={`px-5 py-2.5 rounded-xl font-medium transition-colors border ${
              theme === 'dark'
                ? 'bg-slate-700/50 hover:bg-slate-700 text-white border-slate-600/50'
                : 'bg-white hover:bg-slate-100 text-slate-900 border-slate-300'
            }`}
          >
            {t('common.cancel')}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
