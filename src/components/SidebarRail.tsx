/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useLanguage } from '../context/LanguageContext';

export default function SidebarRail() {
  const { t } = useLanguage();
  return (
    <aside className="hidden md:flex w-20 border-r-2 border-[#F4C22B]/50 flex-col items-center justify-between py-10 bg-[#8C1414]">
      <span 
        className="uppercase text-[9px] tracking-[0.35em] font-black text-white/85 font-mono" 
        style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
      >
        {t('sidebar.designator')}
      </span>
      <div className="w-px h-20 bg-[#F4C22B]/40"></div>
      <div className="flex flex-col items-center gap-2">
        <span className="font-mono text-[10px] text-stone-950 font-black tracking-widest bg-[#F4C22B] px-2 py-0.5 rounded">
          HPL
        </span>
        <span className="font-mono text-[9px] text-[#FDE68A] font-bold">002</span>
      </div>
    </aside>
  );
}
