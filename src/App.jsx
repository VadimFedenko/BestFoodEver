import { useEffect, useMemo, useCallback, useState } from 'react';
import { motion } from 'framer-motion';
import Header from './components/Header';
import PrioritiesPanel from './components/PrioritiesPanel';
import DishList from './components/DishList';
import { 
  buildIngredientIndex,
  analyzeAllDishesVariants,
  scoreAndSortDishes,
} from './lib/RankingEngine';
import { usePrefs, prefsActions } from './store/prefsStore';

// Import the JSON data
// Note: Vite handles JSON imports natively
import dishesData from '../dishes.json';
import ingredientsData from '../ingredients.json';

/**
 * Main Application Component
 */
export default function App() {
  // Preferences (centralized store)
  const selectedZone = usePrefs((s) => s.prefs.selectedZone);
  const overrides = usePrefs((s) => s.prefs.overrides);
  const isOptimized = usePrefs((s) => s.prefs.isOptimized);
  const priceUnit = usePrefs((s) => s.prefs.priceUnit);
  const theme = usePrefs((s) => s.prefs.theme);
  const computationPriorities = usePrefs((s) => s.computationPriorities);
  const isDark = theme !== 'light';
  
  // Note: Modal state is now managed inside DishList component
  
  // Track priorities panel expanded state
  const [isPrioritiesExpanded, setIsPrioritiesExpanded] = useState(true);
  
  // Shady feature: Worst Food Ever mode
  const [isWorstMode, setIsWorstMode] = useState(false);
  

  // Apply theme class to document
  useEffect(() => {
    if (isDark) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [isDark]);

  // Build ingredient index once for O(1) lookups
  const ingredientIndex = useMemo(() => {
    return buildIngredientIndex(ingredientsData);
  }, []);

  // Heavy computation: analyze all dishes ONCE per (zone + overrides).
  // Then materialize the 2x3 variants (timeMode x priceUnit) without re-analyzing.
  const analysisVariants = useMemo(() => {
    return analyzeAllDishesVariants(
      dishesData,
      ingredientIndex,
      selectedZone,
      overrides
    );
  }, [ingredientIndex, selectedZone, overrides]);

  const analysisBase = useMemo(() => {
    const key = `${isOptimized ? 'optimized' : 'normal'}:${priceUnit}`;
    const variant = analysisVariants?.variants?.[key];
    if (!variant) {
      // Fallback with empty byName Map to avoid undefined errors
      return { analyzed: [], datasetStats: {}, byName: new Map() };
    }
    return variant;
  }, [analysisVariants, isOptimized, priceUnit]);

  // Lightweight computation: score and sort (runs when priorities change)
  const rankedDishes = useMemo(() => {
    if (!analysisBase.analyzed.length) return [];
    
    return scoreAndSortDishes(
      analysisBase.analyzed,
      analysisBase.datasetStats,
      computationPriorities
    );
  }, [analysisBase, computationPriorities]);


  // Shady feature: Toggle Worst Food Ever mode and set fixed priority values
  const handleWorstModeToggle = useCallback(() => {
    setIsWorstMode(prev => {
      const newMode = !prev;
      
      // Invert the sign of active priorities and flush so ranking updates immediately.
      prefsActions.updateUiPriorities((current) => {
        const updated = {};
        Object.keys(current || {}).forEach((key) => {
          const value = current[key];
          const absValue = Math.abs(value);
          updated[key] = value === 0 ? 0 : (newMode ? -absValue : absValue);
        });
        return updated;
      });
      prefsActions.flushPriorities();
      
      return newMode;
    });
  }, []);

  return (
    <div className="min-h-screen bg-surface-100 dark:bg-surface-900 pattern-grid transition-colors duration-300">
      {/* Centered container - max width for desktop, full width on mobile */}
      <div className="mx-auto w-full max-w-[960px] flex flex-col h-screen 
                      border-x border-surface-300/50 dark:border-surface-700/50 
                      shadow-2xl shadow-black/10 dark:shadow-black/30 
                      bg-white dark:bg-surface-900 lg:bg-white/50 lg:dark:bg-transparent transition-colors duration-300">
        {/* Sticky Header - highest z-index for dropdowns */}
        <div className="sticky top-0 z-50">
          <Header
            isWorstMode={isWorstMode}
            onWorstModeToggle={handleWorstModeToggle}
            isPrioritiesExpanded={isPrioritiesExpanded}
          />
        </div>

        {/* Sticky Priorities Panel - lower z-index, will stick below header when scrolling */}
        <div
          className={`sticky z-40 ${
            !isPrioritiesExpanded ? 'top-0 min-[480px]:top-[73px]' : 'top-[73px]'
          }`}
        >
          <PrioritiesPanel
            onExpandedChange={setIsPrioritiesExpanded}
          />
        </div>

        {/* Main Content Area */}
        <motion.main 
          className="flex-1 overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <DishList
            dishes={rankedDishes}
            ingredientIndex={ingredientIndex}
            analysisVariants={analysisVariants}
          />
        </motion.main>

        {/* Bottom safe area for mobile (iOS) */}
        <div 
          className="bg-white dark:bg-surface-900 transition-colors duration-300" 
          style={{ height: 'var(--safe-area-inset-bottom)' }}
        />
      </div>
    </div>
  );
}


