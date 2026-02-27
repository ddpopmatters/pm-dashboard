import type { ManagerEntry } from '../constants';

interface ProfileLike {
  name: string;
  email: string;
  manager_email: string | null;
  is_admin?: boolean;
  is_approver?: boolean;
}

/**
 * Build a managers array from user profiles that have manager_email set.
 * Groups reports by their manager_email, matching the shape ManagerHub expects:
 * { name, email, team, reports: [displayNames] }
 */
export function buildManagersFromProfiles(profiles: ProfileLike[]): ManagerEntry[] {
  const managerMap = new Map<string, { name: string; email: string; reports: string[] }>();

  for (const profile of profiles) {
    if (!profile.manager_email) continue;

    const mgrEmail = profile.manager_email.toLowerCase();

    if (!managerMap.has(mgrEmail)) {
      // Find the manager's own profile to get their display name
      const mgrProfile = profiles.find((p) => p.email.toLowerCase() === mgrEmail);
      managerMap.set(mgrEmail, {
        name: mgrProfile?.name || mgrEmail,
        email: mgrProfile?.email || mgrEmail,
        reports: [],
      });
    }

    managerMap.get(mgrEmail)!.reports.push(profile.name);
  }

  return Array.from(managerMap.values()).map((mgr) => ({
    name: mgr.name,
    email: mgr.email,
    team: '',
    reports: mgr.reports,
  }));
}
