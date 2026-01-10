import { hashPassword, hashToken, generateToken, randomId, verifyPassword } from '../lib/crypto';
import { ensureDefaultOwner } from '../lib/bootstrap';
import { verifyCsrfHeader } from './_auth';

const SESSION_COOKIE = 'pm_session';

// Rate limiting for invite token validation to prevent brute-force attacks
const INVITE_RL = new Map<string, { attempts: number; blockedUntil: number }>();
const INVITE_RL_MAX_ATTEMPTS = 5;
const INVITE_RL_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const INVITE_RL_BLOCK_MS = 60 * 60 * 1000; // 1 hour block after max attempts

function checkInviteRateLimit(ip: string): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();
  const entry = INVITE_RL.get(ip);

  if (entry) {
    // Check if blocked
    if (entry.blockedUntil > now) {
      return { allowed: false, retryAfter: Math.ceil((entry.blockedUntil - now) / 1000) };
    }
    // Reset if window has passed
    if (entry.blockedUntil < now - INVITE_RL_WINDOW_MS) {
      INVITE_RL.delete(ip);
    }
  }

  return { allowed: true };
}

function recordInviteAttempt(ip: string, success: boolean): void {
  if (success) {
    INVITE_RL.delete(ip);
    return;
  }

  const now = Date.now();
  const entry = INVITE_RL.get(ip) || { attempts: 0, blockedUntil: 0 };
  entry.attempts += 1;

  if (entry.attempts >= INVITE_RL_MAX_ATTEMPTS) {
    entry.blockedUntil = now + INVITE_RL_BLOCK_MS;
    console.warn(`Rate limit: IP ${ip} blocked for invite token attempts`);
  }

  INVITE_RL.set(ip, entry);
}
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

const sessionTtlSeconds = (env: any) => {
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

const findUserByEmail = async (env: any, email: string) =>
  env.DB.prepare('SELECT * FROM users WHERE email=?').bind(email.toLowerCase()).first();

const sanitizeUser = (row: any) => ({
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

const createSession = async (request: Request, env: any, userId: string) => {
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

const destroySessionFromRequest = async (request: Request, env: any) => {
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

export const onRequestPost = async ({ request, env }: { request: Request; env: any }) => {
  // CSRF protection
  if (!verifyCsrfHeader(request)) {
    return json({ error: 'CSRF validation failed' }, 403);
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== 'object') return json({ error: 'Invalid JSON' }, 400);
  const email = ensureEmail(body.email);
  const password = typeof body.password === 'string' ? body.password : '';
  if (!email || !password) return json({ error: 'Email and password required' }, 400);
  await ensureDefaultOwner(env);
  const user = await findUserByEmail(env, email);
  if (!user || !user.passwordHash) return json({ error: 'Invalid credentials' }, 401);
  if (user.status === 'disabled') return json({ error: 'Account disabled' }, 403);
  const okPassword = await verifyPassword(password, user.passwordHash);
  if (!okPassword) return json({ error: 'Invalid credentials' }, 401);
  await env.DB.prepare('UPDATE users SET lastLoginAt=?, status=? WHERE id=?')
    .bind(new Date().toISOString(), user.status === 'pending' ? 'active' : user.status, user.id)
    .run();
  const session = await createSession(request, env, user.id);
  return json({ ok: true, user: sanitizeUser(user) }, 200, [
    cookieString(session.token, session.ttl),
    clearAccessOverrideCookie,
  ]);
};

export const onRequestPut = async ({ request, env }: { request: Request; env: any }) => {
  // CSRF protection
  if (!verifyCsrfHeader(request)) {
    return json({ error: 'CSRF validation failed' }, 403);
  }

  const ip = getIP(request);

  // Check rate limit before processing
  const rlCheck = checkInviteRateLimit(ip);
  if (!rlCheck.allowed) {
    return json({ error: 'Too many attempts. Please try again later.' }, 429, undefined);
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== 'object') return json({ error: 'Invalid JSON' }, 400);
  const token = typeof body.token === 'string' ? body.token.trim() : '';
  const password = typeof body.password === 'string' ? body.password : '';
  if (!token || !password) return json({ error: 'Token and password required' }, 400);
  if (password.length < MIN_PASSWORD_LENGTH) {
    return json({ error: 'Password must be at least 8 characters.' }, 400);
  }
  const now = new Date();
  // Hash the token before lookup (tokens are stored hashed)
  const tokenHash = await hashToken(token);
  const row = await env.DB.prepare('SELECT * FROM users WHERE inviteToken=?')
    .bind(tokenHash)
    .first();
  if (!row) {
    recordInviteAttempt(ip, false);
    return json({ error: 'Invalid or expired invite' }, 400);
  }
  if (row.inviteExpiresAt && new Date(row.inviteExpiresAt).getTime() < now.getTime()) {
    recordInviteAttempt(ip, false);
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
  recordInviteAttempt(ip, true); // Clear rate limit on success
  const session = await createSession(request, env, row.id);
  return json({ ok: true, user: sanitizeUser({ ...row, name: nextName }) }, 200, [
    cookieString(session.token, session.ttl),
    clearAccessOverrideCookie,
  ]);
};

export const onRequestDelete = async ({ request, env }: { request: Request; env: any }) => {
  await destroySessionFromRequest(request, env);
  return json({ ok: true }, 200, [clearCookie, setAccessOverrideCookie]);
};
