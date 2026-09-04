import React, { useState, useEffect, useCallback } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { useTranslation } from 'react-i18next';
import { Category } from '../../types/index';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  FolderTree, Tag, Languages, FileText
} from 'lucide-react';

interface CategoryFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (category: Partial<Category>) => void;
  category: Category | null;
  categories: Category[];
}

export const CategoryFormModal: React.FC<CategoryFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  category,
  categories,
}) => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const isEditing = !!category;
  const isDark = theme === 'dark';

  const [formData, setFormData] = useState<Partial<Category>>({
    name: '',
    nameSinhala: '',
    icon: '',
    description: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (category) {
      setFormData({
        name: category.name,
        nameSinhala: category.nameSinhala || '',
        icon: category.icon || '',
        description: category.description || '',
      });
    } else {
      setFormData({
        name: '',
        nameSinhala: '',
        icon: '',
        description: '',
      });
    }
    setErrors({});
  }, [category, isOpen]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name?.trim()) {
      newErrors.name = t('categories.categoryNameRequired');
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSave(formData);
    }
  };

  const handleChange = (field: keyof Category, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleDialogOpenChange = (open: boolean) => {
    if (!open) onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleDialogOpenChange}>
      <DialogContent className={`sm:max-w-[460px] max-h-[90vh] overflow-y-auto ${
        isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
      }`}>
        <form onSubmit={handleSubmit}>
          <DialogHeader className="pb-2">
            <DialogTitle className={`flex items-center gap-2 text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>
              <div className="p-1.5 rounded-lg bg-gradient-to-br from-orange-500 to-rose-500">
                <FolderTree className="w-3.5 h-3.5 text-white" />
              </div>
              {isEditing ? t('categories.editCategory') : t('categories.addNewCategory')}
            </DialogTitle>
            <DialogDescription className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              {isEditing 
                ? t('categories.editDescription')
                : t('categories.addDescription')}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-3 py-2">
            {/* Category Name (English) */}
            <div className="space-y-1">
              <Label htmlFor="name" className={`flex items-center gap-1.5 text-[11px] ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                <Tag className="w-3.5 h-3.5" />
                {t('categories.categoryName')} <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder={t('categories.namePlaceholder')}
                className={`h-8 text-xs ${
                  isDark 
                    ? 'bg-slate-800 border-slate-700 text-white placeholder:text-slate-500' 
                    : 'bg-white border-slate-200'
                } ${errors.name ? 'border-red-500' : ''}`}
              />
              {errors.name && (
                <p className="text-[10px] text-red-500">{t('categories.nameRequired')}</p>
              )}
            </div>

            {/* Sinhala Name */}
            <div className="space-y-1">
              <Label htmlFor="nameSinhala" className={`flex items-center gap-1.5 text-[11px] ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                <Languages className="w-3.5 h-3.5" />
                {t('categories.sinhalaName')}
              </Label>
              <Input
                id="nameSinhala"
                value={formData.nameSinhala || ''}
                onChange={(e) => handleChange('nameSinhala', e.target.value)}
                placeholder={t('categories.sinhalaNamePlaceholder')}
                className={`h-8 text-xs ${
                  isDark 
                    ? 'bg-slate-800 border-slate-700 text-white placeholder:text-slate-500' 
                    : 'bg-white border-slate-200'
                }`}
              />
              <p className={`text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                {t('categories.sinhalaNameHelp')}
              </p>
            </div>

            {/* Description */}
            <div className="space-y-1">
              <Label htmlFor="description" className={`flex items-center gap-1.5 text-[11px] ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                <FileText className="w-3.5 h-3.5" />
                {t('categories.description')}
              </Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                placeholder={t('categories.descriptionPlaceholder')}
                rows={2}
                className={`resize-none text-xs ${
                  isDark 
                    ? 'bg-slate-800 border-slate-700 text-white placeholder:text-slate-500' 
                    : 'bg-white border-slate-200'
                }`}
              />
            </div>
          </div>

          <DialogFooter className="pt-3 gap-1.5 sm:gap-1.5">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              size="sm"
              className={`text-xs h-8 ${isDark ? 'border-slate-700 hover:bg-slate-800' : ''}`}
            >
              {t('common.cancel')}
            </Button>
            <Button
              type="submit"
              size="sm"
              className="text-xs h-8 bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600 text-white"
            >
              {isEditing ? t('categories.updateCategory') : t('categories.createCategory')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};