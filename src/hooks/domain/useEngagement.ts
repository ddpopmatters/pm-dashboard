import { useState, useCallback } from 'react';
import { DEFAULT_ENGAGEMENT_GOALS } from '../../features/engagement/EngagementView';

export function useEngagement() {
  const [engagementActivities, setEngagementActivities] = useState<unknown[]>([]);
  const [engagementAccounts, setEngagementAccounts] = useState<unknown[]>([]);
  const [engagementGoals, setEngagementGoals] = useState(() => DEFAULT_ENGAGEMENT_GOALS);

  const reset = useCallback(() => {
    setEngagementActivities([]);
    setEngagementAccounts([]);
    setEngagementGoals(DEFAULT_ENGAGEMENT_GOALS);
  }, []);

  return {
    engagementActivities,
    setEngagementActivities,
    engagementAccounts,
    setEngagementAccounts,
    engagementGoals,
    setEngagementGoals,
    reset,
  };
}
