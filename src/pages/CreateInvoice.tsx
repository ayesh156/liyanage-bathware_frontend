import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { useIsMobile } from '../hooks/use-mobile';
import { mockCustomers, mockProducts, mockInvoices } from '../data/mockData';
import { Customer, Product, Invoice, InvoiceItem, FlattenedProduct } from '../types/index';
import { flattenProducts } from '../lib/utils';
import { printInvoice } from '../components/modals/PrintInvoiceModal';
import { ShortcutMapOverlay, ShortcutHintsBar, CheckoutMode, InvoiceStep } from '../components/ShortcutMapOverlay';
import { generateNextInvoiceNumberSync, initializeFromExistingInvoices } from '../lib/invoiceNumberService';
import {
  FileText, User, Package, CheckCircle, ChevronLeft, ChevronRight,
  Search, Plus, Trash2, Calendar, ArrowLeft, UserX, CreditCard,
  AlertTriangle, Building2, Phone, DollarSign, ShoppingCart, Receipt,
  Percent, Tag, Box, Edit3, PackagePlus, Boxes, Calculator, Zap,
  Keyboard, Barcode, Banknote, Sparkles
} from 'lucide-react';
import { toast } from 'react-toastify';

// Extended Invoice Item with discount tracking and Sinhala translation
interface ExtendedInvoiceItem extends InvoiceItem {
  originalPrice: number; // Original retail price (before any discount)
  productDiscountedPrice?: number; // Price after product discount (before manual discount)
  productDiscountAmount?: number; // Amount saved from product discount
  discountType?: 'percentage' | 'fixed';
  discountValue?: number;
  manualDiscountAmount?: number; // Amount saved from manual discount
  isCustomPrice?: boolean;
  isQuickAdd?: boolean;
  productNameSi?: string; // Sinhala product name for printing
}

type Step = 1 | 2 | 3;

// Price mode options for arrow key cycling
const PRICE_MODES: ('auto' | 'retail' | 'wholesale' | 'custom')[] = ['auto', 'retail', 'wholesale', 'custom'];
const DISCOUNT_TYPES: ('none' | 'percentage' | 'fixed')[] = ['none', 'percentage', 'fixed'];

export const CreateInvoice: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { theme } = useTheme();
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const isSinhala = i18n.language === 'si';
  
  const [customers] = useState<Customer[]>(mockCustomers);
  const [products] = useState<Product[]>(mockProducts);
  
  // Flatten products so each variant appears as a distinct line item
  const flattenedProducts = useMemo(() => flattenProducts(products), [products]);
  
  const [step, setStep] = useState<Step>(1);
  const [selectedCustomer, setSelectedCustomer] = useState<string>('');
  const [isWalkIn, setIsWalkIn] = useState(false);
  const [customerSearch, setCustomerSearch] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [items, setItems] = useState<ExtendedInvoiceItem[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);
  const [discount, setDiscount] = useState<number>(0); // Final Discount 1 (fixed amount)
  const [discountType, setDiscountType] = useState<'none' | 'percentage' | 'fixed'>('none');
  const [bulkDiscountPercent, setBulkDiscountPercent] = useState<number>(0);
  const [enableTax, setEnableTax] = useState<boolean>(false);
  const [taxRate, setTaxRate] = useState<number>(15);
  
  // Received amount and change calculation
  const [receivedAmount, setReceivedAmount] = useState<number>(0);
  
  // Auto-generated but editable invoice number
  const [invoiceNumber, setInvoiceNumber] = useState<string>('');
  
  // Enhanced pricing state
  const [priceMode, setPriceMode] = useState<'auto' | 'wholesale' | 'retail' | 'custom'>('auto');
  const [customPrice, setCustomPrice] = useState<number>(0);
  const [itemDiscountType, setItemDiscountType] = useState<'none' | 'percentage' | 'fixed'>('none');
  const [itemDiscountValue, setItemDiscountValue] = useState<number>(0);
  
  // Focus mode state
  const [currentMode, setCurrentMode] = useState<CheckoutMode>('search');
  const [showShortcutMap, setShowShortcutMap] = useState(false);
  const [isPriceModeFocused, setIsPriceModeFocused] = useState(false);
  const [isItemDiscountFocused, setIsItemDiscountFocused] = useState(false);
  const [selectedCustomerIndex, setSelectedCustomerIndex] = useState(-1);
  const [selectedProductIndex, setSelectedProductIndex] = useState(-1);
  
  // Quick add product state
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [quickAddName, setQuickAddName] = useState('');
  const [quickAddPrice, setQuickAddPrice] = useState<number>(0);
  const [quickAddQty, setQuickAddQty] = useState<number>(1);
  
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState(
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [notes, setNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'bank_transfer' | 'credit'>('cash');
  
  // Cart item editing state
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editingPrice, setEditingPrice] = useState<number>(0);
  const [editingDiscountType, setEditingDiscountType] = useState<'none' | 'percentage' | 'fixed'>('none');
  const [editingDiscountValue, setEditingDiscountValue] = useState<number>(0);
  

  // Refs for keyboard navigation
  const customerSearchRef = useRef<HTMLInputElement>(null);
  const productSearchRef = useRef<HTMLInputElement>(null);
  const barcodeInputRef = useRef<HTMLInputElement>(null);
  const quantityInputRef = useRef<HTMLInputElement>(null);
  const discountInputRef = useRef<HTMLInputElement>(null);
  const receivedAmountInputRef = useRef<HTMLInputElement>(null);
  const invoiceNumberInputRef = useRef<HTMLInputElement>(null);
  const itemDiscountInputRef = useRef<HTMLInputElement>(null);
  const notesInputRef = useRef<HTMLTextAreaElement>(null);
  // Walk-in button ref for quick focus
  const walkInButtonRef = useRef<HTMLButtonElement>(null);
  // Step 3 quick-focus refs
  const paymentMethodFirstRef = useRef<HTMLButtonElement>(null);
  const discountNoneRef = useRef<HTMLButtonElement>(null);
  const taxToggleRef = useRef<HTMLInputElement>(null);
  
  // Refs for scroll synchronization - stores refs to individual items
  const customerItemRefs = useRef<Map<number, HTMLElement>>(new Map());
  const productItemRefs = useRef<Map<number, HTMLElement>>(new Map());

  const currentCustomer = customers.find((c) => c.id === selectedCustomer);
  const isWholesaleCustomer = currentCustomer?.customerType === 'wholesale';
  // selectedProductId now holds flatId (product or variant identifier)
  const currentProduct = flattenedProducts.find((fp) => fp.flatId === selectedProductId);

  // Filter customers by search
  const filteredCustomers = useMemo(() => {
    if (!customerSearch.trim()) return customers;
    const searchLower = customerSearch.toLowerCase();
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(searchLower) ||
        c.businessName.toLowerCase().includes(searchLower) ||
        c.email.toLowerCase().includes(searchLower) ||
        c.phone.includes(searchLower)
    );
  }, [customers, customerSearch]);

  // Filter products by search - uses flattened products for variant display
  const filteredProducts = useMemo((): FlattenedProduct[] => {
    let filtered = flattenedProducts;
    
    if (productSearch.trim()) {
      const selectedFlatProduct = flattenedProducts.find(fp => fp.flatId === selectedProductId);
      if (selectedFlatProduct && productSearch === selectedFlatProduct.displayName) {
        filtered = flattenedProducts;
      } else {
        const searchLower = productSearch.toLowerCase();
        filtered = flattenedProducts.filter(
          (fp) =>
            fp.displayName.toLowerCase().includes(searchLower) ||
            fp.displaySku.toLowerCase().includes(searchLower) ||
            (fp.product.nameAlt && fp.product.nameAlt.includes(searchLower)) ||
            fp.product.category.toLowerCase().includes(searchLower) ||
            (fp.product.brand && fp.product.brand.toLowerCase().includes(searchLower)) ||
            (fp.displayBarcode && fp.displayBarcode.includes(searchLower)) ||
            (fp.variantLabel && fp.variantLabel.toLowerCase().includes(searchLower))
        );
      }
    }
    
    // Sort: in-stock first, then by name
    return filtered.sort((a, b) => {
      if (a.stock > 0 && b.stock <= 0) return -1;
      if (a.stock <= 0 && b.stock > 0) return 1;
      return a.displayName.localeCompare(b.displayName);
    });
  }, [flattenedProducts, productSearch, selectedProductId]);

  // Determine the best price based on customer type (uses FlattenedProduct)
  // Returns detailed discount breakdown for cumulative tracking
  const getProductPrice = (flatProduct: FlattenedProduct): { 
    price: number; 
    label: string; 
    originalPrice: number;
    hasProductDiscount: boolean;
    productDiscountAmount: number;
  } => {
    // For wholesale customers: use wholesale price directly, skip discounted price
    if (isWholesaleCustomer) {
      if (priceMode === 'custom' && customPrice > 0) {
        return { price: customPrice, label: 'Custom', originalPrice: flatProduct.wholesalePrice, hasProductDiscount: false, productDiscountAmount: 0 };
      }
      // Default to wholesale price for wholesale customers
      return { price: flatProduct.wholesalePrice, label: 'Wholesale', originalPrice: flatProduct.wholesalePrice, hasProductDiscount: false, productDiscountAmount: 0 };
    }
    
    // For regular/retail customers:
    const retailPrice = flatProduct.retailPrice;
    
    // Check if product has a discounted price (only for non-wholesale)
    const hasProductDiscount = flatProduct.hasDiscount && flatProduct.discountedPrice && flatProduct.discountedPrice < retailPrice;
    const effectiveRetailPrice = hasProductDiscount ? flatProduct.discountedPrice! : retailPrice;
    const productDiscountAmount = hasProductDiscount ? retailPrice - flatProduct.discountedPrice! : 0;
    
    if (priceMode === 'custom' && customPrice > 0) {
      return { price: customPrice, label: 'Custom', originalPrice: retailPrice, hasProductDiscount: false, productDiscountAmount: 0 };
    }
    if (priceMode === 'wholesale') {
      return { price: flatProduct.wholesalePrice, label: 'Wholesale', originalPrice: retailPrice, hasProductDiscount: false, productDiscountAmount: 0 };
    }
    // Default to retail/discounted price - include product discount info
    return { 
      price: effectiveRetailPrice, 
      label: hasProductDiscount ? 'Discounted' : 'Retail',
      originalPrice: retailPrice,
      hasProductDiscount: !!hasProductDiscount,
      productDiscountAmount
    };
  };

  // Calculate final price after item discount and return discount amount
  const calculateFinalPrice = (basePrice: number): { finalPrice: number; manualDiscountAmount: number } => {
    if (itemDiscountType === 'percentage' && itemDiscountValue > 0) {
      const discountAmount = basePrice * (itemDiscountValue / 100);
      return { finalPrice: basePrice - discountAmount, manualDiscountAmount: discountAmount };
    }
    if (itemDiscountType === 'fixed' && itemDiscountValue > 0) {
      return { finalPrice: Math.max(0, basePrice - itemDiscountValue), manualDiscountAmount: Math.min(itemDiscountValue, basePrice) };
    }
    return { finalPrice: basePrice, manualDiscountAmount: 0 };
  };

  // Reset pricing options when product changes - default to Retail price
  const customPriceRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (currentProduct) {
      // Default to retail price for all customers
      setPriceMode('retail');
      if (isWholesaleCustomer) {
        setCustomPrice(currentProduct.wholesalePrice || 0);
      } else {
        setCustomPrice(currentProduct.retailPrice || 0);
      }
      setItemDiscountType('none');
      setItemDiscountValue(0);
    }
  }, [selectedProductId, isWholesaleCustomer]);

  // Focus the custom price input when custom mode is selected
  useEffect(() => {
    if (priceMode === 'custom') {
      // Delay to ensure the input is rendered
      setTimeout(() => {
        customPriceRef.current?.focus();
        customPriceRef.current?.select();
      }, 0);
    }
  }, [priceMode]);

  const addItem = () => {
    if (!selectedProductId || quantity <= 0) return;
    const flatProduct = flattenedProducts.find((fp) => fp.flatId === selectedProductId);
    if (!flatProduct) return;

    const { price: basePrice, originalPrice, hasProductDiscount, productDiscountAmount } = getProductPrice(flatProduct);
    
    // Calculate manual discount on top of product discount
    const { finalPrice: calculatedFinalPrice, manualDiscountAmount } = calculateFinalPrice(basePrice);
    const finalPrice = priceMode === 'custom' ? customPrice : calculatedFinalPrice;
    
    // Get Sinhala product name from the product's nameAlt field
    const sinhalaName = flatProduct.product.nameAlt || flatProduct.displayName;
    
    // Calculate cumulative discount info
    const totalDiscount = productDiscountAmount + (priceMode !== 'custom' ? manualDiscountAmount : 0);
    
    const newItem: ExtendedInvoiceItem = {
      id: `item-${Date.now()}`,
      productId: flatProduct.flatId,
      productName: flatProduct.displayName,
      productNameSi: sinhalaName,
      variantId: flatProduct.variant?.id,
      size: flatProduct.variant?.size,
      quantity,
      unitPrice: finalPrice,
      originalPrice: originalPrice, // Store the original retail price (before any discount)
      productDiscountedPrice: hasProductDiscount ? basePrice : undefined, // Price after product discount
      productDiscountAmount: productDiscountAmount > 0 ? productDiscountAmount : undefined, // Product discount amount
      total: quantity * finalPrice,
      discountType: itemDiscountType !== 'none' ? itemDiscountType : undefined,
      discountValue: itemDiscountValue > 0 ? itemDiscountValue : undefined,
      manualDiscountAmount: manualDiscountAmount > 0 ? manualDiscountAmount : undefined, // Manual discount amount
      isCustomPrice: priceMode === 'custom',
    };

    const existingItem = items.find((i) => i.productId === selectedProductId && i.unitPrice === finalPrice);
    if (existingItem) {
      setItems(
        items.map((i) =>
          i.id === existingItem.id
            ? { ...i, quantity: i.quantity + quantity, total: (i.quantity + quantity) * i.unitPrice }
            : i
        )
      );
    } else {
      setItems([...items, newItem]);
      
      // Show toast with cumulative discount info if applicable
      if (totalDiscount > 0 && priceMode !== 'custom') {
        const discountParts = [];
        if (productDiscountAmount > 0) {
          discountParts.push(`${t('invoice.productDiscount')}: ${t('common.currency')} ${productDiscountAmount.toLocaleString()}`);
        }
        if (manualDiscountAmount > 0) {
          discountParts.push(`${t('invoice.manualDiscount')}: ${t('common.currency')} ${manualDiscountAmount.toLocaleString()}`);
        }
        toast.success(`${flatProduct.displayName} - ${t('invoice.totalSavings')}: ${t('common.currency')} ${totalDiscount.toLocaleString()}`);
      }
    }

    // Reset all
    setSelectedProductId('');
    setProductSearch('');
    setQuantity(1);
    setPriceMode('auto');
    setCustomPrice(0);
    setItemDiscountType('none');
    setItemDiscountValue(0);
  };

  // Quick add item (not in inventory)
  const addQuickItem = () => {
    if (!quickAddName.trim() || quickAddPrice <= 0 || quickAddQty <= 0) return;
    
    const newItem: ExtendedInvoiceItem = {
      id: `quick-${Date.now()}`,
      productId: `quick-${Date.now()}`,
      productName: quickAddName,
      quantity: quickAddQty,
      unitPrice: quickAddPrice,
      originalPrice: quickAddPrice,
      total: quickAddQty * quickAddPrice,
      isQuickAdd: true,
    };
    
    setItems([...items, newItem]);
    setQuickAddName('');
    setQuickAddPrice(0);
    setQuickAddQty(1);
    setShowQuickAdd(false);
  };

  const updateItemQuantity = (itemId: string, newQuantity: number) => {
    if (newQuantity <= 0) return;
    setItems(items.map(item => 
      item.id === itemId 
        ? { ...item, quantity: newQuantity, total: newQuantity * item.unitPrice }
        : item
    ));
  };

  const updateItemPrice = (itemId: string, newPrice: number, discountType: 'none' | 'percentage' | 'fixed', discountValue: number) => {
    if (newPrice < 0) return;
    
    const item = items.find(i => i.id === itemId);
    if (!item) return;
    
    const extItem = item as ExtendedInvoiceItem;
    let finalPrice = newPrice;
    let manualDiscountAmount = 0;
    
    // Apply manual discount if specified
    if (discountType === 'percentage' && discountValue > 0) {
      manualDiscountAmount = newPrice * (discountValue / 100);
      finalPrice = newPrice - manualDiscountAmount;
    } else if (discountType === 'fixed' && discountValue > 0) {
      manualDiscountAmount = Math.min(discountValue, newPrice);
      finalPrice = Math.max(0, newPrice - discountValue);
    }
    
    // Calculate product discount (difference between original price and the base price being edited)
    const productDiscountAmount = extItem.originalPrice > newPrice ? extItem.originalPrice - newPrice : (extItem.productDiscountAmount || 0);
    
    setItems(items.map(i => 
      i.id === itemId 
        ? { 
            ...i, 
            unitPrice: finalPrice,
            total: i.quantity * finalPrice,
            productDiscountedPrice: newPrice !== extItem.originalPrice ? newPrice : undefined,
            productDiscountAmount: productDiscountAmount > 0 ? productDiscountAmount : undefined,
            discountType: discountType !== 'none' ? discountType : undefined,
            discountValue: discountValue > 0 ? discountValue : undefined,
            manualDiscountAmount: manualDiscountAmount > 0 ? manualDiscountAmount : undefined,
          }
        : i
    ));
    
    // Exit editing mode
    setEditingItemId(null);
  };

  const removeItem = (itemId: string) => {
    setItems(items.filter((i) => i.id !== itemId));
  };

  // Apply bulk discount to all items
  const applyDiscountToAll = (percent: number) => {
    if (items.length === 0) {
      toast.error(t('invoice.noItemsYet'));
      return;
    }
    if (percent <= 0 || percent > 100) {
      toast.error(t('invoice.enterDiscountPercent'));
      return;
    }
    
    setItems(items.map(item => {
      const extItem = item as ExtendedInvoiceItem;
      const discountedPrice = Math.round(extItem.originalPrice * (1 - percent / 100));
      return {
        ...item,
        unitPrice: discountedPrice,
        total: item.quantity * discountedPrice,
      };
    }));
    
    toast.success(`${percent}% ${t('invoice.discountApplied')}`);
    setBulkDiscountPercent(0);
  };

  // Current subtotal (after item-level discounts applied) - this is the only subtotal we show
  const subtotal = items.reduce((sum, item) => sum + item.total, 0);
  // Calculate total item-level discounts for informational display
  const totalItemDiscounts = items.reduce((sum, item) => {
    const extItem = item as ExtendedInvoiceItem;
    const priceDiscount = (extItem.originalPrice - item.unitPrice) * item.quantity;
    return sum + (priceDiscount > 0 ? priceDiscount : 0);
  }, 0);
  // Two final discount fields (both fixed amounts)
  const finalDiscount1 = discount; // First final discount (fixed amount)
  const totalFinalDiscount = finalDiscount1;
  // Taxable amount = subtotal minus final discounts
  const taxableAmount = subtotal - totalFinalDiscount;
  const tax = enableTax ? taxableAmount * (taxRate / 100) : 0;
  // Total = Subtotal - Final Discounts + Tax
  const total = taxableAmount + tax;
  
  // Calculate change amount
  const changeAmount = receivedAmount > 0 ? Math.max(0, receivedAmount - total) : 0;
  
  // Initialize invoice counter from existing data on first render
  useEffect(() => {
    initializeFromExistingInvoices(mockInvoices);
  }, []);
  
  // Generate next invoice number using the service
  const generateNextInvoiceNumber = useCallback(() => {
    return generateNextInvoiceNumberSync();
  }, []);
  
  // Initialize invoice number on component mount
  useEffect(() => {
    if (!invoiceNumber) {
      setInvoiceNumber(generateNextInvoiceNumber());
    }
  }, [invoiceNumber, generateNextInvoiceNumber]);

  const handleCreateInvoice = () => {
    if ((!selectedCustomer && !isWalkIn) || items.length === 0) return;

    const customerName = isWalkIn ? 'Walk-in Customer' : (currentCustomer?.name || 'Unknown');
    const customerId = isWalkIn ? 'walk-in' : selectedCustomer;

    // Use the editable invoice number or generate a new one
    const finalInvoiceNumber = invoiceNumber || generateNextInvoiceNumber();
    const invoice: Invoice = {
      id: `inv-${Date.now()}`,
      invoiceNumber: finalInvoiceNumber,
      customerId,
      customerName,
      items,
      subtotal: Math.round(subtotal * 100) / 100,
      discount: Math.round(finalDiscount1 * 100) / 100,
      discountType: 'fixed', // Always fixed for final discounts
      discountValue: totalFinalDiscount,
      enableTax,
      taxRate: enableTax ? taxRate : 0,
      tax: Math.round(tax * 100) / 100,
      total: Math.round(total * 100) / 100,
      receivedAmount: receivedAmount > 0 ? Math.round(receivedAmount * 100) / 100 : undefined,
      changeAmount: changeAmount > 0 ? Math.round(changeAmount * 100) / 100 : undefined,
      issueDate,
      dueDate,
      status: paymentMethod === 'credit' ? 'pending' : 'paid',
      paymentMethod,
      notes,
    };

    // Add to mockInvoices at the beginning so it appears at top of list
    mockInvoices.unshift(invoice);

    // Prepare customer for printing
    const printCustomer: Customer = isWalkIn ? {
      id: 'walk-in',
      name: t('invoice.walkInCustomer'),
      businessName: t('invoice.walkInCustomer'),
      email: '',
      phone: '',
      address: '',
      registrationDate: new Date().toISOString(),
      totalSpent: 0,
      customerType: 'regular',
      isActive: true,
      loanBalance: 0
    } : (currentCustomer || {
      id: customerId || '',
      name: customerName,
      businessName: customerName,
      email: '',
      phone: '',
      address: '',
      registrationDate: new Date().toISOString(),
      totalSpent: 0,
      customerType: 'regular',
      isActive: true,
      loanBalance: 0
    });

    // Print directly without preview
    printInvoice(invoice, printCustomer, i18n.language as 'en' | 'si', currentUser?.name || 'Admin User')
      .then(() => {
        toast.success(`${t('invoice.invoiceCreated')}: ${finalInvoiceNumber}`);
        navigate('/invoices');
      })
      .catch(() => {
        toast.error(t('invoice.printBlocked'));
        navigate('/invoices');
      });
  };

  // Quick Save without print preview (F9)
  const handleQuickSave = useCallback(() => {
    if ((!selectedCustomer && !isWalkIn) || items.length === 0) return;

    const customerName = isWalkIn ? 'Walk-in Customer' : (currentCustomer?.name || 'Unknown');
    const customerId = isWalkIn ? 'walk-in' : selectedCustomer;

    const finalInvoiceNumber = invoiceNumber || generateNextInvoiceNumber();
    const invoice: Invoice = {
      id: `inv-${Date.now()}`,
      invoiceNumber: finalInvoiceNumber,
      customerId,
      customerName,
      items,
      subtotal: Math.round(subtotal * 100) / 100,
      discount: Math.round(finalDiscount1 * 100) / 100,
      discountType: 'fixed',
      discountValue: totalFinalDiscount,
      receivedAmount: receivedAmount > 0 ? Math.round(receivedAmount * 100) / 100 : undefined,
      changeAmount: changeAmount > 0 ? Math.round(changeAmount * 100) / 100 : undefined,
      enableTax,
      taxRate: enableTax ? taxRate : 0,
      tax: Math.round(tax * 100) / 100,
      total: Math.round(total * 100) / 100,
      issueDate,
      dueDate,
      status: paymentMethod === 'credit' ? 'pending' : 'paid',
      paymentMethod,
      notes: notes || t('invoice.quickSaveNote'),
    };

    // Add to mockInvoices at the beginning so it appears at top of list
    mockInvoices.unshift(invoice);

    // Show success toast
    toast.success(
      `${t('invoice.invoiceSaved')}: ${finalInvoiceNumber} — ${t('common.currency')} ${invoice.total.toLocaleString()}`
    );

    // Reset form and navigate to invoices
    setItems([]);
    setSelectedCustomer('');
    setIsWalkIn(false);
    setDiscount(0);
    setReceivedAmount(0);
    setDiscountType('none');
    setNotes('');
    setInvoiceNumber(''); // Reset to generate new number
    setStep(1);
    navigate('/invoices');
  }, [selectedCustomer, isWalkIn, items, currentCustomer, subtotal, finalDiscount1, totalFinalDiscount, enableTax, taxRate, tax, total, issueDate, dueDate, paymentMethod, notes, t, navigate, invoiceNumber, generateNextInvoiceNumber, receivedAmount, changeAmount]);

  const handlePrintClose = () => {
    navigate('/invoices');
  };

  const canProceedToStep2 = selectedCustomer || isWalkIn;
  const canProceedToStep3 = items.length > 0;

  // Map step number to InvoiceStep for shortcut overlay
  const getStepName = (): InvoiceStep => {
    switch (step) {
      case 1: return 'customer';
      case 2: return 'products';
      case 3: return 'review';
      default: return 'customer';
    }
  };

  // Keyboard event handler for stepped navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInInput = target.tagName === 'INPUT' || 
                       target.tagName === 'TEXTAREA' || 
                       target.tagName === 'SELECT' ||
                       target.isContentEditable;
      
      // Show shortcut map with ? key
      if (e.key === '?' && !isInInput) {
        e.preventDefault();
        setShowShortcutMap(prev => !prev);
        return;
      }
      
      // Close shortcut map on Escape
      if (e.key === 'Escape' && showShortcutMap) {
        e.preventDefault();
        setShowShortcutMap(false);
        return;
      }
      
      // Step navigation using Left/Right arrows (global, exclusive)
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        if (step > 1) {
          setStep((step - 1) as Step);
        } else {
          // On first step, go back to invoices list
          navigate('/invoices');
        }
        return;
      }
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        if (step === 1 && canProceedToStep2) setStep(2);
        else if (step === 2 && canProceedToStep3) setStep(3);
        return;
      }
      
      // Step 1: Customer Selection shortcuts
      if (step === 1) {
        // W for walk-in toggle
        if (e.key === 'w' && !isInInput) {
          e.preventDefault();
          setIsWalkIn(!isWalkIn);
          setSelectedCustomer('');
          return;
        }
        
        // F2 to focus customer search
        if (e.key === 'F2' && !isWalkIn) {
          e.preventDefault();
          setCurrentMode('search');
          customerSearchRef.current?.focus();
          customerSearchRef.current?.select();
          return;
        }

        // F3 to toggle Walk-in immediately
        if (e.key === 'F3') {
          e.preventDefault();
          // Trigger click directly so it's instant
          walkInButtonRef.current?.click();
          return;
        }
        
        // Tab or any key to focus search when not in input
        if (e.key === 'Tab' && !isInInput) {
          e.preventDefault();
          customerSearchRef.current?.focus();
          return;
        }
        
        // Arrow down to navigate customer list
        if (e.key === 'ArrowDown') {
          if (document.activeElement === customerSearchRef.current || !isInInput) {
            e.preventDefault();
            setSelectedCustomerIndex(prev => 
              prev < filteredCustomers.length - 1 ? prev + 1 : prev
            );
            return;
          }
        }
        
        // Arrow up to navigate customer list
        if (e.key === 'ArrowUp') {
          if (document.activeElement === customerSearchRef.current || !isInInput) {
            e.preventDefault();
            setSelectedCustomerIndex(prev => prev > 0 ? prev - 1 : 0);
            return;
          }
        }
        
        // Enter to select highlighted customer
        if (e.key === 'Enter' && selectedCustomerIndex >= 0) {
          e.preventDefault();
          const customer = filteredCustomers[selectedCustomerIndex];
          if (customer) {
            setSelectedCustomer(customer.id);
            setSelectedCustomerIndex(-1);
            toast.success(t('invoice.customerSelected', { name: customer.name }));
          }
          return;
        }
        

      }
      
      // Step 2: Product Selection shortcuts
      if (step === 2) {
        // Focus barcode/search with F2
        if (e.key === 'F2') {
          e.preventDefault();
          setCurrentMode('search');
          productSearchRef.current?.focus();
          productSearchRef.current?.select();
          return;
        }
        
        // Focus quantity with F3
        if (e.key === 'F3') {
          e.preventDefault();
          setCurrentMode('quantity');
          quantityInputRef.current?.focus();
          quantityInputRef.current?.select();
          return;
        }
        
        // Product navigation with arrow keys in search
        if (e.key === 'ArrowDown' && document.activeElement === productSearchRef.current) {
          e.preventDefault();
          setSelectedProductIndex(prev => 
            prev < filteredProducts.length - 1 ? prev + 1 : prev
          );
          return;
        }
        if (e.key === 'ArrowUp' && document.activeElement === productSearchRef.current) {
          e.preventDefault();
          setSelectedProductIndex(prev => prev > 0 ? prev - 1 : 0);
          return;
        }
        if (e.key === 'Enter' && selectedProductIndex >= 0 && document.activeElement === productSearchRef.current) {
          e.preventDefault();
          const flatProduct = filteredProducts[selectedProductIndex];
          if (flatProduct && flatProduct.stock > 0) {
            setSelectedProductId(flatProduct.flatId);
            setProductSearch(flatProduct.displayName);
            const { price } = getProductPrice(flatProduct);
            setCustomPrice(price);
            setSelectedProductIndex(-1);
            // Focus quantity input
            setTimeout(() => {
              quantityInputRef.current?.focus();
              quantityInputRef.current?.select();
            }, 50);
          }
          return;
        }

        // When quantity input is focused, Enter should add the item immediately
        if (e.key === 'Enter' && document.activeElement === quantityInputRef.current) {
          e.preventDefault();
          // Get the current product fresh from state to avoid stale closures
          const liveProduct = flattenedProducts.find(fp => fp.flatId === selectedProductId);
          if (selectedProductId && quantity > 0 && liveProduct && quantity <= liveProduct.stock) {
            addItem();
            toast.success(t('invoice.addedToCart'));
            // refocus product search for next entry
            setTimeout(() => {
              productSearchRef.current?.focus();
              productSearchRef.current?.select();
            }, 50);
          } else {
            toast.error(t('invoice.invalidQuantity'));
            quantityInputRef.current?.focus();
          }
          return;
        }
        
        // Price mode toggle with arrow keys when focused
        if (isPriceModeFocused) {
          if (e.key === 'ArrowLeft') {
            e.preventDefault();
            const currentIndex = PRICE_MODES.indexOf(priceMode);
            const newIndex = currentIndex === 0 ? PRICE_MODES.length - 1 : currentIndex - 1;
            setPriceMode(PRICE_MODES[newIndex]);
            return;
          }
          if (e.key === 'ArrowRight') {
            e.preventDefault();
            const currentIndex = PRICE_MODES.indexOf(priceMode);
            const newIndex = (currentIndex + 1) % PRICE_MODES.length;
            setPriceMode(PRICE_MODES[newIndex]);
            return;
          }
        }
        
        // Item discount toggle with arrow keys when focused
        if (isItemDiscountFocused) {
          if (e.key === 'ArrowLeft') {
            e.preventDefault();
            const currentIndex = DISCOUNT_TYPES.indexOf(itemDiscountType);
            const newIndex = currentIndex === 0 ? DISCOUNT_TYPES.length - 1 : currentIndex - 1;
            setItemDiscountType(DISCOUNT_TYPES[newIndex]);
            return;
          }
          if (e.key === 'ArrowRight') {
            e.preventDefault();
            const currentIndex = DISCOUNT_TYPES.indexOf(itemDiscountType);
            const newIndex = (currentIndex + 1) % DISCOUNT_TYPES.length;
            setItemDiscountType(DISCOUNT_TYPES[newIndex]);
            return;
          }
        }
        

      }
      
      // Step 3: Review shortcuts
      if (step === 3) {
        // F9 to quick save without print preview
        if (e.key === 'F9') {
          e.preventDefault();
          if (items.length > 0) handleQuickSave();
          return;
        }
        
        // F12 to complete invoice
        if (e.key === 'F12') {
          e.preventDefault();
          if (items.length > 0) handleCreateInvoice();
          return;
        }
        
        // Payment method quick keys (1-4)
        if (!isInInput) {
          if (e.key === '1') {
            e.preventDefault();
            setPaymentMethod('cash');
            toast.info(t('invoice.cash'));
            return;
          }
          if (e.key === '2') {
            e.preventDefault();
            setPaymentMethod('card');
            toast.info(t('invoice.card'));
            return;
          }
          if (e.key === '3') {
            e.preventDefault();
            setPaymentMethod('bank_transfer');
            toast.info(t('invoice.bankTransfer'));
            return;
          }
          if (e.key === '4') {
            e.preventDefault();
            setPaymentMethod('credit');
            toast.info(t('invoice.credit'));
            return;
          }
        }
        
        // F4 to focus Payment Method (first option)
        if (e.key === 'F4' && !isInInput) {
          e.preventDefault();
          paymentMethodFirstRef.current?.focus();
          return;
        }

        // F5 to select/activate discount (None)
        if (e.key === 'F5' && !isInInput) {
          e.preventDefault();
          // If discount is 'none', switch to 'percentage' and focus the input
          if (discountType === 'none') {
            setDiscountType('percentage');
            setTimeout(() => {
              discountInputRef.current?.focus();
              discountInputRef.current?.select();
            }, 50);
          } else {
            // Already has discount type, just focus the input
            discountInputRef.current?.focus();
            discountInputRef.current?.select();
          }
          return;
        }
        
        // F6 to toggle tax (replaces 'T')
        if (e.key === 'F6' && !isInInput) {
          e.preventDefault();
          setEnableTax(prev => {
            const next = !prev;
            toast.info(next ? t('invoice.taxEnabled') : t('invoice.taxDisabled'));
            return next;
          });
          // focus the toggle visually
          setTimeout(() => taxToggleRef.current?.focus(), 50);
          return;
        }
        
        // F7 to focus Received Amount input
        if (e.key === 'F7') {
          e.preventDefault();
          receivedAmountInputRef.current?.focus();
          receivedAmountInputRef.current?.select();
          return;
        }
        
        // F8 to focus notes
        if (e.key === 'F8' && !isInInput) {
          e.preventDefault();
          notesInputRef.current?.focus();
          notesInputRef.current?.select();
          return;
        }
        

      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [step, canProceedToStep2, canProceedToStep3, showShortcutMap, selectedCustomerIndex, 
      filteredCustomers, selectedProductIndex, filteredProducts, priceMode, itemDiscountType,
      isPriceModeFocused, isItemDiscountFocused, items, isWalkIn, enableTax, t, navigate, selectedProductId, quantity, products, handleQuickSave]);

  // Focus search on step 2
  useEffect(() => {
    if (step === 2) {
      setTimeout(() => {
        productSearchRef.current?.focus();
      }, 100);
    }
  }, [step]);

  // Auto-focus customer search on step 1
  useEffect(() => {
    if (step === 1 && !isWalkIn) {
      setTimeout(() => {
        customerSearchRef.current?.focus();
      }, 100);
    }
  }, [step, isWalkIn]);

  // Active-scroll synchronization: Keep selected customer in viewport
  useEffect(() => {
    if (selectedCustomerIndex >= 0) {
      const itemElement = customerItemRefs.current.get(selectedCustomerIndex);
      if (itemElement) {
        itemElement.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
        });
      }
    }
  }, [selectedCustomerIndex]);

  // Active-scroll synchronization: Keep selected product in viewport
  useEffect(() => {
    if (selectedProductIndex >= 0) {
      const itemElement = productItemRefs.current.get(selectedProductIndex);
      if (itemElement) {
        itemElement.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
        });
      }
    }
  }, [selectedProductIndex]);

  const getStepIcon = (stepNum: number) => {
    switch (stepNum) {
      case 1: return <User className="w-4 h-4" />;
      case 2: return <Package className="w-4 h-4" />;
      case 3: return <CheckCircle className="w-4 h-4" />;
      default: return null;
    }
  };

  const getCustomerStatusColor = (customer: Customer) => {
    if (customer.loanBalance > 0) {
      const dueDate = customer.loanDueDate ? new Date(customer.loanDueDate) : null;
      if (dueDate && dueDate < new Date()) {
        return 'border-red-500/50 bg-red-500/5';
      }
      return 'border-amber-500/50 bg-amber-500/5';
    }
    return '';
  };

  return (
    <div className={`space-y-6 ${isMobile ? 'mb-32' : 'pb-16'}`}>
      {/* Shortcut Map Overlay */}
      <ShortcutMapOverlay
        isOpen={showShortcutMap}
        onClose={() => setShowShortcutMap(false)}
        currentStep={getStepName()}
        currentMode={currentMode}
        isQuickCheckout={false}
        stepIndex={step}
        totalSteps={3}
      />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/invoices')}
            className={`p-2 rounded-xl transition-colors ${
              theme === 'dark' ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-100 text-slate-600'
            }`}
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center">
                <FileText className="w-5 h-5 text-blue-400" />
              </div>
              <h1 className={`text-3xl font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                {t('invoice.createInvoice')}
              </h1>
            </div>
            <p className={theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}>
              {t('invoice.createInvoiceSteps')}
            </p>
          </div>
        </div>
        
        {/* Keyboard Shortcuts Button */}
        <button
          onClick={() => setShowShortcutMap(true)}
          className={`hidden md:flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
            theme === 'dark' 
              ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' 
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          <Keyboard className="w-4 h-4" />
          {t('quickCheckout.keyboardShortcuts')}
          <kbd className={`ml-1 px-1.5 py-0.5 rounded text-xs font-mono ${
            theme === 'dark' ? 'bg-slate-600 text-slate-400' : 'bg-slate-200 text-slate-500'
          }`}>?</kbd>
        </button>
      </div>

      {/* Progress Indicator */}
      <div className={`p-6 rounded-2xl border ${
        theme === 'dark' ? 'bg-slate-800/30 border-slate-700/50' : 'bg-white border-slate-200 shadow-sm'
      }`}>
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          {[1, 2, 3].map((s) => (
            <React.Fragment key={s}>
              <button
                onClick={() => {
                  if (s === 1 || (s === 2 && canProceedToStep2) || (s === 3 && canProceedToStep2 && canProceedToStep3)) {
                    setStep(s as Step);
                  }
                }}
                disabled={
                  (s === 2 && !canProceedToStep2) || 
                  (s === 3 && (!canProceedToStep2 || !canProceedToStep3))
                }
                className="flex flex-col items-center group cursor-pointer disabled:cursor-not-allowed"
              >
                <div
                  className={`w-14 h-14 rounded-xl flex items-center justify-center font-bold text-sm transition-all shadow-sm group-hover:scale-105 group-disabled:hover:scale-100 ${
                    s < step
                      ? 'bg-emerald-500 text-white'
                      : s === step
                      ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white ring-4 ring-blue-500/30'
                      : theme === 'dark' ? 'bg-slate-700 text-slate-400' : 'bg-slate-200 text-slate-500'
                  }`}
                >
                  {s < step ? <CheckCircle className="w-6 h-6" /> : getStepIcon(s)}
                </div>
                <p className={`mt-2 text-sm font-medium ${
                  s <= step ? (theme === 'dark' ? 'text-white' : 'text-slate-900') : (theme === 'dark' ? 'text-slate-400' : 'text-slate-500')
                }`}>
                  {s === 1 ? t('invoice.stepCustomer') : s === 2 ? t('invoice.stepProducts') : t('invoice.stepReview')}
                </p>
                {/* Keyboard hint */}
                <span className={`text-xs mt-1 ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>
                  ← →
                </span>
              </button>
              {s < 3 && (
                <div className={`flex-1 h-1.5 mx-4 rounded-full transition-colors ${
                  s < step ? 'bg-emerald-500' : (theme === 'dark' ? 'bg-slate-700' : 'bg-slate-200')
                }`} />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className={`p-6 rounded-2xl border min-h-[500px] ${
        theme === 'dark' ? 'bg-slate-800/30 border-slate-700/50' : 'bg-white border-slate-200 shadow-sm'
      }`}>
        {/* Step 1: Customer Selection */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                  <User className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <h3 className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                    {t('invoice.selectCustomer')}
                  </h3>
                  <p className={`text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                    {t('invoice.selectCustomerHint')}
                  </p>
                </div>
              </div>

              {/* Walk-in Toggle */}
              <button
                ref={walkInButtonRef}
                aria-pressed={isWalkIn}
                onClick={() => {
                  setIsWalkIn(!isWalkIn);
                  setSelectedCustomer('');
                }}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all ${
                  isWalkIn
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/20'
                    : theme === 'dark' 
                      ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' 
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <UserX className="w-4 h-4" />
                <span className="flex items-center gap-2">
                  {t('invoice.walkInCustomer')}
                  <kbd className={`ml-2 px-1.5 py-0.5 rounded text-xs font-mono ${theme === 'dark' ? 'bg-slate-700 text-slate-400' : 'bg-slate-200 text-slate-500'}`}>F3</kbd>
                </span>
              </button>
            </div>

            {isWalkIn ? (
              /* Walk-in Customer Confirmation */
              <div className={`p-6 rounded-xl border-2 border-dashed ${
                theme === 'dark' ? 'border-purple-500/50 bg-purple-500/5' : 'border-purple-300 bg-purple-50'
              }`}>
                <div className="flex items-center gap-4">
                  <div className={`w-16 h-16 rounded-xl flex items-center justify-center ${
                    theme === 'dark' 
                      ? 'bg-gradient-to-br from-purple-500/20 to-pink-500/20' 
                      : 'bg-gradient-to-br from-purple-100 to-pink-100'
                  }`}>
                    <UserX className="w-8 h-8 text-purple-400" />
                  </div>
                  <div>
                    <h4 className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                      {t('invoice.walkInCustomer')}
                    </h4>
                    <p className={`text-sm mt-1 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                      {t('invoice.walkInCustomerConfirm')}
                    </p>
                  </div>
                  <CheckCircle className="w-6 h-6 text-emerald-400 ml-auto" />
                </div>
              </div>
            ) : (
              /* Existing Customer Selection */
              <>
                {/* Customer Search */}
                <div className="relative">
                  <Search className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
                  <input
                    ref={customerSearchRef}
                    type="text"
                    placeholder={t('invoice.searchCustomerPlaceholder')}
                    value={customerSearch}
                    onChange={(e) => {
                      setCustomerSearch(e.target.value);
                      setSelectedCustomerIndex(0); // Reset selection when searching
                    }}
                    className={`w-full pl-12 pr-16 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      theme === 'dark'
                        ? 'border-slate-700 bg-slate-800/50 text-white placeholder-slate-500'
                        : 'border-slate-200 bg-slate-50 text-slate-900 placeholder-slate-400'
                    }`}
                  />
                  {/* Shortcut hint badge */}
                  <div className={`absolute right-3 top-2.5 px-2 py-1 rounded text-xs font-mono ${
                    theme === 'dark' ? 'bg-slate-700 text-slate-400' : 'bg-slate-200 text-slate-500'
                  }`}>
                    F2
                  </div>
                </div>

                {/* Keyboard navigation hint */}
                <div className={`flex items-center gap-4 text-xs ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>
                  <span className="flex items-center gap-1">
                    <kbd className={`px-1.5 py-0.5 rounded ${theme === 'dark' ? 'bg-slate-700' : 'bg-slate-200'}`}>↑↓</kbd>
                    {t('shortcuts.navigateList')}
                  </span>
                  <span className="flex items-center gap-1">
                    <kbd className={`px-1.5 py-0.5 rounded ${theme === 'dark' ? 'bg-slate-700' : 'bg-slate-200'}`}>Enter</kbd>
                    {t('shortcuts.selectCustomer')}
                  </span>
                  <span className="flex items-center gap-1">
                    <kbd className={`px-1.5 py-0.5 rounded ${theme === 'dark' ? 'bg-slate-700' : 'bg-slate-200'}`}>→</kbd>
                    {t('shortcuts.nextStep')}
                  </span>
                </div>

                {/* Customer Grid */}
                {filteredCustomers.length === 0 ? (
                  <div className={`text-center py-12 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                    <User className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>{t('invoice.noCustomersFound')} "{customerSearch}"</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[400px] overflow-y-auto pr-2">
                    {filteredCustomers.map((customer, index) => {
                      const isKeyboardSelected = index === selectedCustomerIndex;
                      const isSelected = selectedCustomer === customer.id;
                      
                      return (
                      <button
                        key={customer.id}
                        ref={(el) => {
                          if (el) customerItemRefs.current.set(index, el);
                          else customerItemRefs.current.delete(index);
                        }}
                        onClick={() => {
                          setSelectedCustomer(customer.id);
                          setSelectedCustomerIndex(index);
                        }}
                        className={`p-4 border-2 rounded-xl text-left transition-all relative ${
                          isSelected
                            ? 'border-blue-500 bg-blue-500/10 ring-2 ring-blue-500/30'
                            : isKeyboardSelected
                            ? 'border-cyan-400 bg-cyan-500/10 ring-2 ring-cyan-400/30'
                            : `${getCustomerStatusColor(customer)} ${
                                theme === 'dark' 
                                  ? 'border-slate-700 hover:border-blue-500/50' 
                                  : 'border-slate-200 hover:border-blue-500/50'
                              }`
                        }`}
                      >
                        {/* Keyboard selection indicator */}
                        {isKeyboardSelected && !isSelected && (
                          <div className="absolute -top-2 -right-2 px-1.5 py-0.5 bg-cyan-500 text-white text-xs rounded font-mono">
                            Enter
                          </div>
                        )}
                        <div className="flex items-start gap-3">
                          {/* Avatar */}
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold flex-shrink-0 ${
                            isKeyboardSelected
                              ? 'bg-gradient-to-br from-cyan-500/30 to-blue-500/30 text-cyan-400'
                              : theme === 'dark' 
                              ? 'bg-gradient-to-br from-blue-500/20 to-cyan-500/20 text-blue-400' 
                              : 'bg-gradient-to-br from-blue-100 to-cyan-100 text-blue-600'
                          }`}>
                            {(isSinhala && customer.nameSi ? customer.nameSi : customer.name).charAt(0).toUpperCase()}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <p className={`font-semibold truncate ${
                                isKeyboardSelected ? 'text-cyan-400' : theme === 'dark' ? 'text-white' : 'text-slate-900'
                              }`}>
                                {isSinhala && customer.nameSi ? customer.nameSi : customer.name}
                              </p>
                              {customer.customerType === 'wholesale' && (
                                <span className="px-2 py-0.5 text-xs font-medium bg-purple-500/10 text-purple-400 rounded-full">
                                  {t('invoice.wholesale')}
                                </span>
                              )}
                              {customer.customerType === 'credit' && (
                                <span className="px-2 py-0.5 text-xs font-medium bg-amber-500/10 text-amber-400 rounded-full">
                                  {t('invoice.credit')}
                                </span>
                              )}
                            </div>
                            <p className={`text-sm truncate ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                              <Building2 className="w-3 h-3 inline mr-1" />
                              {customer.businessName}
                            </p>
                            <div className={`flex items-center gap-3 mt-1 text-xs ${theme === 'dark' ? 'text-slate-500' : 'text-slate-500'}`}>
                              <span className="flex items-center gap-1">
                                <Phone className="w-3 h-3" />
                                {customer.phone}
                              </span>
                            </div>
                            
                            {/* Balance/Due Amount */}
                            {customer.loanBalance > 0 && (
                              <div className={`mt-2 p-2 rounded-lg ${
                                customer.loanDueDate && new Date(customer.loanDueDate) < new Date()
                                  ? 'bg-red-500/10 border border-red-500/20'
                                  : 'bg-amber-500/10 border border-amber-500/20'
                              }`}>
                                <div className="flex items-center justify-between">
                                  <span className={`text-xs font-medium ${
                                    customer.loanDueDate && new Date(customer.loanDueDate) < new Date()
                                      ? 'text-red-400'
                                      : 'text-amber-400'
                                  }`}>
                                    <CreditCard className="w-3 h-3 inline mr-1" />
                                    {t('invoice.dueBalance')}
                                  </span>
                                  <span className={`text-sm font-bold ${
                                    customer.loanDueDate && new Date(customer.loanDueDate) < new Date()
                                      ? 'text-red-400'
                                      : 'text-amber-400'
                                  }`}>
                                    {t('common.currency')} {customer.loanBalance.toLocaleString()}
                                  </span>
                                </div>
                                {customer.loanDueDate && (
                                  <p className={`text-xs mt-1 ${
                                    new Date(customer.loanDueDate) < new Date() ? 'text-red-400' : 'text-amber-400/70'
                                  }`}>
                                    {new Date(customer.loanDueDate) < new Date() ? (
                                      <>
                                        <AlertTriangle className="w-3 h-3 inline mr-1" />
                                        {t('invoice.overdueSince')} {new Date(customer.loanDueDate).toLocaleDateString()}
                                      </>
                                    ) : (
                                      <>{t('invoice.dueBy')} {new Date(customer.loanDueDate).toLocaleDateString()}</>
                                    )}
                                  </p>
                                )}
                              </div>
                            )}
                            
                            {/* Total Spent */}
                            <div className={`mt-2 flex items-center justify-between text-xs ${theme === 'dark' ? 'text-slate-500' : 'text-slate-500'}`}>
                              <span>{t('invoice.totalPurchases')}</span>
                              <span className="font-medium text-emerald-500">
                                {t('common.currency')} {customer.totalSpent.toLocaleString()}
                              </span>
                            </div>
                          </div>
                        </div>
                      </button>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Step 2: Add Items - Enhanced */}
        {step === 2 && (
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-cyan-500/20 rounded-xl flex items-center justify-center">
                  <ShoppingCart className="w-6 h-6 text-cyan-400" />
                </div>
                <div>
                  <h3 className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                    {t('invoice.addProducts')}
                  </h3>
                  <p className={`text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                    {currentCustomer?.customerType === 'wholesale' && (
                      <span className="text-purple-400 font-medium">{t('invoice.wholesalePricing')} • </span>
                    )}
                    {t('invoice.searchAddProducts')}
                  </p>
                </div>
              </div>
              {/* Quick Add Button */}
              <button
                onClick={() => setShowQuickAdd(!showQuickAdd)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all ${
                  showQuickAdd
                    ? 'bg-amber-500 text-white'
                    : theme === 'dark' 
                      ? 'bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 border border-amber-500/30' 
                      : 'bg-amber-50 text-amber-600 hover:bg-amber-100 border border-amber-200'
                }`}
              >
                <PackagePlus className="w-4 h-4" />
                {t('invoice.quickAddProduct')}
              </button>
            </div>

            {/* Quick Add Panel */}
            {showQuickAdd && (
              <div className={`p-4 rounded-xl border-2 border-dashed ${
                theme === 'dark' ? 'border-amber-500/50 bg-amber-500/5' : 'border-amber-300 bg-amber-50'
              }`}>
                <div className="flex items-center gap-2 mb-4">
                  <Zap className="w-5 h-5 text-amber-400" />
                  <h4 className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                    {t('invoice.quickAddTitle')}
                  </h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div className="md:col-span-2">
                    <input
                      type="text"
                      placeholder={t('invoice.productServicePlaceholder')}
                      value={quickAddName}
                      onChange={(e) => setQuickAddName(e.target.value)}
                      className={`w-full px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                        theme === 'dark'
                          ? 'border-slate-600 bg-slate-800 text-white placeholder-slate-500'
                          : 'border-slate-200 bg-white text-slate-900 placeholder-slate-400'
                      }`}
                    />
                  </div>
                  <div>
                    <div className="relative">
                      <span className={`absolute left-3 top-2.5 text-sm ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>{t('common.currency')}</span>
                      <input
                        type="number"
                        placeholder={t('invoice.pricePlaceholder')}
                        value={quickAddPrice || ''}
                        onChange={(e) => setQuickAddPrice(parseFloat(e.target.value) || 0)}
                        className={`w-full pl-10 pr-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                          theme === 'dark'
                            ? 'border-slate-600 bg-slate-800 text-white placeholder-slate-500'
                            : 'border-slate-200 bg-white text-slate-900 placeholder-slate-400'
                        }`}
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      placeholder={t('invoice.qtyPlaceholder')}
                      min="0.1"
                      step="0.1"
                      value={quickAddQty}
                      onChange={(e) => setQuickAddQty(parseFloat(e.target.value) || 0.1)}
                      className={`w-20 px-3 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                        theme === 'dark'
                          ? 'border-slate-600 bg-slate-800 text-white'
                          : 'border-slate-200 bg-white text-slate-900'
                      }`}
                    />
                    <button
                      onClick={addQuickItem}
                      disabled={!quickAddName.trim() || quickAddPrice <= 0}
                      className="flex-1 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-medium flex items-center justify-center gap-2 transition-all"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Product Selection */}
              <div className="space-y-4">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
                  <input
                    ref={productSearchRef}
                    type="text"
                    placeholder={t('invoice.searchProductPlaceholder')}
                    value={productSearch}
                    onChange={(e) => {
                      const val = e.target.value;
                      setProductSearch(val);
                      setSelectedProductId('');
                      setSelectedProductIndex(0);

                      // Detect exact barcode scan: if input exactly matches a product barcode, auto-select it and focus quantity
                      const barcodeCandidate = val.trim();
                      if (barcodeCandidate) {
                        const matched = flattenedProducts.find(fp => fp.displayBarcode && fp.displayBarcode === barcodeCandidate);
                        if (matched && matched.stock > 0) {
                          setSelectedProductId(matched.flatId);
                          setProductSearch(matched.displayName);
                          const { price } = getProductPrice(matched);
                          setCustomPrice(price);
                          setSelectedProductIndex(-1);
                          // Focus quantity input after small delay to ensure UI updated
                          setTimeout(() => {
                            quantityInputRef.current?.focus();
                            quantityInputRef.current?.select();
                          }, 100);
                          toast.success(t('invoice.barcodeDetected', { name: matched.displayName }));
                        }
                      }
                    }}
                    className={`w-full pl-12 pr-16 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 ${
                      theme === 'dark'
                        ? 'border-slate-700 bg-slate-800/50 text-white placeholder-slate-500'
                        : 'border-slate-200 bg-slate-50 text-slate-900 placeholder-slate-400'
                    }`}
                  />
                  {/* Shortcut hint badge */}
                  <div className={`absolute right-3 top-2.5 px-2 py-1 rounded text-xs font-mono ${
                    theme === 'dark' ? 'bg-slate-700 text-slate-400' : 'bg-slate-200 text-slate-500'
                  }`}>
                    F2
                  </div>
                </div>

                {/* Keyboard navigation hint */}
                <div className={`flex items-center gap-4 text-xs ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>
                  <span className="flex items-center gap-1">
                    <kbd className={`px-1.5 py-0.5 rounded ${theme === 'dark' ? 'bg-slate-700' : 'bg-slate-200'}`}>↑↓</kbd>
                    {t('shortcuts.navigateList')}
                  </span>
                  <span className="flex items-center gap-1">
                    <kbd className={`px-1.5 py-0.5 rounded ${theme === 'dark' ? 'bg-slate-700' : 'bg-slate-200'}`}>Enter</kbd>
                    {t('shortcuts.selectItem')}
                  </span>
                  <span className="flex items-center gap-1">
                    <kbd className={`px-1.5 py-0.5 rounded ${theme === 'dark' ? 'bg-slate-700' : 'bg-slate-200'}`}>F3</kbd>
                    {t('shortcuts.focusQty')}
                  </span>
                </div>

                {/* Product List */}
                <div className={`h-[240px] overflow-y-auto border rounded-xl ${
                  theme === 'dark' ? 'border-slate-700' : 'border-slate-200'
                }`}>
                  {filteredProducts.length === 0 ? (
                    <div className={`p-8 text-center ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                      <Package className="w-10 h-10 mx-auto mb-2 opacity-50" />
                      <p>{t('invoice.noProductsFound')}</p>
                      <button
                        onClick={() => setShowQuickAdd(true)}
                        className="mt-2 text-amber-400 text-sm hover:underline"
                      >
                        {t('invoice.quickAddInstead')}
                      </button>
                    </div>
                  ) : (
                    filteredProducts.map((fp, index) => {
                      const isOutOfStock = fp.stock <= 0;
                      const isLowStock = fp.stock <= fp.minStock;
                      const isWholesale = currentCustomer?.customerType === 'wholesale';
                      const displayPrice = isWholesale ? fp.wholesalePrice : fp.retailPrice;
                      const isKeyboardSelected = index === selectedProductIndex;
                      const isSelected = selectedProductId === fp.flatId;
                      
                      return (
                        <button
                          key={fp.flatId}
                          type="button"
                          ref={(el) => {
                            if (el) productItemRefs.current.set(index, el);
                            else productItemRefs.current.delete(index);
                          }}
                          onClick={() => {
                            setSelectedProductId(fp.flatId);
                            setProductSearch(fp.displayName);
                            setSelectedProductIndex(index);
                            const { price } = getProductPrice(fp);
                            setCustomPrice(price);
                          }}
                          disabled={isOutOfStock}
                          className={`w-full px-4 py-3 text-left border-b last:border-b-0 transition-colors relative ${
                            theme === 'dark' ? 'border-slate-700/50' : 'border-slate-100'
                          } ${
                            isOutOfStock
                              ? 'opacity-50 cursor-not-allowed'
                              : isSelected
                                ? 'bg-cyan-500/10'
                                : isKeyboardSelected
                                ? 'bg-cyan-500/5 border-l-2 border-l-cyan-400'
                                : theme === 'dark' ? 'hover:bg-slate-800/50' : 'hover:bg-slate-50'
                          }`}
                        >
                          {/* Keyboard selection hint */}
                          {isKeyboardSelected && !isSelected && (
                            <div className="absolute right-2 top-2 px-1.5 py-0.5 bg-cyan-500 text-white text-xs rounded font-mono">
                              Enter
                            </div>
                          )}
                          <div className="flex justify-between items-start">
                            <div className="flex-1 min-w-0 pr-3">
                              <div className="flex items-center gap-2">
                                <p className={`font-medium truncate ${
                                  isKeyboardSelected ? 'text-cyan-400' : isSelected ? 'text-cyan-400' : (theme === 'dark' ? 'text-white' : 'text-slate-900')
                                }`}>
                                  {isSinhala ? (fp.product.nameAlt || fp.displayName) : fp.displayName}
                                </p>
                                {isOutOfStock && (
                                  <span className="px-1.5 py-0.5 text-xs font-medium bg-red-500/10 text-red-400 rounded">
                                    {t('invoice.outOfStock')}
                                  </span>
                                )}
                              </div>
                              {fp.product.nameAlt && (
                                <p className={`text-xs truncate ${theme === 'dark' ? 'text-slate-500' : 'text-slate-500'}`}>
                                  {fp.product.nameAlt}
                                </p>
                              )}
                              <p className={`text-xs mt-0.5 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                                {fp.displaySku} • {fp.product.brand || fp.product.category}
                              </p>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <div className="flex flex-col items-end">
                                {/* Show discounted price if available */}
                                {fp.hasDiscount && fp.discountedPrice ? (
                                  <>
                                    <p className={`text-xs line-through ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>
                                      {t('common.currency')} {fp.retailPrice.toLocaleString()}
                                    </p>
                                    <p className="font-bold text-pink-500">
                                      {t('common.currency')} {fp.discountedPrice.toLocaleString()}
                                    </p>
                                  </>
                                ) : (
                                  <p className="font-bold text-emerald-500">
                                    {t('common.currency')} {fp.retailPrice.toLocaleString()}
                                  </p>
                                )}
                                {/* If customer is wholesale, show wholesale rate as secondary info */}
                                {isWholesale && fp.wholesalePrice && (
                                  <p className="text-xs text-purple-400">
                                    {t('invoice.wholesaleRate')}: {t('common.currency')} {fp.wholesalePrice.toLocaleString()}
                                  </p>
                                )}
                              </div>
                              <p className={`text-xs mt-1 flex items-center gap-1 justify-end ${
                                isOutOfStock ? 'text-red-400' : isLowStock ? 'text-amber-400' : theme === 'dark' ? 'text-slate-500' : 'text-slate-500'
                              }`}>
                                <Boxes className="w-3 h-3" />
                                {fp.stock} {fp.product.unit || 'pcs'}
                              </p>
                            </div>
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>

                {/* Enhanced Product Add Panel */}
                {currentProduct && (
                  <div className={`p-4 rounded-xl border-2 ${
                    theme === 'dark' ? 'bg-slate-800/50 border-cyan-500/50' : 'bg-cyan-50/50 border-cyan-200'
                  }`}>
                    {/* Product Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h4 className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                          {isSinhala ? (currentProduct.product.nameAlt || currentProduct.displayName) : currentProduct.displayName}
                        </h4>
                        <p className={`text-xs ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                          {currentProduct.displaySku} • {t('invoice.available')}: <span className={currentProduct.stock <= currentProduct.minStock ? 'text-amber-400 font-medium' : 'text-emerald-400 font-medium'}>{currentProduct.stock} {currentProduct.product.unit || 'pcs'}</span>
                        </p>
                      </div>
                      <div className="text-right">
                        {currentCustomer?.customerType === 'wholesale' && currentProduct.wholesalePrice && (
                          <span className="px-2 py-0.5 text-xs font-medium bg-purple-500/10 text-purple-400 rounded">
                            {t('invoice.wholesaleRate')}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Price Selection */}
                    <div className="mb-4">
                      <label className={`block text-xs font-medium mb-2 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                        {t('invoice.priceMode')}
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {/* For wholesale customers: show retail + wholesale + custom */}
                        {isWholesaleCustomer ? (
                          <>
                            {/* Show retail price option (with discount if available) */}
                            {currentProduct.hasDiscount && currentProduct.discountedPrice && currentProduct.discountedPrice < currentProduct.retailPrice ? (
                              <button
                                onClick={() => setPriceMode('retail')}
                                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                                  priceMode === 'retail'
                                    ? 'bg-pink-500 text-white'
                                    : theme === 'dark' ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                }`}
                              >
                                <span className="line-through opacity-60 mr-1">{t('common.currency')} {currentProduct.retailPrice.toLocaleString()}</span>
                                {t('common.currency')} {currentProduct.discountedPrice.toLocaleString()}
                              </button>
                            ) : (
                              <button
                                onClick={() => setPriceMode('retail')}
                                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                                  priceMode === 'retail'
                                    ? 'bg-emerald-500 text-white'
                                    : theme === 'dark' ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                }`}
                              >
                                {t('invoice.retail')}: {t('common.currency')} {currentProduct.retailPrice.toLocaleString()}
                              </button>
                            )}
                            <button
                              onClick={() => setPriceMode('wholesale')}
                              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                                priceMode === 'wholesale'
                                  ? 'bg-purple-500 text-white'
                                  : theme === 'dark' ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                              }`}
                            >
                              {t('invoice.wholesale')}: {t('common.currency')} {currentProduct.wholesalePrice.toLocaleString()}
                            </button>
                            <button
                              onClick={() => setPriceMode('custom')}
                              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                                priceMode === 'custom'
                                  ? 'bg-amber-500 text-white'
                                  : theme === 'dark' ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                              }`}
                            >
                              <Edit3 className="w-3 h-3 inline mr-1" />
                              {t('invoice.custom')}
                            </button>
                          </>
                        ) : (
                          <>
                            {/* For retail customers: show retail/discounted + wholesale + custom */}
                            {currentProduct.hasDiscount && currentProduct.discountedPrice && currentProduct.discountedPrice < currentProduct.retailPrice ? (
                              <>
                                <button
                                  onClick={() => setPriceMode('retail')}
                                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                                    priceMode === 'retail' || priceMode === 'auto'
                                      ? 'bg-pink-500 text-white'
                                      : theme === 'dark' ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                  }`}
                                >
                                  <span className="line-through opacity-60 mr-1">{t('common.currency')} {currentProduct.retailPrice.toLocaleString()}</span>
                                  {t('common.currency')} {currentProduct.discountedPrice.toLocaleString()}
                                </button>
                              </>
                            ) : (
                              <button
                                onClick={() => setPriceMode('retail')}
                                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                                  priceMode === 'retail' || priceMode === 'auto'
                                    ? 'bg-emerald-500 text-white'
                                    : theme === 'dark' ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                }`}
                              >
                                {t('invoice.retail')}: {t('common.currency')} {currentProduct.retailPrice.toLocaleString()}
                              </button>
                            )}
                            {currentProduct.wholesalePrice && (
                              <button
                                onClick={() => setPriceMode('wholesale')}
                                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                                  priceMode === 'wholesale'
                                    ? 'bg-purple-500 text-white'
                                    : theme === 'dark' ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                }`}
                              >
                                {t('invoice.wholesale')}: {t('common.currency')} {currentProduct.wholesalePrice.toLocaleString()}
                              </button>
                            )}
                            <button
                              onClick={() => setPriceMode('custom')}
                              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                                priceMode === 'custom'
                                  ? 'bg-amber-500 text-white'
                                  : theme === 'dark' ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                              }`}
                            >
                              <Edit3 className="w-3 h-3 inline mr-1" />
                              {t('invoice.custom')}
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Custom Price Input */}
                    {priceMode === 'custom' && (
                      <div className="mb-4">
                        <label className={`block text-xs font-medium mb-2 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                          {t('invoice.customPrice')}
                        </label>
                        <div className="relative">
                          <span className={`absolute left-3 top-2.5 ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>{t('common.currency')}</span>
                          <input
                            ref={customPriceRef}
                            type="number"
                            value={customPrice || ''}
                            onChange={(e) => setCustomPrice(parseFloat(e.target.value) || 0)}
                            className={`w-full pl-10 pr-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                              theme === 'dark'
                                ? 'border-slate-600 bg-slate-800 text-white'
                                : 'border-slate-200 bg-white text-slate-900'
                            }`}
                          />
                        </div>
                      </div>
                    )}

                    {/* Item Discount (for paint, etc.) */}
                    {priceMode !== 'custom' && (
                      <div className="mb-4">
                        <label className={`block text-xs font-medium mb-2 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                          {t('invoice.itemDiscountOptional')}
                        </label>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setItemDiscountType('none')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                              itemDiscountType === 'none'
                                ? 'bg-slate-500 text-white'
                                : theme === 'dark' ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                            }`}
                          >
                            {t('invoice.none')}
                          </button>
                          <button
                            onClick={() => {
                              setItemDiscountType('percentage');
                              setTimeout(() => {
                                itemDiscountInputRef.current?.focus();
                                itemDiscountInputRef.current?.select();
                              }, 50);
                            }}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1 ${
                              itemDiscountType === 'percentage'
                                ? 'bg-pink-500 text-white'
                                : theme === 'dark' ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                            }`}
                          >
                            <Percent className="w-3 h-3" />
                            {t('invoice.percentage')}
                          </button>
                          <button
                            onClick={() => {
                              setItemDiscountType('fixed');
                              setTimeout(() => {
                                itemDiscountInputRef.current?.focus();
                                itemDiscountInputRef.current?.select();
                              }, 50);
                            }}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1 ${
                              itemDiscountType === 'fixed'
                                ? 'bg-pink-500 text-white'
                                : theme === 'dark' ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                            }`}
                          >
                            <Tag className="w-3 h-3" />
                            {t('invoice.fixed')}
                          </button>
                        </div>
                        {itemDiscountType !== 'none' && (
                          <div className="mt-2 relative">
                            {itemDiscountType === 'fixed' && (
                              <span className={`absolute left-3 top-2.5 ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>{t('common.currency')}</span>
                            )}
                            <input
                              ref={itemDiscountInputRef}
                              type="number"
                              placeholder={itemDiscountType === 'percentage' ? t('invoice.discountPercentPlaceholder') : t('invoice.discountAmountPlaceholder')}
                              value={itemDiscountValue || ''}
                              onChange={(e) => setItemDiscountValue(parseFloat(e.target.value) || 0)}
                              className={`w-full ${itemDiscountType === 'fixed' ? 'pl-10' : 'pl-4'} pr-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500 ${
                                theme === 'dark'
                                  ? 'border-slate-600 bg-slate-800 text-white placeholder-slate-500'
                                  : 'border-slate-200 bg-white text-slate-900 placeholder-slate-400'
                              }`}
                            />
                            {itemDiscountType === 'percentage' && (
                              <span className={`absolute right-3 top-2.5 ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>%</span>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Price Calculation Preview */}
                    {(() => {
                      const hasProductDiscount = currentProduct.hasDiscount && currentProduct.discountedPrice && currentProduct.discountedPrice < currentProduct.retailPrice;
                      const hasItemDiscount = itemDiscountType !== 'none' && itemDiscountValue > 0;
                      
                      // Determine the base price based on price mode
                      // For retail mode: use discounted price if available, otherwise retail price
                      // For wholesale mode: use wholesale price
                      // For custom mode: use custom price
                      let basePriceForCalculation: number;
                      let displayPriceLabel: string;
                      
                      if (priceMode === 'custom') {
                        basePriceForCalculation = customPrice;
                        displayPriceLabel = t('invoice.customPrice');
                      } else if (priceMode === 'wholesale') {
                        basePriceForCalculation = currentProduct.wholesalePrice;
                        displayPriceLabel = t('invoice.wholesale') + ' ' + t('invoice.price');
                      } else {
                        // Retail mode (default) - use discounted price if available
                        basePriceForCalculation = hasProductDiscount ? currentProduct.discountedPrice! : currentProduct.retailPrice;
                        displayPriceLabel = t('invoice.retail') + ' ' + t('invoice.price');
                      }
                      
                      // Apply additional item discount if any
                      let finalUnitPrice = basePriceForCalculation;
                      if (hasItemDiscount) {
                        if (itemDiscountType === 'percentage' && itemDiscountValue > 0) {
                          finalUnitPrice = basePriceForCalculation * (1 - itemDiscountValue / 100);
                        } else if (itemDiscountType === 'fixed' && itemDiscountValue > 0) {
                          finalUnitPrice = Math.max(0, basePriceForCalculation - itemDiscountValue);
                        }
                      }
                      
                      return (
                        <div className={`p-3 rounded-xl mb-4 ${
                          theme === 'dark' ? 'bg-slate-900/50' : 'bg-white'
                        }`}>
                          {/* Selected Price Mode Display */}
                          <div className="flex items-center justify-between mb-2">
                            <span className={`text-xs font-medium ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                              {displayPriceLabel}
                            </span>
                            {priceMode === 'retail' && hasProductDiscount ? (
                              <div className="flex items-center gap-2">
                                <span className="text-sm line-through text-slate-400">
                                  {t('common.currency')} {currentProduct.retailPrice.toLocaleString()}
                                </span>
                                <span className="text-sm font-semibold text-pink-500">
                                  {t('common.currency')} {currentProduct.discountedPrice!.toLocaleString()}
                                </span>
                              </div>
                            ) : (
                              <span className={`text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                                {t('common.currency')} {basePriceForCalculation.toLocaleString()}
                              </span>
                            )}
                          </div>
                          
                          {/* Additional Item Discount */}
                          {hasItemDiscount && (
                            <>
                              <div className="flex items-center justify-between mb-1">
                                <span className={`text-xs text-pink-400`}>
                                  {t('invoice.itemDiscount')} ({itemDiscountType === 'percentage' ? `${itemDiscountValue}%` : `${t('common.currency')} ${itemDiscountValue}`})
                                </span>
                                <span className="text-sm text-pink-400">
                                  - {t('common.currency')} {(basePriceForCalculation - finalUnitPrice).toLocaleString()}
                                </span>
                              </div>
                              <div className={`border-t pt-1 mt-1 mb-2 ${theme === 'dark' ? 'border-slate-700' : 'border-slate-200'}`}>
                                <div className="flex items-center justify-between">
                                  <span className={`text-xs font-medium ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
                                    {t('invoice.finalUnitPrice')}
                                  </span>
                                  <span className="text-sm font-bold text-emerald-500">
                                    {t('common.currency')} {finalUnitPrice.toLocaleString()}
                                  </span>
                                </div>
                              </div>
                            </>
                          )}
                          
                          {/* Line Item Total */}
                          <div className={`flex items-center justify-between mt-2 pt-2 border-t ${theme === 'dark' ? 'border-slate-700' : 'border-slate-200'}`}>
                            <span className={`text-sm font-medium flex items-center gap-1 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
                              <Calculator className="w-3.5 h-3.5" />
                              {t('invoice.lineTotal')} ({quantity} × {t('common.currency')} {finalUnitPrice.toLocaleString()})
                            </span>
                            <span className="text-lg font-bold text-emerald-500">
                              {t('common.currency')} {(quantity * finalUnitPrice).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      );
                    })()}

                    {/* Quantity & Add */}
                    <div className="flex gap-3">
                      <div className="flex-1">
                        <label className={`flex items-center justify-between text-xs font-medium mb-1.5 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                          <span>{t('invoice.quantity')}</span>
                          <kbd className={`px-1.5 py-0.5 rounded font-mono ${theme === 'dark' ? 'bg-slate-700 text-slate-400' : 'bg-slate-200 text-slate-500'}`}>F3</kbd>
                        </label>
                        <div className="relative">
                          <input
                            ref={quantityInputRef}
                            type="number"
                            min="0.1"
                            step="0.1"
                            max={currentProduct.stock}
                            value={quantity}
                            onChange={(e) => setQuantity(Math.min(parseFloat(e.target.value) || 0.1, currentProduct.stock))}
                            className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 text-center text-lg font-bold ${
                              theme === 'dark'
                                ? 'border-slate-600 bg-slate-800 text-white'
                                : 'border-slate-200 bg-white text-slate-900'
                            }`}
                          />
                          <span className={`absolute right-3 top-3.5 text-xs ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>
                            / {currentProduct.stock}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col">
                        <label className={`text-xs font-medium mb-1.5 text-right ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                          <kbd className={`px-1.5 py-0.5 rounded font-mono ${theme === 'dark' ? 'bg-slate-700 text-slate-400' : 'bg-slate-200 text-slate-500'}`}>Enter</kbd>
                        </label>
                        <button
                          onClick={addItem}
                          disabled={quantity <= 0 || quantity > currentProduct.stock}
                          className="flex-1 px-8 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-medium flex items-center gap-2 transition-all shadow-lg shadow-cyan-500/20"
                        >
                          <Plus className="w-5 h-5" />
                          {t('invoice.addToInvoice')}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Cart / Items List */}
              <div className={`p-4 rounded-xl border ${
                theme === 'dark' ? 'bg-slate-800/30 border-slate-700' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="flex items-center justify-between mb-4">
                  <h4 className={`font-semibold flex items-center gap-2 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                    <ShoppingCart className="w-4 h-4" />
                    {t('invoice.selectedItems')} ({items.length} {t('invoice.items')})
                  </h4>
                  {items.length > 0 && (
                    <span className="text-emerald-500 font-bold text-lg">
                      {t('common.currency')} {subtotal.toLocaleString()}
                    </span>
                  )}
                </div>

                {items.length === 0 ? (
                  <div className={`text-center py-12 ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>
                    <ShoppingCart className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p>{t('invoice.noItemsYet')}</p>
                    <p className="text-xs mt-1">{t('invoice.selectProductsHint')}</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[400px] overflow-y-auto overflow-x-hidden pr-1">
                    {items.map((item) => {
                      const extItem = item as ExtendedInvoiceItem;
                      const itemSavings = (extItem.originalPrice - item.unitPrice) * item.quantity;
                      const isEditing = editingItemId === item.id;
                      
                      return (
                        <div
                          key={item.id}
                          className={`p-3 rounded-xl border relative overflow-hidden ${
                            extItem.isQuickAdd
                              ? theme === 'dark' ? 'bg-amber-500/5 border-amber-500/30' : 'bg-amber-50 border-amber-200'
                              : theme === 'dark' ? 'bg-slate-800/50 border-slate-700/50' : 'bg-white border-slate-200'
                          }`}
                        >
                          {/* Creative Item Discount Badge */}
                          {itemSavings > 0 && !isEditing && (
                            <div className={`absolute -top-2 right-2 flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold animate-pulse ${
                              theme === 'dark' 
                                ? 'bg-gradient-to-r from-pink-500/90 to-rose-500/90 text-white shadow-lg shadow-pink-500/30' 
                                : 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-lg shadow-pink-500/30'
                            }`}>
                              <Sparkles className="w-3 h-3" />
                              -{t('common.currency')} {itemSavings.toLocaleString()}
                            </div>
                          )}
                          
                          {!isEditing ? (
                            // Normal View Mode
                            <>
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <p className={`font-medium truncate ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                                      {isSinhala ? (item.productNameSi || item.productName) : item.productName}
                                    </p>
                                    {extItem.isQuickAdd && (
                                      <span className="px-1.5 py-0.5 text-xs font-medium bg-amber-500/10 text-amber-400 rounded">
                                        {t('invoice.quickBadge')}
                                      </span>
                                    )}
                                    {extItem.isCustomPrice && (
                                      <span className="px-1.5 py-0.5 text-xs font-medium bg-purple-500/10 text-purple-400 rounded">
                                        {t('invoice.customBadge')}
                                      </span>
                                    )}
                                  </div>
                                  
                                  {/* Discount Breakdown - Enhanced with Cumulative Tracking */}
                                  <div className={`text-xs space-y-1 mt-1.5 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                                    {/* Original Price */}
                                    <div className="flex items-center gap-1">
                                      <span className="font-medium">{t('invoice.originalPrice')}:</span>
                                      <span className={extItem.originalPrice !== item.unitPrice ? 'line-through text-slate-500' : ''}>
                                        {t('common.currency')} {extItem.originalPrice.toLocaleString()}
                                      </span>
                                    </div>
                                    
                                    {/* Product Discount (Pre-defined discount from inventory) */}
                                    {extItem.productDiscountAmount && extItem.productDiscountAmount > 0 && (
                                      <div className="flex items-center gap-1 pl-3 border-l-2 border-orange-500/30">
                                        <Tag className="w-3 h-3 text-orange-500" />
                                        <span className="text-orange-600 dark:text-orange-400 font-medium">
                                          {t('invoice.productDiscount')}:
                                        </span>
                                        <span className="text-orange-500 font-semibold">
                                          -{t('common.currency')} {extItem.productDiscountAmount.toLocaleString()}
                                        </span>
                                        {extItem.productDiscountedPrice && (
                                          <span className="text-slate-400 ml-1">
                                            → {t('common.currency')} {extItem.productDiscountedPrice.toLocaleString()}
                                          </span>
                                        )}
                                      </div>
                                    )}
                                    
                                    {/* Manual Discount (Applied at checkout) */}
                                    {extItem.manualDiscountAmount && extItem.manualDiscountAmount > 0 && (
                                      <div className="flex items-center gap-1 pl-3 border-l-2 border-pink-500/30">
                                        <Percent className="w-3 h-3 text-pink-500" />
                                        <span className="text-pink-600 dark:text-pink-400 font-medium">
                                          {t('invoice.manualDiscount')}:
                                        </span>
                                        <span className="text-pink-500 font-semibold">
                                          -{t('common.currency')} {extItem.manualDiscountAmount.toLocaleString()}
                                        </span>
                                        <span className="text-pink-400 text-xs">
                                          ({extItem.discountType === 'percentage' ? `${extItem.discountValue}%` : `${t('common.currency')} ${extItem.discountValue}`})
                                        </span>
                                      </div>
                                    )}
                                    
                                    {/* Total Discount Summary (if both discounts exist) */}
                                    {(extItem.productDiscountAmount || 0) + (extItem.manualDiscountAmount || 0) > 0 && (
                                      <div className="flex items-center gap-1 pl-3 border-l-2 border-emerald-500/50 bg-emerald-500/5 rounded-r py-0.5 pr-1">
                                        <Sparkles className="w-3 h-3 text-emerald-500" />
                                        <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                                          {t('invoice.totalSavings')}:
                                        </span>
                                        <span className="text-emerald-500 font-bold">
                                          -{t('common.currency')} {((extItem.productDiscountAmount || 0) + (extItem.manualDiscountAmount || 0)).toLocaleString()}
                                        </span>
                                      </div>
                                    )}
                                    
                                    {/* Final Price */}
                                    <div className="flex items-center gap-1 font-medium pt-0.5 border-t border-dashed border-slate-600/30 mt-1">
                                      <span>{t('invoice.finalPrice')}:</span>
                                      <span className="text-emerald-500 font-bold text-sm">
                                        {t('common.currency')} {item.unitPrice.toLocaleString()}
                                      </span>
                                      <span className="text-slate-500">× {item.quantity}</span>
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <input
                                    type="number"
                                    min="0.1"
                                    step="0.1"
                                    value={item.quantity}
                                    onChange={(e) => updateItemQuantity(item.id, parseFloat(e.target.value) || 0.1)}
                                    className={`w-16 px-2 py-1 text-center border rounded-lg text-sm ${
                                      theme === 'dark'
                                        ? 'border-slate-600 bg-slate-700 text-white'
                                        : 'border-slate-200 bg-slate-50 text-slate-900'
                                    }`}
                                  />
                                  <button
                                    onClick={() => {
                                      setEditingItemId(item.id);
                                      setEditingPrice(extItem.productDiscountedPrice || extItem.originalPrice || item.unitPrice);
                                      setEditingDiscountType(extItem.discountType || 'none');
                                      setEditingDiscountValue(extItem.discountValue || 0);
                                    }}
                                    className="p-1.5 hover:bg-blue-500/10 rounded-lg transition-colors"
                                    title="Edit price/discount"
                                  >
                                    <Edit3 className="w-4 h-4 text-blue-400" />
                                  </button>
                                  <button
                                    onClick={() => removeItem(item.id)}
                                    className="p-1.5 hover:bg-red-500/10 rounded-lg transition-colors"
                                  >
                                    <Trash2 className="w-4 h-4 text-red-400" />
                                  </button>
                                </div>
                              </div>
                              <div className="flex justify-end mt-2">
                                <span className="text-emerald-500 font-semibold">
                                  {t('common.currency')} {item.total.toLocaleString()}
                                </span>
                              </div>
                            </>
                          ) : (
                            // Edit Mode
                            <div className="space-y-3">
                              <div className="flex items-center justify-between">
                                <p className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                                  {isSinhala ? (item.productNameSi || item.productName) : item.productName}
                                </p>
                                <span className="text-xs px-2 py-1 bg-blue-500/10 text-blue-400 rounded">
                                  {t('invoice.editing')}
                                </span>
                              </div>
                              
                              {/* Base Price Input */}
                              <div>
                                <label className={`block text-xs mb-1 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                                  {t('invoice.basePrice')}
                                </label>
                                <input
                                  type="number"
                                  value={editingPrice}
                                  onChange={(e) => setEditingPrice(parseFloat(e.target.value) || 0)}
                                  className={`w-full px-3 py-2 border rounded-lg ${
                                    theme === 'dark'
                                      ? 'border-slate-600 bg-slate-700 text-white'
                                      : 'border-slate-200 bg-white text-slate-900'
                                  }`}
                                />
                              </div>
                              
                              {/* Discount Type */}
                              <div>
                                <label className={`block text-xs mb-1 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                                  {t('invoice.itemDiscountOptional')}
                                </label>
                                <div className="flex gap-2 mb-2">
                                  <button
                                    onClick={() => setEditingDiscountType('none')}
                                    className={`px-2 py-1 rounded text-xs ${
                                      editingDiscountType === 'none'
                                        ? 'bg-slate-500 text-white'
                                        : theme === 'dark' ? 'bg-slate-700 text-slate-300' : 'bg-slate-100 text-slate-700'
                                    }`}
                                  >
                                    {t('invoice.none')}
                                  </button>
                                  <button
                                    onClick={() => setEditingDiscountType('percentage')}
                                    className={`px-2 py-1 rounded text-xs ${
                                      editingDiscountType === 'percentage'
                                        ? 'bg-pink-500 text-white'
                                        : theme === 'dark' ? 'bg-slate-700 text-slate-300' : 'bg-slate-100 text-slate-700'
                                    }`}
                                  >
                                    %
                                  </button>
                                  <button
                                    onClick={() => setEditingDiscountType('fixed')}
                                    className={`px-2 py-1 rounded text-xs ${
                                      editingDiscountType === 'fixed'
                                        ? 'bg-pink-500 text-white'
                                        : theme === 'dark' ? 'bg-slate-700 text-slate-300' : 'bg-slate-100 text-slate-700'
                                    }`}
                                  >
                                    {t('invoice.fixed')}
                                  </button>
                                </div>
                                {editingDiscountType !== 'none' && (
                                  <input
                                    type="number"
                                    placeholder={editingDiscountType === 'percentage' ? '0-100' : '0'}
                                    value={editingDiscountValue}
                                    onChange={(e) => setEditingDiscountValue(parseFloat(e.target.value) || 0)}
                                    className={`w-full px-3 py-2 border rounded-lg ${
                                      theme === 'dark'
                                        ? 'border-slate-600 bg-slate-700 text-white'
                                        : 'border-slate-200 bg-white text-slate-900'
                                    }`}
                                  />
                                )}
                              </div>
                              
                              {/* Action Buttons */}
                              <div className="flex gap-2">
                                <button
                                  onClick={() => updateItemPrice(item.id, editingPrice, editingDiscountType, editingDiscountValue)}
                                  className="flex-1 px-3 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-medium"
                                >
                                  {t('invoice.saveChanges')}
                                </button>
                                <button
                                  onClick={() => setEditingItemId(null)}
                                  className={`px-3 py-2 rounded-lg text-sm ${
                                    theme === 'dark' ? 'bg-slate-700 text-slate-300' : 'bg-slate-200 text-slate-700'
                                  }`}
                                >
                                  {t('common.cancel')}
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Review & Complete - Creative Invoice Preview */}
        {step === 3 && (
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center">
                  <Receipt className="w-6 h-6 text-emerald-400" />
                </div>
                <div>
                  <h3 className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                    {t('invoice.reviewComplete')}
                  </h3>
                  <p className={`text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                    {t('invoice.reviewHint')}
                  </p>
                </div>
              </div>
              <div className={`px-4 py-2 rounded-xl ${
                paymentMethod === 'credit' 
                  ? 'bg-amber-500/10 border border-amber-500/30' 
                  : 'bg-emerald-500/10 border border-emerald-500/30'
              }`}>
                <span className={`text-sm font-medium ${paymentMethod === 'credit' ? 'text-amber-400' : 'text-emerald-400'}`}>
                  {paymentMethod === 'credit' ? t('invoice.creditSale') : t('invoice.cashSale')}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
              {/* Left Panel - Settings */}
              <div className="xl:col-span-2 space-y-4">
                {/* Final Discounts */}
                <div className={`p-4 rounded-xl border ${
                  theme === 'dark' ? 'bg-slate-800/30 border-slate-700' : 'bg-white border-slate-200 shadow-sm'
                }`}>
                  <h4 className={`text-base font-semibold mb-3 flex items-center justify-between ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                    <span className="flex items-center gap-2">
                      <Tag className="w-5 h-5 text-pink-400" />
                      {t('invoice.finalDiscount')}
                    </span>
                    <kbd className={`px-1.5 py-0.5 rounded text-xs font-mono ${theme === 'dark' ? 'bg-slate-700 text-slate-400' : 'bg-slate-200 text-slate-500'}`}>F5</kbd>
                  </h4>
                  <div className="space-y-3">
                    {/* Final Discount 1 */}
                    <div>
                      <label className={`block text-xs font-medium mb-1.5 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                        {t('invoice.finalDiscount1')}
                      </label>
                      <div className="flex items-center gap-3">
                        <div className="relative flex-1">
                          <span className={`absolute left-3 top-2.5 text-sm ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>{t('common.currency')}</span>
                          <input
                            ref={discountInputRef}
                            type="number"
                            min="0"
                            max={subtotal}
                            value={discount || ''}
                            onChange={(e) => setDiscount(Math.min(subtotal, Math.max(0, parseFloat(e.target.value) || 0)))}
                            placeholder="0"
                            className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 ${
                              theme === 'dark'
                                ? 'border-slate-600 bg-slate-800 text-white placeholder-slate-500'
                                : 'border-slate-200 bg-slate-50 text-slate-900 placeholder-slate-400'
                            }`}
                          />
                        </div>
                        {discount > 0 && (
                          <span className="text-pink-400 font-medium whitespace-nowrap">
                            - {t('common.currency')} {discount.toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Received Amount - F7 shortcut */}
                <div className={`p-4 rounded-xl border ${
                  theme === 'dark' ? 'bg-slate-800/30 border-slate-700' : 'bg-white border-slate-200 shadow-sm'
                }`}>
                  <h4 className={`text-base font-semibold mb-3 flex items-center justify-between ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                    <span className="flex items-center gap-2">
                      <Banknote className="w-5 h-5 text-green-400" />
                      {t('invoice.receivedAmount')}
                    </span>
                    <kbd className={`px-1.5 py-0.5 rounded text-xs font-mono ${theme === 'dark' ? 'bg-slate-700 text-slate-400' : 'bg-slate-200 text-slate-500'}`}>F7</kbd>
                  </h4>
                  <div className="space-y-3">
                    <div className="relative">
                      <span className={`absolute left-3 top-2.5 text-sm ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>{t('common.currency')}</span>
                      <input
                        ref={receivedAmountInputRef}
                        type="number"
                        min="0"
                        value={receivedAmount || ''}
                        onChange={(e) => setReceivedAmount(Math.max(0, parseFloat(e.target.value) || 0))}
                        placeholder={total > 0 ? total.toFixed(2) : '0'}
                        className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 ${
                          theme === 'dark'
                            ? 'border-slate-600 bg-slate-800 text-white placeholder-slate-500'
                            : 'border-slate-200 bg-slate-50 text-slate-900 placeholder-slate-400'
                        }`}
                      />
                    </div>
                    {/* Change Display */}
                    {receivedAmount > 0 && (
                      <div className={`p-3 rounded-lg ${
                        changeAmount >= 0
                          ? theme === 'dark' ? 'bg-green-900/30 border border-green-700' : 'bg-green-50 border border-green-200'
                          : theme === 'dark' ? 'bg-red-900/30 border border-red-700' : 'bg-red-50 border border-red-200'
                      }`}>
                        <div className="flex justify-between items-center">
                          <span className={`text-sm font-medium ${
                            changeAmount >= 0
                              ? theme === 'dark' ? 'text-green-400' : 'text-green-600'
                              : theme === 'dark' ? 'text-red-400' : 'text-red-600'
                          }`}>
                            {t('invoice.changeAmount')}
                          </span>
                          <span className={`text-lg font-bold font-mono ${
                            changeAmount >= 0
                              ? theme === 'dark' ? 'text-green-400' : 'text-green-600'
                              : theme === 'dark' ? 'text-red-400' : 'text-red-600'
                          }`}>
                            {t('common.currency')} {changeAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Payment Method */}
                <div className={`p-4 rounded-xl border ${
                  theme === 'dark' ? 'bg-slate-800/30 border-slate-700' : 'bg-white border-slate-200 shadow-sm'
                }`}>
                  <h4 className={`text-base font-semibold mb-3 flex items-center justify-between ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                    <span className="flex items-center gap-2">
                      <CreditCard className="w-5 h-5 text-emerald-400" />
                      {t('invoice.paymentMethod')}
                    </span>
                    <span className={`text-xs font-normal flex items-center gap-3 ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>
                      <span>{t('shortcuts.pressKeys')} 1-4</span>
                      <kbd className={`px-1.5 py-0.5 rounded text-xs font-mono ${theme === 'dark' ? 'bg-slate-700 text-slate-400' : 'bg-slate-200 text-slate-500'}`}>F4</kbd>
                    </span>
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { value: 'cash', label: t('invoice.cash'), icon: DollarSign, color: 'emerald', key: '1' },
                      { value: 'card', label: t('invoice.card'), icon: CreditCard, color: 'blue', key: '2' },
                      { value: 'bank_transfer', label: t('invoice.bankTransfer'), icon: Building2, color: 'purple', key: '3' },
                      { value: 'credit', label: t('invoice.credit'), icon: AlertTriangle, color: 'amber', key: '4' },
                    ].map(({ value, label, icon: Icon, color, key }) => (
                      <button
                        key={value}
                        ref={value === 'cash' ? paymentMethodFirstRef : undefined}
                        onClick={() => setPaymentMethod(value as typeof paymentMethod)}
                        className={`p-2.5 rounded-lg border-2 text-left transition-all flex items-center gap-2 relative ${
                          paymentMethod === value
                            ? `border-${color}-500 bg-${color}-500/10`
                            : theme === 'dark' ? 'border-slate-700 hover:border-slate-600' : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        {/* Keyboard shortcut badge */}
                        <span className={`absolute -top-2 -left-1 w-5 h-5 rounded text-xs font-mono flex items-center justify-center ${
                          paymentMethod === value 
                            ? `bg-${color}-500 text-white` 
                            : theme === 'dark' ? 'bg-slate-700 text-slate-400' : 'bg-slate-200 text-slate-500'
                        }`}>
                          {key}
                        </span>
                        <Icon className={`w-4 h-4 ${paymentMethod === value ? `text-${color}-400` : theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`} />
                        <span className={`text-sm font-medium ${paymentMethod === value ? `text-${color}-400` : theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
                          {label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tax Settings */}
                <div className={`p-4 rounded-xl border ${
                  theme === 'dark' ? 'bg-slate-800/30 border-slate-700' : 'bg-white border-slate-200 shadow-sm'
                }`}>
                  <h4 className={`text-base font-semibold mb-3 flex items-center justify-between ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                    <span className="flex items-center gap-2">
                      <Calculator className="w-5 h-5 text-cyan-400" />
                      {t('invoice.taxSettings')}
                    </span>
                    <div className="flex items-center gap-2">
                      <kbd className={`px-1.5 py-0.5 rounded text-xs font-mono ${theme === 'dark' ? 'bg-slate-700 text-slate-400' : 'bg-slate-200 text-slate-500'}`}>F6</kbd>
                    </div>
                  </h4>
                  <div className="space-y-3">
                    {/* Enable Tax Toggle */}
                    <label className="flex items-center gap-3 cursor-pointer">
                      <div className="relative">
                        <input
                          ref={taxToggleRef}
                          type="checkbox"
                          checked={enableTax}
                          onChange={(e) => setEnableTax(e.target.checked)}
                          className="sr-only"
                        />
                        <div className={`w-11 h-6 rounded-full transition-colors ${
                          enableTax ? 'bg-cyan-500' : theme === 'dark' ? 'bg-slate-700' : 'bg-slate-300'
                        }`}>
                          <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-md transform transition-transform ${
                            enableTax ? 'translate-x-5' : 'translate-x-0'
                          }`} />
                        </div>
                      </div>
                      <span className={`text-sm font-medium ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
                        {t('invoice.addTax')}
                      </span>
                    </label>
                    {/* Tax Rate Input */}
                    {enableTax && (
                      <div className="flex items-center gap-3">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={taxRate}
                          onChange={(e) => setTaxRate(Math.min(100, Math.max(0, parseFloat(e.target.value) || 0)))}
                          className={`w-20 px-3 py-2 text-center border rounded-lg ${
                            theme === 'dark'
                              ? 'border-slate-600 bg-slate-800 text-white'
                              : 'border-slate-200 bg-slate-50 text-slate-900'
                          }`}
                        />
                        <span className={theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}>%</span>
                        {tax > 0 && (
                          <span className="text-cyan-400 font-medium">
                            + {t('common.currency')} {tax.toLocaleString()}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Notes */}
                <div className={`p-4 rounded-xl border ${
                  theme === 'dark' ? 'bg-slate-800/30 border-slate-700' : 'bg-white border-slate-200 shadow-sm'
                }`}>
                  <label className={`text-base font-semibold mb-2 flex items-center justify-between ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                    <span className="flex items-center gap-2">
                      <FileText className="w-5 h-5 text-slate-400" />
                      {t('invoice.notes')}
                    </span>
                    <div className="flex items-center gap-2">
                      <kbd className={`px-1.5 py-0.5 rounded text-xs font-mono ${theme === 'dark' ? 'bg-slate-700 text-slate-400' : 'bg-slate-200 text-slate-500'}`}>F8</kbd>
                    </div>
                  </label>
                  <textarea
                    ref={notesInputRef}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder={t('invoice.notesPlaceholder')}
                    rows={2}
                    className={`w-full px-3 py-2 border rounded-xl text-sm resize-none ${
                      theme === 'dark'
                        ? 'border-slate-600 bg-slate-800 text-white placeholder-slate-500'
                        : 'border-slate-200 bg-slate-50 text-slate-900 placeholder-slate-400'
                    }`}
                  />
                </div>
              </div>

              {/* Right Panel - Invoice Preview */}
              <div className="xl:col-span-3">
                <div className={`rounded-2xl overflow-hidden shadow-2xl flex flex-col h-[600px] ${
                  theme === 'dark' ? 'shadow-black/50 bg-slate-900' : 'shadow-slate-300/50 bg-white'
                }`}>
                  {/* Invoice Preview Header - Compact Paper Bill Style */}
                  <div className={`px-4 py-3 text-center border-b-2 border-dashed flex-shrink-0 ${
                    theme === 'dark' ? 'border-slate-700 bg-slate-800/50' : 'border-slate-300 bg-gradient-to-b from-slate-50 to-white'
                  }`}>
                    {/* Store Logo/Name - Compact */}
                    <div className="mb-2">
                      <h2 className={`text-lg font-black tracking-tight ${
                        theme === 'dark' ? 'text-amber-400' : 'text-amber-700'
                      }`}>🏪 LIYANAGE HARDWARE</h2>
                      <p className={`text-[10px] tracking-widest uppercase mt-0.5 ${
                        theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
                      }`}>Quality Building Materials</p>
                    </div>
                    
                    {/* Invoice Number Display - Compact */}
                    <div className="flex items-center justify-center gap-3">
                      <div className="text-center">
                        <p className={`text-[9px] font-bold uppercase tracking-wider mb-0.5 ${
                          theme === 'dark' ? 'text-slate-400' : 'text-slate-400'
                        }`}>{t('tableHeaders.invoice')}</p>
                        <div className={`inline-block px-2.5 py-1 rounded border font-mono ${
                          theme === 'dark' 
                            ? 'border-emerald-500/50 bg-emerald-500/5' 
                            : 'border-emerald-400/60 bg-emerald-50'
                        }`}>
                          <p className={`text-sm font-bold tracking-wide ${
                            theme === 'dark' ? 'text-emerald-400' : 'text-emerald-700'
                          }`}>
                            {invoiceNumber}
                          </p>
                        </div>
                      </div>
                      <div className={`w-px h-8 ${theme === 'dark' ? 'bg-slate-700' : 'bg-slate-300'}`}></div>
                      <div className="text-center">
                        <p className={`text-[9px] font-bold uppercase tracking-wider mb-0.5 ${
                          theme === 'dark' ? 'text-slate-400' : 'text-slate-400'
                        }`}>{t('invoice.issueDate')}</p>
                        <p className={`text-xs font-semibold font-mono ${
                          theme === 'dark' ? 'text-emerald-400' : 'text-emerald-700'
                        }`}>
                          {new Date(issueDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Invoice Body - Scrollable */}
                  <div className={`p-4 overflow-y-auto flex-1 ${theme === 'dark' ? 'bg-slate-900' : 'bg-white'}`}>
                    {/* Customer & Date Info - Compact Row */}
                    <div className={`flex justify-between items-start mb-3 pb-2 border-b ${
                      theme === 'dark' ? 'border-slate-800' : 'border-slate-100'
                    }`}>
                      <div className="flex-1">
                        <p className={`text-[9px] font-bold uppercase tracking-wider mb-0.5 ${
                          theme === 'dark' ? 'text-slate-500' : 'text-slate-400'
                        }`}>{t('invoice.billTo')}</p>
                        <p className={`text-xs font-semibold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                          {isWalkIn ? t('invoice.walkInCustomer') : (isSinhala && currentCustomer?.nameSi ? currentCustomer.nameSi : currentCustomer?.name)}
                        </p>
                        {!isWalkIn && currentCustomer && (
                          <p className={`text-[10px] ${theme === 'dark' ? 'text-slate-500' : 'text-slate-500'}`}>{currentCustomer.phone}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className={`text-[9px] ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>{t('invoice.issueDate')}</p>
                        <p className={`text-[10px] font-medium ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                          {new Date(issueDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </p>
                      </div>
                    </div>

                    {/* Items Table - Bill Style - Compact */}
                    <div className="mb-3">
                      {/* Table Header */}
                      <div className={`grid grid-cols-12 gap-0.5 py-1.5 text-[9px] font-bold uppercase tracking-wider border-b-2 ${
                        theme === 'dark' ? 'text-slate-400 border-slate-700' : 'text-slate-500 border-slate-200'
                      }`}>
                        <div className="col-span-5">{t('tableHeaders.item')}</div>
                        <div className="col-span-2 text-center">{t('tableHeaders.qty')}</div>
                        <div className="col-span-2 text-right">{t('tableHeaders.price')}</div>
                        <div className="col-span-3 text-right">{t('tableHeaders.total')}</div>
                      </div>
                      
                      {/* Table Body */}
                      <div className={`divide-y ${theme === 'dark' ? 'divide-slate-800/30' : 'divide-slate-100'}`}>
                        {items.slice(0, 6).map((item) => {
                          const extItem = item as ExtendedInvoiceItem;
                          const hasDiscount = extItem.originalPrice > item.unitPrice;
                          const totalDiscountPerUnit = (extItem.productDiscountAmount || 0) + (extItem.manualDiscountAmount || 0);
                          const totalSavings = totalDiscountPerUnit * item.quantity;
                          
                          return (
                            <div key={item.id}>
                              {/* Main item row */}
                              <div className="grid grid-cols-12 gap-0.5 py-1 text-[10px]">
                                <div className="col-span-5">
                                  <span className={`font-medium block ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                                    {isSinhala ? (item.productNameSi || item.productName) : item.productName}
                                  </span>
                                  {/* Show original price if there's any discount */}
                                  {hasDiscount && (
                                    <span className={`text-[8px] flex items-center gap-1 mt-0.5 ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>
                                      {t('invoice.originalPrice')}: {t('common.currency')} {extItem.originalPrice.toLocaleString()}
                                    </span>
                                  )}
                                </div>
                                <div className={`col-span-2 text-center ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                                  {item.quantity}
                                </div>
                                <div className={`col-span-2 text-right font-mono ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                                  {/* Show discounted unit price if discount exists */}
                                  {hasDiscount ? (
                                    <div className="flex flex-col items-end">
                                      <span className="line-through text-[8px] opacity-60">{extItem.originalPrice.toLocaleString()}</span>
                                      <span className="text-emerald-400 font-semibold">{item.unitPrice.toLocaleString()}</span>
                                    </div>
                                  ) : (
                                    item.unitPrice.toLocaleString()
                                  )}
                                </div>
                                <div className={`col-span-3 text-right font-mono font-semibold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                                  {item.total.toLocaleString()}
                                </div>
                              </div>
                              
                              {/* Cumulative Discount Breakdown if applicable */}
                              {hasDiscount && (
                                <div className={`text-[8px] pl-1 pb-1 space-y-0.5 ${
                                  theme === 'dark' ? 'text-slate-500' : 'text-slate-400'
                                }`}>
                                  {/* Product Discount */}
                                  {extItem.productDiscountAmount && extItem.productDiscountAmount > 0 && (
                                    <div className={`flex items-center gap-1 pl-1 border-l-2 ${
                                      theme === 'dark' ? 'border-orange-500/30 text-orange-400' : 'border-orange-300 text-orange-600'
                                    }`}>
                                      <Tag className="w-2 h-2" />
                                      <span>{t('invoice.productDiscount')}: -{t('common.currency')} {extItem.productDiscountAmount.toLocaleString()}</span>
                                    </div>
                                  )}
                                  
                                  {/* Manual Discount */}
                                  {extItem.manualDiscountAmount && extItem.manualDiscountAmount > 0 && (
                                    <div className={`flex items-center gap-1 pl-1 border-l-2 ${
                                      theme === 'dark' ? 'border-pink-500/30 text-pink-400' : 'border-pink-300 text-pink-600'
                                    }`}>
                                      <Percent className="w-2 h-2" />
                                      <span>
                                        {t('invoice.manualDiscount')}: -{t('common.currency')} {extItem.manualDiscountAmount.toLocaleString()}
                                        {extItem.discountType && (
                                          <span className="opacity-70 ml-1">
                                            ({extItem.discountType === 'percentage' ? `${extItem.discountValue}%` : `${t('common.currency')} ${extItem.discountValue}`})
                                          </span>
                                        )}
                                      </span>
                                    </div>
                                  )}
                                  
                                  {/* Total Savings */}
                                  {totalSavings > 0 && (
                                    <div className={`flex items-center justify-between gap-1 pl-1 border-l-2 ${
                                      theme === 'dark' ? 'border-emerald-500/50 text-emerald-400 bg-emerald-500/5' : 'border-emerald-300 text-emerald-600 bg-emerald-50'
                                    } rounded-r py-0.5 pr-1`}>
                                      <span className="flex items-center gap-1">
                                        <Sparkles className="w-2 h-2" />
                                        {t('invoice.totalSavings')}
                                      </span>
                                      <span className="font-bold">-{t('common.currency')} {totalSavings.toLocaleString()}</span>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                        {items.length > 6 && (
                          <div className={`py-1 text-center text-[9px] ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>
                            +{items.length - 6} {t('invoice.moreItems')}...
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Totals Section - Receipt Style - Compact */}
                    <div className={`border-t-2 border-dashed pt-2 ${
                      theme === 'dark' ? 'border-slate-700' : 'border-slate-300'
                    }`}>
                      {/* Subtotal */}
                      <div className={`flex justify-between py-0.5 text-[9px] ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                        <span>{t('invoice.subtotal')}</span>
                        <span className="font-mono">{t('common.currency')} {subtotal.toLocaleString()}</span>
                      </div>
                      
                      {/* Item Discounts */}
                      {totalItemDiscounts > 0 && (
                        <div className="flex justify-between py-0.5 text-[9px] text-pink-400">
                          <span className="flex items-center gap-0.5">
                            <Sparkles className="w-2.5 h-2.5" />
                            {t('invoice.itemDiscounts')}
                          </span>
                          <span className="font-mono">-{t('common.currency')} {totalItemDiscounts.toLocaleString()}</span>
                        </div>
                      )}
                      
                      {/* Final Discount */}
                      {finalDiscount1 > 0 && (
                        <div className="flex justify-between py-0.5 text-[9px] text-pink-400">
                          <span className="flex items-center gap-0.5">
                            <Tag className="w-2.5 h-2.5" />
                            {t('invoice.finalDiscount1')}
                          </span>
                          <span className="font-mono">-{t('common.currency')} {finalDiscount1.toLocaleString()}</span>
                        </div>
                      )}
                      
                      {/* Tax */}
                      {enableTax && (
                        <div className={`flex justify-between py-0.5 text-[9px] ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                          <span>{t('invoice.tax')} ({taxRate}%)</span>
                          <span className="font-mono">+{t('common.currency')} {tax.toFixed(2)}</span>
                        </div>
                      )}
                      
                      {/* Grand Total */}
                      <div className={`flex justify-between items-center py-2 mt-1.5 border-t-2 border-double ${
                        theme === 'dark' ? 'border-slate-600' : 'border-slate-300'
                      }`}>
                        <span className={`text-sm font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                          {t('invoice.totalAmount')}
                        </span>
                        <span className={`text-base font-black font-mono ${
                          theme === 'dark' ? 'text-emerald-400' : 'text-emerald-600'
                        }`}>
                          {t('common.currency')} {total.toLocaleString()}
                        </span>
                      </div>
                      
                      {/* Payment Info Row - Compact */}
                      <div className={`flex justify-between items-center py-1.5 mt-1 rounded px-2 text-[9px] ${
                        theme === 'dark' ? 'bg-slate-800/50' : 'bg-slate-50'
                      }`}>
                        <div className="flex items-center gap-1">
                          <span className={`${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                            {t('invoice.paymentMethod')}:
                          </span>
                          <span className={`font-semibold px-1.5 py-0.5 rounded text-[8px] ${
                            paymentMethod === 'cash' ? 'bg-emerald-500/20 text-emerald-400' :
                            paymentMethod === 'card' ? 'bg-blue-500/20 text-blue-400' :
                            paymentMethod === 'bank_transfer' ? 'bg-purple-500/20 text-purple-400' :
                            'bg-amber-500/20 text-amber-400'
                          }`}>
                            {paymentMethod === 'cash' ? `${t('invoice.cash')}` :
                             paymentMethod === 'card' ? `${t('invoice.card')}` :
                             paymentMethod === 'bank_transfer' ? `${t('invoice.bankTransfer')}` :
                             `${t('invoice.credit')}`}
                          </span>
                        </div>
                        <span className={`font-bold px-1.5 py-0.5 rounded text-[8px] ${
                          paymentMethod === 'credit' 
                            ? 'bg-amber-500/20 text-amber-400' 
                            : 'bg-emerald-500/20 text-emerald-400'
                        }`}>
                          {paymentMethod === 'credit' ? `${t('invoice.pending')}` : `${t('invoice.paid')}`}
                        </span>
                      </div>
                    </div>

                    {/* Notes - Compact */}
                    {notes && (
                      <div className={`mt-2 p-1.5 rounded border-l-2 text-[8px] ${
                        theme === 'dark' ? 'bg-amber-500/5 border-amber-500' : 'bg-amber-50 border-amber-400'
                      }`}>
                        <p className={`font-bold uppercase ${theme === 'dark' ? 'text-amber-400' : 'text-amber-700'}`}>
                          {t('invoice.notes')}
                        </p>
                        <p className={`mt-0.5 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>{notes}</p>
                      </div>
                    )}
                  </div>

                  {/* Invoice Footer - Receipt Style - Compact */}
                  <div className={`px-3 py-2 text-center border-t-2 border-dashed flex-shrink-0 ${
                    theme === 'dark' ? 'border-slate-700 bg-slate-800/30' : 'border-slate-200 bg-slate-50'
                  }`}>
                    <p className={`text-[8px] font-medium ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                      {t('invoice.thankYouMessage')}
                    </p>
                    <p className={`text-[7px] mt-0.5 ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>
                      📞 0773751805 / 0412268217
                    </p>
                    <p className={`text-[7px] ${theme === 'dark' ? 'text-slate-600' : 'text-slate-400'}`}>
                      © 2025 Nebulainfinite
                    </p>
                  </div>
                </div>

                {/* Complete Button */}
                <button
                  onClick={handleCreateInvoice}
                  disabled={items.length === 0}
                  className="w-full mt-4 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-bold text-base flex items-center justify-center gap-2 transition-all shadow-xl shadow-emerald-500/30"
                >
                  <CheckCircle className="w-5 h-5" />
                  {t('invoice.completeAndPrint')}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Navigation Buttons */}
      <div className={`flex justify-between p-6 rounded-2xl border ${
        theme === 'dark' ? 'bg-slate-800/30 border-slate-700/50' : 'bg-white border-slate-200 shadow-sm'
      }`}>
        <button
          onClick={() => step > 1 && setStep((step - 1) as Step)}
          disabled={step === 1}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium transition-all ${
            step === 1 
              ? 'opacity-50 cursor-not-allowed' 
              : theme === 'dark' ? 'bg-slate-700 text-white hover:bg-slate-600' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          <ChevronLeft className="w-4 h-4" />
          {t('invoice.previous')}
        </button>

        {step < 3 && (
          <button
            onClick={() => {
              if (step === 1 && canProceedToStep2) setStep(2);
              if (step === 2 && canProceedToStep3) setStep(3);
            }}
            disabled={(step === 1 && !canProceedToStep2) || (step === 2 && !canProceedToStep3)}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-medium transition-all shadow-lg shadow-blue-500/20"
          >
            {t('invoice.next')}
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Shortcut Hints Bar - Fixed at bottom */}
      <ShortcutHintsBar
        currentStep={getStepName()}
        currentMode={currentMode}
        onShowFullMap={() => setShowShortcutMap(true)}
      />
    </div>
  );
};
