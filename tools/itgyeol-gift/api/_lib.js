// 잇결 깜짝 선물 사진 임시 저장소 — Vercel Functions + Vercel Blob (이미 있는 Vercel 계정으로, 새 가입 없이).
// 사진은 짐작할 수 없는 긴 번호의 주소로만 열리고, 하루(24시간)가 지나면 지운다.
import { list, del } from '@vercel/blob';

export const ORIGIN = 'https://nlsjjy84-ui.github.io';
export const DAY_MS = 24 * 60 * 60 * 1000;
export const MAX_BYTES = 3 * 1024 * 1024;
export const PREFIX = 'gifts/';
export const cors = {
  'access-control-allow-origin': ORIGIN,
  'access-control-allow-methods': 'GET, POST, PATCH, OPTIONS',
  'access-control-allow-headers': 'content-type',
};

export function newId(rand = crypto.getRandomValues.bind(crypto)) {
  return [...rand(new Uint8Array(18))].map((b) => b.toString(16).padStart(2, '0')).join('');
}

// 오래된 것 지우기 — 사진은 하루, 주문·전시 기록은 7일이 지나면 지운다.
// 새 사진이 올라올 때마다, 그리고 매일 한 번(cron) 돈다.
export const KEEP = [
  { prefix: PREFIX, ms: DAY_MS },
  { prefix: 'orders/', ms: 7 * DAY_MS },
  { prefix: 'exhibit/', ms: 7 * DAY_MS },
];
export async function removeOld(now = Date.now(), api = { list, del }) {
  let removed = 0;
  for (const k of KEEP) removed += await removeOldIn(k.prefix, k.ms, now, api);
  return removed;
}
async function removeOldIn(prefix, keepMs, now, api) {
  let cursor;
  let removed = 0;
  do {
    const page = await api.list({ prefix, cursor, limit: 1000 });
    const old = page.blobs.filter((b) => now - new Date(b.uploadedAt).getTime() > keepMs).map((b) => b.url);
    if (old.length) {
      await api.del(old);
      removed += old.length;
    }
    cursor = page.hasMore ? page.cursor : undefined;
  } while (cursor);
  return removed;
}
