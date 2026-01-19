import i18n from './i18n';

function normalizeKeyPart(value) {
  const s = String(value ?? '').trim().toLowerCase();
  if (!s) return '';
  // Keep keys JSON-friendly and stable across locales.
  return s
    .replace(/['']/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function getDishId(dish) {
  return dish?.id || dish?.originalDish?.id || null;
}

function getDishNameFallback(dish) {
  return (
    dish?.name ||
    dish?.originalDish?.dish ||
    dish?.originalDish?.name ||
    ''
  );
}

function getDishDescFallback(dish) {
  return (
    dish?.description ||
    dish?.originalDish?.desc ||
    ''
  );
}

function getDishCommentFallback(dish) {
  return (
    dish?.optimizedComment ||
    dish?.originalDish?.comment ||
    ''
  );
}

export function tDishName(t, dish) {
  const id = getDishId(dish);
  const fallback = getDishNameFallback(dish);
  if (!id) return fallback;
  // Use 'dishes' namespace
  return t(`dishes:${id}.name`, { defaultValue: fallback });
}

export function tDishDesc(t, dish) {
  const id = getDishId(dish);
  const fallback = getDishDescFallback(dish);
  if (!id) return fallback;
  // Use 'dishes' namespace
  return t(`dishes:${id}.desc`, { defaultValue: fallback });
}

export function tDishComment(t, dish) {
  const id = getDishId(dish);
  const fallback = getDishCommentFallback(dish);
  if (!id) return fallback;
  // Use 'dishes' namespace
  return t(`dishes:${id}.comment`, { defaultValue: fallback });
}

export function ingredientKeyFromName(name) {
  return normalizeKeyPart(name);
}

export function tIngredientName(t, ingredientOrName) {
  const rawName =
    typeof ingredientOrName === 'string'
      ? ingredientOrName
      : ingredientOrName?.name || ingredientOrName?.ingredient || '';

  const fallback = String(rawName || '');
  const key = ingredientKeyFromName(fallback);
  if (!key) return fallback;
  // Use 'ingredients' namespace
  return t(`ingredients:${key}.name`, { defaultValue: fallback });
}

export function tZoneName(t, zoneId) {
  if (!zoneId) return '';
  const fallback = ''; // Will fall back to zone.name from ECONOMIC_ZONES
  return t(`zones.${zoneId}`, { defaultValue: fallback });
}

export function tPresetName(t, preset) {
  if (!preset || !preset.id) return preset?.name || '';
  
  // Use translations from preset if available
  if (preset.translations) {
    // Get current language from i18n
    const language = i18n.language || 'en';
    const translation = preset.translations[language];
    if (translation?.name) {
      return translation.name;
    }
    // Fallback to English if current language not found
    if (preset.translations.en?.name) {
      return preset.translations.en.name;
    }
  }
  
  // Fallback to preset.name
  return preset.name || '';
}

export function tPresetDescription(t, preset) {
  if (!preset || !preset.id) return preset?.description || '';
  
  // Use translations from preset if available
  if (preset.translations) {
    // Get current language from i18n
    const language = i18n.language || 'en';
    const translation = preset.translations[language];
    if (translation?.description) {
      return translation.description;
    }
    // Fallback to English if current language not found
    if (preset.translations.en?.description) {
      return preset.translations.en.description;
    }
  }
  
  // Fallback to preset.description
  return preset.description || '';
}


