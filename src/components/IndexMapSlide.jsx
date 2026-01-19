import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Map as MapIcon, X, Loader2 } from '../icons/lucide';
import { ECONOMIC_ZONES, calculateDishCost } from '../lib/RankingEngine';
import { getPriceColor } from './dishCardUtils';
import EconomicZonesSvgMap from './EconomicZonesSvgMap';
import ZoneIcon from './ZoneIcon';
import { tZoneName, tIngredientName, tDishName } from '../i18n/dataTranslations';

export default function IndexMapSlide({ dish, ingredientIndex, isMobile, defaultSelectedZone }) {
  const { t } = useTranslation();
  const [hoveredZone, setHoveredZone] = useState(null);
  const [selectedZone, setSelectedZone] = useState(defaultSelectedZone || null);
  const [zonePrices, setZonePrices] = useState({});
  const [zoneBreakdowns, setZoneBreakdowns] = useState({});
  const [isCalculating, setIsCalculating] = useState(true);
  const calculationRef = useRef({ dishId: null, ingredientIndex: null });

  // Calculate prices only when the slide opens or when dish/ingredientIndex changes
  useEffect(() => {
    const currentDishId = dish?.originalDish?.id || dish?.id;
    const currentIngredientIndex = ingredientIndex;

    // Check if recalculation is needed
    if (!dish?.originalDish || !ingredientIndex) {
      setZonePrices({});
      setZoneBreakdowns({});
      setIsCalculating(false);
      return;
    }

    // If data is already calculated for this dish, don't recalculate
    if (
      calculationRef.current.dishId === currentDishId && 
      calculationRef.current.ingredientIndex === currentIngredientIndex
    ) {
      // Data is already calculated, just make sure loading state is cleared
      setIsCalculating(prev => prev ? false : prev);
      return;
    }

    // Reset state when dish changes
    setZonePrices({});
    setZoneBreakdowns({});
    setIsCalculating(true);
    calculationRef.current = { dishId: currentDishId, ingredientIndex: currentIngredientIndex };

    // Use setTimeout to defer calculations to the next event loop tick
    // This allows the UI to render first
    const timeoutId = setTimeout(() => {
      // Check that component is still mounted and data hasn't changed
      if (
        calculationRef.current.dishId !== currentDishId ||
        calculationRef.current.ingredientIndex !== currentIngredientIndex
      ) {
        return; // Data has changed, stop calculations
      }

      const prices = {};
      const breakdowns = {};

      // Calculate prices for all 11 zones
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

      // Check once more before updating state
      if (
        calculationRef.current.dishId === currentDishId &&
        calculationRef.current.ingredientIndex === currentIngredientIndex
      ) {
        setZonePrices(prices);
        setZoneBreakdowns(breakdowns);
        setIsCalculating(false);
      }
    }, 0);

    // Cleanup: cancel timeout when dependencies change
    // Data is automatically reset when component unmounts
    return () => {
      clearTimeout(timeoutId);
      // When component unmounts (exiting the slide), all states are lost
      // On next slide opening, data will be recalculated
      calculationRef.current = { dishId: null, ingredientIndex: null };
    };
  }, [dish?.originalDish, dish?.id, ingredientIndex]);

  const available = Object.values(zonePrices).filter(p => p !== null && p > 0);
  const { minPrice, maxPrice, avgPrice } = available.length === 0 
    ? { minPrice: 0, maxPrice: 0, avgPrice: 0 }
    : {
        minPrice: Math.min(...available),
        maxPrice: Math.max(...available),
        avgPrice: available.reduce((a, b) => a + b, 0) / available.length,
      };

  const priceSpread = maxPrice > 0 && minPrice > 0 ? (((maxPrice - minPrice) / minPrice) * 100).toFixed(0) : 0;

  const getZoneFill = (zoneId) => {
    if (isCalculating || zonePrices[zoneId] === undefined) {
      return 'rgba(148, 163, 184, 0.3)'; // Gray color for loading
    }
    return getPriceColor(zonePrices[zoneId], minPrice, maxPrice).fill;
  };
  
  const getZoneOpacity = (zoneId, sel, hov) => (hov || sel === zoneId) ? 1 : 0.85;
  const getZoneStroke = (zoneId, hov, sel) => (hov || sel) ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.15)';
  const getZoneStrokeWidth = (zoneId, hov, sel) => (hov || sel) ? 1.5 : 0.5;
  
  const getTooltipContent = (zoneId, zoneData) => {
    const price = isCalculating ? undefined : zonePrices[zoneId];
    const translatedName = tZoneName(t, zoneId) || zoneData.name;
    return {
      ...zoneData,
      name: translatedName,
      price,
      priceColor: price === null || price === undefined 
        ? 'text-surface-500' 
        : getPriceColor(price, minPrice, maxPrice).text,
    };
  };

  const activeZone = selectedZone || hoveredZone;
  const currentZone = activeZone ? ECONOMIC_ZONES[activeZone] : null;
  const currentPrice = activeZone ? zonePrices[activeZone] : null;
  const currentBreakdown = activeZone ? zoneBreakdowns[activeZone] : null;

  const sortedBreakdown = currentBreakdown 
    ? [...currentBreakdown].filter(i => i.cost > 0).sort((a, b) => b.cost - a.cost)
    : [];

  return (
    <div className="space-y-2 sm:space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 sm:gap-3">
          <MapIcon size={14} className="text-food-500 sm:w-5 sm:h-5" />
          <span className="text-sm sm:text-base font-semibold text-surface-700 dark:text-surface-200">
            {tDishName(t, dish)} {t('slides.indexMap.costIndex')}
          </span>
        </div>
        {priceSpread > 0 && (
          <span className="px-1.5 sm:px-2 py-0.5 sm:py-1 rounded text-[10px] sm:text-xs font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400">
            {priceSpread}{t('slides.indexMap.spread')}
          </span>
        )}
      </div>

      {isCalculating && Object.keys(zonePrices).length === 0 ? (
        <div className="flex items-center justify-center py-12 sm:py-16">
          <div className="flex flex-col items-center gap-3 text-surface-500">
            <Loader2 size={24} className="animate-spin text-food-500 sm:w-8 sm:h-8" />
            <span className="text-sm sm:text-base">{t('slides.indexMap.calculating')}</span>
          </div>
        </div>
      ) : (
        <>
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
              zonePrices={zonePrices}
              minPrice={minPrice}
              maxPrice={maxPrice}
            />
          </div>

          <div className="flex items-center justify-between text-[9px] text-surface-500 px-0.5">
            <span className="flex items-center gap-1"><div className="w-2 h-2 rounded" style={{ background: 'rgb(34, 197, 94)' }} />{t('slides.indexMap.cheap')}</span>
            <div className="flex-1 h-1 mx-2 rounded-full" style={{ background: 'linear-gradient(to right, rgb(34, 197, 94), rgb(250, 204, 21), rgb(249, 115, 22), rgb(239, 68, 68))' }} />
            <span className="flex items-center gap-1">{t('slides.indexMap.expensive')}<div className="w-2 h-2 rounded" style={{ background: 'rgb(239, 68, 68)' }} /></span>
          </div>

          {activeZone && currentZone && currentBreakdown && (
            <div className="bg-surface-100/80 dark:bg-surface-800/80 rounded-lg p-2.5">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5">
                  <ZoneIcon zoneId={activeZone} size={16} />
                    <span className="text-xs font-semibold text-surface-700 dark:text-surface-200">{tZoneName(t, activeZone) || currentZone.name}</span>
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
                    <span className="flex-1 truncate text-surface-600 dark:text-surface-300">{tIngredientName(t, item.name)}, {item.netWeight || 0}{t('slides.gramsUnit')}</span>
                    <span className="font-bold font-mono text-surface-700 dark:text-surface-200 w-10 text-right">${item.cost.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <p className="text-[9px] text-surface-500 text-center">{t('slides.indexMap.tapToSee')}</p>
        </>
      ) : (
        // Desktop: horizontal layout (map on left, data on right)
        <div className="flex gap-4 sm:gap-6">
          <div className="flex-shrink-0 w-[55%] space-y-2 sm:space-y-3">
            <div className="rounded-lg overflow-hidden bg-surface-800/50">
              <EconomicZonesSvgMap
                selectedZone={selectedZone}
                onZoneSelect={(z) => setSelectedZone(selectedZone === z ? null : z)}
                hoveredZone={hoveredZone}
                onHoveredZoneChange={setHoveredZone}
                zoom={1.25}
                className="w-full"
                svgStyle={{ height: '280px' }}
                getZoneFill={getZoneFill}
                getZoneOpacity={getZoneOpacity}
                getZoneStroke={getZoneStroke}
                getZoneStrokeWidth={getZoneStrokeWidth}
                getTooltipContent={getTooltipContent}
                transformOffset="245 25"
                backgroundFill="rgba(15, 23, 42, 0.5)"
                showTooltip={true}
                zonePrices={zonePrices}
                minPrice={minPrice}
                maxPrice={maxPrice}
              />
            </div>

            <div className="flex items-center justify-between text-[9px] sm:text-xs text-surface-500 px-0.5">
              <span className="flex items-center gap-1"><div className="w-2 h-2 sm:w-3 sm:h-3 rounded" style={{ background: 'rgb(34, 197, 94)' }} />{t('slides.indexMap.cheap')}</span>
              <div className="flex-1 h-1 sm:h-1.5 mx-2 rounded-full" style={{ background: 'linear-gradient(to right, rgb(34, 197, 94), rgb(250, 204, 21), rgb(249, 115, 22), rgb(239, 68, 68))' }} />
              <span className="flex items-center gap-1">{t('slides.indexMap.expensive')}<div className="w-2 h-2 sm:w-3 sm:h-3 rounded" style={{ background: 'rgb(239, 68, 68)' }} /></span>
            </div>

            <p className="text-[9px] sm:text-xs text-surface-500 text-center">{t('slides.indexMap.clickToSee')}</p>
          </div>

          <div className="flex-1 min-w-0 h-[280px] flex flex-col">
            {activeZone && currentZone && currentBreakdown && (
              <div className="bg-surface-100/80 dark:bg-surface-800/80 rounded-lg p-2.5 sm:p-4 h-full flex flex-col">
                <div className="flex items-center justify-between mb-1.5 sm:mb-3 flex-shrink-0">
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <ZoneIcon zoneId={activeZone} size={16} className="sm:w-5 sm:h-5" />
                    <span className="text-xs sm:text-sm font-semibold text-surface-700 dark:text-surface-200">{tZoneName(t, activeZone) || currentZone.name}</span>
                  </div>
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <span className={`text-sm sm:text-lg font-bold font-mono ${getPriceColor(currentPrice, minPrice, maxPrice).text}`}>
                      ${currentPrice?.toFixed(2) ?? 'N/A'}
                    </span>
                    {selectedZone && <button onClick={() => setSelectedZone(null)} className="p-0.5 sm:p-1 rounded text-surface-400 hover:text-surface-600"><X size={12} className="sm:w-4 sm:h-4" /></button>}
                  </div>
                </div>
                <div className="space-y-0.5 sm:space-y-1.5 flex-1 overflow-y-auto">
                  {sortedBreakdown.slice(0, 8).map((item) => (
                    <div key={item.name} className="flex items-center gap-1.5 sm:gap-3 text-[11px] sm:text-sm">
                      <span className="flex-1 truncate text-surface-600 dark:text-surface-300">{tIngredientName(t, item.name)}, {item.netWeight || 0}{t('slides.gramsUnit')}</span>
                      <span className="font-bold font-mono text-surface-700 dark:text-surface-200 w-10 sm:w-14 text-right">${item.cost.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
        )}
        </>
      )}
    </div>
  );
}

