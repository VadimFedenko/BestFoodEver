import { m } from '../lib/motion';
import { Heart } from '../icons/lucide';
import { getHealthColor, getCookingLabel, getCookingEffect } from './dishCardUtils';
import { getCookingCoef, normalizeIngredientName } from '../lib/RankingEngine';

export default function HealthSlide({ dish, ingredients, ingredientIndex }) {
  if (!ingredients?.length || !ingredientIndex) {
    return <div className="flex items-center justify-center h-40 text-surface-500 text-sm sm:text-base">No ingredient data available</div>;
  }

  const dishName = dish?.displayName ?? dish?.name ?? '';

  const ingredientsWithHealth = ingredients
    .map((ing) => {
      const ingData = ingredientIndex.get(normalizeIngredientName(ing.name));
      const baseHealth = ingData?.health_index;
      if (baseHealth === null || baseHealth === undefined) return null;
      const cookingCoef = getCookingCoef(ing.state);
      const adjustedHealth = Math.min(10, Math.max(0, baseHealth * cookingCoef));
      return {
        name: ing.name,
        displayName: ing.displayName ?? ing.name,
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
    <div className="space-y-2 sm:space-y-3">
      <div className="flex items-center justify-between p-2.5 sm:p-4 bg-surface-100/80 dark:bg-surface-800/80 rounded-lg">
        <div className="flex items-center gap-2 sm:gap-3">
          <Heart size={16} className={`${healthColors.text} sm:w-5 sm:h-5`} />
          <span className="text-sm sm:text-base font-semibold text-surface-700 dark:text-surface-200">{dishName} Health Breakdown</span>
        </div>
        <div className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs sm:text-sm font-bold text-white ${healthColors.badge}`}>
          Overall {(dish?.health ?? 5).toFixed(1)}/10
        </div>
      </div>

      <div className="space-y-1 sm:space-y-2 overflow-y-auto overflow-x-hidden pr-1">
        {sortedIngredients.map((ing, idx) => {
          const colors = getHealthColor(ing.adjustedHealth);
          const healthPercent = (ing.adjustedHealth / 10) * 100;
          const hasImpact = ing.cookingCoef !== 1.0;
          const impactPercent = ((ing.cookingCoef - 1) * 100).toFixed(0);

          return (
            <m.div
              key={idx}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.03 }}
              className={`rounded-lg p-2 sm:p-3 border ${colors.bg} ${colors.border}`}
            >
              <div className="flex items-center justify-between mb-1 sm:mb-2">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <Heart size={10} className={`${colors.text} sm:w-3.5 sm:h-3.5`} />
                  <span className="font-semibold text-surface-800 dark:text-surface-100 text-xs sm:text-sm">{ing.grams}g {ing.displayName ?? ing.name}</span>
                </div>
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <span className={`px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-[9px] sm:text-xs font-medium ${hasImpact ? 'bg-surface-200/60 dark:bg-surface-700/60' : ''} ${ing.cookingEffect.color}`}>
                    {ing.cookingLabel}
                    {hasImpact && <span className="ml-0.5 opacity-75">{ing.cookingEffect.icon}</span>}
                  </span>
                  {hasImpact && (
                    <span className={`text-[9px] sm:text-xs font-mono ${ing.cookingCoef > 1 ? 'text-emerald-500' : 'text-rose-400'}`}>
                      {ing.cookingCoef > 1 ? '+' : ''}{impactPercent}%
                    </span>
                  )}
                  <span className={`px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-bold text-white ${colors.badge}`}>
                    {ing.adjustedHealth.toFixed(1)}
                  </span>
                </div>
              </div>
              <div className="h-1 sm:h-1.5 bg-surface-300/60 dark:bg-surface-700/60 rounded-full overflow-hidden">
                <m.div
                  className={`h-full rounded-full ${colors.bar}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${healthPercent}%` }}
                  transition={{ duration: 0.3, delay: idx * 0.03 }}
                />
              </div>
            </m.div>
          );
        })}
      </div>
    </div>
  );
}

