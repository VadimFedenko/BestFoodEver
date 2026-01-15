import { Sun, Moon } from '../icons/lucide';
import { m, AnimatePresence } from '../lib/motion';

/**
 * Theme toggle button with smooth sun/moon animation
 */
export default function ThemeToggle({ isDark, onToggle }) {
  return (
    <m.button
      onClick={onToggle}
      className={`
        relative w-10 h-10 rounded-xl flex items-center justify-center
        transition-all duration-300 overflow-hidden
        bg-surface-100/80 hover:bg-surface-200/80 dark:bg-surface-800/80 dark:hover:bg-surface-700/80
        border border-surface-300/50 dark:border-surface-700/50
      `}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      <AnimatePresence mode="wait" initial={false}>
        {isDark ? (
          <m.div
            key="moon"
            initial={{ y: -30, opacity: 0, rotate: -90 }}
            animate={{ y: 0, opacity: 1, rotate: 0 }}
            exit={{ y: 30, opacity: 0, rotate: 90 }}
            transition={{ 
              duration: 0.3, 
              ease: [0.68, -0.55, 0.265, 1.55] 
            }}
          >
            <Moon 
              size={20} 
              className="text-surface-600 dark:text-surface-300"
              strokeWidth={2}
            />
          </m.div>
        ) : (
          <m.div
            key="sun"
            initial={{ y: 30, opacity: 0, rotate: 90 }}
            animate={{ y: 0, opacity: 1, rotate: 0 }}
            exit={{ y: -30, opacity: 0, rotate: -90 }}
            transition={{ 
              duration: 0.3, 
              ease: [0.68, -0.55, 0.265, 1.55] 
            }}
          >
            <Sun 
              size={20} 
              className="text-surface-600 dark:text-surface-300"
              strokeWidth={2}
            />
          </m.div>
        )}
      </AnimatePresence>
      
      {/* Subtle glow effect */}
      <m.div
        className="absolute inset-0 rounded-xl opacity-0 pointer-events-none bg-surface-400/20 dark:bg-surface-500/20"
        animate={{ 
          opacity: [0, 0.3, 0],
          scale: [0.8, 1.2, 0.8]
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
    </m.button>
  );
}







