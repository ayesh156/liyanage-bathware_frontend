import React from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../contexts/ThemeContext';

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  itemName?: string;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({
  isOpen,
  title,
  message,
  itemName,
  onConfirm,
  onCancel,
  isLoading = false,
}) => {
  const { t } = useTranslation();
  const { theme } = useTheme();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 w-screen h-screen min-w-full min-h-full">
      {/* Full-viewport backdrop — no gap, no leakage */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm w-screen h-screen min-w-full min-h-full block" />
      <div className={`relative rounded-2xl max-w-md w-full shadow-2xl overflow-hidden border ${
        theme === 'dark' 
          ? 'bg-slate-900 border-slate-700/50' 
          : 'bg-white border-slate-200'
      }`}>
        <div className={`p-6 border-b ${
          theme === 'dark'
            ? 'bg-gradient-to-r from-red-600/20 to-red-500/10 border-red-500/30'
            : 'bg-gradient-to-r from-red-100 to-red-50 border-red-200'
        }`}>
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
              theme === 'dark' ? 'bg-red-500/20' : 'bg-red-100'
            }`}>
              <AlertTriangle className={`w-6 h-6 flex-shrink-0 ${
                theme === 'dark' ? 'text-red-400' : 'text-red-600'
              }`} />
            </div>
            <h2 className={`text-xl font-bold ${
              theme === 'dark' ? 'text-white' : 'text-slate-900'
            }`}>{title}</h2>
          </div>
        </div>

        <div className="p-6">
          <p className={`mb-2 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>{message}</p>
          {itemName && (
            <p className={`text-sm font-semibold p-3 rounded-lg mt-4 border ${
              theme === 'dark' 
                ? 'text-white bg-slate-800/50 border-slate-700/50' 
                : 'text-slate-900 bg-slate-100 border-slate-200'
            }`}>
              "{itemName}"
            </p>
          )}
        </div>

        <div className={`p-6 border-t flex gap-3 ${
          theme === 'dark' ? 'border-slate-700/50' : 'border-slate-200'
        }`}>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="flex-1 px-4 py-2.5 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 disabled:opacity-50 text-white rounded-xl font-medium transition-all"
          >
            {isLoading ? t('common.deleting') : t('common.delete')}
          </button>
          <button
            onClick={onCancel}
            disabled={isLoading}
            className={`flex-1 px-4 py-2.5 rounded-xl font-medium transition-colors disabled:opacity-50 border ${
              theme === 'dark'
                ? 'bg-slate-700/50 hover:bg-slate-700 text-white border-slate-600/50'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-900 border-slate-300'
            }`}
          >
            {t('common.cancel')}
          </button>
        </div>
      </div>
    </div>
  );
};