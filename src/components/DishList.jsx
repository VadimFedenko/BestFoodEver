import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, SortDesc, X } from 'lucide-react';
import DishCard from './DishCard';
import PriceUnitToggle from './PriceUnitToggle';

/**
 * Search and filter bar for the dish list
 */
function SearchBar({ searchQuery, onSearchChange }) {
  return (
    <div className="relative">
      <Search 
        size={18} 
        className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" 
      />
      <input
        type="text"
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder="Search dishes..."
        className="w-full pl-10 pr-10 py-2.5 rounded-xl
                   bg-white/80 dark:bg-surface-800/80 
                   border border-surface-300/50 dark:border-surface-700/50
                   text-surface-800 dark:text-surface-100 
                   placeholder:text-surface-400 dark:placeholder:text-surface-500
                   focus:outline-none focus:border-food-500/50
                   transition-colors shadow-sm dark:shadow-none"
      />
      {searchQuery && (
        <button
          onClick={() => onSearchChange('')}
          className="absolute right-3 top-1/2 -translate-y-1/2 
                     text-surface-400 hover:text-surface-600 dark:hover:text-surface-200"
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
}

/**
 * Stats summary bar
 */
function StatsBar({ totalDishes, filteredCount, allPrioritiesZero = false, priceUnit, onPriceUnitChange }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between px-1 text-sm text-surface-500 dark:text-surface-400 gap-3 min-h-[28px]">
        <div className="flex items-center gap-2">
          <SortDesc size={14} />
          <span>Ranked by your priorities</span>
        </div>
        <PriceUnitToggle 
          priceUnit={priceUnit} 
          onPriceUnitChange={onPriceUnitChange} 
        />
      </div>
      {allPrioritiesZero && (
        <div className="px-1 py-1.5 rounded-lg bg-surface-200/50 dark:bg-surface-800/50 border border-surface-300/30 dark:border-surface-700/30">
          <p className="text-xs text-surface-500 dark:text-surface-400 text-center">
            ⚠️ All priorities are set to 0. Dishes are ranked neutrally. 
            Adjust priorities above to see personalized rankings.
          </p>
        </div>
      )}
    </div>
  );
}

/**
 * Empty state when no dishes match
 */
function EmptyState({ hasSearch }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-center py-12 px-4"
    >
      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-surface-200 dark:bg-surface-800 
                      flex items-center justify-center">
        <Search size={24} className="text-surface-500" />
      </div>
      <h3 className="text-lg font-semibold text-surface-700 dark:text-surface-200 mb-2">
        {hasSearch ? 'No dishes found' : 'No dishes available'}
      </h3>
      <p className="text-surface-500 dark:text-surface-400 text-sm">
        {hasSearch 
          ? 'Try adjusting your search query' 
          : 'Check that your data files are loaded correctly'
        }
      </p>
    </motion.div>
  );
}

/**
 * Main Dish List Component
 * Displays a scrollable, filterable list of ranked dishes
 */
export default function DishList({ 
  dishes, 
  overrides, 
  onOverrideChange, 
  allPrioritiesZero = false, 
  ingredientIndex,
  priceUnit = 'serving',
  onPriceUnitChange,
  priorities = {},
  expandedDish,
  onExpandedDishChange
}) {
  const [searchQuery, setSearchQuery] = useState('');

  // Filter dishes by search query
  const filteredDishes = useMemo(() => {
    if (!searchQuery.trim()) return dishes;
    
    const query = searchQuery.toLowerCase();
    return dishes.filter(dish => 
      dish.name.toLowerCase().includes(query) ||
      dish.description?.toLowerCase().includes(query)
    );
  }, [dishes, searchQuery]);

  const handleToggle = (dishName) => {
    onExpandedDishChange(expandedDish === dishName ? null : dishName);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Search and stats */}
      <div className="px-4 py-3 space-y-3 border-b border-surface-200/50 dark:border-surface-800/50">
        <SearchBar 
          searchQuery={searchQuery} 
          onSearchChange={setSearchQuery} 
        />
        <StatsBar 
          totalDishes={dishes.length} 
          filteredCount={filteredDishes.length}
          allPrioritiesZero={allPrioritiesZero}
          priceUnit={priceUnit}
          onPriceUnitChange={onPriceUnitChange}
        />
      </div>

      {/* Dish list */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {filteredDishes.length === 0 ? (
          <EmptyState hasSearch={!!searchQuery} />
        ) : (
          <motion.div 
            className="space-y-3"
            layout
          >
            <AnimatePresence mode="popLayout">
              {filteredDishes.map((dish, index) => (
                <motion.div
                  key={dish.name}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ 
                    opacity: 1, 
                    y: 0,
                    transition: { delay: index * 0.03 }
                  }}
                  exit={{ opacity: 0, scale: 0.95 }}
                >
                  <DishCard
                    dish={dish}
                    isExpanded={expandedDish === dish.name}
                    onToggle={() => handleToggle(dish.name)}
                    onOverrideChange={onOverrideChange}
                    overrides={overrides[dish.name] || {}}
                    ingredientIndex={ingredientIndex}
                    priceUnit={priceUnit}
                    priorities={priorities}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>
    </div>
  );
}



