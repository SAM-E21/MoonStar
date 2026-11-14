import React from 'react';

interface CrewAvatarProps {
  suitColor: string;
  visorColor: string;
  size?: 'sm' | 'md';
}

export const CrewAvatar: React.FC<CrewAvatarProps> = ({
  suitColor,
  visorColor,
  size = 'md',
}) => {
  const dim = size === 'sm' ? 'w-9 h-9' : 'w-12 h-12';
  return (
    <svg viewBox="0 0 64 64" className={`${dim} shrink-0`} aria-hidden="true">
      <circle cx="32" cy="32" r="30" fill="#0d1b36" stroke={suitColor} strokeWidth="2.5" />
      {/* Suit shoulders */}
      <path d="M14 56 C16 42, 48 42, 50 56" fill="#e2e8f0" />
      <rect x="24" y="45" width="16" height="9" rx="3" fill={suitColor} />
      {/* Helmet */}
      <circle cx="32" cy="27" r="14" fill="#f8fafc" stroke="#94a3b8" strokeWidth="1.5" />
      {/* Visor */}
      <rect x="21" y="20" width="22" height="13" rx="6" fill={visorColor} />
      {/* Visor reflection */}
      <path d="M25 23 L31 23" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" opacity="0.75" />
      {/* Antenna dot */}
      <line x1="46" y1="24" x2="46" y2="14" stroke={suitColor} strokeWidth="2" />
      <circle cx="46" cy="13" r="2.2" fill="#facc15" />
    </svg>
  );
};
