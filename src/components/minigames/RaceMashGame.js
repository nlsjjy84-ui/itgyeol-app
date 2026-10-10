import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Pressable, Animated } from 'react-native';
import Text from '../../ui/Text';
import { colors } from '../../theme';
import { useAlternateKey } from '../../utils/useTapKey';

// 경쟁형 놀이(줄다리기·굴렁쇠 등) 공통 엔진.
// 고전 육상 게임(육상 100m 달리기 등)의 기본 조작 방식을 그대로 가져왔다 —
// 왼쪽/오른쪽을 "번갈아" 눌러야 전진한다. 한쪽만 연타하면 제자리걸음.
// 화살표 키(←/→)를 번갈아 누르거나, 화면의 왼발·오른발 버튼을 번갈아 클릭/터치해도 되고
// 키보드와 마우스를 섞어서(왼쪽은 클릭, 오른쪽은 화살표 키) 번갈아도 똑같이 인정된다.
//
// [추가] burstEnabled=true면 중간중간 "영차!!" 긴장 구간이 불쑥 끼어든다 —
// 그냥 쭉 같은 속도로 번갈아 누르기만 하면 되는 게 아니라, 이 구간에서는
// 한 번의 번갈이치기가 2점으로 "두 배" 쳐주는 대신, 이 구간 동안 한 번도
// 번갈아치지 못하면 상대가 순간적으로 훅 치고 나간다 — 실제 줄다리기에서
// 신호에 맞춰 "영차" 하고 한 번에 세게 당기는 순간을 흉내낸 것.
export default function RaceMashGame({
  durationMs,
  opponentRate,
  meIcon = '🙂',
  oppIcon = '🙂',
  color,
  onComplete,
  burstEnabled = false,
}) {
  const [phase, setPhase] = useState('ready'); // ready | running | done
  const [myScore, setMyScore] = useState(0);
  const [oppScore, setOppScore] = useState(0);
  const [timeLeftMs, setTimeLeftMs] = useState(durationMs);
  const [lastSide, setLastSide] = useState(null);
  const [burstActive, setBurstActive] = useState(false);
  const startRef = useRef(0);
  const myRef = useRef(0);
  const oppExtraRef = useRef(0); // 영차 구간을 놓쳐서 상대가 추가로 받은 보너스 누적
  const phaseRef = useRef('ready');
  const timerRef = useRef(null);
  const burstTimeoutRef = useRef(null);
  const burstEndTimeoutRef = useRef(null);
  const burstActiveRef = useRef(false);
  const burstHitRef = useRef(false); // 이번 영차 구간에서 한 번이라도 번갈아쳤는지
  const burstPulse = useRef(new Animated.Value(1)).current;

  useEffect(
    () => () => {
      timerRef.current && clearInterval(timerRef.current);
      burstTimeoutRef.current && clearTimeout(burstTimeoutRef.current);
      burstEndTimeoutRef.current && clearTimeout(burstEndTimeoutRef.current);
    },
    []
  );

  const finish = (finalOpp) => {
    clearInterval(timerRef.current);
    burstTimeoutRef.current && clearTimeout(burstTimeoutRef.current);
    burstEndTimeoutRef.current && clearTimeout(burstEndTimeoutRef.current);
    const success = myRef.current > finalOpp;
    phaseRef.current = 'done';
    setPhase('done');
    onComplete({ success, score: myRef.current, elapsedMs: durationMs });
  };

  // "영차!!" 구간을 1000ms 동안 띄우고, 그 안에 한 번도 번갈아치지 못하면
  // 상대에게 순간적인 추가 점수를 줘서 훅 치고 나가는 것처럼 보이게 한다.
  const scheduleBurst = () => {
    if (!burstEnabled) return;
    const delay = 1800 + Math.random() * 1200;
    burstTimeoutRef.current = setTimeout(() => {
      if (phaseRef.current !== 'running') return;
      burstActiveRef.current = true;
      burstHitRef.current = false;
      setBurstActive(true);
      Animated.sequence([
        Animated.timing(burstPulse, { toValue: 1.18, duration: 160, useNativeDriver: true }),
        Animated.timing(burstPulse, { toValue: 1, duration: 220, useNativeDriver: true }),
      ]).start();
      burstEndTimeoutRef.current = setTimeout(() => {
        burstActiveRef.current = false;
        setBurstActive(false);
        if (!burstHitRef.current) {
          // 영차 구간을 놓쳤다 — 상대가 순간적으로 훅 치고 나간다.
          oppExtraRef.current += opponentRate * 1.1;
        }
        if (phaseRef.current === 'running') scheduleBurst();
      }, 1000);
    }, delay);
  };

  const start = () => {
    myRef.current = 0;
    oppExtraRef.current = 0;
    setMyScore(0);
    setOppScore(0);
    setTimeLeftMs(durationMs);
    setLastSide(null);
    setBurstActive(false);
    burstActiveRef.current = false;
    burstHitRef.current = false;
    phaseRef.current = 'running';
    setPhase('running');
    startRef.current = Date.now();
    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - startRef.current;
      const left = durationMs - elapsed;
      const opp = (elapsed / 1000) * opponentRate + oppExtraRef.current;
      setOppScore(opp);
      if (left <= 0) {
        setTimeLeftMs(0);
        finish(opp);
      } else {
        setTimeLeftMs(left);
      }
    }, 100);
    scheduleBurst();
  };

  const handleAlternate = (side) => {
    if (phaseRef.current !== 'running') return;
    // 영차 구간 중의 번갈아치기는 두 배로 쳐준다 — 집중해서 반응한 보상.
    const gain = burstActiveRef.current ? 2 : 1;
    if (burstActiveRef.current) burstHitRef.current = true;
    myRef.current += gain;
    setMyScore(myRef.current);
    setLastSide(side);
  };

  const registerAlt = useAlternateKey(handleAlternate, phase === 'running');

  const total = Math.max(1, myScore + oppScore);
  const myPct = myScore / total;

  return (
    <View style={styles.wrap}>
      {burstActive && (
        <Animated.View style={[styles.burstBanner, { transform: [{ scale: burstPulse }] }]}>
          <Text style={styles.burstBannerText}>영차!! 지금 번갈아치세요!</Text>
        </Animated.View>
      )}
      <View
        style={[
          styles.ropeRow,
          burstActive && { borderColor: '#b2482f', borderWidth: 2, borderRadius: 14 },
        ]}
      >
        <Text style={styles.sideIcon}>{oppIcon}</Text>
        <View style={styles.ropeTrack}>
          <View style={[styles.ropeFillOpp, { width: `${(1 - myPct) * 100}%` }]} />
          <View style={[styles.ropeFillMe, { width: `${myPct * 100}%`, backgroundColor: color }]} />
        </View>
        <Text style={styles.sideIcon}>{meIcon}</Text>
      </View>
      <Text style={styles.count}>
        나 {myScore}  ·  상대 {Math.round(oppScore)}
        {phase === 'running' ? `  ·  ${(timeLeftMs / 1000).toFixed(1)}초` : ''}
      </Text>

      {phase !== 'running' ? (
        <Pressable style={[styles.bigBtn, { backgroundColor: color }]} onPress={start}>
          <Text style={styles.bigBtnText}>{phase === 'ready' ? '시작하기' : '다시 하기'}</Text>
        </Pressable>
      ) : (
        <View style={styles.altRow}>
          <Pressable
            style={[
              styles.altBtn,
              { borderColor: color },
              lastSide === 'L' && { backgroundColor: color },
            ]}
            onPress={() => registerAlt('L')}
          >
            <Text style={[styles.altBtnText, lastSide === 'L' ? { color: '#fff' } : { color }]}>
              ◀ 왼발
            </Text>
          </Pressable>
          <Pressable
            style={[
              styles.altBtn,
              { borderColor: color },
              lastSide === 'R' && { backgroundColor: color },
            ]}
            onPress={() => registerAlt('R')}
          >
            <Text style={[styles.altBtnText, lastSide === 'R' ? { color: '#fff' } : { color }]}>
              오른발 ▶
            </Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', width: '100%', flex: 1, justifyContent: 'center' },
  burstBanner: {
    backgroundColor: '#b2482f',
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 16,
    marginBottom: 10,
  },
  burstBannerText: { color: '#fff', fontWeight: '800', fontSize: 14 },
  ropeRow: {
    width: '100%',
    maxWidth: 440,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 10,
  },
  sideIcon: { fontSize: 32 },
  ropeTrack: {
    flex: 1,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(0,0,0,0.08)',
    overflow: 'hidden',
    flexDirection: 'row',
  },
  ropeFillOpp: { height: '100%', backgroundColor: 'rgba(0,0,0,0.18)' },
  ropeFillMe: { height: '100%' },
  count: { fontSize: 16, fontWeight: '700', color: colors.ink, marginBottom: 24 },
  bigBtn: { paddingHorizontal: 36, paddingVertical: 18, borderRadius: 22 },
  bigBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  altRow: { flexDirection: 'row', gap: 16 },
  altBtn: {
    width: 130,
    height: 130,
    borderRadius: 24,
    borderWidth: 4,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.paper,
  },
  altBtnText: { fontWeight: '700', fontSize: 16 },
});
