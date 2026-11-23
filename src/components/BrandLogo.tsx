import React, { useState } from 'react';

const STITCH_LOGO_URL =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuCwO2R6mhHHS7Dl6DuE9TDGICyWyWvIiTMhOBjh-UBp-6fxwDvR19W4w7h_RH_LOFmOAQyHj2qCsrObMwgsKPMK83JHCTN0MybFAahlmS_V_uYEVVYui8ydY8MpJw1zjen5KZx_YkK6fWHqHMm-fi_N2TF0Str-eoXUVxG5oHJIER2DrLUg4eayb4HFt25hT8T6tbkgRIpwEZVOxfvqWvWBOBhbpnR0PYUxAmTfTGQ';

export function BrandLogo({ className = 'h-8 w-8' }: { className?: string }) {
  const [imgError, setImgError] = useState(false);

  if (!imgError) {
    return (
      <img
        src={STITCH_LOGO_URL}
        alt="Her Health Journey Logo"
        referrerPolicy="no-referrer"
        onError={() => setImgError(true)}
        className={`${className} rounded-lg object-contain`}
      />
    );
  }

  return (
    <span
      className={`${className} inline-flex items-center justify-center rounded-lg bg-primary text-on-primary shrink-0`}
      aria-hidden="true"
    >
      <svg viewBox="0 0 24 24" className="w-5 h-5 fill-none stroke-current" strokeWidth="1.8">
        <path
          d="M12 20.5s-6.5-4.3-8.4-8.4C2.2 9.1 3.9 5.5 7.4 5.2c1.9-.2 3.6.8 4.6 2.3 1-1.5 2.7-2.5 4.6-2.3 3.5.3 5.2 3.9 3.8 6.9-1.9 4.1-8.4 8.4-8.4 8.4Z"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}
