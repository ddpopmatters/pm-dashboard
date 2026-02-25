import { cx } from "../utils.js";
import { ALL_PLATFORMS, DEFAULT_APPROVERS, PLATFORM_IMAGES } from "../constants.js";

const { useState } = React;

export const iconBase = "h-4 w-4 shrink-0 text-ocean-500";

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
    <path d="M6.75 9.25 12 14.5l5.25-5.25" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
  </SvgIcon>
);

export const CheckCircleIcon = ({ className = iconBase }) => (
  <SvgIcon className={cx(className, "text-emerald-600")}>
    <path d="M12 2a10 10 0 1 0 .001 20.001A10 10 0 0 0 12 2Zm-1 14-4-4 1.414-1.414L11 12.172l4.586-4.586L17 9l-6 7Z" />
  </SvgIcon>
);

export const LoaderIcon = ({ className = iconBase }) => (
  <SvgIcon className={cx(className, "animate-spin text-amber-600")}>
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

export function PlatformIcon({ platform }) {
  const src = PLATFORM_IMAGES[platform];
  const [failed, setFailed] = useState(false);
  if (!src || failed) {
    return (
      <span className="flex h-4 w-4 items-center justify-center rounded-full bg-aqua-100 text-[10px] font-semibold text-ocean-700">
        {platform.slice(0, 1)}
      </span>
    );
  }
  return (
    <img
      src={src}
      alt={`${platform} logo`}
      className="h-4 w-4 object-contain"
      loading="lazy"
      referrerPolicy="no-referrer"
      crossOrigin="anonymous"
      onError={() => setFailed(true)}
    />
  );
}

export const Card = ({ className = "", children }) => (
  <div className={cx("rounded-2xl border border-graystone-200 bg-white shadow-sm", className)}>{children}</div>
);

export const CardHeader = ({ className = "", children }) => (
  <div className={cx("border-b border-graystone-200 px-5 py-4", className)}>{children}</div>
);

export const CardContent = ({ className = "", children }) => (
  <div className={cx("px-5 py-4", className)}>{children}</div>
);

export const CardTitle = ({ className = "", children }) => (
  <div className={cx("flex items-center gap-2", className)}>
    <span className="inline-block h-3 w-3 rounded-full bg-[#00F5FF]" aria-hidden="true" />
    <h2 className="heading-font text-lg font-semibold text-ocean-800">{children}</h2>
  </div>
);

export const Badge = ({ variant = "default", className = "", children }) => {
  const styles = {
    default: "bg-aqua-100 text-ocean-700",
    secondary: "bg-graystone-100 text-graystone-700",
    outline: "border border-aqua-200 text-ocean-700 bg-aqua-50",
  };
  return (
    <span className={cx("inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium", styles[variant], className)}>
      {children}
    </span>
  );
};

export const CopyCheckSection = window.CopyCheckSection || (() => null);

export const NotificationBell = ({ notifications, unreadCount, onOpenItem }) => {
  const [open, setOpen] = useState(false);
  const topItems = (notifications || []).slice(0, 8);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="relative inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#00F5FF] text-black shadow-[0_0_20px_rgba(15,157,222,0.35)] transition hover:-translate-y-0.5"
        aria-label={unreadCount ? `${unreadCount} unread notifications` : "Notifications"}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          className="h-5 w-5"
          fill="currentColor"
        >
          <path d="M12 2a6 6 0 0 0-6 6v2.586a2 2 0 0 1-.586 1.414l-.828.828A1 1 0 0 0 5 15h14a1 1 0 0 0 .707-1.707l-.828-.828A2 2 0 0 1 18 10.586V8a6 6 0 0 0-6-6Zm0 20a3 3 0 0 0 2.995-2.824L15 19h-6a3 3 0 0 0 2.824 2.995L12 22Z" />
        </svg>
        <span className="absolute -bottom-1 -right-1 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-black px-1 text-[11px] font-semibold text-white">
          {unreadCount || 0}
        </span>
      </button>
      {open && (
        <div className="absolute right-0 z-50 mt-2 w-80 rounded-2xl border border-graystone-200 bg-white p-4 shadow-xl">
          <div className="flex items-center justify-between">
            <div className="heading-font flex items-center gap-2 text-sm font-semibold text-ocean-700">
              <span className="inline-block h-3 w-3 rounded-full bg-[#00F5FF]" aria-hidden="true" />
              Notifications
            </div>
            <button className="text-xs text-graystone-500 hover:text-ocean-600" onClick={() => setOpen(false)}>
              Close
            </button>
          </div>
          <div className="mt-3 space-y-2">
            {topItems.length === 0 ? (
              <p className="text-xs text-graystone-500">You're all caught up.</p>
            ) : (
              topItems.map((note) => (
                <button
                  key={note.id}
                  className={cx(
                    "w-full rounded-xl border px-3 py-2 text-left text-sm transition",
                    note.read
                      ? "border-graystone-200 bg-white hover:border-aqua-200 hover:bg-aqua-50"
                      : "border-aqua-200 bg-aqua-50 hover:border-ocean-300"
                  )}
                  onClick={() => {
                    onOpenItem(note);
                    setOpen(false);
                  }}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium text-ocean-700">{note.message}</span>
                    <span className="text-[11px] text-graystone-500">
                      {note.createdAt ? new Date(note.createdAt).toLocaleString() : ""}
                    </span>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export const Button = ({
  type = "button",
  variant = "solid",
  size = "md",
  disabled = false,
  className = "",
  onClick,
  children,
}) => {
  const base =
    "heading-font inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-all focus:outline-none focus-visible:ring-4 focus-visible:ring-[#0F9DDE]/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[#CFEBF8] disabled:cursor-not-allowed disabled:opacity-60";
  const variants = {
    solid:
      "border border-black bg-black text-white shadow-[0_0_30px_rgba(15,157,222,0.35)] hover:-translate-y-0.5 hover:bg-white hover:text-black",
    outline:
      "border border-black bg-white text-black hover:-translate-y-0.5 hover:bg-black hover:text-white",
    ghost: "text-black hover:bg-black/10",
    destructive:
      "border border-rose-500 bg-rose-600 text-white shadow-[0_0_25px_rgba(244,63,94,0.35)] hover:-translate-y-0.5 hover:bg-rose-700",
    cta:
      "border border-[#0F9DDE]/40 bg-white text-black shadow-[0_0_35px_rgba(15,157,222,0.3)] hover:-translate-y-0.5 hover:shadow-[0_0_45px_rgba(15,157,222,0.45)]",
  };
  const sizes = {
    sm: "px-4 py-1.5 text-xs",
    md: "px-6 py-2 text-sm",
    lg: "px-7 py-3 text-base",
    icon: "h-10 w-10",
  };
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={cx(base, variants[variant] || variants.solid, sizes[size], className)}
    >
      {children}
    </button>
  );
};

export const selectBaseClasses =
  "dropdown-font rounded-full border border-black bg-white px-4 py-2 text-sm font-normal text-black shadow-[0_0_20px_rgba(15,157,222,0.2)] transition hover:bg-black hover:text-white focus:border-black focus:outline-none focus:ring-4 focus:ring-[#0F9DDE]/40 focus:ring-offset-2 focus:ring-offset-[#CFEBF8] disabled:cursor-not-allowed disabled:opacity-60";

export const fileInputClasses =
  "heading-font w-full max-w-xs text-sm text-graystone-600 file:rounded-full file:border file:border-black file:bg-black file:px-5 file:py-2 file:text-sm file:font-semibold file:text-white file:shadow-[0_0_30px_rgba(15,157,222,0.35)] file:transition file:hover:bg-white file:hover:text-black file:hover:shadow-[0_0_40px_rgba(15,157,222,0.45)]";

export const Input = ({ className = "", type = "text", ...props }) => {
  const isPicker = type === "date" || type === "month" || type === "time";
  const base = isPicker
    ? cx(selectBaseClasses, "w-full")
    : "w-full rounded-lg border border-graystone-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-ocean-500 focus:outline-none focus:ring-2 focus:ring-aqua-200";
  return (
    <input
      type={type}
      className={cx(base, className)}
      {...props}
    />
  );
};

export const Textarea = ({ className = "", rows = 3, ...props }) => (
  <textarea
    rows={rows}
    className={cx(
      "w-full rounded-lg border border-graystone-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-ocean-500 focus:outline-none focus:ring-2 focus:ring-aqua-200",
      className
    )}
    {...props}
  />
);

export const Label = ({ htmlFor, className = "", children }) => (
  <label htmlFor={htmlFor} className={cx("block text-sm font-medium text-graystone-700", className)}>
    {children}
  </label>
);

export const Separator = () => <div className="h-px w-full bg-graystone-200" />;

export const Toggle = ({ checked, onChange, id, ariaLabel }) => (
  <label className="inline-flex cursor-pointer items-center gap-3" htmlFor={id}>
    <span className="relative inline-flex items-center">
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="peer sr-only"
        aria-label={ariaLabel}
      />
      <span className="h-5 w-10 rounded-full bg-graystone-300 transition-colors peer-checked:bg-aqua-500" />
      <span className="absolute left-[3px] top-[3px] h-4 w-4 rounded-full bg-white transition-all peer-checked:translate-x-5 peer-checked:bg-white" />
    </span>
  </label>
);

export const MULTI_OPTION_BASE =
  "dropdown-font flex cursor-pointer items-center gap-3 px-4 py-2 text-sm font-normal text-black transition hover:bg-black hover:text-white";

export const checklistCheckboxClass =
  "h-4 w-4 rounded border-black bg-white text-[#00F5FF] focus:ring-0 focus:ring-offset-0";

export const MultiSelect = ({ placeholder, value, onChange, options }) => {
  const [open, setOpen] = useState(false);
  const toggle = (val) => {
    const exists = value.includes(val);
    onChange(exists ? value.filter((x) => x !== val) : [...value, val]);
  };
  return (
    <div className="relative">
      <Button
        variant="outline"
        className="w-full justify-between px-4 py-2"
        onClick={() => setOpen((prev) => !prev)}
      >
        <span className="text-sm">
          {value.length ? `${value.length} selected` : placeholder}
        </span>
        <ChevronDownIcon className="h-4 w-4" />
      </Button>
      {open && (
        <div className="absolute left-0 top-12 z-30 w-full rounded-3xl border border-black bg-white text-black shadow-[0_0_25px_rgba(15,157,222,0.3)]">
          <div className="max-h-52 overflow-y-auto py-2">
            {options.map((option) => (
              <label
                key={option.value}
                className={MULTI_OPTION_BASE}
              >
                <input
                  type="checkbox"
                  className={checklistCheckboxClass}
                  checked={value.includes(option.value)}
                  onChange={() => toggle(option.value)}
                />
                {option.icon ? <span className="transition-colors">{option.icon}</span> : null}
                <span className="text-sm font-normal">{option.label}</span>
              </label>
            ))}
          </div>
          <div className="flex items-center justify-between border-t border-black/10 px-3 py-3">
            <Button variant="ghost" size="sm" onClick={() => onChange([])} className="heading-font text-sm">
              Clear
            </Button>
            <Button size="sm" onClick={() => setOpen(false)}>
              Done
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export const PlatformFilter = ({ value, onChange }) => (
  <MultiSelect
    placeholder="All platforms"
    value={value}
    onChange={onChange}
    options={ALL_PLATFORMS.map((platform) => ({
      value: platform,
      label: platform,
      icon: <PlatformIcon platform={platform} />,
    }))}
  />
);

export const ApproverMulti = ({ value, onChange }) => (
  <MultiSelect
    placeholder="Select approvers"
    value={value}
    onChange={onChange}
    options={DEFAULT_APPROVERS.map((name) => ({
      value: name,
      label: name,
    }))}
  />
);

export const Modal = ({ open, onClose, children }) => {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 px-4 py-8"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="floating-panel w-full max-w-3xl overflow-hidden rounded-3xl border border-aqua-200">
        {children}
      </div>
    </div>
  );
};

export const FieldRow = ({ label, children }) => (
  <div className="grid grid-cols-3 gap-4">
    <div className="col-span-1 pt-2 text-sm font-medium text-graystone-700">{label}</div>
    <div className="col-span-2 space-y-2 text-sm text-graystone-800">{children}</div>
  </div>
);
