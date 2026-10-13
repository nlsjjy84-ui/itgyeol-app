// 전시 신청 목록 갱신 — [{code, attempts, nick, country, at}]
// entry가 있으면 올리거나(같은 코드면 고치기), null이면 내린다. 이름은 받지 않고 별명(10자)·나라만.
export function nextExhibit(prev, code, entry, now = Date.now()) {
  const list = Array.isArray(prev) ? prev : [];
  const rest = list.filter((e) => e.code !== code);
  if (!entry) return rest;
  const old = list.find((e) => e.code === code);
  const merged = { ...(old || {}), ...entry, code, at: (old && old.at) || now };
  if (typeof merged.nick === 'string') merged.nick = merged.nick.slice(0, 10);
  return [...rest, merged];
}

// 저장소에서 읽은 값 정리 — 깨진 항목은 버린다(예전 형식의 코드 문자열도 버림)
export function cleanExhibit(raw) {
  return Array.isArray(raw) ? raw.filter((e) => e && typeof e.code === 'string') : [];
}
