import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { OHANG, pickTodayOhang } from '../data/formations';
import { computeProgress } from '../utils/progress';

export const JourneyContext = createContext(null);
const STORAGE_KEY = 'itgyeol_journey_v1';
const SKILL_KEY = 'itgyeol_skill_v1';
const SOLVED_KEY = 'itgyeol_solved_v1';
// [오늘의 기운 선택 기능] 전에는 화면마다 useRef(pickTodayOhang())로 각자 따로 뽑아서
// 같은 "오늘의 기운"인데 화면마다 색이 달라 보였다 — 이제 앱 전체가 공유하는 값 하나를
// 여기서 들고, 사용자가 직접 골라 바꿀 수도 있게 한다(안 고르면 기기별로 하루치 랜덤값).
const OHANG_KEY = 'itgyeol_ohang_v1';
// 놀이별 숙련도 점수의 범위 — -3(많이 헤맴) ~ +3(많이 능숙함). 7단계면 체감 차이를
// 주기에 충분하고, 한두 판 실수했다고 극단으로 튀지 않을 만큼 좁다.
const SKILL_MIN = -3;
const SKILL_MAX = 3;

function safeGetItem(key, timeoutMs = 1200) {
  return Promise.race([
    AsyncStorage.getItem(key).catch(() => null),
    new Promise((resolve) => setTimeout(() => resolve(null), timeoutMs)),
  ]);
}

// 세 판(진법 / 훈민정음·인쇄 / 세번째 보물)을 거치며 쌓이는 "창작 결과물"을
// 앱 전체에서 공유하기 위한 저장소. 각 판을 완성할 때마다 결과(attempt)를
// 하나씩 추가하면, 결과 화면에서는 쌓인 결과들을 레이어로 겹쳐 보여준다.
export function JourneyProvider({ children }) {
  const [attempts, setAttempts] = useState([]);
  const [loaded, setLoaded] = useState(false);
  // [지능형 난이도] 놀이(game.id)별 숙련도 점수 — 성공할 때마다 조금씩 오르고
  // 실패할 때마다 조금씩 내려간다. 라운드 안에서만 어려워지는 기존의 고정 난이도
  // 곡선과 달리, 이 점수는 기기에 저장돼 "이 사람이 이 놀이를 평소 잘하는지"를
  // 세션을 넘어 기억한다 — 다음에 같은 놀이를 열면 그 기억을 반영한 시작 난이도로
  // 열린다. 숫자 하나뿐이라 과하지 않게, 그러나 실제로 사람마다 달라지게 설계했다.
  const [skills, setSkills] = useState({});
  // 판마다 "서로 다른 문제를 몇 가지 풀었는지" — 많이 풀수록 결과물의 완성도가 올라간다.
  const [solvedIds, setSolvedIds] = useState({});
  // [오늘의 기운 선택 기능] 처음엔 null — 기기에 저장된 값을 읽어오기 전까지는 아직
  // 모른다는 뜻. 읽어온 뒤(또는 저장된 게 없으면 그날의 랜덤값으로) 채워진다.
  const [ohangKey, setOhangKeyState] = useState(null);

  useEffect(() => {
    let mounted = true;
    safeGetItem(STORAGE_KEY).then((raw) => {
      if (!mounted) return;
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) setAttempts(parsed);
        } catch (e) {
          // 저장된 값이 깨져있으면 무시하고 새로 시작
        }
      }
      setLoaded(true);
    });
    safeGetItem(SKILL_KEY).then((raw) => {
      if (!mounted || !raw) return;
      try {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') setSkills(parsed);
      } catch (e) {
        // 손상된 값은 무시
      }
    });
    safeGetItem(SOLVED_KEY).then((raw) => {
      if (!mounted || !raw) return;
      try {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') setSolvedIds(parsed);
      } catch (e) {
        // 손상된 값은 무시
      }
    });
    safeGetItem(OHANG_KEY).then((raw) => {
      if (!mounted) return;
      const valid = raw && OHANG.some((o) => o.key === raw);
      const key = valid ? raw : pickTodayOhang().key;
      setOhangKeyState(key);
      if (!valid) AsyncStorage.setItem(OHANG_KEY, key).catch(() => {});
    });
    return () => {
      mounted = false;
    };
  }, []);

  // [오늘의 기운 선택 기능] 사용자가 직접 고르면 앱 전체(홈·진법·훈민정음·전래놀이)에
  // 똑같이 반영되고, 다음에 다시 열어도 그 선택이 유지된다.
  const setOhangKey = useCallback((key) => {
    setOhangKeyState(key);
    AsyncStorage.setItem(OHANG_KEY, key).catch(() => {});
  }, []);

  // 한 판이 끝날 때마다 호출 — 성공하면 +1, 실패하면 -1, 범위를 벗어나지 않게 자른다.
  const recordSkill = useCallback((gameId, success) => {
    setSkills((prev) => {
      const cur = prev[gameId] || 0;
      const next = Math.max(SKILL_MIN, Math.min(SKILL_MAX, cur + (success ? 1 : -1)));
      const nextMap = { ...prev, [gameId]: next };
      AsyncStorage.setItem(SKILL_KEY, JSON.stringify(nextMap)).catch(() => {});
      return nextMap;
    });
  }, []);

  const addResult = useCallback((attempt) => {
    setSolvedIds((prev) => {
      const list = prev[attempt.sceneId] || [];
      if (list.includes(attempt.formationId)) return prev;
      const next = { ...prev, [attempt.sceneId]: [...list, attempt.formationId] };
      AsyncStorage.setItem(SOLVED_KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
    setAttempts((prev) => {
      // 같은 판(sceneId)의 결과는 가장 최근 것으로 교체, 다른 판 결과는 유지
      const next = [...prev.filter((a) => a.sceneId !== attempt.sceneId), attempt];
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  const resetJourney = useCallback(() => {
    setAttempts([]);
    AsyncStorage.removeItem(STORAGE_KEY).catch(() => {});
  }, []);

  return (
    <JourneyContext.Provider
      value={{ attempts, addResult, resetJourney, loaded, skills, recordSkill, ohangKey, setOhangKey, solvedIds, progress: computeProgress(solvedIds) }}
    >
      {children}
    </JourneyContext.Provider>
  );
}

export function useJourney() {
  const ctx = useContext(JourneyContext);
  if (!ctx) throw new Error('useJourney는 JourneyProvider 안에서만 사용할 수 있어요');
  return ctx;
}
