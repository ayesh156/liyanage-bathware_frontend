import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useTheme } from '../contexts/ThemeContext';

interface SidebarTooltipProps {
  label: string;
  badge?: string | null;
  children: React.ReactNode;
}

/**
 * SidebarTooltip — self-contained portal tooltip. Hovering over the trigger
 * icon shows the tooltip via React Portal to document.body. Recalculates
 * position on scroll/resize via getBoundingClientRect().
 * Theme-adaptive: dark tooltip on light theme, light tooltip on dark theme.
 */
export const SidebarTooltip: React.FC<SidebarTooltipProps> = ({ label, badge, children }) => {
  const triggerRef = useRef<HTMLSpanElement>(null);
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [show, setShow] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });

  const recalc = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    setPos({
      top: rect.top + rect.height / 2,
      left: rect.left + rect.width + 12,
    });
  }, []);

  useEffect(() => { if (show) recalc(); }, [show, recalc]);

  useEffect(() => {
    if (!show) return;
    window.addEventListener('scroll', recalc, true);
    window.addEventListener('resize', recalc);
    return () => {
      window.removeEventListener('scroll', recalc, true);
      window.removeEventListener('resize', recalc);
    };
  }, [show, recalc]);

  return (
    <span
      ref={triggerRef}
      className="inline-block"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      {children}
      {show && createPortal(
        <div
          className={`fixed z-[9999] px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap tracking-wide pointer-events-none
            ${isDark 
              ? 'bg-slate-100/95 backdrop-blur-md text-slate-900 border border-slate-300/60 shadow-2xl shadow-black/10' 
              : 'bg-slate-800/90 backdrop-blur-md text-white border border-slate-600/30 shadow-2xl shadow-black/20'
            }`}
          style={{
            top: pos.top,
            left: pos.left,
            transform: 'translateY(-50%)',
          }}
        >
          <div className={`absolute top-1/2 -left-1.5 -translate-y-1/2 w-2.5 h-2.5 rotate-45 border-l border-t backdrop-blur-md 
            ${isDark 
              ? 'bg-slate-100/95 border-slate-300/60' 
              : 'bg-slate-800/90 border-slate-600/30'
            }`} />
          <span className="relative z-10">{label}</span>
          {badge && (
            <span className="relative z-10 ml-2.5 px-1.5 py-0.5 text-[9px] font-bold bg-gradient-to-r from-orange-500 to-rose-500 text-white rounded-full shadow-lg shadow-orange-500/30">
              {badge}
            </span>
          )}
        </div>,
        document.body
      )}
    </span>
  );
};