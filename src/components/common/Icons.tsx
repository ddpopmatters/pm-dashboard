import React from 'react';
import { cx } from '../../lib/utils';
import type { SVGProps, ReactNode } from 'react';

const iconBase = 'h-4 w-4 shrink-0 text-ocean-500';

export interface IconProps extends SVGProps<SVGSVGElement> {
  /** Additional CSS classes */
  className?: string;
}

export interface SvgIconProps extends IconProps {
  /** SVG children elements */
  children: ReactNode;
}

export function SvgIcon({ children, className, ...props }: SvgIconProps): React.ReactElement {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={cx(iconBase, className)}
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  );
}

export function CalendarIcon({ className = iconBase, ...props }: IconProps): React.ReactElement {
  return (
    <SvgIcon className={className} {...props}>
      <rect x="3" y="4" width="18" height="18" rx="3" />
      <line x1="3" y1="10" x2="21" y2="10" stroke="currentColor" strokeWidth="2" />
      <line x1="8" y1="2" x2="8" y2="6" stroke="currentColor" strokeWidth="2" />
      <line x1="16" y1="2" x2="16" y2="6" stroke="currentColor" strokeWidth="2" />
    </SvgIcon>
  );
}

export function ChevronDownIcon({ className = iconBase, ...props }: IconProps): React.ReactElement {
  return (
    <SvgIcon className={className} {...props}>
      <path
        d="M6.75 9.25 12 14.5l5.25-5.25"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </SvgIcon>
  );
}

export function CheckCircleIcon({ className = iconBase, ...props }: IconProps): React.ReactElement {
  return (
    <SvgIcon className={cx(className, 'text-emerald-600')} {...props}>
      <path d="M12 2a10 10 0 1 0 .001 20.001A10 10 0 0 0 12 2Zm-1 14-4-4 1.414-1.414L11 12.172l4.586-4.586L17 9l-6 7Z" />
    </SvgIcon>
  );
}

export function LoaderIcon({ className = iconBase, ...props }: IconProps): React.ReactElement {
  return (
    <SvgIcon className={cx(className, 'animate-spin text-amber-600')} {...props}>
      <path d="M12 2a10 10 0 0 0-9.95 9h2.02A8 8 0 1 1 12 20a7.96 7.96 0 0 1-5.66-2.34l-1.42 1.42A9.96 9.96 0 0 0 12 22a10 10 0 0 0 0-20Z" />
    </SvgIcon>
  );
}

export function TrashIcon({ className = iconBase, ...props }: IconProps): React.ReactElement {
  return (
    <SvgIcon className={className} {...props}>
      <path d="M9 3h6l1 2h5v2h-2v12a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V7H3V5h5l1-2Zm2 6v8h2V9h-2Z" />
    </SvgIcon>
  );
}

export function RotateCcwIcon({ className = iconBase, ...props }: IconProps): React.ReactElement {
  return (
    <SvgIcon className={className} {...props}>
      <path d="M11 2v3a1 1 0 0 1-1 1H7l3.293 3.293-1.414 1.414L3.586 6.414a2 2 0 0 1 0-2.828L8.879.293 10.293 1.707 7.586 4.414H10a3 3 0 0 0 3-3V0h-2Zm1 4a8 8 0 1 1-7.446 5.1l1.895.633A6 6 0 1 0 12 6V4Z" />
    </SvgIcon>
  );
}

export function PlusIcon({ className = iconBase, ...props }: IconProps): React.ReactElement {
  return (
    <SvgIcon className={className} {...props}>
      <path d="M11 4h2v6h6v2h-6v6h-2v-6H5v-2h6V4Z" />
    </SvgIcon>
  );
}

export function XIcon({ className = iconBase, ...props }: IconProps): React.ReactElement {
  return (
    <SvgIcon className={className} {...props}>
      <path
        d="M18 6 6 18M6 6l12 12"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
    </SvgIcon>
  );
}

export function CopyIcon({ className = iconBase, ...props }: IconProps): React.ReactElement {
  return (
    <SvgIcon className={className} {...props}>
      <rect
        x="9"
        y="9"
        width="13"
        height="13"
        rx="2"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
      />
      <path
        d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
      />
    </SvgIcon>
  );
}

export function ArrowUpIcon({ className = iconBase, ...props }: IconProps): React.ReactElement {
  return (
    <SvgIcon className={className} {...props}>
      <path
        d="M12 19V5m0 0-7 7m7-7 7 7"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </SvgIcon>
  );
}

export function ArrowPathIcon({ className = iconBase, ...props }: IconProps): React.ReactElement {
  return (
    <SvgIcon className={className} {...props}>
      <path
        d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </SvgIcon>
  );
}

export function ClockIcon({ className = iconBase, ...props }: IconProps): React.ReactElement {
  return (
    <SvgIcon className={className} {...props}>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" fill="none" />
      <path
        d="M12 7v5l3 3"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </SvgIcon>
  );
}

const Icons = {
  Calendar: CalendarIcon,
  ChevronDown: ChevronDownIcon,
  CheckCircle: CheckCircleIcon,
  Loader: LoaderIcon,
  Trash: TrashIcon,
  RotateCcw: RotateCcwIcon,
  Plus: PlusIcon,
  X: XIcon,
  Copy: CopyIcon,
  ArrowUp: ArrowUpIcon,
  ArrowPath: ArrowPathIcon,
  Clock: ClockIcon,
};

export default Icons;
