/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

export default function FooterTicker() {
  return (
    <footer className="border-t border-white/10 bg-[#070707] text-white w-full select-none py-3 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left">
        <div className="space-y-0.5">
          <p className="text-[11px] sm:text-xs font-bold text-white/90 tracking-wide">
            © 2026 ጉራቻ ቴክኖሎጂ (Guracha Technology) • ሐዋሳ እና አዲስ አበባ 🇪🇹
          </p>
          <p className="text-[10px] sm:text-[11px] text-white/60 font-medium">
            ዘመናዊ ዲጂታል ሜኑ እና የሆቴል አስተዳደር ሲስተም
          </p>
        </div>
        <div className="inline-flex items-center gap-1.5 text-[10px] sm:text-[11px] font-mono font-black tracking-wider text-[#C1FF00] bg-white/5 border border-white/10 px-3 py-1 rounded-lg">
          <span className="text-white/60 font-normal">Powered by</span>
          <span>Guracha Tech</span>
        </div>
      </div>
    </footer>
  );
}
