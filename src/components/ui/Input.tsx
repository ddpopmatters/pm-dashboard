import { cx } from '../../lib/utils';
import { forwardRef, type InputHTMLAttributes } from 'react';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  /** Additional CSS classes */
  className?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', type = 'text', ...props }, ref) => {
    return (
      <input
        ref={ref}
        type={type}
        className={cx(
          'w-full rounded-xl border border-graystone-300 bg-white px-4 py-2.5 text-sm text-graystone-900 placeholder:text-graystone-400',
          'focus:border-aqua-400 focus:outline-none focus:ring-2 focus:ring-aqua-100',
          'disabled:cursor-not-allowed disabled:bg-graystone-50 disabled:text-graystone-500',
          className,
        )}
        {...props}
      />
    );
  },
);

Input.displayName = 'Input';

export default Input;
