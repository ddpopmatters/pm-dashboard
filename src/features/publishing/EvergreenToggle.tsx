import React from 'react';
import { Toggle } from '../../components/ui';
import { cx } from '../../lib/utils';

export interface EvergreenToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  showLabel?: boolean;
  size?: 'sm' | 'md';
}

/**
 * Toggle for marking content as evergreen (can be reshared)
 */
export function EvergreenToggle({
  checked,
  onChange,
  disabled,
  showLabel = true,
  size = 'md',
}: EvergreenToggleProps): React.ReactElement {
  return (
    <div className={cx('flex items-center gap-2', size === 'sm' && 'text-sm')}>
      <Toggle checked={checked} onChange={onChange} disabled={disabled} />
      {showLabel && (
        <div className="flex items-center gap-1.5">
          <span
            className={cx('text-lg', checked ? 'opacity-100' : 'opacity-40')}
            title="Evergreen content"
          >
            🌲
          </span>
          <span className={cx('font-medium', checked ? 'text-emerald-700' : 'text-graystone-500')}>
            Evergreen
          </span>
        </div>
      )}
    </div>
  );
}

/**
 * Evergreen badge indicator for list/calendar views
 */
export function EvergreenBadge({ size = 'md' }: { size?: 'sm' | 'md' }): React.ReactElement {
  return (
    <span
      className={cx(
        'inline-flex items-center gap-1 rounded-full bg-emerald-100 text-emerald-700',
        size === 'sm' ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-1 text-xs',
      )}
      title="Evergreen content - can be reshared"
    >
      <span>🌲</span>
      {size !== 'sm' && <span>Evergreen</span>}
    </span>
  );
}

export default EvergreenToggle;
