import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { Invoice, Customer, Product, InvoiceItem } from '../../types/index';
import { X, Plus, Trash2, Search, Save, Calendar, User, FileText } from 'lucide-react';
import { SearchableSelect } from '../ui/searchable-select';
import { useTheme } from '../../contexts/ThemeContext';
import { useTranslation } from 'react-i18next';

interface InvoiceEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: Invoice | null;
  customers: Customer[];
  products: Product[];
  onSave: (invoice: Invoice) => void;
}

export const InvoiceEditModal: React.FC<InvoiceEditModalProps> = ({
  isOpen,
  onClose,
  invoice,
  customers,
  products,
  onSave,
}) => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const [editedInvoice, setEditedInvoice] = useState<Invoice | null>(null);
  const [productSearch, setProductSearch] = useState('');
  const [selectedProductId, setSelectedProductId] = useState('');
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    if (invoice) {
      setEditedInvoice({ ...invoice });
    }
  }, [invoice]);

  if (!editedInvoice) return null;

  const formatCurrency = (amount: number) => {
    return `Rs. ${amount.toLocaleString('en-LK', { minimumFractionDigits: 2 })}`;
  };

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.sku.toLowerCase().includes(productSearch.toLowerCase())
  );

  const currentCustomer = customers.find((c) => c.id === editedInvoice.customerId);

  const handleCustomerChange = (customerId: string) => {
    const customer = customers.find((c) => c.id === customerId);
    if (customer) {
      setEditedInvoice({
        ...editedInvoice,
        customerId,
        customerName: customer.name,
      });
    }
  };

  const handleStatusChange = (status: 'paid' | 'pending' | 'overdue') => {
    setEditedInvoice({ ...editedInvoice, status });
  };

  const handleDateChange = (field: 'issueDate' | 'dueDate', value: string) => {
    setEditedInvoice({ ...editedInvoice, [field]: value });
  };

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

    const existingItemIndex = editedInvoice.items.findIndex(
      (i) => i.productId === selectedProductId
    );

    let updatedItems: InvoiceItem[];
    if (existingItemIndex >= 0) {
      updatedItems = editedInvoice.items.map((item, index) =>
        index === existingItemIndex
          ? { ...item, quantity: item.quantity + quantity, total: (item.quantity + quantity) * item.unitPrice }
          : item
      );
    } else {
      updatedItems = [...editedInvoice.items, newItem];
    }

    const subtotal = updatedItems.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0
    );
    const tax = subtotal * 0.15;
    const total = subtotal + tax;

    setEditedInvoice({
      ...editedInvoice,
      items: updatedItems,
      subtotal: Math.round(subtotal * 100) / 100,
      tax: Math.round(tax * 100) / 100,
      total: Math.round(total * 100) / 100,
    });

    setSelectedProductId('');
    setProductSearch('');
    setQuantity(1);
  };

  const removeItem = (itemId: string) => {
    const updatedItems = editedInvoice.items.filter((i) => i.id !== itemId);
    const subtotal = updatedItems.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0
    );
    const tax = subtotal * 0.15;
    const total = subtotal + tax;

    setEditedInvoice({
      ...editedInvoice,
      items: updatedItems,
      subtotal: Math.round(subtotal * 100) / 100,
      tax: Math.round(tax * 100) / 100,
      total: Math.round(total * 100) / 100,
    });
  };

  const updateItemQuantity = (itemId: string, newQuantity: number) => {
    if (newQuantity <= 0) return;
    
    const updatedItems = editedInvoice.items.map((item) =>
      item.id === itemId ? { ...item, quantity: newQuantity } : item
    );
    
    const subtotal = updatedItems.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0
    );
    const tax = subtotal * 0.15;
    const total = subtotal + tax;

    setEditedInvoice({
      ...editedInvoice,
      items: updatedItems,
      subtotal: Math.round(subtotal * 100) / 100,
      tax: Math.round(tax * 100) / 100,
      total: Math.round(total * 100) / 100,
    });
  };

  const handleSave = () => {
    if (editedInvoice.items.length === 0) {
      alert('Please add at least one item to the invoice');
      return;
    }
    onSave(editedInvoice);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto p-0">
        <DialogHeader className="sr-only">
          <DialogTitle>Edit Invoice</DialogTitle>
          <DialogDescription>Edit invoice details, customer information, and line items</DialogDescription>
        </DialogHeader>
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-500 to-orange-600 p-6 text-white">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Edit Invoice</h2>
                <p className="text-amber-100 text-sm">{editedInvoice.invoiceNumber}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Customer & Status Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Customer Selection */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                <User className="w-4 h-4" />
                Customer
              </label>
              <SearchableSelect
                value={editedInvoice.customerId}
                onValueChange={(value) => handleCustomerChange(value)}
                placeholder="Select Customer"
                searchPlaceholder={t('common.search')}
                emptyMessage="No customers found"
                theme={theme}
                options={customers.map(customer => ({
                  value: customer.id,
                  label: `${customer.name} - ${customer.businessName}`,
                  icon: <User className="w-4 h-4" />
                }))}
              />
            </div>

            {/* Status Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Status
              </label>
              <div className="flex gap-2">
                {(['pending', 'paid', 'overdue'] as const).map((status) => (
                  <button
                    key={status}
                    onClick={() => handleStatusChange(status)}
                    className={`flex-1 px-3 py-2.5 rounded-lg font-medium text-sm transition-all ${
                      editedInvoice.status === status
                        ? status === 'paid'
                          ? 'bg-green-500 text-white'
                          : status === 'pending'
                          ? 'bg-yellow-500 text-white'
                          : 'bg-red-500 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Dates Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                <Calendar className="w-4 h-4" />
                Issue Date
              </label>
              <input
                type="date"
                value={editedInvoice.issueDate}
                onChange={(e) => handleDateChange('issueDate', e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                <Calendar className="w-4 h-4" />
                Due Date
              </label>
              <input
                type="date"
                value={editedInvoice.dueDate}
                onChange={(e) => handleDateChange('dueDate', e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          {/* Add Product Section */}
          <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4 space-y-3">
            <h4 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Add Product
            </h4>
            
            {/* Product Search */}
            <div className="relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search products..."
                value={productSearch}
                onChange={(e) => {
                  setProductSearch(e.target.value);
                  setSelectedProductId('');
                }}
                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            {/* Product List */}
            <div className="max-h-[150px] overflow-y-auto border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900">
              {filteredProducts.length === 0 ? (
                <div className="p-3 text-center text-slate-500 text-sm">No products found</div>
              ) : (
                filteredProducts.slice(0, 5).map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      setSelectedProductId(p.id);
                      setProductSearch(p.name);
                    }}
                    className={`w-full px-3 py-2 text-left border-b border-slate-100 dark:border-slate-800 last:border-b-0 transition-colors ${
                      selectedProductId === p.id
                        ? 'bg-amber-50 dark:bg-amber-900/20'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span className={`text-sm font-medium ${selectedProductId === p.id ? 'text-amber-700 dark:text-amber-400' : 'text-slate-900 dark:text-white'}`}>
                        {p.name}
                      </span>
                      <span className="text-sm text-slate-600 dark:text-slate-400">
                        Rs. {(p.retailPrice || p.price || 0).toLocaleString()}
                      </span>
                    </div>
                  </button>
                ))
              )}
            </div>

            {/* Quantity & Add */}
            <div className="flex gap-2">
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                placeholder="Qty"
                className="w-24 px-3 py-2.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
              <button
                onClick={addItem}
                disabled={!selectedProductId || quantity <= 0}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Item
              </button>
            </div>
          </div>

          {/* Items List */}
          <div>
            <h4 className="font-semibold text-slate-900 dark:text-white mb-3">
              Invoice Items ({editedInvoice.items.length})
            </h4>
            
            {editedInvoice.items.length === 0 ? (
              <div className="text-center py-8 text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 rounded-xl">
                No items added yet
              </div>
            ) : (
              <div className="space-y-2">
                {editedInvoice.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-slate-900 dark:text-white">
                        {item.productName}
                      </p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        {formatCurrency(item.unitPrice)} each
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateItemQuantity(item.id, item.quantity - 1)}
                        disabled={item.quantity <= 1}
                        className="w-8 h-8 flex items-center justify-center bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 disabled:opacity-50 rounded-lg transition-colors"
                      >
                        -
                      </button>
                      <span className="w-10 text-center font-medium text-slate-900 dark:text-white">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateItemQuantity(item.id, item.quantity + 1)}
                        className="w-8 h-8 flex items-center justify-center bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 rounded-lg transition-colors"
                      >
                        +
                      </button>
                    </div>
                    <p className="w-28 text-right font-semibold text-slate-900 dark:text-white">
                      {formatCurrency(item.quantity * item.unitPrice)}
                    </p>
                    <button
                      onClick={() => removeItem(item.id)}
                      className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Totals */}
          <div className="flex justify-end">
            <div className="w-72 bg-slate-50 dark:bg-slate-800 rounded-xl p-4 space-y-2">
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Subtotal</span>
                <span>{formatCurrency(editedInvoice.subtotal)}</span>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Tax (15%)</span>
                <span>{formatCurrency(editedInvoice.tax)}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-slate-200 dark:border-slate-700 text-lg font-bold text-slate-900 dark:text-white">
                <span>Total</span>
                <span className="text-amber-600 dark:text-amber-400">
                  {formatCurrency(editedInvoice.total)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="border-t border-slate-200 dark:border-slate-800 p-4 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-900 dark:text-white rounded-lg font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={editedInvoice.items.length === 0}
            className="flex items-center gap-2 px-6 py-2.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white rounded-lg font-medium transition-colors"
          >
            <Save className="w-4 h-4" />
            Save Changes
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default InvoiceEditModal;
