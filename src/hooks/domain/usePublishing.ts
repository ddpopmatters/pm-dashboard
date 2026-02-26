import { useState, useEffect, useCallback } from 'react';
import { DEFAULT_PUBLISH_SETTINGS } from '../../features/publishing';

interface AssetGoals {
  Video: number;
  Design: number;
  Carousel: number;
  [key: string]: number;
}

export function usePublishing() {
  const [publishSettings, setPublishSettings] = useState(() => {
    try {
      const stored = window.localStorage.getItem('pm-publish-settings');
      return stored
        ? { ...DEFAULT_PUBLISH_SETTINGS, ...JSON.parse(stored) }
        : DEFAULT_PUBLISH_SETTINGS;
    } catch {
      return DEFAULT_PUBLISH_SETTINGS;
    }
  });

  const [dailyPostTarget, setDailyPostTarget] = useState(() => {
    try {
      const stored = window.localStorage.getItem('pm-daily-post-target');
      return stored ? parseInt(stored, 10) || 0 : 0;
    } catch {
      return 0;
    }
  });

  const [assetGoals, setAssetGoals] = useState<AssetGoals>(() => ({
    Video: 40,
    Design: 40,
    Carousel: 20,
  }));

  // Persist publish settings to localStorage
  useEffect(() => {
    try {
      window.localStorage.setItem('pm-publish-settings', JSON.stringify(publishSettings));
    } catch {
      // Ignore storage errors
    }
  }, [publishSettings]);

  const handleDailyPostTargetChange = useCallback((target: number) => {
    setDailyPostTarget(target);
    try {
      window.localStorage.setItem('pm-daily-post-target', String(target));
    } catch {
      // Ignore storage errors
    }
  }, []);

  const reset = useCallback(() => {
    setPublishSettings(DEFAULT_PUBLISH_SETTINGS);
    setDailyPostTarget(0);
    setAssetGoals({ Video: 40, Design: 40, Carousel: 20 });
  }, []);

  return {
    publishSettings,
    setPublishSettings,
    dailyPostTarget,
    setDailyPostTarget,
    handleDailyPostTargetChange,
    assetGoals,
    setAssetGoals,
    reset,
  };
}
