import { useEffect, useRef } from 'react';

/**
 * Fast, low-complexity auto toggle for Priorities panel.
 *
 * Goals:
 * - Collapse when user scrolls content down (once content is not at top)
 * - Expand when panel is collapsed and user "pulls down" at the top
 * - No timers/debounces in the gesture itself (removes perceived pause)
 * - Attach event listeners once per scrollable element; use refs for state
 */
export function usePrioritiesPanelAutoToggle({
  scrollableElement,
  isExpanded,
  expandedDish,
  setExpanded,
  onCollapseExpandedDish,
  collapseScrollTopThreshold = 30,
  topThresholdPx = 2,
  wheelExpandAccumThreshold = 40,
  touchExpandPullThreshold = 24,
  ignoreExpandAfterDishChangeMs = 250,
}) {
  const stateRef = useRef({ isExpanded, expandedDish });
  const callbacksRef = useRef({ setExpanded, onCollapseExpandedDish });

  const lastScrollTopRef = useRef(0);
  const wheelUpAccumRef = useRef(0);
  const touchStartYRef = useRef(null);
  const lastDishChangeAtRef = useRef(0);

  useEffect(() => {
    stateRef.current = { isExpanded, expandedDish };
  }, [isExpanded, expandedDish]);

  useEffect(() => {
    callbacksRef.current = { setExpanded, onCollapseExpandedDish };
  }, [setExpanded, onCollapseExpandedDish]);

  useEffect(() => {
    if (expandedDish) lastDishChangeAtRef.current = Date.now();
  }, [expandedDish]);

  useEffect(() => {
    const el = scrollableElement;
    if (!el) return;

    const isAtTop = () => el.scrollTop <= topThresholdPx;
    const shouldIgnoreExpand = () => {
      const { expandedDish: dish } = stateRef.current;
      if (!dish) return false;
      return Date.now() - lastDishChangeAtRef.current < ignoreExpandAfterDishChangeMs;
    };

    const expand = () => {
      const { isExpanded: expanded, expandedDish: dish } = stateRef.current;
      if (expanded) return;
      if (shouldIgnoreExpand()) return;

      if (dish) callbacksRef.current.onCollapseExpandedDish?.();
      callbacksRef.current.setExpanded(true);
    };

    const collapse = () => {
      const { isExpanded: expanded, expandedDish: dish } = stateRef.current;
      if (!expanded) return;
      if (dish) return;
      callbacksRef.current.setExpanded(false);
    };

    const onScroll = () => {
      const current = el.scrollTop;
      const prev = lastScrollTopRef.current;
      const delta = current - prev;
      lastScrollTopRef.current = current;

      // Any downward scrolling cancels wheel-accumulated "pull down" intent.
      if (delta > 0) wheelUpAccumRef.current = 0;

      if (stateRef.current.isExpanded && current > collapseScrollTopThreshold && !stateRef.current.expandedDish) {
        collapse();
      }
    };

    const onWheel = (e) => {
      if (stateRef.current.isExpanded) return;
      if (!isAtTop()) {
        wheelUpAccumRef.current = 0;
        return;
      }

      if (e.deltaY < 0) {
        wheelUpAccumRef.current += Math.abs(e.deltaY);
        if (wheelUpAccumRef.current >= wheelExpandAccumThreshold) {
          wheelUpAccumRef.current = 0;
          expand();
        }
      } else {
        wheelUpAccumRef.current = 0;
      }
    };

    const onTouchStart = (e) => {
      if (stateRef.current.isExpanded) {
        touchStartYRef.current = null;
        return;
      }
      touchStartYRef.current = isAtTop() ? e.touches[0].clientY : null;
    };

    const onTouchMove = (e) => {
      if (stateRef.current.isExpanded) return;
      if (touchStartYRef.current == null) return;
      if (!isAtTop()) return;

      const dy = e.touches[0].clientY - touchStartYRef.current;
      if (dy >= touchExpandPullThreshold) {
        touchStartYRef.current = null;
        expand();
      }
    };

    const onTouchEnd = () => {
      touchStartYRef.current = null;
    };

    lastScrollTopRef.current = el.scrollTop;
    el.addEventListener('scroll', onScroll, { passive: true });
    el.addEventListener('wheel', onWheel, { passive: true });
    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchmove', onTouchMove, { passive: true });
    el.addEventListener('touchend', onTouchEnd, { passive: true });
    el.addEventListener('touchcancel', onTouchEnd, { passive: true });

    return () => {
      el.removeEventListener('scroll', onScroll);
      el.removeEventListener('wheel', onWheel);
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
      el.removeEventListener('touchend', onTouchEnd);
      el.removeEventListener('touchcancel', onTouchEnd);
    };
  }, [
    scrollableElement,
    collapseScrollTopThreshold,
    topThresholdPx,
    wheelExpandAccumThreshold,
    touchExpandPullThreshold,
    ignoreExpandAfterDishChangeMs,
  ]);
}


