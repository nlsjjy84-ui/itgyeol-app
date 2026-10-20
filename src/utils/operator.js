// 운영사 설정(src/config/operator.js)을 화면에서 쓰기 좋게 — 잘못된 값은 걸러 내고, 남는 게 없으면 전부.
import { OPERATOR } from '../config/operator';

export function allowedGroups(groups, op = OPERATOR) {
  if (!op || op.materials === 'all' || !Array.isArray(op.materials)) return groups;
  const ok = new Set(op.materials);
  const out = groups.map((g) => ({ ...g, items: g.items.filter((m) => ok.has(m.id)) })).filter((g) => g.items.length);
  return out.length ? out : groups;
}
export function allowedSuggest(sug, byId, op = OPERATOR) {
  const pick = op && op.suggest && op.suggest.base ? op.suggest : sug;
  const ok = (id) => !!id && !!byId[id] && (!op || op.materials === 'all' || !Array.isArray(op.materials) || op.materials.includes(id));
  return { base: ok(pick && pick.base) ? pick.base : null, accent: ok(pick && pick.accent) ? pick.accent : null };
}
export function visibleWorks(list, op = OPERATOR) {
  if (!op || op.exampleGroups === 'all' || !Array.isArray(op.exampleGroups)) return list;
  const ok = new Set(op.exampleGroups);
  const out = list.filter((w) => ok.has(w.group));
  return out.length ? out : list;
}
export const allowResin = () => !(OPERATOR && OPERATOR.allowResin === false);
