import { useEffect, useRef, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  Clock, 
  DollarSign, 
  Utensils, 
  ChevronDown,
  Heart,
  RotateCcw,
  Flame,
  Leaf,
} from 'lucide-react';
import InfoSlider from './dishCard/InfoSlider';
import MetricIndicator from './dishCard/MetricIndicator';
import { useIsMobile } from '../lib/useIsMobile';
import {
  formatTime,
  getScoreColor,
} from './dishCardUtils';
import { convertPriceToUnit } from '../lib/RankingEngine';


/**
 * Unified breakpoints hook - single MediaQueryList listener for all breakpoints
 * Replaces multiple useMediaQuery hooks to reduce memory and event listener overhead
 */
function useBreakpoints() {
  const [breakpoints, setBreakpoints] = useState(() => {
    if (typeof window === 'undefined' || !window.matchMedia) {
      return { isNarrow: false, isVeryNarrow: false, isModerateNarrow: false };
    }
    return {
      isNarrow: window.matchMedia('(max-width: 339px)').matches,
      isVeryNarrow: window.matchMedia('(max-width: 379px)').matches,
      isModerateNarrow: window.matchMedia('(max-width: 419px)').matches,
    };
  });

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;

    const mqNarrow = window.matchMedia('(max-width: 339px)');
    const mqVeryNarrow = window.matchMedia('(max-width: 379px)');
    const mqModerateNarrow = window.matchMedia('(max-width: 419px)');

    const updateBreakpoints = () => {
      setBreakpoints({
        isNarrow: mqNarrow.matches,
        isVeryNarrow: mqVeryNarrow.matches,
        isModerateNarrow: mqModerateNarrow.matches,
      });
    };

    // Use addEventListener if available, fallback to addListener
    const addListener = (mq, handler) => {
      if (mq.addEventListener) {
        mq.addEventListener('change', handler);
        return () => mq.removeEventListener('change', handler);
      }
      mq.addListener(handler);
      return () => mq.removeListener(handler);
    };

    const cleanup1 = addListener(mqNarrow, updateBreakpoints);
    const cleanup2 = addListener(mqVeryNarrow, updateBreakpoints);
    const cleanup3 = addListener(mqModerateNarrow, updateBreakpoints);

    return () => {
      cleanup1();
      cleanup2();
      cleanup3();
    };
  }, []);

  return breakpoints;
}

/**
 * Main Dish Card Component
 * Compact view with expandable details
 */
export default function DishCard({ dish, isExpanded, onToggle, onOverrideChange, overrides = {}, ingredientIndex, priceUnit = 'serving', priorities = {}, isOptimized = false, analysisVariants = null }) {
  const cardRef = useRef(null);
  const scoreColors = getScoreColor(dish.score);
  const isMobile = useIsMobile();
  const { isNarrow, isVeryNarrow, isModerateNarrow } = useBreakpoints();

  const [draftOverrides, setDraftOverrides] = useState(overrides);
  const draftRef = useRef(draftOverrides);
  const commitTimerRef = useRef(null);
  const localEditingRef = useRef(false);

  // Keep ref in sync with state
  useEffect(() => {
    draftRef.current = draftOverrides;
  }, [draftOverrides]);

  // Safety: never leave debounced commit timers running after unmount.
  useEffect(() => {
    return () => {
      if (commitTimerRef.current) {
        clearTimeout(commitTimerRef.current);
        commitTimerRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    // Sync external overrides when not actively editing this card
    if (!localEditingRef.current) {
      setDraftOverrides(overrides);
    }
  }, [overrides]);

  useEffect(() => {
    if (!isExpanded) {
      localEditingRef.current = false;
      if (commitTimerRef.current) {
        clearTimeout(commitTimerRef.current);
        commitTimerRef.current = null;
      }
      setDraftOverrides(overrides);
    }
  }, [isExpanded, overrides]);

  // Auto-scroll to top of card when expanded
  useEffect(() => {
    if (isExpanded && cardRef.current) {
      cardRef.current?.scrollIntoView({
        behavior: 'auto',
        block: 'start',
      });
    }
  }, [isExpanded]);

  const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

  const sanitizeOverrides = (o) => {
    const next = { ...(o || {}) };
    const eps = 1e-6;

    // If multiplier exists, drop legacy absolute
    if (next.tasteMul !== undefined) delete next.taste;
    if (next.priceMul !== undefined) delete next.price;
    if (next.timeMul !== undefined) delete next.time;
    if (next.healthMul !== undefined) delete next.health;
    if (next.ethicsMul !== undefined) delete next.ethics;
    if (next.caloriesMul !== undefined) delete next.calories;

    // Drop near-default multipliers
    for (const k of ['tasteMul', 'priceMul', 'timeMul', 'healthMul', 'ethicsMul', 'caloriesMul']) {
      if (Number.isFinite(next[k]) && Math.abs(next[k] - 1) < eps) delete next[k];
    }

    return next;
  };

  const scheduleCommit = (nextOverrides) => {
    if (commitTimerRef.current) clearTimeout(commitTimerRef.current);
    commitTimerRef.current = setTimeout(() => {
      commitTimerRef.current = null;
      localEditingRef.current = false;
      onOverrideChange(dish.name, sanitizeOverrides(nextOverrides));
    }, 250);
  };

  const commitNow = () => {
    if (commitTimerRef.current) {
      clearTimeout(commitTimerRef.current);
      commitTimerRef.current = null;
    }
    localEditingRef.current = false;
    onOverrideChange(dish.name, sanitizeOverrides(draftRef.current));
  };

  const updateDraft = (patch) => {
    localEditingRef.current = true;
    setDraftOverrides((prev) => {
      const next = sanitizeOverrides({ ...(prev || {}), ...(patch || {}) });
      // Keep ref in sync immediately (important for quick tap -> pointerup -> commitNow)
      draftRef.current = next;
      scheduleCommit(next);
      return next;
    });
  };

  // Baselines (pre-override) computed by engine - memoized to avoid unnecessary calculations
  const baseValues = useMemo(() => ({
    taste: dish.baseTaste ?? dish.taste ?? 5,
    priceServing: dish.basePriceServing ?? dish.baseCost ?? dish.prices?.serving ?? 0,
    timeCurrentMode: isOptimized ? (dish.baseTimeOptimized ?? dish.time ?? 30) : (dish.baseTimeNormal ?? dish.time ?? 30),
    health: dish.baseHealth ?? dish.health ?? 5,
    ethics: dish.baseEthics ?? dish.ethics ?? 5,
    calories: dish.baseCalories ?? dish.calories ?? 0,
  }), [
    dish.baseTaste, dish.taste, dish.basePriceServing, dish.baseCost, dish.prices?.serving,
    isOptimized, dish.baseTimeOptimized, dish.time, dish.baseTimeNormal,
    dish.baseHealth, dish.health, dish.baseEthics, dish.ethics, dish.baseCalories, dish.calories
  ]);

  // Effective values (apply draft overrides in-card without forcing global re-analysis each tick)
  const effectiveValues = useMemo(() => {
    const { taste: baseTaste, priceServing: basePriceServing, timeCurrentMode: baseTimeCurrentMode, health: baseHealth, ethics: baseEthics, calories: baseCalories } = baseValues;

    const effectiveTaste = (() => {
      if (Number.isFinite(draftOverrides?.taste)) return clamp(draftOverrides.taste, 0, 10);
      if (Number.isFinite(draftOverrides?.tasteMul)) return clamp(baseTaste * draftOverrides.tasteMul, 0, 10);
      return dish.taste;
    })();

    const effectiveTime = (() => {
      if (Number.isFinite(draftOverrides?.time)) return Math.max(1, draftOverrides.time);
      if (Number.isFinite(draftOverrides?.timeMul)) {
        const base = isOptimized ? (dish.baseTimeOptimized ?? dish.time ?? 30) : (dish.baseTimeNormal ?? dish.time ?? 30);
        return Math.max(1, base * draftOverrides.timeMul);
      }
      return dish.time;
    })();

    const effectiveBasePriceServing = (() => {
      if (Number.isFinite(draftOverrides?.price)) return Math.max(0.01, draftOverrides.price);
      if (Number.isFinite(draftOverrides?.priceMul)) return Math.max(0.01, basePriceServing * draftOverrides.priceMul);
      return dish.prices?.serving ?? dish.baseCost ?? dish.cost ?? 0;
    })();

    const effectiveHealth = (() => {
      if (Number.isFinite(draftOverrides?.health)) return clamp(draftOverrides.health, 0, 10);
      if (Number.isFinite(draftOverrides?.healthMul)) return clamp(baseHealth * draftOverrides.healthMul, 0, 10);
      return dish.health;
    })();

    const effectiveEthics = (() => {
      if (Number.isFinite(draftOverrides?.ethics)) return clamp(draftOverrides.ethics, 0, 10);
      if (Number.isFinite(draftOverrides?.ethicsMul)) return clamp(baseEthics * draftOverrides.ethicsMul, 0, 10);
      return dish.ethics;
    })();

    const effectiveCalories = (() => {
      if (Number.isFinite(draftOverrides?.calories)) return Math.max(0, Math.round(draftOverrides.calories));
      if (Number.isFinite(draftOverrides?.caloriesMul)) return Math.max(0, Math.round(baseCalories * draftOverrides.caloriesMul));
      return dish.calories ?? 0;
    })();

    // Price display: use cached per-unit price from the analyzed variant (dish.cost / dish.prices[unit])
    // Convert only if the user set an absolute per-serving override (draftOverrides.price).
    const weight = dish?.weight ?? 0;
    const calories = dish?.calories ?? 0;
    const basePriceForUnit = dish.prices?.[priceUnit] ?? dish.cost ?? 0;

    const effectivePrice = (() => {
      if (Number.isFinite(draftOverrides?.price)) {
        // Absolute override is interpreted as "per serving" (legacy semantics),
        // so convert that single value to the current unit.
        return convertPriceToUnit(draftOverrides.price, weight, calories, priceUnit);
      }
      if (Number.isFinite(draftOverrides?.priceMul)) {
        // Apply multiplier to already-cached unit price (no conversion work).
        return Math.max(0.01, basePriceForUnit * draftOverrides.priceMul);
      }
      return basePriceForUnit;
    })();

    const calPerG = (dish?.weight ?? 0) > 0 && effectiveCalories > 0
      ? ((effectiveCalories / dish.weight) * 1000 / 100)
      : 0;

    return {
      taste: effectiveTaste,
      time: effectiveTime,
      basePriceServing: effectiveBasePriceServing,
      price: effectivePrice,
      health: effectiveHealth,
      ethics: effectiveEthics,
      calories: effectiveCalories,
      calPerG,
    };
  }, [baseValues, draftOverrides, dish, isOptimized, priceUnit]);

  const { taste: effectiveTaste, time: effectiveTime, basePriceServing: effectiveBasePriceServing, price: effectivePrice, health: effectiveHealth, ethics: effectiveEthics, calories: effectiveCalories, calPerG } = effectiveValues;

  const handleResetOverrides = () => {
    onOverrideChange(dish.name, {});
  };

  const hasAnyOverride = Object.keys(draftOverrides || {}).length > 0;
  const missingIngredients = dish.missingIngredients || [];
  const missingPrices = dish.missingPrices || [];
  const unavailableIngredients = dish.unavailableIngredients || [];

  // Get original ingredients from dish data
  const ingredients = dish.originalDish?.ingredients || [];

  const stepPct = 0.01;

  const bumpMul = (currentMul, pctDelta) => {
    const m = Number.isFinite(currentMul) ? currentMul : 1;
    return m * (1 + pctDelta);
  };

  /**
   * Universal handler for percentage-based changes to any override value.
   * Handles both absolute and multiplier-based overrides for all metrics.
   * 
   * @param {string} key - The override key (e.g., 'taste', 'time', 'price', etc.)
   * @param {number} pctDelta - Percentage change (e.g., 0.01 for 1% increase)
   * @param {Object} config - Configuration object with:
   *   - baseValue: base value for this metric from baseValues
   *   - dishValue: fallback value from dish object
   *   - clampMin: minimum value for clamping (for absolute values)
   *   - clampMax: maximum value for clamping (for absolute values, optional)
   *   - useMax: function to apply max constraint (e.g., Math.max for time/calories)
   */
  const createChangeHandler = (key, config) => (pctDelta) => {
    const current = draftRef.current || {};
    const { baseValue, dishValue, clampMin, clampMax, useMax } = config;
    const absKey = key;
    const mulKey = `${key}Mul`;

    // Try multiplier approach if base value is valid and positive
    if (Number.isFinite(baseValue) && baseValue > 0) {
      const currentMul = Number.isFinite(current[mulKey])
        ? current[mulKey]
        : (Number.isFinite(current[absKey]) ? (current[absKey] / baseValue) : 1);
      updateDraft({ [mulKey]: bumpMul(currentMul, pctDelta) });
      return;
    }

    // Fallback to absolute value approach
    const effective = Number.isFinite(current[absKey])
      ? current[absKey]
      : (Number.isFinite(current[mulKey]) ? baseValue * current[mulKey] : dishValue);

    // Apply constraint based on metric type
    let newValue;
    if (useMax) {
      // For time and calories: use Math.max with minimum
      newValue = useMax(clampMin, effective * (1 + pctDelta));
    } else {
      // For taste, health, ethics: use clamp function
      newValue = clamp(effective * (1 + pctDelta), clampMin, clampMax ?? 10);
    }

    updateDraft({ [absKey]: newValue });
  };

  // Create handlers for each metric with their specific configurations
  const handleTasteChangePct = createChangeHandler('taste', {
    baseValue: baseValues.taste,
    dishValue: dish.taste,
    clampMin: 0,
    clampMax: 10,
  });

  const handleTimeChangePct = createChangeHandler('time', {
    baseValue: baseValues.timeCurrentMode,
    dishValue: dish.time,
    clampMin: 1,
    useMax: Math.max,
  });

  const handlePriceChangePct = createChangeHandler('price', {
    baseValue: baseValues.priceServing,
    dishValue: baseValues.priceServing,
    clampMin: 0.01,
    useMax: Math.max,
  });

  const handleHealthChangePct = createChangeHandler('health', {
    baseValue: baseValues.health,
    dishValue: dish.health,
    clampMin: 0,
    clampMax: 10,
  });

  const handleEthicsChangePct = createChangeHandler('ethics', {
    baseValue: baseValues.ethics,
    dishValue: dish.ethics,
    clampMin: 0,
    clampMax: 10,
  });

  const handleCaloriesChangePct = createChangeHandler('calories', {
    baseValue: baseValues.calories,
    dishValue: dish.calories ?? 0,
    clampMin: 0,
    useMax: Math.max,
  });

  return (
    <motion.div
      ref={cardRef}
      layout={false}
      className={`
        bg-white/70 dark:bg-surface-800/60 rounded-xl border transition-colors shadow-sm dark:shadow-none
        ${isExpanded 
          ? 'border-food-500/30' 
          : 'border-surface-300/50 dark:border-surface-700/50 hover:border-surface-400 dark:hover:border-surface-600'
        }
      `}
    >
      {/* Header (Always visible) */}
      <div
        onClick={onToggle}
        className="w-full p-3 sm:p-4 flex items-center gap-2 sm:gap-3 text-left cursor-pointer"
      >
        {/* Score Badge - shown on desktop or when collapsed on mobile */}
        <motion.div
          layout={false}
          className={`
            ${isExpanded ? 'hidden sm:flex' : 'flex'} flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-xl
            items-center justify-center
            ${scoreColors.bg} ${scoreColors.glow}
          `}
        >
          <span className={`text-base sm:text-lg font-display font-bold text-white`}>
            {dish.score}
          </span>
        </motion.div>

        {/* Main content */}
        <div className="flex-1 min-w-0">
          {/* Name, Score badge (mobile only when expanded), Reset button, Modified indicator, and expand arrow - all on one line */}
          <div className="flex items-center gap-1.5 sm:gap-2 flex-nowrap">
            {/* Score Badge - shown only on mobile (<640px) when expanded, inline with name */}
            {isExpanded && (
              <motion.div
                layout={false}
                className={`
                  flex sm:hidden flex-shrink-0 w-7 h-7 rounded-lg
                  items-center justify-center
                  ${scoreColors.bg} ${scoreColors.glow}
                `}
              >
                <span className="text-xs font-display font-bold text-white">
                  {dish.score}
                </span>
              </motion.div>
            )}
            <h3 className="font-display font-semibold text-surface-800 dark:text-surface-100 truncate text-sm sm:text-base flex-1 min-w-0">
              {dish.name}
            </h3>
            {/* Reset button - always shown when has overrides, positioned before Modified text */}
            {hasAnyOverride && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleResetOverrides();
                }}
                className="flex-shrink-0 p-1 rounded-lg text-amber-500 hover:bg-amber-500/10 transition-colors"
                title="Reset modifications"
              >
                <RotateCcw size={isVeryNarrow ? 12 : isModerateNarrow ? 14 : 16} />
              </button>
            )}
            {/* Modified indicator - text on wider screens, hidden on narrow screens */}
            {hasAnyOverride && !isModerateNarrow && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-600 dark:text-amber-400 font-medium flex-shrink-0">
                Modified
              </span>
            )}
            {/* Expand icon - moved here to be on same line */}
            <ChevronDown 
              size={isVeryNarrow ? 16 : 20} 
              className={`
                flex-shrink-0 text-surface-400 transition-transform
                ${isExpanded ? 'rotate-180' : ''}
              `}
            />
          </div>
          
          {/* Metric indicators - responsive grid */}
          {/* Mobile: 2 rows x 3 cols, Desktop: single row */}
          <div className={`
            mt-1.5 
            ${isExpanded 
              ? 'grid grid-cols-3 mobile:flex mobile:flex-wrap gap-x-3 gap-y-1.5 mobile:gap-4' 
              : 'grid grid-cols-3 mobile:flex gap-x-4 gap-y-1 mobile:gap-6'
            }
          `}>
            <MetricIndicator
              icon={Utensils}
              value={effectiveTaste}
              format={(v) => v.toFixed(1)}
              isEditing={isExpanded}
              onIncrement={() => handleTasteChangePct(stepPct)}
              onDecrement={() => handleTasteChangePct(-stepPct)}
              onEditEnd={commitNow}
              isOverridden={draftOverrides.taste !== undefined || draftOverrides.tasteMul !== undefined}
              isAtMin={effectiveTaste <= 0}
              isAtMax={effectiveTaste >= 10}
              compact={!isExpanded && isMobile}
            />
            <MetricIndicator
              icon={Heart}
              value={effectiveHealth}
              format={(v) => v.toFixed(1)}
              isEditing={isExpanded}
              onIncrement={() => handleHealthChangePct(stepPct)}
              onDecrement={() => handleHealthChangePct(-stepPct)}
              onEditEnd={commitNow}
              isOverridden={draftOverrides.health !== undefined || draftOverrides.healthMul !== undefined}
              isAtMin={effectiveHealth <= 0}
              isAtMax={effectiveHealth >= 10}
              compact={!isExpanded && isMobile}
            />
            <MetricIndicator
              icon={DollarSign}
              value={effectivePrice}
              format={(v) => v.toFixed(2)}
              isEditing={isExpanded}
              onIncrement={() => handlePriceChangePct(stepPct)}
              onDecrement={() => handlePriceChangePct(-stepPct)}
              onEditEnd={commitNow}
              isOverridden={draftOverrides.price !== undefined || draftOverrides.priceMul !== undefined}
              isAtMin={effectiveBasePriceServing <= 0.01}
              compact={!isExpanded && isMobile}
            />
            <MetricIndicator
              icon={Clock}
              value={effectiveTime}
              format={(v) => (isExpanded ? `${v.toFixed(1)}m` : formatTime(Math.round(v)))}
              isEditing={isExpanded}
              onIncrement={() => handleTimeChangePct(stepPct)}
              onDecrement={() => handleTimeChangePct(-stepPct)}
              onEditEnd={commitNow}
              isOverridden={draftOverrides.time !== undefined || draftOverrides.timeMul !== undefined}
              isAtMin={effectiveTime <= 1}
              compact={!isExpanded && isMobile}
            />
            <MetricIndicator
              icon={Flame}
              value={calPerG}
              format={(v) => isNarrow ? `${Math.round(v)}` : `${Math.round(v)}cal/g`}
              isEditing={isExpanded}
              onIncrement={() => handleCaloriesChangePct(stepPct)}
              onDecrement={() => handleCaloriesChangePct(-stepPct)}
              onEditEnd={commitNow}
              isOverridden={draftOverrides.calories !== undefined || draftOverrides.caloriesMul !== undefined}
              isAtMin={effectiveCalories <= 0}
              compact={!isExpanded && isMobile}
            />
            <MetricIndicator
              icon={Leaf}
              value={effectiveEthics}
              format={(v) => v.toFixed(1)}
              isEditing={isExpanded}
              onIncrement={() => handleEthicsChangePct(stepPct)}
              onDecrement={() => handleEthicsChangePct(-stepPct)}
              onEditEnd={commitNow}
              isOverridden={draftOverrides.ethics !== undefined || draftOverrides.ethicsMul !== undefined}
              isAtMin={effectiveEthics <= 0}
              isAtMax={effectiveEthics >= 10}
              compact={!isExpanded && isMobile}
            />
          </div>
        </div>

      </div>

      {/* Expanded Details */}
      {isExpanded ? (
        <div className="overflow-hidden">
          <div className="px-4 pb-4">
            {/* Divider */}
            <div className="h-px bg-surface-300 dark:bg-surface-700 mb-4" />

            <InfoSlider 
              dish={dish}
              dishName={dish.name}
              dishHealth={dish.health}
              dishEthics={dish.ethics}
              ingredients={ingredients}
              ingredientIndex={ingredientIndex}
              priorities={priorities}
              unavailableIngredients={unavailableIngredients}
              missingIngredients={missingIngredients}
              missingPrices={missingPrices}
              isOptimized={isOptimized}
              analysisVariants={analysisVariants}
              priceUnit={priceUnit}
            />
          </div>
        </div>
      ) : null}
    </motion.div>
  );
}
