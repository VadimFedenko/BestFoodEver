import { useState } from 'react';
import { UtensilsCrossed } from 'lucide-react';
import SettingsButton from './SettingsButton';
import SettingsSheet from './SettingsSheet';
import ThemeToggle from './ThemeToggle';
import { usePrefs, prefsActions } from '../store/prefsStore';

/**
 * Main application header
 * Contains logo, settings, and theme toggle
 */
export default function Header({ 
  isWorstMode,
  onWorstModeToggle,
  isPrioritiesExpanded
}) {
  const isDark = usePrefs((s) => s.prefs.theme) !== 'light';

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  return (
    <header
      className={`
        bg-white dark:bg-surface-800 border-b border-surface-700/50 dark:border-surface-700/50
        ${!isPrioritiesExpanded ? 'hidden min-[480px]:block' : ''}
      `}
    >
      <div className="px-4 py-3 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-food-400 to-food-600 
                          flex items-center justify-center shadow-lg glow-orange">
            <UtensilsCrossed size={22} className="text-white" />
          </div>
          <button
            onClick={onWorstModeToggle}
            className="text-left hover:opacity-80 transition-opacity cursor-pointer min-w-0 flex-1"
            title={isWorstMode ? "Click to switch back to Best Food Ever" : "Click to switch to Worst Food Ever"}
          >
            <h1 className="font-display font-bold text-lg text-surface-900 dark:text-surface-100 truncate">
              {isWorstMode ? 'Worst Food Ever' : 'Best Food Ever'}
            </h1>
            <p className="text-[10px] text-surface-500 dark:text-surface-400 uppercase tracking-wider truncate">
              Personal Food Leaderboard
            </p>
          </button>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          <SettingsButton onClick={() => setIsSettingsOpen(true)} />
          <ThemeToggle 
            isDark={isDark} 
            onToggle={() => prefsActions.setPref({ theme: isDark ? 'light' : 'dark' })} 
          />
        </div>
      </div>

      <SettingsSheet open={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </header>
  );
}



