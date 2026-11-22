// 오늘의 합체 미션 — 날마다 틀 하나와 조건 하나(재료 또는 시대)가 정해진다. 레고·스포어의 "도전 과제"처럼
// 제약이 있으면 아이가 조각을 더 꼼꼼히 고른다. 조건을 채운 합체 영상을 만들면 귀한 조각을 받는다(하루 한 번).
import { FRAMES } from '../data/frames';
import { PIECE_BY_K } from '../data/pieces';

const POW = ['흙', '쇠', '돌', '옥', '금', '나무'];
const ERA = ['신라', '고려', '조선', '백제', '가야', '통일신라', '삼국'];
export const dayKey = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export function todayMission(d = new Date()) {
  const n = d.getFullYear() * 372 + d.getMonth() * 31 + d.getDate();
  const frames = FRAMES.filter((f) => f.slots && f.slots.length >= 5);
  const frame = frames[(n * 7) % frames.length];
  const byEra = n % 2 === 1;
  const value = byEra ? ERA[(n * 3) % ERA.length] : POW[(n * 5) % POW.length];
  // 흔한 조건은 4자리, 중간은 3자리, 드문 조건(가야·백제·옥·금·나무)은 2자리 — 조각이 적은 아이도 해낼 수 있게
  const common = ['조선', '고려', '흙', '쇠'];
  const mid = ['신라', '통일신라', '삼국', '돌'];
  const need = Math.min(common.includes(value) ? 4 : mid.includes(value) ? 3 : 2, frame.slots.length - 1);
  return { day: dayKey(d), frameId: frame.id, frameName: frame.name, type: byEra ? 'era' : 'power', value, need };
}
export const matches = (m, p) => !!p && (m.type === 'era' ? p.era === m.value : p.power === m.value);
// 조건에 맞는 자리 수(같은 조각을 두 자리에 쓰면 두 자리로 센다)
export function countMatch(m, frameId, assign) {
  if (frameId !== m.frameId) return 0;
  return Object.values(assign || {}).filter((k) => matches(m, PIECE_BY_K[k])).length;
}
