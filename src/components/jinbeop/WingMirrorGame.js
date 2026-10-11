import React, { useEffect, useRef, useState } from 'react';
import { useAutoStart } from '../../ui/Mission';
import { View, StyleSheet, Pressable } from 'react-native';
import Text from '../../ui/Text';
import { useTime } from '../../ui/Mission';
import SealButton from '../../ui/SealButton';
import { play } from '../../utils/sound';
import { colors } from '../../theme';
import Madang from '../../ui/Madang';
import { useArrowHold } from '../../utils/useTapKey';
import { t as i18nT } from '../../i18n';

const CENTER = { x: 0.5, y: 0.82 };
const HOLD_MS = 700;
const SUCCESS_MIN = 0.92;

// 학익진 — 이순신 장군의 한산도 대첩처럼 "좌우가 동시에" 넓게 벌어져야 학 날개 모양이
// 완성된다는 특징을, 한쪽만 조작해도 되는 조작 방식 자체로 보여준다. 플레이어는 날개를
// 얼마나 벌릴지(spread) 하나만 조종하고, 반대쪽 날개는 거울처럼 똑같이 따라 벌어진다.
export default function WingMirrorGame({ peopleCount = 10, targetPositions, color, streak = 0, onSuccess, onFail }) {
  const { timed, scaleMs } = useTime();
  const [phase, setPhase] = useState('ready'); // ready | playing | done
  const [spread, setSpread] = useState(0);
  const [holdMs, setHoldMs] = useState(0);
  const [remainingMs, setRemainingMs] = useState(0);
  const [flash, setFlash] = useState(null);
  const [flashMsg, setFlashMsg] = useState('');

  const spreadRef = useRef(0);
  const holdRef = useRef(0);
  const sessionStartRef = useRef(Date.now());
  const tickRef = useRef(null);
  const deadlineRef = useRef(0);

  // 연속 성공(streak)이 쌓일수록 양쪽 날개를 다 펼쳐야 하는 시간이 짧아진다.
  const durationMs = scaleMs(Math.max(5200, 9000 - streak * 500));

  useEffect(() => () => tickRef.current && clearInterval(tickRef.current), []);

  const clearTick = () => {
    tickRef.current && clearInterval(tickRef.current);
    tickRef.current = null;
  };

  const start = () => {
    spreadRef.current = 0;
    holdRef.current = 0;
    setSpread(0);
    setHoldMs(0);
    setFlash(null);
    sessionStartRef.current = Date.now();
    deadlineRef.current = Date.now() + durationMs;
    setRemainingMs(durationMs);
    setPhase('playing');
    clearTick();
    tickRef.current = setInterval(() => {
      const left = deadlineRef.current - Date.now();
      if (left <= 0) {
        clearTick();
        setRemainingMs(0);
        setPhase('ready');
        const msg = i18nT('시간 안에 양쪽 날개를 다 펼치지 못했어요. 다시 펼쳐볼까요?');
        setFlash('wrong');
        setFlashMsg(msg);
        onFail && onFail(msg);
        return;
      }
      setRemainingMs(left);
      if (spreadRef.current >= SUCCESS_MIN) {
        holdRef.current = Math.min(HOLD_MS, holdRef.current + 80);
        setHoldMs(holdRef.current);
        if (holdRef.current >= HOLD_MS) {
          clearTick();
          const elapsed = Date.now() - sessionStartRef.current;
          setPhase('done');
          setFlash('success');
          onSuccess && onSuccess(elapsed);
        }
      } else if (holdRef.current > 0) {
        holdRef.current = 0;
        setHoldMs(0);
      }
    }, 80);
  };
  useAutoStart(phase === 'ready', start);

  const changeSpread = (delta) => {
    spreadRef.current = Math.max(0, Math.min(1, spreadRef.current + delta));
    setSpread(spreadRef.current);
  };

  useArrowHold(
    () => changeSpread(-0.022),
    () => changeSpread(0.022),
    phase === 'playing'
  );

  const positions = targetPositions || [];

  // 미션 안내에서 이미 '시작하기'를 눌렀으므로 바로 시작한다(실패·완료 뒤에만 다시 시작 버튼이 보인다).
  useEffect(() => {
    start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <View style={styles.wrap}>
      <Text style={styles.roundText}>
        {phase === 'playing'
          ? i18nT('날개 펼침 {p0}% · 자세 유지 {p1}%', { p0: Math.round(spread * 100), p1: Math.round((holdMs / HOLD_MS) * 100) })
          : i18nT('한쪽 날개를 벌리면 반대쪽도 거울처럼 같이 벌어져요')}
      </Text>

      <View style={styles.field}>
        <Madang variant="court" seed={53} />
        <View style={[styles.centerDot, { backgroundColor: color, left: `${CENTER.x * 100}%`, top: `${CENTER.y * 100}%` }]} />
        {positions.map((target, i) => {
          const x = CENTER.x + (target.x - CENTER.x) * spread;
          const y = CENTER.y + (target.y - CENTER.y) * spread;
          return (
            <View key={i} style={[styles.person, { left: `${x * 100}%`, top: `${y * 100}%`, borderColor: color }]}>
              <Text style={styles.personText}>{i + 1}</Text>
            </View>
          );
        })}
        {flash === 'success' && <Text style={styles.flashHit}>{i18nT('학익진 완성! 양쪽 날개가 활짝 펼쳐졌어요')}</Text>}
        {flash === 'wrong' && <Text style={styles.flashMiss}>{i18nT(flashMsg)}</Text>}
      </View>

      {phase === 'playing' && (
        <View style={styles.timeTrack}>
          <View
            style={[
              styles.timeFill,
              { width: `${Math.max(0, Math.min(100, (remainingMs / durationMs) * 100))}%`, backgroundColor: color },
            ]}
          />
        </View>
      )}

      <View style={styles.aimBtnRow}>
        <Pressable
          style={[styles.aimBtn, { borderColor: color }]}
          onPressIn={() => changeSpread(-0.08)}
          disabled={phase !== 'playing'}
        >
          <Text style={[styles.aimBtnText, { color }]}>{i18nT('◀ 접기')}</Text>
        </Pressable>
        <Text style={styles.aimStatus}>
          {i18nT(phase === 'playing' ? '화살표 키(←→)로도 조종해요' : '한산도 대첩처럼 양쪽을 동시에 펼쳐 보자')}
        </Text>
        <Pressable
          style={[styles.aimBtn, { borderColor: color }]}
          onPressIn={() => changeSpread(0.08)}
          disabled={phase !== 'playing'}
        >
          <Text style={[styles.aimBtnText, { color }]}>{i18nT('벌리기 ▶')}</Text>
        </Pressable>
      </View>

      {phase !== 'playing' && (
        <SealButton label={phase === 'done' ? i18nT('다시 펼쳐보기') : i18nT('날개 펼치기 시작')} onPress={start} sound="drum" style={{ marginTop: 6, minWidth: 200 }} />
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
  centerDot: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: -4,
    marginTop: -4,
    opacity: 0.5,
  },
  person: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderRadius: 12,
    marginLeft: -12,
    marginTop: -12,
    backgroundColor: colors.paper,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  personText: { fontSize: 10.5, fontWeight: '700', color: colors.ink },
  flashHit: {
    position: 'absolute',
    top: 8,
    left: 8,
    right: 8,
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '800',
    color: colors.green,
  },
  flashMiss: {
    position: 'absolute',
    top: 8,
    left: 8,
    right: 8,
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '800',
    color: colors.accent,
  },
  timeTrack: {
    width: '100%',
    maxWidth: 340,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(0,0,0,0.08)',
    overflow: 'hidden',
    marginBottom: 12,
  },
  timeFill: { height: '100%' },
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
