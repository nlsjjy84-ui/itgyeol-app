// 유물 하나 → 오늘의 물건 아이디어. 「원래 쓰임 → 오늘의 쓰임」과 「무늬의 뜻 → 누구에게」를 이어 설명한다.
import { MEANING, MOTIF } from '../data/pieceMeaning';
import { TYPE_CRAFT, NO_CRAFT, MOTIF_GIFT, PHOTO_CRAFT } from '../data/crafts';

export function craftIdeas(k) {
  const m = MEANING[k] || {};
  const w = m.w || [];
  const typeId = w.find((id) => id.startsWith('t_') && (TYPE_CRAFT[id] || NO_CRAFT[id])) || w.find((id) => id.startsWith('x_') && TYPE_CRAFT[id]) || w.find((id) => id.startsWith('t_'));
  if (typeId && NO_CRAFT[typeId]) return { none: NO_CRAFT[typeId], type: MOTIF[typeId] };
  // 무늬 뜻 → 선물(처음 맞는 것 하나, 같은 뜻 묶음은 한 번만)
  const gifts = [];
  const seen = new Set();
  for (const id of w) {
    const g = MOTIF_GIFT[id];
    if (g && !seen.has(g.who)) {
      seen.add(g.who);
      gifts.push({ motif: MOTIF[id], ...g });
    }
  }
  const base = (typeId && TYPE_CRAFT[typeId]) || [];
  const list = (base.length ? base : PHOTO_CRAFT).map((c, i) => ({ ...c, gift: gifts[i % Math.max(1, gifts.length)] || null }));
  return { type: typeId ? MOTIF[typeId] : null, crafts: list, gifts, photoOnly: !base.length };
}

// 전체 통계(테스트·랜딩 숫자용)
export function craftStats(keys) {
  let made = 0;
  let none = 0;
  let photo = 0;
  for (const k of keys) {
    const r = craftIdeas(k);
    if (r.none) none += 1;
    else if (r.photoOnly) photo += 1;
    else made += 1;
  }
  return { made, none, photo };
}
