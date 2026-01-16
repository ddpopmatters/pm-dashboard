import React, { useState, useEffect } from 'react';
import { PLATFORM_IMAGES } from '../../constants';

export type PlatformIconSize = 'xs' | 'sm' | 'md' | 'lg';

export interface PlatformIconProps {
  /** Platform name (must match key in PLATFORM_IMAGES) */
  platform: string;
  /** Size of the icon */
  size?: PlatformIconSize;
}

const sizeClasses: Record<PlatformIconSize, string> = {
  xs: 'h-3 w-3',
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
  lg: 'h-6 w-6',
};

export function PlatformIcon({ platform, size = 'sm' }: PlatformIconProps): React.ReactElement {
  const src = PLATFORM_IMAGES[platform as keyof typeof PLATFORM_IMAGES];
  const [failed, setFailed] = useState(false);

  // Reset failed state when platform/src changes
  useEffect(() => {
    setFailed(false);
  }, [src]);

  const sizeClass = sizeClasses[size];

  if (!src || failed) {
    return (
      <span
        className={`flex ${sizeClass} items-center justify-center rounded-full bg-aqua-100 text-[10px] font-semibold text-ocean-700`}
      >
        {platform.slice(0, 1)}
      </span>
    );
  }

  return (
    <img
      src={src}
      alt={`${platform} logo`}
      className={`${sizeClass} object-contain`}
      loading="lazy"
      referrerPolicy="no-referrer"
      crossOrigin="anonymous"
      onError={() => setFailed(true)}
    />
  );
}

export default PlatformIcon;
