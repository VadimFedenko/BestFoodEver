import { useEffect, useMemo, useState } from 'react';
import DishTile from './DishTile';
import DishModal from './DishModal';
import { StatsBar, EmptyState } from './DishListCommon';
import { usePrefs, prefsActions } from '../store/prefsStore';

/**
 * Main Dish Grid Component
 * Displays a responsive grid of dish tiles
 */
export default function DishGrid({ 
  dishes, 
  ingredientIndex,
  analysisVariants = null
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDish, setSelectedDish] = useState(null);
  const priceUnit = usePrefs((s) => s.prefs.priceUnit);
  const overrides = usePrefs((s) => s.prefs.overrides);
  const isOptimized = usePrefs((s) => s.prefs.isOptimized);
  const priorities = usePrefs((s) => s.computationPriorities);

  // Pagination
  const pageSize = 30; // Smaller for grid since tiles are larger
  const [visibleCount, setVisibleCount] = useState(() => pageSize);

  // Filter dishes by search query
  const filteredDishes = useMemo(() => {
    if (!searchQuery.trim()) return dishes;
    
    const query = searchQuery.toLowerCase();
    return dishes.filter(dish => 
      dish.name.toLowerCase().includes(query) ||
      dish.description?.toLowerCase().includes(query)
    );
  }, [dishes, searchQuery]);

  // Reset pagination when search changes or when the dataset changes.
  useEffect(() => {
    setVisibleCount(pageSize);
  }, [searchQuery, dishes, pageSize]);

  const visibleDishes = useMemo(() => {
    return filteredDishes.slice(0, visibleCount);
  }, [filteredDishes, visibleCount]);

  // Build a map of dish name to original rank
  const dishRankMap = useMemo(() => {
    const map = new Map();
    dishes.forEach((dish, index) => {
      map.set(dish.name, index + 1);
    });
    return map;
  }, [dishes]);

  const handleDishClick = (dish) => {
    setSelectedDish(dish);
  };
  
  const handleCloseModal = () => {
    setSelectedDish(null);
  };

  const remaining = Math.max(0, filteredDishes.length - visibleCount);

  return (
    <div className="flex flex-col h-full">
      {/* Search and stats */}
      <div className="px-4 pt-2.5 pb-1.5 space-y-2 border-b border-surface-200/50 dark:border-surface-800/50">
        <StatsBar 
          totalDishes={dishes.length} 
          filteredCount={filteredDishes.length}
          priceUnit={priceUnit}
          onPriceUnitChange={(u) => prefsActions.setPref({ priceUnit: u })}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />
      </div>

      {/* Dish grid */}
      <div className="flex-1 overflow-y-auto px-4 pt-3 pb-4">
        {filteredDishes.length === 0 ? (
          <EmptyState hasSearch={!!searchQuery} />
        ) : (
          <>
            {/* Responsive CSS Grid: 1 col < 440px, 2 cols 440-660px, 3 cols > 660px */}
            <div className="grid grid-cols-1 min-[440px]:grid-cols-2 min-[660px]:grid-cols-3 gap-3">
              {visibleDishes.map((dish) => (
                <DishTile
                  key={dish.name}
                  dish={dish}
                  rank={dishRankMap.get(dish.name)}
                  onClick={() => handleDishClick(dish)}
                  overrides={overrides[dish.name] || {}}
                  priceUnit={priceUnit}
                  priorities={priorities || {}}
                />
              ))}
            </div>

            {remaining > 0 && (
              <button
                type="button"
                onClick={() => setVisibleCount((c) => c + pageSize)}
                className="w-full mt-6 py-3 rounded-xl
                           bg-white/80 dark:bg-surface-800/80
                           border border-surface-300/50 dark:border-surface-700/50
                           text-sm font-semibold text-surface-700 dark:text-surface-200
                           hover:bg-white dark:hover:bg-surface-800
                           transition-colors shadow-sm dark:shadow-none"
              >
                Show more ({remaining} left)
              </button>
            )}
          </>
        )}
      </div>
      
      {/* Dish Modal */}
      <DishModal
        dish={selectedDish}
        isOpen={selectedDish !== null}
        onClose={handleCloseModal}
        ingredientIndex={ingredientIndex}
        priorities={priorities}
        isOptimized={isOptimized}
        analysisVariants={analysisVariants}
        priceUnit={priceUnit}
      />
    </div>
  );
}

