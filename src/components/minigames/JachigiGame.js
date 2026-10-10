import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Pressable, Animated } from 'react-native';
import Text from '../../ui/Text';
import { colors } from '../../theme';
import { useTapKey } from '../../utils/useTapKey';
import Mascot from '../Mascot';
import { jangdanForPeriod } from '../../data/jangdan';

// 자치기 — 다른 투척형 놀이(ThrowGame: 조준+파워)와 달리 "연속 2단계 타이밍"으로 완전히
// 다른 조작감을 준다. 실제 자치기 동작 그대로:
//   1단계(팝) — 긴 채로 땅에 놓인 짧은 채(작은 자)를 톡 쳐서 공중에 띄운다.
//               게이지가 쉬지 않고 오르내리는 중에, 맨 위 "팝!" 구간에 왔을 때 탭해야 튀어오른다.
//               타이밍을 놓쳐도(헛스윙) 게이지는 계속 돌고 있으니 다음 기회를 노리면 된다 —
//               1단계는 벌칙 없이 "감 잡기"에만 집중하도록 재시도 횟수 제한을 두지 않았다.
//   2단계(스윙) — 공중에 뜬 순간, 단 한 번뿐인 빠른 스윙 타이밍 구간이 쓸고 지나간다.
//               이번엔 범위가 훨씬 좁고(스윙! 구간), 지나가면 그걸로 끝 — 탭을 안 하면 자동으로
//               헛스윙 처리된다. 구간 한가운데에 가깝게 맞힐수록 멀리 날아간다.
// 두 단계 모두 같은 탭 동작(스페이스/방향키/엔터/Z,X 또는 화면의 "탁!" 버튼)을 공유하고,
// 지금 어느 단계인지에 따라 그 탭이 다른 의미(팝 판정 vs 스윙 판정)로 해석될 뿐이다.
// 라운드를 반복할수록 1단계 게이지 주기가 빨라지고 2단계 구간이 좁아져 점점 어려워진다.

const POP_PERIOD_BASE = 900; // 1단계 게이지가 한 바퀴(오르내리기) 도는 기본 주기(ms)
const POP_ZONE_MIN = 82; // 게이지 0~100 중 "팝!" 구간 시작값 (이 이상이면 성공)
const SWING_DURATION = 450; // 2단계 — 단 한 번 훑고 지나가는 스윙 구간의 총 소요 시간(ms)
const SWING_ZONE_CENTER = 65; // 2단계 "스윙!" 구간의 중심값(0~100)
const SWING_ZONE_WIDTH_BASE = 20; // 2단계 "스윙!" 구간의 기본 폭
const FIELD_WIDTH = 280; // 필드(날아가는 모습을 보여주는 영역)의 기준 너비(px)
const POP_LAUNCH_DURATION = 350; // 팝 성공 시 작은 자가 튀어오르는 애니메이션 시간(ms)
const FLIGHT_DURATION = 500; // 스윙 후 날아가는 애니메이션 시간(ms)

export default function JachigiGame({
  rounds = 3,
  distanceStart = 55,
  distanceStep = 15,
  // [지능형 난이도] 성인반/아동반 같은 반 구분과는 별개로, 이 놀이를 평소 잘하는
  // 사람에게는 처음부터 주기를 짧게·구간을 좁게 시작하고, 아직 서툰 사람에게는
  // 여유 있게 시작하도록 PlayScreen이 넘겨주는 값. 기본값은 기존과 동일하다.
  popPeriodMs = POP_PERIOD_BASE,
  swingZoneWidth = SWING_ZONE_WIDTH_BASE,
  color,
  onComplete,
  mascot = 'pung',
}) {
  const initialZone = {
    min: SWING_ZONE_CENTER - swingZoneWidth / 2,
    max: SWING_ZONE_CENTER + swingZoneWidth / 2,
  };
  const [phase, setPhase] = useState('ready'); // ready | pop | swing | flying | done
  const [round, setRound] = useState(1);
  const [gauge, setGauge] = useState(0); // 1단계 게이지 값(0~100)
  const [swingValue, setSwingValue] = useState(0); // 2단계 스윙 진행값(0~100)
  const [zone, setZone] = useState(initialZone); // 2단계 "스윙!" 구간 (렌더용)
  const [distance, setDistance] = useState(0); // 이번 시도의 비거리
  const [flash, setFlash] = useState(null); // 'whiff' | 'short' | 'success'
  // 1단계 게이지 주기가 빨라질수록 장단도 같이 빨라진다 — 숫자 난이도 대신 실제 장단으로 보여준다.
  const [jangdanStage, setJangdanStage] = useState(() => jangdanForPeriod(popPeriodMs));

  // 인터벌/타임아웃 안에서 최신 값을 읽기 위한 ref들 — 클로저 고착(stale closure) 방지.
  const phaseRef = useRef('ready');
  const roundRef = useRef(1);
  const gaugeRef = useRef(0);
  const swingRef = useRef(0);
  const periodRef = useRef(popPeriodMs);
  const zoneRef = useRef(initialZone);
  const popStartRef = useRef(0);
  const swingStartRef = useRef(0);
  const sessionStartRef = useRef(Date.now());
  const popTimerRef = useRef(null);
  const swingTimerRef = useRef(null);
  const flashTimeoutRef = useRef(null);
  const maxDistanceRef = useRef(null);
  if (maxDistanceRef.current == null) {
    maxDistanceRef.current = distanceStart + rounds * distanceStep + 60;
  }

  const popAnim = useRef(new Animated.Value(0)).current; // 0=바닥, 1=튀어오른 높이
  const flightAnim = useRef(new Animated.Value(0)).current; // 0=치는 자리, 1=날아간 자리

  useEffect(
    () => () => {
      popTimerRef.current && clearInterval(popTimerRef.current);
      swingTimerRef.current && clearInterval(swingTimerRef.current);
      flashTimeoutRef.current && clearTimeout(flashTimeoutRef.current);
    },
    []
  );

  const setPhaseBoth = (p) => {
    phaseRef.current = p;
    setPhase(p);
  };

  // 1단계: 게이지가 사인파로 계속 오르내린다 (ThrowGame의 파워 충전과 같은 수식이지만,
  // 누르고 있는 동안만이 아니라 이 단계에 들어와 있는 내내 "쉬지 않고" 돈다).
  const startPop = () => {
    gaugeRef.current = 0;
    setGauge(0);
    popStartRef.current = Date.now();
    popTimerRef.current && clearInterval(popTimerRef.current);
    popTimerRef.current = setInterval(() => {
      const t = Date.now() - popStartRef.current;
      const p = 50 + 50 * Math.sin((2 * Math.PI * t) / periodRef.current - Math.PI / 2);
      gaugeRef.current = p;
      setGauge(p);
    }, 30);
    setPhaseBoth('pop');
  };

  // 2단계: 루프가 아니라 "단 한 번" 0→100으로 훑고 끝나는 스윙 구간.
  const startSwing = () => {
    swingRef.current = 0;
    setSwingValue(0);
    swingStartRef.current = Date.now();
    swingTimerRef.current && clearInterval(swingTimerRef.current);
    swingTimerRef.current = setInterval(() => {
      const t = Date.now() - swingStartRef.current;
      const v = Math.min(100, (t / SWING_DURATION) * 100);
      swingRef.current = v;
      setSwingValue(v);
      if (v >= 100) {
        clearInterval(swingTimerRef.current);
        resolveSwing(false, v); // 끝까지 탭 없이 지나가면 자동 헛스윙
      }
    }, 20);
    setPhaseBoth('swing');
  };

  const flashMsg = (key, ms = 900) => {
    setFlash(key);
    flashTimeoutRef.current && clearTimeout(flashTimeoutRef.current);
    flashTimeoutRef.current = setTimeout(() => setFlash(null), ms);
  };

  const resolveSwing = (tapped, value) => {
    swingTimerRef.current && clearInterval(swingTimerRef.current);
    const z = zoneRef.current;
    let dist = 0;
    if (tapped && value >= z.min && value <= z.max) {
      // 구간 한가운데에 가까울수록 멀리 날아간다 (70~140 사이로 환산)
      const center = (z.min + z.max) / 2;
      const halfWidth = Math.max(1, (z.max - z.min) / 2);
      const proximity = Math.max(0, 1 - Math.abs(value - center) / halfWidth);
      dist = Math.round(70 + proximity * 70);
    }
    setDistance(dist);
    setPhaseBoth('flying');
    flightAnim.setValue(0);
    Animated.timing(flightAnim, {
      toValue: 1,
      duration: FLIGHT_DURATION,
      useNativeDriver: true,
    }).start(() => finalizeRound(dist));
  };

  const finalizeRound = (dist) => {
    const required = distanceStart + (roundRef.current - 1) * distanceStep;
    const success = dist >= required;

    if (success) {
      flashMsg('success');
      if (roundRef.current >= rounds) {
        onComplete({
          success: true,
          score: roundRef.current,
          elapsedMs: Date.now() - sessionStartRef.current,
        });
        setPhaseBoth('done');
        return;
      }
      // 성공했으니 다음 라운드는 더 어렵게 — 주기는 짧게, 스윙 구간은 좁게
      periodRef.current = Math.max(500, periodRef.current * 0.9);
      setJangdanStage(jangdanForPeriod(periodRef.current));
      const w = Math.max(10, (zoneRef.current.max - zoneRef.current.min) * 0.85);
      const c = (zoneRef.current.min + zoneRef.current.max) / 2;
      zoneRef.current = { min: c - w / 2, max: c + w / 2 };
      setZone(zoneRef.current);
      roundRef.current += 1;
      setRound(roundRef.current);
    } else {
      // 거리가 부족하면(헛스윙 포함) 같은 라운드를 같은 난이도로 다시 도전
      flashMsg(dist > 0 ? 'short' : 'whiff');
    }

    // 다음 시도를 위해 자(스틱)를 처음 자리로 되돌리고 다시 1단계부터
    popAnim.setValue(0);
    flightAnim.setValue(0);
    setDistance(0);
    startPop();
  };

  // 두 단계가 공유하는 단 하나의 탭 핸들러 — 지금 어느 단계인지에 따라 의미가 달라진다.
  const handleTap = () => {
    if (phaseRef.current === 'pop') {
      if (gaugeRef.current >= POP_ZONE_MIN) {
        // 팝 성공 — 게이지를 멈추고 자가 튀어오르는 모습을 보여준 뒤 2단계로
        popTimerRef.current && clearInterval(popTimerRef.current);
        setFlash(null);
        popAnim.setValue(0);
        Animated.timing(popAnim, {
          toValue: 1,
          duration: POP_LAUNCH_DURATION,
          useNativeDriver: true,
        }).start(() => startSwing());
      } else {
        // 타이밍을 놓쳤다 — 게이지는 멈추지 않고 계속 도니 바로 다시 노려볼 수 있다
        flashMsg('whiff', 400);
      }
      return;
    }
    if (phaseRef.current === 'swing') {
      swingTimerRef.current && clearInterval(swingTimerRef.current);
      resolveSwing(true, swingRef.current);
    }
  };

  useTapKey(handleTap, phase === 'pop' || phase === 'swing');

  const startSession = () => {
    roundRef.current = 1;
    setRound(1);
    periodRef.current = popPeriodMs;
    setJangdanStage(jangdanForPeriod(periodRef.current));
    zoneRef.current = { ...initialZone };
    setZone(zoneRef.current);
    sessionStartRef.current = Date.now();
    setDistance(0);
    setFlash(null);
    popAnim.setValue(0);
    flightAnim.setValue(0);
    startPop();
  };

  const required = distanceStart + (round - 1) * distanceStep;
  const isSwingPhase = phase === 'swing';
  const bandMin = isSwingPhase ? zone.min : POP_ZONE_MIN;
  const bandMax = isSwingPhase ? zone.max : 100;
  const gaugeDisplay = isSwingPhase ? swingValue : gauge;

  const flagLeft = Math.min(FIELD_WIDTH - 14, (required / maxDistanceRef.current) * FIELD_WIDTH);
  const landedLeft = Math.min(
    FIELD_WIDTH - 20,
    (distance / maxDistanceRef.current) * FIELD_WIDTH
  );

  const stickY = popAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -70] });
  const flightX = flightAnim.interpolate({ inputRange: [0, 1], outputRange: [0, landedLeft] });
  const flightY = flightAnim.interpolate({ inputRange: [0, 1], outputRange: [-70, -6] });

  let instruction = '';
  if (phase === 'pop') instruction = '지금 탭해서 튀어 오르게 톡!';
  else if (phase === 'swing') instruction = '지금 휘둘러!';
  else if (phase === 'flying') instruction = '날아가는 중...';
  else if (phase === 'ready') instruction = '버튼을 누르면 시작해요';
  else if (phase === 'done') instruction = '완성!';

  return (
    <View style={styles.wrap}>
      <Text style={styles.roundText}>{round} / {rounds} 라운드 (목표 {required}m)</Text>
      {(phase === 'pop' || phase === 'swing') && (
        <Text style={styles.jangdanLabel}>
          지금 장단: {jangdanStage.name} ({jangdanStage.feel})
        </Text>
      )}

      <View style={styles.field}>
        <View style={styles.playerMascot} pointerEvents="none">
          <Mascot which={mascot} size={46} />
        </View>

        {/* 이번 라운드에 필요한 거리를 깃발로 표시 */}
        <Text style={[styles.flag, { left: flagLeft }]}>🚩</Text>

        {phase !== 'flying' && phase !== 'done' ? (
          <Animated.Text
            style={[styles.stick, { left: 56, transform: [{ translateY: stickY }] }]}
          >
            🥢
          </Animated.Text>
        ) : (
          <Animated.Text
            style={[
              styles.stick,
              { left: 56, transform: [{ translateX: flightX }, { translateY: flightY }] },
            ]}
          >
            🥢
          </Animated.Text>
        )}

        {flash === 'success' && <Text style={styles.flashHit}>성공! {distance}m</Text>}
        {flash === 'short' && <Text style={styles.flashMiss}>거리가 부족해요 ({distance}m)</Text>}
        {flash === 'whiff' && <Text style={styles.flashMiss}>헛스윙!</Text>}
      </View>

      <Text style={styles.instruction}>{instruction}</Text>

      <View style={styles.gaugeTrack}>
        <View
          style={[
            styles.targetBand,
            { left: `${bandMin}%`, width: `${Math.max(0, bandMax - bandMin)}%` },
          ]}
        />
        <View style={[styles.gaugeFill, { width: `${gaugeDisplay}%`, backgroundColor: color }]} />
      </View>
      <Text style={styles.count}>
        {phase === 'swing' ? '스윙' : '타이밍'} {Math.round(gaugeDisplay)}
      </Text>

      {phase === 'ready' && (
        <Pressable style={[styles.bigBtn, { backgroundColor: color }]} onPress={startSession}>
          <Text style={styles.bigBtnText}>시작하기</Text>
        </Pressable>
      )}
      {(phase === 'pop' || phase === 'swing') && (
        <Pressable
          style={[styles.tapBtn, { borderColor: color, backgroundColor: color }]}
          onPress={handleTap}
        >
          <Text style={[styles.tapBtnText, { color: '#fff' }]}>탁!</Text>
        </Pressable>
      )}
      {phase === 'done' && (
        <Pressable style={[styles.bigBtn, { backgroundColor: color }]} onPress={startSession}>
          <Text style={styles.bigBtnText}>다시 하기</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', width: '100%', flex: 1, justifyContent: 'center' },
  roundText: { fontSize: 12.5, fontWeight: '700', color: colors.accentDeep, marginBottom: 10 },
  jangdanLabel: { fontSize: 12, fontWeight: '700', color: colors.accent, marginBottom: 8 },
  field: {
    width: '100%',
    maxWidth: FIELD_WIDTH,
    height: 110,
    position: 'relative',
    marginBottom: 6,
  },
  playerMascot: { position: 'absolute', bottom: -10, left: 10 },
  flag: { position: 'absolute', bottom: 4, fontSize: 24, marginLeft: -6 },
  stick: { position: 'absolute', bottom: 18, fontSize: 28, marginLeft: -10 },
  flashHit: {
    position: 'absolute',
    top: 2,
    alignSelf: 'center',
    fontSize: 16,
    fontWeight: '800',
    color: colors.green,
  },
  flashMiss: {
    position: 'absolute',
    top: 2,
    alignSelf: 'center',
    fontSize: 14,
    fontWeight: '800',
    color: colors.accent,
  },
  instruction: { fontSize: 13, fontWeight: '700', color: colors.muted, marginBottom: 10 },
  gaugeTrack: {
    width: '100%',
    maxWidth: 420,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(0,0,0,0.08)',
    overflow: 'hidden',
    marginBottom: 10,
  },
  targetBand: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(120,190,120,0.5)',
  },
  gaugeFill: { height: '100%' },
  count: { fontSize: 15, fontWeight: '700', color: colors.ink, marginBottom: 20 },
  bigBtn: { paddingHorizontal: 36, paddingVertical: 18, borderRadius: 22 },
  bigBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  tapBtn: {
    width: 220,
    height: 220,
    borderRadius: 110,
    borderWidth: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tapBtnText: { fontWeight: '700', fontSize: 17 },
});
