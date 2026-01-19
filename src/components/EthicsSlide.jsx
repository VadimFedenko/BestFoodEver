import { m } from '../lib/motion';
import { Leaf, Skull, Frown } from '../icons/lucide';
import { getEthicsColor } from './dishCardUtils';
import { normalizeIngredientName } from '../lib/RankingEngine';
import { useTranslation } from 'react-i18next';

function getEthicsIcon(index) {
  if (index < 2) return Skull;
  if (index < 4) return Frown;
  return Leaf;
}

export default function EthicsSlide({ dish, ingredients, ingredientIndex }) {
  const { t } = useTranslation();
  if (!ingredients?.length || !ingredientIndex) {
    return <div className="flex items-center justify-center h-40 text-surface-500 text-sm sm:text-base">{t('slides.ethics.noData')}</div>;
  }

  const dishName = dish?.displayName ?? dish?.name ?? '';

  const ingredientsWithEthics = ingredients
    .map((ing) => {
      const ingData = ingredientIndex.get(normalizeIngredientName(ing.name));
      const ethicsIndex = ingData?.ethics_index;
      if (ethicsIndex === null || ethicsIndex === undefined) return null;
      return {
        name: ing.name,
        displayName: ing.displayName ?? ing.name,
        grams: ing.g,
        ethicsIndex,
        ethicsReason: ingData?.ethics_reason ?? t('slides.ethics.noEthicsData'),
      };
    })
    .filter(Boolean);

  const ethicsColors = getEthicsColor(dish?.ethics ?? 5);

  return (
    <div className="space-y-2 sm:space-y-3">
      <div className="flex items-center justify-between p-2.5 sm:p-4 bg-surface-100/80 dark:bg-surface-800/80 rounded-lg">
        <div className="flex items-center gap-2 sm:gap-3">
          <Leaf size={16} className={`${ethicsColors.text} sm:w-5 sm:h-5`} />
          <span className="text-sm sm:text-base font-semibold text-surface-700 dark:text-surface-200">{dishName} {t('slides.ethics.ethicsBreakdown')}</span>
        </div>
        <div className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs sm:text-sm font-bold text-white ${ethicsColors.badge}`}>
          {t('slides.ethics.overall')} {(dish?.ethics ?? 5).toFixed(1)}/10
        </div>
      </div>

      <div className="space-y-1 sm:space-y-2 overflow-y-auto overflow-x-hidden pr-1">
        {ingredientsWithEthics.map((ing, idx) => {
          const colors = getEthicsColor(ing.ethicsIndex ?? 5);
          const Icon = getEthicsIcon(ing.ethicsIndex ?? 5);

          return (
            <m.div
              key={idx}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.03 }}
              className={`rounded-lg p-2 sm:p-3 border ${colors.bg} ${colors.border}`}
            >
              <div className="flex items-center justify-between mb-1.5 sm:mb-2">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <Icon size={12} className={`${colors.text} flex-shrink-0 sm:w-4 sm:h-4`} />
                  <span className="font-semibold text-surface-800 dark:text-surface-100 text-xs sm:text-sm">
                    {ing.grams}{t('slides.gramsUnit')} {ing.displayName ?? ing.name}
                  </span>
                </div>
                {ing.ethicsIndex !== null && (
                  <span className={`px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-bold text-white flex-shrink-0 ${colors.badge}`}>
                    {ing.ethicsIndex}/10
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm text-surface-600 dark:text-surface-300 leading-relaxed">
                {ing.ethicsReason}
              </p>
            </m.div>
          );
        })}
      </div>
    </div>
  );
}

