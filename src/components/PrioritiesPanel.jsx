import { useState, useEffect, useMemo, useCallback } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { ECONOMIC_ZONES } from '../lib/RankingEngine';
import { PRIORITY_CONFIG } from './PrioritiesBoard';
import PrioritiesBoard from './PrioritiesBoard';
import EconomicZoneWidget from './EconomicZoneWidget';
import { usePrioritiesPanelAutoToggle } from '../hooks/usePrioritiesPanelAutoToggle';
import { usePrefs, prefsActions } from '../store/prefsStore';
import ZoneDropdown from './ZoneDropdown';

/**
 * Calculate percentage contribution of each priority
 * Only calculates for priorities with non-zero values to optimize performance
 */
function calculatePercentages(priorities) {
  // Filter only active priorities for faster calculation
  const activeEntries = PRIORITY_CONFIG
    .map(config => ({ key: config.key, value: Math.abs(priorities[config.key] || 0) }))
    .filter(entry => entry.value > 0);
  
  if (activeEntries.length === 0) return {};
  
  const total = activeEntries.reduce((sum, entry) => sum + entry.value, 0);
  if (total === 0) return {};
  
  const percentages = {};
  activeEntries.forEach(({ key, value }) => {
    percentages[key] = Math.round((value / total) * 100);
  });
  
  return percentages;
}

/**
 * Compact priority icon for collapsed state
 */
function CompactPriorityIcon({ config, value, percentage }) {
  const isReversed = value < 0;
  const Icon = isReversed ? config.negativeIcon : config.positiveIcon;
  const label = isReversed ? config.negativeLabel : config.positiveLabel;
  const currentIconColor = isReversed ? config.negativeIconColor : config.iconColor;

  return (
    <div className="flex flex-col items-center gap-0.5">
      <div 
        className={`
          relative w-8 h-6 rounded-lg flex items-center justify-center
          ${isReversed 
            ? 'bg-rose-500/20 border border-rose-500/40' 
            : 'bg-emerald-500/20 border border-emerald-500/40'
          }
        `}
      >
        <Icon size={14} className={currentIconColor} />
        <div 
          className={`
            absolute -top-0.5 -right-0.5 min-w-[16px] h-3 px-0.5
            rounded text-[8px] font-bold flex items-center justify-center
            ${isReversed 
              ? 'bg-rose-500 text-white' 
              : 'bg-emerald-500 text-white'
            }
          `}
        >
          {percentage !== undefined ? `${percentage}%` : Math.abs(value)}
        </div>
      </div>
      <span className="text-[8px] text-white dark:text-white font-medium truncate max-w-[44px] leading-tight">
        {label}
      </span>
    </div>
  );
}

/**
 * Compact zone indicator for collapsed state
 */
function CompactZoneIcon({ zoneId }) {
  const zone = ECONOMIC_ZONES[zoneId];
  return (
    <div className="flex flex-col items-center gap-0.5">
      <div 
        className="w-8 h-6 rounded-lg flex items-center justify-center
          bg-blue-500/20 border border-blue-500/40"
      >
        <span className="text-sm">{zone.emoji}</span>
      </div>
      <span className="text-[8px] text-white dark:text-white font-medium truncate max-w-[40px] leading-tight">
        {zone.name}
      </span>
    </div>
  );
}

/**
 * Compact icons row - reusable component for collapsed view
 */
function CompactIconsRow({ activePriorities, displayed, percentages, selectedZone, className = '' }) {
  return (
    <div className={`flex items-center gap-1.5 overflow-x-auto hide-scrollbar ${className}`}>
      {activePriorities.length > 0 ? (
        activePriorities.map(config => (
          <CompactPriorityIcon
            key={config.key}
            config={config}
            value={displayed[config.key]}
            percentage={percentages[config.key]}
          />
        ))
      ) : (
        <span className="text-xs text-surface-400 italic">No priorities set</span>
      )}
      {selectedZone && <CompactZoneIcon zoneId={selectedZone} />}
    </div>
  );
}

/**
 * Main Priorities Panel Component
 * Optimized with separate hooks and components
 */
export default function PrioritiesPanel({ 
  expandedDish,
  onCollapseExpandedDish,
  onExpandedChange,
}) {
  const displayed = usePrefs((s) => s.uiPriorities);
  const selectedZone = usePrefs((s) => s.prefs.selectedZone);
  const isDark = usePrefs((s) => s.prefs.theme) !== 'light';

  const [isExpanded, setIsExpanded] = useState(true);
  const [isZoneDropdownOpen, setIsZoneDropdownOpen] = useState(false);
  const [zoneAnchorEl, setZoneAnchorEl] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [scrollableElement, setScrollableElement] = useState(null);

  // Find scrollable element - retry when expandedDish changes (DOM might update)
  useEffect(() => {
    const element = document.querySelector('main .overflow-y-auto') ||
                   document.querySelector('.overflow-y-auto');
    if (element) setScrollableElement(element);
  }, [expandedDish]);

  // Handle pointer up for drag end - commit immediately
  useEffect(() => {
    if (!isDragging) return;
    
    const handlePointerUp = () => {
      setIsDragging(false);
      prefsActions.flushPriorities();
    };
    
    // Use capture phase to ensure we catch the event before it bubbles
    window.addEventListener('pointerup', handlePointerUp, { once: true, capture: true });
    return () => {
      // Cleanup is automatic with { once: true }, but we ensure it's removed
      window.removeEventListener('pointerup', handlePointerUp, { capture: true });
    };
  }, [isDragging]);

  // Auto-collapse when dish expands
  useEffect(() => {
    if (expandedDish && isExpanded) {
      setIsExpanded(false);
    }
  }, [expandedDish, isExpanded]);

  // Notify parent of expanded state change
  useEffect(() => {
    onExpandedChange?.(isExpanded);
  }, [isExpanded, onExpandedChange]);

  // Scroll-based auto collapse + pull-down auto expand (no timer pause)
  usePrioritiesPanelAutoToggle({
    scrollableElement,
    isExpanded,
    expandedDish,
    setExpanded: setIsExpanded,
    onCollapseExpandedDish,
  });

  // Dropdown handlers
  const closeDropdown = useCallback(() => {
    setIsZoneDropdownOpen(false);
    setZoneAnchorEl(null);
  }, []);
  
  const handleZoneButtonClick = useCallback((event) => {
    setZoneAnchorEl(event.currentTarget);
    setIsZoneDropdownOpen((wasOpen) => !wasOpen);
  }, []);

  const activePriorities = PRIORITY_CONFIG.filter(
    config => displayed[config.key] !== 0
  );
  const allPrioritiesZero = Object.values(displayed).every(v => v === 0);
  
  const percentages = useMemo(() => calculatePercentages(displayed), [displayed]);

  // Handlers
  const handleDragStart = useCallback(() => {
    if (!isDragging) setIsDragging(true);
  }, [isDragging]);

  const handleSliderChange = useCallback((key, value) => {
    prefsActions.updateUiPriorities((prev) => ({ ...(prev || {}), [key]: value }));
  }, []);
  
  const handleToggleReverse = useCallback((key) => {
    prefsActions.updateUiPriorities((prev) => {
      const currentValue = prev?.[key] ?? 0;
      const newValue = currentValue === 0 ? -5 : -currentValue;
      return { ...(prev || {}), [key]: newValue };
    });
    prefsActions.flushPriorities();
  }, []);

  const handleReset = useCallback(() => {
    const resetPriorities = Object.fromEntries(
      PRIORITY_CONFIG.map(config => [config.key, 0])
    );
    setIsDragging(false);
    prefsActions.setUiPriorities(resetPriorities);
    prefsActions.flushPriorities();
  }, []);

  const handleToggleExpanded = useCallback(() => {
    setIsExpanded(prev => !prev);
  }, []);

  const handleExpand = useCallback(() => {
    setIsExpanded(true);
    if (onCollapseExpandedDish) {
      onCollapseExpandedDish();
    }
  }, [onCollapseExpandedDish]);

  return (
    <div className="bg-white dark:bg-surface-800 border-b border-surface-300/50 dark:border-surface-700/50">
      {/* Header - always visible */}
      <div className="px-4 py-2 relative">
        {/* Keep room for the toggle arrow so content never pushes/overlaps it (esp. >= 480px) */}
        <div className="pr-10 min-[480px]:pr-12">
          {isExpanded ? (
            <div className="grid grid-cols-1 sm:grid-cols-[1fr_260px] gap-4 items-center">
              {/* Left header: priorities */}
              <div className="flex items-center justify-between gap-2">
                <h2 className="font-display font-semibold text-lg text-surface-800 dark:text-surface-100 whitespace-nowrap">
                  My Priorities
                </h2>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={handleReset}
                    className="px-3 py-1.5 text-xs font-medium text-surface-500 dark:text-surface-400 
                               hover:text-surface-700 dark:hover:text-surface-200 
                               hover:bg-surface-200/50 dark:hover:bg-surface-700/50 
                               rounded-lg transition-colors whitespace-nowrap"
                  >
                    Reset
                  </button>
                </div>
              </div>

              {/* Right header: map */}
              <div className="hidden sm:flex items-center justify-between">
                <h2 className="font-display font-semibold text-lg text-surface-800 dark:text-surface-100">
                  Economic Zone
                </h2>
              </div>
            </div>
          ) : (
            <div>
              <button
                onClick={handleExpand}
                className="w-full flex flex-col min-[480px]:flex-row items-start min-[480px]:items-center justify-between gap-2 min-[480px]:gap-3 hover:opacity-80 transition-opacity"
              >
                <div className="flex items-center justify-between gap-3 w-full min-[480px]:w-auto min-[480px]:flex-1 min-[480px]:min-w-0">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <h2 className="font-display font-semibold text-sm min-[480px]:text-lg text-surface-800 dark:text-surface-100 whitespace-nowrap flex-shrink-0">
                      My Priorities
                    </h2>
                    <CompactIconsRow
                      activePriorities={activePriorities}
                      displayed={displayed}
                      percentages={percentages}
                      selectedZone={selectedZone}
                      className="hidden min-[480px]:flex"
                    />
                  </div>
                </div>
                <CompactIconsRow
                  activePriorities={activePriorities}
                  displayed={displayed}
                  percentages={percentages}
                  selectedZone={selectedZone}
                  className="flex min-[480px]:hidden w-full"
                />
              </button>
            </div>
          )}
        </div>

        {/* Persistent toggle arrow: animates + stays fixed in place for >= 480px */}
        <button
          onClick={isExpanded ? handleToggleExpanded : handleExpand}
          className="absolute right-2 top-2 min-[480px]:top-1/2 min-[480px]:-translate-y-1/2 p-2 rounded-lg hover:bg-surface-200/50 dark:hover:bg-surface-700/50 transition-colors z-10"
          aria-label={isExpanded ? 'Collapse panels' : 'Expand panels'}
        >
          <ChevronDown
            size={20}
            className={`text-surface-500 dark:text-surface-300 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}
          />
        </button>
      </div>

      {/* Main content - Smooth grid-based animation */}
      <div
        className="grid overflow-hidden"
        style={{
          gridTemplateRows: isExpanded ? '1fr' : '0fr',
          opacity: isExpanded ? 1 : 0,
          transition: 'grid-template-rows 350ms cubic-bezier(0.25, 0.1, 0.25, 1), opacity 300ms cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        <div className="min-h-0">
          <div className="px-4 pb-2.5">
            <div className="flex flex-col sm:flex-row gap-3 items-stretch">
              <PrioritiesBoard
                priorityConfig={PRIORITY_CONFIG}
                displayed={displayed}
                percentages={percentages}
                allPrioritiesZero={allPrioritiesZero}
                handleSliderChange={handleSliderChange}
                handleDragStart={handleDragStart}
                handleToggleReverse={handleToggleReverse}
                isDark={isDark}
              />
              <EconomicZoneWidget
                selectedZone={selectedZone}
                onZoneChange={(zoneId) => prefsActions.setPref({ selectedZone: zoneId })}
                handleZoneButtonClick={handleZoneButtonClick}
                isZoneDropdownOpen={isZoneDropdownOpen}
              />
            </div>
          </div>
        </div>
      </div>

      <ZoneDropdown
        open={isZoneDropdownOpen}
        anchorEl={zoneAnchorEl}
        selectedZone={selectedZone}
        onSelectZone={(zoneId) => prefsActions.setPref({ selectedZone: zoneId })}
        onClose={closeDropdown}
        clickCapture
      />
    </div>
  );
}
