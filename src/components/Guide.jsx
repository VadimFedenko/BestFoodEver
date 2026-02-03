import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, ChevronRight, X, Utensils, Heart, Timer, DollarSign, Leaf, Clock } from '../icons/lucide';
import { prefsActions, usePrefs } from '../store/prefsStore';
import i18n from '../i18n/i18n';
import './Guide.css';

// Import markdown content as raw strings using Vite's ?raw suffix
// Default (English) versions
import page1ContentEn from '../guide/page1.md?raw';
import page2ContentEn from '../guide/page2.md?raw';
import page3ContentEn from '../guide/page3.md?raw';
import page4ContentEn from '../guide/page4.md?raw';

// Russian versions
import page1ContentRu from '../guide/page1.ru.md?raw';
import page2ContentRu from '../guide/page2.ru.md?raw';
import page3ContentRu from '../guide/page3.ru.md?raw';
import page4ContentRu from '../guide/page4.ru.md?raw';

// Ukrainian versions
import page1ContentUa from '../guide/page1.ua.md?raw';
import page2ContentUa from '../guide/page2.ua.md?raw';
import page3ContentUa from '../guide/page3.ua.md?raw';
import page4ContentUa from '../guide/page4.ua.md?raw';

// Language-specific content maps
const markdownPagesByLang = {
  en: [page1ContentEn, page2ContentEn, page3ContentEn, page4ContentEn],
  ru: [page1ContentRu, page2ContentRu, page3ContentRu, page4ContentRu],
  ua: [page1ContentUa, page2ContentUa, page3ContentUa, page4ContentUa],
};

// Lazy load webp animation - will be loaded after component mounts
let tapToInvertImagePromise = null;
function loadTapToInvertImage() {
  if (!tapToInvertImagePromise) {
    tapToInvertImagePromise = import('../guide/tap_to_invert.webp').then((m) => m.default);
  }
  return tapToInvertImagePromise;
}

// Icon mapping for criteria with colors matching UI
const criteriaIcons = {
  taste: { Icon: Utensils, color: 'text-amber-500 dark:text-amber-400' },
  health: { Icon: Heart, color: 'text-rose-500 dark:text-rose-400' },
  speed: { Icon: Timer, color: 'text-blue-500 dark:text-blue-400' },
  time: { Icon: Clock, color: 'text-blue-500 dark:text-blue-400' },
  cost: { Icon: DollarSign, color: 'text-emerald-500 dark:text-emerald-400' },
  price: { Icon: DollarSign, color: 'text-emerald-500 dark:text-emerald-400' },
  cheapness: { Icon: DollarSign, color: 'text-emerald-500 dark:text-emerald-400' },
  ethics: { Icon: Leaf, color: 'text-lime-500 dark:text-lime-400' },
};

/**
 * Inline icon component for markdown
 */
function CriteriaIcon({ name, size = 18, className = '' }) {
  const config = criteriaIcons[name?.toLowerCase()];
  if (!config) return null;
  
  const { Icon, color } = config;
  
  return (
    <Icon 
      size={size} 
      className={`inline-block align-middle ${color} ${className}`}
      style={{ verticalAlign: 'middle', marginRight: '4px' }}
    />
  );
}

function isInteractiveTarget(target) {
  if (!(target instanceof Element)) return false;
  return Boolean(
    target.closest('details, summary, a, button, input, textarea, select, label, [role="button"], [role="link"]')
  );
      }

/**
 * Main Guide component
 * Minimal swipe/drag slider with markdown content on first app launch
 */
export default function Guide({ onComplete }) {
  // Persisted key stays `hasSeenOnboarding` to avoid migrations; UI calls it "Guide".
  const { t } = useTranslation();
  const hasSeenGuide = usePrefs((s) => s.prefs.hasSeenOnboarding);
  const language = usePrefs((s) => s.prefs.language);
  const isVisible = !hasSeenGuide;
  const [page, setPage] = useState(0);
  const [dragPx, setDragPx] = useState(0);
  const [tapToInvertImage, setTapToInvertImage] = useState(null);
  const [tapToInvertShown, setTapToInvertShown] = useState(false);
  const wrapperRef = useRef(null);
  const pointerIdRef = useRef(null);
  const startRef = useRef({ x: 0, y: 0 });
  const axisRef = useRef(null); // 'x' | 'y' | null

  // Get current language and select appropriate pages
  // Use state to trigger re-render when language changes
  const [currentLang, setCurrentLang] = useState(i18n.language || 'en');
  
  useEffect(() => {
    const handleLanguageChange = (lng) => {
      setCurrentLang(lng || 'en');
    };
    
    // Set initial language
    setCurrentLang(i18n.language || 'en');
    
    // Listen for language changes
    i18n.on('languageChanged', handleLanguageChange);
    
    return () => {
      i18n.off('languageChanged', handleLanguageChange);
    };
  }, []);
  
  const lang = currentLang === 'ru' ? 'ru' : currentLang === 'ua' ? 'ua' : 'en';
  const markdownPages = markdownPagesByLang[lang] || markdownPagesByLang.en;
  const totalPages = markdownPages.length;

  // Preload + decode webp animation as soon as the guide opens.
  // This avoids the "pop-in" after slide transitions (requestIdleCallback tends to run only after animations finish).
  useEffect(() => {
    if (!isVisible) return;

    let cancelled = false;

    loadTapToInvertImage()
      .then((url) => {
        if (cancelled) return;

        // Decode ahead of time so the first paint on slide 2 is smooth.
        const img = new Image();
        img.src = url;

        const finalize = () => {
          if (cancelled) return;
          setTapToInvertImage(url);
          setTapToInvertShown(false);
          // Trigger a paint-change for opacity transition.
          requestAnimationFrame(() => {
            if (cancelled) return;
            setTapToInvertShown(true);
          });
        };

        if (typeof img.decode === 'function') {
          img.decode().then(finalize).catch(() => {
            // Fallback to load event if decode fails (some browsers / memory pressure).
            img.onload = finalize;
          });
        } else {
          img.onload = finalize;
        }
      })
      .catch(() => {
        // Silently fail if image can't be loaded
      });

    return () => {
      cancelled = true;
    };
  }, [isVisible]);

  // Clamp page if markdownPages length changes (dev/HMR)
  useEffect(() => {
    setPage((p) => Math.max(0, Math.min(totalPages - 1, p)));
  }, [totalPages]);

  // Lock body scroll while onboarding is visible.
  useEffect(() => {
    if (!isVisible) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isVisible]);

  const handleComplete = useCallback(() => {
    prefsActions.setPref({ hasSeenOnboarding: true });
    onComplete?.();
  }, [onComplete]);

  const goTo = useCallback((next) => {
    setPage((p) => {
      const value = typeof next === 'function' ? next(p) : next;
      return Math.max(0, Math.min(totalPages - 1, value));
    });
  }, [totalPages]);

  const prev = useCallback(() => goTo((p) => p - 1), [goTo]);
  const next = useCallback(() => goTo((p) => p + 1), [goTo]);

  // Handle keyboard navigation
  useEffect(() => {
    if (!isVisible) return;

    const handleKeyDown = (e) => {
      if (e.key === 'ArrowLeft') {
        prev();
      } else if (e.key === 'ArrowRight') {
        next();
      } else if (e.key === 'Escape') {
        handleComplete();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isVisible, prev, next, handleComplete]);

  const isLastPage = page >= totalPages - 1;
  const isFirstPage = page === 0;

  // Get page titles for navigation buttons
  const getPageTitle = useCallback((pageNumber) => {
    return t(`guide.pageTitles.${pageNumber}`, { defaultValue: '' });
  }, [t]);

  const nextPageTitle = !isLastPage ? getPageTitle(page + 2) : '';
  const prevPageTitle = !isFirstPage ? getPageTitle(page) : '';

  const trackStyle = useMemo(() => {
    const base = `-${page * 100}%`;
    return { transform: `translateX(calc(${base} + ${dragPx}px))` };
  }, [page, dragPx]);

  const onPointerDown = useCallback((e) => {
    if (!wrapperRef.current) return;
    if (e.button !== undefined && e.button !== 0) return; // left mouse only
    if (isInteractiveTarget(e.target)) return;

    pointerIdRef.current = e.pointerId;
    axisRef.current = null;
    startRef.current = { x: e.clientX, y: e.clientY };
    setDragPx(0);

    try {
      wrapperRef.current.setPointerCapture(e.pointerId);
    } catch {
      // ignore
    }
  }, []);

  const onPointerMove = useCallback((e) => {
    if (pointerIdRef.current !== e.pointerId) return;
    const dx = e.clientX - startRef.current.x;
    const dy = e.clientY - startRef.current.y;

    if (!axisRef.current) {
      const ax = Math.abs(dx);
      const ay = Math.abs(dy);
      if (ax > ay + 6) axisRef.current = 'x';
      else if (ay > ax + 6) axisRef.current = 'y';
    }

    if (axisRef.current === 'x') {
      e.preventDefault();
      setDragPx(dx);
    }
  }, []);

  const endDrag = useCallback((e) => {
    if (pointerIdRef.current !== e.pointerId) return;
    const el = wrapperRef.current;
    const width = el?.clientWidth || 0;
    const threshold = Math.max(60, Math.floor(width * 0.18));

    if (axisRef.current === 'x') {
      if (dragPx <= -threshold) next();
      else if (dragPx >= threshold) prev();
    }

    pointerIdRef.current = null;
    axisRef.current = null;
    setDragPx(0);

    try {
      el?.releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }
  }, [dragPx, next, prev]);

  if (!isVisible) return null;

  return (
    <div className="onboarding-overlay">
      {/* Backdrop */}
      <div className="onboarding-backdrop" />

      {/* Container */}
      <div className="onboarding-container">
          {/* Language toggle and Skip button */}
          <div className="onboarding-header-controls">
            {/* Language toggle */}
            <div className="onboarding-lang-toggle">
              <button
                type="button"
                onClick={() => prefsActions.setPref({ language: 'en' })}
                className={`onboarding-lang-btn ${language === 'en' ? 'active' : ''}`}
                aria-label="English"
              >
                En
              </button>
              <button
                type="button"
                onClick={() => prefsActions.setPref({ language: 'ru' })}
                className={`onboarding-lang-btn ${language === 'ru' ? 'active' : ''}`}
                aria-label="Русский"
              >
                Ru
              </button>
              <button
                type="button"
                onClick={() => prefsActions.setPref({ language: 'ua' })}
                className={`onboarding-lang-btn ${language === 'ua' ? 'active' : ''}`}
                aria-label="Українська"
              >
                Ua
              </button>
            </div>
            {/* Skip button */}
            <button type="button" onClick={handleComplete} className="onboarding-skip-btn" aria-label={t('guide.skip')}>
              <X size={18} />
              <span>{t('guide.skip')}</span>
            </button>
          </div>

        {/* Slider */}
        <div
          ref={wrapperRef}
          className="onboarding-book-wrapper"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
        >
          <div className="onboarding-slider">
            <div className={`onboarding-track ${dragPx ? 'dragging' : ''}`} style={trackStyle}>
              {markdownPages.map((content, index) => (
                <div key={index} className="onboarding-page">
                  <div className="onboarding-page-inner">
                    <div className="onboarding-page-content">
                      <ReactMarkdown
                        rehypePlugins={[rehypeRaw]}
                        components={{
                          img: ({ src, alt, className, ...props }) => {
                            // Avoid 404: until the lazily-imported image URL is ready, omit `src`
                            // so the browser doesn't try to fetch `/tap_to_invert.webp`.
                            const isTapToInvert =
                              src === './tap_to_invert.webp' || src === 'tap_to_invert.webp';

                            if (isTapToInvert && !tapToInvertImage) {
                              // Keep layout stable on slide transition: show a placeholder box.
                              return (
                                <div
                                  className={`${className || ''} onboarding-animation--placeholder`}
                                  aria-hidden="true"
                                />
                              );
                            }

                            const imageSrc = isTapToInvert ? tapToInvertImage : src;
                            const extraClass =
                              isTapToInvert && tapToInvertImage
                                ? tapToInvertShown
                                  ? 'onboarding-animation--shown'
                                  : ''
                                : '';
                            const mergedClassName = `${className || ''} ${extraClass}`.trim();

                            return <img src={imageSrc} alt={alt} className={mergedClassName} {...props} />;
                          },
                          // Custom component for icon spans
                          span: ({ 'data-icon': dataIcon, className, children, ...props }) => {
                            if (dataIcon) {
                              return <CriteriaIcon name={dataIcon} size={18} className={className} />;
                            }
                            return <span className={className} {...props}>{children}</span>;
                          },
                        }}
                      >
                        {content}
                      </ReactMarkdown>
                    </div>
                    <div className="onboarding-page-number">{index + 1}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          </div>

          {/* Navigation Controls */}
          <div className="onboarding-controls">
          <button type="button" onClick={prev} disabled={isFirstPage} className="onboarding-nav-btn onboarding-nav-btn--prev" aria-label="Previous">
              <ChevronLeft size={20} />
              {prevPageTitle && <span className="onboarding-nav-btn-text">{prevPageTitle}</span>}
            </button>

              <div className="onboarding-page-text">
            {page + 1} / {totalPages}
            </div>

            {isLastPage ? (
            <button type="button" onClick={handleComplete} className="onboarding-start-btn">
                {t('guide.getStarted')}
              </button>
            ) : (
            <button type="button" onClick={next} className="onboarding-nav-btn onboarding-nav-btn--next" aria-label="Next">
                <span className="onboarding-nav-btn-text">{nextPageTitle}</span>
                <ChevronRight size={20} />
              </button>
            )}
          </div>
      </div>
    </div>
  );
}

/**
 * Utility function to manually reset onboarding state (for testing)
 */
export function resetOnboarding() {
  prefsActions.setPref({ hasSeenOnboarding: false });
}

