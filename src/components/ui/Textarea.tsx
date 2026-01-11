import { cx } from '../../lib/utils';
import { forwardRef, type TextareaHTMLAttributes } from 'react';

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  /** Additional CSS classes */
  className?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className = '', rows = 3, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        rows={rows}
        className={cx(
          'w-full rounded-xl border border-graystone-300 bg-white px-4 py-2.5 text-sm text-graystone-900 placeholder:text-graystone-400',
          'focus:border-aqua-400 focus:outline-none focus:ring-2 focus:ring-aqua-100',
          'disabled:cursor-not-allowed disabled:bg-graystone-50 disabled:text-graystone-500',
          'resize-y',
          className,
        )}
        {...props}
      />
    );
  },
);

Textarea.displayName = 'Textarea';

export default Textarea;
