import { lazy, Suspense } from 'react';
import DishCardSimple from './DishCardSimple';
import { DishCollectionShell } from './DishListCommon';
import { prefsActions } from '../store/prefsStore';
import { useDishCollectionView } from '../hooks/useDishCollectionView';

const DishModal = lazy(() => import('./DishModal'));

/**
 * Main Dish List Component
 * Displays a scrollable, filterable list of ranked dishes
 */
export default function DishList({ 
  dishes, 
  analysisVariants = null,
  rankingMeta = null,
  isLoading = false,
  error = null,
  onRetry = null,
  onScrollContainerChange = null,
}) {
  // Keep the initial render budget small on all devices to avoid heavy DOM + layout work.
  // This also keeps the priorities panel expand/collapse animation smooth on desktop.
  const pageSize = 50;
  
  const handleResetOverrides = (dishId) => {
    prefsActions.setOverrideForDish(dishId, {});
  };

  const {
    searchQuery,
    setSearchQuery,
    filteredDishes,
    visibleDishes,
    remaining,
    showMore,
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
        variant="list"
        shouldHideContent={shouldHideContent}
        setScrollContainerEl={setScrollContainerEl}
        contentClassName="px-4 pt-0 pb-4"
        remaining={remaining}
        onShowMore={showMore}
        showMoreClassName="mt-4"
      >
        <div className="space-y-1.5">
          {visibleDishes.map((dish) => (
            <div key={dish.id}>
              <DishCardSimple
                dish={dish}
                onClick={() => openDish(dish)}
                onResetOverrides={handleResetOverrides}
                priceUnit={priceUnit}
              />
            </div>
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
