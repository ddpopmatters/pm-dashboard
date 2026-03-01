import React, { useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui';
import { CONTENT_PILLARS } from '../../../constants';
import type { Entry } from '../../../types/models';

const PILLAR_COLORS: Record<string, string> = {
  'Reproductive Rights & Bodily Autonomy': 'bg-ocean-500',
  'Population & Demographics': 'bg-aqua-500',
  'Environmental Sustainability': 'bg-emerald-500',
  'Social Justice': 'bg-amber-500',
};

export interface PillarBalanceWidgetProps {
  entries: Entry[];
}

export function PillarBalanceWidget({ entries }: PillarBalanceWidgetProps): React.ReactElement {
  const stats = useMemo(() => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recent = entries.filter((e) => !e.deletedAt && new Date(e.date) >= thirtyDaysAgo);
    const total = recent.length || 1;
    return CONTENT_PILLARS.map((pillar) => {
      const count = recent.filter((e) => e.contentPillar === pillar).length;
      return { pillar, count, pct: Math.round((count / total) * 100) };
    });
  }, [entries]);

  const untagged = useMemo(() => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return entries.filter(
      (e) => !e.deletedAt && new Date(e.date) >= thirtyDaysAgo && !e.contentPillar,
    ).length;
  }, [entries]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pillar balance (30 days)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {stats.map(({ pillar, count, pct }) => (
            <div key={pillar} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="truncate text-graystone-700">{pillar}</span>
                <span className="shrink-0 text-graystone-500">
                  {count} ({pct}%)
                </span>
              </div>
              <div className="h-2 rounded-full bg-graystone-100">
                <div
                  className={`h-2 rounded-full ${PILLAR_COLORS[pillar] || 'bg-graystone-400'}`}
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
