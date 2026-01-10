import { cx } from '../../lib/utils';

export function Textarea({ className = '', rows = 3, ...props }) {
  return (
    <textarea
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
}

export default Textarea;
