import React from 'react';

/**
 * Chef toque hat + vibrant orange serving cloche dome + festive burst rays,
 * crafted to match the culinary Food Hub badge aesthetic.
 */
export const PapyrusChefClocheCrest: React.FC<{ className?: string }> = ({ className = 'w-14 h-12' }) => (
  <svg
    viewBox="0 0 88 70"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-hidden="true"
  >
    {/* Left festive burst rays */}
    <path d="M12 24L4 19" stroke="#FF5A1F" strokeWidth="2.5" strokeLinecap="round" />
    <path d="M10 34H2" stroke="#FF5A1F" strokeWidth="2.5" strokeLinecap="round" />
    <path d="M13 43L6 48" stroke="#FF5A1F" strokeWidth="2.5" strokeLinecap="round" />

    {/* Right festive burst rays */}
    <path d="M76 24L84 19" stroke="#FF5A1F" strokeWidth="2.5" strokeLinecap="round" />
    <path d="M78 34H86" stroke="#FF5A1F" strokeWidth="2.5" strokeLinecap="round" />
    <path d="M75 43L82 48" stroke="#FF5A1F" strokeWidth="2.5" strokeLinecap="round" />

    {/* Chef Toque Hat */}
    <path
      d="M31 27V21C27.5 20.5 25 17.8 25 14.3C25 10.6 28 7.8 31.7 7.8C32.9 7.8 34 8.1 35 8.7C36.6 5.8 39.8 4 44 4C48.2 4 51.4 5.8 53 8.7C54 8.1 55.1 7.8 56.3 7.8C60 7.8 63 10.6 63 14.3C63 17.8 60.5 20.5 57 21V27"
      fill="#FFFFFF"
      stroke="#1C1917"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path d="M35 23.5H53" stroke="#1C1917" strokeWidth="2" strokeLinecap="round" opacity="0.25" />

    {/* Orange Cloche Serving Dome */}
    <path d="M44 25C45.7 25 47 26.3 47 28H41C41 26.3 42.3 25 44 25Z" fill="#FF5A1F" />
    <path
      d="M21 50C21 37.3 31.3 27.5 44 27.5C56.7 27.5 67 37.3 67 50H21Z"
      fill="url(#clocheOrange)"
    />
    {/* Gloss highlight on dome */}
    <path
      d="M29 44C30.8 37.8 35.8 33.4 42 32.3"
      stroke="#FFFFFF"
      strokeOpacity="0.65"
      strokeWidth="2.4"
      strokeLinecap="round"
    />
    {/* Serving plate base */}
    <path d="M16 54.5H72" stroke="#1C1917" strokeWidth="2.5" strokeLinecap="round" />
    <path d="M25 59.5H63" stroke="#FF5A1F" strokeWidth="2.5" strokeLinecap="round" />

    <defs>
      <linearGradient id="clocheOrange" x1="21" y1="27.5" x2="67" y2="50" gradientUnits="userSpaceOnUse">
        <stop stopColor="#FF7538" />
        <stop offset="1" stopColor="#EA4C08" />
      </linearGradient>
    </defs>
  </svg>
);

/**
 * Tapered orange brush underline beneath brand title.
 */
export const PapyrusBrushUnderline: React.FC<{ className?: string }> = ({ className = 'w-40 h-2.5 mx-auto' }) => (
  <svg viewBox="0 0 180 12" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden="true">
    <path
      d="M4 8.5C46 2.8 124 2.2 176 7.2C142 9.2 66 9.8 4 8.5Z"
      fill="url(#brushOrange)"
    />
    <defs>
      <linearGradient id="brushOrange" x1="4" y1="6" x2="176" y2="6" gradientUnits="userSpaceOnUse">
        <stop stopColor="#FF7A3D" />
        <stop offset="0.5" stopColor="#FF5A1F" />
        <stop offset="1" stopColor="#EA4C08" />
      </linearGradient>
    </defs>
  </svg>
);

/**
 * Radiating orange burst dashes flanking card headings (left or right side).
 */
export const HeadingBurstDashes: React.FC<{ side: 'left' | 'right' }> = ({ side }) => (
  <svg
    viewBox="0 0 18 22"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`w-3.5 h-4 shrink-0 ${side === 'right' ? 'scale-x-[-1]' : ''}`}
    aria-hidden="true"
  >
    <path d="M15 5L6 2" stroke="#FF5A1F" strokeWidth="2" strokeLinecap="round" />
    <path d="M14 11H3" stroke="#FF5A1F" strokeWidth="2" strokeLinecap="round" />
    <path d="M15 17L6 20" stroke="#FF5A1F" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

/**
 * Bottom hairline divider with centered orange chef toque icon.
 */
export const PapyrusChefDivider: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`flex items-center gap-3 w-full ${className}`} aria-hidden="true">
    <div className="h-px flex-1 bg-stone-200" />
    <svg viewBox="0 0 24 22" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 shrink-0">
      <path
        d="M6.5 14V11.2C4.6 10.8 3.2 9.2 3.2 7.2C3.2 4.9 5 3.1 7.3 3.1C8 3.1 8.7 3.3 9.3 3.6C10.1 2 11.7 1 13.7 1C15.7 1 17.3 2 18.1 3.6C18.7 3.3 19.4 3.1 20.1 3.1C22.4 3.1 24.2 4.9 24.2 7.2C24.2 9.2 22.8 10.8 20.9 11.2V14H6.5Z"
        transform="translate(-1.7 1)"
        stroke="#FF5A1F"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path d="M5.5 18.5H18.5" stroke="#FF5A1F" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
    <div className="h-px flex-1 bg-stone-200" />
  </div>
);

/**
 * Organic vibrant orange layered backdrop blobs peeking from top and bottom of the white card,
 * plus ultra-subtle warm culinary doodle strokes inside the card perimeter.
 */
export const PapyrusOrangeBackdropLayer: React.FC = () => (
  <>
    {/* Top organic orange curve peeking behind card */}
    <div
      aria-hidden="true"
      className="pointer-events-none absolute -top-2 inset-x-7 h-8 rounded-t-[26px] bg-gradient-to-r from-[#FF7538] via-[#FF5A1F] to-[#EA4C08] shadow-[0_-4px_16px_rgba(255,90,31,0.28)] -z-10"
      style={{ clipPath: 'ellipse(68% 95% at 50% 100%)' }}
    />
    {/* Bottom organic orange curve peeking behind card */}
    <div
      aria-hidden="true"
      className="pointer-events-none absolute -bottom-2 inset-x-7 h-8 rounded-b-[26px] bg-gradient-to-r from-[#EA4C08] via-[#FF5A1F] to-[#FF7538] shadow-[0_6px_18px_rgba(255,90,31,0.32)] -z-10"
      style={{ clipPath: 'ellipse(68% 95% at 50% 0%)' }}
    />
  </>
);

/**
 * Subtle warm peach culinary doodle line accents tucked inside the light card corners.
 */
export const PapyrusCardCulinaryAccents: React.FC = () => (
  <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden rounded-[26px]">
    {/* Soft warm peach radial wash top-right */}
    <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full bg-orange-100/60 blur-xl" />
    {/* Soft warm cream-amber wash bottom-left */}
    <div className="absolute -bottom-12 -left-12 w-32 h-32 rounded-full bg-amber-100/50 blur-xl" />
    {/* Minimalist culinary sketch heart & leaf in top/bottom corner */}
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="absolute top-3 left-3 w-8 h-8 opacity-[0.14]"
    >
      <path
        d="M12 30C12 20 22 14 32 14C42 14 52 20 52 30H12Z"
        stroke="#FF5A1F"
        strokeWidth="2.2"
        strokeLinejoin="round"
      />
      <path d="M10 35H54" stroke="#FF5A1F" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M18 41C18 48 25 53 32 53C39 53 46 48 46 41" stroke="#FF5A1F" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
    <svg
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="absolute bottom-3 right-3 w-7 h-7 opacity-[0.14]"
    >
      <path
        d="M24 38C24 38 10 29 10 19C10 14 14 10 18.5 10C21.2 10 23.2 11.5 24 13.5C24.8 11.5 26.8 10 29.5 10C34 10 38 14 38 19C38 29 24 38 24 38Z"
        stroke="#FF5A1F"
        strokeWidth="2.4"
        strokeLinejoin="round"
      />
    </svg>
  </div>
);
