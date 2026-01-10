import { authorizeRequest } from './_auth';
import { jsonResponse } from '../lib/response';

const ok = jsonResponse;

const mapRow = (row: any) => ({
  id: row.id,
  name: row.name,
  email: row.email,
  avatarUrl: row.avatarUrl || null,
});

export const onRequestGet = async ({ request, env }: { request: Request; env: any }) => {
  const auth = await authorizeRequest(request, env);
  if (!auth.ok) return ok({ error: auth.error }, auth.status);
  const { results } = await env.DB.prepare(
    'SELECT id,name,email,avatarUrl FROM users WHERE isApprover=1 AND status != "disabled" ORDER BY name COLLATE NOCASE',
  ).all();
  return ok((results || []).map(mapRow));
};
