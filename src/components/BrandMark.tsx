import React from 'react';

interface BrandMarkProps {
  className?: string;
}

export const BrandMark: React.FC<BrandMarkProps> = ({ className = 'w-9 h-9' }) => (
  <svg
    viewBox="0 0 100 100"
    fill="none"
    aria-hidden="true"
    className={className}
  >
    <rect x="4" y="4" width="92" height="92" rx="22" fill="#0F5132" stroke="#18181B" strokeWidth="6" />
    <path d="M28 34H72M28 50H60M28 66H50" stroke="#FAF7F2" strokeWidth="8" strokeLinecap="round" />
    <circle cx="70" cy="64" r="10" fill="#FB923C" stroke="#18181B" strokeWidth="4" />
  </svg>
);
