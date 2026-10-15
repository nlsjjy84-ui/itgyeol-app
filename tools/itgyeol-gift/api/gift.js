import { put } from '@vercel/blob';
import { cors, MAX_BYTES, PREFIX, newId, removeOld } from './_lib.js';

// POST /gift (image/jpeg, 3MB 이하) → { url } : 폰이 QR로 여는 사진 주소
export async function handlePost(request, api = { put, removeOld }) {
  if (request.headers.get('content-type') !== 'image/jpeg') return new Response('jpeg only', { status: 415, headers: cors });
  const body = await request.arrayBuffer();
  if (body.byteLength === 0 || body.byteLength > MAX_BYTES) return new Response('size', { status: 413, headers: cors });
  const blob = await api.put(`${PREFIX}${newId()}.jpg`, body, {
    access: 'public',
    contentType: 'image/jpeg',
    addRandomSuffix: false,
    cacheControlMaxAge: 60,
  });
  try {
    await api.removeOld();
  } catch (e) {
    // 지우기가 실패해도 사진 받기는 계속된다(매일 한 번 다시 지움)
  }
  return Response.json({ url: blob.url }, { headers: cors });
}

export function OPTIONS() {
  return new Response(null, { status: 204, headers: cors });
}

export function POST(request) {
  return handlePost(request);
}
