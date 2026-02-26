import { hashPassword, hashToken, generateToken, randomId, verifyPassword } from '../lib/crypto';
import { ensureDefaultOwner } from '../lib/bootstrap';
import { verifyCsrfHeader } from './_auth';
import { createRequestLogger } from '../lib/logger';
import { checkRateLimit, resetRateLimit, maybeCleanupExpiredRateLimits } from '../lib/ratelimit';
import type { Env, UserRow, ApiContext, User } from '../types';

const SESSION_COOKIE = 'pm_session';

// Rate limiting constants
const LOGIN_RL_MAX_ATTEMPTS = 5;
const LOGIN_RL_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const INVITE_RL_MAX_ATTEMPTS = 5;
const INVITE_RL_WINDOW_MS = 15 * 60 * 1000; // 15 minutes

const ACCESS_OVERRIDE_COOKIE = 'pm_access_override';
const MIN_PASSWORD_LENGTH = 8;

const setAccessOverrideCookie = `${ACCESS_OVERRIDE_COOKIE}=1; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=900`;
const clearAccessOverrideCookie = `${ACCESS_OVERRIDE_COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;

const json = (data: unknown, status = 200, cookies?: string | string[]) => {
  const headers = new Headers({ 'content-type': 'application/json' });
  if (cookies) {
    const list = Array.isArray(cookies) ? cookies : [cookies];
    list.filter(Boolean).forEach((cookie) => headers.append('set-cookie', cookie));
  }
  return new Response(JSON.stringify(data), { status, headers });
};

const sessionTtlSeconds = (env: Env) => {
  const raw = Number(env.SESSION_TTL_SECONDS);
  if (Number.isFinite(raw) && raw > 0) return raw;
  return 60 * 60 * 24 * 7; // 7 days
};

const cookieString = (token: string, maxAge: number) =>
  `${SESSION_COOKIE}=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`;
const clearCookie = `${SESSION_COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;

const getIP = (req: Request) =>
  (req.headers.get('cf-connecting-ip') || req.headers.get('x-forwarded-for') || 'anon').toString();

const sessionUserAgent = (req: Request) => req.headers.get('user-agent') || '';

const findUserByEmail = async (env: Env, email: string) =>
  env.DB.prepare('SELECT * FROM users WHERE email=?').bind(email.toLowerCase()).first<UserRow>();

const sanitizeUser = (row: UserRow): User => ({
  id: row.id,
  email: row.email,
  name: row.name,
  status: row.status,
  isAdmin: Boolean(row.isAdmin),
  isApprover: Boolean(row.isApprover),
  avatarUrl: row.avatarUrl || null,
  hasPassword: Boolean(row.passwordHash),
  features: (() => {
    try {
      const parsed = JSON.parse(row.features || '[]');
      if (Array.isArray(parsed)) return parsed;
    } catch {
      // ignore
    }
    return [];
  })(),
});

const createSession = async (request: Request, env: Env, userId: string) => {
  const ttl = sessionTtlSeconds(env);
  const token = generateToken(32);
  const tokenHash = await hashToken(token);
  const now = new Date();
  const expiresAt = new Date(now.getTime() + ttl * 1000).toISOString();
  await env.DB.prepare(
    'INSERT INTO sessions (id,userId,tokenHash,createdAt,expiresAt,userAgent,ip) VALUES (?,?,?,?,?,?,?)',
  )
    .bind(
      randomId('ses_'),
      userId,
      tokenHash,
      now.toISOString(),
      expiresAt,
      sessionUserAgent(request).slice(0, 255),
      getIP(request),
    )
    .run();
  return { token, ttl };
};

const destroySessionFromRequest = async (request: Request, env: Env) => {
  const cookieHeader = request.headers.get('cookie');
  if (!cookieHeader) return;
  const cookies = Object.fromEntries(
    cookieHeader.split(';').map((entry) => {
      const [k, ...rest] = entry.trim().split('=');
      return [k, rest.join('=')];
    }),
  );
  const token = cookies[SESSION_COOKIE];
  if (!token) return;
  const tokenHash = await hashToken(token);
  await env.DB.prepare('DELETE FROM sessions WHERE tokenHash=?').bind(tokenHash).run();
};

const ensureEmail = (value: string | undefined | null) => {
  if (!value) return '';
  const trimmed = value.trim().toLowerCase();
  if (!trimmed.includes('@')) return '';
  return trimmed;
};

export const onRequestPost = async ({ request, env }: ApiContext) => {
  const log = createRequestLogger(request, { operation: 'login' });

  // CSRF protection
  if (!verifyCsrfHeader(request)) {
    log.warn('Login failed: CSRF validation failed');
    return json({ error: 'CSRF validation failed' }, 403);
  }

  const ip = getIP(request);
  const rateLimitKey = `login:${ip}`;

  // Probabilistically clean up expired rate limits
  maybeCleanupExpiredRateLimits(env.DB);

  // Check rate limit before processing
  const rlCheck = await checkRateLimit(
    env.DB,
    rateLimitKey,
    LOGIN_RL_MAX_ATTEMPTS,
    LOGIN_RL_WINDOW_MS,
  );
  if (!rlCheck.allowed) {
    log.warn('Login failed: Rate limited', { ip });
    return json({ error: 'Too many login attempts. Please try again later.' }, 429);
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== 'object') {
    log.warn('Login failed: Invalid JSON body');
    return json({ error: 'Invalid JSON' }, 400);
  }
  const email = ensureEmail(body.email);
  const password = typeof body.password === 'string' ? body.password : '';
  if (!email || !password) {
    log.warn('Login failed: Missing email or password', { email: email || undefined });
    return json({ error: 'Email and password required' }, 400);
  }
  await ensureDefaultOwner(env);
  const user = await findUserByEmail(env, email);
  if (!user || !user.passwordHash) {
    log.warn('Login failed: Invalid credentials', { email });
    return json({ error: 'Invalid credentials' }, 401);
  }
  if (user.status === 'disabled') {
    log.warn('Login failed: Account disabled', { email, userId: user.id });
    return json({ error: 'Account disabled' }, 403);
  }
  const okPassword = await verifyPassword(password, user.passwordHash);
  if (!okPassword) {
    log.warn('Login failed: Invalid password', { email, userId: user.id });
    return json({ error: 'Invalid credentials' }, 401);
  }
  // Clear rate limit on successful login
  await resetRateLimit(env.DB, rateLimitKey);
  await env.DB.prepare('UPDATE users SET lastLoginAt=?, status=? WHERE id=?')
    .bind(new Date().toISOString(), user.status === 'pending' ? 'active' : user.status, user.id)
    .run();
  const session = await createSession(request, env, user.id);
  log.info('Login successful', { email, userId: user.id });
  return json({ ok: true, user: sanitizeUser(user) }, 200, [
    cookieString(session.token, session.ttl),
    clearAccessOverrideCookie,
  ]);
};

export const onRequestPut = async ({ request, env }: ApiContext) => {
  const log = createRequestLogger(request, { operation: 'invite_accept' });

  // CSRF protection
  if (!verifyCsrfHeader(request)) {
    log.warn('Invite accept failed: CSRF validation failed');
    return json({ error: 'CSRF validation failed' }, 403);
  }

  const ip = getIP(request);
  const rateLimitKey = `invite:${ip}`;

  // Probabilistically clean up expired rate limits
  maybeCleanupExpiredRateLimits(env.DB);

  // Check rate limit before processing using D1-backed rate limiter
  const rlCheck = await checkRateLimit(
    env.DB,
    rateLimitKey,
    INVITE_RL_MAX_ATTEMPTS,
    INVITE_RL_WINDOW_MS,
  );
  if (!rlCheck.allowed) {
    log.warn('Invite accept failed: Rate limited', { ip });
    return json({ error: 'Too many attempts. Please try again later.' }, 429, undefined);
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== 'object') {
    log.warn('Invite accept failed: Invalid JSON body');
    return json({ error: 'Invalid JSON' }, 400);
  }
  const token = typeof body.token === 'string' ? body.token.trim() : '';
  const password = typeof body.password === 'string' ? body.password : '';
  if (!token || !password) {
    log.warn('Invite accept failed: Missing token or password');
    return json({ error: 'Token and password required' }, 400);
  }
  if (password.length < MIN_PASSWORD_LENGTH) {
    log.warn('Invite accept failed: Password too short');
    return json({ error: 'Password must be at least 8 characters.' }, 400);
  }
  const now = new Date();
  // Hash the token before lookup (tokens are stored hashed)
  const tokenHash = await hashToken(token);
  const row = await env.DB.prepare('SELECT * FROM users WHERE inviteToken=?')
    .bind(tokenHash)
    .first<UserRow>();
  if (!row) {
    // Rate limit is already incremented by checkRateLimit, no need to record again
    log.warn('Invite accept failed: Invalid or expired invite token');
    return json({ error: 'Invalid or expired invite' }, 400);
  }
  if (row.inviteExpiresAt && new Date(row.inviteExpiresAt).getTime() < now.getTime()) {
    // Rate limit is already incremented by checkRateLimit, no need to record again
    log.warn('Invite accept failed: Invite expired', { userId: row.id, email: row.email });
    return json({ error: 'Invite expired' }, 400);
  }
  const hashed = await hashPassword(password);
  const nextName =
    typeof body.name === 'string' && body.name.trim().length ? body.name.trim() : row.name;
  await env.DB.prepare(
    'UPDATE users SET passwordHash=?, inviteToken=NULL, inviteExpiresAt=NULL, status=?, name=?, updatedAt=?, lastLoginAt=? WHERE id=?',
  )
    .bind(hashed, 'active', nextName, now.toISOString(), now.toISOString(), row.id)
    .run();
  // Clear rate limit on success
  await resetRateLimit(env.DB, rateLimitKey);
  const session = await createSession(request, env, row.id);
  log.info('Invite accepted successfully', { userId: row.id, email: row.email });
  return json({ ok: true, user: sanitizeUser({ ...row, name: nextName }) }, 200, [
    cookieString(session.token, session.ttl),
    clearAccessOverrideCookie,
  ]);
};

export const onRequestDelete = async ({ request, env }: ApiContext) => {
  const log = createRequestLogger(request, { operation: 'logout' });
  await destroySessionFromRequest(request, env);
  log.info('User logged out');
  return json({ ok: true }, 200, [clearCookie, setAccessOverrideCookie]);
};
