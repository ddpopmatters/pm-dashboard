import { cx } from '../../lib/utils';
import { forwardRef, type ButtonHTMLAttributes } from 'react';

export interface ToggleProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onChange'> {
  /** Whether the toggle is checked */
  checked: boolean;
  /** Callback when toggle state changes */
  onChange?: (checked: boolean) => void;
  /** Accessible label for the toggle */
  'aria-label': string;
}

export const Toggle = forwardRef<HTMLButtonElement, ToggleProps>(
  ({ checked, onChange, disabled = false, className, ...props }, ref) => {
    return (
      <button
        ref={ref}
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        {...props}
        onClick={(e) => {
          props.onClick?.(e);
          onChange?.(!checked);
        }}
        className={cx(
          'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aqua-400 focus-visible:ring-offset-2',
          'disabled:cursor-not-allowed disabled:opacity-50',
          checked ? 'bg-ocean-600' : 'bg-graystone-200',
          className,
        )}
      >
        <span
          className={cx(
            'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out',
            checked ? 'translate-x-5' : 'translate-x-0',
          )}
        />
      </button>
    );
  },
);

Toggle.displayName = 'Toggle';

export default Toggle;
