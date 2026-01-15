import { List, LayoutGrid } from '../icons/lucide';
import { m } from '../lib/motion';

/**
 * Toggle button for switching between list and grid view modes
 */
export default function ViewModeToggle({ viewMode, onToggle }) {
  const isGrid = viewMode === 'grid';
  
  return (
    <m.button
      type="button"
      onClick={onToggle}
      className={`
        relative w-10 h-10 rounded-xl flex items-center justify-center
        transition-all duration-300 overflow-hidden
        bg-surface-100/80 hover:bg-surface-200/80 dark:bg-surface-800/80 dark:hover:bg-surface-700/80
        border border-surface-300/50 dark:border-surface-700/50
      `}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      aria-label={isGrid ? "Switch to list view" : "Switch to grid view"}
      title={isGrid ? "Switch to list view" : "Switch to grid view"}
    >
      <m.div
        key={viewMode}
        initial={{ scale: 0, rotate: -90 }}
        animate={{ scale: 1, rotate: 0 }}
        exit={{ scale: 0, rotate: 90 }}
        transition={{ duration: 0.2, ease: [0.68, -0.55, 0.265, 1.55] }}
      >
        {isGrid ? (
          <LayoutGrid 
            size={20} 
            className="text-food-500 dark:text-food-400"
            strokeWidth={2}
          />
        ) : (
          <List 
            size={20} 
            className="text-surface-600 dark:text-surface-300"
            strokeWidth={2}
          />
        )}
      </m.div>
      
      {/* Subtle glow effect when in grid mode */}
      {isGrid && (
        <m.div
          className="absolute inset-0 rounded-xl pointer-events-none bg-food-400/10 dark:bg-food-500/10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        />
      )}
    </m.button>
  );
}

