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

function readInitialLanguage() {
  try {
    const raw = localStorage.getItem('bfe_prefs_v2');
    const prefs = raw ? JSON.parse(raw) : null;
    const lng = prefs?.language;
    return lng === 'ru' ? 'ru' : lng === 'ua' ? 'ua' : lng === 'en' ? 'en' : null;
  } catch {
    return null;
  }
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


