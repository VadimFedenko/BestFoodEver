import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  Clock, 
  DollarSign, 
  Utensils, 
  Heart,
  Flame,
  Leaf,
  Trophy,
  Medal,
  Award,
} from 'lucide-react';
import {
  formatTime,
  getScoreColor,
} from './dishCardUtils';

/**
 * Compact metric display for tile overlay
 */
function TileMetric({ icon: Icon, value, format }) {
  return (
    <div className="flex items-center gap-1 text-[10px]">
      <Icon size={10} className="text-white/50" />
      <span className="font-mono text-white/60 leading-none">
        {format(value)}
      </span>
    </div>
  );
}

/**
 * Ranking badge for top 3 positions only (transparent)
 */
function RankBadge({ rank }) {
  // Only show top 3, hide all others (4th, 9th, etc.)
  if (rank > 3) {
    return null;
  }

  // Trophy-style badges for top 3 - made transparent
  const configs = {
    1: {
      icon: Trophy,
      label: '1st',
    },
    2: {
      icon: Medal,
      label: '2nd',
    },
    3: {
      icon: Award,
      label: '3rd',
    },
  };

  const config = configs[rank];
  const IconComponent = config.icon;

  return (
    <div className="absolute top-2 right-2 z-10">
      <motion.div
        initial={{ scale: 0, rotate: -45 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ delay: 0.1, type: 'spring', stiffness: 300, damping: 20 }}
        className="flex items-center gap-1 px-2 py-1.5 rounded-xl bg-white/20 dark:bg-black/30 backdrop-blur-sm border border-white/20"
      >
        <IconComponent size={14} className="text-white/70" strokeWidth={2.5} />
        <span className="text-xs font-black text-white/70">
          {config.label}
        </span>
      </motion.div>
    </div>
  );
}

function getOrdinalSuffix(n) {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return s[(v - 20) % 10] || s[v] || s[0];
}

/**
 * Grid tile component for dish display
 */
export default function DishTile({ 
  dish, 
  rank,
  onClick, 
  overrides = {}, 
  priceUnit = 'serving',
  priorities = {},
}) {
  const scoreColors = getScoreColor(dish.score);
  
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
  
  // Filter metrics based on active priorities (only show if priority !== 0)
  const activeMetrics = useMemo(() => {
    const metrics = [];
    
    // Mapping priority keys to metric configs
    if (priorities.taste !== undefined && priorities.taste !== 0) {
      metrics.push({
        icon: Utensils,
        value: effectiveValues.taste,
        format: (v) => v.toFixed(1),
      });
    }
    
    if (priorities.health !== undefined && priorities.health !== 0) {
      metrics.push({
        icon: Heart,
        value: effectiveValues.health,
        format: (v) => v.toFixed(1),
      });
    }
    
    if (priorities.cheapness !== undefined && priorities.cheapness !== 0) {
      metrics.push({
        icon: DollarSign,
        value: effectiveValues.price,
        format: (v) => v.toFixed(2),
      });
    }
    
    if (priorities.speed !== undefined && priorities.speed !== 0) {
      metrics.push({
        icon: Clock,
        value: effectiveValues.time,
        format: (v) => formatTime(Math.round(v)),
      });
    }
    
    if (priorities.lowCalorie !== undefined && priorities.lowCalorie !== 0) {
      metrics.push({
        icon: Flame,
        value: effectiveValues.calPerG,
        format: (v) => `${Math.round(v)}c/g`,
      });
    }
    
    if (priorities.ethics !== undefined && priorities.ethics !== 0) {
      metrics.push({
        icon: Leaf,
        value: effectiveValues.ethics,
        format: (v) => v.toFixed(1),
      });
    }
    
    return metrics;
  }, [priorities, effectiveValues]);

  return (
    <motion.div
      onClick={onClick}
      whileHover={{ scale: 1.02, y: -4 }}
      whileTap={{ scale: 0.98 }}
      className="relative cursor-pointer group"
    >
      {/* Main tile container */}
      <div className="relative rounded-2xl overflow-hidden bg-black shadow-lg border border-surface-700/30 dark:border-surface-700/50">
        {/* Image container with aspect ratio */}
        <div className="relative aspect-[512/416]">
          {/* Dish image */}
          <img
            src={dish?.originalDish?.img_m || dish?.img_m}
            alt={dish.name}
            className="absolute inset-0 w-full h-full object-cover"
            loading="lazy"
          />
          
          {/* Gradient overlay for text legibility - only bottom portion */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" 
               style={{ backgroundImage: 'linear-gradient(to top, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.15) 30%, transparent 60%)' }} />
          
          {/* Score badge - top left */}
          <div className="absolute top-2 left-2 z-10">
            <div
              className={`
                px-2.5 py-2 rounded-xl
                flex items-center justify-center
                ${scoreColors.bg} ${scoreColors.glow}
                backdrop-blur-sm border border-white/20
              `}
            >
              <span className="text-xs font-display font-bold text-white leading-none">
                {dish.score}
              </span>
            </div>
          </div>
          
          {/* Rank badge - top right */}
          <RankBadge rank={rank} />
          
          {/* Metrics overlay - bottom */}
          {activeMetrics.length > 0 && (
            <div className="absolute bottom-0 left-0 right-0 px-3 pt-3 pb-1 z-10">
              {/* Metrics row - only active priorities */}
              <div className="flex flex-wrap gap-x-3 gap-y-1 mb-1.5">
                {activeMetrics.map((metric, idx) => (
                  <TileMetric
                    key={idx}
                    icon={metric.icon}
                    value={metric.value}
                    format={metric.format}
                  />
                ))}
              </div>
            </div>
          )}
          
          {/* Hover highlight effect */}
          <div className="absolute inset-0 bg-food-500/0 group-hover:bg-food-500/10 transition-colors duration-300 pointer-events-none" />
        </div>
      </div>
      
      {/* Dish name below the tile */}
      <div className="mt-2 px-1">
        <h3 className="font-display font-semibold text-sm text-surface-800/70 dark:text-surface-100/70 truncate text-center">
          {dish.name}
        </h3>
      </div>
    </motion.div>
  );
}

