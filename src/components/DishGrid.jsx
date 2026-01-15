import { lazy, Suspense } from 'react';
import DishTile from './DishTile';
import { DishCollectionShell } from './DishListCommon';
import { prefsActions } from '../store/prefsStore';
import { useDishCollectionView } from '../hooks/useDishCollectionView';

const DishModal = lazy(() => import('./DishModal'));

/**
 * Main Dish Grid Component
 * Displays a responsive grid of dish tiles
 */
export default function DishGrid({ 
  dishes, 
  analysisVariants = null,
  rankingMeta = null,
  isLoading = false,
  error = null,
  onRetry = null,
  onScrollContainerChange = null,
}) {
  const pageSize = 30; // Smaller for grid since tiles are larger
  const {
    searchQuery,
    setSearchQuery,
    filteredDishes,
    visibleDishes,
    remaining,
    showMore,
    dishRankMap,
    selectedDish,
    openDish,
    closeDish,
    hasOpenedModal,
    shouldHideContent,
    setScrollContainerEl,
    priceUnit,
    isOptimized,
    priorities,
  } = useDishCollectionView({ dishes, pageSize, onScrollContainerChange });

  return (
    <>
      <DishCollectionShell
        dishes={dishes}
        filteredDishes={filteredDishes}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        priceUnit={priceUnit}
        onPriceUnitChange={(u) => prefsActions.setPref({ priceUnit: u })}
        isLoading={isLoading}
        error={error}
        onRetry={onRetry}
        variant="grid"
        shouldHideContent={shouldHideContent}
        setScrollContainerEl={setScrollContainerEl}
        contentClassName="px-4 pt-3 pb-4"
        remaining={remaining}
        onShowMore={showMore}
        showMoreClassName="mt-6"
      >
        {/* Responsive CSS Grid: 1 col < 440px, 2 cols 440-660px, 3 cols > 660px */}
        <div className="grid grid-cols-1 min-[440px]:grid-cols-2 min-[660px]:grid-cols-3 gap-3">
          {visibleDishes.map((dish) => (
            <DishTile
              key={dish.id}
              dish={dish}
              rank={dishRankMap.get(dish.id)}
              onClick={() => openDish(dish)}
              priceUnit={priceUnit}
              priorities={priorities || {}}
            />
          ))}
        </div>
      </DishCollectionShell>
      
      {/* Dish Modal */}
      {hasOpenedModal && (
        <Suspense fallback={null}>
          <DishModal
            dish={selectedDish}
            isOpen={selectedDish !== null}
            onClose={closeDish}
            priorities={priorities}
            isOptimized={isOptimized}
            analysisVariants={analysisVariants}
            rankingMeta={rankingMeta}
            priceUnit={priceUnit}
          />
        </Suspense>
      )}
    </>
  );
}

