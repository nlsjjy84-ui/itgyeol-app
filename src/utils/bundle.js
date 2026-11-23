// 판을 깬 자리에서 곧바로 보따리를 푼다 (2026-11-23 — 예전에는 「결과물 보기」 → 조각보 화면 → 보따리로 두 번 거쳤다)
import { useJourney } from '../context/JourneyContext';
import { HALL_BY_ID, HALL_ODDS, hallLevel, clearsOf } from '../data/halls';

// 그 판 보따리의 「받음」 표시 — 같은 놀이 기록으로 두 번 받지 않게
export function bundleClaim(attempts, sceneId) {
  const last = (attempts || []).find((a) => a.sceneId === sceneId) || {};
  return `${sceneId}:${(attempts || []).length}:${last.createdAt || last.seed || ''}`;
}

export function bundleParams(sceneId, attempts, playLog) {
  const hall = HALL_BY_ID[sceneId];
  const lv = Math.max(1, hallLevel(clearsOf(playLog, attempts, sceneId) || 1));
  return { scene: hall ? hall.scene : '', claim: bundleClaim(attempts, sceneId), n: HALL_ODDS[lv].n, lv };
}

export function useOpenBundle(sceneId, navigation) {
  const { attempts, playLog } = useJourney();
  return () => navigation.navigate('Pack', bundleParams(sceneId, attempts, playLog));
}
