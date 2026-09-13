import React, { useState, useMemo } from 'react';
import { useCatalog } from '../../contexts/CatalogContext';
import { useTheme } from '../../contexts/ThemeContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { Package, Plus, Trash2, Search, Boxes, Save, X } from 'lucide-react';
import { toast } from 'react-toastify';
import api from '../../lib/api';

interface SelectedPackageItem {
  productId: string;
  name: string;
  searchKey: string;
  qty: number;
  originalPrice: number;
}

interface PackageFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  editingProduct?: any | null; // 🌟 Edit mode එක සඳහා
}

export const PackageFormModal: React.FC<PackageFormModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  editingProduct = null,
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const { inventoryItems, refreshInventory, updateInventoryItem } = useCatalog();

  const [packageName, setPackageName] = useState('');
  const [packageNameSi, setPackageNameSi] = useState('');
  const [packageNo, setPackageNo] = useState(''); // 🌟 Package No සඳහා අලුත් state එක
  const [searchKey, setSearchKey] = useState('');
  const [packagePrice, setPackagePrice] = useState<number | ''>('');
  const [packageDisplayPrice, setPackageDisplayPrice] = useState<number | ''>(''); // 🌟 Display (Strike-through) Price
  const [packageStock, setPackageStock] = useState<number | ''>(10); // 🌟 Editable stock
  const [selectedItems, setSelectedItems] = useState<SelectedPackageItem[]>([]);
  const [productQuery, setProductQuery] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // 🌟 Edit mode එකේදී අගයන් ආපසු පිරවීම සහ Create mode එකේදී අලුත් No එකක් fetch කිරීම
  React.useEffect(() => {
    if (editingProduct) {
      setPackageName(editingProduct.name || '');
      setPackageNameSi(editingProduct.nameSinhala || editingProduct.nameSi || '');
      setPackageNo(editingProduct.no || ''); // 🌟 Edit mode: පවතින No එක පිරවීම
      setSearchKey(editingProduct.searchKey || '');
      setPackagePrice(Number(editingProduct.salesPrice) || '');
      setPackageDisplayPrice(Number(editingProduct.displayPrice) || '');
      setPackageStock(editingProduct.storeQty !== undefined ? Number(editingProduct.storeQty) : 10);
      if (Array.isArray(editingProduct.packageItems)) {
        setSelectedItems(
          editingProduct.packageItems.map((item: any) => ({
            productId: item.productId,
            name: item.name || '',
            searchKey: item.searchKey || '',
            qty: Number(item.qty || 1),
            originalPrice: Number(item.originalPrice || 0),
          }))
        );
      }
    } else {
      setPackageName('');
      setPackageNameSi('');
      setPackageNo('');
      setSearchKey('');
      setPackagePrice('');
      setPackageDisplayPrice('');
      setPackageStock(10);
      setSelectedItems([]);

      // 🌟 Create mode: Database එකෙන් මීළඟට එන්න ඕන No එක ලබාගැනීම
      if (isOpen) {
        const fetchNextNo = async () => {
          try {
            const res: any = await api.get('/products/next-no');
            const nextNo = res?.data?.nextNo || res?.nextNo || '';
            setPackageNo(nextNo);
          } catch (err) {
            console.warn('Failed to fetch next product no:', err);
          }
        };
        fetchNextNo();
      }
    }
  }, [editingProduct, isOpen]);

  // Search products to add into the package
  const searchResults = useMemo(() => {
    if (!productQuery.trim()) return [];
    const q = productQuery.toLowerCase().trim();
    return inventoryItems
      .filter((p: any) => !p.isPackage)
      .filter((p) =>
        p.name.toLowerCase().includes(q) ||
        p.searchKey.toLowerCase().includes(q) ||
        (p.no && String(p.no).includes(q))
      )
      .slice(0, 8);
  }, [inventoryItems, productQuery]);

  const addItemToPackage = (prod: any) => {
    const existing = selectedItems.find((i) => i.productId === prod.id);
    if (existing) {
      setSelectedItems(
        selectedItems.map((i) =>
          i.productId === prod.id ? { ...i, qty: i.qty + 1 } : i
        )
      );
    } else {
      setSelectedItems([
        ...selectedItems,
        {
          productId: prod.id,
          name: prod.nameSinhala || prod.name,
          searchKey: prod.searchKey,
          qty: 1,
          originalPrice: Number(prod.salesPrice || 0),
        },
      ]);
    }
    setProductQuery('');
  };

  const updateItemQty = (productId: string, qty: number) => {
    if (qty <= 0) {
      removeItem(productId);
      return;
    }
    setSelectedItems(
      selectedItems.map((i) => (i.productId === productId ? { ...i, qty } : i))
    );
  };

  const removeItem = (productId: string) => {
    setSelectedItems(selectedItems.filter((i) => i.productId !== productId));
  };

  const totalCalculatedValue = useMemo(() => {
    return selectedItems.reduce((acc, item) => acc + item.originalPrice * item.qty, 0);
  }, [selectedItems]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!packageNo.trim() || !packageName.trim() || !searchKey.trim() || !packagePrice || selectedItems.length === 0) {
      toast.error('කරුණාකර Package No, නම, Short Code, මිල සහ අඩුම තරමේ අයිටම් එකක්වත් ඇතුළත් කරන්න.');
      return;
    }

    setIsSaving(true);
    try {
      const cleanNo = packageNo.trim();
      const cleanKey = searchKey.trim().toUpperCase();

      const payload = {
        no: cleanNo, // 🌟 User type කළ හෝ Auto-fetch වූ අංකය යැවීම
        barcode: cleanKey,
        name: packageName.trim(),
        nameSinhala: packageNameSi.trim() || packageName.trim(),
        searchKey: cleanKey,
        salesPrice: Number(packagePrice),
        displayPrice: packageDisplayPrice ? Number(packageDisplayPrice) : (totalCalculatedValue > Number(packagePrice) ? totalCalculatedValue : Number(packagePrice)),
        cost: 0,
        lastPrice: Number(packagePrice),
        storeQty: Number(packageStock || 0),
        salesType: 'Set',
        productCategory: 'Packages',
        isPackage: true,
        packageItems: selectedItems.map((item) => ({
          productId: item.productId,
          name: item.name,
          qty: item.qty,
          originalPrice: item.originalPrice,
        })),
      };

      if (editingProduct?.id) {
        // 🌟 Edit Mode — PUT request
        const res: any = await api.put(`/products/${editingProduct.id}`, payload);
        const updatedData = res?.data || res || payload;
        
        if (updateInventoryItem) {
          updateInventoryItem(editingProduct.id, updatedData);
        }
        toast.success(`"${packageName}" Package එක සාර්ථකව යාවත්කාලීන විය!`);
      } else {
        // 🌟 Create Mode
        await api.post('/products', payload);
        toast.success(`"${packageName}" Package එක සාර්ථකව නිර්මාණය විය!`);
      }

      if (refreshInventory) await refreshInventory();
      if (onSuccess) onSuccess();
      onClose();

      // Reset
      setPackageName('');
      setPackageNameSi('');
      setPackageNo('');
      setSearchKey('');
      setPackagePrice('');
      setPackageDisplayPrice('');
      setSelectedItems([]);
    } catch (err: any) {
      // 🌟 [FIX] Duplicate No එරර් එකක් ආවොත් අදාළ error message එකම පෙන්වීම
      const errorMessage = err?.response?.data?.message || err?.message || 'Package එක Save කිරීම අසාර්ථකයි.';
      toast.error(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={`max-w-2xl max-h-[90vh] overflow-y-auto p-0 ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'}`}>
        <DialogHeader className="sr-only">
          <DialogTitle>Create New Package</DialogTitle>
          <DialogDescription>Add a product package bundle with items</DialogDescription>
        </DialogHeader>

        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <Boxes className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-bold">Create New Package / Set</h2>
              <p className="text-xs text-amber-100">භාණ්ඩ කිහිපයක් එකතු කර තනි පැකේජයක් ලෙස මිල නියම කරන්න</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-white/20">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Main info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Package No (Sequence) *</label>
              <input
                type="text"
                required
                placeholder="e.g. 1001"
                value={packageNo}
                onChange={(e) => {
                  // 🌟 අකුරු හෝ සංකේත යෙදීමෙන් වන error එක වළක්වා, අංක සහ අකුරු පමණක් (Alphanumeric) ගැනීමට
                  const val = e.target.value.replace(/[^a-zA-Z0-9-]/g, '');
                  setPackageNo(val);
                }}
                className={`w-full px-3 py-2 text-xs font-mono font-bold rounded-lg border ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'}`}
              />
            </div>
            <div>
              <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Shortcode / Search Key *</label>
              <input
                type="text"
                required
                placeholder="e.g. RC-SET"
                value={searchKey}
                onChange={(e) => setSearchKey(e.target.value)}
                className={`w-full px-3 py-2 text-xs font-mono font-bold uppercase rounded-lg border ${isDark ? 'bg-slate-800 border-slate-700 text-amber-400' : 'bg-slate-50 border-slate-300 text-amber-600'}`}
              />
            </div>
            <div>
              <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Package Name (English) *</label>
              <input
                type="text"
                required
                placeholder="e.g. Round Commode Full Set"
                value={packageName}
                onChange={(e) => setPackageName(e.target.value)}
                className={`w-full px-3 py-2 text-xs rounded-lg border ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'}`}
              />
            </div>
            <div>
              <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Package Name (සිංහල)</label>
              <input
                type="text"
                placeholder="උදා: රවුන්ඩ් කොමඩ් ෆුල් සෙට්"
                value={packageNameSi}
                onChange={(e) => setPackageNameSi(e.target.value)}
                className={`w-full px-3 py-2 text-xs rounded-lg border ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'}`}
              />
            </div>
            <div>
              <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Package Total Price (LKR) *</label>
              <input
                type="number"
                required
                min="0"
                placeholder="75000"
                value={packagePrice}
                onChange={(e) => setPackagePrice(e.target.value ? parseFloat(e.target.value) : '')}
                className={`w-full px-3 py-2 text-xs font-bold rounded-lg border ${isDark ? 'bg-slate-800 border-slate-700 text-emerald-400' : 'bg-slate-50 border-slate-300 text-emerald-600'}`}
              />
            </div>
            <div>
              <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Display Price (Crossed Out)</label>
              <input
                type="number"
                min="0"
                placeholder="e.g. 85000"
                value={packageDisplayPrice}
                onChange={(e) => setPackageDisplayPrice(e.target.value ? parseFloat(e.target.value) : '')}
                className={`w-full px-3 py-2 text-xs font-bold rounded-lg border ${isDark ? 'bg-slate-800 border-slate-700 text-pink-400' : 'bg-slate-50 border-slate-300 text-pink-600'}`}
              />
            </div>
            {/* 🌟 Package Available Quantity Field */}
            <div>
              <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Package Stock Quantity *</label>
              <input
                type="number"
                required
                min="0"
                placeholder="e.g. 10"
                value={packageStock}
                onChange={(e) => setPackageStock(e.target.value ? parseInt(e.target.value, 10) : '')}
                className={`w-full px-3 py-2 text-xs font-bold rounded-lg border ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'}`}
              />
            </div>
          </div>

          {/* Add Products to Package */}
          <div className={`p-3 rounded-xl border ${isDark ? 'bg-slate-800/40 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
            <label className={`block text-xs font-bold mb-1.5 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
              පැකේජයට අයිටම්ස් එකතු කරන්න ({selectedItems.length} items added)
            </label>
            <div className="relative mb-2">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search products by name, code or number..."
                value={productQuery}
                onChange={(e) => setProductQuery(e.target.value)}
                className={`w-full pl-9 pr-3 py-2 text-xs rounded-lg border ${isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'}`}
              />

              {searchResults.length > 0 && (
                <div className={`absolute left-0 right-0 top-full mt-1 z-50 rounded-lg border shadow-xl max-h-48 overflow-y-auto ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'}`}>
                  {searchResults.map((p) => (
                    <div
                      key={p.id}
                      onClick={() => addItemToPackage(p)}
                      className={`p-2 flex items-center justify-between text-xs cursor-pointer border-b last:border-b-0 ${isDark ? 'hover:bg-slate-800 border-slate-800 text-white' : 'hover:bg-slate-100 border-slate-100 text-slate-800'}`}
                    >
                      <div>
                        <p className="font-semibold">{p.nameSinhala || p.name}</p>
                        <p className="text-[10px] text-slate-400">{p.searchKey} · Stock: {p.storeQty}</p>
                      </div>
                      <span className="font-mono text-emerald-500 font-bold">Rs. {Number(p.salesPrice).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Selected Items List */}
            {selectedItems.length > 0 ? (
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {selectedItems.map((item, idx) => (
                  <div
                    key={item.productId}
                    className={`flex items-center justify-between p-2 rounded-lg text-xs border ${isDark ? 'bg-slate-800 border-slate-700/60' : 'bg-white border-slate-200'}`}
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0 pr-2">
                      <span className="text-[10px] text-slate-400 font-mono">#{idx + 1}</span>
                      <span className="truncate font-medium">{item.name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] text-slate-400">Qty:</span>
                        <input
                          type="number"
                          min="1"
                          value={item.qty}
                          onChange={(e) => updateItemQty(item.productId, parseInt(e.target.value) || 1)}
                          className={`w-12 text-center py-0.5 rounded border text-xs font-bold ${isDark ? 'bg-slate-900 border-slate-600 text-white' : 'bg-slate-50 border-slate-300'}`}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => removeItem(item.productId)}
                        className="text-red-500 hover:text-red-600 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center py-4 text-xs text-slate-400">පැකේජයට තවමත් භාණ්ඩ එකතු කර නැත.</p>
            )}
          </div>

          <div className="flex justify-between items-center text-xs pt-1">
            <span className="text-slate-400">Items Individual Total: <b className="text-slate-300">Rs. {totalCalculatedValue.toLocaleString()}</b></span>
            {packagePrice && Number(packagePrice) > 0 && (
              <span className="text-emerald-500 font-bold">Package Offer Price: Rs. {Number(packagePrice).toLocaleString()}</span>
            )}
          </div>

          {/* Submit */}
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-700/50">
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2 text-xs rounded-xl font-medium border ${isDark ? 'border-slate-700 text-slate-300' : 'border-slate-300 text-slate-600'}`}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2 text-xs rounded-xl font-bold bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white flex items-center gap-1.5 shadow-lg shadow-amber-500/20"
            >
              <Save className="w-3.5 h-3.5" />
              {isSaving ? 'Saving...' : 'Save Package'}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};