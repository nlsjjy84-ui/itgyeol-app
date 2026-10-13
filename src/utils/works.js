// 예시 작품 세기 — 물건별 개수와 "똑같은 작품"(같은 물건·모양·코드) 개수
export function countWorks(works) {
  const byGroup = {};
  const keys = new Set();
  (works || []).forEach((w) => {
    byGroup[w.group] = (byGroup[w.group] || 0) + 1;
    keys.add(`${w.item}|${w.variant}|${w.code}`);
  });
  const total = (works || []).length;
  return { total, same: total - keys.size, byGroup };
}
