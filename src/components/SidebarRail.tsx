/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

export default function SidebarRail() {
  return (
    <aside className="hidden md:flex w-20 border-r border-white/10 flex-col items-center justify-between py-10 bg-[#0F0F0F]">
      <span 
        className="uppercase text-[9px] tracking-[0.35em] font-black text-white/40 font-mono" 
        style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
      >
        LODGE DESIGNATOR VOL 02 / 2026
      </span>
      <div className="w-px h-20 bg-white/10"></div>
      <div className="flex flex-col items-center gap-2">
        <span className="font-mono text-[10px] text-[#C1FF00] font-black tracking-widest bg-[#C1FF00]/10 px-2 py-0.5 rounded">
          HPL
        </span>
        <span className="font-mono text-[9px] text-white/30 font-bold">002</span>
      </div>
    </aside>
  );
}
