import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { translations } from '../i18n/index';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: {
        translation: translations.en,
      },
      si: {
        translation: translations.si,
      },
    },
    lng: localStorage.getItem('language') || 'en', // Default language
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false, // React already escapes values
    },
  });

// Update localStorage when language changes
i18n.on('languageChanged', (lng) => {
  localStorage.setItem('language', lng);
  document.documentElement.lang = lng === 'si' ? 'si' : 'en';
});

export default i18n;
