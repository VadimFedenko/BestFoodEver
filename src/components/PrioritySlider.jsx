import { motion } from 'framer-motion';

/**
 * Single vertical slider component styled like audio mixer fader
 * Range: 0-10 with reversible labels
 */
export default function PrioritySlider({ 
  config, 
  value, 
  percentage, 
  onChange, 
  onDragStart, 
  onToggleReverse, 
  isDark = false 
}) {
  const isReversed = value < 0;
  const absValue = Math.abs(value);
  const isActive = absValue !== 0;
  
  // Select icon and label based on reversed state
  const Icon = isReversed ? config.negativeIcon : config.positiveIcon;
  const label = isReversed ? config.negativeLabel : config.positiveLabel;
  
  // Select gradient color based on theme and reversed state
  const gradientColor = isReversed 
    ? (isDark ? config.negativeColorDark : config.negativeColor)
    : (isDark ? config.colorDark : config.color);
  
  const currentIconColor = isReversed ? config.negativeIconColor : config.iconColor;

  // Format display value
  const displayValue = isActive 
    ? (percentage !== undefined ? `${percentage}%` : absValue)
    : 'Off';

  return (
    <div className="flex flex-col items-center gap-1 sm:gap-1.5">
      {/* Value indicator at top */}
      <div 
        className={`
          font-mono text-sm font-medium min-w-[40px] text-center
          transition-colors duration-200
          ${isActive 
            ? 'text-surface-600 dark:text-surface-400'
            : 'text-surface-400 dark:text-surface-500'
          }
        `}
      >
        {displayValue}
      </div>

      {/* Slider track container - responsive height */}
      <div className="relative h-[100px] sm:h-[110px] md:h-[120px] w-10 flex items-center justify-center">
        {/* Track background with gradient */}
        <div className="absolute inset-x-0 mx-auto w-2 h-full rounded-full bg-surface-300 dark:bg-surface-700 overflow-hidden">
          {/* Active fill - grows from bottom */}
          <motion.div
            className={`absolute left-0 right-0 bottom-0 bg-gradient-to-t ${isActive ? gradientColor : 'from-surface-400 to-surface-500'}`}
            initial={false}
            animate={{
              height: `${absValue * 10}%`,
              opacity: isActive ? 1 : 0.3,
            }}
            transition={{ type: 'tween', duration: 0.15, ease: 'easeOut' }}
          />
        </div>

        {/* The actual range input - 0 to 10 */}
        <input
          type="range"
          min="0"
          max="10"
          step="0.1"
          value={absValue}
          onPointerDown={onDragStart}
          onChange={(e) => {
            const val = parseFloat(e.target.value);
            const roundedVal = Math.round(val);
            // Preserve the sign (reversed state)
            const newValue = isReversed ? -roundedVal : roundedVal;
            onChange(newValue);
          }}
          className="vertical-slider absolute opacity-0 cursor-pointer z-10"
          style={{ 
            writingMode: 'vertical-lr',
            direction: 'rtl',
            width: '40px',
            height: '100%',
          }}
        />

        {/* Custom thumb visualization */}
        <motion.div
          className={`
            absolute left-1/2 -translate-x-1/2 w-8 h-4 rounded-md
            shadow-lg cursor-pointer pointer-events-none
            border-2
            ${isActive 
              ? `bg-gradient-to-b ${gradientColor} border-white/90` 
              : 'bg-surface-500 border-surface-400/50'
            }
          `}
          initial={false}
          animate={{
            bottom: `${absValue * 10}%`,
            opacity: isActive ? 1 : 0.6,
          }}
          transition={{ type: 'tween', duration: 0.15, ease: 'easeOut' }}
          style={{ marginBottom: '-8px' }}
        >
          {/* Grip lines */}
          <div className="absolute inset-x-2 top-1/2 -translate-y-1/2 flex flex-col gap-0.5">
            <div className={`h-0.5 rounded-full ${isActive ? 'bg-white/40' : 'bg-white/20'}`} />
            <div className={`h-0.5 rounded-full ${isActive ? 'bg-white/40' : 'bg-white/20'}`} />
          </div>
        </motion.div>
      </div>

      {/* Label and icon - clickable to toggle reverse */}
      <button
        onClick={onToggleReverse}
        className={`
          relative flex flex-col items-center gap-0.5 p-0.5 rounded-lg mt-0.5
          transition-all duration-200 hover:bg-surface-200/50 dark:hover:bg-surface-700/50
          active:scale-95 cursor-pointer select-none
        `}
        title={`Click to switch to ${isReversed ? config.positiveLabel : config.negativeLabel}`}
      >
        <div className="relative">
          <Icon 
            size={18} 
            className={`transition-colors ${isActive ? currentIconColor : 'text-surface-400'}`} 
          />
          {isReversed && (
            <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-rose-500 dark:bg-rose-400" />
          )}
        </div>
        <span className={`
          text-[10px] sm:text-xs font-medium transition-colors whitespace-nowrap
          ${isActive ? 'text-surface-800 dark:text-surface-100' : 'text-surface-500 dark:text-surface-400'}
        `}>
          {label}
        </span>
      </button>
    </div>
  );
}

