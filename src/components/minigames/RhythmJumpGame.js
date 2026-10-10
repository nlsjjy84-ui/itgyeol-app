import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Pressable, Animated, Easing } from 'react-native';
import Text from '../../ui/Text';
import { colors } from '../../theme';
import { useTapKey } from '../../utils/useTapKey';
import Mascot from '../Mascot';
import { jangdanForPeriod } from '../../data/jangdan';

// 줄넘기 / 고무줄놀이 공통 엔진.
//
// (a) 예전 버전은 "최대한 빨리 버튼을 연타"하는 방식이라 실력이 아니라 손 빠르기만 재는
//     얕은 미니게임이었다(클라이언트 피드백). 이번 버전은 RhythmClickGame(상모돌리기)과
//     같은 구조 — 줄/고무줄이 "계속 돌아가는 사이클" 위에서, 발밑을 지나는 아주 좁은
//     타이밍(스윗스팟)에 맞춰 탭 해야만 "넘기" 성공으로 인정된다. 즉 반응속도가 아니라
//     박자 감각(리듬)을 요구하는 진짜 타이밍 게임이다.
// (b) 사이클은 cycleTRef라는 숫자 시계로 0 ~ cyclePeriod(ms)를 30ms 간격으로 흘려보내고,
//     이 숫자가 한 바퀴를 다 돌아 0으로 꺾이는 "wrap" 순간을 기준으로 앞뒤 ±12%만큼을
//     스윗스팟 구간으로 둔다. 이 구간 안에서 탭하면 성공, 구간을 벗어나 탭하거나 아예
//     탭하지 않고 한 바퀴를 넘겨버리면(= 줄에 걸려 넘어짐) miss로 처리한다. 성공할 때마다
//     cyclePeriod가 ×0.94씩 줄어들어(최소 420ms) 실제 줄넘기처럼 점점 빨라진다. 화면에 보이는
//     줄의 상하 움직임은 별도의 Animated.loop로 돌리는 "장식용" 애니메이션이라, 판정은 항상
//     cycleTRef라는 정확한 숫자 값으로만 한다.
// (c) 고무줄놀이(variant='band')는 성공 횟수가 늘어날수록(목표치의 1/4마다) 고무줄 높이가
//     발목 → 무릎 → 허리 → 가슴 순으로 올라간다. 단계가 올라가면 화면에서 고무줄의 기준
//     위치가 위로 이동하고(연출), 선택적으로 스윗스팟 폭도 살짝 더 좁아져(×0.9씩) 난이도가
//     조금씩 올라간다. 줄넘기(variant='rope')는 이 단계 로직 없이 고정된 줄만 보여준다.

const BAND_STAGE_LABELS = ['발목', '무릎', '허리', '가슴'];
const BAND_REST_Y = [0, -20, -45, -75]; // 단계별로 고무줄 기준 위치를 위로 올린다

const FIELD_HEIGHT = 260;
const GROUND_BOTTOM = 66; // 필드 바닥에서 지면선까지 높이
const MASCOT_SIZE = 72;
const ROPE_BASE_BOTTOM = GROUND_BOTTOM + 6; // 줄/고무줄의 기준(쉬는) 위치

export default function RhythmJumpGame({
  variant = 'rope', // 'rope' | 'band'
  targetSkips = 14,
  cycleMsStart = 850,
  maxMisses = 3,
  color,
  onComplete, // ({ success, score, elapsedMs }) => void
  mascot = 'pung',
}) {
  const mainColor = color || colors.accent;
  const isBand = variant === 'band';

  const [phase, setPhase] = useState('ready'); // ready | running | done
  const [skips, setSkips] = useState(0);
  const [misses, setMisses] = useState(0);
  const [bandStage, setBandStage] = useState(0);
  const [cycleT, setCycleT] = useState(0); // 진행률 표시용(렌더용 숫자 — 판정에는 cycleTRef 사용)
  const [flash, setFlash] = useState(null); // 'hit' | 'miss' | null
  // 지금 박자가 어느 장단 단계인지 — cyclePeriodRef가 줄어들 때마다 같이 갱신된다.
  const [jangdanStage, setJangdanStage] = useState(() => jangdanForPeriod(cycleMsStart));

  const cycleTRef = useRef(0);
  const cyclePeriodRef = useRef(cycleMsStart);
  const hitThisCycleRef = useRef(false);
  const skipsRef = useRef(0);
  const missesRef = useRef(0);
  const bandStageRef = useRef(0);
  const startRef = useRef(0);
  const timerRef = useRef(null);
  const flashTimeoutRef = useRef(null);

  const ropeAnim = useRef(new Animated.Value(0)).current; // 0~1 반복 — 줄의 상하 스윙(장식용)
  const ropeLoopRef = useRef(null);
  const bandRestYAnim = useRef(new Animated.Value(0)).current; // 고무줄 단계별 기준 위치(장식용)
  const jumpAnim = useRef(new Animated.Value(0)).current; // 캐릭터 점프 모션

  useEffect(
    () => () => {
      timerRef.current && clearInterval(timerRef.current);
      flashTimeoutRef.current && clearTimeout(flashTimeoutRef.current);
      ropeLoopRef.current && ropeLoopRef.current.stop();
    },
    []
  );

  // 줄/고무줄의 상하 스윙 애니메이션을 새 속도(cyclePeriod)로 다시 시작한다.
  // WhipSpinGame의 runSpinLoop와 같은 패턴 — 속도가 바뀔 때마다 멈췄다 새로 돈다.
  const runRopeLoop = (periodMs) => {
    ropeLoopRef.current && ropeLoopRef.current.stop();
    ropeAnim.setValue(0);
    ropeLoopRef.current = Animated.loop(
      Animated.timing(ropeAnim, {
        toValue: 1,
        duration: periodMs,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    ropeLoopRef.current.start();
  };

  const triggerJump = () => {
    jumpAnim.setValue(0);
    Animated.sequence([
      Animated.timing(jumpAnim, {
        toValue: -38,
        duration: 130,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(jumpAnim, {
        toValue: 0,
        duration: 130,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start();
  };

  const showFlash = (kind) => {
    setFlash(kind);
    flashTimeoutRef.current && clearTimeout(flashTimeoutRef.current);
    flashTimeoutRef.current = setTimeout(() => setFlash(null), 240);
  };

  const finish = (success) => {
    clearInterval(timerRef.current);
    ropeLoopRef.current && ropeLoopRef.current.stop();
    setPhase('done');
    onComplete({
      success,
      score: skipsRef.current,
      elapsedMs: Date.now() - startRef.current,
    });
  };

  const start = () => {
    cycleTRef.current = 0;
    cyclePeriodRef.current = cycleMsStart;
    hitThisCycleRef.current = false;
    skipsRef.current = 0;
    missesRef.current = 0;
    bandStageRef.current = 0;

    setSkips(0);
    setMisses(0);
    setBandStage(0);
    setCycleT(0);
    setFlash(null);
    setJangdanStage(jangdanForPeriod(cyclePeriodRef.current));
    bandRestYAnim.setValue(0);

    setPhase('running');
    startRef.current = Date.now();
    runRopeLoop(cyclePeriodRef.current);

    // 숫자 시계 — 장식용 Animated.loop와 별개로, 판정은 전부 이 값 하나로만 한다.
    timerRef.current = setInterval(() => {
      cycleTRef.current += 30;
      if (cycleTRef.current >= cyclePeriodRef.current) {
        // 한 바퀴가 다 돌았는데 이번 사이클에 성공 탭이 없었다면 = 줄에 걸려 넘어짐
        if (!hitThisCycleRef.current) {
          missesRef.current += 1;
          setMisses(missesRef.current);
          showFlash('miss');
        }
        cycleTRef.current = cycleTRef.current % cyclePeriodRef.current;
        hitThisCycleRef.current = false;

        if (missesRef.current >= maxMisses) {
          finish(false);
          return;
        }
      }
      setCycleT(cycleTRef.current);
    }, 30);
  };

  const handleTap = () => {
    if (phase !== 'running') return;
    if (hitThisCycleRef.current) return; // 이번 사이클에 이미 성공했으면 추가 탭은 무시

    const period = cyclePeriodRef.current;
    const toleranceFactor = isBand ? Math.pow(0.9, bandStageRef.current) : 1;
    const halfWidth = period * 0.12 * toleranceFactor;
    const t = cycleTRef.current;
    const inSweetSpot = t <= halfWidth || t >= period - halfWidth;

    if (inSweetSpot) {
      hitThisCycleRef.current = true;
      skipsRef.current += 1;
      setSkips(skipsRef.current);
      showFlash('hit');
      triggerJump();

      if (isBand) {
        const perStage = Math.ceil(targetSkips / 4);
        const nextStage = Math.min(BAND_STAGE_LABELS.length - 1, Math.floor(skipsRef.current / perStage));
        if (nextStage !== bandStageRef.current) {
          bandStageRef.current = nextStage;
          setBandStage(nextStage);
          Animated.timing(bandRestYAnim, {
            toValue: BAND_REST_Y[nextStage],
            duration: 220,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }).start();
        }
      }

      cyclePeriodRef.current = Math.max(420, cyclePeriodRef.current * 0.94);
      runRopeLoop(cyclePeriodRef.current);
      setJangdanStage(jangdanForPeriod(cyclePeriodRef.current));

      if (skipsRef.current >= targetSkips) {
        finish(true);
        return;
      }
    } else {
      missesRef.current += 1;
      setMisses(missesRef.current);
      showFlash('miss');
      if (missesRef.current >= maxMisses) {
        finish(false);
        return;
      }
    }
  };

  useTapKey(handleTap, phase === 'running');

  // 줄의 상하 스윙(장식용) — [0, 0.5, 1] 구간을 거치며 위로 올라갔다 내려왔다 한다.
  const ropeSwingY = ropeAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [-50, 10, -50],
  });
  const ropeTranslateY = Animated.add(ropeSwingY, bandRestYAnim);

  const period = cyclePeriodRef.current;
  const toleranceFactor = isBand ? Math.pow(0.9, bandStage) : 1;
  const windowPct = Math.min(50, (0.12 * toleranceFactor) * 100);
  const cursorPct = period > 0 ? Math.min(100, (cycleT / period) * 100) : 0;

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>
        {isBand ? '고무줄놀이' : '줄넘기'} — 줄이 발밑을 지나는 순간에 맞춰 탭!
      </Text>

      {phase !== 'ready' && (
        <Text style={styles.jangdanLabel}>
          지금 장단: {jangdanStage.name} ({jangdanStage.feel})
        </Text>
      )}
      {isBand && phase !== 'ready' && (
        <Text style={styles.stageLabel}>지금 높이: {BAND_STAGE_LABELS[bandStage]}</Text>
      )}

      {/* 실제 게임 필드 — 캐릭터가 직접 줄을 넘는 모습이 여기 들어간다 */}
      <View style={[styles.field, { borderColor: mainColor }]}>
        <Animated.View
          style={[
            styles.rope,
            {
              backgroundColor: mainColor,
              bottom: ROPE_BASE_BOTTOM,
              transform: [{ translateY: ropeTranslateY }],
            },
          ]}
        />
        <View style={styles.ground} />
        <Animated.View
          style={[
            styles.characterWrap,
            { bottom: GROUND_BOTTOM - 4, transform: [{ translateY: jumpAnim }] },
          ]}
        >
          <Mascot which={mascot} size={MASCOT_SIZE} />
        </Animated.View>

        {flash === 'hit' && <Text style={[styles.flashText, { color: colors.green }]}>넘었다!</Text>}
        {flash === 'miss' && (
          <Text style={[styles.flashText, { color: '#b23b3b' }]}>타이밍이 안 맞았어요</Text>
        )}
      </View>

      {/* 사이클 진행바 — 양 끝(랩 지점)에 스윗스팟을 표시해서 "여기!"를 미리 가늠할 수 있게 한다 */}
      <View style={styles.cycleTrack}>
        <View style={[styles.sweetZone, { left: 0, width: `${windowPct}%`, backgroundColor: mainColor }]} />
        <View
          style={[styles.sweetZone, { right: 0, width: `${windowPct}%`, backgroundColor: mainColor }]}
        />
        <View style={[styles.cycleCursor, { left: `${cursorPct}%` }]} />
        <Text style={styles.cycleHint}>여기!</Text>
      </View>

      <Text style={styles.count}>
        {skips} / {targetSkips} 성공 · 놓침 {misses} / {maxMisses}
      </Text>

      {phase !== 'running' ? (
        <Pressable style={[styles.bigBtn, { backgroundColor: mainColor }]} onPress={start}>
          <Text style={styles.bigBtnText}>{phase === 'ready' ? '시작하기' : '다시 하기'}</Text>
        </Pressable>
      ) : (
        <Pressable style={[styles.tapBtn, { borderColor: mainColor }]} onPress={handleTap}>
          <Text style={[styles.tapBtnText, { color: mainColor }]}>지금 넘기!</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', width: '100%', flex: 1, justifyContent: 'center' },
  title: {
    fontSize: 12.5,
    fontWeight: '700',
    color: colors.accentDeep,
    marginBottom: 6,
    textAlign: 'center',
  },
  stageLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.ink,
    marginBottom: 8,
  },
  jangdanLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.accent,
    marginBottom: 4,
  },
  field: {
    width: '100%',
    maxWidth: 360,
    height: FIELD_HEIGHT,
    borderRadius: 18,
    borderWidth: 3,
    backgroundColor: colors.paper,
    overflow: 'hidden',
    marginBottom: 14,
  },
  rope: {
    position: 'absolute',
    left: '8%',
    width: '84%',
    height: 10,
    borderRadius: 5,
  },
  ground: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: GROUND_BOTTOM,
    height: 4,
    backgroundColor: colors.border,
  },
  characterWrap: {
    position: 'absolute',
    left: '50%',
    marginLeft: -MASCOT_SIZE / 2,
  },
  flashText: {
    position: 'absolute',
    top: 14,
    alignSelf: 'center',
    fontSize: 16,
    fontWeight: '800',
  },
  cycleTrack: {
    width: '100%',
    maxWidth: 360,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(0,0,0,0.06)',
    marginBottom: 10,
    overflow: 'visible',
  },
  sweetZone: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    borderRadius: 13,
    opacity: 0.35,
  },
  cycleCursor: {
    position: 'absolute',
    top: -3,
    width: 6,
    height: 32,
    borderRadius: 3,
    backgroundColor: colors.ink,
    marginLeft: -3,
  },
  cycleHint: {
    position: 'absolute',
    bottom: -18,
    alignSelf: 'center',
    fontSize: 11,
    fontWeight: '700',
    color: colors.muted,
  },
  count: { fontSize: 15, fontWeight: '700', color: colors.ink, marginTop: 14, marginBottom: 20 },
  bigBtn: { paddingHorizontal: 36, paddingVertical: 18, borderRadius: 22 },
  bigBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  tapBtn: {
    width: 220,
    height: 90,
    borderRadius: 26,
    borderWidth: 4,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.paper,
  },
  tapBtnText: { fontWeight: '700', fontSize: 18 },
});
