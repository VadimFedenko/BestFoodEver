import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { AnimatePresence, m } from '../lib/motion';
import { useIsMobile } from '../lib/useIsMobile';

export default function SavePresetModal({ open, onCancel, onSave }) {
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const [name, setName] = useState('');
  const inputRef = useRef(null);

  // Lock background scroll while modal is open
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // ESC to close
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') onCancel?.();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onCancel]);

  // Focus input on open
  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(() => inputRef.current?.focus?.(), 0);
    return () => clearTimeout(timer);
  }, [open]);

  // Reset input when closing
  useEffect(() => {
    if (open) return;
    setName('');
  }, [open]);

  const trimmed = name.trim();
  const canSave = trimmed.length > 0;

  const handleSubmit = (e) => {
    e?.preventDefault?.();
    if (!canSave) return;
    onSave?.(trimmed);
  };

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {open ? (
        <m.div
          className="fixed inset-0 z-[300]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/40" onClick={onCancel} aria-hidden="true" />

          {/* Modal */}
          <m.div
            role="dialog"
            aria-modal="true"
            aria-label={t('presets.savePresetTitle')}
            className={`
              ${isMobile 
                ? 'absolute top-0 left-0 right-0 rounded-b-2xl border-b border-surface-300/60 dark:border-surface-700/60'
                : 'absolute top-1/2 left-1/2 w-full max-w-md rounded-2xl border border-surface-300/60 dark:border-surface-700/60 -translate-x-1/2 -translate-y-1/2'
              }
              bg-white dark:bg-surface-900 shadow-2xl overflow-hidden
            `}
            initial={isMobile ? { y: -24, opacity: 0 } : { scale: 0.95, opacity: 0, x: '-50%', y: '-50%' }}
            animate={isMobile ? { y: 0, opacity: 1 } : { scale: 1, opacity: 1, x: '-50%', y: '-50%' }}
            exit={isMobile ? { y: -24, opacity: 0 } : { scale: 0.95, opacity: 0, x: '-50%', y: '-50%' }}
            transition={{ type: 'spring', stiffness: 420, damping: 40 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={`px-4 ${isMobile ? 'pt-4 pb-2' : 'pt-4 pb-3'} border-b border-surface-200 dark:border-surface-700`} style={isMobile ? { paddingTop: 'calc(16px + var(--safe-area-inset-top))' } : {}}>
              <div className="text-base font-bold text-surface-900 dark:text-surface-100">
                {t('presets.savePresetTitle')}
              </div>
            </div>

            <form onSubmit={handleSubmit} className={`px-4 ${isMobile ? 'pt-4 pb-4' : 'pt-4 pb-4'}`} style={isMobile ? { paddingBottom: 'calc(16px + var(--safe-area-inset-bottom))' } : {}}>
              <label className="block text-xs font-medium text-surface-600 dark:text-surface-300 mb-2">
                {t('presets.presetName')}
              </label>
              <input
                ref={inputRef}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t('presets.presetNamePlaceholder')}
                className="w-full px-3 py-2 rounded-xl border border-surface-300/70 dark:border-surface-700/70 bg-white dark:bg-surface-800 text-surface-900 dark:text-surface-100 outline-none focus:ring-2 focus:ring-food-500/40"
              />

              <div className={`mt-4 flex gap-2 ${isMobile ? '' : 'items-center justify-end'}`}>
                <button
                  type="button"
                  onClick={onCancel}
                  className={`px-3 py-2 text-sm font-medium rounded-xl border border-surface-300/70 dark:border-surface-700/70 bg-white/80 dark:bg-surface-800/80 hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors ${isMobile ? 'flex-1' : ''}`}
                >
                  {t('presets.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={!canSave}
                  className={`px-3 py-2 text-sm font-semibold rounded-xl transition-colors ${isMobile ? 'flex-1' : ''} ${
                    canSave
                      ? 'bg-food-500 text-white hover:bg-food-600'
                      : 'bg-surface-200 dark:bg-surface-700 text-surface-500 dark:text-surface-400 cursor-not-allowed'
                  }`}
                >
                  {t('presets.save')}
                </button>
              </div>
            </form>
          </m.div>
        </m.div>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}


