import { cx } from '../../lib/utils';

export function Separator({ className = '', orientation = 'horizontal' }) {
  return (
    <div
      className={cx(
        'bg-graystone-200',
        orientation === 'horizontal' ? 'h-px w-full' : 'h-full w-px',
        className,
      )}
    />
  );
}

export default Separator;
