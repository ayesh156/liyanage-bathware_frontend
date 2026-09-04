import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../contexts/ThemeContext';

/**
 * Isolated Stealth Iframe Architecture for Shaa FM Live Broadcast.
 *
 * Architecture:
 *   - Zero native `Audio()` instances — they rely on volatile static direct
 *     stream URLs that expire or get blocked by the ABC provider.
 *   - A fully headless `<iframe>` is injected into the JSX render tree and
 *     locked down with extreme styling constraints so it is invisible to the
 *     cashier surface: `hidden w-0 h-0 absolute pointer-events-none opacity-0`.
 *   - The authoritative source domain page wrapper
 *     `https://www.shaafm.lk/listenlive.php` is targeted natively.
 *   - Strict sandbox rulesets (`allow-same-origin allow-scripts allow-forms`)
 *     isolate Shaa FM's script errors from polluting the core application
 *     console log thread, while the `allow` attribute explicitly declares
 *     autoplay and encrypted-media feature policies.
 *   - When paused, the iframe src is set to `about:blank` to release the
 *     network connection and DOM context entirely.
 */
export const Navbar: React.FC = () => {
  const { t } = useTranslation();
  const { theme } = useTheme();

  // ── Playback state ──
  const [isPlaying, setIsPlaying] = useState(false);

  // ── Dynamic Console Suppression System ──
  //    Persist references to native browser console functions so they survive
  //    across re-renders and can be faithfully restored on pause / unmount.
  const originalErrorRef = useRef<typeof console.error>(console.error);
  const originalWarnRef = useRef<typeof console.warn>(console.warn);

  useEffect(() => {
    if (isPlaying) {
      // Snapshot the current native implementations at install time.
      const originalError = console.error;
      const originalWarn = console.warn;

      // Persistent reference to the active filter keywords.
      const BLOCKED_PATTERNS = [
        'shaafm.lk',
        'bootstrap',
        'jquery',
        'beacon.min.js',
        'Mixed Content',
      ];

      const shouldSuppress = (message: unknown): boolean => {
        if (typeof message !== 'string') return false;
        const lower = message.toLowerCase();
        return BLOCKED_PATTERNS.some((pattern) => lower.includes(pattern.toLowerCase()));
      };

      // ── Override console.error ──
      console.error = (...args: unknown[]) => {
        if (args.some((arg) => shouldSuppress(arg))) return; // silently drop
        originalError.apply(console, args);
      };

      // ── Override console.warn ──
      console.warn = (...args: unknown[]) => {
        if (args.some((arg) => shouldSuppress(arg))) return; // silently drop
        originalWarn.apply(console, args);
      };

      // Keep the refs in sync so the clean-up closure can restore the exact
      // same handles that were captured at the start of this effect run.
      originalErrorRef.current = originalError;
      originalWarnRef.current = originalWarn;
    } else {
      // ── Restore factory console functions ──
      console.error = originalErrorRef.current;
      console.warn = originalWarnRef.current;
    }

    return () => {
      // ── Cleanup on unmount: always restore the originals ──
      console.error = originalErrorRef.current;
      console.warn = originalWarnRef.current;
    };
  }, [isPlaying]);

  // ── Play / Pause toggle — simply flips the state which conditionally
  //    mounts/unmounts the hidden iframe (src changes between
  //    "about:blank" and the Shaa FM listen-live wrapper). ──
  const togglePlay = () => {
    setIsPlaying((prev) => !prev);
  };

  return (
    <>
      {/* ── Hidden Stealth Iframe — sandboxed, invisible, zero DOM footprint ── */}
      <iframe
        src={isPlaying ? 'https://www.shaafm.lk/listenlive.php' : 'about:blank'}
        className="hidden w-0 h-0 absolute pointer-events-none opacity-0"
        allow="autoplay; encrypted-media"
        sandbox="allow-same-origin allow-scripts allow-forms"
        title="shaa-fm-iframe"
      />

      <div className="flex items-center gap-2">
        <button
          onClick={togglePlay}
          className={`relative p-2.5 rounded-xl border transition-all duration-300 ${
            isPlaying
              ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400 shadow-emerald-500/20 shadow-lg'
              : theme === 'dark'
                ? 'bg-slate-800/50 border-slate-700/50 hover:bg-slate-700/50 text-slate-400'
                : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-600'
          }`}
          title={isPlaying ? t('navbar.pauseRadio', 'Pause Shaa FM') : t('navbar.playRadio', 'Play Shaa FM')}
        >
          {/* Live indicator dot */}
          {isPlaying && (
            <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5">
              <span className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-75" />
              <span className="absolute inset-0 rounded-full bg-emerald-400" />
            </span>
          )}

          {/* Radio tower icon (play/pause hybrid) */}
          {isPlaying ? (
            /* Pause icon — two vertical bars */
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="6" y="4" width="4" height="16" rx="1" />
              <rect x="14" y="4" width="4" height="16" rx="1" />
            </svg>
          ) : (
            /* Play icon — triangle */
            <svg className="w-4 h-4 ml-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
          )}
        </button>

        {/* Optional small label for context */}
        <span className={`hidden lg:inline text-[10px] font-medium tracking-wider uppercase ${
          isPlaying
            ? 'text-emerald-400'
            : theme === 'dark'
              ? 'text-slate-500'
              : 'text-slate-400'
        }`}>
          {isPlaying ? t('navbar.live', 'LIVE') : t('navbar.radio', 'Radio')}
        </span>
      </div>
    </>
  );
};

export default Navbar;