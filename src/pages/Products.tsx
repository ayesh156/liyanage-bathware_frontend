import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../contexts/ThemeContext';
import { useIsMobile } from '../hooks/use-mobile';
import { useCatalog } from '../contexts/CatalogContext';
import {
  Package, Plus, AlertTriangle, XCircle,
  Box, BarChart3, ScanLine
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { InventoryProduct } from '../types';
import api from '../lib/api';
import { ProductTable } from '../components/ProductTable';
import { ProductFormModal } from '../components/ProductFormModal';

export const Products: React.FC = () => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const { inventoryItems, isInventoryLoading, inventoryError, deleteInventoryItem } = useCatalog();
  const [showAddModal, setShowAddModal] = useState(false);

  const isDark = theme === 'dark';

  const stats = useMemo(() => {
    const total = inventoryItems.length;
    const lowStock = inventoryItems.filter((i) => i.status === 'Low Stock').length;
    const outOfStock = inventoryItems.filter((i) => i.status === 'Out of Stock').length;
    const totalValue = inventoryItems.reduce((sum, i) => sum + i.cost * i.storeQty, 0);
    return { total, lowStock, outOfStock, totalValue };
  }, [inventoryItems]);

  // Delete handler — calls backend API, removes from state ONLY after server confirmation
  // Uses the configured api client (respects VITE_API_URL and auth token injection)
  const handleDeleteProduct = async (id: string) => {
    try {
      interface DeleteResponse {
        success: boolean;
        softDeleted?: boolean;
        message?: string;
      }
      const response = await api.delete<DeleteResponse>(`/products/${id}`, true);
      if (response?.success) {
        deleteInventoryItem(id);
        const msg = response.message || 'Product permanently deleted from server database.';
        toast.success(msg);
      } else {
        toast.error('Server returned an unexpected response. Please try again.');
      }
    } catch (error: any) {
      console.error('Product deletion failed:', error);
      const errorMsg = error?.message || 'Cannot delete product. It is linked to existing active invoices.';
      toast.error(errorMsg);
    }
  };

  return (
    <div className={`space-y-4 ${isMobile ? 'pb-20' : ''}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
            {t('products.title')}
          </h1>
          <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            {t('products.description')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => navigate('/products/barcode-labels')} className={`flex items-center gap-1.5 px-3 py-2 rounded-lg font-medium transition-all border text-xs ${isDark ? 'bg-slate-800 border-slate-700 text-indigo-400 hover:bg-slate-700' : 'bg-white border-slate-200 text-indigo-600 hover:bg-indigo-50 shadow-sm'}`}>
            <ScanLine className="w-3.5 h-3.5" />
            {t('barcodeLabels.labelsTrigger')}
          </button>
          <button onClick={() => setShowAddModal(true)} className="flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600 text-white rounded-lg font-medium transition-all shadow shadow-orange-500/20 text-xs">
            <Plus className="w-3.5 h-3.5" />
            {t('products.addProduct')}
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { label: 'Total Items', value: stats.total, icon: Box, color: 'blue' },
          { label: 'Low Stock', value: stats.lowStock, icon: AlertTriangle, color: 'yellow' },
          { label: 'Out of Stock', value: stats.outOfStock, icon: XCircle, color: 'red' },
          { label: 'Inventory Value', value: `Rs.${(stats.totalValue / 1000000).toFixed(1)}M`, icon: BarChart3, color: 'green' },
        ].map((item, i) => {
          const Icon = item.icon;
          return (
            <div key={i} className={`p-3 rounded-lg border ${isDark ? 'bg-slate-800/30 border-slate-700/50' : 'bg-white border-slate-200 shadow-sm'}`}>
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 bg-${item.color}-500/10 rounded-lg flex items-center justify-center`}>
                  <Icon className={`w-4 h-4 text-${item.color}-400`} />
                </div>
                <div>
                  <p className={`text-lg font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{item.value}</p>
                  <p className={`text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>{item.label}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Loading State */}
      {isInventoryLoading && (
        <div className={`flex items-center justify-center py-12 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs">Loading inventory...</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {inventoryError && !isInventoryLoading && (
        <div className={`p-4 rounded-lg border ${isDark ? 'bg-red-900/20 border-red-800/30' : 'bg-red-50 border-red-200'}`}>
          <p className={`text-xs font-medium ${isDark ? 'text-red-400' : 'text-red-600'}`}>
            {inventoryError}
          </p>
          <p className={`text-[10px] mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Showing local data instead. Start the backend server on port 3000 for live data.
          </p>
        </div>
      )}

      {/* ── SOLE DATA TABLE: ProductTable (Inventory Warehouse Grid) ── */}
      {!isInventoryLoading && (
        <ProductTable
          items={inventoryItems}
          onDelete={handleDeleteProduct}
        />
      )}

      {/* ── UNIFIED PRODUCT FORM MODAL ── */}
      <ProductFormModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        mode="create"
        initialData={null}
      />
    </div>
  );
};