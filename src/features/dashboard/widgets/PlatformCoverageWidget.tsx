import React, { useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui';
import { ALL_PLATFORMS, PLATFORM_TIERS } from '../../../constants';
import type { Entry } from '../../../types/models';

const TIER_TARGETS: Record<number, number> = { 1: 60, 2: 30, 3: 10 };
const TIER_COLORS: Record<number, string> = {
  1: 'bg-emerald-500',
  2: 'bg-amber-500',
  3: 'bg-graystone-400',
};

export interface PlatformCoverageWidgetProps {
  entries: Entry[];
}

export function PlatformCoverageWidget({
  entries,
}: PlatformCoverageWidgetProps): React.ReactElement {
  const stats = useMemo(() => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recent = entries.filter((e) => !e.deletedAt && new Date(e.date) >= thirtyDaysAgo);

    // Count platform appearances (an entry can appear on multiple platforms)
    const counts: Record<string, number> = {};
    let totalAppearances = 0;
    recent.forEach((e) => {
      (e.platforms || []).forEach((p) => {
        counts[p] = (counts[p] || 0) + 1;
        totalAppearances++;
      });
    });

    const total = totalAppearances || 1;
    return ALL_PLATFORMS.map((platform) => {
      const count = counts[platform] || 0;
      const pct = Math.round((count / total) * 100);
      const tier = PLATFORM_TIERS[platform];
      return { platform, count, pct, tier };
    });
  }, [entries]);

  // Group by tier for summary
  const tierStats = useMemo(() => {
    const totals: Record<number, number> = { 1: 0, 2: 0, 3: 0 };
    let grandTotal = 0;
    stats.forEach(({ count, tier }) => {
      totals[tier] += count;
      grandTotal += count;
    });
    const gt = grandTotal || 1;
    return [1, 2, 3].map((tier) => ({
      tier,
      pct: Math.round((totals[tier] / gt) * 100),
      target: TIER_TARGETS[tier],
    }));
  }, [stats]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Platform coverage (30 days)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex gap-3">
            {tierStats.map(({ tier, pct, target }) => (
              <div key={tier} className="flex-1 rounded-lg bg-graystone-50 px-2 py-1.5 text-center">
                <div className="text-[10px] font-semibold uppercase text-graystone-500">
                  Tier {tier}
                </div>
                <div className="text-sm font-bold text-graystone-800">{pct}%</div>
                <div className="text-[10px] text-graystone-400">target {target}%</div>
              </div>
            ))}
          </div>
          <div className="space-y-1.5">
            {stats.map(({ platform, count, pct, tier }) => (
              <div key={platform} className="flex items-center gap-2 text-xs">
                <span className="w-20 truncate text-graystone-700">{platform}</span>
                <div className="h-1.5 flex-1 rounded-full bg-graystone-100">
                  <div
                    className={`h-1.5 rounded-full ${TIER_COLORS[tier]}`}
                    style={{ width: `${Math.max(pct, 2)}%` }}
                  />
                </div>
                <span className="w-8 text-right text-graystone-500">{count}</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
