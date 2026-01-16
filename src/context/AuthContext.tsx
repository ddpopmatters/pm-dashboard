/**
 * AuthContext - Authentication state management
 *
 * Manages user authentication state, login/logout, and profile updates.
 * Integrates with window.api for backend communication.
 */
import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useMemo,
  type ReactNode,
} from 'react';

// ============================================================================
// Types
// ============================================================================

export type AuthStatus = 'loading' | 'login' | 'invite' | 'ready';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  avatarUrl: string;
  features: string[];
  isAdmin: boolean;
  hasPassword: boolean;
}

export interface AuthContextValue {
  user: AuthUser | null;
  authStatus: AuthStatus;
  authError: string;
  inviteToken: string;
  isAuthenticated: boolean;
  isLoading: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => Promise<void>;
  updateProfile: (updates: Partial<AuthUser>) => Promise<{ ok: boolean; error?: string }>;
  hasFeature: (feature: string) => boolean;
  hydrateUser: () => Promise<void>;
}

// Type for window.api (minimal interface for what AuthContext uses)
interface WindowApi {
  enabled?: boolean;
  getSession?: () => Promise<{ user?: { id: string; email?: string } } | null>;
  ensureUserProfile?: (user: { id: string }) => Promise<void>;
  getCurrentUser?: () => Promise<{
    id: string;
    name?: string;
    email?: string;
    avatarUrl?: string;
    features?: string[];
    isAdmin?: boolean;
    hasPassword?: boolean;
  } | null>;
  login?: (params: { email: string; password: string }) => Promise<{ ok: boolean; error?: string }>;
  signOut?: () => Promise<void>;
  updateUser?: (
    updates: Partial<AuthUser>,
  ) => Promise<{ ok: boolean; user?: AuthUser; error?: string }>;
  onAuthStateChange?: (
    callback: (event: string, session: { user?: { id: string } } | null) => void,
  ) => () => void;
}

declare global {
  interface Window {
    api?: WindowApi;
  }
}

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_FEATURES = [
  'calendar',
  'kanban',
  'approvals',
  'ideas',
  'copy-check',
  'activity',
  'influencers',
];

// ============================================================================
// Context
// ============================================================================

const AuthContext = createContext<AuthContextValue | null>(null);

// ============================================================================
// Provider
// ============================================================================

export interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [authStatus, setAuthStatus] = useState<AuthStatus>('loading');
  const [authError, setAuthError] = useState('');

  // Check for invite token in URL
  const inviteToken = useMemo(() => {
    if (typeof window === 'undefined') return '';
    try {
      const url = new URL(window.location.href);
      return url.searchParams.get('invite') || '';
    } catch {
      return '';
    }
  }, []);

  // Hydrate user from session
  const hydrateUser = useCallback(async () => {
    setAuthStatus('loading');
    setAuthError('');

    try {
      // Check for Supabase session first
      if (window.api?.enabled && window.api.getSession) {
        const session = await window.api.getSession();
        if (session?.user) {
          await window.api.ensureUserProfile?.(session.user);
          const profile = await window.api.getCurrentUser?.();
          if (profile) {
            setUser({
              id: profile.id,
              name: profile.name || profile.email?.split('@')[0] || 'User',
              email: profile.email || '',
              avatarUrl: profile.avatarUrl || '',
              features: Array.isArray(profile.features) ? profile.features : [...DEFAULT_FEATURES],
              isAdmin: Boolean(profile.isAdmin),
              hasPassword: Boolean(profile.hasPassword),
            });
            setAuthStatus('ready');
            return;
          }
        }
      }

      // Fallback to legacy API
      if (window.api?.enabled) {
        const payload = await window.api.getCurrentUser?.();
        if (payload) {
          setUser({
            id: payload.id,
            name: payload.name || payload.email?.split('@')[0] || 'User',
            email: payload.email || '',
            avatarUrl: payload.avatarUrl || '',
            features: Array.isArray(payload.features) ? payload.features : [...DEFAULT_FEATURES],
            isAdmin: Boolean(payload.isAdmin),
            hasPassword: Boolean(payload.hasPassword),
          });
          setAuthStatus('ready');
          return;
        }
      }

      // No session found
      setAuthError('');
      setAuthStatus(inviteToken ? 'invite' : 'login');
    } catch (err) {
      console.error('Auth hydration failed:', err);
      setAuthError('Failed to load user session');
      setAuthStatus('login');
    }
  }, [inviteToken]);

  // Login with email/password
  const login = useCallback(
    async (email: string, password: string): Promise<{ ok: boolean; error?: string }> => {
      try {
        const result = await window.api?.login?.({ email, password });
        if (!result?.ok) {
          return { ok: false, error: result?.error || 'Login failed' };
        }
        await hydrateUser();
        return { ok: true };
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Login failed';
        return { ok: false, error: message };
      }
    },
    [hydrateUser],
  );

  // Logout
  const logout = useCallback(async () => {
    try {
      await window.api?.signOut?.();
    } catch (err) {
      console.error('Logout error:', err);
    }
    setUser(null);
    setAuthStatus('login');
  }, []);

  // Update user profile
  const updateProfile = useCallback(
    async (updates: Partial<AuthUser>): Promise<{ ok: boolean; error?: string }> => {
      try {
        const result = await window.api?.updateUser?.(updates);
        if (result?.ok && result?.user) {
          setUser((prev) =>
            prev
              ? {
                  ...prev,
                  ...result.user,
                }
              : null,
          );
          return { ok: true };
        }
        return { ok: false, error: result?.error || 'Update failed' };
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Update failed';
        return { ok: false, error: message };
      }
    },
    [],
  );

  // Check if user has a specific feature
  const hasFeature = useCallback(
    (feature: string): boolean => {
      if (!user?.features) return false;
      return user.features.includes(feature);
    },
    [user],
  );

  // Initialize auth on mount
  useEffect(() => {
    // If API is already ready, hydrate immediately
    if (window.api?.enabled) {
      hydrateUser();
      return;
    }

    // Wait for API to be ready
    let interval: ReturnType<typeof setInterval> | null = null;

    const handleApiReady = () => {
      window.removeEventListener('pm-api-ready', handleApiReady);
      if (interval) {
        clearInterval(interval);
        interval = null;
      }
      hydrateUser();
    };

    window.addEventListener('pm-api-ready', handleApiReady);

    // Fallback polling
    interval = setInterval(() => {
      if (window.api?.enabled) {
        if (interval) {
          clearInterval(interval);
          interval = null;
        }
        window.removeEventListener('pm-api-ready', handleApiReady);
        hydrateUser();
      }
    }, 100);

    // Cleanup function returned directly to React
    return () => {
      if (interval) {
        clearInterval(interval);
      }
      window.removeEventListener('pm-api-ready', handleApiReady);
    };
  }, [hydrateUser]);

  // Listen for auth state changes from Supabase
  useEffect(() => {
    if (!window.api?.onAuthStateChange) return;

    const unsubscribe = window.api.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        await hydrateUser();
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setAuthStatus('login');
      }
    });

    return unsubscribe;
  }, [hydrateUser]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      authStatus,
      authError,
      inviteToken,
      isAuthenticated: authStatus === 'ready' && user !== null,
      isLoading: authStatus === 'loading',
      isAdmin: user?.isAdmin || false,
      login,
      logout,
      updateProfile,
      hasFeature,
      hydrateUser,
    }),
    [
      user,
      authStatus,
      authError,
      inviteToken,
      login,
      logout,
      updateProfile,
      hasFeature,
      hydrateUser,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ============================================================================
// Hook
// ============================================================================

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
