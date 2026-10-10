import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import Text from '../../ui/Text';
import { useTime } from '../../ui/Mission';
import SealButton from '../../ui/SealButton';
import { play } from '../../utils/sound';
import { colors } from '../../theme';
import { useArrowHold } from '../../utils/useTapKey';
import { euljaPathPoint, euljaGuidePoints } from '../../data/formations';
import { t as i18nT } from '../../i18n';

const GUIDE_POINTS = euljaGuidePoints(28);
const TRAIL_GAP_TICKS = 5; // 뒷사람 한 명마다 이만큼씩 늦게(몇 틱 전 머리 위치를) 따라간다
const TICK_MS = 50;
const TRAIL_LEN = 300;

// 을자진 — 다른 진법처럼 "멈춘 모양"에 점을 가져다 놓는 놀이가 아니다. 실제 을자진의
// 핵심은 좁은 길을 구불구불 "계속 흘러가며" 움직이는 것 그 자체(자료: 길놀이에서
// 줄지어 걸을 때 쓰는 대형)이므로, 맨 앞사람(머리)을 실시간으로 조종하는 동안
// 뒷사람들이 몇 박자 늦게 그 발자취를 그대로 따라오게 만든다 — "앞사람 뒤꿈치를
// 보고 따라간다"는 원래 지도 팁 문구를 실제 동작으로 옮긴 것.
export default function EuljaFlowGame({ color, peopleCount = 8, streak = 0, onSuccess, onFail }) {
  const { timed, scaleMs } = useTime();
  const [phase, setPhase] = useState('ready'); // ready | running | done
  const [t, setT] = useState(0);
  const [headX, setHeadX] = useState(GUIDE_POINTS[0].x);
  const [trail, setTrail] = useState(() => Array(TRAIL_LEN).fill(GUIDE_POINTS[0].x));
  const [flash, setFlash] = useState(null);
  const [strayMs, setStrayMs] = useState(0);

  const headXRef = useRef(headX);
  const trailRef = useRef(trail);
  const tRef = useRef(0);
  const strayRef = useRef(0);
  const sessionStartRef = useRef(Date.now());
  const tickRef = useRef(null);

  // 연속 성공(streak)이 쌓일수록 더 빨리 지나가고, 허용 범위도 좁아진다.
  const durationMs = scaleMs(Math.max(4200, 8000 - streak * 450));
  const tolerance = Math.max(0.05, 0.11 - streak * 0.008);
  const errorBudgetMs = Math.max(500, 1400 - streak * 80);

  useEffect(() => () => tickRef.current && clearInterval(tickRef.current), []);

  const moveHead = (delta) => {
    headXRef.current = Math.max(0.04, Math.min(0.96, headXRef.current + delta));
    setHeadX(headXRef.current);
  };

  const start = () => {
    tRef.current = 0;
    strayRef.current = 0;
    headXRef.current = GUIDE_POINTS[0].x;
    trailRef.current = Array(TRAIL_LEN).fill(GUIDE_POINTS[0].x);
    setHeadX(headXRef.current);
    setTrail(trailRef.current);
    setT(0);
    setStrayMs(0);
    setFlash(null);
    sessionStartRef.current = Date.now();
    setPhase('running');
    tickRef.current && clearInterval(tickRef.current);
    tickRef.current = setInterval(() => {
      const nt = Math.min(1, tRef.current + TICK_MS / durationMs);
      tRef.current = nt;
      setT(nt);
      const ideal = euljaPathPoint(nt);
      if (Math.abs(headXRef.current - ideal.x) > tolerance) {
        strayRef.current += TICK_MS;
        setStrayMs(strayRef.current);
      }
      trailRef.current = [...trailRef.current.slice(1), headXRef.current];
      setTrail(trailRef.current);
      if (nt >= 1) {
        clearInterval(tickRef.current);
        const elapsed = Date.now() - sessionStartRef.current;
        if (strayRef.current <= errorBudgetMs) {
          setFlash('success');
          setPhase('done');
          onSuccess && onSuccess(elapsed);
        } else {
          setFlash('fail');
          setPhase('ready');
          onFail && onFail(i18nT('줄이 많이 끊어졌어요. 머리를 궤적에 더 가깝게 따라가 보자 🐍'));
        }
      }
    }, TICK_MS);
  };

  useArrowHold(
    () => moveHead(-0.018),
    () => moveHead(0.018),
    phase === 'running'
  );

  const headY = euljaPathPoint(t).y;
  const followerCount = Math.max(1, peopleCount - 1);

  // 미션 안내에서 이미 '시작하기'를 눌렀으므로 바로 시작한다(실패·완료 뒤에만 다시 시작 버튼이 보인다).
  useEffect(() => {
    start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <View style={styles.wrap}>
      <Text style={styles.roundText}>
        {phase === 'running'
          ? i18nT('흘러가는 중 · {p0}%', { p0: Math.round(t * 100) })
          : i18nT('머리가 되어 을자(乙) 길을 걸어 보자')}
      </Text>
      <View style={styles.field}>
        {GUIDE_POINTS.map((p, i) => (
          <View key={i} style={[styles.guideDot, { left: `${p.x * 100}%`, top: `${p.y * 100}%` }]} />
        ))}
        {Array.from({ length: peopleCount - 1 }).map((_, i) => {
          const delayTicks = (i + 1) * TRAIL_GAP_TICKS;
          const idx = Math.max(0, trail.length - 1 - delayTicks);
          const fx = trail[idx];
          const ft = Math.max(0, t - (delayTicks * TICK_MS) / durationMs);
          const fy = euljaPathPoint(ft).y;
          return (
            <View
              key={i}
              style={[
                styles.person,
                {
                  left: `${fx * 100}%`,
                  top: `${fy * 100}%`,
                  borderColor: color,
                  opacity: 0.55 + 0.35 * (1 - i / followerCount),
                },
              ]}
            />
          );
        })}
        <View style={[styles.head, { left: `${headX * 100}%`, top: `${headY * 100}%`, backgroundColor: color }]}>
          <Text style={styles.headLabel}>1</Text>
        </View>
        {flash === 'success' && <Text style={styles.flashHit}>{i18nT('을자진 완성! 줄이 끊어지지 않았어요')}</Text>}
        {flash === 'fail' && <Text style={styles.flashMiss}>{i18nT('줄이 너무 많이 끊어졌어요')}</Text>}
      </View>

      <View style={styles.aimBtnRow}>
        <Pressable
          style={[styles.aimBtn, { borderColor: color }]}
          onPressIn={() => moveHead(-0.05)}
          disabled={phase !== 'running'}
        >
          <Text style={[styles.aimBtnText, { color }]}>{i18nT('◀ 왼쪽')}</Text>
        </Pressable>
        <Text style={styles.aimStatus}>
          {i18nT(phase === 'running'
            ? strayMs > 0
              ? '궤적에서 벗어나는 중!'
              : '잘 따라가고 있어요'
            : '화살표 키(←→)로도 조종해요')}
        </Text>
        <Pressable
          style={[styles.aimBtn, { borderColor: color }]}
          onPressIn={() => moveHead(0.05)}
          disabled={phase !== 'running'}
        >
          <Text style={[styles.aimBtnText, { color }]}>{i18nT('오른쪽 ▶')}</Text>
        </Pressable>
      </View>

      {phase !== 'running' && (
        <SealButton label={phase === 'done' ? i18nT('다시 걸어보기') : i18nT('걷기 시작')} onPress={start} sound="drum" style={{ marginTop: 6, minWidth: 200 }} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', width: '100%', flex: 1, justifyContent: 'flex-start', paddingTop: 6 },
  roundText: { fontSize: 14, fontWeight: '800', color: colors.ink, marginBottom: 8, textAlign: 'center', backgroundColor: colors.accentSoft, paddingHorizontal: 14, paddingVertical: 6, borderRadius: 3, overflow: 'hidden' },
  field: {
    width: '100%',
    maxWidth: 340,
    height: 330,
    position: 'relative',
    backgroundColor: colors.borderSoft,
    borderWidth: 2,
    borderColor: colors.ink,
    borderRadius: 6,
    marginBottom: 10,
    overflow: 'hidden',
  },
  guideDot: {
    position: 'absolute',
    width: 4,
    height: 4,
    borderRadius: 2,
    marginLeft: -2,
    marginTop: -2,
    backgroundColor: 'rgba(0,0,0,0.18)',
  },
  person: {
    position: 'absolute',
    width: 22,
    height: 22,
    borderRadius: 11,
    marginLeft: -11,
    marginTop: -11,
    backgroundColor: colors.paper,
    borderWidth: 2,
  },
  head: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderRadius: 14,
    marginLeft: -14,
    marginTop: -14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headLabel: { color: '#fff', fontWeight: '800', fontSize: 12 },
  flashHit: {
    position: 'absolute',
    top: 8,
    alignSelf: 'center',
    fontSize: 13,
    fontWeight: '800',
    color: colors.green,
    textAlign: 'center',
    paddingHorizontal: 10,
  },
  flashMiss: {
    position: 'absolute',
    top: 8,
    alignSelf: 'center',
    fontSize: 13,
    fontWeight: '800',
    color: colors.accent,
    textAlign: 'center',
    paddingHorizontal: 10,
  },
  aimBtnRow: {
    width: '100%',
    maxWidth: 360,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  aimBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 14,
    borderWidth: 2,
    backgroundColor: colors.paper,
  },
  aimBtnText: { fontWeight: '700', fontSize: 12.5 },
  aimStatus: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.muted,
    textAlign: 'center',
    flex: 1,
    marginHorizontal: 6,
  },
  bigBtn: { minWidth: 200, alignItems: 'center', paddingHorizontal: 30, paddingVertical: 14, borderRadius: 4, borderBottomWidth: 4, borderBottomColor: 'rgba(0,0,0,0.28)' },
  bigBtnText: { color: '#fff', fontWeight: '700', fontSize: 17, letterSpacing: 1 },
});
