import { generateToken, hashToken, randomId } from './crypto';

// Default owner configuration - MUST be set via environment variables
// DEFAULT_OWNER_EMAIL and DEFAULT_OWNER_NAME are required for bootstrap
const DEFAULT_OWNER_FEATURES = [
  'calendar',
  'kanban',
  'approvals',
  'ideas',
  'linkedin',
  'testing',
  'admin',
];

const USER_ALTERS = [
  'ALTER TABLE users ADD COLUMN inviteToken TEXT',
  'ALTER TABLE users ADD COLUMN inviteExpiresAt TEXT',
  'ALTER TABLE users ADD COLUMN features TEXT',
  "ALTER TABLE users ADD COLUMN status TEXT DEFAULT 'pending'",
  'ALTER TABLE users ADD COLUMN isAdmin INTEGER DEFAULT 0',
  'ALTER TABLE users ADD COLUMN lastLoginAt TEXT',
  'ALTER TABLE users ADD COLUMN isApprover INTEGER DEFAULT 0',
  'ALTER TABLE users ADD COLUMN avatarUrl TEXT',
];

async function ensureSchema(env: any) {
  await env.DB.prepare(
    `CREATE TABLE IF NOT EXISTS users (
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
    )`,
  ).run();
  await env.DB.prepare(
    `CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      tokenHash TEXT NOT NULL,
      createdAt TEXT,
      expiresAt TEXT,
      userAgent TEXT,
      ip TEXT
    )`,
  ).run();
  for (const sql of USER_ALTERS) {
    try {
      await env.DB.prepare(sql).run();
    } catch {
      // Column already exists; ignore
    }
  }
}

const logInviteToken = (token: string, email: string) => {
  if (!token) return;
  // Log invite token info - in production, consider using a more secure notification method
  console.info(
    `[Bootstrap] Invite token generated for ${email}. Use ?invite=<token> to complete setup.`,
  );
  // Note: The actual token is intentionally NOT logged for security reasons
};

export async function ensureDefaultOwner(env: any) {
  try {
    if (!env?.DB) return;
    await ensureSchema(env);

    // Read owner config from environment - skip bootstrap if not configured
    const ownerEmail = env.DEFAULT_OWNER_EMAIL;
    const ownerName = env.DEFAULT_OWNER_NAME;
    if (!ownerEmail) {
      // No default owner configured - this is fine, users can be created via admin
      return;
    }

    const normalizedEmail = ownerEmail.trim().toLowerCase();
    const displayName = ownerName?.trim() || normalizedEmail;
    const existing = await env.DB.prepare('SELECT * FROM users WHERE email=?')
      .bind(normalizedEmail)
      .first();
    const now = new Date().toISOString();
    const featuresJson = JSON.stringify(DEFAULT_OWNER_FEATURES);
    if (!existing) {
      const id = randomId('usr_');
      const inviteToken = generateToken(32);
      const inviteTokenHash = await hashToken(inviteToken);
      await env.DB.prepare(
        'INSERT INTO users (id,email,name,status,isAdmin,isApprover,features,inviteToken,inviteExpiresAt,createdAt,updatedAt,avatarUrl) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)',
      )
        .bind(
          id,
          normalizedEmail,
          displayName,
          'pending',
          1,
          1,
          featuresJson,
          inviteTokenHash,
          null,
          now,
          now,
          null,
        )
        .run();
      logInviteToken(inviteToken, normalizedEmail);
      return;
    }
    const updates: string[] = [];
    const bindings: any[] = [];
    if (displayName && existing.name !== displayName) {
      updates.push('name=?');
      bindings.push(displayName);
    }
    if (!existing.features || existing.features === '[]') {
      updates.push('features=?');
      bindings.push(featuresJson);
    }
    if (!existing.isAdmin) {
      updates.push('isAdmin=?');
      bindings.push(1);
    }
    if (!existing.isApprover) {
      updates.push('isApprover=?');
      bindings.push(1);
    }
    if (existing.status === 'disabled') {
      updates.push('status=?');
      bindings.push('pending');
    }
    let inviteToken: string | null = null;
    if (!existing.passwordHash && !existing.inviteToken) {
      inviteToken = generateToken(32);
      const inviteTokenHash = await hashToken(inviteToken);
      updates.push('inviteToken=?');
      bindings.push(inviteTokenHash);
      updates.push('inviteExpiresAt=?');
      bindings.push(null);
    }
    if (updates.length) {
      updates.push('updatedAt=?');
      bindings.push(now, existing.id);
      await env.DB.prepare(`UPDATE users SET ${updates.join(', ')} WHERE id=?`)
        .bind(...bindings)
        .run();
    }
    if (inviteToken) logInviteToken(inviteToken, normalizedEmail);
  } catch (error) {
    console.warn('Default owner bootstrap failed', error);
  }
}
