import React, { useState, useEffect } from 'react';
import { Product, ProductVariant } from '../../types/index';
import { mockBrands, mockCategories, mockSuppliers } from '../../data/mockData';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../contexts/ThemeContext';
import { translateToSinhala } from '../../lib/sinhalaTranslator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { Package, Tag, DollarSign, Boxes, FileText, Grid3X3, Save, Plus, Building2, Layers, Trash2, ChevronDown, ChevronUp, Scale, Box, Truck } from 'lucide-react';
import { SearchableSelect } from '../ui/searchable-select';

interface ProductFormModalProps {
  isOpen: boolean;
  product?: Product;
  onClose: () => void;
  onSave: (product: Product) => void;
}

interface ProductFormData {
  name: string;
  
  nameAlt?: string;
  sku: string;
  barcode?: string;
  categoryId: string;
  category: string;
  brandId?: string;
  brand?: string;
  costPrice: number;
  wholesalePrice: number;
  retailPrice: number;
  discountedPrice: number;
  stock: number;
  minStock: number;
  maxStock: number;
  unit: string;
  description: string;
  hasVariants: boolean;
  variants: ProductVariant[];
  sizes: string[];
  colors: string[];
  warranty?: string;
  countryOfOrigin?: string;
  isFeatured: boolean;
  supplierId?: string;
}

export const ProductFormModal: React.FC<ProductFormModalProps> = ({
  isOpen,
  product,
  onClose,
  onSave,
}) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showVariants, setShowVariants] = useState(false);
  
  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    nameAlt: '',
    sku: '',
    barcode: '',
    categoryId: 'cat-001',
    category: 'building_materials',
    brandId: '',
    brand: '',
    costPrice: 0,
    wholesalePrice: 0,
    retailPrice: 0,
    discountedPrice: 0,
    stock: 0,
    minStock: 10,
    maxStock: 100,
    unit: 'piece',
    description: '',
    hasVariants: false,
    variants: [],
    sizes: [],
    colors: [],
    warranty: '',
    countryOfOrigin: 'Sri Lanka',
    isFeatured: false,
    supplierId: '',
  });

  const [newVariant, setNewVariant] = useState<Partial<ProductVariant>>({
    size: '',
    color: '',
    sku: '',
    barcode: '',
    costPrice: 0,
    wholesalePrice: 0,
    retailPrice: 0,
    discountedPrice: undefined,
    stock: 0,
  });

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name,
        nameAlt: product.nameAlt || '',
        sku: product.sku,
        barcode: product.barcode || '',
        categoryId: product.categoryId || 'cat-001',
        category: product.category,
        brandId: product.brandId || '',
        brand: product.brand || '',
        costPrice: product.costPrice || 0,
        wholesalePrice: product.wholesalePrice || 0,
        retailPrice: product.retailPrice || product.price || 0,
        discountedPrice: product.discountedPrice || 0,
        stock: product.stock,
        minStock: product.minStock || 10,
        maxStock: product.maxStock || 100,
        unit: product.unit || 'piece',
        description: product.description,
        hasVariants: product.hasVariants || false,
        variants: product.variants || [],
        sizes: product.sizes || [],
        colors: product.colors || [],
        warranty: product.warranty || '',
        countryOfOrigin: product.countryOfOrigin || 'Sri Lanka',
        isFeatured: product.isFeatured || false,
        supplierId: product.supplierId || '',
      });
      setShowVariants(product.hasVariants || false);
    } else {
      setFormData({
        name: '',
        nameAlt: '',
        sku: '',
        barcode: '',
        categoryId: 'cat-001',
        category: 'building_materials',
        brandId: '',
        brand: '',
        costPrice: 0,
        wholesalePrice: 0,
        retailPrice: 0,
        discountedPrice: 0,
        stock: 0,
        minStock: 10,
        maxStock: 100,
        unit: 'piece',
        description: '',
        hasVariants: false,
        variants: [],
        sizes: [],
        colors: [],
        warranty: '',
        countryOfOrigin: 'Sri Lanka',
        isFeatured: false,
        supplierId: '',
      });
      setShowAdvanced(false);
      setShowVariants(false);
    }
  }, [product, isOpen]);

  const handleCategoryChange = (categoryId: string) => {
    const category = mockCategories.find(c => c.id === categoryId);
    setFormData({
      ...formData,
      categoryId,
      category: category?.name.toLowerCase().replace(/ & /g, '_').replace(/ /g, '_') || 'other',
    });
  };

  const handleBrandChange = (brandId: string) => {
    const brand = mockBrands.find(b => b.id === brandId);
    setFormData({
      ...formData,
      brandId,
      brand: brand?.name || '',
    });
  };

  const addVariant = () => {
    if (!newVariant.sku) return;
    
    const variant: ProductVariant = {
      id: `var-${Date.now()}`,
      productId: product?.id || '',
      size: newVariant.size,
      color: newVariant.color,
      sku: newVariant.sku || '',
      barcode: newVariant.barcode || '',
      costPrice: newVariant.costPrice || 0,
      wholesalePrice: newVariant.wholesalePrice || 0,
      retailPrice: newVariant.retailPrice || 0,
      discountedPrice: newVariant.discountedPrice,
      stock: newVariant.stock || 0,
      minStock: 5,
      isActive: true,
    };
    
    setFormData({
      ...formData,
      hasVariants: true,
      variants: [...formData.variants, variant],
    });
    
    setNewVariant({
      size: '',
      color: '',
      sku: '',
      barcode: '',
      costPrice: formData.costPrice,
      wholesalePrice: formData.wholesalePrice,
      retailPrice: formData.retailPrice,
      discountedPrice: formData.discountedPrice,
      stock: 0,
    });
  };

  const removeVariant = (variantId: string) => {
    setFormData({
      ...formData,
      variants: formData.variants.filter(v => v.id !== variantId),
      hasVariants: formData.variants.length > 1,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Clear main barcode when product has variants (each variant has its own barcode)
    const effectiveBarcode = formData.hasVariants && formData.variants.length > 0 ? '' : formData.barcode;
    
    // Auto-translate product name to Sinhala if nameAlt is empty
    const sinhalaName = formData.nameAlt || translateToSinhala(formData.name);
    
    const newProduct: Product = {
      id: product?.id || `prod-${Date.now()}`,
      name: formData.name,
      nameAlt: sinhalaName,
      sku: formData.sku,
      barcode: effectiveBarcode,
      categoryId: formData.categoryId,
      category: formData.category as Product['category'],
      brandId: formData.brandId,
      brand: formData.brand,
      costPrice: formData.costPrice,
      wholesalePrice: formData.wholesalePrice,
      retailPrice: formData.retailPrice,
      discountedPrice: formData.discountedPrice > 0 ? formData.discountedPrice : undefined,
      price: formData.retailPrice, // backward compatibility
      stock: formData.stock,
      minStock: formData.minStock,
      maxStock: formData.maxStock,
      unit: formData.unit as Product['unit'],
      description: formData.description,
      hasVariants: formData.hasVariants,
      variants: formData.variants,
      sizes: formData.sizes,
      colors: formData.colors,
      warranty: formData.warranty,
      countryOfOrigin: formData.countryOfOrigin,
      isFeatured: formData.isFeatured,
      supplierId: formData.supplierId,
      isActive: true,
      createdAt: product?.createdAt || new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
    };
    onSave(newProduct);
    onClose();
  };

  const calculateMargin = () => {
    if (formData.costPrice <= 0) return 0;
    return Math.round((formData.retailPrice - formData.costPrice) / formData.costPrice * 100);
  };

  if (!isOpen) return null;

  const isEditing = !!product;
  const inputClasses = `w-full px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all text-sm ${
    theme === 'dark'
      ? 'border-slate-700 bg-slate-800/50 text-white placeholder-slate-500'
      : 'border-slate-300 bg-slate-50 text-slate-900 placeholder-slate-400'
  }`;
  const labelClasses = `text-xs font-medium ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={`max-w-4xl max-h-[90vh] overflow-y-auto p-0 ${
        theme === 'dark' ? 'bg-slate-900 border-slate-700/50' : 'bg-white border-slate-200'
      }`}>
        <DialogHeader className="sr-only">
          <DialogTitle>{isEditing ? t('productsForm.editProduct') : t('productsForm.addNewProduct')}</DialogTitle>
          <DialogDescription>
            {isEditing ? t('productsForm.updateInfo') : t('productsForm.addInfo')}
          </DialogDescription>
        </DialogHeader>
        {/* Gradient Header */}
        <div className={`p-5 text-white ${isEditing 
          ? 'bg-gradient-to-r from-amber-500 via-orange-500 to-red-500' 
          : 'bg-gradient-to-r from-purple-600 via-violet-600 to-indigo-600'
        }`} aria-hidden="true">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
              <Package className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold">
                {isEditing ? t('productsForm.editProduct') : t('productsForm.addNewProduct')}
              </h2>
              <p className={`text-sm ${isEditing ? 'text-amber-100' : 'text-purple-100'}`}>
                {isEditing ? t('productsForm.updateInfo') : t('productsForm.addInfo')}
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-5">
          {/* Basic Information */}
          <div className="space-y-3">
            <div className={`flex items-center gap-2 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>
              <Tag className="w-4 h-4" />
              <span className="text-sm font-semibold">{t('productsForm.basicInfo')}</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className={labelClasses}>{t('productsForm.productName')} *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={inputClasses}
                  placeholder={t('productsForm.placeholders.productName')}
                />
              </div>
              <div className="space-y-1.5">
                <label className={labelClasses}>{t('productsForm.sinhalaName')}</label>
                <input
                  type="text"
                  value={formData.nameAlt}
                  onChange={(e) => setFormData({ ...formData, nameAlt: e.target.value })}
                  className={inputClasses}
                  placeholder={t('productsForm.placeholders.sinhalaName')}
                />
              </div>
              <div className="space-y-1.5">
                <label className={labelClasses}>{t('productsForm.sku')} *</label>
                <input
                  type="text"
                  required
                  value={formData.sku}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                  className={inputClasses}
                  placeholder={t('productsForm.placeholders.sku')}
                />
              </div>
              <div className="space-y-1.5">
                <label className={labelClasses}>
                  {t('productsForm.barcode')}
                  {formData.hasVariants && formData.variants.length > 0 && (
                    <span className="ml-2 text-[10px] text-amber-500 font-normal">
                      ({t('productsForm.managedByVariants')})
                    </span>
                  )}
                </label>
                <input
                  type="text"
                  value={formData.hasVariants && formData.variants.length > 0 ? '' : formData.barcode}
                  onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                  className={`${inputClasses} ${formData.hasVariants && formData.variants.length > 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                  placeholder={formData.hasVariants && formData.variants.length > 0 ? t('productsForm.placeholders.barcodeManagedByVariants') : t('productsForm.placeholders.barcode')}
                  disabled={formData.hasVariants && formData.variants.length > 0}
                />
              </div>
            </div>
          </div>

          {/* Category & Brand */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className={`${labelClasses} flex items-center gap-1`}>
                <Layers className="w-3.5 h-3.5" /> {t('productsForm.category')} * <span className="text-xs text-slate-500">({mockCategories.length} {t('productsForm.available')})</span>
              </label>
              <SearchableSelect
                value={formData.categoryId}
                onValueChange={(value) => handleCategoryChange(value)}
                placeholder={t('common.search')}
                searchPlaceholder={t('common.search')}
                emptyMessage={t('productsForm.messages.noCategories')}
                theme={theme}
                options={mockCategories.map(cat => ({
                  value: cat.id,
                  label: `${cat.name}${cat.nameAlt ? ` (${cat.nameAlt})` : ''}`,
                  icon: <Layers className="w-4 h-4" />
                }))}
              />
            </div>
            <div className="space-y-1.5">
              <label className={`${labelClasses} flex items-center gap-1`}>
                <Building2 className="w-3.5 h-3.5" /> {t('productsForm.brand')} <span className="text-xs text-slate-500">({mockBrands.filter(b => b.isActive).length} {t('productsForm.available')})</span>
              </label>
              <SearchableSelect
                value={formData.brandId || ''}
                onValueChange={(value) => handleBrandChange(value)}
                placeholder={t('productsForm.placeholders.selectBrand')}
                searchPlaceholder={t('common.search')}
                emptyMessage={t('productsForm.messages.noBrands')}
                theme={theme}
                options={[
                  { value: '', label: t('productsForm.messages.noBrand'), icon: <Building2 className="w-4 h-4 text-slate-400" /> },
                  ...mockBrands.filter(b => b.isActive).map(brand => ({
                    value: brand.id,
                    label: `${brand.name} (${brand.country})`,
                    icon: <Building2 className="w-4 h-4" />
                  }))
                ]}
              />
            </div>
            <div className="space-y-1.5">
              <label className={`${labelClasses} flex items-center gap-1`}>
                <Scale className="w-3.5 h-3.5" /> {t('productsForm.unit')} *
              </label>
              <SearchableSelect
                value={formData.unit}
                onValueChange={(value) => setFormData({ ...formData, unit: value })}
                placeholder={t('productsForm.placeholders.selectUnit')}
                searchPlaceholder={t('common.search')}
                emptyMessage={t('productsForm.messages.noUnits')}
                theme={theme}
                options={[
                  { value: 'piece', label: t('productsForm.units.piece'), icon: <Box className="w-4 h-4" /> },
                  { value: 'kg', label: t('productsForm.units.kg'), icon: <Scale className="w-4 h-4" /> },
                  { value: 'meter', label: t('productsForm.units.meter'), icon: <Scale className="w-4 h-4" /> },
                  { value: 'liter', label: t('productsForm.units.liter'), icon: <Scale className="w-4 h-4" /> },
                  { value: 'bag', label: t('productsForm.units.bag'), icon: <Package className="w-4 h-4" /> },
                  { value: 'box', label: t('productsForm.units.box'), icon: <Box className="w-4 h-4" /> },
                  { value: 'sheet', label: t('productsForm.units.sheet'), icon: <Layers className="w-4 h-4" /> },
                  { value: 'roll', label: t('productsForm.units.roll'), icon: <Package className="w-4 h-4" /> },
                  { value: 'set', label: t('productsForm.units.set'), icon: <Boxes className="w-4 h-4" /> },
                ]}
              />
            </div>
          </div>

          {/* Pricing Section */}
          <div className="space-y-3">
            <div className={`flex items-center gap-2 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>
              <DollarSign className="w-4 h-4" />
              <span className="text-sm font-semibold">{t('productsForm.pricing')}</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-1.5">
                <label className={labelClasses}>{t('productsForm.costPrice')} *</label>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  value={formData.costPrice}
                  onChange={(e) => setFormData({ ...formData, costPrice: parseFloat(e.target.value) || 0 })}
                  className={inputClasses}
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-1.5">
                <label className={labelClasses}>{t('productsForm.wholesalePrice')} *</label>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  value={formData.wholesalePrice}
                  onChange={(e) => setFormData({ ...formData, wholesalePrice: parseFloat(e.target.value) || 0 })}
                  className={`${inputClasses} border-blue-500/50`}
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-1.5">
                <label className={labelClasses}>{t('productsForm.retailPrice')} ({t('productsForm.normalPrice')}) *</label>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  value={formData.retailPrice}
                  onChange={(e) => setFormData({ ...formData, retailPrice: parseFloat(e.target.value) || 0 })}
                  className={`${inputClasses} border-green-500/50`}
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-1.5">
                <label className={labelClasses}>{t('productsForm.discountedPrice')}</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.discountedPrice || ''}
                  onChange={(e) => setFormData({ ...formData, discountedPrice: parseFloat(e.target.value) || 0 })}
                  className={`${inputClasses} border-pink-500/50`}
                  placeholder={t('productsForm.placeholders.discountedPrice')}
                />
                {formData.discountedPrice > 0 && formData.discountedPrice < formData.retailPrice && (
                  <p className="text-xs text-pink-500 mt-1">
                    {t('productsForm.savingsLabel')}: {t('common.currency')} {(formData.retailPrice - formData.discountedPrice).toLocaleString()} ({Math.round((1 - formData.discountedPrice / formData.retailPrice) * 100)}% {t('invoice.off')})
                  </p>
                )}
              </div>
            </div>
            {/* Profit Margin Row */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-1.5">
                <label className={labelClasses}>{t('productsForm.profitMargin')}</label>
                <div className={`px-4 py-2.5 rounded-xl text-sm font-semibold ${
                  calculateMargin() > 20 
                    ? 'bg-green-500/10 text-green-500 border border-green-500/20' 
                    : calculateMargin() > 10 
                    ? 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20'
                    : 'bg-red-500/10 text-red-500 border border-red-500/20'
                }`}>
                  {calculateMargin()}%
                </div>
              </div>
            </div>
          </div>

          {/* Stock Section */}
          <div className="space-y-3">
            <div className={`flex items-center gap-2 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>
              <Boxes className="w-4 h-4" />
              <span className="text-sm font-semibold">{t('productsForm.inventory')}</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className={labelClasses}>{t('productsForm.currentStock')} *</label>
                <input
                  type="number"
                  required
                  min="0"
                  value={formData.stock}
                  onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value) || 0 })}
                  className={inputClasses}
                  placeholder="0"
                />
              </div>
              <div className="space-y-1.5">
                <label className={labelClasses}>{t('productsForm.minStockAlert')}</label>
                <input
                  type="number"
                  min="0"
                  value={formData.minStock}
                  onChange={(e) => setFormData({ ...formData, minStock: parseInt(e.target.value) || 0 })}
                  className={inputClasses}
                  placeholder="10"
                />
              </div>
              <div className="space-y-1.5">
                <label className={labelClasses}>{t('productsForm.maxStockCapacity')}</label>
                <input
                  type="number"
                  min="0"
                  value={formData.maxStock}
                  onChange={(e) => setFormData({ ...formData, maxStock: parseInt(e.target.value) || 0 })}
                  className={inputClasses}
                  placeholder="100"
                />
              </div>
            </div>
          </div>

          {/* Supplier Selection */}
          <div className="space-y-1.5">
            <label className={`${labelClasses} flex items-center gap-1`}>
              <Truck className="w-3.5 h-3.5" /> {t('productsForm.supplier')}
            </label>
            <SearchableSelect
              value={formData.supplierId || ''}
              onValueChange={(value) => setFormData({ ...formData, supplierId: value })}
              options={mockSuppliers.filter(s => s.isActive).map(supplier => ({
                value: supplier.id,
                label: supplier.name,
              }))}
              placeholder={t('productsForm.selectSupplier')}
              theme={theme}
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className={`${labelClasses} flex items-center gap-1`}>
              <FileText className="w-3.5 h-3.5" /> {t('productsForm.description')}
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className={`${inputClasses} resize-none`}
              placeholder={t('productsForm.placeholders.description')}
            />
          </div>

          {/* Variants Section */}
          <div className={`rounded-xl border ${theme === 'dark' ? 'border-slate-700/50 bg-slate-800/30' : 'border-slate-200 bg-slate-50'}`}>
            <button
              type="button"
              onClick={() => setShowVariants(!showVariants)}
              className={`w-full flex items-center justify-between p-4 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}
            >
              <span className="font-medium flex items-center gap-2">
                <Layers className="w-4 h-4" />
                {t('productsForm.productVariants')}
                {formData.variants.length > 0 && (
                  <span className="px-2 py-0.5 text-xs bg-purple-500/20 text-purple-400 rounded-full">
                    {formData.variants.length}
                  </span>
                )}
              </span>
              {showVariants ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            
            {showVariants && (
              <div className="px-4 pb-4 space-y-4">
                {/* Existing Variants */}
                {formData.variants.length > 0 && (
                  <div className="space-y-2">
                    {formData.variants.map((variant) => (
                      <div key={variant.id} className={`p-3 rounded-lg ${theme === 'dark' ? 'bg-slate-700/50' : 'bg-white border border-slate-200'}`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4 flex-wrap">
                            <span className={`text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                              {variant.size || variant.color || variant.sku}
                            </span>
                            <span className="text-xs text-slate-500">{t('productsForm.sku')}: {variant.sku}</span>
                            {variant.barcode && (
                              <span className="text-xs text-blue-500">{t('productsForm.barcode')}: {variant.barcode}</span>
                            )}
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                              {variant.discountedPrice && variant.discountedPrice < variant.retailPrice ? (
                                <>
                                  <span className="text-sm text-slate-400 line-through">{t('common.currency')} {variant.retailPrice.toLocaleString()}</span>
                                  <span className="text-sm text-pink-500 font-medium">{t('common.currency')} {variant.discountedPrice.toLocaleString()}</span>
                                </>
                              ) : (
                                <span className="text-sm text-green-500">{t('common.currency')} {variant.retailPrice.toLocaleString()}</span>
                              )}
                            </div>
                            <span className={`text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>{t('productsForm.placeholders.stock')}: {variant.stock}</span>
                            <button
                              type="button"
                              onClick={() => removeVariant(variant.id)}
                              className="p-1 text-red-400 hover:bg-red-500/10 rounded"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Add New Variant */}
                <div className={`p-3 rounded-lg ${theme === 'dark' ? 'bg-slate-700/30' : 'bg-white border border-slate-200'}`}>
                  <p className={`text-xs font-medium mb-3 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>{t('productsForm.addNewVariant')}</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                    <div className="space-y-1">
                      <label className={`text-[10px] font-medium ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>{t('productsForm.placeholders.size')}</label>
                      <input
                        type="text"
                        value={newVariant.size}
                        onChange={(e) => setNewVariant({ ...newVariant, size: e.target.value })}
                        className={`${inputClasses} text-xs`}
                        placeholder={t('productsForm.placeholders.size')}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className={`text-[10px] font-medium ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>{t('productsForm.placeholders.color')}</label>
                      <input
                        type="text"
                        value={newVariant.color}
                        onChange={(e) => setNewVariant({ ...newVariant, color: e.target.value })}
                        className={`${inputClasses} text-xs`}
                        placeholder={t('productsForm.placeholders.color')}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className={`text-[10px] font-medium ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>{t('productsForm.sku')} *</label>
                      <input
                        type="text"
                        value={newVariant.sku}
                        onChange={(e) => setNewVariant({ ...newVariant, sku: e.target.value })}
                        className={`${inputClasses} text-xs`}
                        placeholder={t('productsForm.placeholders.variantSku')}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className={`text-[10px] font-medium ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>{t('productsForm.barcode')}</label>
                      <input
                        type="text"
                        value={newVariant.barcode}
                        onChange={(e) => setNewVariant({ ...newVariant, barcode: e.target.value })}
                        className={`${inputClasses} text-xs`}
                        placeholder={t('productsForm.placeholders.barcodeOptional')}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="space-y-1">
                      <label className={`text-[10px] font-medium ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>{t('productsForm.costPrice')}</label>
                      <input
                        type="number"
                        value={newVariant.costPrice}
                        onChange={(e) => setNewVariant({ ...newVariant, costPrice: parseFloat(e.target.value) || 0 })}
                        className={`${inputClasses} text-xs`}
                        placeholder={t('productsForm.placeholders.costPrice')}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className={`text-[10px] font-medium ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>{t('productsForm.wholesalePrice')}</label>
                      <input
                        type="number"
                        value={newVariant.wholesalePrice}
                        onChange={(e) => setNewVariant({ ...newVariant, wholesalePrice: parseFloat(e.target.value) || 0 })}
                        className={`${inputClasses} text-xs`}
                        placeholder={t('productsForm.placeholders.wholesalePrice')}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className={`text-[10px] font-medium ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>{t('productsForm.retailPrice')}</label>
                      <input
                        type="number"
                        value={newVariant.retailPrice}
                        onChange={(e) => setNewVariant({ ...newVariant, retailPrice: parseFloat(e.target.value) || 0 })}
                        className={`${inputClasses} text-xs`}
                        placeholder={t('productsForm.placeholders.retailPrice')}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className={labelClasses}>{t('productsForm.discountedPrice')}</label>
                      <input
                        type="number"
                        value={newVariant.discountedPrice || ''}
                        onChange={(e) => setNewVariant({ ...newVariant, discountedPrice: e.target.value ? parseFloat(e.target.value) : undefined })}
                        className={`${inputClasses} text-xs`}
                        placeholder={t('productsForm.placeholders.discountedPrice')}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className={`text-[10px] font-medium ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>{t('productsForm.placeholders.stock')}</label>
                      <input
                        type="number"
                        value={newVariant.stock}
                        onChange={(e) => setNewVariant({ ...newVariant, stock: parseInt(e.target.value) || 0 })}
                        className={`${inputClasses} text-xs`}
                        placeholder={t('productsForm.placeholders.stock')}
                      />
                    </div>
                  </div>
                  <div className="mt-3 flex justify-end">
                    <button
                      type="button"
                      onClick={addVariant}
                      disabled={!newVariant.sku}
                      className="flex items-center justify-center gap-1.5 px-4 py-2 bg-purple-500 hover:bg-purple-600 disabled:bg-slate-500 text-white text-sm font-medium rounded-xl transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      {t('productsForm.addNewVariant')}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Advanced Options */}
          <div className={`rounded-xl border ${theme === 'dark' ? 'border-slate-700/50 bg-slate-800/30' : 'border-slate-200 bg-slate-50'}`}>
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className={`w-full flex items-center justify-between p-4 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}
            >
              <span className="font-medium">{t('productsForm.advancedOptions')}</span>
              {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            
            {showAdvanced && (
              <div className="px-4 pb-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className={labelClasses}>{t('productsForm.warranty')}</label>
                    <input
                      type="text"
                      value={formData.warranty}
                      onChange={(e) => setFormData({ ...formData, warranty: e.target.value })}
                      className={inputClasses}
                      placeholder={t('productsForm.placeholders.warranty')}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className={labelClasses}>{t('productsForm.countryOfOrigin')}</label>
                    <input
                      type="text"
                      value={formData.countryOfOrigin}
                      onChange={(e) => setFormData({ ...formData, countryOfOrigin: e.target.value })}
                      className={inputClasses}
                      placeholder={t('productsForm.placeholders.country')}
                    />
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="featured"
                    checked={formData.isFeatured}
                    onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                    className="w-4 h-4 rounded border-slate-300 text-purple-500 focus:ring-purple-500"
                  />
                  <label htmlFor="featured" className={`text-sm ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
                    {t('productsForm.markFeatured')}
                  </label>
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className={`flex gap-3 pt-4 border-t ${theme === 'dark' ? 'border-slate-700/50' : 'border-slate-200'}`}>
            <button
              type="submit"
              className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 text-white rounded-xl font-semibold transition-all shadow-lg ${
                isEditing
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 shadow-amber-500/25'
                  : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 shadow-purple-500/25'
              }`}
            >
              {isEditing ? <Save className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
              {isEditing ? t('productsForm.saveChanges') : t('productsForm.addProduct')}
            </button>
            <button
              type="button"
              onClick={onClose}
              className={`px-6 py-3 rounded-xl font-semibold transition-colors border ${
                theme === 'dark'
                  ? 'bg-slate-700/50 hover:bg-slate-700 text-white border-slate-600/50'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-900 border-slate-300'
              }`}
            >
              {t('productsForm.cancel')}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
