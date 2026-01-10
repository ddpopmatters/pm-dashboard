import { authorizeRequest } from './_auth';
import { jsonResponse as ok, uuid, nowIso, str, parseJson } from '../lib/response';
import { sanitizeMultilineText, sanitizeOptionalText } from '../lib/sanitize';
import { createRequestLogger } from '../lib/logger';
import type { Env, EntryRow, ApiContext, SqlBindValue } from '../types';

const sanitizePlatformCaptions = (captions: unknown): Record<string, string> => {
  if (!captions || typeof captions !== 'object') return {};
  const result: Record<string, string> = {};
  for (const [platform, caption] of Object.entries(captions as Record<string, unknown>)) {
    if (typeof caption === 'string') {
      result[platform] = sanitizeMultilineText(caption);
    }
  }
  return result;
};

const inflate = (row: EntryRow | null) => {
  if (!row) return row;
  return {
    ...row,
    platforms: parseJson(row.platforms) ?? [],
    platformCaptions: parseJson(row.platformCaptions) ?? {},
    approvers: parseJson(row.approvers) ?? [],
    checklist: parseJson(row.checklist) ?? {},
    analytics: parseJson(row.analytics) ?? {},
    aiFlags: parseJson(row.aiFlags) ?? [],
    aiScore: parseJson(row.aiScore) ?? {},
  };
};

async function logAudit(
  env: Env,
  user: string,
  entryId: string,
  action: string,
  meta: Record<string, unknown> = {},
) {
  const id = uuid();
  const ts = nowIso();
  await env.DB.prepare('INSERT INTO audit (id,ts,user,entryId,action,meta) VALUES (?,?,?,?,?,?)')
    .bind(id, ts, user || 'Unknown', entryId || '', action || '', JSON.stringify(meta))
    .run();
}

export const onRequestGet = async ({ request, env }: ApiContext) => {
  const auth = await authorizeRequest(request, env);
  if (!auth.ok) return ok({ error: auth.error }, auth.status);
  const url = new URL(request.url);
  const id = url.searchParams.get('id');
  const month = url.searchParams.get('month'); // YYYY-MM
  const includeDeleted = url.searchParams.get('includeDeleted') === '1';

  if (id) {
    const row = await env.DB.prepare('SELECT * FROM entries WHERE id=?').bind(id).first<EntryRow>();
    return ok(inflate(row) || null);
  }

  let stmt = 'SELECT * FROM entries';
  const binds: SqlBindValue[] = [];
  const conds: string[] = [];
  if (month) {
    conds.push('substr(date,1,7)=?');
    binds.push(month);
  }
  if (!includeDeleted) {
    conds.push('(deletedAt IS NULL OR deletedAt="")');
  }
  if (conds.length) stmt += ' WHERE ' + conds.join(' AND ');
  stmt += ' ORDER BY date ASC';

  const { results } = await env.DB.prepare(stmt)
    .bind(...binds)
    .all<EntryRow>();
  return ok((results || []).map(inflate));
};

export const onRequestPost = async ({ request, env }: ApiContext) => {
  let log = createRequestLogger(request, { operation: 'entry_create' });
  const auth = await authorizeRequest(request, env);
  if (!auth.ok) {
    log.warn('Entry create failed: Authorization failed', { error: auth.error });
    return ok({ error: auth.error }, auth.status);
  }
  log = log.child({ userId: auth.user.id });

  const b = await request.json().catch(() => null);
  if (!b || typeof b.date !== 'string') {
    log.warn('Entry create failed: Invalid JSON body');
    return ok({ error: 'Invalid JSON' }, 400);
  }
  const entryId = b.id || uuid();
  const createdAt = nowIso();
  const updatedAt = createdAt;
  const authorName =
    typeof b.author === 'string' && b.author.trim()
      ? b.author.trim()
      : typeof b.user === 'string' && b.user.trim()
        ? b.user.trim()
        : 'Unknown';
  try {
    await env.DB.prepare(
      `INSERT INTO entries (id,date,platforms,assetType,caption,platformCaptions,firstComment,status,approvers,author,campaign,contentPillar,previewUrl,checklist,analytics,workflowStatus,statusDetail,aiFlags,aiScore,testingFrameworkId,testingFrameworkName,createdAt,updatedAt) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    )
      .bind(
        entryId,
        b.date,
        str(b.platforms),
        sanitizeOptionalText(b.assetType, 'Design'),
        sanitizeMultilineText(b.caption),
        str(sanitizePlatformCaptions(b.platformCaptions)),
        sanitizeMultilineText(b.firstComment),
        sanitizeOptionalText(b.status, 'Pending'),
        str(b.approvers),
        authorName,
        sanitizeOptionalText(b.campaign),
        sanitizeOptionalText(b.contentPillar),
        b.previewUrl || '',
        str(b.checklist),
        str(b.analytics),
        sanitizeOptionalText(b.workflowStatus, 'Draft'),
        sanitizeOptionalText(b.statusDetail),
        str(b.aiFlags),
        str(b.aiScore),
        b.testingFrameworkId || '',
        sanitizeOptionalText(b.testingFrameworkName),
        createdAt,
        updatedAt,
      )
      .run();
    const actorName = b.user || auth.user.name || auth.user.email;
    await logAudit(env, actorName, entryId, 'create', { date: b.date });
    log.info('Entry created successfully', { entryId, date: b.date });
    return ok({ id: entryId });
  } catch (err) {
    log.error('Entry create failed: Database error', err instanceof Error ? err : null, {
      entryId,
    });
    throw err;
  }
};

export const onRequestPut = async ({ request, env }: ApiContext) => {
  let log = createRequestLogger(request, { operation: 'entry_update' });
  const auth = await authorizeRequest(request, env);
  if (!auth.ok) {
    log.warn('Entry update failed: Authorization failed', { error: auth.error });
    return ok({ error: auth.error }, auth.status);
  }
  log = log.child({ userId: auth.user.id });

  const url = new URL(request.url);
  const id = url.searchParams.get('id');
  if (!id) {
    log.warn('Entry update failed: Missing id');
    return ok({ error: 'Missing id' }, 400);
  }
  log = log.child({ entryId: id });

  const b = await request.json().catch(() => null);
  if (!b) {
    log.warn('Entry update failed: Invalid JSON body');
    return ok({ error: 'Invalid JSON' }, 400);
  }

  const existing = await env.DB.prepare('SELECT * FROM entries WHERE id=?')
    .bind(id)
    .first<EntryRow>();
  if (!existing) {
    log.warn('Entry update failed: Entry not found');
    return ok({ error: 'Not found' }, 404);
  }
  const wasApproved = existing.status === 'Approved';

  const updatedAt = nowIso();
  let status = b.status ?? existing.status ?? 'Pending';
  let approvedAt = b.approvedAt ?? existing.approvedAt ?? null;

  const hasField = (field: string) => Object.prototype.hasOwnProperty.call(b, field);
  const contentChanged =
    (hasField('caption') && b.caption !== existing.caption) ||
    (hasField('platformCaptions') && str(b.platformCaptions) !== existing.platformCaptions) ||
    (hasField('firstComment') && b.firstComment !== existing.firstComment);

  if (wasApproved && contentChanged) {
    status = 'Pending';
    approvedAt = null;
  }

  try {
    await env.DB.prepare(
      `UPDATE entries SET date=?, platforms=?, assetType=?, caption=?, platformCaptions=?, firstComment=?, status=?, approvers=?, author=?, campaign=?, contentPillar=?, previewUrl=?, checklist=?, analytics=?, workflowStatus=?, statusDetail=?, aiFlags=?, aiScore=?, testingFrameworkId=?, testingFrameworkName=?, updatedAt=?, approvedAt=? WHERE id=?`,
    )
      .bind(
        b.date ?? existing.date,
        str(b.platforms ?? parseJson(existing.platforms)),
        hasField('assetType') ? sanitizeOptionalText(b.assetType, 'Design') : existing.assetType,
        hasField('caption') ? sanitizeMultilineText(b.caption) : existing.caption,
        hasField('platformCaptions')
          ? str(sanitizePlatformCaptions(b.platformCaptions))
          : existing.platformCaptions,
        hasField('firstComment') ? sanitizeMultilineText(b.firstComment) : existing.firstComment,
        status,
        str(b.approvers ?? parseJson(existing.approvers)),
        typeof b.author === 'string' && b.author.trim()
          ? sanitizeOptionalText(b.author, 'Unknown')
          : existing.author || 'Unknown',
        hasField('campaign') ? sanitizeOptionalText(b.campaign) : existing.campaign,
        hasField('contentPillar') ? sanitizeOptionalText(b.contentPillar) : existing.contentPillar,
        b.previewUrl ?? existing.previewUrl,
        str(b.checklist ?? parseJson(existing.checklist)),
        str(b.analytics ?? parseJson(existing.analytics)),
        hasField('workflowStatus')
          ? sanitizeOptionalText(b.workflowStatus, 'Draft')
          : existing.workflowStatus,
        hasField('statusDetail') ? sanitizeOptionalText(b.statusDetail) : existing.statusDetail,
        str(b.aiFlags ?? parseJson(existing.aiFlags)),
        str(b.aiScore ?? parseJson(existing.aiScore)),
        b.testingFrameworkId ?? existing.testingFrameworkId,
        hasField('testingFrameworkName')
          ? sanitizeOptionalText(b.testingFrameworkName)
          : existing.testingFrameworkName,
        updatedAt,
        approvedAt,
        id,
      )
      .run();

    const actorName = b.user || auth.user.name || auth.user.email;
    await logAudit(env, actorName, id, 'update', { contentChanged, status });
    log.info('Entry updated successfully', { contentChanged, status });
    return ok({ ok: true, status, approvedAt });
  } catch (err) {
    log.error('Entry update failed: Database error', err instanceof Error ? err : null);
    throw err;
  }
};

export const onRequestDelete = async ({ request, env }: ApiContext) => {
  let log = createRequestLogger(request, { operation: 'entry_delete' });
  const auth = await authorizeRequest(request, env);
  if (!auth.ok) {
    log.warn('Entry delete failed: Authorization failed', { error: auth.error });
    return ok({ error: auth.error }, auth.status);
  }
  log = log.child({ userId: auth.user.id });

  const url = new URL(request.url);
  const id = url.searchParams.get('id');
  if (!id) {
    log.warn('Entry delete failed: Missing id');
    return ok({ error: 'Missing id' }, 400);
  }
  log = log.child({ entryId: id });

  try {
    const ts = nowIso();
    await env.DB.prepare('UPDATE entries SET deletedAt=? WHERE id=?').bind(ts, id).run();
    const actorName = auth.user.name || auth.user.email;
    await logAudit(env, actorName, id, 'delete', {});
    log.info('Entry deleted successfully');
    return ok({ ok: true });
  } catch (err) {
    log.error('Entry delete failed: Database error', err instanceof Error ? err : null);
    throw err;
  }
};
