import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from './locales/en.json';
import ru from './locales/ru.json';
import ua from './locales/ua.json';

// Data translations (dishes and ingredients) - separate namespaces
import dishesEn from './locales/data/dishes.en.json';
import dishesRu from './locales/data/dishes.ru.json';
import dishesUa from './locales/data/dishes.ua.json';
import ingredientsEn from './locales/data/ingredients.en.json';
import ingredientsRu from './locales/data/ingredients.ru.json';
import ingredientsUa from './locales/data/ingredients.ua.json';

function detectBrowserLanguage() {
  if (typeof navigator === 'undefined') return null;

  const candidates =
    (navigator.languages && navigator.languages.length
      ? navigator.languages
      : [navigator.language || navigator.userLanguage]
    ) || [];

  const supported = ['en', 'ru', 'ua'];

  for (const l of candidates) {
    if (!l) continue;
    const base = String(l).toLowerCase().split('-')[0]; // 'ru-RU' -> 'ru'
    if (supported.includes(base)) return base;
  }

  return null;
}

function readInitialLanguage() {
  try {
    const raw = localStorage.getItem('bfe_prefs_v2');
    const prefs = raw ? JSON.parse(raw) : null;
    const lng = prefs?.language;
    if (lng === 'ru' || lng === 'ua' || lng === 'en') {
      // Явный выбор пользователя из настроек – используем его.
      return lng;
    }
  } catch {
    // ignore and fall back to browser language / default
  }

  // Настройки ещё не сохранены – пробуем подобрать язык по браузеру.
  const detected = detectBrowserLanguage();
  if (detected) return detected;

  // Фоллбек – английский.
  return null;
}

i18n.use(initReactI18next).init({
  resources: {
    en: { 
      translation: en,
      dishes: dishesEn,
      ingredients: ingredientsEn,
    },
    ru: { 
      translation: ru,
      dishes: dishesRu,
      ingredients: ingredientsRu,
    },
    ua: { 
      translation: ua,
      dishes: dishesUa,
      ingredients: ingredientsUa,
    },
  },
  lng: readInitialLanguage() || 'en',
  fallbackLng: 'en',
  defaultNS: 'translation',
  interpolation: { escapeValue: false },
});

export default i18n;


