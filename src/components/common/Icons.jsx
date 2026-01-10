import { cx } from '../../lib/utils';

const iconBase = 'h-4 w-4 shrink-0 text-ocean-500';

export const SvgIcon = ({ children, className }) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={cx(iconBase, className)}
    aria-hidden="true"
  >
    {children}
  </svg>
);

export const CalendarIcon = ({ className = iconBase }) => (
  <SvgIcon className={className}>
    <rect x="3" y="4" width="18" height="18" rx="3" />
    <line x1="3" y1="10" x2="21" y2="10" stroke="currentColor" strokeWidth="2" />
    <line x1="8" y1="2" x2="8" y2="6" stroke="currentColor" strokeWidth="2" />
    <line x1="16" y1="2" x2="16" y2="6" stroke="currentColor" strokeWidth="2" />
  </SvgIcon>
);

export const ChevronDownIcon = ({ className = iconBase }) => (
  <SvgIcon className={className}>
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

export const ChevronLeftIcon = ({ className = iconBase }) => (
  <SvgIcon className={className}>
    <path
      d="M14.5 6.75 9.25 12l5.25 5.25"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
  </SvgIcon>
);

export const ChevronRightIcon = ({ className = iconBase }) => (
  <SvgIcon className={className}>
    <path
      d="M9.5 6.75 14.75 12 9.5 17.25"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
  </SvgIcon>
);

export const CheckCircleIcon = ({ className = iconBase }) => (
  <SvgIcon className={cx(className, 'text-emerald-600')}>
    <path d="M12 2a10 10 0 1 0 .001 20.001A10 10 0 0 0 12 2Zm-1 14-4-4 1.414-1.414L11 12.172l4.586-4.586L17 9l-6 7Z" />
  </SvgIcon>
);

export const LoaderIcon = ({ className = iconBase }) => (
  <SvgIcon className={cx(className, 'animate-spin text-amber-600')}>
    <path d="M12 2a10 10 0 0 0-9.95 9h2.02A8 8 0 1 1 12 20a7.96 7.96 0 0 1-5.66-2.34l-1.42 1.42A9.96 9.96 0 0 0 12 22a10 10 0 0 0 0-20Z" />
  </SvgIcon>
);

export const TrashIcon = ({ className = iconBase }) => (
  <SvgIcon className={className}>
    <path d="M9 3h6l1 2h5v2h-2v12a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V7H3V5h5l1-2Zm2 6v8h2V9h-2Z" />
  </SvgIcon>
);

export const RotateCcwIcon = ({ className = iconBase }) => (
  <SvgIcon className={className}>
    <path d="M11 2v3a1 1 0 0 1-1 1H7l3.293 3.293-1.414 1.414L3.586 6.414a2 2 0 0 1 0-2.828L8.879.293 10.293 1.707 7.586 4.414H10a3 3 0 0 0 3-3V0h-2Zm1 4a8 8 0 1 1-7.446 5.1l1.895.633A6 6 0 1 0 12 6V4Z" />
  </SvgIcon>
);

export const PlusIcon = ({ className = iconBase }) => (
  <SvgIcon className={className}>
    <path d="M11 4h2v6h6v2h-6v6h-2v-6H5v-2h6V4Z" />
  </SvgIcon>
);

export const XIcon = ({ className = iconBase }) => (
  <SvgIcon className={className}>
    <path
      d="M18 6 6 18M6 6l12 12"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      fill="none"
    />
  </SvgIcon>
);

export const SearchIcon = ({ className = iconBase }) => (
  <SvgIcon className={className}>
    <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" fill="none" />
    <path
      d="M21 21l-4.35-4.35"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      fill="none"
    />
  </SvgIcon>
);

export const CopyIcon = ({ className = iconBase }) => (
  <SvgIcon className={className}>
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

export const BellIcon = ({ className = iconBase }) => (
  <SvgIcon className={className}>
    <path
      d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"
      stroke="currentColor"
      strokeWidth="2"
      fill="none"
    />
    <path d="M13.73 21a2 2 0 0 1-3.46 0" stroke="currentColor" strokeWidth="2" fill="none" />
  </SvgIcon>
);

export const SettingsIcon = ({ className = iconBase }) => (
  <SvgIcon className={className}>
    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" fill="none" />
    <path
      d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"
      stroke="currentColor"
      strokeWidth="2"
      fill="none"
    />
  </SvgIcon>
);

export default {
  Calendar: CalendarIcon,
  ChevronDown: ChevronDownIcon,
  ChevronLeft: ChevronLeftIcon,
  ChevronRight: ChevronRightIcon,
  CheckCircle: CheckCircleIcon,
  Loader: LoaderIcon,
  Trash: TrashIcon,
  RotateCcw: RotateCcwIcon,
  Plus: PlusIcon,
  X: XIcon,
  Search: SearchIcon,
  Copy: CopyIcon,
  Bell: BellIcon,
  Settings: SettingsIcon,
};
