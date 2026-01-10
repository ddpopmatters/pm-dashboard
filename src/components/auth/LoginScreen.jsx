import React, { useState, useEffect } from 'react';

// LoginScreen Component - mirrors PM-Productivity-Tool design
// Uses Supabase Auth for authentication
export function LoginScreen({ onAuthChange }) {
  const [mode, setMode] = useState('signin'); // 'signin', 'signup', 'link-sent'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [apiReady, setApiReady] = useState(false);

  // Wait for API to be ready
  useEffect(() => {
    const checkApi = () => {
      if (window.api?.enabled) {
        setApiReady(true);
        return true;
      }
      return false;
    };

    if (checkApi()) return;

    // Listen for API ready event
    const handleApiReady = () => checkApi();
    window.addEventListener('pm-api-ready', handleApiReady);

    // Poll as fallback
    const interval = setInterval(() => {
      if (checkApi()) clearInterval(interval);
    }, 100);

    return () => {
      window.removeEventListener('pm-api-ready', handleApiReady);
      clearInterval(interval);
    };
  }, []);

  // Check for existing session on mount
  useEffect(() => {
    if (!apiReady) return;

    const checkSession = async () => {
      try {
        const session = await window.api.getSession();
        if (session?.user) {
          const profile = await window.api.getCurrentUser();
          if (profile) {
            onAuthChange({ user: session.user, profile });
          }
        }
      } catch (err) {
        console.error('Session check failed:', err);
      }
    };

    checkSession();

    // Listen for auth state changes (e.g., magic link redirect)
    const unsubscribe = window.api.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        const profile = await window.api.getCurrentUser();
        onAuthChange({ user: session.user, profile });
      }
    });

    return unsubscribe;
  }, [apiReady, onAuthChange]);

  const handleSignIn = async (e) => {
    e.preventDefault();
    if (!apiReady) return;
    setLoading(true);
    setError('');

    try {
      const result = await window.api.signInWithMagicLink({ email });
      if (result.ok) {
        setMode('link-sent');
        setSuccess(result.message || 'Check your email for the sign-in link');
      } else {
        setError(result.error || 'Sign in failed. Please try again.');
      }
    } catch (err) {
      console.error('Sign in error:', err);
      setError(err.message || 'Sign in failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    if (!apiReady) return;

    // Validate passwords match
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const result = await window.api.signUp({ email, password });

      if (result.ok) {
        if (result.needsVerification) {
          setMode('link-sent');
          setSuccess(result.message || 'Check your email for verification link');
        } else if (result.user) {
          const profile = await window.api.getCurrentUser();
          onAuthChange({ user: result.user, profile });
        }
      } else {
        setError(result.error || 'Sign up failed. Please try again.');
      }
    } catch (err) {
      console.error('Sign up error:', err);
      setError(err.message || 'Sign up failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSignIn = async (e) => {
    e.preventDefault();
    if (!apiReady) return;
    setLoading(true);
    setError('');

    try {
      const result = await window.api.login({ email, password });
      if (result.ok) {
        onAuthChange({ user: result.user, profile: result.user });
      } else {
        setError(result.error || 'Invalid email or password.');
      }
    } catch (err) {
      console.error('Sign in error:', err);
      setError(err.message || 'Sign in failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ backgroundColor: '#cfebf8' }}
    >
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-ocean-900 mb-2">Content Dashboard</h1>
          <p className="text-graystone-600">
            {mode === 'signin'
              ? 'Sign in to your account'
              : mode === 'signup'
                ? 'Create your account'
                : 'Check your email'}
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4 text-sm">
            {success}
          </div>
        )}

        {/* Link Sent Confirmation */}
        {mode === 'link-sent' && (
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-ocean-100 rounded-full flex items-center justify-center mx-auto">
              <svg
                className="w-8 h-8 text-ocean-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
            </div>
            <p className="text-graystone-600">
              We sent a link to <strong>{email}</strong>
            </p>
            <p className="text-sm text-graystone-500">
              Click the link in your email to sign in. The link will expire in 1 hour.
            </p>
            <button
              type="button"
              onClick={() => {
                setMode('signin');
                setError('');
                setSuccess('');
              }}
              className="text-sm text-ocean-600 hover:underline"
            >
              Use a different email
            </button>
          </div>
        )}

        {/* Sign In Form */}
        {mode === 'signin' && (
          <form onSubmit={handlePasswordSignIn} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-graystone-700 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-graystone-300 rounded-xl focus:ring-2 focus:ring-ocean-500 focus:border-ocean-500 outline-none transition"
                placeholder="you@example.com"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-graystone-700 mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-graystone-300 rounded-xl focus:ring-2 focus:ring-ocean-500 focus:border-ocean-500 outline-none transition"
                placeholder="••••••••"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading || !apiReady}
              className="w-full bg-ocean-500 text-white py-3 rounded-xl font-semibold hover:bg-ocean-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
            <div className="text-center">
              <button
                type="button"
                onClick={handleSignIn}
                disabled={loading || !apiReady || !email}
                className="text-sm text-ocean-600 hover:underline disabled:opacity-50"
              >
                Or sign in with magic link
              </button>
            </div>
          </form>
        )}

        {/* Sign Up Form */}
        {mode === 'signup' && (
          <form onSubmit={handleSignUp} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-graystone-700 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-graystone-300 rounded-xl focus:ring-2 focus:ring-ocean-500 focus:border-ocean-500 outline-none transition"
                placeholder="you@example.com"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-graystone-700 mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-graystone-300 rounded-xl focus:ring-2 focus:ring-ocean-500 focus:border-ocean-500 outline-none transition"
                placeholder="••••••••"
                required
                minLength={8}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-graystone-700 mb-1">
                Confirm Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-3 border border-graystone-300 rounded-xl focus:ring-2 focus:ring-ocean-500 focus:border-ocean-500 outline-none transition"
                placeholder="••••••••"
                required
                minLength={8}
              />
            </div>
            <button
              type="submit"
              disabled={loading || !apiReady}
              className="w-full bg-ocean-500 text-white py-3 rounded-xl font-semibold hover:bg-ocean-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>
        )}

        {/* Toggle between sign in and sign up */}
        {(mode === 'signin' || mode === 'signup') && (
          <div className="mt-6 text-center">
            {mode === 'signin' ? (
              <p className="text-sm text-graystone-600">
                Don&apos;t have an account?{' '}
                <button
                  onClick={() => {
                    setMode('signup');
                    setError('');
                  }}
                  className="text-ocean-600 font-semibold hover:underline"
                >
                  Sign up
                </button>
              </p>
            ) : (
              <p className="text-sm text-graystone-600">
                Already have an account?{' '}
                <button
                  onClick={() => {
                    setMode('signin');
                    setError('');
                  }}
                  className="text-ocean-600 font-semibold hover:underline"
                >
                  Sign in
                </button>
              </p>
            )}
          </div>
        )}

        {!apiReady && (
          <div className="mt-4 text-center text-sm text-amber-600">Loading authentication...</div>
        )}
      </div>
    </div>
  );
}

export default LoginScreen;
