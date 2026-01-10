import { useState } from 'react';
import { UtensilsCrossed } from 'lucide-react';
import OptimizedToggle from './OptimizedToggle';
import ThemeToggle from './ThemeToggle';
import ZoneDropdown from './ZoneDropdown';
import { ECONOMIC_ZONES } from '../lib/RankingEngine';
import { usePrefs, prefsActions } from '../store/prefsStore';

/**
 * Main application header
 * Contains logo, zone selector, optimized toggle, and theme toggle
 */
export default function Header({ 
  isWorstMode,
  onWorstModeToggle,
  isPrioritiesExpanded
}) {
  const selectedZone = usePrefs((s) => s.prefs.selectedZone);
  const isOptimized = usePrefs((s) => s.prefs.isOptimized);
  const isDark = usePrefs((s) => s.prefs.theme) !== 'light';

  const [isZoneDropdownOpen, setIsZoneDropdownOpen] = useState(false);
  const [zoneAnchorEl, setZoneAnchorEl] = useState(null);

  const handleZoneButtonClick = (event) => {
    setZoneAnchorEl(event.currentTarget);
    setIsZoneDropdownOpen(prev => !prev);
  };

  const closeDropdown = () => {
    setIsZoneDropdownOpen(false);
    setZoneAnchorEl(null);
  };

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
          {/* Zone selector - shown only on narrow screens (<640px) */}
          {selectedZone && (
            <button
              onClick={handleZoneButtonClick}
              className="sm:hidden w-10 h-10 rounded-xl bg-blue-500/20 dark:bg-blue-500/30 border border-blue-500/40 dark:border-blue-500/50 flex items-center justify-center hover:bg-blue-500/30 dark:hover:bg-blue-500/40 transition-colors"
              aria-label="Select economic zone"
              title={ECONOMIC_ZONES[selectedZone]?.name}
            >
              <span className="text-lg">{ECONOMIC_ZONES[selectedZone]?.emoji}</span>
            </button>
          )}
          <OptimizedToggle 
            isOptimized={isOptimized} 
            onToggle={() => prefsActions.setPref({ isOptimized: !isOptimized })} 
          />
          <ThemeToggle 
            isDark={isDark} 
            onToggle={() => prefsActions.setPref({ theme: isDark ? 'light' : 'dark' })} 
          />
        </div>
      </div>

      {/* Zone dropdown portal - shown only on narrow screens */}
      <ZoneDropdown
        open={isZoneDropdownOpen && !!selectedZone}
        anchorEl={zoneAnchorEl}
        selectedZone={selectedZone}
        onSelectZone={(zoneId) => prefsActions.setPref({ selectedZone: zoneId })}
        onClose={closeDropdown}
        width={280}
        narrow={{ breakpoint: 640, alignRightPadding: 16, minLeftPadding: 16 }}
        className="fixed bg-white dark:bg-surface-800 rounded-lg border border-surface-300 dark:border-surface-700 shadow-lg z-[100] max-h-64 overflow-y-auto min-w-[240px]"
      />
    </header>
  );
}



