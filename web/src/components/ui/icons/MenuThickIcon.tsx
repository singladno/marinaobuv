import * as React from 'react';

type MenuThickIconProps = {
  className?: string;
};

export function MenuThickIcon({ className = '' }: MenuThickIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={className}
      fill="currentColor"
    >
      <rect x="3" y="5" width="18" height="3.2" rx="1.6" />
      <rect x="3" y="10.4" width="18" height="3.2" rx="1.6" />
      <rect x="3" y="15.8" width="18" height="3.2" rx="1.6" />
    </svg>
  );
}

export default MenuThickIcon;
