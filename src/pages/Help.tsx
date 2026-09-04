import React, { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useIsMobile } from '../hooks/use-mobile';
import {
  HelpCircle,
  Book,
  MessageCircle,
  Phone,
  Mail,
  Video,
  FileText,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Search,
  Package,
  FileText as Invoice,
  Users,
  DollarSign,
  Settings as SettingsIcon,
  Printer
} from 'lucide-react';

interface FAQItem {
  question: string;
  answer: string;
  category: string;
}

export const Help: React.FC = () => {
  const { theme } = useTheme();
  const isMobile = useIsMobile();
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('all');

  const faqItems: FAQItem[] = [
    {
      question: 'How do I create a new invoice?',
      answer: 'Navigate to the Invoices page and click the "New Invoice" button. You can use the Invoice Wizard for a step-by-step process or the full form for detailed entry. Select a customer, add products, and click Save.',
      category: 'invoices'
    },
    {
      question: 'Can I print invoices?',
      answer: 'Yes! Open any invoice and click the "Print" button. The system generates a professional, print-ready invoice that you can print directly or save as PDF.',
      category: 'invoices'
    },
    {
      question: 'How do I add a new product?',
      answer: 'Go to the Products page and click "Add Product". Fill in the product details including name, SKU, pricing (cost, wholesale, retail), select a category and brand, then save.',
      category: 'products'
    },
    {
      question: 'What are product variants?',
      answer: 'Product variants allow you to have different versions of the same product (e.g., different sizes, colors). You can add variants when creating or editing a product.',
      category: 'products'
    },
    {
      question: 'How do I manage customer credit?',
      answer: 'When creating a customer, select "Credit" as the customer type. Set a credit limit, and the system will track their loan balance. You can view credit details from the customer\'s profile.',
      category: 'customers'
    },
    {
      question: 'What is the difference between customer types?',
      answer: 'Regular customers pay at purchase. Wholesale customers get bulk pricing. Credit customers can purchase on credit with a set limit that you define.',
      category: 'customers'
    },
    {
      question: 'How do I switch between languages?',
      answer: 'Use the language switcher in the top navigation bar or go to Settings > Appearance. We support English and Sinhala (සිංහල).',
      category: 'settings'
    },
    {
      question: 'How do I export my data?',
      answer: 'Go to Settings > Data & Backup. You can export all data as JSON, or export specific reports (Customers, Products, Invoices) as CSV files.',
      category: 'settings'
    },
    {
      question: 'How are financial reports calculated?',
      answer: 'Financial reports aggregate all invoice data, categorize by product type, and calculate revenue, expenses, and profit. Reports can be filtered by date range.',
      category: 'reports'
    },
    {
      question: 'Can I customize invoice numbering?',
      answer: 'Yes! Go to Settings > Invoice Settings. You can set a custom prefix (e.g., "INV", "HW") and starting number for your invoices.',
      category: 'settings'
    }
  ];

  const categories = [
    { id: 'all', label: 'All Topics', icon: HelpCircle },
    { id: 'invoices', label: 'Invoices', icon: Invoice },
    { id: 'products', label: 'Products', icon: Package },
    { id: 'customers', label: 'Customers', icon: Users },
    { id: 'reports', label: 'Reports', icon: DollarSign },
    { id: 'settings', label: 'Settings', icon: SettingsIcon }
  ];

  const filteredFAQs = faqItems.filter(item => {
    const matchesSearch = item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.answer.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === 'all' || item.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const quickLinks = [
    { title: 'Getting Started Guide', icon: Book, description: 'Learn the basics of Liyanage Hardware' },
    { title: 'Video Tutorials', icon: Video, description: 'Watch step-by-step tutorials' },
    { title: 'Documentation', icon: FileText, description: 'Detailed feature documentation' }
  ];

  return (
    <div className={`space-y-6 ${isMobile ? 'pb-20' : ''}`}>
      {/* Header */}
      <div className="text-center">
        <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-orange-500/20 to-rose-500/20 rounded-2xl flex items-center justify-center">
          <HelpCircle className="w-8 h-8 text-orange-500" />
        </div>
        <h1 className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
          Help Center
        </h1>
        <p className={`mt-2 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
          Find answers to common questions and learn how to use Liyanage Hardware
        </p>
      </div>

      {/* Search */}
      <div className="max-w-2xl mx-auto">
        <div className="relative">
          <Search className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`} />
          <input
            type="text"
            placeholder="Search for help..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full pl-12 pr-4 py-3 rounded-xl border ${
              theme === 'dark'
                ? 'bg-slate-800 border-slate-700 text-white placeholder:text-slate-500'
                : 'bg-white border-slate-200 text-slate-900 placeholder:text-slate-400'
            }`}
          />
        </div>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
        {quickLinks.map((link, index) => {
          const Icon = link.icon;
          return (
            <button
              key={index}
              className={`p-5 rounded-xl border text-left transition-all hover:scale-[1.02] ${
                theme === 'dark'
                  ? 'bg-slate-800/50 border-slate-700 hover:border-orange-500/50'
                  : 'bg-white border-slate-200 hover:border-orange-500/50 shadow-sm'
              }`}
            >
              <div className={`w-10 h-10 rounded-lg mb-3 flex items-center justify-center ${
                theme === 'dark' ? 'bg-slate-700' : 'bg-slate-100'
              }`}>
                <Icon className="w-5 h-5 text-orange-500" />
              </div>
              <h3 className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                {link.title}
              </h3>
              <p className={`text-sm mt-1 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                {link.description}
              </p>
            </button>
          );
        })}
      </div>

      {/* Category Filter */}
      <div className="flex gap-2 overflow-x-auto pb-2 max-w-4xl mx-auto">
        {categories.map((cat) => {
          const Icon = cat.icon;
          return (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium whitespace-nowrap transition-all ${
                activeCategory === cat.id
                  ? 'bg-gradient-to-r from-orange-500 to-rose-500 text-white'
                  : theme === 'dark'
                    ? 'bg-slate-800/50 text-slate-400 hover:text-white border border-slate-700/50'
                    : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* FAQ Section */}
      <div className={`max-w-4xl mx-auto rounded-2xl border overflow-hidden ${
        theme === 'dark' ? 'bg-slate-800/30 border-slate-700/50' : 'bg-white border-slate-200'
      }`}>
        <div className={`p-4 border-b ${theme === 'dark' ? 'border-slate-700' : 'border-slate-200'}`}>
          <h2 className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
            Frequently Asked Questions
          </h2>
        </div>
        
        <div className="divide-y divide-slate-200 dark:divide-slate-700">
          {filteredFAQs.length === 0 ? (
            <div className="p-8 text-center">
              <HelpCircle className={`w-12 h-12 mx-auto mb-3 ${theme === 'dark' ? 'text-slate-600' : 'text-slate-300'}`} />
              <p className={theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}>
                No results found for "{searchQuery}"
              </p>
            </div>
          ) : (
            filteredFAQs.map((faq, index) => (
              <div key={index}>
                <button
                  onClick={() => setExpandedFAQ(expandedFAQ === index ? null : index)}
                  className={`w-full flex items-center justify-between p-4 text-left transition-colors ${
                    theme === 'dark' ? 'hover:bg-slate-800/50' : 'hover:bg-slate-50'
                  }`}
                >
                  <span className={`font-medium pr-4 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                    {faq.question}
                  </span>
                  {expandedFAQ === index ? (
                    <ChevronUp className={`w-5 h-5 flex-shrink-0 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`} />
                  ) : (
                    <ChevronDown className={`w-5 h-5 flex-shrink-0 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`} />
                  )}
                </button>
                {expandedFAQ === index && (
                  <div className={`px-4 pb-4 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>
                    {faq.answer}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Contact Support */}
      <div className={`max-w-4xl mx-auto p-6 rounded-2xl border ${
        theme === 'dark' ? 'bg-slate-800/30 border-slate-700/50' : 'bg-white border-slate-200'
      }`}>
        <h2 className={`text-lg font-semibold mb-4 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
          Still Need Help?
        </h2>
        <p className={`mb-6 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
          Our support team is available to assist you with any questions or issues.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <a
            href="mailto:info@liyanage.lk"
            className={`flex items-center gap-3 p-4 rounded-xl border transition-all hover:border-orange-500/50 ${
              theme === 'dark'
                ? 'bg-slate-800/50 border-slate-700'
                : 'bg-slate-50 border-slate-200'
            }`}
          >
            <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center">
              <Mail className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <p className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Email Support</p>
              <p className={`text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>info@liyanage.lk</p>
            </div>
          </a>

          <a
            href="tel:+94112345678"
            className={`flex items-center gap-3 p-4 rounded-xl border transition-all hover:border-orange-500/50 ${
              theme === 'dark'
                ? 'bg-slate-800/50 border-slate-700'
                : 'bg-slate-50 border-slate-200'
            }`}
          >
            <div className="w-10 h-10 bg-green-500/10 rounded-lg flex items-center justify-center">
              <Phone className="w-5 h-5 text-green-500" />
            </div>
            <div>
              <p className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Phone Support</p>
              <p className={`text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>+94 11 234 5678</p>
            </div>
          </a>

          <button
            className={`flex items-center gap-3 p-4 rounded-xl border transition-all hover:border-orange-500/50 ${
              theme === 'dark'
                ? 'bg-slate-800/50 border-slate-700'
                : 'bg-slate-50 border-slate-200'
            }`}
          >
            <div className="w-10 h-10 bg-purple-500/10 rounded-lg flex items-center justify-center">
              <MessageCircle className="w-5 h-5 text-purple-500" />
            </div>
            <div className="text-left">
              <p className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Live Chat</p>
              <p className={`text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>Available 9am - 6pm</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};
