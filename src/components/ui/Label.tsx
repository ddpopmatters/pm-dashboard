import { cx } from '../../lib/utils';
import { forwardRef, type LabelHTMLAttributes, type ReactNode } from 'react';

export interface LabelProps extends LabelHTMLAttributes<HTMLLabelElement> {
  /** Additional CSS classes */
  className?: string;
  /** Label content */
  children?: ReactNode;
}

export const Label = forwardRef<HTMLLabelElement, LabelProps>(
  ({ htmlFor, className = '', children, ...props }, ref) => {
    return (
      <label
        ref={ref}
        htmlFor={htmlFor}
        className={cx('block text-sm font-medium text-graystone-700', className)}
        {...props}
      >
        {children}
      </label>
    );
  },
);

Label.displayName = 'Label';

export default Label;
