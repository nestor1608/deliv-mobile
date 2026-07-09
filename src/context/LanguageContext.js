import React, { createContext, useState, useEffect } from 'react';
import initI18n, { changeLanguage } from '../i18n';

export const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    initI18n().then(() => setReady(true));
  }, []);

  const switchLanguage = async (lng) => {
    await changeLanguage(lng);
  };

  if (!ready) {
    return null;
  }

  return (
    <LanguageContext.Provider value={{ switchLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
};
