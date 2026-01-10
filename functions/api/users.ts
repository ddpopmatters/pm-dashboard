import { authorizeRequest } from './_auth';
import { generateToken, hashToken, randomId } from '../lib/crypto';
import { sendEmail } from '../lib/email';
import { jsonResponse } from '../lib/response';
import { createRequestLogger } from '../lib/logger';
import type { Env, UserRow, User, ApiContext, AuthResult, SqlBindValue } from '../types';

const ok = jsonResponse;

const ensureArrayOfStrings = (value: unknown): string[] => {
  if (!Array.isArray(value)) return [];
  return value.map((entry) => (typeof entry === 'string' ? entry.trim() : '')).filter(Boolean);
};

const serializeUser = (row: UserRow): User => ({
  id: row.id,
  email: row.email,
  name: row.name,
  status: row.status,
  isAdmin: Boolean(row.isAdmin),
  isApprover: Boolean(row.isApprover),
  avatarUrl: row.avatarUrl || null,
  features: (() => {
    try {
      const parsed = JSON.parse(row.features || '[]');
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  })(),
  invitePending: Boolean(row.inviteToken),
  inviteExpiresAt: row.inviteExpiresAt || null,
  lastLoginAt: row.lastLoginAt || null,
  createdAt: row.createdAt || null,
});

const inviteTtlMs = (env: Env) => {
  const raw = Number(env.INVITE_TTL_HOURS);
  if (Number.isFinite(raw) && raw > 0) return raw * 3600 * 1000;
  return 1000 * 60 * 60 * 24 * 7; // 7 days
};

const inviteLink = (request: Request, token: string) => {
  const url = new URL(request.url);
  return `${url.protocol}//${url.host}?invite=${encodeURIComponent(token)}`;
};

const sendInvite = async ({
  request,
  env,
  email,
  name,
  token,
}: {
  request: Request;
  env: Env;
  email: string;
  name: string;
  token: string;
}) => {
  const link = inviteLink(request, token);
  const subject = 'You have been invited to the PM Dashboard';
  const text = `Hi ${name || email},

You've been invited to the Population Matters PM Dashboard. Click the link below to set your password and access the workspace:

${link}

If you weren't expecting this invitation, please contact the communications team.`;
  await sendEmail({ env, to: [email], subject, text });
};

const requireAdmin = (auth: AuthResult) => {
  if (!auth.ok || !auth.user.isAdmin)
    return { ok: false as const, response: ok({ error: 'Forbidden' }, 403) as Response };
  return { ok: true as const };
};

// More robust email validation regex
// Requires: local part, @, domain with at least one dot, TLD of 2+ chars
const emailRegex =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/;

const normalizeEmail = (value: string) => value.trim().toLowerCase();

const deleteSessionsForUser = async (env: Env, userId: string) => {
  await env.DB.prepare('DELETE FROM sessions WHERE userId=?').bind(userId).run();
};

export const onRequestGet = async ({ request, env }: ApiContext) => {
  const auth = await authorizeRequest(request, env);
  if (!auth.ok) return ok({ error: auth.error }, auth.status);
  const gate = requireAdmin(auth);
  if (!gate.ok) return gate.response;
  const { results } = await env.DB.prepare(
    'SELECT id,email,name,status,isAdmin,isApprover,avatarUrl,features,inviteToken,inviteExpiresAt,lastLoginAt,createdAt FROM users ORDER BY createdAt DESC',
  ).all<UserRow>();
  return ok((results || []).map(serializeUser));
};

export const onRequestPost = async ({ request, env }: ApiContext) => {
  let log = createRequestLogger(request, { operation: 'user_create' });
  const auth = await authorizeRequest(request, env);
  if (!auth.ok) {
    log.warn('User create failed: Authorization failed', { error: auth.error });
    return ok({ error: auth.error }, auth.status);
  }
  log = log.child({ adminUserId: auth.user.id });

  const gate = requireAdmin(auth);
  if (!gate.ok) {
    log.warn('User create failed: Forbidden - user is not admin');
    return gate.response;
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== 'object') {
    log.warn('User create failed: Invalid JSON body');
    return ok({ error: 'Invalid JSON' }, 400);
  }
  const name = typeof body.name === 'string' && body.name.trim() ? body.name.trim() : '';
  const email = typeof body.email === 'string' ? normalizeEmail(body.email) : '';
  if (!name || !email || !emailRegex.test(email)) {
    log.warn('User create failed: Invalid name or email', { email: email || undefined });
    return ok({ error: 'Name and valid email required' }, 400);
  }
  const features = ensureArrayOfStrings(body.features);
  const isAdmin = Boolean(body.isAdmin);
  const isApprover = Boolean(body.isApprover);

  try {
    const existing = await env.DB.prepare('SELECT * FROM users WHERE email=?')
      .bind(email)
      .first<UserRow>();
    const token = generateToken(32);
    const tokenHash = await hashToken(token);
    const expiresAt = new Date(Date.now() + inviteTtlMs(env)).toISOString();
    const now = new Date().toISOString();

    if (existing) {
      if (existing.status !== 'disabled') {
        log.warn('User create failed: User already exists', { email, existingUserId: existing.id });
        return ok({ error: 'User already exists' }, 409);
      }
      await env.DB.prepare(
        'UPDATE users SET name=?, features=?, status=?, isAdmin=?, isApprover=?, inviteToken=?, inviteExpiresAt=?, updatedAt=? WHERE id=?',
      )
        .bind(
          name,
          JSON.stringify(features),
          'pending',
          isAdmin ? 1 : 0,
          isApprover ? 1 : 0,
          tokenHash,
          expiresAt,
          now,
          existing.id,
        )
        .run();
      await sendInvite({ request, env, email, name, token });
      const row = await env.DB.prepare('SELECT * FROM users WHERE id=?')
        .bind(existing.id)
        .first<UserRow>();
      log.info('User re-enabled and invite sent', { userId: existing.id, email });
      return ok(serializeUser(row!));
    }

    const id = randomId('usr_');
    await env.DB.prepare(
      'INSERT INTO users (id,email,name,features,status,isAdmin,isApprover,inviteToken,inviteExpiresAt,createdAt,updatedAt) VALUES (?,?,?,?,?,?,?,?,?,?,?)',
    )
      .bind(
        id,
        email,
        name,
        JSON.stringify(features),
        'pending',
        isAdmin ? 1 : 0,
        isApprover ? 1 : 0,
        tokenHash,
        expiresAt,
        now,
        now,
      )
      .run();
    await sendInvite({ request, env, email, name, token });
    const row = await env.DB.prepare('SELECT * FROM users WHERE id=?').bind(id).first<UserRow>();
    log.info('User created and invite sent', { userId: id, email, isAdmin, isApprover });
    return ok(serializeUser(row!), 201);
  } catch (err) {
    log.error('User create failed: Database error', err instanceof Error ? err : null, { email });
    throw err;
  }
};

export const onRequestPut = async ({ request, env }: ApiContext) => {
  let log = createRequestLogger(request, { operation: 'user_update' });
  const auth = await authorizeRequest(request, env);
  if (!auth.ok) {
    log.warn('User update failed: Authorization failed', { error: auth.error });
    return ok({ error: auth.error }, auth.status);
  }
  log = log.child({ adminUserId: auth.user.id });

  const gate = requireAdmin(auth);
  if (!gate.ok) {
    log.warn('User update failed: Forbidden - user is not admin');
    return gate.response;
  }

  const url = new URL(request.url);
  const id = url.searchParams.get('id');
  if (!id) {
    log.warn('User update failed: Missing id');
    return ok({ error: 'Missing id' }, 400);
  }
  log = log.child({ targetUserId: id });

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== 'object') {
    log.warn('User update failed: Invalid JSON body');
    return ok({ error: 'Invalid JSON' }, 400);
  }

  try {
    const existing = await env.DB.prepare('SELECT * FROM users WHERE id=?')
      .bind(id)
      .first<UserRow>();
    if (!existing) {
      log.warn('User update failed: User not found');
      return ok({ error: 'Not found' }, 404);
    }

    const updates: string[] = [];
    const binds: SqlBindValue[] = [];
    const changes: Record<string, unknown> = {};

    if (typeof body.name === 'string' && body.name.trim()) {
      updates.push('name=?');
      binds.push(body.name.trim());
      changes.name = body.name.trim();
    }
    if (body.features) {
      updates.push('features=?');
      binds.push(JSON.stringify(ensureArrayOfStrings(body.features)));
      changes.features = ensureArrayOfStrings(body.features);
    }
    if (typeof body.isAdmin === 'boolean') {
      updates.push('isAdmin=?');
      binds.push(body.isAdmin ? 1 : 0);
      changes.isAdmin = body.isAdmin;
    }
    if (typeof body.isApprover === 'boolean') {
      updates.push('isApprover=?');
      binds.push(body.isApprover ? 1 : 0);
      changes.isApprover = body.isApprover;
    }
    if (typeof body.status === 'string') {
      const normalizedStatus = ['pending', 'active', 'disabled'].includes(body.status)
        ? body.status
        : null;
      if (normalizedStatus) {
        updates.push('status=?');
        binds.push(normalizedStatus);
        changes.status = normalizedStatus;
        if (normalizedStatus === 'disabled') {
          await deleteSessionsForUser(env, id);
          log.info('User sessions deleted due to status change to disabled');
        }
      }
    }

    let inviteResent = false;
    if (body.resendInvite) {
      const token = generateToken(32);
      const tokenHash = await hashToken(token);
      const expiresAt = new Date(Date.now() + inviteTtlMs(env)).toISOString();
      updates.push('inviteToken=?');
      binds.push(tokenHash);
      updates.push('inviteExpiresAt=?');
      binds.push(expiresAt);
      inviteResent = true;
      await sendInvite({ request, env, email: existing.email, name: existing.name, token });
      log.info('Invite resent', { email: existing.email });
    }

    if (!updates.length) {
      log.info('User update: No changes made');
      return ok({ ok: true, user: serializeUser(existing), inviteResent });
    }

    updates.push('updatedAt=?');
    binds.push(new Date().toISOString(), id);
    await env.DB.prepare(`UPDATE users SET ${updates.join(', ')} WHERE id=?`)
      .bind(...binds)
      .run();
    const row = await env.DB.prepare('SELECT * FROM users WHERE id=?').bind(id).first<UserRow>();
    log.info('User updated successfully', { changes, inviteResent });
    return ok({ ok: true, user: serializeUser(row!), inviteResent });
  } catch (err) {
    log.error('User update failed: Database error', err instanceof Error ? err : null);
    throw err;
  }
};

export const onRequestDelete = async ({ request, env }: ApiContext) => {
  let log = createRequestLogger(request, { operation: 'user_disable' });
  const auth = await authorizeRequest(request, env);
  if (!auth.ok) {
    log.warn('User disable failed: Authorization failed', { error: auth.error });
    return ok({ error: auth.error }, auth.status);
  }
  log = log.child({ adminUserId: auth.user.id });

  const gate = requireAdmin(auth);
  if (!gate.ok) {
    log.warn('User disable failed: Forbidden - user is not admin');
    return gate.response;
  }

  const url = new URL(request.url);
  const id = url.searchParams.get('id');
  if (!id) {
    log.warn('User disable failed: Missing id');
    return ok({ error: 'Missing id' }, 400);
  }
  log = log.child({ targetUserId: id });

  try {
    const existing = await env.DB.prepare('SELECT * FROM users WHERE id=?')
      .bind(id)
      .first<UserRow>();
    if (!existing) {
      log.warn('User disable failed: User not found');
      return ok({ error: 'Not found' }, 404);
    }

    await deleteSessionsForUser(env, id);
    await env.DB.prepare(
      'UPDATE users SET status="disabled", inviteToken=NULL, inviteExpiresAt=NULL, updatedAt=? WHERE id=?',
    )
      .bind(new Date().toISOString(), id)
      .run();
    log.info('User disabled successfully', { email: existing.email });
    return ok({ ok: true });
  } catch (err) {
    log.error('User disable failed: Database error', err instanceof Error ? err : null);
    throw err;
  }
};
