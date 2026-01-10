/**
 * API types for PM Dashboard
 * Request/response types and API context definitions
 */

import type { Env } from './env';

/**
 * Cloudflare Pages Function context for API routes
 */
export interface ApiContext {
  request: Request;
  env: Env;
}

/**
 * Authenticated user object returned by authorizeRequest
 */
export interface AuthUser {
  id: string;
  email: string;
  name: string;
  isAdmin: boolean;
  features: string[];
  status: string;
  hasPassword?: boolean;
  isApprover?: boolean;
  avatarUrl?: string | null;
}

/**
 * Successful authorization result
 */
export interface AuthSuccess {
  ok: true;
  user: AuthUser;
}

/**
 * Failed authorization result
 */
export interface AuthFailure {
  ok: false;
  status: number;
  error: string;
}

/**
 * Combined authorization result type
 */
export type AuthResult = AuthSuccess | AuthFailure;

/**
 * Admin gate check result
 */
export interface AdminGateSuccess {
  ok: true;
}

export interface AdminGateFailure {
  ok: false;
  response: Response;
}

export type AdminGateResult = AdminGateSuccess | AdminGateFailure;

/**
 * Copy check request body
 */
export interface CopyCheckRequest {
  text: string;
  platform: string;
  assetType: string;
  constraints: {
    maxChars: number;
    maxHashtags?: number;
  };
  brand?: {
    bannedWords?: string[];
    requiredPhrases?: string[];
  };
  readingLevelTarget?: string;
}

/**
 * Copy check score
 */
export interface CopyCheckScore {
  clarity: number;
  brevity: number;
  hook: number;
  fit: number;
  readingLevel: string;
}

/**
 * Copy check variant
 */
export interface CopyCheckVariant {
  label: string;
  text: string;
}

/**
 * Copy check response
 */
export interface CopyCheckResponse {
  score: CopyCheckScore;
  flags: string[];
  suggestion: { text: string };
  variants: CopyCheckVariant[];
  explanations: string[];
  fallback?: boolean;
}

/**
 * OpenAI chat completion response structure
 */
export interface OpenAIChatResponse {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
}

/**
 * Notification request body - Teams webhook
 */
export interface TeamsNotifyPayload {
  teamsWebhookUrl?: string;
  message?: string;
}

/**
 * Notification request body - Email
 */
export interface EmailNotifyPayload {
  to?: string[];
  approvers?: string[];
  subject?: string;
  text?: string;
  html?: string;
}

/**
 * Combined notification request body
 */
export type NotifyPayload = TeamsNotifyPayload & EmailNotifyPayload;

/**
 * Notification results
 */
export interface NotifyResults {
  teams?: string;
  email?: string;
}

/**
 * Email send arguments
 */
export interface SendEmailArgs {
  env: Env;
  to: string[];
  subject: string;
  text?: string;
  html?: string;
}

/**
 * MailChannels email content item
 */
export interface MailChannelsContent {
  type: 'text/plain' | 'text/html';
  value: string;
}

/**
 * Generic API error response
 */
export interface ApiError {
  error: string;
}

/**
 * Generic API success response
 */
export interface ApiOk {
  ok: true;
}

/**
 * Entry creation request body
 */
export interface CreateEntryRequest {
  id?: string;
  date: string;
  platforms?: string[];
  assetType?: string;
  caption?: string;
  platformCaptions?: Record<string, string>;
  firstComment?: string;
  status?: string;
  approvers?: string[];
  author?: string;
  user?: string;
  campaign?: string;
  contentPillar?: string;
  previewUrl?: string;
  checklist?: Record<string, boolean>;
  analytics?: Record<string, unknown>;
  workflowStatus?: string;
  statusDetail?: string;
  aiFlags?: string[];
  aiScore?: Record<string, number>;
  testingFrameworkId?: string;
  testingFrameworkName?: string;
}

/**
 * Entry update request body
 */
export interface UpdateEntryRequest extends Partial<CreateEntryRequest> {
  approvedAt?: string | null;
}

/**
 * Idea creation request body
 */
export interface CreateIdeaRequest {
  id?: string;
  type?: string;
  title: string;
  notes?: string;
  links?: string[];
  attachments?: string[];
  inspiration?: string;
  createdBy?: string;
  targetDate?: string;
  targetMonth?: string;
}

/**
 * LinkedIn post creation request body
 */
export interface CreateLinkedInPostRequest {
  id?: string;
  submissionType?: string;
  status?: string;
  title: string;
  postCopy?: string;
  comments?: string;
  owner?: string;
  submitter?: string;
  links?: string[];
  attachments?: string[];
  targetDate?: string;
}

/**
 * User creation request body (admin)
 */
export interface CreateUserRequest {
  name: string;
  email: string;
  features?: string[];
  isAdmin?: boolean;
  isApprover?: boolean;
}

/**
 * User update request body (admin)
 */
export interface UpdateUserRequest {
  name?: string;
  features?: string[];
  isAdmin?: boolean;
  isApprover?: boolean;
  status?: string;
  resendInvite?: boolean;
}

/**
 * Testing framework creation request body
 */
export interface CreateTestingFrameworkRequest {
  id?: string;
  name: string;
  hypothesis?: string;
  audience?: string;
  metric?: string;
  duration?: string;
  status?: string;
  notes?: string;
}

/**
 * Audit log creation request body
 */
export interface CreateAuditRequest {
  user?: string;
  entryId?: string;
  action?: string;
  meta?: Record<string, unknown>;
}

/**
 * Password change request body
 */
export interface ChangePasswordRequest {
  currentPassword?: string;
  newPassword: string;
}

/**
 * Login request body
 */
export interface LoginRequest {
  email: string;
  password: string;
}

/**
 * Invite acceptance request body
 */
export interface AcceptInviteRequest {
  token: string;
  password: string;
  name?: string;
}

/**
 * Guidelines update request body
 */
export interface UpdateGuidelinesRequest {
  charLimits?: Record<string, number>;
  bannedWords?: string[];
  requiredPhrases?: string[];
  languageGuide?: string;
  hashtagTips?: string;
  teamsWebhookUrl?: string;
}

/**
 * User profile update request body
 */
export interface UpdateProfileRequest {
  name?: string;
  avatar?: string | null;
}

/**
 * SQL query binding value types
 */
export type SqlBindValue = string | number | null | boolean;
