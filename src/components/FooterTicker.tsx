/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useLanguage } from '../context/LanguageContext';

export default function FooterTicker() {
  const { t, isRtl } = useLanguage();
  return (
    <footer
      dir={isRtl ? 'rtl' : 'ltr'}
      className="border-t-4 border-[#F4C22B] bg-[#8C1414] text-white w-full select-none py-3 px-4 sm:px-6 shadow-inner"
    >
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left">
        <div className="space-y-0.5">
          <p className="text-[11px] sm:text-xs font-bold text-white tracking-wide">
            {t('footer.copyright')}
          </p>
          <p className="text-[10px] sm:text-[11px] text-[#FDE68A] font-medium">
            {t('footer.tagline')}
          </p>
        </div>
        <div className="footer-powered-pill inline-flex items-center gap-1.5 text-[10px] sm:text-[11px] font-mono font-black tracking-wider text-stone-950 bg-[#F4C22B] border border-[#CF9D12] px-3 py-1 rounded-lg shadow-xs">
          <span className="text-stone-800 font-bold">Powered by</span>
          <span>Guracha Tech</span>
        </div>
      </div>
    </footer>
  );
}
