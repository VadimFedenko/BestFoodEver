import { buildIngredientIndex } from './RankingEngine.js';

let cached = null;
let inFlight = null;

/**
 * Lazy-load `ingredients.json` (as a static asset) and build an ingredient index Map.
 * This keeps JS bundles smaller and avoids blocking first paint.
 */
export async function loadIngredientsIndex() {
  if (cached) return cached;
  if (inFlight) return inFlight;

  const url = new URL('ingredients.json', document.baseURI).toString();

  inFlight = fetch(url, { cache: 'force-cache' })
    .then((res) => {
      if (!res.ok) throw new Error(`Failed to load ingredients.json (${res.status})`);
      return res.json();
    })
    .then((ingredients) => {
      const ingredientIndex = buildIngredientIndex(ingredients);
      cached = { ingredients, ingredientIndex };
      return cached;
    })
    .finally(() => {
      // keep cached; allow retry if it failed
      inFlight = null;
    });

  return inFlight;
}


