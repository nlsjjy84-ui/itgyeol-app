import { removeOld } from './_lib.js';

// 매일 한 번(vercel.json crons) 하루 지난 사진을 지운다.
export async function GET() {
  const removed = await removeOld();
  return Response.json({ removed });
}
