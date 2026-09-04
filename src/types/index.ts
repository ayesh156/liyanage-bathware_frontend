export type CustomerType = 'regular' | 'wholesale' | 'credit';

export interface Customer {
  id: string;
  name: string;
  nameSi?: string;
  nic?: string;
  phone: string;
  email: string;
  address: string;
  customerType: CustomerType;
  loanBalance: number;
  creditLimit?: number;
}

export interface Category {
  id: string;
  name: string;
  nameSinhala?: string;
  icon?: string;
  description?: string;
  usageCount?: number;
  parentId?: string;
  sortOrder: number;
  showInQuickInvoice: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface SizeOption {
  id: string;
  label: string;
  value: string;
  unit: string;
}

export interface ProductVariant {
  id: string;
  productId: string;
  size?: string;
  color?: string;
  sku: string;
  barcode?: string;
  costPrice: number;
  wholesalePrice: number;
  retailPrice: number;
  discountedPrice?: number;
  stock: number;
  minStock: number;
  maxStock?: number;
  isActive: boolean;
}

export interface FlattenedProduct {
  flatId: string;
  product: Product;
  variant?: ProductVariant;
  displayName: string;
  displaySku: string;
  displayBarcode?: string;
  costPrice: number;
  wholesalePrice: number;
  retailPrice: number;
  discountedPrice?: number;
  stock: number;
  minStock: number;
  isVariant: boolean;
  variantLabel?: string;
  hasDiscount: boolean;
}

export interface Product {
  id: string;
  name: string;
  nameAlt?: string;
  sku: string;
  barcode?: string;
  description: string;
  categoryId?: string;
  category: 'building_materials' | 'steel_metal' | 'electrical' | 'plumbing' | 'tools' | 'paint' | 'hardware' | 'wood_timber' | 'safety' | 'other';
  subcategory?: string;
  brandId?: string;
  brand?: string;
  price?: number;
  costPrice?: number;
  wholesalePrice?: number;
  retailPrice?: number;
  discountedPrice?: number;
  stock: number;
  minStock?: number;
  maxStock?: number;
  unit?: 'piece' | 'kg' | 'g' | 'meter' | 'feet' | 'liter' | 'bag' | 'box' | 'pack' | 'roll' | 'sheet' | 'pair' | 'set' | 'sqft' | 'sqm' | 'bundle' | 'cube';
  sizes?: string[];
  colors?: string[];
  weight?: number;
  dimensions?: { length?: number; width?: number; height?: number; unit: 'mm' | 'cm' | 'm' | 'inch' | 'feet'; };
  hasVariants?: boolean;
  variants?: ProductVariant[];
  warranty?: string;
  manufacturer?: string;
  countryOfOrigin?: string;
  specifications?: Record<string, string>;
  tags?: string[];
  images?: string[];
  supplierId?: string;
  supplierName?: string;
  isActive?: boolean;
  isFeatured?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// ── InventoryProduct — flat schema with bilingual support ──
export interface InventoryProduct {
  id: string;
  no?: string;
  searchKey: string;
  name: string;
  nameSi?: string;       // Sinhala title (e.g., "ACL බහු-වයර් කේබලය")
  nameSinhala?: string;  // Unified Sinhala name field
  productCategory: string;
  categoryId?: string;
  categorySi?: string;   // Sinhala category name (e.g., "ACL කේබල්")
  barcode?: string;      // Physical barcode / fallback LHD-xxxxxxx code
  cost: number;
  lastPrice: number;
  salesPrice: number;
  displayPrice: number;
  storeQty: number;
  salesType: string;
  status: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface InvoiceItem {
  id: string;
  productId: string;
  productName: string;
  productNameSi?: string;
  variantId?: string;
  size?: string;
  quantity: number;
  unitPrice: number;
  originalPrice?: number;
  discount?: number;
  total: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  customerId: string;
  customerName: string;
  items: InvoiceItem[];
  subtotal: number;
  discount?: number;
  discountType?: 'percentage' | 'fixed' | 'none';
  discountValue?: number;
  enableTax?: boolean;
  taxRate?: number;
  tax: number;
  total: number;
  receivedAmount?: number;
  changeAmount?: number;
  issueDate: string;
  dueDate: string;
  status: string;
  paymentMethod?: 'cash' | 'card' | 'bank_transfer' | 'credit';
  notes?: string;
}

export type SupplierPaymentType = 'cash' | 'credit';

export interface SupplierDelivery {
  id: string;
  supplierId: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  deliveryDate: string;
  invoiceNumber?: string;
  notes?: string;
}

export interface Supplier {
  id: string;
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  brands?: string[];
  categories?: string[];
  paymentTerms?: string;
  isActive: boolean;
  paymentType: SupplierPaymentType;
  creditBalance?: number;
  creditLimit?: number;
  creditDueDate?: string;
  lastPaymentDate?: string;
  deliveries?: SupplierDelivery[];
}