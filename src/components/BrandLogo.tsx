import React, { useState } from 'react';

interface BrandLogoProps {
  className?: string;
  showSweep?: boolean;
  alt?: string;
  priority?: boolean;
}

/**
 * Official Her Health Journey brand emblem:
 * Features the official high-resolution brand artwork (Emerald silhouette, gold ring, medical cross & pulse, botanical leaves)
 * with graceful fallback to the geometric architectural monogram.
 */
export function BrandLogo({
  className = 'w-9 h-9',
  showSweep = false,
  alt = 'Her Health Journey Logo',
}: BrandLogoProps) {
  const [imageError, setImageError] = useState(false);

  return (
    <span
      className={`${className} relative inline-flex items-center justify-center shrink-0 overflow-hidden rounded-[24%] border border-[#C5A66B]/35 shadow-[0_4px_14px_rgba(9,40,32,0.22)] bg-gradient-to-br from-[#174F40] via-[#103C32] to-[#092820]`}
      aria-hidden="true"
    >
      {showSweep && (
        <span
          className="hhj-logo-sweep pointer-events-none absolute inset-y-0 w-1/2 bg-gradient-to-r from-transparent via-[#E4D2A5]/70 to-transparent z-20"
          aria-hidden="true"
        />
      )}

      {!imageError ? (
        <img
          src="/assets/images/brand-logo.png"
          alt={alt}
          className="w-full h-full object-contain p-0.5 relative z-10 transition-transform duration-300 hover:scale-105"
          onError={() => setImageError(true)}
          loading="eager"
        />
      ) : (
        /* Fallback architectural monogram */
        <svg
          viewBox="0 0 36 36"
          className="w-[74%] h-[74%] relative z-10"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle
            cx="18"
            cy="18"
            r="14.2"
            stroke="#C5A66B"
            strokeWidth="1.25"
            strokeDasharray="68 12"
            strokeLinecap="round"
          />
          <path
            d="M11.5 10V26M24.5 10V26"
            stroke="#E4D2A5"
            strokeWidth="2.8"
            strokeLinecap="round"
          />
          <path
            d="M11.5 18.2C14.2 16.4 21.8 19.8 24.5 17.8"
            stroke="#C5A66B"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <circle cx="18" cy="18" r="1.5" fill="#E4D2A5" />
        </svg>
      )}
    </span>
  );
}
