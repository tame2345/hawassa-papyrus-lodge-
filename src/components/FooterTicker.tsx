/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

export default function FooterTicker() {
  const words = [
    'HAWASSA PAPYRUS LODGE',
    'EXQUISITE lakeside ESCAPES',
    'ETHIOPIAN TRADITIONAL SHEKLA TIBS',
    'FAST DELIVERY SERVICES',
    'SECURE CBE & TELEBIRR TRANSACTIONS',
    'SCAN. ORDER. ENJOY.'
  ];

  return (
    <footer className="h-11 border-t border-white/10 flex items-center bg-[#070707] relative overflow-hidden text-white w-full select-none">
      <div className="w-full flex justify-between px-6 items-center text-[10px] tracking-[0.25em] font-mono leading-none">
        <div className="flex gap-8 items-center overflow-hidden whitespace-nowrap">
          <div className="flex gap-8 animate-pulse">
            {words.map((w, idx) => (
              <span key={idx} className="text-white/45 font-black uppercase text-[9px] flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-[#C1FF00] inline-block rounded-full"></span>
                {w}
              </span>
            ))}
          </div>
        </div>
        <div className="hidden lg:flex items-center gap-2 text-white/50 bg-white/5 border border-white/5 px-3 py-1 font-mono text-[9px]">
          <span>COORD: 7.0621° N, 38.4763° E</span>
          <span className="text-[#C1FF00] font-black">● LIVE</span>
        </div>
      </div>
    </footer>
  );
}
