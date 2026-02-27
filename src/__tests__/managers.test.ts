import { describe, it, expect } from 'vitest';
import { buildManagersFromProfiles, isManager, type ProfileLike } from '../lib/managers';

// Fixtures matching the real PM org structure
const jameen: ProfileLike = {
  name: 'Jameen Kaur',
  email: 'jameen.kaur@populationmatters.org',
  manager_email: null,
};
const dan: ProfileLike = {
  name: 'Daniel Davis',
  email: 'daniel.davis@populationmatters.org',
  manager_email: 'jameen.kaur@populationmatters.org',
};
const fran: ProfileLike = {
  name: 'Francesca Harrison',
  email: 'francesca.harrison@populationmatters.org',
  manager_email: 'daniel.davis@populationmatters.org',
};
const madeleine: ProfileLike = {
  name: 'Madeleine Hewitt',
  email: 'madeleine.hewitt@populationmatters.org',
  manager_email: 'jameen.kaur@populationmatters.org',
};
const shweta: ProfileLike = {
  name: 'Shweta Shirodkar',
  email: 'shweta.shirodkar@populationmatters.org',
  manager_email: 'jameen.kaur@populationmatters.org',
};
const emma: ProfileLike = {
  name: 'Emma Lewendon-Strutt',
  email: 'emma@populationmatters.org',
  manager_email: null,
};

const allProfiles = [jameen, dan, fran, madeleine, shweta, emma];

describe('buildManagersFromProfiles', () => {
  it('returns empty array for empty input', () => {
    expect(buildManagersFromProfiles([])).toEqual([]);
  });

  it('returns empty array for null-ish input', () => {
    expect(buildManagersFromProfiles(null as unknown as ProfileLike[])).toEqual([]);
  });

  it('builds direct reports correctly', () => {
    const result = buildManagersFromProfiles([dan, madeleine, shweta, jameen]);
    // Jameen has Dan, Madeleine, Shweta as direct reports
    expect(result).toHaveLength(1);
    expect(result[0].email).toBe('jameen.kaur@populationmatters.org');
    expect(result[0].reports).toContain('Daniel Davis');
    expect(result[0].reports).toContain('Madeleine Hewitt');
    expect(result[0].reports).toContain('Shweta Shirodkar');
  });

  it('collects indirect reports recursively', () => {
    const result = buildManagersFromProfiles(allProfiles);
    const jameenEntry = result.find((m) => m.email === 'jameen.kaur@populationmatters.org');
    // Jameen sees Dan (direct) + Fran (indirect via Dan) + Madeleine + Shweta
    expect(jameenEntry).toBeDefined();
    expect(jameenEntry!.reports).toContain('Daniel Davis');
    expect(jameenEntry!.reports).toContain('Francesca Harrison');
    expect(jameenEntry!.reports).toContain('Madeleine Hewitt');
    expect(jameenEntry!.reports).toContain('Shweta Shirodkar');
    expect(jameenEntry!.reports).toHaveLength(4);
  });

  it('gives Dan only Fran as a direct report', () => {
    const result = buildManagersFromProfiles(allProfiles);
    const danEntry = result.find((m) => m.email === 'daniel.davis@populationmatters.org');
    expect(danEntry).toBeDefined();
    expect(danEntry!.reports).toEqual(['Francesca Harrison']);
  });

  it('uses display names not emails in reports array', () => {
    const result = buildManagersFromProfiles(allProfiles);
    for (const entry of result) {
      for (const report of entry.reports) {
        expect(report).not.toContain('@');
      }
    }
  });

  it('skips profiles with no manager_email', () => {
    const result = buildManagersFromProfiles([emma, jameen]);
    // Neither has a manager, so no manager entries
    expect(result).toEqual([]);
  });

  it('handles case-insensitive email matching', () => {
    const upper: ProfileLike = {
      name: 'Test User',
      email: 'test@example.com',
      manager_email: 'BOSS@EXAMPLE.COM',
    };
    const boss: ProfileLike = {
      name: 'Boss',
      email: 'boss@example.com',
      manager_email: null,
    };
    const result = buildManagersFromProfiles([upper, boss]);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Boss');
    expect(result[0].reports).toContain('Test User');
  });

  it('handles cycles without infinite loop', () => {
    const a: ProfileLike = {
      name: 'A',
      email: 'a@test.com',
      manager_email: 'b@test.com',
    };
    const b: ProfileLike = {
      name: 'B',
      email: 'b@test.com',
      manager_email: 'a@test.com',
    };
    // Should not hang — cycle guard prevents infinite recursion
    const result = buildManagersFromProfiles([a, b]);
    expect(result.length).toBeGreaterThan(0);
  });
});

describe('isManager', () => {
  it('returns true for someone with direct reports', () => {
    expect(isManager('jameen.kaur@populationmatters.org', allProfiles)).toBe(true);
  });

  it('returns true for mid-level manager', () => {
    expect(isManager('daniel.davis@populationmatters.org', allProfiles)).toBe(true);
  });

  it('returns false for non-manager', () => {
    expect(isManager('francesca.harrison@populationmatters.org', allProfiles)).toBe(false);
  });

  it('returns false for empty email', () => {
    expect(isManager('', allProfiles)).toBe(false);
  });

  it('returns false when no profiles provided', () => {
    expect(isManager('jameen.kaur@populationmatters.org')).toBe(false);
  });

  it('is case-insensitive', () => {
    expect(isManager('JAMEEN.KAUR@POPULATIONMATTERS.ORG', allProfiles)).toBe(true);
  });
});
