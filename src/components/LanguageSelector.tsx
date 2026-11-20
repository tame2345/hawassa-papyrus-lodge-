import React from 'react';
import { AppLang, LANGUAGE_OPTIONS } from '../i18n/translations';
import { useLanguage } from '../context/LanguageContext';

interface LanguageSelectorProps {
  id?: string;
  variant?: 'customer' | 'entry' | 'staff';
  onLanguageChanged?: (selected: AppLang, confirmMessage: string) => void;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  id = 'header-lang-selector',
  variant = 'customer',
  onLanguageChanged,
}) => {
  const { appLang, setAppLang, t } = useLanguage();

  const nativeOpts = LANGUAGE_OPTIONS.filter((o) => o.group === 'native');
  const foreignOpts = LANGUAGE_OPTIONS.filter((o) => o.group === 'foreign');

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = e.target.value as AppLang;
    setAppLang(selected);
    const matched = LANGUAGE_OPTIONS.find((o) => o.code === selected);
    if (onLanguageChanged) {
      onLanguageChanged(selected, matched?.confirmMessage || 'Language changed');
    }
  };

  if (variant === 'entry') {
    return (
      <div className="flex items-center gap-1 bg-black/50 hover:bg-black/70 border border-white/10 px-2 sm:px-2.5 py-1 rounded-full transition-all backdrop-blur-md max-w-full min-w-0 shrink">
        <span className="text-xs shrink-0">🌐</span>
        <select
          id={id}
          aria-label="Select Language"
          value={appLang}
          onChange={handleChange}
          className="bg-transparent text-white font-bold text-[10px] tracking-wider uppercase border-none outline-none cursor-pointer pr-1 flex focus:ring-0 max-w-[100px] sm:max-w-[155px] truncate"
          style={{ colorScheme: 'dark' }}
        >
          <optgroup label={t('header.lang_native')} className="bg-[#0F0F0F] text-white">
            {nativeOpts.map((opt) => (
              <option key={opt.code} value={opt.code}>
                {opt.label}
              </option>
            ))}
          </optgroup>
          <optgroup label={t('header.lang_foreign')} className="bg-[#0F0F0F] text-white">
            {foreignOpts.map((opt) => (
              <option key={opt.code} value={opt.code}>
                {opt.label}
              </option>
            ))}
          </optgroup>
        </select>
      </div>
    );
  }

  if (variant === 'staff') {
    return (
      <div className="flex items-center gap-1 bg-white hover:bg-stone-50 border border-amber-500/70 px-2 sm:px-2.5 py-1 rounded-xl transition-all shadow-xs max-w-full min-w-0 shrink">
        <span className="text-xs shrink-0">🌐</span>
        <select
          id={id}
          aria-label="Select Language"
          value={appLang}
          onChange={handleChange}
          className="bg-transparent text-stone-900 font-black text-[10px] tracking-wider uppercase border-none outline-none cursor-pointer pr-1 flex focus:ring-0 max-w-[105px] sm:max-w-[160px] truncate"
          style={{ colorScheme: 'light' }}
        >
          <optgroup label={t('header.lang_native')} className="bg-stone-100 text-stone-900">
            {nativeOpts.map((opt) => (
              <option key={opt.code} value={opt.code}>
                {opt.label}
              </option>
            ))}
          </optgroup>
          <optgroup label={t('header.lang_foreign')} className="bg-stone-100 text-stone-900">
            {foreignOpts.map((opt) => (
              <option key={opt.code} value={opt.code}>
                {opt.label}
              </option>
            ))}
          </optgroup>
        </select>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1 bg-white hover:bg-stone-50 border border-stone-200 px-1.5 sm:px-2 py-1 rounded-xl transition-all shrink min-w-0 max-w-full">
      <span className="text-xs shrink-0">🌐</span>
      <select
        id={id}
        aria-label="Select Language"
        value={appLang}
        onChange={handleChange}
        className="bg-transparent text-stone-900 font-black text-[9px] sm:text-[10px] tracking-wider uppercase border-none outline-none cursor-pointer pr-0.5 flex focus:ring-0 max-w-[86px] sm:max-w-[140px] truncate"
      >
        <optgroup label={t('header.lang_native')} className="bg-stone-100 text-stone-900">
          {nativeOpts.map((opt) => (
            <option key={opt.code} value={opt.code}>
              {opt.label}
            </option>
          ))}
        </optgroup>
        <optgroup label={t('header.lang_foreign')} className="bg-stone-100 text-stone-900">
          {foreignOpts.map((opt) => (
            <option key={opt.code} value={opt.code}>
              {opt.label}
            </option>
          ))}
        </optgroup>
      </select>
    </div>
  );
};
