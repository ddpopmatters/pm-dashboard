import { authorizeRequest } from './_auth';
import { jsonResponse as ok, uuid, nowIso, str, parseJson } from '../lib/response';
import {
  sanitizeText,
  sanitizeMultilineText,
  sanitizeOptionalText,
  sanitizeLinks,
} from '../lib/sanitize';

const inflate = (row: any) =>
  row && {
    ...row,
    links: parseJson(row.links) ?? [],
    attachments: parseJson(row.attachments) ?? [],
  };

export const onRequestGet = async ({ request, env }: { request: Request; env: any }) => {
  const auth = await authorizeRequest(request, env);
  if (!auth.ok) return ok({ error: auth.error }, auth.status);
  const url = new URL(request.url);
  const id = url.searchParams.get('id');
  const month = url.searchParams.get('month'); // YYYY-MM on targetDate
  if (id) {
    const row = await env.DB.prepare('SELECT * FROM linkedin_submissions WHERE id=?')
      .bind(id)
      .first();
    return ok(inflate(row) || null);
  }
  let stmt = 'SELECT * FROM linkedin_submissions';
  const binds: any[] = [];
  const conds: string[] = [];
  if (month) {
    conds.push('substr(targetDate,1,7)=?');
    binds.push(month);
  }
  if (conds.length) stmt += ' WHERE ' + conds.join(' AND ');
  stmt += ' ORDER BY createdAt DESC';
  const { results } = await env.DB.prepare(stmt)
    .bind(...binds)
    .all();
  return ok((results || []).map(inflate));
};

export const onRequestPost = async ({ request, env }: { request: Request; env: any }) => {
  const auth = await authorizeRequest(request, env);
  if (!auth.ok) return ok({ error: auth.error }, auth.status);
  const b = await request.json().catch(() => null);
  if (!b || typeof b.title !== 'string') return ok({ error: 'Invalid JSON' }, 400);
  const id = b.id || uuid();
  const createdAt = nowIso();
  await env.DB.prepare(
    `INSERT INTO linkedin_submissions (id,submissionType,status,title,postCopy,comments,owner,submitter,links,attachments,targetDate,createdAt,updatedAt) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
  )
    .bind(
      id,
      sanitizeOptionalText(b.submissionType, 'My own account'),
      sanitizeOptionalText(b.status, 'Draft'),
      sanitizeText(b.title),
      sanitizeMultilineText(b.postCopy),
      sanitizeMultilineText(b.comments),
      sanitizeOptionalText(b.owner),
      sanitizeOptionalText(b.submitter),
      str(sanitizeLinks(b.links)),
      str(b.attachments),
      b.targetDate || '',
      createdAt,
      createdAt,
    )
    .run();
  return ok({ id });
};

export const onRequestPut = async ({ request, env }: { request: Request; env: any }) => {
  const auth = await authorizeRequest(request, env);
  if (!auth.ok) return ok({ error: auth.error }, auth.status);
  const url = new URL(request.url);
  const id = url.searchParams.get('id');
  if (!id) return ok({ error: 'Missing id' }, 400);
  const b = await request.json().catch(() => null);
  if (!b) return ok({ error: 'Invalid JSON' }, 400);
  const existing = await env.DB.prepare('SELECT * FROM linkedin_submissions WHERE id=?')
    .bind(id)
    .first();
  if (!existing) return ok({ error: 'Not found' }, 404);
  const updatedAt = nowIso();
  await env.DB.prepare(
    `UPDATE linkedin_submissions SET submissionType=?, status=?, title=?, postCopy=?, comments=?, owner=?, submitter=?, links=?, attachments=?, targetDate=?, updatedAt=? WHERE id=?`,
  )
    .bind(
      b.submissionType !== undefined
        ? sanitizeOptionalText(b.submissionType, 'My own account')
        : existing.submissionType,
      b.status !== undefined ? sanitizeOptionalText(b.status, 'Draft') : existing.status,
      b.title !== undefined ? sanitizeText(b.title) : existing.title,
      b.postCopy !== undefined ? sanitizeMultilineText(b.postCopy) : existing.postCopy,
      b.comments !== undefined ? sanitizeMultilineText(b.comments) : existing.comments,
      b.owner !== undefined ? sanitizeOptionalText(b.owner) : existing.owner,
      b.submitter !== undefined ? sanitizeOptionalText(b.submitter) : existing.submitter,
      b.links !== undefined ? str(sanitizeLinks(b.links)) : existing.links,
      str(b.attachments ?? parseJson(existing.attachments)),
      b.targetDate ?? existing.targetDate,
      updatedAt,
      id,
    )
    .run();
  return ok({ ok: true });
};

export const onRequestDelete = async ({ request, env }: { request: Request; env: any }) => {
  const auth = await authorizeRequest(request, env);
  if (!auth.ok) return ok({ error: auth.error }, auth.status);
  const url = new URL(request.url);
  const id = url.searchParams.get('id');
  if (!id) return ok({ error: 'Missing id' }, 400);
  await env.DB.prepare('DELETE FROM linkedin_submissions WHERE id=?').bind(id).run();
  return ok({ ok: true });
};
