import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as ExpoLocalization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';

import es from './locales/es.json';
import en from './locales/en.json';

const LANGUAGE_KEY = '@deliv_language';

const resources = {
  es: { translation: es },
  en: { translation: en },
};

const initI18n = async () => {
  let lng = await AsyncStorage.getItem(LANGUAGE_KEY);
  
  if (!lng) {
    const locales = ExpoLocalization.getLocales();
    lng = locales?.[0]?.languageCode || 'es';
    if (!['es', 'en'].includes(lng)) {
      lng = 'es';
    }
  }

  i18n.use(initReactI18next).init({
    resources,
    lng,
    fallbackLng: 'es',
    interpolation: {
      escapeValue: false,
    },
    compatibilityJSON: 'v4',
  });

  return i18n;
};

export const changeLanguage = async (lng) => {
  await i18n.changeLanguage(lng);
  await AsyncStorage.setItem(LANGUAGE_KEY, lng);
};

export const getCurrentLanguage = () => i18n.language;

export default initI18n;
