import { cx } from '../../lib/utils';

export function Label({ htmlFor, className = '', children }) {
  return (
    <label
      htmlFor={htmlFor}
      className={cx('block text-sm font-medium text-graystone-700', className)}
    >
      {children}
    </label>
  );
}

export default Label;
