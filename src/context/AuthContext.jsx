import React, { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react';

const AuthContext = createContext(null);

const DEFAULT_FEATURES = [
  'calendar',
  'kanban',
  'approvals',
  'ideas',
  'linkedin',
  'testing',
  'copy-check',
  'activity',
];

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [authStatus, setAuthStatus] = useState('loading'); // 'loading', 'login', 'invite', 'ready'
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
    async (email, password) => {
      try {
        const result = await window.api?.login?.({ email, password });
        if (!result?.ok) {
          return { ok: false, error: result?.error || 'Login failed' };
        }
        await hydrateUser();
        return { ok: true };
      } catch (err) {
        return { ok: false, error: err.message || 'Login failed' };
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
  const updateProfile = useCallback(async (updates) => {
    try {
      const result = await window.api?.updateUser?.(updates);
      if (result?.ok && result?.user) {
        setUser((prev) => ({
          ...prev,
          ...result.user,
        }));
        return { ok: true };
      }
      return { ok: false, error: result?.error || 'Update failed' };
    } catch (err) {
      return { ok: false, error: err.message || 'Update failed' };
    }
  }, []);

  // Check if user has a specific feature
  const hasFeature = useCallback(
    (feature) => {
      if (!user?.features) return false;
      return user.features.includes(feature);
    },
    [user],
  );

  // Initialize auth on mount
  useEffect(() => {
    const init = async () => {
      // Wait for API to be ready
      if (!window.api?.enabled) {
        const checkApi = () => window.api?.enabled;
        if (!checkApi()) {
          const handleApiReady = () => {
            window.removeEventListener('pm-api-ready', handleApiReady);
            hydrateUser();
          };
          window.addEventListener('pm-api-ready', handleApiReady);

          // Fallback polling
          const interval = setInterval(() => {
            if (checkApi()) {
              clearInterval(interval);
              window.removeEventListener('pm-api-ready', handleApiReady);
              hydrateUser();
            }
          }, 100);

          return () => {
            clearInterval(interval);
            window.removeEventListener('pm-api-ready', handleApiReady);
          };
        }
      }
      hydrateUser();
    };

    init();
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

  const value = useMemo(
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

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
