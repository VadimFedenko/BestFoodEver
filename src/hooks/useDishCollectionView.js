import { useCallback, useEffect, useMemo, useState } from 'react';
import { useDishDeepLinking } from './useDishDeepLinking';
import { usePrefs } from '../store/prefsStore';
import { useIsMobile } from '../lib/useIsMobile';

/**
 * Shared controller logic for DishList / DishGrid:
 * - Search filtering
 * - Lightweight pagination ("Show more")
 * - Dish selection + deep-linking via ?dish=<id>
 * - Mobile behavior (hide list/grid under modal)
 * - Expose scroll container ref to parent (priorities panel auto-toggle)
 * - Shared prefs needed by both views
 */
export function useDishCollectionView({
  dishes,
  pageSize,
  onScrollContainerChange = null,
  paramName = 'dish',
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDish, setSelectedDish] = useState(null);
  const [hasOpenedModal, setHasOpenedModal] = useState(false);

  const priceUnit = usePrefs((s) => s.prefs.priceUnit);
  const isOptimized = usePrefs((s) => s.prefs.isOptimized);
  const priorities = usePrefs((s) => s.computationPriorities);

  const isMobile = useIsMobile();
  const isModalOpen = selectedDish !== null;

  // Filter dishes by search query
  const filteredDishes = useMemo(() => {
    if (!searchQuery.trim()) return dishes;

    const query = searchQuery.toLowerCase();
    return dishes.filter(
      (dish) =>
        dish.name.toLowerCase().includes(query) ||
        dish.description?.toLowerCase().includes(query),
    );
  }, [dishes, searchQuery]);

  // Pagination
  const [visibleCount, setVisibleCount] = useState(() => pageSize);

  // Reset pagination when search changes or when the dataset changes.
  useEffect(() => {
    setVisibleCount(pageSize);
  }, [dishes, pageSize, searchQuery]);

  const visibleDishes = useMemo(
    () => filteredDishes.slice(0, visibleCount),
    [filteredDishes, visibleCount],
  );

  const remaining = Math.max(0, filteredDishes.length - visibleCount);

  const showMore = useCallback(() => {
    setVisibleCount((c) => c + pageSize);
  }, [pageSize]);

  // Build a map of dish id to original rank (memoized to avoid O(n) rebuild on every render)
  const dishRankMap = useMemo(() => {
    const map = new Map();
    dishes.forEach((dish, index) => {
      map.set(dish.id, index + 1);
    });
    return map;
  }, [dishes]);

  const { openDish, closeDish } = useDishDeepLinking({
    dishes,
    selectedDish,
    setSelectedDish,
    paramName,
  });

  // Keep selected dish object fresh when the ranked list recomputes (e.g. after overrides Save).
  useEffect(() => {
    const id = selectedDish?.id;
    if (!id) return;
    const next = dishes?.find((d) => d?.id === id) ?? null;
    if (next && next !== selectedDish) setSelectedDish(next);
  }, [dishes, selectedDish, selectedDish?.id]);

  // Expose the scroll container element to parent (for priorities auto-toggle).
  // React will call this ref-callback with `null` on unmount.
  const setScrollContainerEl = useCallback(
    (el) => {
      onScrollContainerChange?.(el);
    },
    [onScrollContainerChange],
  );

  // Lazy-load modal code only when it is first needed (open or deeplink).
  useEffect(() => {
    if (isModalOpen && !hasOpenedModal) setHasOpenedModal(true);
  }, [hasOpenedModal, isModalOpen]);

  return {
    // search
    searchQuery,
    setSearchQuery,

    // data/pagination
    filteredDishes,
    visibleDishes,
    remaining,
    showMore,
    dishRankMap,

    // modal / deep link
    selectedDish,
    openDish,
    closeDish,
    hasOpenedModal,
    isModalOpen,

    // layout helpers
    isMobile,
    shouldHideContent: isModalOpen && isMobile,
    setScrollContainerEl,

    // prefs
    priceUnit,
    isOptimized,
    priorities,
  };
}


