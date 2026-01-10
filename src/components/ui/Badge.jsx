import { cx } from '../../lib/utils';

const variants = {
  default: 'bg-graystone-100 text-graystone-800',
  primary: 'bg-ocean-100 text-ocean-800',
  secondary: 'bg-graystone-100 text-graystone-600',
  success: 'bg-emerald-100 text-emerald-800',
  warning: 'bg-amber-100 text-amber-800',
  danger: 'bg-rose-100 text-rose-800',
  info: 'bg-sky-100 text-sky-800',
  outline: 'border border-graystone-300 text-graystone-700 bg-transparent',
};

export function Badge({ variant = 'default', className = '', children }) {
  return (
    <span
      className={cx(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold',
        variants[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}

export default Badge;
