/**
 * FilterContext - Entry filter state management
 *
 * Centralizes filter state for the calendar/plan views. Provides
 * filter values and setters, plus convenience methods for resetting.
 */
import { createContext, useContext, useState, useCallback, useMemo, type ReactNode } from 'react';
import type { FilterStatus, FilterWorkflow, EntryFilters } from '../types';

// ============================================================================
// Types
// ============================================================================

export interface FilterContextValue extends EntryFilters {
  // Setters
  setType: (type: string) => void;
  setStatus: (status: FilterStatus) => void;
  setPlatforms: (platforms: string[]) => void;
  togglePlatform: (platform: string) => void;
  setWorkflow: (workflow: FilterWorkflow) => void;
  setQuery: (query: string) => void;
  setOverdue: (overdue: boolean) => void;

  // Bulk operations
  setFilters: (filters: Partial<EntryFilters>) => void;
  resetFilters: () => void;

  // Computed
  hasActiveFilters: boolean;
  activeFilterCount: number;
}

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_FILTERS: EntryFilters = {
  type: 'All',
  status: 'All',
  platforms: [],
  workflow: 'All',
  query: '',
  overdue: false,
};

// ============================================================================
// Context
// ============================================================================

const FilterContext = createContext<FilterContextValue | null>(null);

// ============================================================================
// Provider
// ============================================================================

export interface FilterProviderProps {
  children: ReactNode;
  initialFilters?: Partial<EntryFilters>;
}

export function FilterProvider({ children, initialFilters }: FilterProviderProps) {
  const [type, setType] = useState<string>(initialFilters?.type ?? DEFAULT_FILTERS.type);
  const [status, setStatus] = useState<FilterStatus>(
    initialFilters?.status ?? DEFAULT_FILTERS.status,
  );
  const [platforms, setPlatforms] = useState<string[]>(
    initialFilters?.platforms ?? DEFAULT_FILTERS.platforms,
  );
  const [workflow, setWorkflow] = useState<FilterWorkflow>(
    initialFilters?.workflow ?? DEFAULT_FILTERS.workflow,
  );
  const [query, setQuery] = useState<string>(initialFilters?.query ?? DEFAULT_FILTERS.query);
  const [overdue, setOverdue] = useState<boolean>(
    initialFilters?.overdue ?? DEFAULT_FILTERS.overdue,
  );

  // Toggle a single platform in the selection
  const togglePlatform = useCallback((platform: string) => {
    setPlatforms((prev) =>
      prev.includes(platform) ? prev.filter((p) => p !== platform) : [...prev, platform],
    );
  }, []);

  // Set multiple filters at once
  const setFilters = useCallback((filters: Partial<EntryFilters>) => {
    if (filters.type !== undefined) setType(filters.type);
    if (filters.status !== undefined) setStatus(filters.status);
    if (filters.platforms !== undefined) setPlatforms(filters.platforms);
    if (filters.workflow !== undefined) setWorkflow(filters.workflow);
    if (filters.query !== undefined) setQuery(filters.query);
    if (filters.overdue !== undefined) setOverdue(filters.overdue);
  }, []);

  // Reset all filters to defaults
  const resetFilters = useCallback(() => {
    setType(DEFAULT_FILTERS.type);
    setStatus(DEFAULT_FILTERS.status);
    setPlatforms(DEFAULT_FILTERS.platforms);
    setWorkflow(DEFAULT_FILTERS.workflow);
    setQuery(DEFAULT_FILTERS.query);
    setOverdue(DEFAULT_FILTERS.overdue);
  }, []);

  // Computed: check if any filters are active (compare against defaults for consistency)
  const hasActiveFilters = useMemo(() => {
    return (
      type !== DEFAULT_FILTERS.type ||
      status !== DEFAULT_FILTERS.status ||
      platforms.length > 0 ||
      workflow !== DEFAULT_FILTERS.workflow ||
      query !== DEFAULT_FILTERS.query ||
      overdue !== DEFAULT_FILTERS.overdue
    );
  }, [type, status, platforms, workflow, query, overdue]);

  // Computed: count active filters
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (type !== DEFAULT_FILTERS.type) count++;
    if (status !== DEFAULT_FILTERS.status) count++;
    if (platforms.length > 0) count++;
    if (workflow !== DEFAULT_FILTERS.workflow) count++;
    if (query !== DEFAULT_FILTERS.query) count++;
    if (overdue !== DEFAULT_FILTERS.overdue) count++;
    return count;
  }, [type, status, platforms, workflow, query, overdue]);

  const value = useMemo<FilterContextValue>(
    () => ({
      // Current values
      type,
      status,
      platforms,
      workflow,
      query,
      overdue,

      // Setters
      setType,
      setStatus,
      setPlatforms,
      togglePlatform,
      setWorkflow,
      setQuery,
      setOverdue,

      // Bulk operations
      setFilters,
      resetFilters,

      // Computed
      hasActiveFilters,
      activeFilterCount,
    }),
    [
      type,
      status,
      platforms,
      workflow,
      query,
      overdue,
      togglePlatform,
      setFilters,
      resetFilters,
      hasActiveFilters,
      activeFilterCount,
    ],
  );

  return <FilterContext.Provider value={value}>{children}</FilterContext.Provider>;
}

// ============================================================================
// Hook
// ============================================================================

export function useFilters(): FilterContextValue {
  const context = useContext(FilterContext);
  if (!context) {
    throw new Error('useFilters must be used within a FilterProvider');
  }
  return context;
}

// ============================================================================
// Convenience Hooks
// ============================================================================

/**
 * Get just the filter values (read-only pattern)
 */
export function useFilterValues(): EntryFilters {
  const { type, status, platforms, workflow, query, overdue } = useFilters();
  return { type, status, platforms, workflow, query, overdue };
}

/**
 * Get filter state with computed values
 */
export function useFilterState() {
  const { hasActiveFilters, activeFilterCount, resetFilters } = useFilters();
  return { hasActiveFilters, activeFilterCount, resetFilters };
}

export default FilterContext;
