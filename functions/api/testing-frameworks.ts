import { authorizeRequest } from './_auth';
import { jsonResponse as ok, uuid, nowIso } from '../lib/response';
import { sanitizeText, sanitizeMultilineText, sanitizeOptionalText } from '../lib/sanitize';
import type { ApiContext, TestingFrameworkRow } from '../types';

export const onRequestGet = async ({ request, env }: ApiContext) => {
  const auth = await authorizeRequest(request, env);
  if (!auth.ok) return ok({ error: auth.error }, auth.status);
  const { results } = await env.DB.prepare(
    'SELECT * FROM testing_frameworks ORDER BY createdAt DESC',
  ).all<TestingFrameworkRow>();
  return ok(results || []);
};

export const onRequestPost = async ({ request, env }: ApiContext) => {
  const auth = await authorizeRequest(request, env);
  if (!auth.ok) return ok({ error: auth.error }, auth.status);
  const b = await request.json().catch(() => null);
  if (!b || typeof b.name !== 'string' || !b.name.trim()) return ok({ error: 'Invalid JSON' }, 400);
  const id = b.id || uuid();
  const createdAt = nowIso();
  await env.DB.prepare(
    `INSERT INTO testing_frameworks (id,name,hypothesis,audience,metric,duration,status,notes,createdAt) VALUES (?,?,?,?,?,?,?,?,?)`,
  )
    .bind(
      id,
      sanitizeText(b.name),
      sanitizeMultilineText(b.hypothesis),
      sanitizeOptionalText(b.audience),
      sanitizeOptionalText(b.metric),
      sanitizeOptionalText(b.duration),
      sanitizeOptionalText(b.status, 'Planned'),
      sanitizeMultilineText(b.notes),
      createdAt,
    )
    .run();
  return ok({ id });
};

export const onRequestPut = async ({ request, env }: ApiContext) => {
  const auth = await authorizeRequest(request, env);
  if (!auth.ok) return ok({ error: auth.error }, auth.status);
  const url = new URL(request.url);
  const id = url.searchParams.get('id');
  if (!id) return ok({ error: 'Missing id' }, 400);
  const b = await request.json().catch(() => null);
  if (!b) return ok({ error: 'Invalid JSON' }, 400);
  const existing = await env.DB.prepare('SELECT * FROM testing_frameworks WHERE id=?')
    .bind(id)
    .first<TestingFrameworkRow>();
  if (!existing) return ok({ error: 'Not found' }, 404);
  await env.DB.prepare(
    `UPDATE testing_frameworks SET name=?, hypothesis=?, audience=?, metric=?, duration=?, status=?, notes=? WHERE id=?`,
  )
    .bind(
      b.name !== undefined ? sanitizeText(b.name) : existing.name,
      b.hypothesis !== undefined ? sanitizeMultilineText(b.hypothesis) : existing.hypothesis,
      b.audience !== undefined ? sanitizeOptionalText(b.audience) : existing.audience,
      b.metric !== undefined ? sanitizeOptionalText(b.metric) : existing.metric,
      b.duration !== undefined ? sanitizeOptionalText(b.duration) : existing.duration,
      b.status !== undefined ? sanitizeOptionalText(b.status, 'Planned') : existing.status,
      b.notes !== undefined ? sanitizeMultilineText(b.notes) : existing.notes,
      id,
    )
    .run();
  return ok({ ok: true });
};

export const onRequestDelete = async ({ request, env }: ApiContext) => {
  const auth = await authorizeRequest(request, env);
  if (!auth.ok) return ok({ error: auth.error }, auth.status);
  const url = new URL(request.url);
  const id = url.searchParams.get('id');
  if (!id) return ok({ error: 'Missing id' }, 400);
  await env.DB.prepare('DELETE FROM testing_frameworks WHERE id=?').bind(id).run();
  return ok({ ok: true });
};
