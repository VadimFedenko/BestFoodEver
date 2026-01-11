import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  Clock, 
  DollarSign, 
  Utensils, 
  Heart,
  Flame,
  Leaf,
  RotateCcw,
} from 'lucide-react';
import {
  formatTime,
  getScoreColor,
} from './dishCardUtils';
import { useIsMobile } from '../lib/useIsMobile';

/**
 * Compact metric display for card header
 */
function MetricBadge({ icon: Icon, value, format, isOverridden = false, compact = false }) {
  const iconColor = isOverridden ? 'text-amber-500 dark:text-amber-400' : 'text-surface-600 dark:text-surface-400';
  const textColor = isOverridden ? 'text-amber-600 dark:text-amber-300' : 'text-surface-500 dark:text-surface-400';
  
  if (compact) {
    return (
      <div className="flex items-center gap-0.5 text-[10px]">
        <Icon size={10} className={iconColor} />
        <span className={`font-mono ${textColor} leading-none`}>
          {format(value)}
        </span>
      </div>
    );
  }
  
  return (
    <div className="flex items-center gap-1 text-xs">
      <Icon size={12} className={iconColor} />
      <span className={`font-mono ${textColor}`}>
        {format(value)}
      </span>
    </div>
  );
}

/**
 * Simplified Dish Card Component
 * Click to open modal - no expansion logic
 */
export default function DishCardSimple({ 
  dish, 
  onClick, 
  overrides = {}, 
  onResetOverrides,
  priceUnit = 'serving',
}) {
  const scoreColors = getScoreColor(dish.score);
  const isMobile = useIsMobile();
  
  // Check if any overrides exist for this dish
  const hasAnyOverride = Object.keys(overrides || {}).length > 0;
  
  // Effective values with overrides applied
  const effectiveValues = useMemo(() => {
    const baseTaste = dish.baseTaste ?? dish.taste ?? 5;
    const baseHealth = dish.baseHealth ?? dish.health ?? 5;
    const baseEthics = dish.baseEthics ?? dish.ethics ?? 5;
    const baseCalories = dish.baseCalories ?? dish.calories ?? 0;
    
    const effectiveTaste = overrides?.tasteMul !== undefined 
      ? Math.min(10, Math.max(0, baseTaste * overrides.tasteMul))
      : dish.taste;
    
    const effectiveHealth = overrides?.healthMul !== undefined
      ? Math.min(10, Math.max(0, baseHealth * overrides.healthMul))
      : dish.health;
    
    const effectiveEthics = overrides?.ethicsMul !== undefined
      ? Math.min(10, Math.max(0, baseEthics * overrides.ethicsMul))
      : dish.ethics;
    
    const effectiveCalories = overrides?.caloriesMul !== undefined
      ? Math.max(0, Math.round(baseCalories * overrides.caloriesMul))
      : dish.calories ?? 0;
    
    const weight = dish?.weight ?? 0;
    const calPerG = weight > 0 && effectiveCalories > 0
      ? ((effectiveCalories / weight) * 1000 / 100)
      : 0;
    
    return {
      taste: effectiveTaste,
      health: effectiveHealth,
      ethics: effectiveEthics,
      calories: effectiveCalories,
      calPerG,
      time: dish.time,
      price: dish.prices?.[priceUnit] ?? dish.cost ?? 0,
    };
  }, [dish, overrides, priceUnit]);
  
  const handleResetClick = (e) => {
    e.stopPropagation();
    onResetOverrides?.(dish.name);
  };
  
  return (
    <motion.div
      onClick={onClick}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      className={`
        bg-white/70 dark:bg-surface-800/60 rounded-xl border transition-all
        border-surface-300/50 dark:border-surface-700/50 
        hover:border-food-500/30 hover:shadow-md
        cursor-pointer shadow-sm dark:shadow-none
      `}
    >
      <div className="p-3 sm:p-4 flex items-center gap-2 sm:gap-3">
        {/* Score Badge */}
        <div
          className={`
            flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-xl
            flex items-center justify-center
            ${scoreColors.bg} ${scoreColors.glow}
          `}
        >
          <span className="text-base sm:text-lg font-display font-bold text-white">
            {dish.score}
          </span>
        </div>

        {/* Main content */}
        <div className="flex-1 min-w-0">
          {/* Name row */}
          <div className="flex items-center gap-1.5 sm:gap-2 flex-nowrap mb-1.5">
            <h3 className="font-display font-semibold text-surface-800 dark:text-surface-100 truncate text-sm sm:text-base flex-1 min-w-0">
              {dish.name}
            </h3>
            
            {/* Reset button */}
            {hasAnyOverride && (
              <button
                onClick={handleResetClick}
                className="flex-shrink-0 p-1 rounded-lg text-amber-500 hover:bg-amber-500/10 transition-colors"
                title="Reset modifications"
              >
                <RotateCcw size={isMobile ? 12 : 14} />
              </button>
            )}
            
            {/* Modified indicator */}
            {hasAnyOverride && !isMobile && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-600 dark:text-amber-400 font-medium flex-shrink-0">
                Modified
              </span>
            )}
          </div>
          
          {/* Metric indicators */}
          <div className="grid grid-cols-3 mobile:flex gap-x-3 gap-y-1 mobile:gap-4">
            <MetricBadge
              icon={Utensils}
              value={effectiveValues.taste}
              format={(v) => v.toFixed(1)}
              isOverridden={overrides.tasteMul !== undefined}
              compact={isMobile}
            />
            <MetricBadge
              icon={Heart}
              value={effectiveValues.health}
              format={(v) => v.toFixed(1)}
              isOverridden={overrides.healthMul !== undefined}
              compact={isMobile}
            />
            <MetricBadge
              icon={DollarSign}
              value={effectiveValues.price}
              format={(v) => v.toFixed(2)}
              isOverridden={overrides.priceMul !== undefined}
              compact={isMobile}
            />
            <MetricBadge
              icon={Clock}
              value={effectiveValues.time}
              format={(v) => formatTime(Math.round(v))}
              isOverridden={overrides.timeMul !== undefined}
              compact={isMobile}
            />
            <MetricBadge
              icon={Flame}
              value={effectiveValues.calPerG}
              format={(v) => `${Math.round(v)}cal/g`}
              isOverridden={overrides.caloriesMul !== undefined}
              compact={isMobile}
            />
            <MetricBadge
              icon={Leaf}
              value={effectiveValues.ethics}
              format={(v) => v.toFixed(1)}
              isOverridden={overrides.ethicsMul !== undefined}
              compact={isMobile}
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

