-- D1 schema for pm-dashboard

-- Entries (scheduled content)
CREATE TABLE IF NOT EXISTS entries (
  id TEXT PRIMARY KEY,
  date TEXT NOT NULL,
  platforms TEXT,
  assetType TEXT,
  caption TEXT,
  platformCaptions TEXT,
  firstComment TEXT,
  approvalDeadline TEXT,
  status TEXT,
  approvers TEXT,
  author TEXT,
  campaign TEXT,
  contentPillar TEXT,
  previewUrl TEXT,
  checklist TEXT,
  analytics TEXT,
  workflowStatus TEXT,
  statusDetail TEXT,
  aiFlags TEXT,
  aiScore TEXT,
  testingFrameworkId TEXT,
  testingFrameworkName TEXT,
  createdAt TEXT,
  updatedAt TEXT,
  approvedAt TEXT,
  deletedAt TEXT
);

-- Ideas (content ideas)
CREATE TABLE IF NOT EXISTS ideas (
  id TEXT PRIMARY KEY,
  type TEXT,
  title TEXT NOT NULL,
  notes TEXT,
  links TEXT,
  attachments TEXT,
  inspiration TEXT,
  createdBy TEXT,
  createdAt TEXT,
  targetDate TEXT,
  targetMonth TEXT
);

-- Guidelines (content rules)
CREATE TABLE IF NOT EXISTS guidelines (
  id TEXT PRIMARY KEY,
  charLimits TEXT,
  bannedWords TEXT,
  requiredPhrases TEXT,
  languageGuide TEXT,
  hashtagTips TEXT,
  teamsWebhookUrl TEXT
);

-- Audit log
CREATE TABLE IF NOT EXISTS audit (
  id TEXT PRIMARY KEY,
  ts TEXT,
  user TEXT,
  entryId TEXT,
  action TEXT,
  meta TEXT
);

-- LinkedIn submissions
CREATE TABLE IF NOT EXISTS linkedin_submissions (
  id TEXT PRIMARY KEY,
  submissionType TEXT,
  status TEXT,
  title TEXT,
  postCopy TEXT,
  comments TEXT,
  owner TEXT,
  submitter TEXT,
  links TEXT,
  attachments TEXT,
  targetDate TEXT,
  createdAt TEXT,
  updatedAt TEXT
);

-- Testing frameworks
CREATE TABLE IF NOT EXISTS testing_frameworks (
  id TEXT PRIMARY KEY,
  name TEXT,
  hypothesis TEXT,
  audience TEXT,
  metric TEXT,
  duration TEXT,
  status TEXT,
  notes TEXT,
  createdAt TEXT
);

-- Users and sessions for dashboard authentication
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  passwordHash TEXT,
  inviteToken TEXT,
  inviteExpiresAt TEXT,
  features TEXT,
  status TEXT DEFAULT 'pending',
  isAdmin INTEGER DEFAULT 0,
  isApprover INTEGER DEFAULT 0,
  avatarUrl TEXT,
  createdAt TEXT,
  updatedAt TEXT,
  lastLoginAt TEXT
);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  tokenHash TEXT NOT NULL,
  createdAt TEXT,
  expiresAt TEXT,
  userAgent TEXT,
  ip TEXT,
  FOREIGN KEY (userId) REFERENCES users(id)
);
CREATE INDEX IF NOT EXISTS idx_sessions_tokenHash ON sessions(tokenHash);
CREATE INDEX IF NOT EXISTS idx_sessions_userId ON sessions(userId);

-- Performance indexes for common queries
CREATE INDEX IF NOT EXISTS idx_entries_date ON entries(date);
CREATE INDEX IF NOT EXISTS idx_entries_status ON entries(status);
CREATE INDEX IF NOT EXISTS idx_entries_workflowStatus ON entries(workflowStatus);
CREATE INDEX IF NOT EXISTS idx_audit_entryId ON audit(entryId);
CREATE INDEX IF NOT EXISTS idx_audit_ts ON audit(ts DESC);
CREATE INDEX IF NOT EXISTS idx_ideas_targetMonth ON ideas(targetMonth);
CREATE INDEX IF NOT EXISTS idx_users_inviteToken ON users(inviteToken);

-- Rate limiting for persistent rate limiting across Workers instances
CREATE TABLE IF NOT EXISTS rate_limits (
  key TEXT PRIMARY KEY,
  count INTEGER DEFAULT 1,
  window_start INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_rate_limits_window_start ON rate_limits(window_start);
