/**
 * Domain model types for PM Dashboard frontend
 * Mirrors the backend types in functions/types/models.ts
 * with additional UI-specific fields used by the app
 */

/**
 * Attachment model - file attachments with metadata
 */
export interface Attachment {
  id: string;
  name: string;
  dataUrl: string;
  /** Optional URL for externally-hosted attachments */
  url?: string;
  type: string;
  size: number;
}

/**
 * User model - represents a user in the system
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
 * Entry status - uses capitalized values as per app convention
 */
export type EntryStatus = 'Pending' | 'Approved' | 'Draft' | 'Published';

/**
 * Workflow/Kanban status
 */
export type WorkflowStatus = 'Draft' | 'Scheduled' | 'In Review' | 'Approved' | 'Published';

/**
 * Entry model - represents a content calendar entry
 * Includes both database fields and UI-computed fields
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
  // UI-specific fields (not in database)
  url?: string;
  approvalDeadline?: string;
  analyticsUpdatedAt?: string;
  script?: string;
  designCopy?: string;
  carouselSlides?: string[];
  comments?: Comment[];
  links?: string[];
  attachments?: Attachment[];
}

/**
 * Idea model - represents an idea in the ideas bank
 */
export interface Idea {
  id: string;
  type: string;
  title: string;
  notes: string;
  links: string[];
  attachments: Attachment[];
  inspiration: string;
  createdBy: string;
  createdAt: string;
  targetDate: string;
  targetMonth: string;
  /** Entry ID if this idea was converted to an entry */
  convertedToEntryId?: string;
  /** Timestamp when this idea was converted to an entry */
  convertedAt?: string;
}

/**
 * LinkedIn submission model
 */
export interface LinkedInSubmission {
  id: string;
  submissionType: string;
  status: string;
  title: string;
  postCopy: string;
  comments: string;
  owner: string;
  submitter: string;
  links: string[];
  attachments: Attachment[];
  targetDate: string;
  createdAt: string;
  updatedAt?: string;
}

/**
 * Testing framework model - represents an A/B testing framework
 */
export interface TestingFramework {
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
 * Notification model
 * Matches the structure created by buildApprovalNotifications/buildMentionNotifications
 */
export interface Notification {
  id?: string;
  key: string;
  type: string;
  entryId: string;
  user: string;
  message: string;
  read?: boolean;
  createdAt: string;
  meta?: Record<string, unknown>;
}

/**
 * Guidelines model - brand/copy guidelines
 */
export interface Guidelines {
  charLimits: Record<string, number>;
  bannedWords: string[];
  requiredPhrases: string[];
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

/**
 * Comment model - entry comments/timeline
 * Uses 'body' field as per app convention (not 'text')
 */
export interface Comment {
  id: string;
  author: string;
  authorName?: string;
  authorAvatar?: string;
  body: string;
  createdAt: string;
  mentions?: string[];
  type?: 'comment' | 'status_change' | 'approval';
}

/**
 * Audit log entry
 */
export interface AuditEntry {
  id: string;
  ts: string;
  user: string;
  entryId: string;
  action: string;
  meta: Record<string, unknown>;
}
