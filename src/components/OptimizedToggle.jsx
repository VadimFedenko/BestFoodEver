import { motion } from 'framer-motion';
import { Zap, ZapOff } from 'lucide-react';

/**
 * Optimized Cooking Toggle Component
 * Switch between normal and optimized cooking times
 */
export default function OptimizedToggle({ isOptimized, onToggle }) {
  return (
    <button
      onClick={onToggle}
      className={`
        flex items-center gap-2 px-3 py-2 rounded-lg
        border transition-all duration-200
        ${isOptimized 
          ? 'bg-food-500/20 border-food-500/50 text-food-600 dark:text-food-300' 
          : 'bg-surface-100/80 dark:bg-surface-800/80 border-surface-300/50 dark:border-surface-700/50 text-surface-500 dark:text-surface-400 hover:border-surface-400 dark:hover:border-surface-600'
        }
      `}
    >
      <motion.div
        initial={false}
        animate={{ rotate: isOptimized ? 0 : 180 }}
        transition={{ duration: 0.3 }}
      >
        {isOptimized ? (
          <Zap size={16} className="text-food-400" />
        ) : (
          <ZapOff size={16} />
        )}
      </motion.div>
      <span className="text-sm font-medium hidden sm:inline">
        {isOptimized ? 'Time Optimized' : 'Normal Cooking'}
      </span>
    </button>
  );
}






