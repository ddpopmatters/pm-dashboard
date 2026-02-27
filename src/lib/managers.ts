import type { ManagerEntry } from '../constants';

export interface ProfileLike {
  name: string;
  email: string;
  manager_email: string | null;
  is_admin?: boolean;
  is_approver?: boolean;
}

/**
 * Collect all descendant names for a manager email, recursively.
 * Jameen → Dan → Fran means Jameen's reports include Dan AND Fran.
 */
function collectDescendants(
  email: string,
  childrenMap: Map<string, string[]>,
  profilesByEmail: Map<string, ProfileLike>,
  visited: Set<string>,
): string[] {
  if (visited.has(email)) return []; // cycle guard
  visited.add(email);

  const directEmails = childrenMap.get(email) || [];
  const names: string[] = [];

  for (const childEmail of directEmails) {
    const profile = profilesByEmail.get(childEmail);
    if (profile) names.push(profile.name);
    names.push(...collectDescendants(childEmail, childrenMap, profilesByEmail, visited));
  }

  return names;
}

/**
 * Build a managers array from user profiles that have manager_email set.
 * Recursively collects indirect reports so a senior manager sees their
 * entire reporting chain (e.g. Jameen sees [Dan, Fran, Madeleine, Shweta]).
 */
export function buildManagersFromProfiles(profiles: ProfileLike[]): ManagerEntry[] {
  if (!profiles?.length) return [];

  // Index profiles by lowercase email
  const profilesByEmail = new Map<string, ProfileLike>();
  for (const p of profiles) {
    if (p.email) profilesByEmail.set(p.email.toLowerCase(), p);
  }

  // Build parent→children map (manager_email → [child emails])
  const childrenMap = new Map<string, string[]>();
  for (const p of profiles) {
    if (!p.manager_email) continue;
    const mgrKey = p.manager_email.toLowerCase();
    const existing = childrenMap.get(mgrKey) || [];
    existing.push(p.email.toLowerCase());
    childrenMap.set(mgrKey, existing);
  }

  // Every email that appears as a manager_email is a manager
  const managerEmails = new Set(childrenMap.keys());

  return Array.from(managerEmails).map((mgrEmail) => {
    const mgrProfile = profilesByEmail.get(mgrEmail);
    const reports = collectDescendants(mgrEmail, childrenMap, profilesByEmail, new Set());
    return {
      name: mgrProfile?.name || mgrEmail,
      email: mgrProfile?.email || mgrEmail,
      team: '',
      reports,
    };
  });
}

/**
 * Check whether `email` is a manager of anyone.
 * When `profiles` is provided, checks DB-driven relationships.
 * Otherwise returns false (caller should fall back to static config).
 */
export function isManager(email: string, profiles?: ProfileLike[]): boolean {
  if (!email || !profiles?.length) return false;
  const normalised = email.toLowerCase();
  return profiles.some((p) => p.manager_email?.toLowerCase() === normalised);
}
