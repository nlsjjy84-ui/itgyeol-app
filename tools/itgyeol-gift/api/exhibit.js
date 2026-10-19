import { cors } from './_lib.js';
import { readAll, writeOne, safeKey } from './_records.js';

// 전시 — 손님이 신청하면 박물관 큰 화면(다른 기기)의 담당자 칸에 뜨고, 담당자가 걸면 손님 화면이 "전시 중"으로 바뀐다.
// GET → { entries }   POST { code, entry | null }  (null이면 내리기)
// 이름은 받지 않고 별명(10자)·나라·놀이 기록만 둔다. 7일 지나면 지운다.
const P = 'exhibit/';
const json = (body, status = 200) => Response.json(body, { status, headers: cors });

export function cleanEntry(code, e, now = Date.now()) {
  if (!e || typeof e !== 'object') return null;
  return {
    code,
    nick: typeof e.nick === 'string' ? e.nick.slice(0, 10) : '',
    country: typeof e.country === 'string' ? e.country.slice(0, 20) : '',
    status: e.status === 'showing' ? 'showing' : 'waiting',
    attempts: Array.isArray(e.attempts) ? e.attempts.slice(0, 12) : [],
    at: typeof e.at === 'number' ? e.at : now,
  };
}

export async function handle(request, deps = {}) {
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
  if (request.method === 'GET') {
    const rows = await readAll(P, deps.db);
    rows.sort((a, b) => (a.at || 0) - (b.at || 0));
    return json({ entries: rows });
  }
  if (request.method !== 'POST') return json({ error: 'METHOD' }, 405);
  let body;
  try {
    body = await request.json();
  } catch (e) {
    return json({ error: 'BAD_JSON' }, 400);
  }
  const code = body && body.code;
  if (!safeKey(code)) return json({ error: 'BAD_CODE' }, 400);
  const entry = body.entry === null ? null : cleanEntry(code, body.entry);
  try {
    await writeOne(P, code, entry, deps.db);
  } catch (e) {
    return json({ error: 'TOO_BIG' }, 413);
  }
  return json({ entry });
}

export const OPTIONS = (req) => handle(req);
export const GET = (req) => handle(req);
export const POST = (req) => handle(req);
