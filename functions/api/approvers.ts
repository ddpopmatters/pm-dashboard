import { authorizeRequest } from './_auth';
import { jsonResponse } from '../lib/response';
import type { ApiContext, Approver } from '../types';

const ok = jsonResponse;

interface ApproverRow {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
}

const mapRow = (row: ApproverRow): Approver => ({
  id: row.id,
  name: row.name,
  email: row.email,
  avatarUrl: row.avatarUrl || null,
});

export const onRequestGet = async ({ request, env }: ApiContext) => {
  const auth = await authorizeRequest(request, env);
  if (!auth.ok) return ok({ error: auth.error }, auth.status);
  const { results } = await env.DB.prepare(
    'SELECT id,name,email,avatarUrl FROM users WHERE isApprover=1 AND status != "disabled" ORDER BY name COLLATE NOCASE',
  ).all<ApproverRow>();
  return ok((results || []).map(mapRow));
};
