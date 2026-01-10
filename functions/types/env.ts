/**
 * Cloudflare D1 Database binding interface
 * Represents the D1 database API available in Cloudflare Workers/Pages
 */
export interface D1Database {
  prepare(query: string): D1PreparedStatement;
  dump(): Promise<ArrayBuffer>;
  batch<T = unknown>(statements: D1PreparedStatement[]): Promise<D1Result<T>[]>;
  exec(query: string): Promise<D1ExecResult>;
}

export interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  first<T = unknown>(colName?: string): Promise<T | null>;
  run(): Promise<D1Result>;
  all<T = unknown>(): Promise<D1Result<T>>;
  raw<T = unknown[]>(): Promise<T[]>;
}

export interface D1Result<T = unknown> {
  results?: T[];
  success: boolean;
  error?: string;
  meta?: {
    changed_db?: boolean;
    changes?: number;
    duration?: number;
    last_row_id?: number;
    rows_read?: number;
    rows_written?: number;
  };
}

export interface D1ExecResult {
  count: number;
  duration: number;
}

/**
 * Cloudflare Workers/Pages Environment bindings
 * Contains all environment variables and bindings used by the PM Dashboard API
 */
export interface Env {
  // Database binding
  DB: D1Database;

  // OpenAI configuration
  OPENAI_API_KEY?: string;
  OPENAI_MODEL?: string;
  OPENAI_API_BASE?: string;

  // Session configuration
  SESSION_TTL_SECONDS?: string;
  INVITE_TTL_HOURS?: string;

  // Cloudflare Access configuration
  ACCESS_TEAM_DOMAIN?: string;
  ACCESS_CLIENT_ID?: string;
  ACCESS_CLIENT_SECRET?: string;
  ACCESS_ALLOWED_EMAILS?: string;
  ACCESS_AUTO_PROVISION?: string;
  ACCESS_DEFAULT_FEATURES?: string | string[];
  ACCESS_ADMIN_FEATURES?: string | string[];
  ACCESS_REQUIRE_SESSION?: string;

  // Admin configuration
  ADMIN_EMAILS?: string;

  // Default owner bootstrap configuration
  DEFAULT_OWNER_EMAIL?: string;
  DEFAULT_OWNER_NAME?: string;

  // Development/debug configuration
  ALLOW_UNAUTHENTICATED?: string;
  ACCESS_ALLOW_UNAUTHENTICATED?: string;
  DEV_AUTH_EMAIL?: string;
  DEV_AUTH_NAME?: string;
  DEV_AUTH_IS_ADMIN?: string;
  DEV_AUTH_IS_APPROVER?: string;
  DEV_AUTH_FEATURES?: string;

  // Cloudflare Pages deployment info
  CF_PAGES_URL?: string;
  CF_PAGES_BRANCH?: string;

  // Email configuration (MailChannels)
  MAIL_FROM?: string;
  MAIL_FROM_NAME?: string;
  MAIL_TO?: string;

  // Email configuration (Brevo)
  BREVO_API_KEY?: string;
  BREVO_API_TOKEN?: string;
  BREVO_SENDER_EMAIL?: string;
  BREVO_SENDER_NAME?: string;
  BREVO_API_BASE?: string;

  // Approver directory (JSON string)
  APPROVER_DIRECTORY?: string;

  // Teams webhook configuration
  TEAMS_WEBHOOK_ALLOW_LIST?: string;
}
