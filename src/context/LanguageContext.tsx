// src/context/LanguageContext.tsx
import React, { createContext, useState, useEffect } from 'react';
import initI18n, { changeLanguage } from '../i18n';

interface LanguageContextType {
  switchLanguage: (lng: string) => Promise<void>;
}

export const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    initI18n().then(() => setReady(true));
  }, []);

  const switchLanguage = async (lng: string) => {
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
