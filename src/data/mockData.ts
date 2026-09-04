import { Customer, Product, Invoice, Category, Supplier, SupplierDelivery, InventoryProduct } from '../types/index';
import { inventoryItems } from './inventoryData';

// ──────────────────────────────────────────────
// FINANCIAL DATA (merged from financialData.ts)
// ──────────────────────────────────────────────
export interface FinancialTransaction {
  id: string;
  date: string;
  type: 'revenue' | 'expense';
  category: string;
  description: string;
  amount: number;
  paymentMethod: 'cash' | 'card' | 'bank_transfer' | 'credit';
}

export interface FinancialSummary {
  period: string;
  revenue: number;
  expenses: number;
  profit: number;
  profitMargin: number;
}

export const mockFinancialTransactions: FinancialTransaction[] = [
  { id: 'ft1', date: '2024-12-01', type: 'revenue', category: 'Paint Sales', description: 'Nippon Paint - 5L Emulsion', amount: 45000, paymentMethod: 'card' },
  { id: 'ft2', date: '2024-12-01', type: 'revenue', category: 'Tools Sales', description: 'Power Drill Set', amount: 28000, paymentMethod: 'cash' },
  { id: 'ft3', date: '2024-12-02', type: 'revenue', category: 'Cement Sales', description: 'Holcim Cement - 50kg x 20', amount: 72000, paymentMethod: 'bank_transfer' },
  { id: 'ft4', date: '2024-12-02', type: 'revenue', category: 'Electrical', description: 'LED Bulbs Wholesale', amount: 35000, paymentMethod: 'credit' },
  { id: 'ft5', date: '2024-12-03', type: 'revenue', category: 'Plumbing', description: 'PVC Pipes & Fittings', amount: 52000, paymentMethod: 'cash' },
  { id: 'ft6', date: '2024-12-03', type: 'revenue', category: 'Hardware', description: 'Nails, Screws, Bolts Bulk', amount: 18500, paymentMethod: 'card' },
  { id: 'ft7', date: '2024-12-04', type: 'revenue', category: 'Paint Sales', description: 'Asian Paints - Weather Shield', amount: 68000, paymentMethod: 'bank_transfer' },
  { id: 'ft8', date: '2024-12-04', type: 'revenue', category: 'Safety Equipment', description: 'Safety Helmets & Gloves', amount: 24000, paymentMethod: 'cash' },
  { id: 'ft9', date: '2024-12-05', type: 'revenue', category: 'Tools Sales', description: 'Hand Tools Assortment', amount: 42000, paymentMethod: 'card' },
  { id: 'ft10', date: '2024-12-05', type: 'revenue', category: 'Cement Sales', description: 'Tokyo Cement - 50kg x 15', amount: 54000, paymentMethod: 'credit' },
  { id: 'ft11', date: '2024-12-06', type: 'revenue', category: 'Electrical', description: 'Switches & Sockets', amount: 38000, paymentMethod: 'cash' },
  { id: 'ft12', date: '2024-12-06', type: 'revenue', category: 'Paint Sales', description: 'Decorative Wall Paints', amount: 56000, paymentMethod: 'bank_transfer' },
  { id: 'ft13', date: '2024-12-07', type: 'revenue', category: 'Plumbing', description: 'Water Tanks & Fittings', amount: 125000, paymentMethod: 'bank_transfer' },
  { id: 'ft14', date: '2024-12-08', type: 'revenue', category: 'Hardware', description: 'Door Locks & Hinges', amount: 32000, paymentMethod: 'card' },
  { id: 'ft15', date: '2024-12-09', type: 'revenue', category: 'Tools Sales', description: 'Electric Grinder', amount: 45000, paymentMethod: 'cash' },
  { id: 'ft16', date: '2024-12-10', type: 'revenue', category: 'Cement Sales', description: 'Holcim Cement Bulk Order', amount: 180000, paymentMethod: 'bank_transfer' },
  { id: 'ft17', date: '2024-12-11', type: 'revenue', category: 'Paint Sales', description: 'Berger Paints - Wood Finish', amount: 62000, paymentMethod: 'credit' },
  { id: 'ft18', date: '2024-12-12', type: 'revenue', category: 'Electrical', description: 'Wiring & Cables', amount: 48000, paymentMethod: 'cash' },
  { id: 'ft19', date: '2024-12-13', type: 'revenue', category: 'Plumbing', description: 'Sanitary Ware', amount: 95000, paymentMethod: 'card' },
  { id: 'ft20', date: '2024-12-14', type: 'revenue', category: 'Tools Sales', description: 'Saw Set & Hammer', amount: 28500, paymentMethod: 'cash' },
  // December 2024 - Expenses
  { id: 'ft21', date: '2024-12-01', type: 'expense', category: 'Inventory Purchase', description: 'Paint Stock Replenishment', amount: 125000, paymentMethod: 'bank_transfer' },
  { id: 'ft22', date: '2024-12-01', type: 'expense', category: 'Utilities', description: 'Electricity Bill - Nov', amount: 18500, paymentMethod: 'cash' },
  { id: 'ft23', date: '2024-12-02', type: 'expense', category: 'Salaries', description: 'Staff Salaries - December', amount: 250000, paymentMethod: 'bank_transfer' },
  { id: 'ft24', date: '2024-12-03', type: 'expense', category: 'Transportation', description: 'Delivery Vehicle Fuel', amount: 25000, paymentMethod: 'card' },
  { id: 'ft25', date: '2024-12-04', type: 'expense', category: 'Inventory Purchase', description: 'Cement Stock from Holcim', amount: 180000, paymentMethod: 'bank_transfer' },
  { id: 'ft26', date: '2024-12-05', type: 'expense', category: 'Maintenance', description: 'Shop Repairs & Painting', amount: 45000, paymentMethod: 'cash' },
  { id: 'ft27', date: '2024-12-06', type: 'expense', category: 'Inventory Purchase', description: 'Electrical Goods Stock', amount: 95000, paymentMethod: 'bank_transfer' },
  { id: 'ft28', date: '2024-12-07', type: 'expense', category: 'Marketing', description: 'Facebook Ads & Banners', amount: 12000, paymentMethod: 'card' },
  { id: 'ft29', date: '2024-12-08', type: 'expense', category: 'Utilities', description: 'Water & Internet Bills', amount: 8500, paymentMethod: 'cash' },
  { id: 'ft30', date: '2024-12-09', type: 'expense', category: 'Inventory Purchase', description: 'Plumbing Supplies', amount: 110000, paymentMethod: 'bank_transfer' },
  { id: 'ft31', date: '2024-12-10', type: 'expense', category: 'Transportation', description: 'Delivery Vehicle Maintenance', amount: 35000, paymentMethod: 'card' },
  { id: 'ft32', date: '2024-12-11', type: 'expense', category: 'Insurance', description: 'Shop Insurance Premium', amount: 28000, paymentMethod: 'bank_transfer' },
  { id: 'ft33', date: '2024-12-12', type: 'expense', category: 'Inventory Purchase', description: 'Tools & Hardware Stock', amount: 88000, paymentMethod: 'bank_transfer' },
  { id: 'ft34', date: '2024-12-13', type: 'expense', category: 'Professional Fees', description: 'Accountant Service Fee', amount: 15000, paymentMethod: 'cash' },
  { id: 'ft35', date: '2024-12-14', type: 'expense', category: 'Utilities', description: 'Telephone & Mobile Bills', amount: 6500, paymentMethod: 'card' },
];

export const calculateFinancialSummary = (
  transactions: FinancialTransaction[],
  startDate: Date,
  endDate: Date
): FinancialSummary => {
  const filtered = transactions.filter(t => {
    const tDate = new Date(t.date);
    return tDate >= startDate && tDate <= endDate;
  });
  const revenue = filtered.filter(t => t.type === 'revenue').reduce((sum, t) => sum + t.amount, 0);
  const expenses = filtered.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
  const profit = revenue - expenses;
  const profitMargin = revenue > 0 ? (profit / revenue) * 100 : 0;
  return { period: `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`, revenue, expenses, profit, profitMargin };
};

export const expenseCategories = [
  { name: 'Inventory Purchase', color: '#3b82f6', icon: '📦' },
  { name: 'Salaries', color: '#8b5cf6', icon: '👥' },
  { name: 'Utilities', color: '#f59e0b', icon: '⚡' },
  { name: 'Transportation', color: '#10b981', icon: '🚚' },
  { name: 'Maintenance', color: '#ef4444', icon: '🔧' },
  { name: 'Marketing', color: '#ec4899', icon: '📢' },
  { name: 'Insurance', color: '#06b6d4', icon: '🛡️' },
  { name: 'Professional Fees', color: '#6366f1', icon: '💼' }
];
export const revenueCategories = [
  { name: 'Paint Sales', color: '#8b5cf6', icon: '🎨' },
  { name: 'Cement Sales', color: '#64748b', icon: '🏗️' },
  { name: 'Tools Sales', color: '#f59e0b', icon: '🔨' },
  { name: 'Electrical', color: '#f59e0b', icon: '💡' },
  { name: 'Plumbing', color: '#06b6d4', icon: '🚰' },
  { name: 'Hardware', color: '#3b82f6', icon: '🔩' },
  { name: 'Safety Equipment', color: '#10b981', icon: '🦺' }
];
// ──────────────────────────────────────────────
// END FINANCIAL DATA
// ──────────────────────────────────────────────

/**
 * mockCategories — Dynamically derived from inventoryItems master dataset.
 * Each entry is keyed by the unique productCategory value found in inventoryData.ts,
 * with the categoryId resolved from the first matching item in that category.
 * usageCount reflects the live count of items per category at module load time.
 */
const _uniqueCategoryNames = Array.from(
  new Set(inventoryItems.map(item => item.productCategory).filter(Boolean))
);

export const mockCategories: Category[] = _uniqueCategoryNames.map((catName, idx) => {
  const matchingItem = inventoryItems.find(item => item.productCategory === catName);
  const usageCount = inventoryItems.filter(item => item.productCategory === catName).length;
  return {
    id: matchingItem?.categoryId || `cat-derived-${idx}`,
    name: catName,
    nameAlt: catName,
    icon: 'hardware',
    description: `All materials listed under ${catName} infrastructure inventory.`,
    usageCount,
  };
});

// ── Helpers to get category names list dynamically ──
export const categoryNames: string[] = mockCategories.map(c => c.name);
export const categoryNameToId: Record<string, string> = {};
mockCategories.forEach(c => { categoryNameToId[c.name] = c.id; });
export const categoryIdToName: Record<string, string> = {};
mockCategories.forEach(c => { categoryIdToName[c.id] = c.name; });

// ──────────────────────────────────────────────
// SINGLE MASTER ARRAY: inventoryItems
// Moved to inventoryData.ts for code-splitting.
// Re-exported here for backward compatibility.
// ──────────────────────────────────────────────
export { inventoryItems } from './inventoryData';


// ── Helpers for category-name-based filtering ──
export function getItemsByCategory(categoryId: string): InventoryProduct[] {
  return inventoryItems.filter(item => item.categoryId === categoryId);
}
export function getItemsByCategoryName(categoryName: string): InventoryProduct[] {
  return inventoryItems.filter(item => item.productCategory === categoryName);
}
export function searchInventory(query: string): InventoryProduct[] {
  if (query.trim().length < 2) return [];
  const q = query.toLowerCase().trim();
  return inventoryItems.filter(item =>
    item.searchKey.toLowerCase().includes(q) ||
    item.name.toLowerCase().includes(q) ||
    item.productCategory.toLowerCase().includes(q)
  );
}

// ── CatalogItem for CategoryGrid / Quick Checkout (derived from inventoryItems) ──
export interface CatalogItem {
  id: string;
  sku: string;
  name: string;
  nameSi?: string;
  unitRate: number;
  stock: number;
  unit: string;
  categoryId: string;
  barcode?: string;
}

/** Build catalog from master inventoryItems — ALL items exist in both arrays */
export const linkedCatalogItems: CatalogItem[] = inventoryItems.map(item => ({
  id: `cat-${item.id}`,
  sku: item.searchKey,
  name: item.name,
  unitRate: item.salesPrice,
  stock: item.storeQty,
  unit: 'piece',
  categoryId: item.categoryId,
}));

// ──────────────────────────────────────────────
// Suppliers (unchanged)
// ──────────────────────────────────────────────
export const mockSuppliers: Supplier[] = [
  { id: 'sup-001', name: 'INSEE Cement (Lanka) Ltd', contactPerson: 'Roshan Fernando', email: 'roshan@insee.lk', phone: '+94 11 234 5678', address: '75, Kumaran Ratnam Road, Colombo 02', paymentType: 'credit', creditLimit: 500000, creditBalance: 125000, creditDueDate: '2025-12-25', lastPaymentDate: '2024-12-01', isActive: true, deliveries: [
    { id: 'del-001', supplierId: 'sup-001', productId: 'prod-001', productName: 'INSEE Cement 50kg', quantity: 100, unitPrice: 2100, totalAmount: 210000, deliveryDate: '2024-12-15', invoiceNumber: 'INS-2024-1234' },
    { id: 'del-002', supplierId: 'sup-001', productId: 'prod-001', productName: 'INSEE Cement 50kg', quantity: 50, unitPrice: 2100, totalAmount: 105000, deliveryDate: '2024-12-01', invoiceNumber: 'INS-2024-1198' },
    { id: 'del-003', supplierId: 'sup-001', productId: 'prod-001', productName: 'INSEE Cement 50kg', quantity: 75, unitPrice: 2050, totalAmount: 153750, deliveryDate: '2024-11-15', invoiceNumber: 'INS-2024-1156' },
  ]},
  { id: 'sup-002', name: 'Tokyo Cement Company', contactPerson: 'Chaminda Silva', email: 'chaminda@tokyocement.lk', phone: '+94 11 345 6789', address: '42, Baseline Road, Colombo 09', paymentType: 'cash', isActive: true, deliveries: [
    { id: 'del-004', supplierId: 'sup-002', productId: 'prod-002', productName: 'Tokyo Super Cement 50kg', quantity: 80, unitPrice: 2050, totalAmount: 164000, deliveryDate: '2024-12-10', invoiceNumber: 'TKY-2024-5567' },
    { id: 'del-005', supplierId: 'sup-002', productId: 'prod-002', productName: 'Tokyo Super Cement 50kg', quantity: 60, unitPrice: 2050, totalAmount: 123000, deliveryDate: '2024-11-25', invoiceNumber: 'TKY-2024-5534' },
  ]},
  { id: 'sup-003', name: 'Lanwa Steel Industries', contactPerson: 'Priyantha Jayawardena', email: 'priyantha@lanwasteel.lk', phone: '+94 11 456 7890', address: '156, Negombo Road, Wattala', paymentType: 'credit', creditLimit: 750000, creditBalance: 280000, creditDueDate: '2025-12-20', lastPaymentDate: '2024-11-28', isActive: true, deliveries: [
    { id: 'del-006', supplierId: 'sup-003', productId: 'prod-003', productName: 'Lanwa Steel Bar 10mm', quantity: 200, unitPrice: 850, totalAmount: 170000, deliveryDate: '2024-12-12', invoiceNumber: 'LNW-2024-8890' },
    { id: 'del-007', supplierId: 'sup-003', productId: 'prod-003', productName: 'Lanwa Steel Bar 12mm', quantity: 150, unitPrice: 1100, totalAmount: 165000, deliveryDate: '2024-12-05', invoiceNumber: 'LNW-2024-8875' },
  ]},
  { id: 'sup-004', name: 'Kelani Cables PLC', contactPerson: 'Sunil Perera', email: 'sunil@kelanicables.com', phone: '+94 11 567 8901', address: '88, Kelani Valley Road, Colombo 15', paymentType: 'cash', isActive: true, deliveries: [
    { id: 'del-008', supplierId: 'sup-004', productId: 'prod-005', productName: 'Kelani House Wire 1.5mm', quantity: 50, unitPrice: 4500, totalAmount: 225000, deliveryDate: '2024-12-08', invoiceNumber: 'KEL-2024-3321' },
  ]},
  { id: 'sup-005', name: 'National PVC Distributors', contactPerson: 'Mahesh Kumar', email: 'mahesh@nationalpvc.lk', phone: '+94 11 678 9012', address: '234, Galle Road, Moratuwa', paymentType: 'credit', creditLimit: 300000, creditBalance: 95000, creditDueDate: '2025-12-22', lastPaymentDate: '2024-12-05', isActive: true, deliveries: [
    { id: 'del-009', supplierId: 'sup-005', productId: 'prod-004', productName: 'PVC Pipe 1 inch', quantity: 100, unitPrice: 450, totalAmount: 45000, deliveryDate: '2024-12-14', invoiceNumber: 'NAT-2024-2234' },
    { id: 'del-010', supplierId: 'sup-005', productId: 'prod-004', productName: 'PVC Pipe 2 inch', quantity: 75, unitPrice: 780, totalAmount: 58500, deliveryDate: '2024-12-07', invoiceNumber: 'NAT-2024-2221' },
  ]},
  { id: 'sup-006', name: 'Nippon Paint Lanka', contactPerson: 'Ranjith Dissanayake', email: 'ranjith@nipponpaint.lk', phone: '+94 11 789 0123', address: '56, Pannipitiya Road, Battaramulla', paymentType: 'cash', isActive: true, deliveries: [] },
  { id: 'sup-007', name: 'Bosch Power Tools Sri Lanka', contactPerson: 'Ashan Gunasekara', email: 'ashan@bosch.lk', phone: '+94 11 890 1234', address: '12, Duplication Road, Colombo 03', paymentType: 'credit', creditLimit: 400000, creditBalance: 0, creditDueDate: undefined, lastPaymentDate: '2024-12-10', isActive: true, deliveries: [] },
];

// ──────────────────────────────────────────────
// Customers (unchanged)
// ──────────────────────────────────────────────
export const mockCustomers: Customer[] = [
  { id: 'cust-001', name: 'Nimal Rajapaksha', nameSi: 'නිමල් රාජපක්ෂ', businessName: 'Rajapaksha Builders & Co.', email: 'nimal@rajapakshabuilders.lk', phone: '+94 71 555 1234', phone2: '+94 11 234 5678', nic: '751234567V', address: '45 Temple Road, Colombo 7', photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop', registrationDate: '2024-02-10', totalSpent: 892500, customerType: 'wholesale', isActive: true, loanBalance: 125000, loanDueDate: '2025-01-15', creditLimit: 500000 },
  { id: 'cust-002', name: 'Chamari Silva', nameSi: 'චමරි සිල්වා', businessName: 'Silva Home Décor', email: 'chamari@silvahomedecor.lk', phone: '+94 77 888 4567', address: '78 Lake View, Kandy', registrationDate: '2024-03-15', totalSpent: 356000, customerType: 'regular', isActive: true, loanBalance: 0 },
  { id: 'cust-003', name: 'Dinesh Wickramasinghe', nameSi: 'දිනේශ් වික්‍රමසිංහ', businessName: 'D.W. Electrical Solutions', email: 'dinesh@dwelectrical.lk', phone: '+94 70 222 7890', phone2: '+94 11 567 8901', nic: '821234568V', address: '12 Fort Street, Galle', registrationDate: '2024-04-20', totalSpent: 678000, customerType: 'credit', isActive: true, loanBalance: 85000, loanDueDate: '2024-12-20', creditLimit: 200000 },
  { id: 'cust-004', name: 'Amali Gunasekara', nameSi: 'අමාලි ගුණසේකර', businessName: 'Gunasekara Hardware Mart', email: 'amali@ghmart.lk', phone: '+94 76 333 2468', address: '90 Main Street, Negombo', registrationDate: '2024-05-05', totalSpent: 445000, customerType: 'wholesale', isActive: true, loanBalance: 0, creditLimit: 300000 },
  { id: 'cust-005', name: 'Kasun Bandara', nameSi: 'කසුන් බණ්ඩාර', businessName: 'Bandara Industrial Supplies', email: 'kasun@bandaraindustrial.lk', phone: '+94 78 444 1357', nic: '901234569V', address: '156 Industrial Zone, Colombo 15', photo: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop', registrationDate: '2024-06-12', totalSpent: 1250000, customerType: 'wholesale', isActive: true, loanBalance: 250000, loanDueDate: '2025-02-28', creditLimit: 1000000 },
  { id: 'cust-006', name: 'Sanduni Herath', nameSi: 'සඳුනි හෙරත්', businessName: 'Herath Construction', email: 'sanduni@herathconstruction.lk', phone: '+94 75 666 9876', address: '34 Hill Road, Nuwara Eliya', registrationDate: '2024-07-08', totalSpent: 567000, customerType: 'credit', isActive: true, loanBalance: 45000, loanDueDate: '2024-11-30', creditLimit: 150000 },
  { id: 'cust-007', name: 'Pradeep Fernando', nameSi: 'ප්‍රදීප් ෆර්නාන්දෝ', businessName: 'Fernando & Sons Hardware', email: 'pradeep@fernandohardware.lk', phone: '+94 72 111 2233', phone2: '+94 11 888 9999', nic: '781234570V', address: '22 Galle Road, Moratuwa', photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop', registrationDate: '2024-08-01', totalSpent: 234000, customerType: 'regular', isActive: true, loanBalance: 0 },
  { id: 'cust-008', name: 'Malika Perera', nameSi: 'මලිකා පෙරේරා', businessName: 'Perera Paints & More', email: 'malika@pererapaints.lk', phone: '+94 77 999 8877', address: '55 Kandy Road, Kadawatha', registrationDate: '2024-01-20', totalSpent: 189000, customerType: 'regular', isActive: false, loanBalance: 12000, loanDueDate: '2024-10-15', creditLimit: 50000 },
];

// Enhanced Products with Sri Lankan Hardware Focus (legacy, kept for backward compatibility)
export const mockProducts: Product[] = [
  { id: 'prod-001', name: 'INSEE Sanstha Cement', nameAlt: 'ඉන්සී සංස්ථා සිමෙන්ති', sku: 'CEM-INSEE-50', barcode: '8901234567001', description: 'Premium quality Portland cement for all construction needs.', categoryId: 'cat-001', category: 'building_materials', subcategory: 'cement', brandId: 'brand-001', brand: 'INSEE', costPrice: 1850, wholesalePrice: 1950, retailPrice: 2100, discountedPrice: 1950, stock: 250, minStock: 50, maxStock: 500, unit: 'bag', sizes: ['50kg'], hasVariants: false, manufacturer: 'INSEE Cement', countryOfOrigin: 'Sri Lanka', supplierId: 'sup-001', supplierName: 'INSEE Cement (Lanka) Ltd', isActive: true, isFeatured: true, createdAt: '2024-01-15', updatedAt: '2024-12-01' },
  { id: 'prod-002', name: 'Tokyo Super Cement', nameAlt: 'ටෝකියෝ සුපර් සිමෙන්ති', sku: 'CEM-TOKYO-50', barcode: '8901234567002', description: 'High-strength cement for heavy-duty construction.', categoryId: 'cat-001', category: 'building_materials', subcategory: 'cement', brandId: 'brand-002', brand: 'Tokyo Cement', costPrice: 1900, wholesalePrice: 2000, retailPrice: 2200, discountedPrice: 1999, stock: 180, minStock: 40, maxStock: 400, unit: 'bag', sizes: ['50kg'], hasVariants: false, manufacturer: 'Tokyo Cement PLC', countryOfOrigin: 'Sri Lanka', supplierId: 'sup-002', supplierName: 'Tokyo Cement Company', isActive: true, isFeatured: true, createdAt: '2024-01-15', updatedAt: '2024-12-01' },
  { id: 'prod-003', name: 'Lanwa Steel Bar', nameAlt: 'ලන්වා වානේ කූරු', sku: 'STL-LANWA-10', barcode: '8901234567003', description: 'High tensile strength steel reinforcement bars.', categoryId: 'cat-002', category: 'steel_metal', subcategory: 'reinforcement', brandId: 'brand-004', brand: 'Lanwa', costPrice: 280, wholesalePrice: 310, retailPrice: 350, stock: 500, minStock: 100, maxStock: 1000, unit: 'kg', sizes: ['8mm', '10mm', '12mm', '16mm', '20mm', '25mm'], hasVariants: true, variants: [
    { id: 'var-003-1', productId: 'prod-003', size: '8mm', sku: 'STL-LANWA-8MM', barcode: '8901234567003001', costPrice: 270, wholesalePrice: 300, retailPrice: 340, discountedPrice: 299, stock: 150, minStock: 30, isActive: true },
    { id: 'var-003-2', productId: 'prod-003', size: '10mm', sku: 'STL-LANWA-10MM', barcode: '8901234567003002', costPrice: 280, wholesalePrice: 310, retailPrice: 350, discountedPrice: 315, stock: 200, minStock: 40, isActive: true },
    { id: 'var-003-3', productId: 'prod-003', size: '12mm', sku: 'STL-LANWA-12MM', barcode: '8901234567003003', costPrice: 285, wholesalePrice: 315, retailPrice: 360, discountedPrice: 320, stock: 100, minStock: 30, isActive: true },
    { id: 'var-003-4', productId: 'prod-003', size: '16mm', sku: 'STL-LANWA-16MM', barcode: '8901234567003004', costPrice: 290, wholesalePrice: 320, retailPrice: 365, discountedPrice: 330, stock: 50, minStock: 20, isActive: true },
  ], manufacturer: 'Lanwa Steel', countryOfOrigin: 'Sri Lanka', supplierId: 'sup-003', supplierName: 'Lanwa Steel Industries', isActive: true, isFeatured: true, createdAt: '2024-01-20', updatedAt: '2024-12-01' },
  { id: 'prod-004', name: 'Melwa GI Pipe', nameAlt: 'මෙල්වා GI නල', sku: 'PIPE-MELWA-GI', barcode: '8901234567004', description: 'Galvanized iron pipes for plumbing and construction.', categoryId: 'cat-002', category: 'steel_metal', subcategory: 'pipes', brandId: 'brand-005', brand: 'Melwa', costPrice: 850, wholesalePrice: 950, retailPrice: 1100, stock: 120, minStock: 25, maxStock: 200, unit: 'piece', sizes: ['1/2"', '3/4"', '1"', '1 1/4"', '1 1/2"', '2"'], hasVariants: true, variants: [
    { id: 'var-004-1', productId: 'prod-004', size: '1/2"', sku: 'PIPE-MELWA-GI-0.5', barcode: '8901234567004001', costPrice: 650, wholesalePrice: 720, retailPrice: 850, discountedPrice: 749, stock: 30, minStock: 10, isActive: true },
    { id: 'var-004-2', productId: 'prod-004', size: '3/4"', sku: 'PIPE-MELWA-GI-0.75', barcode: '8901234567004002', costPrice: 750, wholesalePrice: 830, retailPrice: 950, discountedPrice: 850, stock: 25, minStock: 10, isActive: true },
    { id: 'var-004-3', productId: 'prod-004', size: '1"', sku: 'PIPE-MELWA-GI-1', barcode: '8901234567004003', costPrice: 850, wholesalePrice: 950, retailPrice: 1100, discountedPrice: 999, stock: 35, minStock: 10, isActive: true },
    { id: 'var-004-4', productId: 'prod-004', size: '1 1/2"', sku: 'PIPE-MELWA-GI-1.5', barcode: '8901234567004004', costPrice: 1200, wholesalePrice: 1350, retailPrice: 1550, discountedPrice: 1399, stock: 20, minStock: 5, isActive: true },
    { id: 'var-004-5', productId: 'prod-004', size: '2"', sku: 'PIPE-MELWA-GI-2', barcode: '8901234567004005', costPrice: 1600, wholesalePrice: 1800, retailPrice: 2100, discountedPrice: 1899, stock: 10, minStock: 5, isActive: true },
  ], manufacturer: 'Melwa Industries', countryOfOrigin: 'Sri Lanka', supplierId: 'sup-005', supplierName: 'National PVC Distributors', isActive: true, createdAt: '2024-02-01', updatedAt: '2024-12-01' },
  { id: 'prod-005', name: 'Kelani House Wire', nameAlt: 'කෙළණි ගෘහ කේබල්', sku: 'ELC-KELANI-HW', barcode: '8901234567005', description: 'PVC insulated copper house wiring cable.', categoryId: 'cat-003', category: 'electrical', subcategory: 'cables', brandId: 'brand-010', brand: 'Kelani Cables', costPrice: 85, wholesalePrice: 95, retailPrice: 110, stock: 2000, minStock: 500, maxStock: 5000, unit: 'meter', sizes: ['1.0mm²', '1.5mm²', '2.5mm²', '4.0mm²', '6.0mm²'], colors: ['Red', 'Black', 'Blue', 'Yellow', 'Green'], hasVariants: true, variants: [
    { id: 'var-005-1', productId: 'prod-005', size: '1.0mm²', color: 'Red', sku: 'ELC-KELANI-1.0-R', barcode: '8901234567005001', costPrice: 65, wholesalePrice: 72, retailPrice: 85, discountedPrice: 75, stock: 500, minStock: 100, isActive: true },
    { id: 'var-005-2', productId: 'prod-005', size: '1.5mm²', color: 'Red', sku: 'ELC-KELANI-1.5-R', barcode: '8901234567005002', costPrice: 85, wholesalePrice: 95, retailPrice: 110, discountedPrice: 95, stock: 600, minStock: 150, isActive: true },
    { id: 'var-005-3', productId: 'prod-005', size: '2.5mm²', color: 'Red', sku: 'ELC-KELANI-2.5-R', barcode: '8901234567005003', costPrice: 135, wholesalePrice: 150, retailPrice: 175, discountedPrice: 155, stock: 400, minStock: 100, isActive: true },
    { id: 'var-005-4', productId: 'prod-005', size: '4.0mm²', color: 'Red', sku: 'ELC-KELANI-4.0-R', barcode: '8901234567005004', costPrice: 210, wholesalePrice: 235, retailPrice: 275, discountedPrice: 245, stock: 300, minStock: 80, isActive: true },
    { id: 'var-005-5', productId: 'prod-005', size: '6.0mm²', color: 'Red', sku: 'ELC-KELANI-6.0-R', barcode: '8901234567005005', costPrice: 320, wholesalePrice: 355, retailPrice: 420, discountedPrice: 380, stock: 200, minStock: 50, isActive: true },
  ], manufacturer: 'Kelani Cables PLC', countryOfOrigin: 'Sri Lanka', supplierId: 'sup-004', supplierName: 'Kelani Cables PLC', isActive: true, isFeatured: true, createdAt: '2024-01-25', updatedAt: '2024-12-01' },
  { id: 'prod-006', name: 'Orange 1-Way Switch', nameAlt: 'ඔරේන්ජ් 1-මාර්ග ස්විචය', sku: 'ELC-ORANGE-SW1', barcode: '8901234567006', description: 'Premium quality electrical switch.', categoryId: 'cat-003', category: 'electrical', subcategory: 'switches', brandId: 'brand-012', brand: 'Orange Electric', costPrice: 120, wholesalePrice: 145, retailPrice: 185, stock: 350, minStock: 50, maxStock: 500, unit: 'piece', colors: ['White', 'Black', 'Grey'], hasVariants: true, variants: [
    { id: 'var-006-1', productId: 'prod-006', color: 'White', sku: 'ELC-ORANGE-SW1-W', barcode: '8901234567006001', costPrice: 120, wholesalePrice: 145, retailPrice: 185, discountedPrice: 159, stock: 200, minStock: 30, isActive: true },
    { id: 'var-006-2', productId: 'prod-006', color: 'Black', sku: 'ELC-ORANGE-SW1-B', barcode: '8901234567006002', costPrice: 130, wholesalePrice: 155, retailPrice: 195, discountedPrice: 169, stock: 100, minStock: 20, isActive: true },
    { id: 'var-006-3', productId: 'prod-006', color: 'Grey', sku: 'ELC-ORANGE-SW1-G', barcode: '8901234567006003', costPrice: 130, wholesalePrice: 155, retailPrice: 195, discountedPrice: 175, stock: 50, minStock: 15, isActive: true },
  ], manufacturer: 'Orange Electric', countryOfOrigin: 'Sri Lanka', supplierId: 'sup-004', supplierName: 'Kelani Cables PLC', isActive: true, createdAt: '2024-02-10', updatedAt: '2024-12-01' },
  { id: 'prod-007', name: 'ACL MCB Single Pole', nameAlt: 'ACL MCB තනි ධ්‍රැවය', sku: 'ELC-ACL-MCB-SP', barcode: '8901234567007', description: 'Miniature Circuit Breaker.', categoryId: 'cat-003', category: 'electrical', subcategory: 'mcb', brandId: 'brand-011', brand: 'ACL Cables', costPrice: 380, wholesalePrice: 420, retailPrice: 495, stock: 180, minStock: 30, maxStock: 300, unit: 'piece', sizes: ['6A', '10A', '16A', '20A', '25A', '32A', '40A', '63A'], hasVariants: true, variants: [
    { id: 'var-007-1', productId: 'prod-007', size: '6A', sku: 'ELC-ACL-MCB-6A', barcode: '8901234567007001', costPrice: 350, wholesalePrice: 390, retailPrice: 460, discountedPrice: 420, stock: 25, minStock: 5, isActive: true },
    { id: 'var-007-2', productId: 'prod-007', size: '16A', sku: 'ELC-ACL-MCB-16A', barcode: '8901234567007002', costPrice: 380, wholesalePrice: 420, retailPrice: 495, discountedPrice: 450, stock: 40, minStock: 10, isActive: true },
    { id: 'var-007-3', productId: 'prod-007', size: '32A', sku: 'ELC-ACL-MCB-32A', barcode: '8901234567007003', costPrice: 420, wholesalePrice: 465, retailPrice: 550, discountedPrice: 499, stock: 35, minStock: 8, isActive: true },
    { id: 'var-007-4', productId: 'prod-007', size: '63A', sku: 'ELC-ACL-MCB-63A', barcode: '8901234567007004', costPrice: 580, wholesalePrice: 640, retailPrice: 750, discountedPrice: 680, stock: 20, minStock: 5, isActive: true },
  ], manufacturer: 'ACL Cables PLC', countryOfOrigin: 'Sri Lanka', supplierId: 'sup-004', supplierName: 'Kelani Cables PLC', isActive: true, createdAt: '2024-02-15', updatedAt: '2024-12-01' },
  { id: 'prod-008', name: 'National PVC Pipe', nameAlt: 'නැෂනල් PVC නල', sku: 'PLB-NATIONAL-PVC', barcode: '8901234567008', description: 'High quality PVC pressure pipes.', categoryId: 'cat-004', category: 'plumbing', subcategory: 'pipes', brandId: 'brand-009', brand: 'National PVC', costPrice: 450, wholesalePrice: 520, retailPrice: 620, stock: 200, minStock: 40, maxStock: 400, unit: 'piece', sizes: ['1/2"', '3/4"', '1"', '1 1/4"', '1 1/2"', '2"', '3"', '4"'], hasVariants: true, variants: [
    { id: 'var-008-1', productId: 'prod-008', size: '1/2"', sku: 'PLB-NAT-PVC-0.5', barcode: '8901234567008001', costPrice: 280, wholesalePrice: 320, retailPrice: 380, discountedPrice: 340, stock: 50, minStock: 15, isActive: true },
    { id: 'var-008-2', productId: 'prod-008', size: '3/4"', sku: 'PLB-NAT-PVC-0.75', barcode: '8901234567008002', costPrice: 350, wholesalePrice: 400, retailPrice: 480, discountedPrice: 430, stock: 45, minStock: 12, isActive: true },
  ], manufacturer: 'National PVC', countryOfOrigin: 'Sri Lanka', supplierId: 'sup-005', supplierName: 'National PVC Distributors', isActive: true, isFeatured: true, createdAt: '2024-02-20', updatedAt: '2024-12-01' },
  { id: 'prod-009', name: 'Nippon Weatherbond', nameAlt: 'නිපොන් වෙදර්බොන්ඩ්', sku: 'PNT-NIPPON-WB', barcode: '8901234567009', description: 'Premium exterior emulsion paint.', categoryId: 'cat-006', category: 'paint', subcategory: 'exterior', brandId: 'brand-006', brand: 'Nippon Paint', costPrice: 4200, wholesalePrice: 4600, retailPrice: 5200, stock: 85, minStock: 15, maxStock: 150, unit: 'liter', sizes: ['1L', '4L', '10L', '20L'], colors: ['White', 'Cream', 'Light Blue', 'Light Green', 'Peach'], hasVariants: true, variants: [
    { id: 'var-009-1', productId: 'prod-009', size: '1L', color: 'White', sku: 'PNT-NIP-WB-1L-W', barcode: '8901234567009001', costPrice: 850, wholesalePrice: 950, retailPrice: 1100, discountedPrice: 999, stock: 20, minStock: 5, isActive: true },
    { id: 'var-009-2', productId: 'prod-009', size: '4L', color: 'White', sku: 'PNT-NIP-WB-4L-W', barcode: '8901234567009002', costPrice: 2800, wholesalePrice: 3100, retailPrice: 3600, discountedPrice: 3200, stock: 25, minStock: 5, isActive: true },
  ], manufacturer: 'Nippon Paint', countryOfOrigin: 'Japan', supplierId: 'sup-006', supplierName: 'Nippon Paint Lanka', isActive: true, isFeatured: true, createdAt: '2024-03-01', updatedAt: '2024-12-01' },
  { id: 'prod-010', name: 'Dulux Super Gloss Enamel', nameAlt: 'ඩල්ක්ස් සුපර් ග්ලොස් එනමල්', sku: 'PNT-DULUX-SGE', barcode: '8901234567010', description: 'High gloss enamel paint.', categoryId: 'cat-006', category: 'paint', subcategory: 'enamel', brandId: 'brand-007', brand: 'Dulux', costPrice: 2800, wholesalePrice: 3100, retailPrice: 3600, stock: 65, minStock: 12, maxStock: 120, unit: 'liter', sizes: ['500ml', '1L', '4L'], colors: ['White', 'Black', 'Red', 'Blue', 'Green', 'Yellow', 'Brown'], hasVariants: true, variants: [
    { id: 'var-010-1', productId: 'prod-010', size: '500ml', color: 'White', sku: 'PNT-DUL-SGE-500-W', barcode: '8901234567010001', costPrice: 750, wholesalePrice: 850, retailPrice: 1000, discountedPrice: 899, stock: 15, minStock: 3, isActive: true },
    { id: 'var-010-2', productId: 'prod-010', size: '1L', color: 'White', sku: 'PNT-DUL-SGE-1L-W', barcode: '8901234567010002', costPrice: 1350, wholesalePrice: 1500, retailPrice: 1750, discountedPrice: 1550, stock: 20, minStock: 5, isActive: true },
  ], manufacturer: 'Dulux (AkzoNobel)', countryOfOrigin: 'Netherlands', supplierId: 'sup-006', supplierName: 'Nippon Paint Lanka', isActive: true, createdAt: '2024-03-05', updatedAt: '2024-12-01' },
  { id: 'prod-011', name: 'Bosch GSB 550 Impact Drill', nameAlt: 'බොෂ් GSB 550 ඉම්පැක්ට් ඩ්‍රිල්', sku: 'TLS-BOSCH-GSB550', barcode: '8901234567011', description: 'Professional impact drill.', categoryId: 'cat-005', category: 'tools', subcategory: 'power_tools', brandId: 'brand-014', brand: 'Bosch', costPrice: 12500, wholesalePrice: 13500, retailPrice: 15500, discountedPrice: 13999, stock: 15, minStock: 3, maxStock: 30, unit: 'piece', hasVariants: false, manufacturer: 'Robert Bosch GmbH', countryOfOrigin: 'Germany', warranty: '1 Year', supplierId: 'sup-007', supplierName: 'Bosch Power Tools Sri Lanka', isActive: true, isFeatured: true, createdAt: '2024-03-10', updatedAt: '2024-12-01' },
  { id: 'prod-012', name: 'Stanley FatMax Tape Measure', nameAlt: 'ස්ටැන්ලි FatMax මීටර් පටිය', sku: 'TLS-STANLEY-TAPE', barcode: '8901234567012', description: 'Professional grade tape measure.', categoryId: 'cat-005', category: 'tools', subcategory: 'measuring', brandId: 'brand-016', brand: 'Stanley', costPrice: 1800, wholesalePrice: 2000, retailPrice: 2400, stock: 45, minStock: 10, maxStock: 80, unit: 'piece', sizes: ['5m', '8m', '10m'], hasVariants: true, variants: [
    { id: 'var-012-1', productId: 'prod-012', size: '5m', sku: 'TLS-STAN-TAPE-5M', barcode: '8901234567012001', costPrice: 1500, wholesalePrice: 1700, retailPrice: 2000, discountedPrice: 1799, stock: 20, minStock: 5, isActive: true },
    { id: 'var-012-2', productId: 'prod-012', size: '8m', sku: 'TLS-STAN-TAPE-8M', barcode: '8901234567012002', costPrice: 1800, wholesalePrice: 2000, retailPrice: 2400, discountedPrice: 2150, stock: 15, minStock: 3, isActive: true },
  ], manufacturer: 'Stanley Black & Decker', countryOfOrigin: 'USA', warranty: '2 Years', supplierId: 'sup-007', supplierName: 'Bosch Power Tools Sri Lanka', isActive: true, createdAt: '2024-03-15', updatedAt: '2024-12-01' },
  { id: 'prod-013', name: 'Wire Nails (Common Nails)', nameAlt: 'වයර් ඇණ', sku: 'HW-NAILS-WIRE', barcode: '8901234567013', description: 'General purpose wire nails.', categoryId: 'cat-007', category: 'hardware', subcategory: 'nails', costPrice: 180, wholesalePrice: 210, retailPrice: 260, stock: 500, minStock: 100, maxStock: 1000, unit: 'kg', sizes: ['1"', '1.5"', '2"', '2.5"', '3"', '4"'], hasVariants: true, variants: [
    { id: 'var-013-1', productId: 'prod-013', size: '1"', sku: 'HW-NAILS-1IN', barcode: '8901234567013001', costPrice: 200, wholesalePrice: 230, retailPrice: 280, discountedPrice: 249, stock: 80, minStock: 20, isActive: true },
    { id: 'var-013-2', productId: 'prod-013', size: '2"', sku: 'HW-NAILS-2IN', barcode: '8901234567013002', costPrice: 190, wholesalePrice: 220, retailPrice: 270, discountedPrice: 240, stock: 120, minStock: 25, isActive: true },
  ], countryOfOrigin: 'Sri Lanka', supplierId: 'sup-003', supplierName: 'Lanwa Steel Industries', isActive: true, createdAt: '2024-03-20', updatedAt: '2024-12-01' },
  { id: 'prod-021', name: 'Hex Bolt & Nut Set', nameAlt: 'හෙක්ස් බෝල්ට් සහ නට්', sku: 'HW-BOLT-HEX', barcode: '8901234567021', description: 'High tensile hex head bolts with matching nuts.', categoryId: 'cat-007', category: 'hardware', subcategory: 'bolts_nuts', costPrice: 45, wholesalePrice: 55, retailPrice: 75, stock: 1000, minStock: 200, maxStock: 2000, unit: 'piece', sizes: ['1/4" x 1"', '1/4" x 2"', '3/8" x 2"', '1/2" x 3"'], hasVariants: true, variants: [
    { id: 'var-021-1', productId: 'prod-021', size: '1/4" x 1"', sku: 'HW-BOLT-0.25X1', barcode: '8901234567021001', costPrice: 25, wholesalePrice: 30, retailPrice: 45, stock: 300, minStock: 50, isActive: true },
  ], supplierId: 'sup-007', supplierName: 'Bosch Power Tools Lanka', isActive: true, createdAt: '2024-04-20', updatedAt: '2024-12-01' },
];

// ──────────────────────────────────────────────
// MOCK INVOICES — 15 rich records with full pricing fields
// Each item carries: displayPrice, ourPrice, originalPrice, cost
// These fields hydrate the QuickCheckout cart on Edit
// ──────────────────────────────────────────────
export const mockInvoices: Invoice[] = [
  {
    id: 'inv-001', invoiceNumber: '146720',
    customerId: 'cust-001', customerName: 'Nimal Rajapaksha',
    items: [
      { id: 'i001a', productId: 'prod-001', productName: 'INSEE Sanstha Cement 50kg', productNameSi: 'ඉන්සී සංස්ථා සිමෙන්ති 50kg', quantity: 50, unitPrice: 2100, originalPrice: 2200, displayPrice: 2200, ourPrice: 2100, cost: 1900, total: 105000 } as any,
      { id: 'i001b', productId: 'prod-003', productName: 'Lanwa Steel Bar 10mm', productNameSi: 'ලන්වා වානේ කූරු 10mm', variantId: 'var-003-2', size: '10mm', quantity: 200, unitPrice: 350, originalPrice: 380, displayPrice: 380, ourPrice: 350, cost: 310, total: 70000 } as any,
      { id: 'i001c', productId: 'prod-008', productName: 'National PVC Pipe 1"', productNameSi: 'නැෂනල් PVC නල 1"', quantity: 20, unitPrice: 620, originalPrice: 650, displayPrice: 650, ourPrice: 620, cost: 550, total: 12400 } as any,
      { id: 'i001d', productId: 'prod-021', productName: 'Harris Paint Brush 3"', productNameSi: 'හැරිස් තීන්ත බුරුසු 3"', quantity: 5, unitPrice: 380, originalPrice: 420, displayPrice: 420, ourPrice: 380, cost: 310, total: 1900 } as any,
    ],
    subtotal: 189300, discount: 500, tax: 0, total: 188800,
    receivedAmount: 200000, changeAmount: 11200,
    issueDate: '2026-06-15', dueDate: '2026-06-15', status: 'paid', paymentMethod: 'cash',
  },
  {
    id: 'inv-002', invoiceNumber: '146721',
    customerId: 'cust-003', customerName: 'Dinesh Wickramasinghe',
    items: [
      { id: 'i002a', productId: 'prod-005', productName: 'Kelani Twin Earth Cable 2.5mm²', productNameSi: 'කැලණි ට්වින් කේබල් 2.5mm²', quantity: 500, unitPrice: 150, originalPrice: 165, displayPrice: 165, ourPrice: 150, cost: 135, total: 75000 } as any,
      { id: 'i002b', productId: 'prod-007', productName: 'ACL Multi-strand Cable 4.0mm²', productNameSi: 'ACL බහු-වයර් කේබල් 4.0mm²', quantity: 200, unitPrice: 235, originalPrice: 260, displayPrice: 260, ourPrice: 235, cost: 210, total: 47000 } as any,
      { id: 'i002c', productId: 'prod-006', productName: 'Orange 2 Gang Light Switch', productNameSi: 'ඔරේන්ජ් 2 ගෑං ස්විච', quantity: 30, unitPrice: 270, originalPrice: 300, displayPrice: 300, ourPrice: 270, cost: 250, total: 8100 } as any,
      { id: 'i002d', productId: 'prod-010', productName: 'Orange 13A Switched Socket', productNameSi: 'ඔරේන්ජ් 13A සොකට්', quantity: 20, unitPrice: 350, originalPrice: 380, displayPrice: 380, ourPrice: 350, cost: 320, total: 7000 } as any,
    ],
    subtotal: 137100, discount: 1000, tax: 0, total: 136100,
    receivedAmount: 136100, changeAmount: 0,
    issueDate: '2026-06-14', dueDate: '2026-07-14', status: 'pending', paymentMethod: 'credit',
  },
  {
    id: 'inv-003', invoiceNumber: '146722',
    customerId: 'cust-005', customerName: 'Kasun Bandara',
    items: [
      { id: 'i003a', productId: 'prod-002', productName: 'Tokyo Super Cement 50kg', productNameSi: 'ටෝකියෝ සුපර් සිමෙන්ති 50kg', quantity: 100, unitPrice: 1900, originalPrice: 2000, displayPrice: 2000, ourPrice: 1900, cost: 1750, total: 190000 } as any,
      { id: 'i003b', productId: 'prod-003', productName: 'Lanwa Steel Bar 12mm', productNameSi: 'ලන්වා වානේ කූරු 12mm', variantId: 'var-003-3', size: '12mm', quantity: 300, unitPrice: 360, originalPrice: 400, displayPrice: 400, ourPrice: 360, cost: 285, total: 108000 } as any,
      { id: 'i003c', productId: 'prod-013', productName: 'GI Binding Wire 5kg Roll', productNameSi: 'GI බැඳුම් කම්බි 5kg', quantity: 20, unitPrice: 1200, originalPrice: 1300, displayPrice: 1300, ourPrice: 1200, cost: 1100, total: 24000 } as any,
      { id: 'i003d', productId: 'prod-021', productName: 'Local River Sand 1 Cube', productNameSi: 'දේශීය ගංගා වැලි 1 කිව්බ්', quantity: 5, unitPrice: 20000, originalPrice: 21500, displayPrice: 21500, ourPrice: 20000, cost: 18000, total: 100000 } as any,
    ],
    subtotal: 422000, discount: 2000, tax: 0, total: 420000,
    receivedAmount: 420000, changeAmount: 0,
    issueDate: '2026-06-13', dueDate: '2026-07-13', status: 'overdue', paymentMethod: 'credit',
  },
  {
    id: 'inv-004', invoiceNumber: '146723',
    customerId: 'cust-002', customerName: 'Chamari Silva',
    items: [
      { id: 'i004a', productId: 'prod-009', productName: 'Nippon Paint 3-in-1 4L White', productNameSi: 'නිපොන් 3-in-1 4L සුදු', quantity: 10, unitPrice: 4600, originalPrice: 5000, displayPrice: 5000, ourPrice: 4600, cost: 4200, total: 46000 } as any,
      { id: 'i004b', productId: 'prod-010', productName: 'Dulux WeatherShield 10L White', productNameSi: 'ඩුලක්ස් වෙදර්ශීල්ඩ් 10L සුදු', quantity: 5, unitPrice: 11500, originalPrice: 12500, displayPrice: 12500, ourPrice: 11500, cost: 10500, total: 57500 } as any,
      { id: 'i004c', productId: 'prod-012', productName: 'Harris Paint Brush 2"', productNameSi: 'හැරිස් තීන්ත බුරුසු 2"', quantity: 12, unitPrice: 310, originalPrice: 340, displayPrice: 340, ourPrice: 310, cost: 280, total: 3720 } as any,
      { id: 'i004d', productId: 'prod-011', productName: 'JAT Sanding Sealer 1L', productNameSi: 'JAT සැන්ඩින් සීලර් 1L', quantity: 8, unitPrice: 920, originalPrice: 1000, displayPrice: 1000, ourPrice: 920, cost: 850, total: 7360 } as any,
    ],
    subtotal: 114580, discount: 580, tax: 0, total: 114000,
    receivedAmount: 114000, changeAmount: 0,
    issueDate: '2026-06-12', dueDate: '2026-06-12', status: 'paid', paymentMethod: 'cash',
  },
  {
    id: 'inv-005', invoiceNumber: '146724',
    customerId: 'cust-004', customerName: 'Amali Gunasekara',
    items: [
      { id: 'i005a', productId: 'prod-011', productName: 'Bosch GSB 550 Impact Drill', productNameSi: 'බොෂ් GSB 550 ඉම්පැක්ට් ඩ්‍රිල්', quantity: 3, unitPrice: 13500, originalPrice: 14500, displayPrice: 14500, ourPrice: 13500, cost: 12500, total: 40500 } as any,
      { id: 'i005b', productId: 'prod-012', productName: 'Makita 9557HN Angle Grinder 4"', productNameSi: 'මකිටා 9557HN ඇංගල් ග්‍රයින්ඩර් 4"', quantity: 2, unitPrice: 10500, originalPrice: 11500, displayPrice: 11500, ourPrice: 10500, cost: 9500, total: 21000 } as any,
      { id: 'i005c', productId: 'prod-017', productName: 'Stanley Hammer 16oz', productNameSi: 'ස්ටැන්ලි හැමර් 16oz', quantity: 10, unitPrice: 1350, originalPrice: 1500, displayPrice: 1500, ourPrice: 1350, cost: 1200, total: 13500 } as any,
      { id: 'i005d', productId: 'prod-018', productName: 'Stanley Pliers 8"', productNameSi: 'ස්ටැන්ලි ප්ලයර්ස් 8"', quantity: 10, unitPrice: 1700, originalPrice: 1900, displayPrice: 1900, ourPrice: 1700, cost: 1500, total: 17000 } as any,
    ],
    subtotal: 92000, discount: 0, tax: 0, total: 92000,
    receivedAmount: 100000, changeAmount: 8000,
    issueDate: '2026-06-11', dueDate: '2026-06-11', status: 'paid', paymentMethod: 'cash',
  },
  {
    id: 'inv-006', invoiceNumber: '146725',
    customerId: 'cust-006', customerName: 'Sanduni Herath',
    items: [
      { id: 'i006a', productId: 'prod-001', productName: 'INSEE Sanstha Cement 50kg', productNameSi: 'ඉන්සී සංස්ථා සිමෙන්ති 50kg', quantity: 30, unitPrice: 2100, originalPrice: 2200, displayPrice: 2200, ourPrice: 2100, cost: 1900, total: 63000 } as any,
      { id: 'i006b', productId: 'prod-026', productName: 'Local Red Brick Standard', productNameSi: 'දේශීය රතු ගඩොල්', quantity: 500, unitPrice: 28, originalPrice: 33, displayPrice: 33, ourPrice: 28, cost: 25, total: 14000 } as any,
      { id: 'i006c', productId: 'prod-027', productName: 'Local River Sand 1/2 Cube', productNameSi: 'ගංගා වැලි 1/2 කිව්බ්', quantity: 3, unitPrice: 10500, originalPrice: 11500, displayPrice: 11500, ourPrice: 10500, cost: 9500, total: 31500 } as any,
      { id: 'i006d', productId: 'prod-025', productName: 'GI Binding Wire 2kg Roll', productNameSi: 'GI බැඳුම් කම්බි 2kg', quantity: 10, unitPrice: 520, originalPrice: 560, displayPrice: 560, ourPrice: 520, cost: 480, total: 5200 } as any,
    ],
    subtotal: 113700, discount: 700, tax: 0, total: 113000,
    receivedAmount: 113000, changeAmount: 0,
    issueDate: '2026-06-10', dueDate: '2026-06-10', status: 'paid', paymentMethod: 'cash',
  },
  {
    id: 'inv-007', invoiceNumber: '146726',
    customerId: 'cust-007', customerName: 'Pradeep Fernando',
    items: [
      { id: 'i007a', productId: 'prod-008', productName: 'S-lon PVC Pipe 40mm Commercial', productNameSi: 'S-lon PVC නල 40mm', quantity: 40, unitPrice: 680, originalPrice: 750, displayPrice: 750, ourPrice: 680, cost: 620, total: 27200 } as any,
      { id: 'i007b', productId: 'prod-009', productName: 'S-lon PVC Elbow 1"', productNameSi: 'S-lon PVC කොනු 1"', quantity: 80, unitPrice: 55, originalPrice: 65, displayPrice: 65, ourPrice: 55, cost: 45, total: 4400 } as any,
      { id: 'i007c', productId: 'prod-004', productName: 'Lanwa GI Pipe 1" (6m)', productNameSi: 'ලන්වා GI නල 1" (6m)', quantity: 15, unitPrice: 950, originalPrice: 1050, displayPrice: 1050, ourPrice: 950, cost: 850, total: 14250 } as any,
      { id: 'i007d', productId: 'prod-024', productName: 'AMW Rubber Hose 3/4" Per Meter', productNameSi: 'AMW රබර් හෝස් 3/4"', quantity: 50, unitPrice: 310, originalPrice: 340, displayPrice: 340, ourPrice: 310, cost: 280, total: 15500 } as any,
    ],
    subtotal: 61350, discount: 350, tax: 0, total: 61000,
    receivedAmount: 65000, changeAmount: 4000,
    issueDate: '2026-06-09', dueDate: '2026-06-09', status: 'paid', paymentMethod: 'cash',
  },
  {
    id: 'inv-008', invoiceNumber: '146727',
    customerId: 'walk-in', customerName: 'සාමාන්‍ය පාරිභෝගිකයා',
    items: [
      { id: 'i008a', productId: 'prod-005', productName: 'Kelani Twin Earth Cable 1.5mm²', productNameSi: 'කැලණි ට්වින් කේබල් 1.5mm²', quantity: 100, unitPrice: 95, originalPrice: 105, displayPrice: 105, ourPrice: 95, cost: 85, total: 9500 } as any,
      { id: 'i008b', productId: 'prod-006', productName: 'Orange 1 Gang Light Switch', productNameSi: 'ඔරේන්ජ් 1 ගෑං ස්විච', quantity: 15, unitPrice: 200, originalPrice: 220, displayPrice: 220, ourPrice: 200, cost: 185, total: 3000 } as any,
      { id: 'i008c', productId: 'prod-022', productName: 'Union Mortice Lock 5 Lever', productNameSi: 'යුනියන් 5 ලීවර් අගුල', quantity: 3, unitPrice: 3100, originalPrice: 3400, displayPrice: 3400, ourPrice: 3100, cost: 2800, total: 9300 } as any,
      { id: 'i008d', productId: 'prod-023', productName: 'Yale Padlock 50mm', productNameSi: 'යේල් පැඩ්ලොක් 50mm', quantity: 5, unitPrice: 950, originalPrice: 1050, displayPrice: 1050, ourPrice: 950, cost: 850, total: 4750 } as any,
    ],
    subtotal: 26550, discount: 0, tax: 0, total: 26550,
    receivedAmount: 30000, changeAmount: 3450,
    issueDate: '2026-06-08', dueDate: '2026-06-08', status: 'paid', paymentMethod: 'cash',
  },
  {
    id: 'inv-009', invoiceNumber: '146728',
    customerId: 'cust-008', customerName: 'Malika Perera',
    items: [
      { id: 'i009a', productId: 'prod-012', productName: 'Dulux WeatherShield 4L Cream', productNameSi: 'ඩුලක්ස් වෙදර්ශීල්ඩ් 4L ක්‍රීම්', quantity: 8, unitPrice: 5300, originalPrice: 5800, displayPrice: 5800, ourPrice: 5300, cost: 4800, total: 42400 } as any,
      { id: 'i009b', productId: 'prod-013', productName: 'Nippon Paint 3-in-1 1L Ivory', productNameSi: 'නිපොන් 3-in-1 1L අයිවරි', quantity: 12, unitPrice: 1350, originalPrice: 1500, displayPrice: 1500, ourPrice: 1350, cost: 1200, total: 16200 } as any,
      { id: 'i009c', productId: 'prod-021', productName: 'Harris Paint Brush Set 5pc', productNameSi: 'හැරිස් බුරුසු සෙට් 5pc', quantity: 6, unitPrice: 1350, originalPrice: 1500, displayPrice: 1500, ourPrice: 1350, cost: 1200, total: 8100 } as any,
      { id: 'i009d', productId: 'prod-011', productName: 'JAT Sanding Sealer 2.5L', productNameSi: 'JAT සැන්ඩින් සීලර් 2.5L', quantity: 4, unitPrice: 1950, originalPrice: 2100, displayPrice: 2100, ourPrice: 1950, cost: 1800, total: 7800 } as any,
    ],
    subtotal: 74500, discount: 500, tax: 0, total: 74000,
    receivedAmount: 74000, changeAmount: 0,
    issueDate: '2026-06-07', dueDate: '2026-06-07', status: 'paid', paymentMethod: 'cash',
  },
  {
    id: 'inv-010', invoiceNumber: '146729',
    customerId: 'cust-001', customerName: 'Nimal Rajapaksha',
    items: [
      { id: 'i010a', productId: 'prod-015', productName: 'Anton PVC Water Tank 1000L', productNameSi: 'ඇන්ටන් PVC ජල ටැංකිය 1000L', quantity: 4, unitPrice: 15800, originalPrice: 17000, displayPrice: 17000, ourPrice: 15800, cost: 14500, total: 63200 } as any,
      { id: 'i010b', productId: 'prod-016', productName: 'Arpico Water Tank 500L', productNameSi: 'ආර්පිකෝ ජල ටැංකිය 500L', quantity: 2, unitPrice: 10200, originalPrice: 11000, displayPrice: 11000, ourPrice: 10200, cost: 9500, total: 20400 } as any,
      { id: 'i010c', productId: 'prod-009', productName: 'S-lon PVC Coupling 1"', productNameSi: 'S-lon PVC කප්ලිං 1"', quantity: 30, unitPrice: 45, originalPrice: 55, displayPrice: 55, ourPrice: 45, cost: 35, total: 1350 } as any,
      { id: 'i010d', productId: 'prod-024', productName: 'AMW Rubber Hose 1" Per Meter', productNameSi: 'AMW රබර් හෝස් 1"', quantity: 20, unitPrice: 460, originalPrice: 500, displayPrice: 500, ourPrice: 460, cost: 420, total: 9200 } as any,
    ],
    subtotal: 94150, discount: 150, tax: 0, total: 94000,
    receivedAmount: 94000, changeAmount: 0,
    issueDate: '2026-06-06', dueDate: '2026-07-06', status: 'pending', paymentMethod: 'bank_transfer',
  },
  {
    id: 'inv-011', invoiceNumber: '146730',
    customerId: 'cust-005', customerName: 'Kasun Bandara',
    items: [
      { id: 'i011a', productId: 'prod-018', productName: 'Bosch GBH 2-26 Rotary Hammer', productNameSi: 'බොෂ් GBH 2-26 රොටරි හැමර්', quantity: 2, unitPrice: 35000, originalPrice: 38000, displayPrice: 38000, ourPrice: 35000, cost: 32000, total: 70000 } as any,
      { id: 'i011b', productId: 'prod-019', productName: 'Makita GA7020 Angle Grinder 7"', productNameSi: 'මකිටා GA7020 7" ග්‍රයින්ඩර්', quantity: 3, unitPrice: 20000, originalPrice: 22000, displayPrice: 22000, ourPrice: 20000, cost: 18500, total: 60000 } as any,
      { id: 'i011c', productId: 'prod-017', productName: 'Stanley Screwdriver Set 6pc', productNameSi: 'ස්ටැන්ලි ස්ක්‍රූ ඩ්‍රයිවර් සෙට් 6pc', quantity: 5, unitPrice: 2000, originalPrice: 2200, displayPrice: 2200, ourPrice: 2000, cost: 1800, total: 10000 } as any,
      { id: 'i011d', productId: 'prod-020', productName: 'DSI Safety Boots Size 9', productNameSi: 'DSI ආරක්ෂණ බූට් 9 සයිස්', quantity: 10, unitPrice: 3800, originalPrice: 4200, displayPrice: 4200, ourPrice: 3800, cost: 3500, total: 38000 } as any,
    ],
    subtotal: 178000, discount: 3000, tax: 0, total: 175000,
    receivedAmount: 175000, changeAmount: 0,
    issueDate: '2026-06-05', dueDate: '2026-07-05', status: 'pending', paymentMethod: 'bank_transfer',
  },
  {
    id: 'inv-012', invoiceNumber: '146731',
    customerId: 'cust-003', customerName: 'Dinesh Wickramasinghe',
    items: [
      { id: 'i012a', productId: 'prod-010', productName: 'National PVC Conduit 25mm', productNameSi: 'නැෂනල් PVC කොන්ඩියුට් 25mm', quantity: 100, unitPrice: 180, originalPrice: 200, displayPrice: 200, ourPrice: 180, cost: 160, total: 18000 } as any,
      { id: 'i012b', productId: 'prod-007', productName: 'ACL Multi-strand Cable 2.5mm²', productNameSi: 'ACL බහු-වයර් කේබල් 2.5mm²', quantity: 300, unitPrice: 150, originalPrice: 165, displayPrice: 165, ourPrice: 150, cost: 135, total: 45000 } as any,
      { id: 'i012c', productId: 'prod-006', productName: 'Orange Fan Speed Controller', productNameSi: 'ඔරේන්ජ් ෆෑන් ස්පීඩ් කන්ට්‍රෝලර්', quantity: 15, unitPrice: 700, originalPrice: 780, displayPrice: 780, ourPrice: 700, cost: 650, total: 10500 } as any,
      { id: 'i012d', productId: 'prod-006', productName: 'Orange 15A Round Pin Socket', productNameSi: 'ඔරේන්ජ් 15A රවුන්ඩ් සොකට්', quantity: 20, unitPrice: 520, originalPrice: 580, displayPrice: 580, ourPrice: 520, cost: 480, total: 10400 } as any,
    ],
    subtotal: 83900, discount: 900, tax: 0, total: 83000,
    receivedAmount: 83000, changeAmount: 0,
    issueDate: '2026-06-04', dueDate: '2026-06-04', status: 'paid', paymentMethod: 'cash',
  },
  {
    id: 'inv-013', invoiceNumber: '146732',
    customerId: 'walk-in', customerName: 'සාමාන්‍ය පාරිභෝගිකයා',
    items: [
      { id: 'i013a', productId: 'prod-002', productName: 'Tokyo Super Cement 50kg', productNameSi: 'ටෝකියෝ සුපර් සිමෙන්ති 50kg', quantity: 20, unitPrice: 1900, originalPrice: 2000, displayPrice: 2000, ourPrice: 1900, cost: 1750, total: 38000 } as any,
      { id: 'i013b', productId: 'prod-028', productName: 'Local Red Brick Wire Cut', productNameSi: 'දේශීය රතු ගඩොල් (වයර් කට්)', quantity: 300, unitPrice: 33, originalPrice: 38, displayPrice: 38, ourPrice: 33, cost: 30, total: 9900 } as any,
      { id: 'i013c', productId: 'prod-027', productName: 'Metal Crushed Stone 1/4 Cube 3/4"', productNameSi: 'ලෝහ ගල් 1/4 කිව්බ් 3/4"', quantity: 4, unitPrice: 5000, originalPrice: 5500, displayPrice: 5500, ourPrice: 5000, cost: 4500, total: 20000 } as any,
      { id: 'i013d', productId: 'prod-030', productName: 'SS Wood Screws 2" Box 100pc', productNameSi: 'SS ලී ඉස්කුරුප්පු 2" 100pc', quantity: 10, unitPrice: 720, originalPrice: 800, displayPrice: 800, ourPrice: 720, cost: 650, total: 7200 } as any,
    ],
    subtotal: 75100, discount: 100, tax: 0, total: 75000,
    receivedAmount: 75000, changeAmount: 0,
    issueDate: '2026-06-03', dueDate: '2026-06-03', status: 'paid', paymentMethod: 'cash',
  },
  {
    id: 'inv-014', invoiceNumber: '146733',
    customerId: 'cust-004', customerName: 'Amali Gunasekara',
    items: [
      { id: 'i014a', productId: 'prod-014', productName: 'Rhino Asbestos Sheet 10ft', productNameSi: 'රයිනෝ ඇස්බැස්ටෝස් 10ft', quantity: 30, unitPrice: 1150, originalPrice: 1280, displayPrice: 1280, ourPrice: 1150, cost: 1050, total: 34500 } as any,
      { id: 'i014b', productId: 'prod-001', productName: 'INSEE Sanstha Cement 50kg', productNameSi: 'ඉන්සී සංස්ථා සිමෙන්ති 50kg', quantity: 20, unitPrice: 2100, originalPrice: 2200, displayPrice: 2200, ourPrice: 2100, cost: 1900, total: 42000 } as any,
      { id: 'i014c', productId: 'prod-025', productName: 'GI Binding Wire 1kg Roll', productNameSi: 'GI බැඳුම් කම්බි 1kg', quantity: 15, unitPrice: 280, originalPrice: 310, displayPrice: 310, ourPrice: 280, cost: 250, total: 4200 } as any,
      { id: 'i014d', productId: 'prod-030', productName: 'SS Wood Screws 1.5" Box 100pc', productNameSi: 'SS ලී ඉස්කුරුප්පු 1.5" 100pc', quantity: 8, unitPrice: 600, originalPrice: 660, displayPrice: 660, ourPrice: 600, cost: 550, total: 4800 } as any,
    ],
    subtotal: 85500, discount: 500, tax: 0, total: 85000,
    receivedAmount: 85000, changeAmount: 0,
    issueDate: '2026-06-02', dueDate: '2026-06-02', status: 'paid', paymentMethod: 'cash',
  },
  {
    id: 'inv-015', invoiceNumber: '146734',
    customerId: 'cust-002', customerName: 'Chamari Silva',
    items: [
      { id: 'i015a', productId: 'prod-016', productName: 'Arpico Water Tank 1000L', productNameSi: 'ආර්පිකෝ ජල ටැංකිය 1000L', quantity: 1, unitPrice: 16800, originalPrice: 18000, displayPrice: 18000, ourPrice: 16800, cost: 15500, total: 16800 } as any,
      { id: 'i015b', productId: 'prod-022', productName: 'Union Mortice Lock 3 Lever', productNameSi: 'යුනියන් 3 ලීවර් දොර අගුල', quantity: 4, unitPrice: 2000, originalPrice: 2200, displayPrice: 2200, ourPrice: 2000, cost: 1800, total: 8000 } as any,
      { id: 'i015c', productId: 'prod-023', productName: 'Yale Padlock 40mm', productNameSi: 'යේල් පැඩ්ලොක් 40mm', quantity: 6, unitPrice: 720, originalPrice: 800, displayPrice: 800, ourPrice: 720, cost: 650, total: 4320 } as any,
      { id: 'i015d', productId: 'prod-013', productName: 'Wire Nails 2" 1kg', productNameSi: 'වයර් ඇණ 2" 1kg', quantity: 20, unitPrice: 240, originalPrice: 265, displayPrice: 265, ourPrice: 240, cost: 190, total: 4800 } as any,
    ],
    subtotal: 33920, discount: 0, tax: 0, total: 33920,
    receivedAmount: 35000, changeAmount: 1080,
    issueDate: '2026-06-01', dueDate: '2026-06-01', status: 'paid', paymentMethod: 'cash',
  },
];

// ──────────────────────────────────────────────
// POS Quick Categories
// ──────────────────────────────────────────────
export interface PosItem {
  id: string;
  sku: string;
  name: string;
  nameSi?: string;
  unitRate: number;
  stock: number;
  unit: string;
}
export interface PosCategory {
  id: string;
  name: string;
  nameSi?: string;
  icon: string;
  color: string;
  items: PosItem[];
}

export const posCategories: PosCategory[] = [
  { id: 'cat-pipes', name: 'PVC Pipes', nameSi: 'PVC නල', icon: '🔩', color: 'from-cyan-500 to-blue-600', items: [
    { id: 'pipe-001', sku: 'PVC-1INCH', name: 'PVC Pipe 1 inch', unitRate: 620, stock: 200, unit: 'piece' },
    { id: 'pipe-002', sku: 'PVC-2INCH', name: 'PVC Pipe 2 inch', unitRate: 1000, stock: 150, unit: 'piece' },
    { id: 'pipe-003', sku: 'PVC-3INCH', name: 'PVC Pipe 3 inch', unitRate: 1600, stock: 80, unit: 'piece' },
  ]},
  { id: 'cat-electrical', name: 'Electrical', nameSi: 'විදුලි භාණ්ඩ', icon: '💡', color: 'from-amber-500 to-yellow-600', items: [
    { id: 'elec-001', sku: 'CABLE-1.5', name: 'House Wire 1.5mm', unitRate: 110, stock: 2000, unit: 'meter' },
    { id: 'elec-002', sku: 'SWITCH-1W', name: '1-Way Switch White', unitRate: 185, stock: 350, unit: 'piece' },
    { id: 'elec-003', sku: 'SOCKET-13A', name: '13A Socket White', unitRate: 320, stock: 200, unit: 'piece' },
  ]},
  { id: 'cat-hand-tools', name: 'Hand Tools', nameSi: 'අත් මෙවලම්', icon: '🔨', color: 'from-orange-500 to-red-600', items: [
    { id: 'tool-001', sku: 'HAMMER-CLAW', name: 'Claw Hammer 16oz', unitRate: 850, stock: 45, unit: 'piece' },
    { id: 'tool-002', sku: 'PLIERS-COMB', name: 'Combination Pliers 8"', unitRate: 650, stock: 60, unit: 'piece' },
  ]},
  { id: 'cat-steel', name: 'Steel Bars', nameSi: 'වානේ කූරු', icon: '🏗️', color: 'from-slate-600 to-slate-800', items: [
    { id: 'stl-001', sku: 'TMT-10MM', name: 'TMT Bar 10mm', unitRate: 350, stock: 500, unit: 'kg' },
    { id: 'stl-002', sku: 'TMT-12MM', name: 'TMT Bar 12mm', unitRate: 360, stock: 450, unit: 'kg' },
  ]},
  { id: 'cat-paint', name: 'Paint', nameSi: 'තීන්ත', icon: '🎨', color: 'from-pink-500 to-purple-600', items: [
    { id: 'pnt-001', sku: 'EMULSION-4L', name: 'Interior Emulsion 4L White', unitRate: 3200, stock: 85, unit: 'liter' },
  ]},
  { id: 'cat-cement', name: 'Cement', nameSi: 'සිමෙන්ති', icon: '🧱', color: 'from-slate-500 to-gray-700', items: [
    { id: 'cem-001', sku: 'CEM-INSEE-50', name: 'INSEE Cement 50kg', unitRate: 2100, stock: 250, unit: 'bag' },
  ]},
  { id: 'cat-plumbing', name: 'Plumbing', nameSi: 'නල කටයුතු', icon: '🚰', color: 'from-teal-500 to-emerald-600', items: [
    { id: 'plu-001', sku: 'TAP-KITCHEN', name: 'Kitchen Mixer Tap', unitRate: 3500, stock: 30, unit: 'piece' },
  ]},
  { id: 'cat-gardening', name: 'Gardening', nameSi: 'උද්‍යාන', icon: '🌿', color: 'from-green-500 to-emerald-700', items: [
    { id: 'gar-001', sku: 'SHOVEL', name: 'Garden Shovel', unitRate: 850, stock: 40, unit: 'piece' },
  ]},
  { id: 'cat-hardware', name: 'Hardware', nameSi: 'දෘඪාංග', icon: '🔩', color: 'from-rose-500 to-pink-600', items: [
    { id: 'hrd-001', sku: 'NAIL-2IN', name: 'Wire Nails 2" 1kg', unitRate: 270, stock: 300, unit: 'kg' },
  ]},
];

// ──────────────────────────────────────────────
// HELPERS
// ──────────────────────────────────────────────
export function deriveInventoryStatus(storeQty: number): InventoryProduct['status'] {
  if (storeQty === 0) return 'Out of Stock';
  if (storeQty <= 10) return 'Low Stock';
  return 'Available';
}