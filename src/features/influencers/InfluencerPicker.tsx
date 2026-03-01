import React from 'react';
import { Label } from '../../components/ui';
import { cx } from '../../lib/utils';
import { selectBaseClasses } from '../../lib/styles';
import type { Influencer } from '../../types/models';

export interface InfluencerPickerProps {
  influencers: Influencer[];
  value: string | undefined;
  onChange: (influencerId: string | undefined) => void;
  showOnlyActive?: boolean;
  label?: string;
  className?: string;
}

export const InfluencerPicker: React.FC<InfluencerPickerProps> = ({
  influencers,
  value,
  onChange,
  showOnlyActive = true,
  label = 'Influencer',
  className,
}) => {
  const filteredInfluencers = showOnlyActive
    ? influencers.filter((i) => i.status === 'Direct Outreach' || i.status === 'Collaborate')
    : influencers;

  return (
    <div className={className}>
      {label && <Label className="mb-1">{label}</Label>}
      <select
        value={value || ''}
        onChange={(e) => onChange(e.target.value || undefined)}
        className={cx(selectBaseClasses, 'w-full px-3 py-2')}
      >
        <option value="">No influencer</option>
        {filteredInfluencers.map((influencer) => (
          <option key={influencer.id} value={influencer.id}>
            {influencer.name} ({influencer.platform})
          </option>
        ))}
      </select>
    </div>
  );
};
