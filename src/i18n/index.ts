import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as ExpoLocalization from 'expo-localization';
import { getItem, setItem } from '../utils/storage';

import es from './locales/es.json';
import en from './locales/en.json';

const LANGUAGE_KEY = '@deliv_language';

const resources = {
  es: { translation: es },
  en: { translation: en },
};

type Language = 'es' | 'en';

const initI18n = async () => {
  let lng: Language = 'es';
  const storedLang = await getItem(LANGUAGE_KEY);

  if (storedLang && (storedLang === 'es' || storedLang === 'en')) {
    lng = storedLang as Language;
  } else {
    const locales = ExpoLocalization.getLocales();
    const deviceLang = locales?.[0]?.languageCode;
    if (deviceLang === 'es' || deviceLang === 'en') {
      lng = deviceLang as Language;
    }
  }

  i18n.use(initReactI18next).init({
    resources,
    lng,
    fallbackLng: 'es' as Language,
    interpolation: {
      escapeValue: false,
    },
    compatibilityJSON: 'v4',
  });

  return i18n;
};

export const changeLanguage = async (lng: Language): Promise<void> => {
  await i18n.changeLanguage(lng);
  await setItem(LANGUAGE_KEY, lng);
};

export const getCurrentLanguage = (): string => i18n.language;

export type { Language };

export default initI18n;
