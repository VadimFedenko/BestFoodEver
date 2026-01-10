import { useEffect, useRef } from 'react';

export function useOnClickOutside({
  enabled,
  insideRefs = [],
  onOutside,
  clickCapture = false,
  closeOnScroll = false,
  scrollTarget = window,
  scrollCapture = true,
  ignoreScrollInsideRefs = [],
}) {
  const onOutsideRef = useRef(onOutside);
  const insideRefsRef = useRef(insideRefs);
  const ignoreScrollInsideRefsRef = useRef(ignoreScrollInsideRefs);

  onOutsideRef.current = onOutside;
  insideRefsRef.current = insideRefs;
  ignoreScrollInsideRefsRef.current = ignoreScrollInsideRefs;

  useEffect(() => {
    if (!enabled) return;

    const toEl = (refOrEl) =>
      refOrEl && typeof refOrEl === 'object' && 'current' in refOrEl ? refOrEl.current : refOrEl;

    const getInsideEls = () => insideRefsRef.current.map(toEl).filter(Boolean);
    const getIgnoreEls = () => ignoreScrollInsideRefsRef.current.map(toEl).filter(Boolean);

    const handlePointer = (event) => {
      const insideEls = getInsideEls();
      if (insideEls.length && !insideEls.some((el) => el.contains(event.target))) {
        onOutsideRef.current?.(event);
      }
    };

    const handleScroll = (event) => {
      const ignoreEls = getIgnoreEls();
      if (ignoreEls.length) {
        let el = event.target;
        while (el && el !== document.body) {
          if (ignoreEls.includes(el)) return;
          el = el.parentElement;
        }
      }
      onOutsideRef.current?.(event);
    };

    document.addEventListener('mousedown', handlePointer, clickCapture);
    document.addEventListener('touchstart', handlePointer, clickCapture);
    if (closeOnScroll) {
      scrollTarget?.addEventListener?.('scroll', handleScroll, scrollCapture);
    }

    return () => {
      document.removeEventListener('mousedown', handlePointer, clickCapture);
      document.removeEventListener('touchstart', handlePointer, clickCapture);
      if (closeOnScroll) {
        scrollTarget?.removeEventListener?.('scroll', handleScroll, scrollCapture);
      }
    };
  }, [enabled, clickCapture, closeOnScroll, scrollTarget, scrollCapture]);
}


