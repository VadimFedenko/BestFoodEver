import { motion, AnimatePresence } from 'framer-motion';
import { 
  Clock, 
  DollarSign, 
  Utensils, 
  ChevronDown,
  Heart,
  RotateCcw,
  Info,
  AlertTriangle,
  Flame,
  Leaf,
} from 'lucide-react';
import InfoSlider from './dishCard/InfoSlider';
import MetricIndicator from './dishCard/MetricIndicator';
import {
  formatCurrency,
  formatTime,
  getEthicsColor,
  getHealthColor,
  getPriceUnitLabel,
  getScoreColor,
} from './dishCardUtils';


/**
 * Score breakdown bar
 */
function ScoreBar({ label, value, maxValue = 10, color }) {
  const percentage = (value / maxValue) * 100;
  
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-surface-500 dark:text-surface-400 w-16">{label}</span>
      <div className="flex-1 h-1.5 bg-surface-300 dark:bg-surface-700 rounded-full overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${color}`}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>
      <span className="text-xs font-mono text-surface-600 dark:text-surface-300 w-8 text-right">
        {value.toFixed(1)}
      </span>
    </div>
  );
}

/**
 * Ingredients list in two columns
 */
function IngredientsList({ ingredients }) {
  if (!ingredients || ingredients.length === 0) return null;
  
  // Split into two columns
  const midpoint = Math.ceil(ingredients.length / 2);
  const leftColumn = ingredients.slice(0, midpoint);
  const rightColumn = ingredients.slice(midpoint);
  
  return (
    <div className="bg-surface-100/80 dark:bg-surface-800/80 rounded-lg p-3">
      <h4 className="text-sm font-semibold text-surface-700 dark:text-surface-200 mb-2">
        Ingredients
      </h4>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1">
        <div className="space-y-1">
          {leftColumn.map((ing, idx) => (
            <div key={idx} className="text-xs text-surface-600 dark:text-surface-300 flex justify-between">
              <span className="truncate pr-2">{ing.name}</span>
              <span className="text-surface-500 font-mono">{ing.g}g</span>
            </div>
          ))}
        </div>
        <div className="space-y-1">
          {rightColumn.map((ing, idx) => (
            <div key={idx} className="text-xs text-surface-600 dark:text-surface-300 flex justify-between">
              <span className="truncate pr-2">{ing.name}</span>
              <span className="text-surface-500 font-mono">{ing.g}g</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Main Dish Card Component
 * Compact view with expandable details
 */
export default function DishCard({ dish, isExpanded, onToggle, onOverrideChange, overrides = {}, ingredientIndex, priceUnit = 'serving', priorities = {} }) {
  const scoreColors = getScoreColor(dish.score);

  // Calculate effective values (with overrides)
  const effectiveTaste = overrides.taste ?? dish.taste;
  const effectiveTime = overrides.time ?? dish.time;
  
  // Get the price for the selected unit
  const effectivePrice = dish.prices?.[priceUnit] ?? dish.cost;
  const kcalPer100g = (dish?.weight ?? 0) > 0 && (dish?.calories ?? 0) > 0
    ? ((dish.calories / dish.weight) * 100)
    : 0;

  const handleResetOverrides = () => {
    onOverrideChange(dish.name, {});
  };

  const hasAnyOverride = Object.keys(overrides).length > 0;
  const priceUnitLabel = getPriceUnitLabel(priceUnit);
  const missingIngredients = dish.missingIngredients || [];
  const missingPrices = dish.missingPrices || [];
  const unavailableIngredients = dish.unavailableIngredients || [];
  const hasDataWarnings = missingIngredients.length > 0 || missingPrices.length > 0;
  const hasUnavailableIngredients = unavailableIngredients.length > 0;

  // Get original ingredients from dish data
  const ingredients = dish.originalDish?.ingredients || [];

  const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
  const updateOverrides = (patch) => onOverrideChange(dish.name, { ...overrides, ...patch });

  // Handlers for metric adjustments
  const handleTasteChange = (delta) => {
    updateOverrides({ taste: clamp(effectiveTaste + delta, 0, 10) });
  };

  const handleTimeChange = (delta) => {
    updateOverrides({ time: Math.max(1, effectiveTime + delta) });
  };

  const handlePriceChange = (delta) => {
    // Always modify the base price (per serving)
    const basePrice = dish.prices?.serving ?? dish.baseCost ?? dish.cost;
    updateOverrides({ price: Math.max(0.1, basePrice + delta) });
  };

  return (
    <motion.div
      layout
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
        className="w-full p-4 flex items-center gap-3 text-left cursor-pointer"
      >
        {/* Score Badge */}
        <motion.div
          layout="position"
          className={`
            flex-shrink-0 w-12 h-12 rounded-xl
            flex items-center justify-center
            ${scoreColors.bg} ${scoreColors.glow}
          `}
        >
          <span className="text-lg font-display font-bold text-white">
            {dish.score}
          </span>
        </motion.div>

        {/* Main content */}
        <div className="flex-1 min-w-0">
          {/* Name and indicators row */}
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-display font-semibold text-surface-800 dark:text-surface-100 truncate">
              {dish.name}
            </h3>
            {hasAnyOverride && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-600 dark:text-amber-400 font-medium flex-shrink-0">
                Modified
              </span>
            )}
          </div>
          
          {/* Metric indicators row */}
          <div className="flex items-center mt-1.5 gap-6 flex-wrap">
            <MetricIndicator
              icon={Utensils}
              value={effectiveTaste}
              format={(v) => v.toFixed(1)}
              isEditing={isExpanded}
              onIncrement={() => handleTasteChange(0.1)}
              onDecrement={() => handleTasteChange(-0.1)}
              isOverridden={overrides.taste !== undefined}
              isAtMin={effectiveTaste <= 0}
              isAtMax={effectiveTaste >= 10}
            />
            <MetricIndicator
              icon={Heart}
              value={dish.health}
              format={(v) => v.toFixed(1)}
            />
            <MetricIndicator
              icon={DollarSign}
              value={effectivePrice}
              format={(v) => `${v.toFixed(2)}${priceUnitLabel}`}
              isEditing={isExpanded && priceUnit === 'serving'}
              onIncrement={() => handlePriceChange(0.5)}
              onDecrement={() => handlePriceChange(-0.5)}
              isOverridden={overrides.price !== undefined}
              isAtMin={effectivePrice <= 0.1}
            />
            <MetricIndicator
              icon={Clock}
              value={effectiveTime}
              format={formatTime}
              isEditing={isExpanded}
              onIncrement={() => handleTimeChange(5)}
              onDecrement={() => handleTimeChange(-5)}
              isOverridden={overrides.time !== undefined}
              isAtMin={effectiveTime <= 1}
            />
            <MetricIndicator
              icon={Flame}
              value={kcalPer100g}
              format={(v) => `${v.toFixed(0)}kcal/100g`}
            />
            <MetricIndicator
              icon={Leaf}
              value={dish.ethics}
              format={(v) => v.toFixed(1)}
            />
          </div>
        </div>

        {/* Reset button (when expanded and has overrides) */}
        {isExpanded && hasAnyOverride && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleResetOverrides();
            }}
            className="flex-shrink-0 p-2 rounded-lg text-amber-400 hover:bg-amber-500/10 transition-colors"
            title="Reset modifications"
          >
            <RotateCcw size={16} />
          </button>
        )}

        {/* Expand icon */}
        <ChevronDown 
          size={20} 
          className={`
            flex-shrink-0 text-surface-400 transition-transform
            ${isExpanded ? 'rotate-180' : ''}
          `}
        />
      </div>

      {/* Expanded Details */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-4">
              {/* Divider */}
              <div className="h-px bg-surface-300 dark:bg-surface-700" />

              {/* Unavailable ingredients notification */}
              {hasUnavailableIngredients && (
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
                  <div className="flex items-center gap-2 text-blue-300 mb-2">
                    <Info size={14} />
                    <span className="text-xs font-semibold">Dish cannot be prepared in your region</span>
                  </div>
                  <div className="space-y-1 text-xs text-surface-300">
                    {unavailableIngredients.map((ing, idx) => (
                      <div key={idx}>
                        <span className="font-semibold text-blue-300">Unavailable ingredient:</span>{' '}
                        <span className="font-mono">{ing.name} ({ing.grams} g)</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Data warnings */}
              {hasDataWarnings && (
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3">
                  <div className="flex items-center gap-2 text-amber-300 mb-2">
                    <AlertTriangle size={14} />
                    <span className="text-xs font-semibold">Data warnings</span>
                  </div>
                  <div className="space-y-1 text-xs text-surface-300">
                    {missingIngredients.length > 0 && (
                      <div>
                        <span className="font-semibold text-amber-300">Missing ingredients:</span>{' '}
                        <span className="font-mono">{missingIngredients.join(', ')}</span>
                      </div>
                    )}
                    {missingPrices.length > 0 && (
                      <div>
                        <span className="font-semibold text-amber-300">Missing prices:</span>{' '}
                        <span className="font-mono">{missingPrices.join(', ')}</span>
                      </div>
                    )}
                    <div className="text-[11px] text-surface-400">
                      Rankings may be less accurate for this dish.
                    </div>
                  </div>
                </div>
              )}

              {/* Description */}
              {dish.description && (
                <div className="bg-surface-100/80 dark:bg-surface-800/80 rounded-lg p-3">
                  <p className="text-sm text-surface-600 dark:text-surface-300 leading-relaxed">
                    {dish.description}
                  </p>
                </div>
              )}

              {/* Ingredients List */}
              <IngredientsList ingredients={ingredients} />

              {/* Score Breakdown */}
              <div>
                <h4 className="text-sm font-semibold text-surface-700 dark:text-surface-200 mb-3">
                  Score Breakdown
                </h4>
                <div className="space-y-2 bg-surface-100/80 dark:bg-surface-800/80 rounded-lg p-3">
                  {(() => {
                    // Get normalized values from normalizedMetrics (they are directly in normalizedMetrics, not in normalizedBase)
                    // normalizedMetrics structure: { taste, health, ethics, cheapness, speed, satiety, lowCalorie, applied: {...} }
                    const normalized = dish.normalizedMetrics || {};
                    
                    // Define all metrics with their labels and colors in the same order as PrioritiesPanel
                    const allMetrics = [
                      { key: 'taste', label: 'Taste', color: 'bg-food-500' },
                      { key: 'health', label: 'Health', color: 'bg-red-500' },
                      { key: 'cheapness', label: 'Budget', color: 'bg-emerald-400' },
                      { key: 'speed', label: 'Speed', color: 'bg-cyan-500' },
                      { key: 'satiety', label: 'Satiety', color: 'bg-amber-500' },
                      { key: 'lowCalorie', label: 'Low-Cal', color: 'bg-purple-500' },
                      { key: 'ethics', label: 'Ethics', color: 'bg-lime-500' },
                    ];
                    
                    // Filter to only show active metrics (with non-zero priority)
                    const activeMetrics = allMetrics.filter(metric => {
                      return priorities[metric.key] !== undefined && priorities[metric.key] !== 0;
                    });
                    
                    return activeMetrics.map(metric => {
                      // Get normalized value (0-10) from normalizedMetrics or fallback to raw value clamped to 0-10
                      let normalizedValue = normalized[metric.key];
                      
                      // If normalized value is not available, fallback to raw value (clamped to 0-10)
                      if (normalizedValue === undefined || normalizedValue === null) {
                        if (metric.key === 'taste') {
                          normalizedValue = Math.min(10, Math.max(0, dish.taste ?? 5));
                        } else if (metric.key === 'health') {
                          normalizedValue = Math.min(10, Math.max(0, dish.health ?? 5));
                        } else if (metric.key === 'satiety') {
                          // For satiety, we should use normalized value, but if not available, use 5 as default
                          normalizedValue = 5;
                        } else if (metric.key === 'ethics') {
                          normalizedValue = Math.min(10, Math.max(0, dish.ethics ?? 5));
                        } else {
                          // For other metrics (cheapness, speed, lowCalorie), default to 5 if not normalized
                          normalizedValue = 5;
                        }
                      }
                      
                      // Ensure value is in 0-10 range
                      normalizedValue = Math.min(10, Math.max(0, normalizedValue));
                      
                      return (
                        <ScoreBar 
                          key={metric.key}
                          label={metric.label} 
                          value={normalizedValue} 
                          color={metric.color}
                        />
                      );
                    });
                  })()}
                </div>
              </div>

              {/* Optimized cooking comment */}
              {dish.optimizedComment && (
                <div className="bg-surface-100/80 dark:bg-surface-800/80 rounded-lg p-3 border-l-2 border-food-500">
                  <p className="text-xs text-surface-500 dark:text-surface-400 mb-1 font-medium">Optimization Tip</p>
                  <p className="text-sm text-surface-600 dark:text-surface-300">
                    {dish.optimizedComment}
                  </p>
                </div>
              )}

              {/* Info Slider (Index Map / Health / Ethics) */}
              <InfoSlider 
                dish={dish}
                dishName={dish.name}
                dishHealth={dish.health}
                dishEthics={dish.ethics}
                ingredients={ingredients}
                ingredientIndex={ingredientIndex}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
