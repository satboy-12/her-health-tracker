import React, { useId } from 'react';

interface BrandLogoProps {
  className?: string;
  showSweep?: boolean;
}

/**
 * Official Her Health Journey brand emblem:
 * Architectural Champagne Gold "H" monogram framed within a delicate botanical cycle arc
 * on a deep Emerald Green medallion (#103C32 -> #092820).
 */
export function BrandLogo({ className = 'w-9 h-9', showSweep = false }: BrandLogoProps) {
  const goldGradId = useId();
  const bgGradId = useId();

  return (
    <span
      className={`${className} relative overflow-hidden rounded-[26%] inline-grid place-items-center shrink-0 border border-[#C5A66B]/45 shadow-[0_6px_18px_rgba(9,40,32,0.28)]`}
      style={{
        background: 'linear-gradient(145deg, #174F40 0%, #103C32 55%, #092820 100%)',
      }}
      aria-hidden="true"
    >
      {showSweep && (
        <span
          className="hhj-logo-sweep pointer-events-none absolute inset-y-0 w-1/2 bg-gradient-to-r from-transparent via-[#E4D2A5]/65 to-transparent"
          aria-hidden="true"
        />
      )}

      <svg
        viewBox="0 0 36 36"
        className="w-[74%] h-[74%] relative z-10"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id={goldGradId} x1="6" y1="5" x2="30" y2="31" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#E4D2A5" />
            <stop offset="55%" stopColor="#C5A66B" />
            <stop offset="100%" stopColor="#E4D2A5" />
          </linearGradient>
          <linearGradient id={bgGradId} x1="18" y1="4" x2="18" y2="32" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#C5A66B" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#27836A" stopOpacity="0.65" />
          </linearGradient>
        </defs>

        {/* Subtle outer precision ring */}
        <circle
          cx="18"
          cy="18"
          r="14.2"
          stroke={`url(#${bgGradId})`}
          strokeWidth="1.25"
          strokeDasharray="68 12"
          strokeLinecap="round"
        />

        {/* Crisp Architectural H Monogram */}
        <path
          d="M11.5 10V26M24.5 10V26"
          stroke={`url(#${goldGradId})`}
          strokeWidth="2.8"
          strokeLinecap="round"
        />
        {/* Sculpted botanical wave crossbar */}
        <path
          d="M11.5 18.2C14.2 16.4 21.8 19.8 24.5 17.8"
          stroke={`url(#${goldGradId})`}
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        {/* Center gold horizon focal dot */}
        <circle cx="18" cy="18" r="1.5" fill="#E4D2A5" />
      </svg>
    </span>
  );
}
