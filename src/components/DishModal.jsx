import { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Clock,
  DollarSign,
  Utensils,
  Heart,
  Flame,
  Leaf,
  FileText,
  Map as MapIcon,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Info,
  AlertTriangle,
  Zap,
  Timer,
  ArrowDown,
  Skull,
  Frown,
  Edit3,
  Check,
} from 'lucide-react';
import { useIsMobile } from '../lib/useIsMobile';
import { getScoreColor, formatTime, getHealthColor, getEthicsColor, getCookingLabel, getCookingEffect, getPriceColor } from './dishCardUtils';
import { prefsActions, usePrefs } from '../store/prefsStore';
import { ECONOMIC_ZONES, calculateDishCost, getCookingCoef, normalizeIngredientName, getPassiveTimePenalty } from '../lib/RankingEngine';
import EconomicZonesSvgMap from './EconomicZonesSvgMap';

// Slide overlay colors matching the hero header
const SLIDE_OVERLAY_COLORS = [
  'rgba(0,0,0,0.85)', // Overview
  'rgba(6,78,59,0.85)', // Index Map
  'rgba(22,78,99,0.85)', // Time
  'rgba(136,19,55,0.85)', // Health
  'rgba(63,98,18,0.85)', // Ethics
];

/**
 * Horizontal score slider component for editing mode
 */
function ScoreSlider({ 
  label, 
  icon: Icon, 
  value, 
  onChange, 
  isModified = false,
  color = 'food',
  isDark = false,
}) {
  const percentage = ((value) / 10) * 100;
  
  const gradientColors = {
    food: isDark ? 'from-food-600 to-food-500' : 'from-food-500 to-food-400',
    cyan: isDark ? 'from-cyan-600 to-cyan-500' : 'from-cyan-500 to-cyan-400',
    emerald: isDark ? 'from-emerald-600 to-emerald-500' : 'from-emerald-500 to-emerald-400',
    rose: isDark ? 'from-rose-600 to-rose-500' : 'from-rose-500 to-rose-400',
    amber: isDark ? 'from-amber-600 to-amber-500' : 'from-amber-500 to-amber-400',
    purple: isDark ? 'from-purple-600 to-purple-500' : 'from-purple-500 to-purple-400',
    lime: isDark ? 'from-lime-600 to-lime-500' : 'from-lime-500 to-lime-400',
  };
  
  const gradientColor = gradientColors[color] || gradientColors.food;
  
  return (
    <div className="flex items-center gap-2 py-1.5">
      <div className="flex items-center gap-1.5 w-16 sm:w-20 flex-shrink-0">
        <Icon size={14} className={isModified ? 'text-amber-500' : 'text-surface-500 dark:text-surface-400'} />
        <span className={`text-xs font-medium truncate ${isModified ? 'text-amber-600 dark:text-amber-400' : 'text-surface-600 dark:text-surface-300'}`}>
          {label}
        </span>
      </div>
      
      <div className="flex-1 relative h-5 flex items-center">
        <div className="absolute inset-x-0 h-1.5 rounded-full bg-surface-300 dark:bg-surface-700 overflow-hidden">
          <motion.div
            className={`absolute left-0 top-0 bottom-0 bg-gradient-to-r ${isModified ? 'from-amber-500 to-amber-400' : gradientColor}`}
            initial={false}
            animate={{ width: `${percentage}%` }}
            transition={{ type: 'tween', duration: 0.1 }}
          />
        </div>
        
        <input
          type="range"
          min={0}
          max={10}
          step={0.1}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="absolute inset-0 w-full opacity-0 cursor-pointer z-10"
        />
        
        <motion.div
          className={`absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full shadow-md pointer-events-none border-2
            ${isModified ? 'bg-amber-500 border-white' : `bg-gradient-to-b ${gradientColor} border-white/90`}`}
          initial={false}
          animate={{ left: `calc(${percentage}% - 8px)` }}
          transition={{ type: 'tween', duration: 0.1 }}
        />
      </div>
      
      <div className={`w-10 text-right font-mono text-xs font-medium ${isModified ? 'text-amber-600 dark:text-amber-400' : 'text-surface-700 dark:text-surface-200'}`}>
        {value.toFixed(1)}
      </div>
    </div>
  );
}

/**
 * Score bar for display mode
 */
function ScoreBar({ label, icon: Icon, value, maxValue = 10, color, isModified = false }) {
  const percentage = (value / maxValue) * 100;
  
  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1.5 w-16 sm:w-20 flex-shrink-0">
        <Icon size={14} className={isModified ? 'text-amber-500' : 'text-surface-500 dark:text-surface-400'} />
        <span className={`text-xs ${isModified ? 'text-amber-600 dark:text-amber-400' : 'text-surface-500 dark:text-surface-400'}`}>{label}</span>
      </div>
      <div className="flex-1 h-1.5 bg-surface-300 dark:bg-surface-700 rounded-full overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${isModified ? 'bg-amber-500' : color}`}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>
      <span className={`text-xs font-mono w-8 text-right ${isModified ? 'text-amber-600 dark:text-amber-400' : 'text-surface-600 dark:text-surface-300'}`}>
        {value.toFixed(1)}
      </span>
    </div>
  );
}

/**
 * Editable Score Breakdown component with Edit/Save/Cancel
 */
function EditableScoreBreakdown({ 
  dish, 
  priorities,
  userRatings = {},
  onRatingChange,
  onResetAll,
  isDark = false,
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [draftRatings, setDraftRatings] = useState({});
  
  const metrics = [
    { key: 'taste', label: 'Taste', icon: Utensils, color: 'bg-food-500', sliderColor: 'food', baseValue: dish?.taste ?? 5 },
    { key: 'health', label: 'Health', icon: Heart, color: 'bg-red-500', sliderColor: 'emerald', baseValue: dish?.health ?? 5 },
    { key: 'speed', label: 'Speed', icon: Clock, color: 'bg-cyan-500', sliderColor: 'cyan', baseValue: dish?.normalizedMetrics?.speed ?? 5 },
    { key: 'cheapness', label: 'Budget', icon: DollarSign, color: 'bg-emerald-400', sliderColor: 'lime', baseValue: dish?.normalizedMetrics?.cheapness ?? 5 },
    { key: 'lowCalorie', label: 'Low-Cal', icon: Flame, color: 'bg-purple-500', sliderColor: 'purple', baseValue: dish?.normalizedMetrics?.lowCalorie ?? 5 },
    { key: 'ethics', label: 'Ethics', icon: Leaf, color: 'bg-lime-500', sliderColor: 'amber', baseValue: dish?.ethics ?? 5 },
  ];
  
  // Filter to active metrics
  const activeMetrics = metrics.filter(m => priorities && priorities[m.key] !== undefined && priorities[m.key] !== 0);
  
  const hasModifications = Object.keys(userRatings).length > 0;
  
  const handleStartEdit = () => {
    // Initialize draft with current values
    const draft = {};
    activeMetrics.forEach(m => {
      draft[m.key] = userRatings[m.key] !== undefined ? userRatings[m.key] : m.baseValue;
    });
    setDraftRatings(draft);
    setIsEditing(true);
  };
  
  const handleSave = () => {
    // Save all draft ratings
    Object.entries(draftRatings).forEach(([key, value]) => {
      const metric = metrics.find(m => m.key === key);
      if (metric && Math.abs(value - metric.baseValue) > 0.05) {
        onRatingChange(key, value);
      } else if (metric) {
        // Reset if close to base value
        onRatingChange(key, null);
      }
    });
    setIsEditing(false);
  };
  
  const handleCancel = () => {
    setDraftRatings({});
    setIsEditing(false);
  };
  
  const handleDraftChange = (key, value) => {
    setDraftRatings(prev => ({ ...prev, [key]: value }));
  };
  
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-semibold text-surface-700 dark:text-surface-200">
          Score Breakdown
        </h4>
        <div className="flex items-center gap-2">
          {hasModifications && !isEditing && (
            <button
              onClick={onResetAll}
              className="flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium
                         text-amber-600 dark:text-amber-400 bg-amber-500/10 hover:bg-amber-500/20"
            >
              <RotateCcw size={10} />
              Reset
            </button>
          )}
          {isEditing ? (
            <>
              <button
                onClick={handleCancel}
                className="flex items-center gap-1 px-2 py-1 rounded text-xs font-medium
                           text-surface-600 dark:text-surface-400 bg-surface-200 dark:bg-surface-700 hover:bg-surface-300 dark:hover:bg-surface-600"
              >
                <X size={12} />
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="flex items-center gap-1 px-2 py-1 rounded text-xs font-medium
                           text-white bg-food-500 hover:bg-food-600"
              >
                <Check size={12} />
                Save
              </button>
            </>
          ) : (
            <button
              onClick={handleStartEdit}
              className="flex items-center gap-1 px-2 py-1 rounded text-xs font-medium
                         text-food-600 dark:text-food-400 bg-food-500/10 hover:bg-food-500/20"
            >
              <Edit3 size={12} />
              Edit
            </button>
          )}
        </div>
      </div>
      
      <div className="space-y-1 bg-surface-100/80 dark:bg-surface-800/80 rounded-lg p-3">
        {isEditing ? (
          <>
            {activeMetrics.map(metric => (
              <ScoreSlider
                key={metric.key}
                label={metric.label}
                icon={metric.icon}
                value={draftRatings[metric.key] ?? metric.baseValue}
                onChange={(val) => handleDraftChange(metric.key, val)}
                isModified={Math.abs((draftRatings[metric.key] ?? metric.baseValue) - metric.baseValue) > 0.05}
                color={metric.sliderColor}
                isDark={isDark}
              />
            ))}
            <p className="text-[10px] text-surface-500 dark:text-surface-400 mt-2 pt-2 border-t border-surface-200 dark:border-surface-700">
              Adjust scores to your liking. Changes are stored locally on your device.
            </p>
          </>
        ) : (
          activeMetrics.map(metric => {
            const userValue = userRatings[metric.key];
            const isModified = userValue !== undefined;
            const displayValue = isModified ? userValue : metric.baseValue;
            
            return (
              <ScoreBar 
                key={metric.key}
                label={metric.label}
                icon={metric.icon}
                value={Math.min(10, Math.max(0, displayValue))}
                color={metric.color}
                isModified={isModified}
              />
            );
          })
        )}
      </div>
    </div>
  );
}

/**
 * Slide navigation tabs with auto-scroll to active tab
 * Completely reworked for mobile - better touch interactions
 */
function SlideNavigation({ slides, currentSlide, onSlideChange, isMobile }) {
  // Get the overlay color for the current slide
  const getSlideColor = (idx) => SLIDE_OVERLAY_COLORS[idx] || SLIDE_OVERLAY_COLORS[0];
  const containerRef = useRef(null);
  const buttonRefs = useRef([]);
  
  // Improved auto-scroll for mobile with better centering
  useEffect(() => {
    if (buttonRefs.current[currentSlide] && containerRef.current) {
      const button = buttonRefs.current[currentSlide];
      const container = containerRef.current;
      const buttonLeft = button.offsetLeft;
      const buttonWidth = button.offsetWidth;
      const containerWidth = container.offsetWidth;
      const scrollLeft = container.scrollLeft;
      
      // Center the active button on mobile, otherwise just scroll into view
      if (isMobile) {
        const targetScroll = buttonLeft - (containerWidth / 2) + (buttonWidth / 2);
        container.scrollTo({ left: Math.max(0, targetScroll), behavior: 'smooth' });
      } else {
        // Desktop: scroll into view with padding
        if (buttonLeft < scrollLeft) {
          container.scrollTo({ left: buttonLeft - 8, behavior: 'smooth' });
        } else if (buttonLeft + buttonWidth > scrollLeft + containerWidth) {
          container.scrollTo({ left: buttonLeft + buttonWidth - containerWidth + 8, behavior: 'smooth' });
        }
      }
    }
  }, [currentSlide, isMobile]);
  
  if (isMobile) {
    // Mobile: Full-width scrollable tabs with snap scrolling
    return (
      <div 
        ref={containerRef}
        className="flex items-center gap-1.5 overflow-x-auto py-2 px-2 snap-x snap-mandatory hide-scrollbar"
        style={{ 
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {slides.map((slide, idx) => {
          const Icon = slide.icon;
          const isActive = idx === currentSlide;
          const slideColor = getSlideColor(idx);
          
          return (
            <button
              key={slide.id}
              ref={(el) => { buttonRefs.current[idx] = el; }}
              onClick={() => onSlideChange(idx)}
              className={`
                flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
                transition-all duration-200 flex-shrink-0 snap-start
                min-w-[90px]
                ${isActive 
                  ? 'text-white shadow-md scale-105' 
                  : 'bg-surface-200/50 dark:bg-surface-700/50 text-surface-600 dark:text-surface-400 active:bg-surface-300 dark:active:bg-surface-600 active:scale-95'
                }
              `}
              style={{ 
                touchAction: 'manipulation',
                ...(isActive && { backgroundColor: slideColor })
              }}
            >
              <Icon size={14} />
              <span>{slide.label}</span>
            </button>
          );
        })}
      </div>
    );
  }
  
  // Desktop: Original design but refined
  return (
    <div 
      ref={containerRef}
      className="flex items-center gap-1 overflow-x-auto py-1 px-1"
      style={{ scrollbarWidth: 'thin', msOverflowStyle: '-ms-autohiding-scrollbar' }}
    >
      {slides.map((slide, idx) => {
        const Icon = slide.icon;
        const isActive = idx === currentSlide;
        const slideColor = getSlideColor(idx);
        
        return (
          <button
            key={slide.id}
            ref={(el) => { buttonRefs.current[idx] = el; }}
            onClick={() => onSlideChange(idx)}
            className={`
              flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
              transition-all duration-200 flex-shrink-0 whitespace-nowrap
              ${isActive 
                ? 'text-white border border-white/20' 
                : 'text-surface-500 dark:text-surface-400 hover:text-surface-700 dark:hover:text-surface-200 hover:bg-surface-200/30 dark:hover:bg-surface-700/30'
              }
            `}
            style={isActive ? { backgroundColor: slideColor } : {}}
          >
            <Icon size={14} />
            <span>{slide.label}</span>
          </button>
        );
      })}
    </div>
  );
}

/**
 * Hero image header with gradient overlay
 */
function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function HeroHeader({
  dish,
  currentSlide,
  onClose,
  isMobile,
  heroHeightPx,
  heroCollapsedPx,
  heroExpandedPx,
  heroMode,
  setHeroMode,
  setHeroHeightPx,
}) {
  const imageSrc = dish?.originalDish?.img_m || dish?.img_m;
  const scoreColors = getScoreColor(dish?.score ?? 50);

  const dragRef = useRef({
    startY: 0,
    startHeight: 0,
    startMode: heroMode,
    dragging: false,
  });

  const isExpanded = heroMode === 'expanded';

  const onHeaderTouchStart = (e) => {
    if (!isMobile) return;
    const t = e.targetTouches?.[0];
    if (!t) return;

    dragRef.current = {
      startY: t.clientY,
      startHeight: heroHeightPx,
      startMode: heroMode,
      dragging: true,
    };
  };

  const onHeaderTouchMove = (e) => {
    if (!isMobile) return;
    if (!dragRef.current.dragging) return;
    const t = e.targetTouches?.[0];
    if (!t) return;

    // Prevent the modal body from scrolling while resizing the header
    e.preventDefault?.();

    const dy = t.clientY - dragRef.current.startY;
    const next = clamp(dragRef.current.startHeight + dy, heroCollapsedPx, heroExpandedPx);
    setHeroHeightPx(next);
  };

  const onHeaderTouchEnd = () => {
    if (!isMobile) return;
    if (!dragRef.current.dragging) return;

    const dy = heroHeightPx - dragRef.current.startHeight;
    const threshold = 60;

    // Swipe down: expand
    if (dy > threshold) {
      setHeroMode('expanded');
      setHeroHeightPx(heroExpandedPx);
      dragRef.current.dragging = false;
      return;
    }

    // Swipe up: collapse (from expanded) OR close (from collapsed)
    if (dy < -threshold) {
      if (dragRef.current.startMode === 'expanded') {
        setHeroMode('collapsed');
        setHeroHeightPx(heroCollapsedPx);
      } else {
        onClose?.();
      }
      dragRef.current.dragging = false;
      return;
    }

    // Otherwise: snap to nearest
    const mid = (heroCollapsedPx + heroExpandedPx) / 2;
    if (heroHeightPx >= mid) {
      setHeroMode('expanded');
      setHeroHeightPx(heroExpandedPx);
    } else {
      setHeroMode('collapsed');
      setHeroHeightPx(heroCollapsedPx);
    }
    dragRef.current.dragging = false;
  };
  
  return (
    <div
      className={`relative overflow-hidden rounded-t-xl flex-shrink-0 ${!isMobile ? 'h-48' : ''}`}
      style={{
        height: isMobile ? `${heroHeightPx}px` : undefined,
        touchAction: isMobile ? 'none' : undefined,
      }}
      onTouchStart={onHeaderTouchStart}
      onTouchMove={onHeaderTouchMove}
      onTouchEnd={onHeaderTouchEnd}
      onTouchCancel={onHeaderTouchEnd}
    >
      {imageSrc ? (
        <motion.img
          src={imageSrc}
          alt={dish?.name}
          className={`absolute inset-0 w-full h-full ${isExpanded ? 'object-contain bg-black/40' : 'object-cover'}`}
          loading="eager"
          initial={{ scale: 1.1 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.5 }}
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-surface-700 to-surface-900" />
      )}
      
      <motion.div
        className="absolute inset-0"
        initial={false}
        animate={{ 
          background: `linear-gradient(to top, ${SLIDE_OVERLAY_COLORS[currentSlide] || SLIDE_OVERLAY_COLORS[0]}, rgba(0,0,0,0.3), transparent)`
        }}
        transition={{ duration: 0.4 }}
      />
      
      <button
        onClick={onClose}
        className="absolute top-3 right-3 z-10 p-2 rounded-full bg-black/30 backdrop-blur-sm text-white/90 hover:bg-black/50 transition-colors"
      >
        <X size={20} />
      </button>

      {isMobile && (
        <div className="absolute top-2 left-0 right-0 z-10 flex justify-center pointer-events-none">
          <div className="w-10 h-1 rounded-full bg-white/35 backdrop-blur-sm" />
        </div>
      )}
      
      <div className="absolute bottom-0 left-0 right-0 p-4">
        <div className="flex items-end justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h2 className="font-display font-bold text-lg sm:text-xl text-white truncate drop-shadow-lg">
              {dish?.name}
            </h2>
            <p
              className={[
                'text-white/80 text-xs sm:text-sm mt-0.5 drop-shadow leading-snug',
                isExpanded ? 'line-clamp-none max-h-40 overflow-auto pr-1 custom-scrollbar' : 'line-clamp-1',
              ].join(' ')}
            >
              {dish?.description || dish?.originalDish?.desc}
            </p>
          </div>
          
          <div className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center ${scoreColors.bg} ${scoreColors.glow} shadow-lg`}>
            <span className="text-lg font-display font-bold text-white">{dish?.score ?? 0}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Main Dish Modal Component
 */
export default function DishModal({ 
  dish, 
  isOpen, 
  onClose, 
  ingredientIndex,
  priorities = {},
  isOptimized = false,
  analysisVariants = null,
  priceUnit = 'serving',
}) {
  const isMobile = useIsMobile();
  const theme = usePrefs((s) => s.prefs.theme);
  const isDark = theme !== 'light';
  const overrides = usePrefs((s) => s.prefs.overrides);
  const userSelectedZone = usePrefs((s) => s.prefs.selectedZone);
  
  const [currentSlide, setCurrentSlide] = useState(0);

  // Mobile-only: resizable hero header (collapsed/expanded)
  const heroCollapsedPx = 160; // Tailwind h-40
  const [heroExpandedPx, setHeroExpandedPx] = useState(460);
  const [heroHeightPx, setHeroHeightPx] = useState(heroCollapsedPx);
  const [heroMode, setHeroMode] = useState('collapsed'); // 'collapsed' | 'expanded'
  
  // Get user ratings from overrides - now ALL metrics use absolute values (0-10)
  const userRatings = useMemo(() => {
    const dishOverrides = overrides?.[dish?.name] || {};
    const ratings = {};
    
    // All metrics now use absolute score values (0-10)
    if (dishOverrides.tasteScore !== undefined) {
      ratings.taste = Math.min(10, Math.max(0, dishOverrides.tasteScore));
    }
    if (dishOverrides.healthScore !== undefined) {
      ratings.health = Math.min(10, Math.max(0, dishOverrides.healthScore));
    }
    if (dishOverrides.ethicsScore !== undefined) {
      ratings.ethics = Math.min(10, Math.max(0, dishOverrides.ethicsScore));
    }
    if (dishOverrides.speedScore !== undefined) {
      ratings.speed = Math.min(10, Math.max(0, dishOverrides.speedScore));
    }
    if (dishOverrides.cheapnessScore !== undefined) {
      ratings.cheapness = Math.min(10, Math.max(0, dishOverrides.cheapnessScore));
    }
    if (dishOverrides.lowCalorieScore !== undefined) {
      ratings.lowCalorie = Math.min(10, Math.max(0, dishOverrides.lowCalorieScore));
    }
    
    return ratings;
  }, [overrides, dish]);
  
  const handleRatingChange = useCallback((key, value) => {
    if (!dish?.name) return;
    
    const current = overrides?.[dish.name] || {};
    const newOverrides = { ...current };
    
    // Map keys to override keys (all use Score suffix)
    const overrideKeys = {
      taste: 'tasteScore',
      health: 'healthScore',
      ethics: 'ethicsScore',
      speed: 'speedScore',
      cheapness: 'cheapnessScore',
      lowCalorie: 'lowCalorieScore',
    };
    
    const overrideKey = overrideKeys[key];
    if (!overrideKey) return;
    
    if (value === null) {
      // Remove override
      delete newOverrides[overrideKey];
    } else {
      // Store absolute value (0-10)
      newOverrides[overrideKey] = Math.min(10, Math.max(0, value));
    }
    
    prefsActions.setOverrideForDish(dish.name, newOverrides);
  }, [dish, overrides]);
  
  const handleResetAll = useCallback(() => {
    if (!dish?.name) return;
    prefsActions.setOverrideForDish(dish.name, {});
  }, [dish]);
  
  // Slides - removed "Scores" slide
  const slides = [
    { id: 'overview', label: 'Overview', icon: FileText },
    { id: 'index-map', label: 'Index Map', icon: MapIcon },
    { id: 'time', label: 'Time', icon: Clock },
    { id: 'health', label: 'Health', icon: Heart },
    { id: 'ethics', label: 'Ethics', icon: Leaf },
  ];
  
  useEffect(() => {
    if (isOpen) setCurrentSlide(0);
  }, [isOpen]);

  useEffect(() => {
    if (!isMobile) return;
    const calcExpanded = () => {
      const h = typeof window !== 'undefined' ? window.innerHeight : 740;
      // ~62% of viewport, but keep sane bounds for tiny/huge screens
      return clamp(Math.round(h * 0.62), 320, 560);
    };

    const apply = () => {
      const next = calcExpanded();
      setHeroExpandedPx(next);
      setHeroHeightPx((prev) => {
        if (heroMode === 'expanded') return next;
        return clamp(prev, heroCollapsedPx, next);
      });
    };

    apply();
    window.addEventListener('resize', apply);
    return () => window.removeEventListener('resize', apply);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMobile, heroMode]);

  useEffect(() => {
    if (!isOpen) return;
    // Reset to collapsed each time the modal opens (mobile)
    if (isMobile) {
      setHeroMode('collapsed');
      setHeroHeightPx(heroCollapsedPx);
    }
  }, [isOpen, isMobile]);
  
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      document.body.style.overflowX = 'hidden';
    } else {
      document.body.style.overflow = '';
      document.body.style.overflowX = '';
    }
    return () => { 
      document.body.style.overflow = '';
      document.body.style.overflowX = '';
    };
  }, [isOpen]);
  
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
      if (e.key === 'ArrowRight') setCurrentSlide((prev) => (prev + 1) % slides.length);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, slides.length]);
  
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const minSwipeDistance = 50;

  const onTouchStart = (e) => { setTouchEnd(null); setTouchStart(e.targetTouches[0].clientX); };
  const onTouchMove = (e) => { setTouchEnd(e.targetTouches[0].clientX); };
  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    if (distance > minSwipeDistance) setCurrentSlide((prev) => (prev + 1) % slides.length);
    if (distance < -minSwipeDistance) setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };
  
  const ingredients = dish?.originalDish?.ingredients || [];
  const unavailableIngredients = dish?.unavailableIngredients || [];
  const missingIngredients = dish?.missingIngredients || [];
  const missingPrices = dish?.missingPrices || [];
  
  if (!dish) return null;
  
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className={`fixed inset-0 z-50 backdrop-blur-sm ${
              isMobile && isDark 
                ? 'bg-white/5' 
                : 'bg-black/60'
            }`}
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, x: isMobile ? 0 : '-50%', y: isMobile ? 0 : '-50%' }}
            animate={{ opacity: 1, scale: 1, x: isMobile ? 0 : '-50%', y: isMobile ? 0 : '-50%' }}
            exit={{ opacity: 0, scale: 0.95, x: isMobile ? 0 : '-50%', y: isMobile ? 0 : '-50%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className={`
              fixed z-50 bg-white dark:bg-surface-900 shadow-2xl overflow-hidden flex flex-col
              ${isMobile 
                ? 'inset-x-2 top-4 bottom-4 rounded-xl' 
                : 'left-1/2 top-1/2 w-full max-w-2xl h-[56vh] rounded-xl'
              }
            `}
          >
            <HeroHeader 
              dish={dish}
              currentSlide={currentSlide}
              onClose={onClose}
              isMobile={isMobile}
              heroHeightPx={isMobile ? heroHeightPx : undefined}
              heroCollapsedPx={heroCollapsedPx}
              heroExpandedPx={heroExpandedPx}
              heroMode={heroMode}
              setHeroMode={setHeroMode}
              setHeroHeightPx={setHeroHeightPx}
            />
            
            <div className="border-b border-surface-200 dark:border-surface-700 flex-shrink-0">
              {isMobile ? (
                // Mobile: Tabs only, no arrows (swipe gestures handle navigation)
                <SlideNavigation 
                  slides={slides} 
                  currentSlide={currentSlide} 
                  onSlideChange={setCurrentSlide}
                  isMobile={isMobile}
                />
              ) : (
                // Desktop: Tabs with arrows
                <div className="flex items-center justify-between px-2">
                  <button
                    onClick={() => setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length)}
                    className="p-1.5 rounded-lg text-surface-500 hover:bg-surface-200/50 dark:hover:bg-surface-700/50 flex-shrink-0 transition-colors"
                    aria-label="Previous slide"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  
                  <SlideNavigation 
                    slides={slides} 
                    currentSlide={currentSlide} 
                    onSlideChange={setCurrentSlide}
                    isMobile={isMobile}
                  />
                  
                  <button
                    onClick={() => setCurrentSlide((prev) => (prev + 1) % slides.length)}
                    className="p-1.5 rounded-lg text-surface-500 hover:bg-surface-200/50 dark:hover:bg-surface-700/50 flex-shrink-0 transition-colors"
                    aria-label="Next slide"
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>
              )}
            </div>
            
            <div 
              className="flex-1 overflow-y-auto overflow-x-hidden p-4"
              onTouchStart={onTouchStart}
              onTouchMove={onTouchMove}
              onTouchEnd={onTouchEnd}
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentSlide}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  {currentSlide === 0 && (
                    <OverviewSlideContent
                      dish={dish}
                      ingredients={ingredients}
                      unavailableIngredients={unavailableIngredients}
                      missingIngredients={missingIngredients}
                      missingPrices={missingPrices}
                      priorities={priorities}
                      userRatings={userRatings}
                      onRatingChange={handleRatingChange}
                      onResetAll={handleResetAll}
                      isDark={isDark}
                      priceUnit={priceUnit}
                    />
                  )}
                  {currentSlide === 1 && (
                    <IndexMapSlideContent dish={dish} ingredientIndex={ingredientIndex} isMobile={isMobile} priceUnit={priceUnit} defaultSelectedZone={userSelectedZone} />
                  )}
                  {currentSlide === 2 && (
                    <TimeSlideContent dish={dish} isOptimized={isOptimized} userRatings={userRatings} />
                  )}
                  {currentSlide === 3 && (
                    <HealthSlideContent dish={dish} ingredients={ingredients} ingredientIndex={ingredientIndex} />
                  )}
                  {currentSlide === 4 && (
                    <EthicsSlideContent dish={dish} ingredients={ingredients} ingredientIndex={ingredientIndex} />
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
            
            <div className="flex justify-center gap-2 py-2 border-t border-surface-200/50 dark:border-surface-700/50 flex-shrink-0">
              {slides.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentSlide(idx)}
                  className={`h-1.5 rounded-full transition-all ${idx === currentSlide ? 'bg-food-500 w-5' : 'bg-surface-400 dark:bg-surface-600 w-1.5'}`}
                />
              ))}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ====== Slide Content Components ======

function OverviewSlideContent({ 
  dish, ingredients, unavailableIngredients, missingIngredients, missingPrices, priorities,
  userRatings, onRatingChange, onResetAll, isDark, priceUnit,
}) {
  const hasUnavailableIngredients = unavailableIngredients?.length > 0;
  const hasDataWarnings = missingIngredients?.length > 0 || missingPrices?.length > 0;

  // Get price unit label
  const priceUnitLabel = priceUnit === 'per1kg' ? '/kg' : priceUnit === 'per1000kcal' ? '/1000kcal' : '/serving';

  return (
    <div className="space-y-3">
      {hasUnavailableIngredients && (
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-2.5">
          <div className="flex items-center gap-2 text-blue-600 dark:text-blue-300 mb-1">
            <Info size={12} />
            <span className="text-xs font-semibold">Cannot be prepared in your region</span>
          </div>
          <div className="text-xs text-surface-600 dark:text-surface-300">
            {unavailableIngredients.map((ing, idx) => (
              <span key={idx} className="font-mono">{ing.name} ({ing.grams}g){idx < unavailableIngredients.length - 1 ? ', ' : ''}</span>
            ))}
          </div>
        </div>
      )}

      {hasDataWarnings && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-2.5">
          <div className="flex items-center gap-2 text-amber-600 dark:text-amber-300 mb-1">
            <AlertTriangle size={12} />
            <span className="text-xs font-semibold">Data warnings</span>
          </div>
          <div className="text-xs text-surface-600 dark:text-surface-300">
            {missingIngredients?.length > 0 && <div>Missing: {missingIngredients.join(', ')}</div>}
            {missingPrices?.length > 0 && <div>No prices: {missingPrices.join(', ')}</div>}
          </div>
        </div>
      )}

      <div className="grid grid-cols-3 gap-2">
        <div className="bg-surface-100/80 dark:bg-surface-800/80 rounded-lg p-2 text-center">
          <Clock size={14} className="mx-auto text-cyan-500 mb-0.5" />
          <div className="text-[10px] text-surface-500">Time</div>
          <div className="text-sm font-semibold text-surface-700 dark:text-surface-200">{formatTime(dish?.time ?? 0)}</div>
        </div>
        <div className="bg-surface-100/80 dark:bg-surface-800/80 rounded-lg p-2 text-center">
          <DollarSign size={14} className="mx-auto text-emerald-500 mb-0.5" />
          <div className="text-[10px] text-surface-500">Cost{priceUnitLabel}</div>
          <div className="text-sm font-semibold text-surface-700 dark:text-surface-200">${(dish?.cost ?? 0).toFixed(2)}</div>
        </div>
        <div className="bg-surface-100/80 dark:bg-surface-800/80 rounded-lg p-2 text-center">
          <Flame size={14} className="mx-auto text-orange-500 mb-0.5" />
          <div className="text-[10px] text-surface-500">Calories</div>
          <div className="text-sm font-semibold text-surface-700 dark:text-surface-200">{dish?.calories ?? 0}</div>
        </div>
      </div>

      {ingredients?.length > 0 && (
        <div className="bg-surface-100/80 dark:bg-surface-800/80 rounded-lg p-2.5">
          <h4 className="text-xs font-semibold text-surface-700 dark:text-surface-200 mb-1.5">Ingredients</h4>
          <div className="grid grid-cols-2 gap-x-3 gap-y-0.5">
            {ingredients.map((ing, idx) => (
              <div key={idx} className="text-[11px] text-surface-600 dark:text-surface-300 flex justify-between">
                <span className="truncate pr-1">{ing.name}</span>
                <span className="text-surface-500 font-mono">{ing.g}g</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <EditableScoreBreakdown
        dish={dish}
        priorities={priorities}
        userRatings={userRatings}
        onRatingChange={onRatingChange}
        onResetAll={onResetAll}
        isDark={isDark}
      />

      {dish?.optimizedComment && (
        <div className="bg-surface-100/80 dark:bg-surface-800/80 rounded-lg p-2.5 border-l-2 border-food-500">
          <p className="text-[10px] text-surface-500 mb-0.5 font-medium">💡 Optimization Tip</p>
          <p className="text-xs text-surface-600 dark:text-surface-300">{dish.optimizedComment}</p>
        </div>
      )}
    </div>
  );
}

function IndexMapSlideContent({ dish, ingredientIndex, isMobile, priceUnit, defaultSelectedZone }) {
  const [hoveredZone, setHoveredZone] = useState(null);
  const [selectedZone, setSelectedZone] = useState(defaultSelectedZone || null);

  const priceUnitLabel = priceUnit === 'per1kg' ? 'per kg' : priceUnit === 'per1000kcal' ? 'per 1000kcal' : 'per serving';

  const { zonePrices, zoneBreakdowns } = useMemo(() => {
    if (!dish?.originalDish || !ingredientIndex) return { zonePrices: {}, zoneBreakdowns: {} };
    const prices = {};
    const breakdowns = {};
    for (const zoneId of Object.keys(ECONOMIC_ZONES)) {
      const result = calculateDishCost(dish.originalDish, zoneId, ingredientIndex);
      if (result.unavailableIngredients?.length > 0) {
        prices[zoneId] = null;
        breakdowns[zoneId] = null;
      } else {
        prices[zoneId] = result.totalCost;
        breakdowns[zoneId] = result.breakdown;
      }
    }
    return { zonePrices: prices, zoneBreakdowns: breakdowns };
  }, [dish?.originalDish, ingredientIndex]);

  const { minPrice, maxPrice, avgPrice } = useMemo(() => {
    const available = Object.values(zonePrices).filter(p => p !== null && p > 0);
    if (available.length === 0) return { minPrice: 0, maxPrice: 0, avgPrice: 0 };
    return {
      minPrice: Math.min(...available),
      maxPrice: Math.max(...available),
      avgPrice: available.reduce((a, b) => a + b, 0) / available.length,
    };
  }, [zonePrices]);

  const priceSpread = maxPrice > 0 && minPrice > 0 ? (((maxPrice - minPrice) / minPrice) * 100).toFixed(0) : 0;

  const getZoneFill = (zoneId) => getPriceColor(zonePrices[zoneId], minPrice, maxPrice).fill;
  const getZoneOpacity = (zoneId, sel, hov) => (hov || sel === zoneId) ? 1 : 0.85;
  const getZoneStroke = (zoneId, hov, sel) => (hov || sel) ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.15)';
  const getZoneStrokeWidth = (zoneId, hov, sel) => (hov || sel) ? 1.5 : 0.5;
  const getTooltipContent = (zoneId, zoneData) => ({
    ...zoneData,
    price: zonePrices[zoneId],
    priceColor: zonePrices[zoneId] === null ? 'text-surface-500' : getPriceColor(zonePrices[zoneId], minPrice, maxPrice).text,
  });

  const activeZone = selectedZone || hoveredZone;
  const currentZone = activeZone ? ECONOMIC_ZONES[activeZone] : null;
  const currentPrice = activeZone ? zonePrices[activeZone] : null;
  const currentBreakdown = activeZone ? zoneBreakdowns[activeZone] : null;

  const sortedBreakdown = useMemo(() => {
    if (!currentBreakdown) return [];
    return [...currentBreakdown].filter(i => i.cost > 0).sort((a, b) => b.cost - a.cost);
  }, [currentBreakdown]);

  const totalCost = sortedBreakdown.reduce((s, i) => s + i.cost, 0);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MapIcon size={14} className="text-food-500" />
          <span className="text-sm font-semibold text-surface-700 dark:text-surface-200">
            {dish?.name} Price Index
          </span>
        </div>
        {priceSpread > 0 && (
          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400">
            {priceSpread}% spread
          </span>
        )}
      </div>

      <p className="text-[10px] text-surface-500">Prices shown {priceUnitLabel}</p>

      {isMobile ? (
        // Mobile: vertical layout (map on top, data below)
        <>
          <div className="rounded-lg overflow-hidden bg-surface-800/50">
            <EconomicZonesSvgMap
              selectedZone={selectedZone}
              onZoneSelect={(z) => setSelectedZone(selectedZone === z ? null : z)}
              hoveredZone={hoveredZone}
              onHoveredZoneChange={setHoveredZone}
              zoom={1.25}
              className="w-full"
              svgStyle={{ height: '180px' }}
              getZoneFill={getZoneFill}
              getZoneOpacity={getZoneOpacity}
              getZoneStroke={getZoneStroke}
              getZoneStrokeWidth={getZoneStrokeWidth}
              getTooltipContent={getTooltipContent}
              transformOffset="245 25"
              backgroundFill="rgba(15, 23, 42, 0.5)"
              showTooltip={true}
            />
          </div>

          <div className="flex items-center justify-between text-[9px] text-surface-500 px-0.5">
            <span className="flex items-center gap-1"><div className="w-2 h-2 rounded" style={{ background: 'rgb(34, 197, 94)' }} />Cheap</span>
            <div className="flex-1 h-1 mx-2 rounded-full" style={{ background: 'linear-gradient(to right, rgb(34, 197, 94), rgb(250, 204, 21), rgb(249, 115, 22), rgb(239, 68, 68))' }} />
            <span className="flex items-center gap-1">Expensive<div className="w-2 h-2 rounded" style={{ background: 'rgb(239, 68, 68)' }} /></span>
          </div>

          {activeZone && currentZone && currentBreakdown && (
            <div className="bg-surface-100/80 dark:bg-surface-800/80 rounded-lg p-2.5">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm">{currentZone.emoji}</span>
                  <span className="text-xs font-semibold text-surface-700 dark:text-surface-200">{currentZone.name}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className={`text-sm font-bold font-mono ${getPriceColor(currentPrice, minPrice, maxPrice).text}`}>
                    ${currentPrice?.toFixed(2) ?? 'N/A'}
                  </span>
                  {selectedZone && <button onClick={() => setSelectedZone(null)} className="p-0.5 rounded text-surface-400 hover:text-surface-600"><X size={12} /></button>}
                </div>
              </div>
              <div className="space-y-0.5">
                {sortedBreakdown.slice(0, 5).map((item) => (
                  <div key={item.name} className="flex items-center gap-1.5 text-[11px]">
                    <span className="flex-1 truncate text-surface-600 dark:text-surface-300">{item.name}</span>
                    <span className="text-surface-500 font-mono">{totalCost > 0 ? ((item.cost / totalCost) * 100).toFixed(0) : 0}%</span>
                    <span className="font-bold font-mono text-surface-700 dark:text-surface-200 w-10 text-right">${item.cost.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <p className="text-[9px] text-surface-500 text-center">Tap a region to see ingredient breakdown</p>
        </>
      ) : (
        // Desktop: horizontal layout (map on left, data on right)
        <div className="flex gap-4">
          <div className="flex-shrink-0 w-[55%] space-y-2">
            <div className="rounded-lg overflow-hidden bg-surface-800/50">
              <EconomicZonesSvgMap
                selectedZone={selectedZone}
                onZoneSelect={(z) => setSelectedZone(selectedZone === z ? null : z)}
                hoveredZone={hoveredZone}
                onHoveredZoneChange={setHoveredZone}
                zoom={1.25}
                className="w-full"
                svgStyle={{ height: '220px' }}
                getZoneFill={getZoneFill}
                getZoneOpacity={getZoneOpacity}
                getZoneStroke={getZoneStroke}
                getZoneStrokeWidth={getZoneStrokeWidth}
                getTooltipContent={getTooltipContent}
                transformOffset="245 25"
                backgroundFill="rgba(15, 23, 42, 0.5)"
                showTooltip={true}
              />
            </div>

            <div className="flex items-center justify-between text-[9px] text-surface-500 px-0.5">
              <span className="flex items-center gap-1"><div className="w-2 h-2 rounded" style={{ background: 'rgb(34, 197, 94)' }} />Cheap</span>
              <div className="flex-1 h-1 mx-2 rounded-full" style={{ background: 'linear-gradient(to right, rgb(34, 197, 94), rgb(250, 204, 21), rgb(249, 115, 22), rgb(239, 68, 68))' }} />
              <span className="flex items-center gap-1">Expensive<div className="w-2 h-2 rounded" style={{ background: 'rgb(239, 68, 68)' }} /></span>
            </div>

            <p className="text-[9px] text-surface-500 text-center">Click a region to see ingredient breakdown</p>
          </div>

          <div className="flex-1 min-w-0 h-[220px] flex flex-col">
            {activeZone && currentZone && currentBreakdown && (
              <div className="bg-surface-100/80 dark:bg-surface-800/80 rounded-lg p-2.5 h-full flex flex-col">
                <div className="flex items-center justify-between mb-1.5 flex-shrink-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm">{currentZone.emoji}</span>
                    <span className="text-xs font-semibold text-surface-700 dark:text-surface-200">{currentZone.name}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className={`text-sm font-bold font-mono ${getPriceColor(currentPrice, minPrice, maxPrice).text}`}>
                      ${currentPrice?.toFixed(2) ?? 'N/A'}
                    </span>
                    {selectedZone && <button onClick={() => setSelectedZone(null)} className="p-0.5 rounded text-surface-400 hover:text-surface-600"><X size={12} /></button>}
                  </div>
                </div>
                <div className="space-y-0.5 flex-1 overflow-y-auto">
                  {sortedBreakdown.slice(0, 5).map((item) => (
                    <div key={item.name} className="flex items-center gap-1.5 text-[11px]">
                      <span className="flex-1 truncate text-surface-600 dark:text-surface-300">{item.name}</span>
                      <span className="text-surface-500 font-mono">{totalCost > 0 ? ((item.cost / totalCost) * 100).toFixed(0) : 0}%</span>
                      <span className="font-bold font-mono text-surface-700 dark:text-surface-200 w-10 text-right">${item.cost.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function TimeSlideContent({ dish, isOptimized, userRatings }) {
  const dishName = dish?.name || 'This dish';
  const prepTimeNormal = dish?.prepTimeNormal ?? 0;
  const cookTimeNormal = dish?.cookTimeNormal ?? 0;
  const totalTimeNormal = prepTimeNormal + cookTimeNormal;
  const prepTimeOptimized = dish?.prepTimeOptimized ?? prepTimeNormal;
  const cookTimeOptimized = dish?.cookTimeOptimized ?? cookTimeNormal;
  const passiveTimeHours = dish?.passiveTimeHours ?? 0;
  const passivePenalty = getPassiveTimePenalty(passiveTimeHours);
  const speedScoreBeforePenalty = dish?.speedScoreBeforePenalty ?? 5;
  const speedPercentile = dish?.speedPercentile ?? 50;
  const finalSpeedScore = dish?.normalizedBase?.speed ?? 5;
  const prepChanged = prepTimeNormal !== prepTimeOptimized;
  const cookChanged = cookTimeNormal !== cookTimeOptimized;
  const timeReduction = totalTimeNormal - (prepTimeOptimized + cookTimeOptimized);
  const percentReduction = totalTimeNormal > 0 ? Math.round((timeReduction / totalTimeNormal) * 100) : 0;
  const optimizedComment = dish?.optimizedComment || '';

  const hasUserSpeedOverride = userRatings?.speed !== undefined;
  const userSpeedScore = userRatings?.speed;

  const formatPassiveTime = (h) => h < 1 ? `${Math.round(h * 60)} min` : h === 1 ? '1 hour' : `${h} hours`;

  return (
    <div className="space-y-3">
      <div className="bg-surface-100/80 dark:bg-surface-800/80 rounded-lg p-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Timer size={14} className="text-cyan-500" />
            <span className="text-xs font-semibold text-surface-700 dark:text-surface-200 uppercase tracking-wide">Standard Cooking</span>
          </div>
          <div className="px-2 py-0.5 rounded text-xs font-bold bg-cyan-500/15 text-cyan-600 dark:text-cyan-400">
            {finalSpeedScore.toFixed(1)}/10
          </div>
        </div>

        <p className="text-xs text-surface-600 dark:text-surface-300 leading-relaxed mb-2">
          <span className="font-semibold text-surface-800 dark:text-surface-100">{dishName}</span> requires{' '}
          <span className="font-mono font-semibold text-cyan-600 dark:text-cyan-400">{prepTimeNormal} min</span> of preparation
          {cookTimeNormal > 0 ? (
            <> and <span className="font-mono font-semibold text-cyan-600 dark:text-cyan-400">{cookTimeNormal} min</span> of cooking</>
          ) : null}.
        </p>

        <div className="bg-surface-200/50 dark:bg-surface-700/50 rounded-lg p-2 mb-2">
          <div className="flex items-center justify-between text-[9px] text-surface-500 mb-1">
            <span>Slowest</span>
            <span>Speed Percentile</span>
            <span>Fastest</span>
          </div>
          <div className="relative h-1.5 bg-surface-300 dark:bg-surface-600 rounded-full overflow-hidden">
            <motion.div
              className="absolute top-0 left-0 h-full bg-gradient-to-r from-cyan-500 to-emerald-500 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${speedPercentile}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
          <p className="text-[10px] text-center text-cyan-600 dark:text-cyan-400 mt-1">
            Faster than {speedPercentile}% of dishes
          </p>
        </div>

        {/* Speed score explanation */}
        {hasUserSpeedOverride ? (
          <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">
            You changed the speed score for this dish to <span className="font-mono">{userSpeedScore.toFixed(1)}/10</span>
          </p>
        ) : (
          <p className="text-xs text-surface-600 dark:text-surface-300">
            Based on this, the dish receives an active speed score of{' '}
            <span className="font-mono font-semibold text-cyan-600 dark:text-cyan-400">≈{speedScoreBeforePenalty.toFixed(1)}/10</span>.
          </p>
        )}

        {passiveTimeHours > 0 && (
          <div className="mt-2 pt-2 border-t border-surface-200 dark:border-surface-700">
            <p className="text-xs text-surface-600 dark:text-surface-300">
              <span className="text-amber-600 dark:text-amber-400 font-semibold">+{formatPassiveTime(passiveTimeHours)}</span> passive time applies a{' '}
              <span className="text-rose-500 font-semibold">{passivePenalty} point</span> penalty.
              Final speed score: <span className="font-mono font-bold text-cyan-600">{finalSpeedScore.toFixed(1)}/10</span>
            </p>
          </div>
        )}
      </div>

      {(prepChanged || cookChanged) && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Zap size={14} className="text-emerald-500" />
              <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 uppercase">Time-Optimized</span>
            </div>
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">-{percentReduction}%</span>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-2">
            <div>
              <div className="text-[10px] text-surface-500">Prep</div>
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-surface-700 dark:text-surface-200">{prepTimeOptimized} min</span>
                {prepChanged && <span className="flex items-center text-emerald-500 text-[10px]"><ArrowDown size={10} />{prepTimeNormal - prepTimeOptimized}</span>}
              </div>
            </div>
            <div>
              <div className="text-[10px] text-surface-500">Cook</div>
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-surface-700 dark:text-surface-200">{cookTimeOptimized} min</span>
                {cookChanged && <span className="flex items-center text-emerald-500 text-[10px]"><ArrowDown size={10} />{cookTimeNormal - cookTimeOptimized}</span>}
              </div>
            </div>
          </div>

          {optimizedComment && (
            <div className="bg-white/50 dark:bg-surface-800/50 rounded p-2 border-l-2 border-emerald-500">
              <p className="text-[11px] text-surface-600 dark:text-surface-300 italic">"{optimizedComment}"</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function HealthSlideContent({ dish, ingredients, ingredientIndex }) {
  if (!ingredients?.length || !ingredientIndex) {
    return <div className="flex items-center justify-center h-40 text-surface-500 text-sm">No ingredient data available</div>;
  }

  const ingredientsWithHealth = ingredients
    .map((ing) => {
      const ingData = ingredientIndex.get(normalizeIngredientName(ing.name));
      const baseHealth = ingData?.health_index;
      if (baseHealth === null || baseHealth === undefined) return null;
      const cookingCoef = getCookingCoef(ing.state);
      const adjustedHealth = Math.min(10, Math.max(0, baseHealth * cookingCoef));
      return {
        name: ing.name,
        grams: ing.g,
        state: ing.state,
        baseHealth,
        adjustedHealth,
        cookingCoef,
        cookingLabel: getCookingLabel(ing.state),
        cookingEffect: getCookingEffect(cookingCoef),
      };
    })
    .filter(Boolean);

  const sortedIngredients = [...ingredientsWithHealth].sort((a, b) => (b.grams * b.adjustedHealth) - (a.grams * a.adjustedHealth));
  const healthColors = getHealthColor(dish?.health ?? 5);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between p-2.5 bg-surface-100/80 dark:bg-surface-800/80 rounded-lg">
        <div className="flex items-center gap-2">
          <Heart size={16} className={healthColors.text} />
          <span className="text-sm font-semibold text-surface-700 dark:text-surface-200">{dish?.name} Health Breakdown</span>
        </div>
        <div className={`px-2.5 py-1 rounded-lg text-xs font-bold text-white ${healthColors.badge}`}>
          Overall {(dish?.health ?? 5).toFixed(1)}/10
        </div>
      </div>

      <div className="space-y-1 overflow-y-auto overflow-x-hidden pr-1">
        {sortedIngredients.map((ing, idx) => {
          const colors = getHealthColor(ing.adjustedHealth);
          const healthPercent = (ing.adjustedHealth / 10) * 100;
          const hasImpact = ing.cookingCoef !== 1.0;
          const impactPercent = ((ing.cookingCoef - 1) * 100).toFixed(0);

          return (
            <motion.div
              key={idx}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.03 }}
              className={`rounded-lg p-2 border ${colors.bg} ${colors.border}`}
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1.5">
                  <Heart size={10} className={colors.text} />
                  <span className="font-semibold text-surface-800 dark:text-surface-100 text-xs">{ing.grams}g {ing.name}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-medium ${hasImpact ? 'bg-surface-200/60 dark:bg-surface-700/60' : ''} ${ing.cookingEffect.color}`}>
                    {ing.cookingLabel}
                    {hasImpact && <span className="ml-0.5 opacity-75">{ing.cookingEffect.icon}</span>}
                  </span>
                  {hasImpact && (
                    <span className={`text-[9px] font-mono ${ing.cookingCoef > 1 ? 'text-emerald-500' : 'text-rose-400'}`}>
                      {ing.cookingCoef > 1 ? '+' : ''}{impactPercent}%
                    </span>
                  )}
                  <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold text-white ${colors.badge}`}>
                    {ing.adjustedHealth.toFixed(1)}
                  </span>
                </div>
              </div>
              <div className="h-1 bg-surface-300/60 dark:bg-surface-700/60 rounded-full overflow-hidden">
                <motion.div
                  className={`h-full rounded-full ${colors.bar}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${healthPercent}%` }}
                  transition={{ duration: 0.3, delay: idx * 0.03 }}
                />
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

function getEthicsIcon(index) {
  if (index < 2) return Skull;
  if (index < 4) return Frown;
  return Leaf;
}

function EthicsSlideContent({ dish, ingredients, ingredientIndex }) {
  if (!ingredients?.length || !ingredientIndex) {
    return <div className="flex items-center justify-center h-40 text-surface-500 text-sm">No ingredient data available</div>;
  }

  const ingredientsWithEthics = ingredients.map((ing) => {
    const ingData = ingredientIndex.get(normalizeIngredientName(ing.name));
    return {
      name: ing.name,
      grams: ing.g,
      ethicsIndex: ingData?.ethics_index ?? null,
      ethicsReason: ingData?.ethics_reason ?? 'No ethics data available for this ingredient.',
    };
  });

  const ethicsColors = getEthicsColor(dish?.ethics ?? 5);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between p-2.5 bg-surface-100/80 dark:bg-surface-800/80 rounded-lg">
        <div className="flex items-center gap-2">
          <Leaf size={16} className={ethicsColors.text} />
          <span className="text-sm font-semibold text-surface-700 dark:text-surface-200">{dish?.name} Ethics Breakdown</span>
        </div>
        <div className={`px-2.5 py-1 rounded-lg text-xs font-bold text-white ${ethicsColors.badge}`}>
          Overall {(dish?.ethics ?? 5).toFixed(1)}/10
        </div>
      </div>

      <div className="space-y-1 overflow-y-auto overflow-x-hidden pr-1">
        {ingredientsWithEthics.map((ing, idx) => {
          const colors = getEthicsColor(ing.ethicsIndex ?? 5);
          const Icon = getEthicsIcon(ing.ethicsIndex ?? 5);

          return (
            <motion.div
              key={idx}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.03 }}
              className={`rounded-lg p-2 border ${colors.bg} ${colors.border}`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5">
                  <Icon size={12} className={`${colors.text} flex-shrink-0`} />
                  <span className="font-semibold text-surface-800 dark:text-surface-100 text-xs">
                    {ing.grams}g {ing.name}
                  </span>
                </div>
                {ing.ethicsIndex !== null && (
                  <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold text-white flex-shrink-0 ${colors.badge}`}>
                    {ing.ethicsIndex}/10
                  </span>
                )}
              </div>
              <p className="text-xs text-surface-600 dark:text-surface-300 leading-relaxed">
                {ing.ethicsReason}
              </p>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
