import React from 'react';
import { PLATFORM_TIPS, PLATFORM_TIERS, CONTENT_PILLAR_DESCRIPTIONS } from '../../constants';
import type { Platform, ContentPillar } from '../../constants';

export interface PlatformGuidancePanelProps {
  platforms: string[];
  contentPillar?: string;
}

const TIER_LABELS: Record<number, string> = {
  1: 'Tier 1 — Primary',
  2: 'Tier 2 — Secondary',
  3: 'Tier 3 — Experimental',
};

const TIER_COLORS: Record<number, string> = {
  1: 'bg-emerald-100 text-emerald-700',
  2: 'bg-amber-100 text-amber-700',
  3: 'bg-graystone-100 text-graystone-600',
};

export function PlatformGuidancePanel({
  platforms,
  contentPillar,
}: PlatformGuidancePanelProps): React.ReactElement | null {
  if (platforms.length === 0 && !contentPillar) return null;

  return (
    <aside className="space-y-4 rounded-2xl border border-aqua-200 bg-aqua-50 p-4 text-sm text-graystone-700">
      <div>
        <h3 className="text-base font-semibold text-ocean-700">Strategy guidance</h3>
        <p className="text-xs text-graystone-600">
          Platform and pillar context from the Content Creation Guide.
        </p>
      </div>

      {contentPillar && (
        <div className="space-y-1">
          <div className="text-sm font-semibold text-ocean-700">{contentPillar}</div>
          <p className="text-xs text-graystone-600">
            {CONTENT_PILLAR_DESCRIPTIONS[contentPillar as ContentPillar] || ''}
          </p>
          {contentPillar === 'Population & Demographics' && (
            <p className="mt-1 rounded-lg bg-amber-50 px-2 py-1 text-xs font-medium text-amber-700">
              Pillar 2 content requires extra Golden Thread scrutiny. The co-option risk is highest
              here.
            </p>
          )}
        </div>
      )}

      {platforms.map((platform) => {
        const tips = PLATFORM_TIPS[platform as Platform];
        const tier = PLATFORM_TIERS[platform as Platform];
        if (!tips) return null;
        return (
          <div key={platform} className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-ocean-700">{platform}</span>
              {tier && (
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${TIER_COLORS[tier]}`}
                >
                  {TIER_LABELS[tier]}
                </span>
              )}
            </div>
            <ul className="ml-4 list-disc space-y-1 text-xs text-graystone-600">
              {tips.slice(0, 5).map((tip, idx) => (
                <li key={idx}>{tip}</li>
              ))}
            </ul>
          </div>
        );
      })}
    </aside>
  );
}

export default PlatformGuidancePanel;
