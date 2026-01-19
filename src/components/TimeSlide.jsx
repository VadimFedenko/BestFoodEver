import { m } from '../lib/motion';
import { Timer, Zap, ArrowDown } from '../icons/lucide';
import { getPassiveTimePenalty } from '../lib/RankingEngine';
import { useTranslation } from 'react-i18next';
import { tDishComment } from '../i18n/dataTranslations';

export default function TimeSlide({ dish, isOptimized }) {
  const { t } = useTranslation();
  const dishName = dish?.displayName || dish?.name || 'This dish';
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
  const optimizedComment = tDishComment(t, dish);

  const hasUserTimeOverride = !!dish?.hasOverrides?.time;

  const formatPassiveTime = (h) => h < 1 ? `${Math.round(h * 60)} ${t('slides.time.min')}` : h === 1 ? `1 ${t('slides.time.hour')}` : `${h} ${t('slides.time.hours')}`;

  return (
    <div className="space-y-3 sm:space-y-4">
      <div className="bg-surface-100/80 dark:bg-surface-800/80 rounded-lg p-3 sm:p-5">
        <div className="flex items-center justify-between mb-2 sm:mb-3">
          <div className="flex items-center gap-2">
            <Timer size={14} className="text-cyan-500 sm:w-5 sm:h-5" />
            <span className="text-xs sm:text-sm font-semibold text-surface-700 dark:text-surface-200 uppercase tracking-wide">{t('slides.time.standardCooking')}</span>
          </div>
          <div className="px-2 sm:px-3 py-0.5 sm:py-1 rounded text-xs sm:text-sm font-bold bg-cyan-500/15 text-cyan-600 dark:text-cyan-400">
            {finalSpeedScore.toFixed(1)}/10
          </div>
        </div>

        <p className="text-xs sm:text-base text-surface-600 dark:text-surface-300 leading-relaxed mb-2 sm:mb-3">
          <span className="font-semibold text-surface-800 dark:text-surface-100">{dishName}</span> {t('slides.time.requires')}{' '}
          <span className="font-mono font-semibold text-cyan-600 dark:text-cyan-400">{prepTimeNormal} {t('slides.time.min')}</span> {t('slides.time.ofPreparation')}
          {cookTimeNormal > 0 ? (
            <> {t('slides.time.and')} <span className="font-mono font-semibold text-cyan-600 dark:text-cyan-400">{cookTimeNormal} {t('slides.time.min')}</span> {t('slides.time.ofCooking')}</>
          ) : null}.
        </p>

        <div className="bg-surface-200/50 dark:bg-surface-700/50 rounded-lg p-2 sm:p-3 mb-2 sm:mb-3">
          <div className="flex items-center justify-between text-[9px] sm:text-xs text-surface-500 mb-1 sm:mb-2">
            <span>{t('slides.time.slowest')}</span>
            <span>{t('slides.time.speedPercentile')}</span>
            <span>{t('slides.time.fastest')}</span>
          </div>
          <div className="relative h-1.5 sm:h-2.5 bg-surface-300 dark:bg-surface-600 rounded-full overflow-hidden">
            <m.div
              className="absolute top-0 left-0 h-full bg-gradient-to-r from-cyan-500 to-emerald-500 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${speedPercentile}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
          <p className="text-[10px] sm:text-sm text-center text-cyan-600 dark:text-cyan-400 mt-1 sm:mt-2">
            {t('slides.time.fasterThan')} {speedPercentile}{t('slides.time.ofDishes')}
          </p>
        </div>

        {/* Speed score explanation */}
        {hasUserTimeOverride ? (
          <p className="text-xs sm:text-base text-amber-600 dark:text-amber-400 font-medium">
            {t('slides.time.timeChanged')} <span className="font-mono">{finalSpeedScore.toFixed(1)}/10</span>
          </p>
        ) : (
          <p className="text-xs sm:text-base text-surface-600 dark:text-surface-300">
            {t('slides.time.receivesScore')}{' '}
            <span className="font-mono font-semibold text-cyan-600 dark:text-cyan-400">≈{speedScoreBeforePenalty.toFixed(1)}/10</span>.
          </p>
        )}

        {passiveTimeHours > 0 && (
          <div className="mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-surface-200 dark:border-surface-700">
            <p className="text-xs sm:text-base text-surface-600 dark:text-surface-300">
              <span className="text-amber-600 dark:text-amber-400 font-semibold">+{formatPassiveTime(passiveTimeHours)}</span> {t('slides.time.passiveTimeApplies')}{' '}
              <span className="text-rose-500 font-semibold">{passivePenalty} {t('slides.time.pointPenalty')}</span>
              {t('slides.time.finalSpeedScore')} <span className="font-mono font-bold text-cyan-600">{finalSpeedScore.toFixed(1)}/10</span>
            </p>
          </div>
        )}
      </div>

      {(prepChanged || cookChanged) && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3 sm:p-5">
          <div className="flex items-center justify-between mb-2 sm:mb-3">
            <div className="flex items-center gap-2">
              <Zap size={14} className="text-emerald-500 sm:w-5 sm:h-5" />
              <span className="text-xs sm:text-sm font-semibold text-emerald-700 dark:text-emerald-300 uppercase">{t('slides.time.timeOptimized')}</span>
            </div>
            <span className="text-xs sm:text-sm font-bold text-emerald-600 dark:text-emerald-400">-{percentReduction}%</span>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:gap-6 mb-2 sm:mb-3">
            <div>
              <div className="text-[10px] sm:text-xs text-surface-500">{t('slides.time.prep')}</div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="font-semibold text-surface-700 dark:text-surface-200 sm:text-lg">{prepTimeOptimized} {t('slides.time.min')}</span>
                {prepChanged && <span className="flex items-center text-emerald-500 text-[10px] sm:text-sm"><ArrowDown size={10} className="sm:w-3 sm:h-3" />{prepTimeNormal - prepTimeOptimized}</span>}
              </div>
            </div>
            <div>
              <div className="text-[10px] sm:text-xs text-surface-500">{t('slides.time.cook')}</div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="font-semibold text-surface-700 dark:text-surface-200 sm:text-lg">{cookTimeOptimized} {t('slides.time.min')}</span>
                {cookChanged && <span className="flex items-center text-emerald-500 text-[10px] sm:text-sm"><ArrowDown size={10} className="sm:w-3 sm:h-3" />{cookTimeNormal - cookTimeOptimized}</span>}
              </div>
            </div>
          </div>

          {optimizedComment && (
            <div className="bg-white/50 dark:bg-surface-800/50 rounded p-2 sm:p-3 border-l-2 border-emerald-500">
              <p className="text-[11px] sm:text-sm text-surface-600 dark:text-surface-300 italic">"{optimizedComment}"</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

