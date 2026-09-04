import React from 'react';
import { SortAsc, SortDesc } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { useTranslation } from 'react-i18next';

interface SortButtonProps {
  currentSortOrder: 'asc' | 'desc';
  onSortToggle: () => void;
  className?: string;
}

const SortButton: React.FC<SortButtonProps> = ({ currentSortOrder, onSortToggle, className = '' }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const { t } = useTranslation();

  return (
    <button
      onClick={onSortToggle}
      className={`p-1.5 rounded-lg border transition-colors flex-shrink-0 ${className} ${
        isDark
          ? 'border-slate-700 hover:bg-slate-800'
          : 'border-slate-200 hover:bg-slate-50'
      }`}
      title={t('common.sort')}
    >
      {currentSortOrder === 'asc' ? (
        <SortAsc className="w-3.5 h-3.5" />
      ) : (
        <SortDesc className="w-3.5 h-3.5" />
      )}
    </button>
  );
};

export default SortButton;