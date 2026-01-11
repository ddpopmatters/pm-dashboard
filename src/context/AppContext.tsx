/**
 * AppContext - Global application navigation state
 *
 * Manages:
 * - currentView: Which main view is active (menu, form, plan, approvals, admin)
 * - planTab: Which tab is active within the plan view
 * - monthCursor: Currently selected month for calendar views
 *
 * This context centralizes navigation state that was previously
 * scattered across useState calls in app.jsx.
 */
import { createContext, useContext, useState, useCallback, useMemo, type ReactNode } from 'react';
import type { ViewType, PlanTab } from '../types';

// ============================================================================
// Types
// ============================================================================

export interface AppState {
  currentView: ViewType;
  planTab: PlanTab;
  monthCursor: Date;
}

export interface AppContextValue extends AppState {
  // View navigation
  setCurrentView: (view: ViewType) => void;
  navigateTo: (view: ViewType, tab?: PlanTab) => void;

  // Plan tab navigation
  setPlanTab: (tab: PlanTab) => void;

  // Month navigation
  setMonthCursor: (date: Date) => void;
  goToPreviousMonth: () => void;
  goToNextMonth: () => void;
  goToToday: () => void;

  // Computed values
  monthLabel: string;
}

// ============================================================================
// Context
// ============================================================================

const AppContext = createContext<AppContextValue | null>(null);

// ============================================================================
// Provider
// ============================================================================

export interface AppProviderProps {
  children: ReactNode;
  initialView?: ViewType;
  initialTab?: PlanTab;
}

export function AppProvider({
  children,
  initialView = 'menu',
  initialTab = 'plan',
}: AppProviderProps) {
  const [currentView, setCurrentView] = useState<ViewType>(initialView);
  const [planTab, setPlanTab] = useState<PlanTab>(initialTab);
  const [monthCursor, setMonthCursor] = useState<Date>(() => new Date());

  // Combined navigation helper
  const navigateTo = useCallback((view: ViewType, tab?: PlanTab) => {
    setCurrentView(view);
    if (tab) {
      setPlanTab(tab);
    }
  }, []);

  // Month navigation helpers
  const goToPreviousMonth = useCallback(() => {
    setMonthCursor((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  }, []);

  const goToNextMonth = useCallback(() => {
    setMonthCursor((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  }, []);

  const goToToday = useCallback(() => {
    setMonthCursor(new Date());
  }, []);

  // Computed month label (uses browser locale to match existing behavior)
  const monthLabel = useMemo(() => {
    return monthCursor.toLocaleDateString(undefined, {
      month: 'long',
      year: 'numeric',
    });
  }, [monthCursor]);

  const value = useMemo<AppContextValue>(
    () => ({
      currentView,
      planTab,
      monthCursor,
      setCurrentView,
      setPlanTab,
      setMonthCursor,
      navigateTo,
      goToPreviousMonth,
      goToNextMonth,
      goToToday,
      monthLabel,
    }),
    [
      currentView,
      planTab,
      monthCursor,
      navigateTo,
      goToPreviousMonth,
      goToNextMonth,
      goToToday,
      monthLabel,
    ],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

// ============================================================================
// Hook
// ============================================================================

export function useApp(): AppContextValue {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}

// ============================================================================
// Convenience Hooks
// ============================================================================

/**
 * Get current view state with navigation helpers.
 *
 * Note: These hooks still subscribe to the full context, so components
 * will re-render on any context change. For true selective subscriptions,
 * consider using a state management library with selectors (like Zustand)
 * or splitting into multiple contexts if performance becomes an issue.
 */
export function useCurrentView() {
  const { currentView, setCurrentView, navigateTo } = useApp();
  return { currentView, setCurrentView, navigateTo };
}

/**
 * Get plan tab state
 */
export function usePlanTab() {
  const { planTab, setPlanTab } = useApp();
  return { planTab, setPlanTab };
}

/**
 * Get month navigation state and helpers
 */
export function useMonthNavigation() {
  const { monthCursor, setMonthCursor, goToPreviousMonth, goToNextMonth, goToToday, monthLabel } =
    useApp();
  return {
    monthCursor,
    setMonthCursor,
    goToPreviousMonth,
    goToNextMonth,
    goToToday,
    monthLabel,
  };
}

export default AppContext;
