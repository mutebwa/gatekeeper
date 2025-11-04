import React from 'react';
import { useTranslation } from 'react-i18next';
import { Languages } from 'lucide-react';

export const LanguageSwitcher: React.FC = () => {
  const { i18n } = useTranslation();

  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'fr' : 'en';
    i18n.changeLanguage(newLang);
  };

  return (
    <button
      onClick={toggleLanguage}
      className="p-2 sm:p-3 rounded-full bg-gray-100 hover:bg-gray-200:bg-gray-600 transition-colors flex items-center space-x-1 sm:space-x-2"
      title={i18n.language === 'en' ? 'Switch to French' : 'Passer à l\'anglais'}
    >
      <Languages size={16} className="sm:w-[18px] sm:h-[18px]" />
      <span className="text-xs sm:text-sm font-medium uppercase">
        {i18n.language === 'en' ? 'FR' : 'EN'}
      </span>
    </button>
  );
};
