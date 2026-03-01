import React, { useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui';
import { AUDIENCE_SEGMENTS } from '../../../constants';
import type { Entry } from '../../../types/models';

export interface AudienceSegmentWidgetProps {
  entries: Entry[];
}

export function AudienceSegmentWidget({ entries }: AudienceSegmentWidgetProps): React.ReactElement {
  const stats = useMemo(() => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recent = entries.filter((e) => !e.deletedAt && new Date(e.date) >= thirtyDaysAgo);
    const total = recent.length || 1;
    return AUDIENCE_SEGMENTS.map((segment) => {
      const count = recent.filter(
        (e) => Array.isArray(e.audienceSegments) && e.audienceSegments.includes(segment),
      ).length;
      return { segment, count, pct: Math.round((count / total) * 100) };
    });
  }, [entries]);

  const untagged = useMemo(() => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return entries.filter(
      (e) =>
        !e.deletedAt &&
        new Date(e.date) >= thirtyDaysAgo &&
        (!e.audienceSegments || e.audienceSegments.length === 0),
    ).length;
  }, [entries]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Audience reach (30 days)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {stats.map(({ segment, count, pct }) => (
            <div key={segment} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="truncate text-graystone-700">{segment}</span>
                <span className="shrink-0 text-graystone-500">
                  {count} ({pct}%)
                </span>
              </div>
              <div className="h-2 rounded-full bg-graystone-100">
                <div
                  className="h-2 rounded-full bg-ocean-500"
                  style={{ width: `${Math.max(pct, 2)}%` }}
                />
              </div>
            </div>
          ))}
          {untagged > 0 && (
            <p className="mt-1 text-[11px] text-amber-600">
              {untagged} untagged {untagged === 1 ? 'entry' : 'entries'}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
