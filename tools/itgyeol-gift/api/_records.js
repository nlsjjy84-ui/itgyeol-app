// 주문·전시 기록 저장소 — Vercel Blob에 기록 하나를 JSON 파일 하나로 둔다.
// 고칠 때마다 짐작할 수 없는 새 주소로 다시 쓰고 예전 것은 지운다(CDN에 남은 옛 내용을 읽지 않게).
// 같은 기록이 잠깐 두 개 남으면 가장 최근에 올린 것을 쓴다.
import { put, list, del } from '@vercel/blob';

export const MAX_RECORD = 96 * 1024;
const blobApi = { put, list, del, get: (url) => fetch(url, { cache: 'no-store' }).then((r) => (r.ok ? r.json() : null)) };

// 파일 이름에 쓸 수 있는 글자만(주문 번호·작품 코드)
export const safeKey = (k) => typeof k === 'string' && /^[A-Za-z0-9_-]{3,64}$/.test(k);

async function listAll(prefix, api) {
  let cursor;
  let out = [];
  do {
    const page = await api.list({ prefix, cursor, limit: 1000 });
    out = out.concat(page.blobs);
    cursor = page.hasMore ? page.cursor : undefined;
  } while (cursor);
  return out;
}

// prefix/키--무작위.json 에서 키를 뽑는다
const keyOf = (prefix, pathname) => pathname.slice(prefix.length).split('--')[0];

/** 기록 전부 읽기: 키마다 가장 최근 것 하나 */
export async function readAll(prefix, api = blobApi) {
  const blobs = await listAll(prefix, api);
  const latest = new Map();
  for (const b of blobs) {
    const k = keyOf(prefix, b.pathname);
    const cur = latest.get(k);
    if (!cur || new Date(b.uploadedAt) > new Date(cur.uploadedAt)) latest.set(k, b);
  }
  const rows = await Promise.all([...latest.values()].map((b) => api.get(b.url).catch(() => null)));
  return rows.filter(Boolean);
}

/** 기록 하나 읽기 */
export async function readOne(prefix, key, api = blobApi) {
  const blobs = (await listAll(`${prefix}${key}--`, api)).sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));
  return blobs.length ? api.get(blobs[0].url) : null;
}

/** 기록 하나 쓰기(value가 null이면 지우기) — 예전 판은 지운다 */
export async function writeOne(prefix, key, value, api = blobApi) {
  const olds = (await listAll(`${prefix}${key}--`, api)).map((b) => b.url);
  if (value !== null) {
    const body = JSON.stringify(value);
    if (body.length > MAX_RECORD) throw new Error('TOO_BIG');
    await api.put(`${prefix}${key}--x.json`, body, { access: 'public', contentType: 'application/json', addRandomSuffix: true, cacheControlMaxAge: 60 });
  }
  if (olds.length) await api.del(olds);
  return value;
}
