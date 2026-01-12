import React, { useMemo } from 'react';
import { Card, CardHeader, CardContent, CardTitle } from '../../../components/ui';
import { cx } from '../../../lib/utils';
import type { Entry } from '../../../types/models';

interface AssetMixWidgetProps {
  entries: Entry[];
  assetGoals: Record<string, number>;
}

const ASSET_COLORS: Record<string, string> = {
  Video: 'bg-purple-400',
  Design: 'bg-ocean-400',
  Carousel: 'bg-amber-400',
  Photo: 'bg-green-400',
  Text: 'bg-graystone-400',
};

export function AssetMixWidget({ entries, assetGoals }: AssetMixWidgetProps): React.ReactElement {
  const distribution = useMemo(() => {
    // Only count this month's non-deleted entries
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const monthEntries = entries.filter((e) => {
      if (e.deletedAt) return false;
      const entryDate = new Date(e.date);
      return entryDate >= monthStart;
    });

    const total = monthEntries.length;
    const counts: Record<string, number> = {};

    monthEntries.forEach((e) => {
      const type = e.assetType || 'Other';
      counts[type] = (counts[type] || 0) + 1;
    });

    // Build results for goal-tracked asset types
    return Object.entries(assetGoals).map(([type, goalPercent]) => {
      const count = counts[type] || 0;
      const actualPercent = total > 0 ? Math.round((count / total) * 100) : 0;
      const diff = actualPercent - goalPercent;

      return {
        type,
        count,
        goalPercent,
        actualPercent,
        diff,
        color: ASSET_COLORS[type] || 'bg-graystone-400',
      };
    });
  }, [entries, assetGoals]);

  return (
    <Card className="shadow-md">
      <CardHeader className="border-b border-graystone-200 py-3">
        <CardTitle className="text-base text-ocean-900">Asset Mix (This Month)</CardTitle>
      </CardHeader>
      <CardContent className="py-4">
        <div className="space-y-3">
          {distribution.map((item) => (
            <div key={item.type}>
              <div className="mb-1 flex items-center justify-between text-xs">
                <span className="font-medium text-graystone-700">{item.type}</span>
                <span className="text-graystone-500">
                  {item.actualPercent}% / {item.goalPercent}% goal
                  <span
                    className={cx(
                      'ml-1 font-medium',
                      item.diff >= 0 ? 'text-green-600' : 'text-amber-600',
                    )}
                  >
                    ({item.diff >= 0 ? '+' : ''}
                    {item.diff}%)
                  </span>
                </span>
              </div>
              <div className="relative h-2 overflow-hidden rounded-full bg-graystone-100">
                {/* Actual bar */}
                <div
                  className={`absolute left-0 top-0 h-full ${item.color} transition-all duration-300`}
                  style={{ width: `${Math.min(item.actualPercent, 100)}%` }}
                />
                {/* Goal marker */}
                <div
                  className="absolute top-0 h-full w-0.5 bg-graystone-800"
                  style={{ left: `${item.goalPercent}%` }}
                  title={`Goal: ${item.goalPercent}%`}
                />
              </div>
            </div>
          ))}
        </div>
        <p className="mt-3 text-center text-[10px] text-graystone-400">
          Bar shows actual %, line shows goal
        </p>
      </CardContent>
    </Card>
  );
}
