# Dish Ranking System Architecture

## Overview

Двухэтапная система:
1. **Heavy analysis** (редко) — расчет базовых метрик для всех блюд
2. **Light calculation** (часто) — взвешивание и сортировка по приоритетам

## Key Optimization: Lazy Variant Evaluation

Варианты вычисляются **лениво** (при первом обращении), а не предварительно:
- **Time modes**: `normal` | `optimized` (2 варианта)
- **Price units**: `serving` | `per1kg` | `per1000kcal` (3 варианта)
- **Total**: 2 × 3 = **6 вариантов** через `Proxy` с кэшированием

Переключение между вариантами — O(1) выбор из кэша или вычисление при первом обращении.

### When Recalculation Occurs

Heavy analysis (`analyzeAllDishesVariants`) выполняется **только** при изменении:
- `selectedZone` (меняются цены ингредиентов)
- `overrides` (пользователь изменил значения блюда)
- `dishes` / `ingredients` (изменен датасет)

Переключение `priceUnit` или `isOptimized` **не вызывает** пересчет — выбирается вариант из кэша.

## Analysis Pipeline

### Stage 1: Static Analysis (`analyzeDishStatic`)

Для каждого блюда вычисляются **mode-independent** метрики:

**Base metrics**:
- `health`, `ethics`, `calories`, `weight`, `kcalPer100g`, `satiety`, `taste`
- `timeNormal`, `timeOptimized`, `passiveTimeHours`
- `prices.serving`, `prices.per1kg`, `prices.per1000kcal` (с учетом yield ratios)

**Overrides**: поддержка абсолютных значений (`taste: 8.5`) и множителей (`tasteMul: 1.1`). При наличии множителя абсолютное значение игнорируется.

**Cooking coefficients**: из `states.json`, применяются к health score.

### Stage 2: Normalization

**Independent metrics** (одинаковы для всех вариантов):
- `taste`, `health`, `ethics` — clamp(0-10)
- `satiety`, `lowCalorie` — percentile ranking

**Variant-dependent metrics** (вычисляются для каждого варианта):
- `cheapness` — logarithmic normalization по цене
- `speed` — percentile ranking по времени + penalty за `passiveTimeHours`

### Stage 3: Final Score Calculation

```
For each active priority:
  baseScore = normalizedBase[key]  // 0-10
  appliedScore = (priority < 0) ? (10 - baseScore) : baseScore
  points = (appliedScore / 10) * |priority|
  
finalScore = (sum(points) / sum(|priority|)) * 100
```

Отрицательные приоритеты инвертируют критерий (например, `health: -10` = "хочу нездоровое").

## State Management

### prefsStore (`src/store/prefsStore.js`)

Централизованное хранилище с разделением:
- `uiPriorities` — частые UI обновления (без throttling)
- `computationPriorities` — throttled (500ms) для пересчета ранжирования

**Persistence**: единый ключ `bfe_prefs_v2` в localStorage (миграция из legacy ключей `bfe_*`).

## Performance Optimizations

1. **Lazy variant evaluation** — варианты вычисляются по требованию, не все сразу
2. **Normalization optimization** — независимые метрики нормализуются 1 раз, variant-dependent — для каждого варианта
3. **Ingredient index** — Map для O(1) lookup вместо O(n) поиска
4. **Draft overrides** — локальный `draftOverrides` в UI, commit с debounce (250ms)
5. **Priorities throttling** — UI обновляется сразу, computation — с задержкой 500ms

## Missing Features (Not Implemented)

- **Frozen Ranking** — упоминался в старом дизайне, но не реализован. При изменении zone/priceUnit/optimized карточки закрываются.

## Additional Features (Not in Original Doc)

- **Worst Food Ever mode** — инвертирует знаки всех приоритетов
- **Search** — поиск по названию/описанию блюд в `DishList`
- **Pagination** — отображение по 50 элементов с кнопкой "Show more"
- **Auto-collapse priorities panel** — автоматическое сворачивание при скролле вниз, разворачивание при скролле вверх

## Key Files

- `src/lib/ranking/engine.js` — core ranking logic
- `src/store/prefsStore.js` — state management с throttling/debounce
- `src/App.jsx` — orchestration
- `states.json` — cooking method coefficients для health calculation