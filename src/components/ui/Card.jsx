import { cx } from '../../lib/utils';

export function Card({ className = '', children }) {
  return (
    <div className={cx('rounded-3xl border border-graystone-200 bg-white', className)}>
      {children}
    </div>
  );
}

export function CardHeader({ className = '', children }) {
  return <div className={cx('border-b border-graystone-100 px-6 py-5', className)}>{children}</div>;
}

export function CardContent({ className = '', children }) {
  return <div className={cx('px-6 py-5', className)}>{children}</div>;
}

export function CardTitle({ className = '', children }) {
  return <h3 className={cx('text-lg font-semibold text-ocean-900', className)}>{children}</h3>;
}

export default Card;
