// 판을 깬 자리에서 곧바로 보따리를 푼다 (2026-11-23 — 예전에는 「결과물 보기」 → 조각보 화면 → 보따리로 두 번 거쳤다)
import { useJourney } from '../context/JourneyContext';
import { HALL_BY_ID, HALL_ODDS, hallLevel, clearsOf } from '../data/halls';

export function useOpenBundle(sceneId, navigation) {
  const { attempts, playLog } = useJourney();
  return () => {
    const hall = HALL_BY_ID[sceneId];
    const last = attempts.find((a) => a.sceneId === sceneId) || {};
    const lv = Math.max(1, hallLevel(clearsOf(playLog, attempts, sceneId) || 1));
    navigation.navigate('Pack', {
      scene: hall ? hall.scene : '',
      claim: `${sceneId}:${attempts.length}:${last.createdAt || last.seed || ''}`,
      n: HALL_ODDS[lv].n,
      lv,
    });
  };
}
