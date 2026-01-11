import { cx } from '../../lib/utils';
import { forwardRef, type HTMLAttributes } from 'react';

export type SeparatorOrientation = 'horizontal' | 'vertical';

export interface SeparatorProps extends HTMLAttributes<HTMLDivElement> {
  /** Additional CSS classes */
  className?: string;
  /** Orientation of the separator */
  orientation?: SeparatorOrientation;
}

export const Separator = forwardRef<HTMLDivElement, SeparatorProps>(
  ({ className = '', orientation = 'horizontal', ...props }, ref) => {
    return (
      <div
        ref={ref}
        role="separator"
        aria-orientation={orientation}
        className={cx(
          'bg-graystone-200',
          orientation === 'horizontal' ? 'h-px w-full' : 'h-full w-px',
          className,
        )}
        {...props}
      />
    );
  },
);

Separator.displayName = 'Separator';

export default Separator;
