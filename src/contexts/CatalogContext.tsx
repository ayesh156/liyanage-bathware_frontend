import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';
import { Category } from '../types/index';
import { InventoryProduct } from '../types/index';
import { CatalogItem } from '../data/mockData';
import api, { isNetworkError } from '../lib/api';
import { useAuth } from './AuthContext';
import { toast } from 'react-toastify';

// ── Local fallback when API is unavailable ──
let localInventoryItems: InventoryProduct[] = [];

interface CatalogState {
  categories: Category[];
  inventoryItems: InventoryProduct[];
  catalogItems: CatalogItem[];
  isInventoryLoading: boolean;
  inventoryError: string | null;
  isCategoriesLoading: boolean;
}

interface CatalogContextValue extends CatalogState {
  addCategory: (data: Partial<Category>) => Promise<Category>;
  updateCategory: (id: string, data: Partial<Category>) => Promise<Category>;
  patchCategory: (id: string, data: Record<string, any>) => Promise<Category>;
  deleteCategory: (id: string) => Promise<void>;
  refreshCategories: () => Promise<void>;
  bulkUpdateDisplaySettings: (settings: Array<{ id: string; sortOrder?: number; showInQuickInvoice?: boolean }>) => Promise<void>;
  /** Replace categories state directly from a `syncCategories` server payload — zero extra HTTP calls */
  syncCategoriesFromServer: (categories: Category[]) => void;
  addInventoryItem: (item: InventoryProduct) => Promise<void>;
  updateInventoryItem: (id: string, data: Partial<InventoryProduct>) => Promise<void>;
  deleteInventoryItem: (id: string) => Promise<void>;
  searchByQuery: (query: string) => CatalogItem[];
  getCategoryName: (id: string) => string;
  refreshInventory: () => Promise<void>;
}

const CatalogContext = createContext<CatalogContextValue | null>(null);

export const useCatalog = (): CatalogContextValue => {
  const ctx = useContext(CatalogContext);
  if (!ctx) throw new Error('useCatalog must be used within CatalogProvider');
  return ctx;
};

export const CatalogProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, token, isInitializing } = useAuth();
  // 🚀 START WITH EMPTY ARRAY — NO MOCK DATA LEAKAGE
  // Categories come exclusively from the API response.
  const [categories, setCategories] = useState<Category[]>([]);
  const [inventoryItems, setInventoryItems] = useState<InventoryProduct[]>([]);
  const [isInventoryLoading, setIsInventoryLoading] = useState(true);
  const [isCategoriesLoading, setIsCategoriesLoading] = useState(false);
  const [inventoryError, setInventoryError] = useState<string | null>(null);

  // ── Fetch categories from backend API (single source of truth) ──
  const fetchCategories = useCallback(async () => {
    setIsCategoriesLoading(true);
    try {
      const data = await api.get<Category[]>('/categories');
      if (Array.isArray(data)) {
        setCategories(data);
      } else if (data && typeof data === 'object' && 'data' in data) {
        setCategories((data as any).data as Category[]);
      } else {
        // API responded but format unexpected — empty array
        setCategories([]);
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      // Log only — do NOT fall back to mock data
      console.error('[Catalog] Failed to fetch categories:', errorMessage);
      setCategories([]);
    } finally {
      setIsCategoriesLoading(false);
    }
  }, []);

  // ── Fetch inventory from backend API ──
  const fetchInventory = useCallback(async () => {
    setIsInventoryLoading(true);
    setInventoryError(null);

    try {
      const data = await api.get<InventoryProduct[]>('/products', { perPage: 100000 });

      if (Array.isArray(data)) {
        setInventoryItems(data as unknown as InventoryProduct[]);
        localInventoryItems = data as unknown as InventoryProduct[];
      } else if (data && typeof data === 'object' && 'data' in data) {
        const paginatedData = (data as any).data as InventoryProduct[];
        setInventoryItems(paginatedData);
        localInventoryItems = paginatedData;
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';

      if (isNetworkError(err) || errorMessage.includes('HTTP 404') || errorMessage.includes('Not Found')) {
        console.warn('[Catalog] Backend API unavailable — falling back to local inventory data');
        try {
          const localData = await import('../data/inventoryData');
          const items = localData.inventoryItems || [];
          setInventoryItems(items);
          localInventoryItems = items;
          setInventoryError(null);
        } catch {
          setInventoryItems([]);
          localInventoryItems = [];
          setInventoryError('Inventory data could not be loaded from either API or local files');
        }
      } else {
        setInventoryError(errorMessage);
        console.error('[Catalog] Failed to fetch inventory:', errorMessage);
      }
    } finally {
      setIsInventoryLoading(false);
    }
  }, []);

  // Load data on mount when authenticated
  useEffect(() => {
    if (isInitializing) return;
    if (!isAuthenticated || !token) return;

    fetchInventory();
    fetchCategories();
  }, [fetchInventory, fetchCategories, isAuthenticated, token, isInitializing]);

  // ── NETWORK RESILIENCE: Auto-refresh ONLY on reconnect ──
  // When the device reconnects (e.g., mobile internet / VPN restored), the
  // inventory and categories are automatically refreshed from the backend
  // so locally-cached/stale data is replaced with fresh server state.
  //
  // 🚨 FIX: The window `focus` listener has been REMOVED. It previously
  // triggered fetchInventory() + fetchCategories() on EVERY focus event,
  // causing the Products table to continuously flash/auto-refresh in an
  // infinite polling loop.
  useEffect(() => {
    if (isInitializing || !isAuthenticated || !token) return;

    const handleOnline = () => {
      // Silent background refetch when connection is restored
      console.info('[Catalog] Connection restored — auto-refetching inventory & categories');
      fetchInventory();
      fetchCategories();
    };

    window.addEventListener('online', handleOnline);
    return () => {
      window.removeEventListener('online', handleOnline);
    };
  }, [isInitializing, isAuthenticated, token, fetchInventory, fetchCategories]);

  // ── API-backed Category CRUD (server response = single source of truth) ──

  /**
   * POST /api/categories
   * Creates a category server-side, then updates React state from server response.
   * If network fails, does NOT create locally — user must retry.
   */
  const addCategory = useCallback(async (data: Partial<Category>): Promise<Category> => {
    const created = await api.post<Category>('/categories', {
      name: data.name || '',
      nameSinhala: data.nameSinhala,
      icon: data.icon,
      description: data.description,
      parentId: data.parentId,
      sortOrder: data.sortOrder ?? 0,
      showInQuickInvoice: data.showInQuickInvoice ?? true,
    });
    // 🚀 State updated EXCLUSIVELY from the server response payload
    setCategories(prev => [...prev, created]);
    toast.success(`Category "${created.name}" created successfully`);
    return created;
  }, []);

  /**
   * PUT /api/categories/:id
   * Full update. React state updated from server response.
   */
  const updateCategory = useCallback(async (id: string, data: Partial<Category>): Promise<Category> => {
    const updated = await api.put<Category>(`/categories/${id}`, data);
    // 🚀 State updated from server response, NOT from request body
    setCategories(prev => prev.map(c => c.id === id ? updated : c));
    toast.success('Category updated successfully');
    return updated;
  }, []);

  /**
   * PATCH /api/categories/:id
   * Partial update. React state updated from server response.
   */
  const patchCategory = useCallback(async (id: string, data: Record<string, any>): Promise<Category> => {
    const updated = await api.patch<Category>(`/categories/${id}`, data);
    // 🚀 State updated from server response
    setCategories(prev => prev.map(c => c.id === id ? updated : c));
    toast.success('Category updated successfully');
    return updated;
  }, []);

  /**
   * DELETE /api/categories/:id
   * Deletes server-side. On success, removes from React state.
   * On 409, shows warning toast (products still assigned). Does NOT remove from state.
   * On network error, removes optimistically with warning.
   */
  const deleteCategory = useCallback(async (id: string) => {
    const target = categories.find(c => c.id === id);
    const name = target?.name || id;
    try {
      await api.delete(`/categories/${id}`);
      setCategories(prev => prev.filter(c => c.id !== id));
      toast.success(`Category "${name}" deleted successfully`);
    } catch (err: any) {
      const msg = err?.message || '';
      // 🚨 Relational Integrity: 409 — products still assigned
      if (msg.includes('Cannot delete') || msg.includes('still assigned')) {
        toast.warn(msg, { autoClose: 8000 });
        throw err; // Re-throw so caller knows deletion failed
      }
      // Network error — remove locally but warn user
      else if (msg.includes('Failed to fetch') || msg.includes('NetworkError')) {
        setCategories(prev => prev.filter(c => c.id !== id));
        toast.warn(`Category "${name}" removed locally (server unreachable)`);
      } else {
        toast.error(msg || 'Failed to delete category');
        throw err;
      }
    }
  }, [categories]);

  /**
   * PATCH /api/categories/display-settings
   * Bulk update sortOrder and showInQuickInvoice.
   * React state updated from the request settings (server confirms count only).
   * Immediately re-fetches fresh categories from the backend to sync usageCount
   * and any server-side adjustments.
   */
  const bulkUpdateDisplaySettings = useCallback(async (
    settings: Array<{ id: string; sortOrder?: number; showInQuickInvoice?: boolean }>
  ) => {
    const result = await api.patch<{ updated: number }>('/categories/display-settings', {
      categories: settings,
    });
    // 🚀 Apply server-confirmed changes to local state
    setCategories(prev => prev.map(cat => {
      const update = settings.find(s => s.id === cat.id);
      if (update) {
        return {
          ...cat,
          sortOrder: update.sortOrder !== undefined ? update.sortOrder : cat.sortOrder,
          showInQuickInvoice: update.showInQuickInvoice !== undefined ? update.showInQuickInvoice : cat.showInQuickInvoice,
        };
      }
      return cat;
    }));
    toast.success(`${result.updated || settings.length} category display settings updated`);
    // 🔄 Force fresh Prisma aggregate re-fetch to update usageCount / sortOrder
    await fetchCategories();
  }, [fetchCategories]);

  // ── Inventory CRUD — NO fetchCategories() race condition calls here ──
  // Callers must use syncCategoriesFromServer() to update category usage counts
  // from the response payload directly (zero extra HTTP calls).

  const addInventoryItem = useCallback(async (item: InventoryProduct) => {
    setInventoryItems(prev => [item, ...prev]);
  }, []);

  const updateInventoryItem = useCallback(async (id: string, data: Partial<InventoryProduct>) => {
    setInventoryItems(prev =>
      prev.map(item => (item.id === id ? { ...item, ...data } : item))
    );
    localInventoryItems = localInventoryItems.map(item =>
      item.id === id ? { ...item, ...data } : item
    );
  }, []);

  const deleteInventoryItem = useCallback(async (id: string) => {
    setInventoryItems(prev => prev.filter(item => item.id !== id));
    localInventoryItems = localInventoryItems.filter(item => item.id !== id);
  }, []);

  /**
   * Directly replaces the categories state with fresh server data.
   * This is the ZERO-EXTRA-HTTP-CALL mechanism for real-time usage count sync.
   * Called by ProductTable and ProductFormModal after they receive `syncCategories`
   * from the mutation response envelope.
   */
  const syncCategoriesFromServer = useCallback((freshCategories: Category[]) => {
    if (Array.isArray(freshCategories) && freshCategories.length > 0) {
      setCategories(freshCategories);
    }
  }, []);

  // ── Search ──
  const searchByQuery = useCallback((query: string): CatalogItem[] => {
    return [];
  }, []);

  const getCategoryName = useCallback((id: string): string => {
    return categories.find(c => c.id === id)?.name || id;
  }, [categories]);

  const value = useMemo(() => ({
    categories,
    inventoryItems,
    catalogItems: [] as CatalogItem[],
    isInventoryLoading,
    inventoryError,
    isCategoriesLoading,
    addCategory,
    updateCategory,
    patchCategory,
    deleteCategory,
    refreshCategories: fetchCategories,
    bulkUpdateDisplaySettings,
    syncCategoriesFromServer,
    addInventoryItem,
    updateInventoryItem,
    deleteInventoryItem,
    searchByQuery,
    getCategoryName,
    refreshInventory: fetchInventory,
  }), [
    categories,
    inventoryItems,
    isInventoryLoading,
    inventoryError,
    isCategoriesLoading,
    addCategory,
    updateCategory,
    patchCategory,
    deleteCategory,
    fetchCategories,
    bulkUpdateDisplaySettings,
    syncCategoriesFromServer,
    addInventoryItem,
    updateInventoryItem,
    deleteInventoryItem,
    searchByQuery,
    getCategoryName,
    fetchInventory,
  ]);

  return (
    <CatalogContext.Provider value={value}>
      {children}
    </CatalogContext.Provider>
  );
};