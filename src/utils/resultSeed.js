// 완성 결과를 "매번 다른, 그러나 재현 가능한" 하나의 시드로 바꾸는 유틸.
// 번호(사람)-자리 매칭 조합 + 오늘의 기운(오행) + 완성 속도를 합쳐서
// 고유한 숫자 시드를 만들고, 그 시드로 문양의 모양 파라미터를 뽑아낸다.

function hashString(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function speedBucket(ms) {
  const sec = ms / 1000;
  if (sec < 12) return 'fast';
  if (sec < 28) return 'mid';
  return 'slow';
}

// mapping: { [slotIndex]: dotId } 형태 - 어느 자리에 몇 번이 들어갔는지
export function buildMappingCode(mapping, slotCount) {
  const arr = [];
  for (let i = 0; i < slotCount; i++) {
    arr.push(mapping[i] !== undefined ? mapping[i] : -1);
  }
  return arr.join('-');
}

export function buildAttemptResult({ sceneId, formationId, mapping, slotCount, ohangKey, elapsedMs }) {
  const mappingCode = buildMappingCode(mapping, slotCount);
  const speed = speedBucket(elapsedMs);
  const seedStr = `${sceneId}|${formationId}|${mappingCode}|${ohangKey}|${speed}`;
  const seed = hashString(seedStr);
  return {
    sceneId,
    formationId,
    mappingCode,
    ohangKey,
    speed,
    seed,
    seedStr,
    createdAt: Date.now(),
  };
}

// 시드 숫자 → 문양을 그리기 위한 모양 파라미터
export function derivePatternParams(seed) {
  const petals = 5 + (seed % 7); // 5~11개 꽃잎
  const rotation = seed % 360; // 0~359도
  const innerRatio = 0.3 + ((seed >> 8) % 100) / 100 * 0.45; // 0.3~0.75
  const twist = (seed >> 16) % 2 === 0 ? 1 : -1; // 회전 방향
  const petalWidth = 0.18 + ((seed >> 20) % 100) / 100 * 0.22; // 0.18~0.4
  return { petals, rotation, innerRatio, twist, petalWidth };
}

// 사람이 읽을 수 있는 짧은 결과 코드 (QR/공유용)
export function shortResultCode(result) {
  return `ITGYEOL-${result.sceneId}-${result.seed.toString(36).toUpperCase()}`;
}

// 여러 판의 결과를 "순서대로" 하나로 묶어 합성 시드를 만든다.
// 묶는 판이 늘어날수록(1개 → 2개 → 3개) 완전히 다른 시드가 나오도록 해서,
// 혼자 가져가는 결과물과 연결해서 가져가는 결과물이 서로 달라지게 한다.
export function combineSeed(attempts) {
  let h = 2166136261;
  attempts.forEach((a) => {
    const str = `${a.sceneId}:${a.seed}`;
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
  });
  return h >>> 0;
}

export function resultOptionCode(attempts) {
  const seed = combineSeed(attempts);
  const tag = attempts.map((a) => a.sceneId[0]).join('').toUpperCase();
  return `ITGYEOL-${tag}-${seed.toString(36).toUpperCase()}`;
}
