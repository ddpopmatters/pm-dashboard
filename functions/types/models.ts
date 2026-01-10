/**
 * Database model interfaces for PM Dashboard
 * These represent the structure of records stored in the D1 database
 */

/**
 * User model - represents a user account in the system
 */
export interface UserRow {
  id: string;
  email: string;
  name: string;
  passwordHash: string | null;
  inviteToken: string | null;
  inviteExpiresAt: string | null;
  features: string | null; // JSON string of string[]
  status: 'pending' | 'active' | 'disabled';
  isAdmin: number; // 0 or 1 (SQLite boolean)
  isApprover: number; // 0 or 1 (SQLite boolean)
  avatarUrl: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  lastLoginAt: string | null;
}

/**
 * Serialized user object for API responses
 */
export interface User {
  id: string;
  email: string;
  name: string;
  status: string;
  isAdmin: boolean;
  isApprover: boolean;
  avatarUrl: string | null;
  features: string[];
  hasPassword?: boolean;
  invitePending?: boolean;
  inviteExpiresAt?: string | null;
  lastLoginAt?: string | null;
  createdAt?: string | null;
}

/**
 * Session model - represents an active user session
 */
export interface SessionRow {
  id: string;
  userId: string;
  tokenHash: string;
  createdAt: string | null;
  expiresAt: string | null;
  userAgent: string | null;
  ip: string | null;
}

/**
 * Entry model - represents a content calendar entry
 * JSON fields are stored as strings in the database
 */
export interface EntryRow {
  id: string;
  date: string;
  platforms: string; // JSON string of string[]
  assetType: string;
  caption: string;
  platformCaptions: string; // JSON string of Record<string, string>
  firstComment: string;
  status: string;
  approvers: string; // JSON string of string[]
  author: string;
  campaign: string;
  contentPillar: string;
  previewUrl: string;
  checklist: string; // JSON string of Record<string, boolean>
  analytics: string; // JSON string of Record<string, unknown>
  workflowStatus: string;
  statusDetail: string;
  aiFlags: string; // JSON string of string[]
  aiScore: string; // JSON string of Record<string, number>
  testingFrameworkId: string;
  testingFrameworkName: string;
  createdAt: string;
  updatedAt: string;
  approvedAt: string | null;
  deletedAt: string | null;
}

/**
 * Inflated entry object with parsed JSON fields
 */
export interface Entry {
  id: string;
  date: string;
  platforms: string[];
  assetType: string;
  caption: string;
  platformCaptions: Record<string, string>;
  firstComment: string;
  status: string;
  approvers: string[];
  author: string;
  campaign: string;
  contentPillar: string;
  previewUrl: string;
  checklist: Record<string, boolean>;
  analytics: Record<string, unknown>;
  workflowStatus: string;
  statusDetail: string;
  aiFlags: string[];
  aiScore: Record<string, number>;
  testingFrameworkId: string;
  testingFrameworkName: string;
  createdAt: string;
  updatedAt: string;
  approvedAt: string | null;
  deletedAt: string | null;
}

/**
 * Idea model - represents an idea in the ideas bank
 * JSON fields are stored as strings in the database
 */
export interface IdeaRow {
  id: string;
  type: string;
  title: string;
  notes: string;
  links: string; // JSON string of string[]
  attachments: string; // JSON string of string[]
  inspiration: string;
  createdBy: string;
  createdAt: string;
  targetDate: string;
  targetMonth: string;
}

/**
 * Inflated idea object with parsed JSON fields
 */
export interface Idea {
  id: string;
  type: string;
  title: string;
  notes: string;
  links: string[];
  attachments: string[];
  inspiration: string;
  createdBy: string;
  createdAt: string;
  targetDate: string;
  targetMonth: string;
}

/**
 * LinkedIn submission model - represents a LinkedIn post submission
 * JSON fields are stored as strings in the database
 */
export interface LinkedInPostRow {
  id: string;
  submissionType: string;
  status: string;
  title: string;
  postCopy: string;
  comments: string;
  owner: string;
  submitter: string;
  links: string; // JSON string of string[]
  attachments: string; // JSON string of string[]
  targetDate: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Inflated LinkedIn post object with parsed JSON fields
 */
export interface LinkedInPost {
  id: string;
  submissionType: string;
  status: string;
  title: string;
  postCopy: string;
  comments: string;
  owner: string;
  submitter: string;
  links: string[];
  attachments: string[];
  targetDate: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Testing framework model - represents an A/B testing framework
 */
export interface TestingFrameworkRow {
  id: string;
  name: string;
  hypothesis: string;
  audience: string;
  metric: string;
  duration: string;
  status: string;
  notes: string;
  createdAt: string;
}

/**
 * Audit log entry model - represents an action audit record
 */
export interface AuditRow {
  id: string;
  ts: string;
  user: string;
  entryId: string;
  action: string;
  meta: string; // JSON string
}

/**
 * Guidelines model - represents brand/copy guidelines configuration
 */
export interface GuidelinesRow {
  id: string;
  charLimits: string; // JSON string of Record<string, number>
  bannedWords: string; // JSON string of string[]
  requiredPhrases: string; // JSON string of string[]
  languageGuide: string;
  hashtagTips: string;
  teamsWebhookUrl: string;
}

/**
 * Approver info - minimal user info for approver lists
 */
export interface Approver {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
}
