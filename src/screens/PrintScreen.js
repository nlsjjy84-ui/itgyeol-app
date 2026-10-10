import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, StyleSheet, Pressable, SafeAreaView, ScrollView, Platform } from 'react-native';
import Text from '../ui/Text';
import Dot from '../components/Dot';
import FormationPreview from '../components/FormationPreview';
import MascotGuide from '../components/MascotGuide';
import CompletionEffect from '../components/CompletionEffect';
import OhangPicker from '../components/OhangPicker';
import { PRINTING_TYPES } from '../data/printing';
import { ohangByKey } from '../data/formations';
import { colors } from '../theme';
import ScreenHeader from '../ui/ScreenHeader';
import MissionGate from '../ui/Mission';
import GamePicker from '../ui/GamePicker';
import OtherScenes from '../components/OtherScenes';
import PrintPlay from '../components/PrintPlay';
import TraceReward from '../components/TraceReward';
import { printMission } from '../data/missions';
import { play } from '../utils/sound';
import { useJourney } from '../context/JourneyContext';
import { buildAttemptResult } from '../utils/resultSeed';
// [전체 판 공통화] 전래놀이에서 먼저 만든 반(tier) 목록과 숙련도 문구를 그대로 가져다 쓴다.
import { DIFFICULTY_TIERS, skillLabel } from '../data/playGames';
import { t as i18nT } from '../i18n';

const MATCH_THRESHOLD = 34; // px

// 자모 조각마다 각도와 색을 다르게 줘서, 가지런히 놓인 글자가 아니라
// 자음·모음 하나하나의 생김새를 스스로 알아보고 맞추도록 한다.
const JAMO_PALETTE = [
  '#c1592f',
  '#6b8f3c',
  '#3f6f8f',
  '#b08a4a',
  '#8a4f8a',
  '#2c7a6b',
  '#a23b5c',
  '#4a5fa3',
];

// 짧고 쉬운 활자 배열 → 자모 수가 많은 긴 단어 순으로 난이도가 올라가는 도전 순서.
// [아동반/성인반 실제 차등화] 반(tier)마다 도전 순서 자체가 다르다 — 아동반은 받침·겹모음
// 없는 2종(소고·비녀)만, 성인반은 받침·겹모음이 섞인 전체 목록을 돈다.
// (metaltype=4, woodblock=5, 보물=5, 문화재=7, 한글날=9, 풍물놀이=11)
const ROUND_ORDER_BY_TIER = {
  아동반: ['jamo-sogo', 'mirror', 'jamo-binyeo', 'shape'],
  성인반: [
    'metaltype',
    'mirror',
    'woodblock',
    'jamo-bomul',
    'shape',
    'jamo-munhwajae',
    'sentence',
    'jamo-hangeulnal',
    'jamo-pungmulnori',
  ],
};

function randomTokenStyles(n) {
  return Array.from({ length: n }, (_, i) => ({
    rotate: Math.round(Math.random() * 100 - 50), // -50deg ~ 50deg
    color: JAMO_PALETTE[i % JAMO_PALETTE.length],
  }));
}

function randomScatter(width, height, n) {
  const pts = [];
  const pad = 30;
  for (let i = 0; i < n; i++) {
    pts.push({
      x: pad + Math.random() * Math.max(1, width - pad * 2),
      y: pad + Math.random() * Math.max(1, height - pad * 2),
    });
  }
  return pts;
}

function speedComment(ms) {
  const sec = ms / 1000;
  if (sec < 12) return i18nT('빠르고 거침없이 움직였어요.');
  if (sec < 28) return i18nT('하나씩 신중하게 맞춰나갔어요.');
  return i18nT('차분하고 꼼꼼하게 완성했어요.');
}

// 라운드(연속 성공 횟수)가 오를수록 제한시간이 최대 45%까지 줄어든다.
function timeLimitFor(tokenCount, streak) {
  const base = 8000 + tokenCount * 2000;
  const factor = Math.max(0.55, 1 - streak * 0.08);
  return Math.round(base * factor);
}

// [점수제 폐지] 숫자 점수·등수·비교는 두지 않는다 — streak는 화면에 보이는 "기록"이
// 아니라 난이도를 자연스럽게 조절하는 내부 변수로만 쓴다(연속 성공할수록 살짝 빡빡해짐).
// 연속 성공이 쌓일수록 식자판에 "오타 활자"(가짜 조각)가 섞여 들어온다 — 글자를
// 맞추는 것뿐 아니라, 틀린 활자를 가려내 오른쪽 아래 제외 구역으로 골라내야 완성된다.
function decoyCountFor(streak) {
  return Math.min(3, Math.floor(streak / 2));
}

// [전체 판 공통화] 진법 화면과 동일한 아동반/성인반 + 지능형 숙련도 배율.
function clampSkill(r) {
  return Math.max(-3, Math.min(3, r));
}
function tierTimeMultiplier(tier) {
  return tier === '아동반' ? 1.35 : 1;
}
function decoyStreakAdjust(tier, rating) {
  const r = clampSkill(rating);
  return r - (tier === '아동반' ? 2 : 0);
}
function skillTimeMultiplier(rating) {
  const r = clampSkill(rating);
  return 1 - r * 0.06;
}

const EXCLUDE_ZONE_R = 34;
const DECOY_GLYPHS = ['ㅂ', 'ㅈ', 'ㄷ', 'ㄱ', 'ㅅ', 'ㅛ', 'ㅕ', 'ㅑ', 'ㅐ', 'ㅔ', 'ㅢ', 'ㅟ'];

function pickDecoyGlyphs(exclude, n) {
  const pool = DECOY_GLYPHS.filter((g) => !exclude.includes(g));
  const picked = [];
  for (let i = 0; i < n; i++) {
    picked.push(pool.length ? pool[Math.floor(Math.random() * pool.length)] : '?');
  }
  return picked;
}

// 진법과 다른 점: 조각마다 "정해진 자리"가 있어서 아무 자리에나 들어가면 안 되고
// 자기 자리(같은 인덱스)로 돌아가야 글자가 올바르게 완성된다.
export default function PrintScreen({ navigation }) {
  const [stageSize, setStageSize] = useState({ width: 0, height: 0 });
  const [typeIdx, setTypeIdx] = useState(0);
  const [positions, setPositions] = useState([]);
  const [tokenStyles, setTokenStyles] = useState([]);
  const [resetSignal, setResetSignal] = useState(0);
  const [resultVisible, setResultVisible] = useState(false);
  const [resultComment, setResultComment] = useState('');
  const [completed, setCompleted] = useState(false);
  // [점수제 폐지] streak는 화면에 표시하는 점수/기록이 아니라 난이도 조절용 내부 값이다.
  const [streak, setStreak] = useState(0);
  const [timeLimitMs, setTimeLimitMs] = useState(0);
  const [remainingMs, setRemainingMs] = useState(0);
  const [stampNonce, setStampNonce] = useState(0);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [keyboardMove, setKeyboardMove] = useState({ id: null, x: 0, y: 0, nonce: 0 });
  const [decoyGlyphs, setDecoyGlyphs] = useState([]);
  // [전체 판 공통화] 성인반/아동반 선택과 지도사 노트 펼침 상태 — 전래놀이와 동일한 구조.
  const [tier, setTier] = useState('성인반');
  const [noteOpen, setNoteOpen] = useState(false);
  const [picking, setPicking] = useState(true); // 놀이를 시작하면 고르기 판을 한 줄로 접는다

  const posRef = useRef([]);
  const attemptStartRef = useRef(Date.now());
  const hasDraggedRef = useRef(false);
  const gateOpenRef = useRef(false);
  const timeModeRef = useRef('timed');
  const settledRef = useRef(false);
  const timerIdRef = useRef(null);
  const timeLimitRef = useRef(0);
  const autoAdvanceRef = useRef(false);
  const mountedRef = useRef(false);
  // [오늘의 기운 선택 기능] 화면마다 따로 뽑지 않고 앱 전체가 공유하는 값을 쓴다.
  const { addResult, skills, recordSkill, ohangKey } = useJourney();
  const ohang = ohangByKey(ohangKey);

  // [아동반/성인반 실제 차등화] 아동반은 받침·겹모음 없는 쉬운 자모 낱말(level:'easy')만,
  // 성인반은 전체(받침·겹모음 포함)를 고를 수 있다 — 어느 쪽이든 글자를 통째로 다루는 게
  // 아니라 자음·모음 조각을 맞추는 건 똑같다.
  const availableTypes = useMemo(
    () => PRINTING_TYPES.filter((t) => tier === '성인반' || t.level !== 'hard'),
    [tier]
  );
  const type = availableTypes[typeIdx] || availableTypes[0];
  // 인쇄 방식마다 따로 쌓이는 숙련도 — 다른 판의 숙련도와 섞이지 않도록 접두사를 둔다.
  const skillId = `print:${type.id}`;
  const rating = skills[skillId] || 0;

  const targetPx = useMemo(() => {
    if (!stageSize.width || !stageSize.height) return [];
    return type.positions.map((p) => ({
      x: p.x * stageSize.width,
      y: p.y * stageSize.height,
    }));
  }, [type, stageSize]);

  const clearTimer = () => {
    if (timerIdRef.current) {
      clearInterval(timerIdRef.current);
      timerIdRef.current = null;
    }
  };

  const startAttempt = useCallback(
    (size) => {
      if (type.mode) {
        // 끌어 놓는 판이 아닌 놀이(거울 활자 등)는 시간 제한·조각 흩뿌리기가 필요 없다.
        clearTimer();
        settledRef.current = false;
        return;
      }
      const s = size || stageSize;
      if (!s.width || !s.height) return;
      const effectiveStreak = Math.max(0, streak + decoyStreakAdjust(tier, rating));
      const decoyN = decoyCountFor(effectiveStreak);
      const scattered = randomScatter(s.width, s.height, type.tokens.length + decoyN);
      posRef.current = scattered;
      setPositions(scattered);
      setTokenStyles(type.colorful ? randomTokenStyles(type.tokens.length) : []);
      setDecoyGlyphs(pickDecoyGlyphs(type.tokens, decoyN));
      setSelectedIdx(0);
      setKeyboardMove({ id: null, x: 0, y: 0, nonce: 0 });
      attemptStartRef.current = Date.now();
      hasDraggedRef.current = false;
      settledRef.current = false;
      setResetSignal((v) => v + 1);

      clearTimer();
      // 시간은 기본 3배로 넉넉히, '시간 제한 없이'를 고르면 사실상 끝나지 않게 한다.
      const baseLimit = Math.round(
        timeLimitFor(type.tokens.length, streak) * tierTimeMultiplier(tier) * skillTimeMultiplier(rating)
      );
      const limit = timeModeRef.current === 'free' ? 3600000 : baseLimit * 3;
      timeLimitRef.current = limit;
      setTimeLimitMs(limit);
      setRemainingMs(limit);
      // 미션 안내에서 '시작하기'를 누르기 전에는 시간이 흐르지 않는다.
      if (!gateOpenRef.current) return;
      const startedAt = Date.now();
      timerIdRef.current = setInterval(() => {
        const left = limit - (Date.now() - startedAt);
        if (left <= 0) {
          setRemainingMs(0);
          clearTimer();
          handleTimeout();
        } else {
          setRemainingMs(left);
        }
      }, 100);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [type, stageSize, streak, tier, rating]
  );

  const onStageLayout = (e) => {
    const { width, height } = e.nativeEvent.layout;
    setStageSize({ width, height });
    if (posRef.current.length === 0) {
      startAttempt({ width, height });
    }
  };

  // 사이드바에서 다른 인쇄 방식을 직접 고르면(자동 라운드 진행이 아니라면) 난이도를 초기화한다.
  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true;
      return;
    }
    if (!stageSize.width || !stageSize.height) return;
    if (!autoAdvanceRef.current) {
      setStreak(0);
    }
    autoAdvanceRef.current = false;
    posRef.current = [];
    gateOpenRef.current = false;
    startAttempt(stageSize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [typeIdx]);

  // 반(tier)을 바꾸면 그 반에서 고를 수 있는 목록으로 다시 맞추고(범위를 벗어나면 0번으로),
  // 지금 펼쳐진 자리를 그 난이도로 다시 섞는다 — 연속 성공 기록(streak)은 유지.
  const tierMountedRef = useRef(false);
  useEffect(() => {
    if (!tierMountedRef.current) {
      tierMountedRef.current = true;
      return;
    }
    if (typeIdx >= availableTypes.length) {
      setTypeIdx(0);
      return; // typeIdx 변경이 아래 typeIdx 이펙트를 다시 트리거하므로 여기서는 섞지 않는다.
    }
    if (!stageSize.width || !stageSize.height) return;
    startAttempt(stageSize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tier]);

  useEffect(() => clearTimer, []);

  function handleTimeout() {
    if (settledRef.current) return;
    settledRef.current = true;
    setStreak(0);
    setCompleted(false);
    play('geomungo');
    setResultComment(i18nT('시간이 다 됐어요! 콤보가 초기화돼요. 다시 섞어서 한 번 더 해 보자 💪'));
    setResultVisible(true);
    // [지능형 난이도] 시간 안에 못 끝낸 것도 "이 방식은 아직 익히는 중"이라는 신호로 반영한다.
    recordSkill(skillId, false);
  }

  const handleDragEnd = (id, x, y) => {
    const next = posRef.current.slice();
    next[id] = { x, y };
    posRef.current = next;
    hasDraggedRef.current = true;
    autoCheck();
  };

  const chooseType = (idx) => {
    setPicking(true);
    setNoteOpen(false);
    if (idx === typeIdx) {
      startAttempt(stageSize);
      return;
    }
    setTypeIdx(idx);
  };

  const advanceRound = () => {
    const order = ROUND_ORDER_BY_TIER[tier] || ROUND_ORDER_BY_TIER['성인반'];
    const curOrderIdx = order.indexOf(type.id);
    const nextId = curOrderIdx === -1 ? order[0] : order[(curOrderIdx + 1) % order.length];
    const nextIdx = availableTypes.findIndex((t) => t.id === nextId);
    autoAdvanceRef.current = true;
    setTypeIdx(nextIdx === -1 ? (typeIdx + 1) % availableTypes.length : nextIdx);
  };

  function getExcludeZone() {
    const s = stageSizeRef.current;
    if (!s.width || !s.height) return null;
    return { cx: s.width - EXCLUDE_ZONE_R - 20, cy: s.height - EXCLUDE_ZONE_R - 20, r: EXCLUDE_ZONE_R };
  }

  function evaluate() {
    const targets = targetPx.slice();
    if (targets.length === 0) return null;
    const current = posRef.current;
    let matchedCount = 0;

    // 자리마다 정해진 조각이 있으므로, 같은 인덱스끼리 거리만 비교한다.
    targets.forEach((t, i) => {
      const c = current[i];
      if (!c) return;
      const d = Math.hypot(c.x - t.x, c.y - t.y);
      if (d <= MATCH_THRESHOLD) matchedCount += 1;
    });

    // 오타 활자(가짜 조각)는 제외 구역으로 보내야 식자가 끝난다.
    const decoyIds = [];
    for (let i = type.tokens.length; i < current.length; i++) decoyIds.push(i);
    const zone = getExcludeZone();
    let decoysRemaining = 0;
    decoyIds.forEach((id) => {
      const p = current[id];
      const inZone = p && zone && Math.hypot(p.x - zone.cx, p.y - zone.cy) <= zone.r;
      if (!inZone) decoysRemaining += 1;
    });

    return { targets, matchedCount, decoyIds, decoysRemaining, decoysExcluded: decoysRemaining === 0 };
  }

  function completeSuccess(result) {
    play('stamp');
    setTimeout(() => play('jing'), 200);
    setTimeout(() => play('piri'), 600);
    if (settledRef.current) return;
    settledRef.current = true;
    clearTimer();
    const elapsed = Date.now() - attemptStartRef.current;
    // [점수제 폐지] 더는 점수를 계산해 더하지 않는다 — streak만 난이도 조절용으로 올린다.
    setStreak((s) => s + 1);
    setStampNonce((n) => n + 1);
    setCompleted(true);
    setResultComment(speedComment(elapsed));
    setResultVisible(true);
    // [지능형 난이도] 이 인쇄 방식을 성공할 때마다 숙련도가 쌓여, 다음에 열 때 시작 난이도가 달라진다.
    recordSkill(skillId, true);

    const mapping = type.tokens.length
      ? Object.fromEntries(type.tokens.map((_, i) => [i, i]))
      : { 0: Math.min(9, result.mistakes || 0) };
    const attemptResult = buildAttemptResult({
      sceneId: 'print',
      formationId: type.id,
      mapping,
      slotCount: result.targets.length,
      ohangKey: ohang.key,
      elapsedMs: elapsed,
    });
    addResult(attemptResult);
  }

  function autoCheck() {
    if (settledRef.current) return;
    const result = evaluate();
    if (
      result &&
      result.matchedCount === result.targets.length &&
      result.decoysExcluded &&
      hasDraggedRef.current
    ) {
      completeSuccess(result);
    }
  }

  function checkMatch() {
    if (settledRef.current) return;
    const result = evaluate();
    if (!result) return;
    if (result.matchedCount === result.targets.length && result.decoysExcluded && hasDraggedRef.current) {
      completeSuccess(result);
    } else {
      setCompleted(false);
      const missing = result.targets.length - result.matchedCount;
      const parts = [];
      if (missing > 0) parts.push(i18nT('아직 {p0}개의 조각이 제자리를 못 찾았어요', { p0: missing }));
      if (result.decoysRemaining > 0)
        parts.push(i18nT('오타 활자 {p0}개를 오른쪽 아래 제외 구역으로 보내야 해요', { p0: result.decoysRemaining }));
      setResultComment((parts.length ? parts.join(' · ') : '') + ' 점선 표시가 힌트야 👀');
      setResultVisible(true);
    }
  }

  // --- 키보드 조작: 클릭(또는 Tab)으로 조각 선택 → 화살표로 이동 → Enter로 "제 자리"에 쏙 넣기 ---
  // (진법과 달리 조각마다 정해진 자리가 있으므로, Enter는 선택된 조각을 항상 자기 자리로 보낸다)
  const selectedIdxRef = useRef(0);
  selectedIdxRef.current = selectedIdx;
  const stageSizeRef = useRef(stageSize);
  stageSizeRef.current = stageSize;
  const targetPxRef = useRef(targetPx);
  targetPxRef.current = targetPx;

  const moveSelected = useCallback((dx, dy) => {
    const idx = selectedIdxRef.current;
    const cur = posRef.current[idx];
    const s = stageSizeRef.current;
    if (!cur || !s.width || !s.height) return;
    const nx = Math.max(20, Math.min(s.width - 20, cur.x + dx));
    const ny = Math.max(20, Math.min(s.height - 20, cur.y + dy));
    setKeyboardMove((m) => ({ id: idx, x: nx, y: ny, nonce: m.nonce + 1 }));
  }, []);

  const tokenCountRef = useRef(type.tokens.length);
  tokenCountRef.current = type.tokens.length;

  const snapSelected = useCallback(() => {
    const idx = selectedIdxRef.current;
    const isDecoy = idx >= tokenCountRef.current;

    if (isDecoy) {
      // 오타 활자는 Enter 한 번으로 오른쪽 아래 제외 구역으로 보낸다.
      const s = stageSizeRef.current;
      if (!s.width || !s.height) return;
      const cx = s.width - EXCLUDE_ZONE_R - 20;
      const cy = s.height - EXCLUDE_ZONE_R - 20;
      setKeyboardMove((m) => ({ id: idx, x: cx, y: cy, nonce: m.nonce + 1 }));
      setSelectedIdx((s2) => (posRef.current.length ? (s2 + 1) % posRef.current.length : s2));
      return;
    }

    const targets = targetPxRef.current;
    const t = targets[idx];
    if (!t) return;
    setKeyboardMove((m) => ({ id: idx, x: t.x, y: t.y, nonce: m.nonce + 1 }));
    setSelectedIdx((s) => (posRef.current.length ? (s + 1) % posRef.current.length : s));
  }, []);

  const cycleSelected = useCallback((delta) => {
    setSelectedIdx((s) => {
      const n = posRef.current.length || 1;
      return (s + delta + n) % n;
    });
  }, []);

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;
    const STEP = 16;
    const held = new Set();
    // 화살표 키뿐 아니라 WASD 문자 키로도 같은 조작이 되도록 한다.
    const MOVE_KEYS = [
      'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'KeyA', 'KeyD', 'KeyW', 'KeyS',
    ];
    const tickId = setInterval(() => {
      if (!held.size) return;
      let dx = 0;
      let dy = 0;
      if (held.has('ArrowLeft') || held.has('KeyA')) dx -= STEP;
      if (held.has('ArrowRight') || held.has('KeyD')) dx += STEP;
      if (held.has('ArrowUp') || held.has('KeyW')) dy -= STEP;
      if (held.has('ArrowDown') || held.has('KeyS')) dy += STEP;
      if (dx || dy) moveSelected(dx, dy);
    }, 70);
    const down = (e) => {
      if (MOVE_KEYS.includes(e.code)) {
        e.preventDefault();
        held.add(e.code);
      } else if (e.code === 'Enter' || e.code === 'Space') {
        e.preventDefault();
        snapSelected();
      } else if (e.code === 'Tab') {
        e.preventDefault();
        cycleSelected(e.shiftKey ? -1 : 1);
      }
    };
    const up = (e) => held.delete(e.code);
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => {
      clearInterval(tickId);
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
    };
  }, [moveSelected, snapSelected, cycleSelected]);

  const timeRatio = timeLimitMs ? remainingMs / timeLimitMs : 1;
  const timerColor = timeRatio > 0.5 ? colors.green : timeRatio > 0.2 ? colors.gold : colors.accent;

  return (
    <SafeAreaView style={styles.safe}>
      <ScreenHeader scene="Print" title={i18nT('훈민정음 · 인쇄')} sub={i18nT('글자를 짓고, 새기고, 찍어내는 판')} onBack={() => navigation.navigate('Home')} />
      <View style={styles.header}>
        <View style={styles.badgeRow}>
          <View style={styles.tierRow}>
            {DIFFICULTY_TIERS.map((t) => (
              <Pressable
                key={t}
                style={[styles.tierBtn, tier === t && { backgroundColor: ohang.color, borderColor: ohang.color }]}
                onPress={() => { play('tap'); setTier(t); }}
              >
                <Text style={[styles.tierBtnText, tier === t && { color: '#fff' }]}>{i18nT(t)}</Text>
              </Pressable>
            ))}
          </View>
          <OhangPicker />
        </View>
      </View>

      <View style={styles.body}>
        <View style={styles.main}>
          {/* [스크롤 안 되던 문제 수정] 진법 화면과 동일한 원인·동일한 수정 —
              main에 ScrollView가 없어서 아래쪽이 잘리면 스크롤할 방법이 없었다. */}
          <ScrollView
            style={styles.mainScroll}
            contentContainerStyle={styles.mainScrollContent}
            showsVerticalScrollIndicator={false}
          >
          {/* [전체 판 공통화] 지도사 노트 — 전래놀이와 같은 위치·형태의 펼침 패널. */}
          <GamePicker
            items={availableTypes.map((t) => ({ key: t.id, tag: t.tag, name: t.name.replace('훈민정음 자모 배열 - ', '') }))}
            active={typeIdx}
            onPick={chooseType}
            collapsed={!picking}
            onExpand={() => setPicking(true)}
          />
          {type.tip && (
            <View style={styles.noteBox}>
              <Pressable style={styles.noteToggle} onPress={() => setNoteOpen((v) => !v)}>
                <Text style={styles.noteToggleText}>
                  {i18nT(noteOpen ? '▾' : '▸')} {i18nT('지도사 노트')}
                </Text>
              </Pressable>
              {noteOpen && <Text style={styles.noteText}>{i18nT(type.tip)}</Text>}
            </View>
          )}

          <MissionGate
            resetKey={type.id}
            info={{ scene: 'print', ...printMission(type), example: type.mode ? null : <FormationPreview positions={type.positions} color={ohang.color} size={130} /> }}
            onModeSelect={(mode) => {
              setPicking(false);
              timeModeRef.current = mode;
              gateOpenRef.current = true;
              if (stageSize.width && stageSize.height) startAttempt(stageSize);
            }}
          >
          {type.mode ? (
            <>
              <PrintPlay
                mode={type.mode}
                color={ohang.color}
                resetKey={`${type.id}-${resetSignal}`}
                onDone={(r) => {
                  if (settledRef.current) return;
                  completeSuccess({ targets: [0], mistakes: r.mistakes });
                }}
              />
              <CompletionEffect nonce={stampNonce} variant="stamp" color={ohang.color} label={i18nT('{p0} 완성!', { p0: type.tag })} />
              <View style={styles.actions}>
                <Pressable style={styles.secondaryBtn} onPress={() => { settledRef.current = false; setResetSignal((v) => v + 1); }}>
                  <Text style={styles.secondaryBtnText}>{i18nT('처음부터 다시')}</Text>
                </Pressable>
              </View>
            </>
          ) : (
            <>
          <View style={styles.timerRow}>
            <View style={styles.timerTrack}>
              <View
                style={[
                  styles.timerFill,
                  {
                    width: `${Math.max(0, Math.min(100, timeRatio * 100))}%`,
                    backgroundColor: timerColor,
                  },
                ]}
              />
            </View>
            <Text style={[styles.timerSeconds, { color: timerColor }]}>
              {timeModeRef.current === 'free' ? i18nT('시간 제한 없음') : i18nT('⏱ {p0}초', { p0: Math.max(0, Math.ceil(remainingMs / 1000)) })}
            </Text>
          </View>

          <View style={styles.stage} onLayout={onStageLayout}>
            {targetPx.map((t, i) => (
              <View
                key={`ghost-${i}`}
                style={[
                  styles.ghost,
                  { left: t.x - 23, top: t.y - 23, borderColor: ohang.color },
                ]}
              />
            ))}
            {decoyGlyphs.length > 0 && stageSize.width > 0 && (
              <View
                pointerEvents="none"
                style={[
                  styles.excludeZone,
                  { right: 20, bottom: 20, width: EXCLUDE_ZONE_R * 2, height: EXCLUDE_ZONE_R * 2 },
                ]}
              >
                <Text style={styles.excludeZoneText}>{i18nT('제외')}{'\n'}{i18nT('구역')}</Text>
              </View>
            )}
            {positions.map((p, i) => {
              const isDecoy = i >= type.tokens.length;
              return (
                <Dot
                  key={i}
                  id={i}
                  x={p.x}
                  y={p.y}
                  label={isDecoy ? decoyGlyphs[i - type.tokens.length] : type.tokens[i]}
                  rotateDeg={isDecoy ? 0 : tokenStyles[i]?.rotate || 0}
                  tintColor={isDecoy ? colors.accent : tokenStyles[i]?.color}
                  resetSignal={resetSignal}
                  onDragEnd={handleDragEnd}
                  onSelect={setSelectedIdx}
                  selected={i === selectedIdx}
                  forcePos={keyboardMove.id === i ? { x: keyboardMove.x, y: keyboardMove.y } : undefined}
                  forceSignal={keyboardMove.id === i ? keyboardMove.nonce : undefined}
                />
              );
            })}
            <CompletionEffect
              nonce={stampNonce}
              variant="stamp"
              color={ohang.color}
              label={i18nT('{p0} 완성!', { p0: type.tag })}
            />
          </View>

          <MascotGuide
            which="gyeol"
            message={
              decoyGlyphs.length > 0
                ? i18nT('이번엔 오타 활자가 {p0}개 섞여 있어요! 진짜 조각은 제 자리로, 가짜는 오른쪽 아래 제외 구역(✕)으로 보내야 글자가 완성돼요. 지금은 {p1}번 조각이 선택돼 있어요.', { p0: decoyGlyphs.length, p1: selectedIdx + 1 })
                : i18nT('조각을 드래그하거나, 클릭해서 선택한 뒤 화살표 키로 옮기고 Enter로 제자리에 쏙 넣으면 돼요. 지금은 {p0}번 조각이 선택돼 있어요. {p1} 글자를 완성해 보자!', { p0: selectedIdx + 1, p1: i18nT(timeModeRef.current === 'free' ? '천천히' : '시간 안에') })
            }
            style={styles.mascotHint}
          />

          <View style={styles.actions}>
            <Pressable style={styles.secondaryBtn} onPress={() => startAttempt(stageSize)}>
              <Text style={styles.secondaryBtnText}>{i18nT('다시 섞기')}</Text>
            </Pressable>
            <Pressable style={styles.primaryBtn} onPress={checkMatch}>
              <Text style={styles.primaryBtnText}>{i18nT('완성!')}</Text>
            </Pressable>
          </View>
            </>
          )}
          </MissionGate>
          </ScrollView>
        </View>
      </View>

      {resultVisible && (
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{i18nT(type.name)}</Text>
            <Text style={styles.modalBody}>{i18nT(type.description)}</Text>
            <View style={styles.modalDivider} />
            <Text style={styles.modalComment}>
              {i18nT('오늘의 기운:')} {i18nT(ohang.label)} ({i18nT(ohang.hint)} {i18nT('느낌) —')} {i18nT(resultComment)}
            </Text>
            {completed && <Text style={styles.modalScore}>{skillLabel(rating)}</Text>}
            <TraceReward sceneId="print" success={completed} />
            <View style={styles.modalActions}>
              <Pressable style={styles.modalClose} onPress={() => setResultVisible(false)}>
                <Text style={styles.modalCloseText}>{i18nT('닫기')}</Text>
              </Pressable>
              {completed && (
                <>
                  <Pressable
                    style={styles.modalPrimary}
                    onPress={() => {
                      setResultVisible(false);
                      advanceRound();
                    }}
                  >
                    <Text style={styles.modalPrimaryText}>{i18nT('다음 글자 도전!')}</Text>
                  </Pressable>
                  <Pressable
                    style={styles.modalSecondary}
                    onPress={() => {
                      setResultVisible(false);
                      navigation.navigate('Result');
                    }}
                  >
                    <Text style={styles.modalSecondaryText}>{i18nT('결과물 보기')}</Text>
                  </Pressable>
                </>
              )}
            </View>
            {completed && <OtherScenes current="Print" navigation={navigation} onGo={() => setResultVisible(false)} />}
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: 'transparent' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 6,
    flexWrap: 'wrap',
    gap: 6,
  },
  brand: { fontSize: 16, fontWeight: '700', color: colors.ink },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  homeBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1.2,
    borderColor: colors.border,
    backgroundColor: colors.paper,
  },
  homeBtnText: { fontSize: 12, fontWeight: '700', color: colors.ink },
  badgeRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap', alignItems: 'center' },
  tierRow: { flexDirection: 'row', gap: 6 },
  tierBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1.2,
    borderColor: colors.border,
    backgroundColor: colors.paper,
  },
  tierBtnText: { fontSize: 11, fontWeight: '700', color: colors.ink },
  ohangBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1.2,
    backgroundColor: colors.paper,
  },
  ohangText: { fontSize: 11, fontWeight: '600' },
  body: { flex: 1, flexDirection: 'column' },
  sidebar: { height: 66, borderBottomWidth: 1, borderBottomColor: colors.border, paddingTop: 2 },
  sidebarLabel: {
    fontSize: 11.5,
    fontWeight: '700',
    color: colors.ink,
    textAlign: 'center',
    lineHeight: 16,
    paddingHorizontal: 8,
    marginBottom: 8,
  },
  sidebarScroll: { flexGrow: 0 },
  sidebarList: { paddingHorizontal: 12, paddingBottom: 6, gap: 8, alignItems: 'center' },
  tab: {
    alignItems: 'center',
    minWidth: 96,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    backgroundColor: colors.paper,
    borderWidth: 2,
    borderColor: colors.ink,
    marginBottom: 0,
  },
  tabActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  tabTag: { fontSize: 9, color: colors.muted, fontWeight: '600', marginBottom: 3 },
  tabTagActive: { color: 'rgba(255,255,255,0.85)' },
  tabText: { fontSize: 12.5, color: colors.muted, fontWeight: '600', textAlign: 'center' },
  tabTextActive: { color: '#fff' },
  main: { flex: 1, width: '100%' },
  mainScroll: { flex: 1, width: '100%' },
  mainScrollContent: { flexGrow: 1 },
  previewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  previewTextBox: { flex: 1 },
  previewLabel: { fontSize: 12, fontWeight: '700', color: colors.ink, marginBottom: 2 },
  previewHint: { fontSize: 10.5, color: colors.muted, lineHeight: 15 },
  skillText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: colors.accentDeep,
    paddingHorizontal: 16,
    marginBottom: 6,
  },
  noteBox: {
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 10,
    borderRadius: 12,
    backgroundColor: colors.paper,
    borderWidth: 1,
    borderColor: colors.borderSoft,
  },
  noteToggle: { paddingVertical: 2 },
  noteToggleText: { fontSize: 12, fontWeight: '700', color: colors.ink },
  noteText: { fontSize: 11.5, color: colors.muted, lineHeight: 17, marginTop: 6 },
  timerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 16,
    marginBottom: 8,
  },
  timerTrack: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(0,0,0,0.08)',
    overflow: 'hidden',
  },
  timerFill: { height: '100%' },
  timerSeconds: { fontSize: 12, fontWeight: '800', minWidth: 36, textAlign: 'right' },
  stage: {
    flex: 1,
    minHeight: 330,
    marginHorizontal: 16,
    borderRadius: 4,
    backgroundColor: colors.borderSoft,
    borderWidth: 2,
    borderColor: colors.ink,
    overflow: 'hidden',
  },
  ghost: {
    position: 'absolute',
    width: 46,
    height: 46,
    borderRadius: 4,
    borderWidth: 2,
    borderStyle: 'dashed',
    opacity: 0.55,
  },
  hint: {
    textAlign: 'center',
    fontSize: 12,
    color: colors.muted,
    paddingVertical: 10,
  },
  excludeZone: {
    position: 'absolute',
    borderRadius: 999,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.accent,
    backgroundColor: 'rgba(178,72,47,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  excludeZoneText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.accent,
    textAlign: 'center',
    lineHeight: 13,
  },
  mascotHint: { marginHorizontal: 16, marginTop: 10, marginBottom: 4 },
  actions: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingBottom: 18,
  },
  secondaryBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: colors.paper,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  secondaryBtnText: { color: colors.ink, fontWeight: '600' },
  primaryBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: colors.accent,
    alignItems: 'center',
  },
  primaryBtnText: { color: '#fff', fontWeight: '700' },
  modalBackdrop: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(32,36,43,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    zIndex: 50,
  },
  modalCard: {
    width: '100%',
    backgroundColor: colors.paper,
    borderRadius: 20,
    padding: 20,
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: colors.ink, marginBottom: 8 },
  modalBody: { fontSize: 13, lineHeight: 20, color: colors.ink },
  modalDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 12,
  },
  modalComment: { fontSize: 12, color: colors.accentDeep, fontWeight: '600' },
  modalScore: { fontSize: 12, color: colors.ink, fontWeight: '700', marginTop: 6 },
  modalActions: {
    marginTop: 16,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
    gap: 10,
  },
  modalClose: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: colors.night,
    borderRadius: 12,
  },
  modalCloseText: { color: colors.onNight, fontWeight: '600', fontSize: 12 },
  modalPrimary: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: colors.accent,
    borderRadius: 12,
  },
  modalPrimaryText: { color: '#fff', fontWeight: '700', fontSize: 12 },
  modalSecondary: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: colors.accentSoft,
    borderRadius: 12,
  },
  modalSecondaryText: { color: colors.accentDeep, fontWeight: '700', fontSize: 12 },
});
