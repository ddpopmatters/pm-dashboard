import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useAuth } from '../useAuth';

// Mock all dependencies that useAuth imports
vi.mock('../../../lib/utils', () => ({
  ensurePeopleArray: (val: unknown) => {
    if (Array.isArray(val)) return val;
    if (typeof val === 'string')
      return val
        .split(',')
        .map((s: string) => s.trim())
        .filter(Boolean);
    return [];
  },
  normalizeEmail: (s: string) => s?.toLowerCase().trim() ?? '',
  storageAvailable: () => true,
  STORAGE_KEYS: { USER: 'pm-user' },
}));

vi.mock('../../../lib/users', () => ({
  ensureFeaturesList: (val: unknown) => (Array.isArray(val) ? val : []),
}));

const mockDeps = () => ({
  apiGet: vi.fn().mockResolvedValue(null),
  apiPost: vi.fn().mockResolvedValue(null),
  apiPut: vi.fn().mockResolvedValue(null),
});

describe('useAuth — viewer utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  function setupAuthenticatedHook(name: string, email: string) {
    const deps = mockDeps();
    const { result } = renderHook(() => useAuth(deps));

    // Manually set user identity via internal state
    act(() => {
      // Access setters through the hook return
      result.current.setCurrentUser(name);
      result.current.setCurrentUserEmail(email);
    });

    return { result, deps };
  }

  describe('viewerIsAuthor', () => {
    it('returns true when entry author matches current user name', () => {
      const { result } = setupAuthenticatedHook('Dan Smith', 'dan@pm.org');
      expect(result.current.viewerIsAuthor({ author: 'Dan Smith' })).toBe(true);
    });

    it('matches case-insensitively', () => {
      const { result } = setupAuthenticatedHook('Dan Smith', 'dan@pm.org');
      expect(result.current.viewerIsAuthor({ author: 'dan smith' })).toBe(true);
      expect(result.current.viewerIsAuthor({ author: 'DAN SMITH' })).toBe(true);
    });

    it('matches by email', () => {
      const { result } = setupAuthenticatedHook('Dan Smith', 'dan@pm.org');
      expect(result.current.viewerIsAuthor({ author: 'dan@pm.org' })).toBe(true);
    });

    it('returns false when author does not match', () => {
      const { result } = setupAuthenticatedHook('Dan Smith', 'dan@pm.org');
      expect(result.current.viewerIsAuthor({ author: 'Jane Doe' })).toBe(false);
    });

    it('returns false for null entry', () => {
      const { result } = setupAuthenticatedHook('Dan Smith', 'dan@pm.org');
      expect(result.current.viewerIsAuthor(null)).toBe(false);
    });

    it('returns false for entry without author field', () => {
      const { result } = setupAuthenticatedHook('Dan Smith', 'dan@pm.org');
      expect(result.current.viewerIsAuthor({})).toBe(false);
    });

    it('trims whitespace in comparison', () => {
      const { result } = setupAuthenticatedHook('Dan Smith', 'dan@pm.org');
      expect(result.current.viewerIsAuthor({ author: '  Dan Smith  ' })).toBe(true);
    });
  });

  describe('viewerIsApprover', () => {
    it('returns true when current user name is in approvers array', () => {
      const { result } = setupAuthenticatedHook('Dan Smith', 'dan@pm.org');
      expect(result.current.viewerIsApprover({ approvers: ['Dan Smith', 'Jane Doe'] })).toBe(true);
    });

    it('returns true when current email is in approvers', () => {
      const { result } = setupAuthenticatedHook('Dan Smith', 'dan@pm.org');
      expect(result.current.viewerIsApprover({ approvers: ['dan@pm.org'] })).toBe(true);
    });

    it('matches case-insensitively', () => {
      const { result } = setupAuthenticatedHook('Dan Smith', 'dan@pm.org');
      expect(result.current.viewerIsApprover({ approvers: ['dan smith'] })).toBe(true);
    });

    it('returns false when not in approvers', () => {
      const { result } = setupAuthenticatedHook('Dan Smith', 'dan@pm.org');
      expect(result.current.viewerIsApprover({ approvers: ['Jane Doe'] })).toBe(false);
    });

    it('returns false for null entry', () => {
      const { result } = setupAuthenticatedHook('Dan Smith', 'dan@pm.org');
      expect(result.current.viewerIsApprover(null)).toBe(false);
    });

    it('handles comma-separated approver string', () => {
      const { result } = setupAuthenticatedHook('Dan Smith', 'dan@pm.org');
      expect(result.current.viewerIsApprover({ approvers: 'Jane Doe, Dan Smith' })).toBe(true);
    });
  });

  describe('hasFeature', () => {
    async function setupWithUser(payload: Record<string, unknown>) {
      const deps = mockDeps();
      deps.apiGet.mockResolvedValue(payload);
      const { result } = renderHook(() => useAuth(deps));

      // Wait for hydration effect to complete
      await act(async () => {
        await new Promise((r) => setTimeout(r, 0));
      });

      return { result, deps };
    }

    it('returns true for admin regardless of features', async () => {
      const { result } = await setupWithUser({
        name: 'Admin',
        email: 'admin@pm.org',
        isAdmin: true,
        features: [],
      });

      expect(result.current.hasFeature('calendar')).toBe(true);
      expect(result.current.hasFeature('kanban')).toBe(true);
      expect(result.current.hasFeature('anything')).toBe(true);
    });

    it('returns true when feature is in user features list', async () => {
      const { result } = await setupWithUser({
        name: 'Regular User',
        email: 'user@pm.org',
        isAdmin: false,
        features: ['calendar', 'ideas'],
      });

      expect(result.current.hasFeature('calendar')).toBe(true);
      expect(result.current.hasFeature('ideas')).toBe(true);
    });

    it('returns false when feature is not in user features', async () => {
      const { result } = await setupWithUser({
        name: 'Regular User',
        email: 'user@pm.org',
        isAdmin: false,
        features: ['calendar'],
      });

      expect(result.current.hasFeature('kanban')).toBe(false);
    });
  });

  describe('reset', () => {
    it('clears user identity and sets authStatus to login', () => {
      const { result } = setupAuthenticatedHook('Dan Smith', 'dan@pm.org');

      act(() => {
        result.current.setAuthStatus('ready');
      });
      expect(result.current.authStatus).toBe('ready');

      act(() => {
        result.current.reset();
      });

      expect(result.current.currentUser).toBe('');
      expect(result.current.currentUserEmail).toBe('');
      expect(result.current.authStatus).toBe('login');
    });
  });
});
