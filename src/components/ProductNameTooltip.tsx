import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from './ui/tooltip';

interface ProductNameTooltipProps {
  /** English product name shown in the table/search row */
  children: React.ReactNode;
  /** English product name used as the tooltip fallback */
  name: string;
  /** Sinhala product name — shown in tooltip when language is 'si' and name exists */
  nameSinhala?: string;
  /** Alias for nameSinhala (e.g. item.nameSi) */
  nameSi?: string;
  /** Force English tooltip regardless of language (default: auto-detect from i18n) */
  language?: 'si' | 'en';
  /** Optional inline max-width override. If omitted, responsive Tailwind classes control the width. */
  maxWidth?: number;
  /** Side offset for the tooltip */
  sideOffset?: number;
}

const ProductNameTooltip: React.FC<ProductNameTooltipProps> = ({
  children,
  name,
  nameSinhala,
  nameSi,
  language,
  maxWidth,
  sideOffset = 4,
}) => {
  const { i18n } = useTranslation();
  const currentLang = (i18n.language || '').toLowerCase();
  const isSinhala = currentLang === 'si' || currentLang === 'sinhala';

  // Language localization logic:
  // - If language is Sinhala ('si') and a Sinhala name exists → render Sinhala name
  // - Otherwise (or if 'en') → render the standard English product name
  const sinhalaName = (nameSi || nameSinhala || '').trim();
  const resolvedLang = language || (isSinhala ? 'si' : 'en');
  const tooltipText =
    resolvedLang === 'si' && sinhalaName
      ? sinhalaName
      : name;

  return (
    <Tooltip delayDuration={150}>
      <TooltipTrigger asChild>
        <span className="inline-flex max-w-full min-w-0 cursor-pointer">
          {children}
        </span>
      </TooltipTrigger>
      <TooltipContent
        sideOffset={sideOffset}
        className="rounded-md border px-2.5 py-1 text-sm font-medium leading-snug shadow-lg z-50 animate-in fade-in-0 zoom-in-95 max-w-[280px] sm:max-w-[340px] whitespace-normal break-words"
        style={maxWidth ? { maxWidth } : undefined}
      >
        <p>{tooltipText}</p>
      </TooltipContent>
    </Tooltip>
  );
};

export default ProductNameTooltip;