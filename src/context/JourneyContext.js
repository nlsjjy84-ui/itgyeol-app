import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { mergeSenses } from '../utils/senseMath';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { OHANG, pickTodayOhang } from '../data/formations';
import { computeProgress } from '../utils/progress';
import { readCarryOnce, mergeAttempts, mergeLog } from '../utils/carry';
import { nextExhibit, cleanExhibit } from '../utils/exhibit';
import { cloud } from '../utils/cloud';
import { mergeExhibit, mineOnly } from '../utils/sync';

export const JourneyContext = createContext(null);
const STORAGE_KEY = 'itgyeol_journey_v1';
const SKILL_KEY = 'itgyeol_skill_v1';
const SOLVED_KEY = 'itgyeol_solved_v1';
// [오늘의 기운 선택 기능] 전에는 화면마다 useRef(pickTodayOhang())로 각자 따로 뽑아서
// 같은 "오늘의 기운"인데 화면마다 색이 달라 보였다 — 이제 앱 전체가 공유하는 값 하나를
// 여기서 들고, 사용자가 직접 골라 바꿀 수도 있게 한다(안 고르면 기기별로 하루치 랜덤값).
const OHANG_KEY = 'itgyeol_ohang_v1';
// 시작 전 질문("전통문화 하면 떠오르는 것")의 답과, 놀이를 몇 번 했는지의 기록.
const TASTE_KEY = 'itgyeol_taste_v1';
const PLAYLOG_KEY = 'itgyeol_playlog_v1';
// 그림책: 프롤로그를 봤는지, 판마다 입구 이야기를 봤는지, 이야기 중에 고른 반응.
const BOOK_KEY = 'itgyeol_book_v1';
const BOOK_EMPTY = { prologue: false, gates: {}, choice: {} };
// 전시해도 된다고 동의한 작품 목록 — [{code, attempts, nick, country, at}].
// 결과 화면에서 켜고 끄고, 전시관 화면과 홈의 "내 기록"에 보인다. 이름은 받지 않고 별명·나라만.
const EXHIBIT_KEY = 'itgyeol_exhibit_v1';
// 이 기기에서 전시를 신청한 작품 코드 — 서버에는 모든 기기의 신청이 모이므로 "내가 신청한 작품"은 이것으로 고른다
const MINE_KEY = 'itgyeol_exhibit_mine_v1';
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
  // 집에서 QR로 열었으면(?w=) 박물관에서 만든 기록을 한 번 가져온다.
  const [carried] = useState(() => readCarryOnce());
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
  // taste: null이면 아직 읽는 중, {done:false}면 한 번도 답하지 않음, {done:true,picks:[...]}이면 답했거나 건너뜀
  const [taste, setTasteState] = useState(null);
  // 놀이별·판별 "몇 번 했는지" — 결과물은 마지막 한 판만 남기지만, 모양은 지금까지 한 횟수가 만든다.
  const [playLog, setPlayLog] = useState({ byGame: {}, byScene: {} });
  // 그림책 진행 — null이면 아직 읽는 중
  const [book, setBookState] = useState(null);
  const [exhibit, setExhibitState] = useState([]);
  const [myCodes, setMyCodes] = useState([]);
  const exhibitRef = React.useRef([]);
  const pendingRef = React.useRef(new Set());
  useEffect(() => {
    exhibitRef.current = exhibit;
  }, [exhibit]);

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
      if (carried && carried.attempts.length) {
        setAttempts((prev) => {
          const next = mergeAttempts(prev, carried.attempts);
          AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {});
          return next;
        });
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
    safeGetItem(TASTE_KEY).then((raw) => {
      if (!mounted) return;
      let v = { done: false, picks: [] };
      try {
        const parsed = raw ? JSON.parse(raw) : null;
        if (parsed && Array.isArray(parsed.picks)) v = { done: !!parsed.done, picks: parsed.picks };
      } catch (e) {
        // 손상된 값은 처음부터
      }
      setTasteState(v);
    });
    safeGetItem(PLAYLOG_KEY).then((raw) => {
      if (!mounted) return;
      let cur = { byGame: {}, byScene: {} };
      try {
        const parsed = raw ? JSON.parse(raw) : null;
        if (parsed && parsed.byGame && parsed.byScene) cur = parsed;
      } catch (e) {
        // 손상된 값은 무시
      }
      if (carried) {
        cur = mergeLog(cur, carried.playLog);
        AsyncStorage.setItem(PLAYLOG_KEY, JSON.stringify(cur)).catch(() => {});
      }
      setPlayLog(cur);
    });
    safeGetItem(BOOK_KEY).then((raw) => {
      if (!mounted) return;
      let v = BOOK_EMPTY;
      try {
        const p = raw ? JSON.parse(raw) : null;
        if (p && typeof p === 'object') v = { prologue: !!p.prologue, gates: p.gates || {}, choice: p.choice || {} };
      } catch (e) {
        // 손상된 값은 무시
      }
      setBookState(v);
    });
    safeGetItem(MINE_KEY).then((raw) => {
      if (!mounted || !raw) return;
      try {
        const v = JSON.parse(raw);
        if (Array.isArray(v)) setMyCodes(v.filter((c) => typeof c === 'string'));
      } catch (e) {
        // 손상된 값은 무시
      }
    });
    safeGetItem(EXHIBIT_KEY).then((raw) => {
      if (!mounted || !raw) return;
      try {
        const parsed = JSON.parse(raw);
        setExhibitState(cleanExhibit(parsed));
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

  const setTaste = useCallback((picks) => {
    const v = { done: true, picks };
    setTasteState(v);
    AsyncStorage.setItem(TASTE_KEY, JSON.stringify(v)).catch(() => {});
  }, []);

  // 그림책 기록 갱신 — patch: {prologue?, gate?: 부이름, choice?: {key:id}}
  const markBook = useCallback((patch) => {
    setBookState((prev) => {
      const cur = prev || BOOK_EMPTY;
      const next = {
        prologue: cur.prologue || !!patch.prologue,
        gates: patch.gate ? { ...cur.gates, [patch.gate]: true } : cur.gates,
        choice: patch.choice ? { ...cur.choice, ...patch.choice } : cur.choice,
      };
      AsyncStorage.setItem(BOOK_KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  // 몸짓·표정·감탄사(동의한 사람만) — 놀이 화면을 나갈 때 잰 값을 기록에 더한다. 횟수와 세기만 남는다.
  const addSenses = useCallback((data) => {
    if (!data) return;
    setPlayLog((prev) => {
      const next = { ...prev, senses: mergeSenses(prev.senses, data) };
      AsyncStorage.setItem(PLAYLOG_KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  const addResult = useCallback((attempt) => {
    setPlayLog((prev) => {
      const next = { ...prev, byGame: { ...prev.byGame }, byScene: { ...prev.byScene } };
      next.byScene[attempt.sceneId] = (next.byScene[attempt.sceneId] || 0) + 1;
      if (attempt.sceneId === 'tbd') next.byGame[attempt.formationId] = (next.byGame[attempt.formationId] || 0) + 1;
      AsyncStorage.setItem(PLAYLOG_KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
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

  // 작품 하나를 전시 후보로 올리거나(entry: {code, attempts, nick, country}) 내린다(code만).
  // 같은 코드가 이미 있으면 별명·나라만 고친다.
  // 바뀐 것은 잇결 서버에도 보낸다(박물관 큰 화면이 다른 기기여도 보이게). 못 보내면 기억해 두었다가 다시 보낸다.
  const pushExhibit = useCallback((code, entry) => {
    pendingRef.current.add(code);
    cloud
      .putExhibit(code, entry)
      .then(() => pendingRef.current.delete(code))
      .catch(() => {});
  }, []);

  const setExhibit = useCallback((code, entry) => {
    const prev = exhibitRef.current;
    const next = nextExhibit(prev, code, entry);
    exhibitRef.current = next;
    setExhibitState(next);
    AsyncStorage.setItem(EXHIBIT_KEY, JSON.stringify(next)).catch(() => {});
    if (entry && !prev.some((e) => e.code === code)) {
      setMyCodes((m) => {
        const v = m.includes(code) ? m : [...m, code];
        AsyncStorage.setItem(MINE_KEY, JSON.stringify(v)).catch(() => {});
        return v;
      });
    }
    pushExhibit(code, next.find((e) => e.code === code) || null);
  }, [pushExhibit]);

  // 서버에서 전시 목록 다시 읽기 — 전시관·박물관 큰 화면·결과 화면이 열려 있는 동안 몇 초마다 부른다
  const refreshExhibit = useCallback(async () => {
    for (const code of [...pendingRef.current]) {
      const e = exhibitRef.current.find((x) => x.code === code) || null;
      await cloud.putExhibit(code, e).then(() => pendingRef.current.delete(code)).catch(() => {});
    }
    try {
      const remote = await cloud.exhibit();
      const next = mergeExhibit(exhibitRef.current, remote, pendingRef.current);
      exhibitRef.current = next;
      setExhibitState(next);
      AsyncStorage.setItem(EXHIBIT_KEY, JSON.stringify(next)).catch(() => {});
      return true;
    } catch (e) {
      return false;
    }
  }, []);

  const resetJourney = useCallback(() => {
    setAttempts([]);
    AsyncStorage.removeItem(STORAGE_KEY).catch(() => {});
  }, []);

  return (
    <JourneyContext.Provider
      value={{ attempts, addResult, addSenses, resetJourney, loaded, taste, setTaste, playLog, book, markBook, skills, recordSkill, ohangKey, setOhangKey, solvedIds, progress: computeProgress(solvedIds), exhibit, setExhibit, refreshExhibit, myExhibit: mineOnly(exhibit, myCodes), carried: !!(carried && carried.attempts.length) }}
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
