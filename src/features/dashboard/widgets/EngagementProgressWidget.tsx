import React, { useMemo } from 'react';
import { Card, CardHeader, CardContent, CardTitle, Badge } from '../../../components/ui';
import { cx } from '../../../lib/utils';
import type { EngagementActivity, EngagementGoals } from '../../../types/models';

interface EngagementProgressWidgetProps {
  activities: EngagementActivity[];
  goals: EngagementGoals;
  onNavigate?: () => void;
}

const ACTION_CONFIG = [
  { key: 'comment', label: 'Comments', goalKey: 'weeklyComments' as const },
  { key: 'share', label: 'Shares', goalKey: 'weeklyShares' as const },
  { key: 'like', label: 'Likes', goalKey: 'weeklyLikes' as const },
  { key: 'reply', label: 'Replies', goalKey: 'weeklyReplies' as const },
] as const;

function getWeekStart(): Date {
  const now = new Date();
  const day = now.getDay();
  const start = new Date(now);
  start.setDate(start.getDate() - day);
  start.setHours(0, 0, 0, 0);
  return start;
}

export function EngagementProgressWidget({
  activities,
  goals,
  onNavigate,
}: EngagementProgressWidgetProps): React.ReactElement {
  const progress = useMemo(() => {
    const weekStart = getWeekStart();
    const thisWeekActivities = activities.filter((a) => {
      const actDate = new Date(a.createdAt);
      return actDate >= weekStart;
    });

    return ACTION_CONFIG.map(({ key, label, goalKey }) => {
      const count = thisWeekActivities.filter((a) => a.actionType === key).length;
      const goal = goals[goalKey] || 0;
      const percent = goal > 0 ? Math.min(Math.round((count / goal) * 100), 100) : 0;

      return { key, label, count, goal, percent };
    });
  }, [activities, goals]);

  const overallProgress = useMemo(() => {
    const totalCount = progress.reduce((sum, p) => sum + p.count, 0);
    const totalGoal = progress.reduce((sum, p) => sum + p.goal, 0);
    return totalGoal > 0 ? Math.round((totalCount / totalGoal) * 100) : 0;
  }, [progress]);

  return (
    <Card className="shadow-md">
      <CardHeader className="border-b border-graystone-200 py-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base text-ocean-900">Engagement Goals</CardTitle>
          <Badge variant={overallProgress >= 100 ? 'success' : 'outline'}>{overallProgress}%</Badge>
        </div>
      </CardHeader>
      <CardContent className="py-4">
        <div className="space-y-3">
          {progress.map((item) => (
            <div key={item.key}>
              <div className="mb-1 flex items-center justify-between text-xs">
                <span className="text-graystone-600">{item.label}</span>
                <span className="font-medium text-graystone-700">
                  {item.count}/{item.goal}
                </span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-graystone-100">
                <div
                  className={cx(
                    'h-full transition-all duration-300',
                    item.percent >= 100 ? 'bg-green-400' : 'bg-ocean-400',
                  )}
                  style={{ width: `${item.percent}%` }}
                />
              </div>
            </div>
          ))}
        </div>
        {onNavigate && (
          <button
            type="button"
            onClick={onNavigate}
            className="mt-3 w-full text-center text-xs text-ocean-600 hover:text-ocean-800"
          >
            View engagement tracker &rarr;
          </button>
        )}
      </CardContent>
    </Card>
  );
}
