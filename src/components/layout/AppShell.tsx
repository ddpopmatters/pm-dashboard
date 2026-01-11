/**
 * AppShell - Main application container
 *
 * Provides the consistent page layout wrapper with max-width and padding.
 * Use this as the outer wrapper for all authenticated views.
 */
import type { ReactNode } from 'react';

export interface AppShellProps {
  children: ReactNode;
  className?: string;
}

export function AppShell({ children, className = '' }: AppShellProps) {
  return <div className={`mx-auto max-w-7xl px-4 py-8 ${className}`.trim()}>{children}</div>;
}

export default AppShell;
