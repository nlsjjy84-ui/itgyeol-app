import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Pressable, Animated, Easing } from 'react-native';
import Text from '../../ui/Text';
import { colors } from '../../theme';
import { useTapKey } from '../../utils/useTapKey';
import Mascot from '../Mascot';
import { t as i18nT } from '../../i18n';

// 연날리기 — "빨리 많이 누르기"(마시 게임)가 아니라 "타이밍에 맞춰 누르기" 게임으로 새로 짰다.
// 바람은 게임이 끝날 때까지 계속 세졌다 약해졌다 하는 사인파로, ThrowGame의 파워 게이지처럼
// 손을 떼야 멈추는 게 아니라 ― 누르든 말든 시작부터 끝까지 절대 멈추지 않는다.
// 바람이 "돌풍 구간"(gustMin~gustMax)에 들어왔을 때 얼레를 감아야(탭) 연이 쭉 올라가고,
// 엉뚱한 타이밍에 감으면 오히려 줄이 풀리듯 높이가 깎인다 — 하이리스크/하이리턴 반응속도 게임.
// 연은 높이와 별개로 좌우로 살랑살랑 흔들리는데(sway), 이건 점수와 무관한 순수 연출용 애니메이션으로
// 아무것도 안 눌러도 바람에 흔들리는 느낌을 준다.
export default function KiteFlyGame({
  targetHeight = 100,
  durationMs = 9000,
  gustMin = 60,
  gustMax = 85,
  icon = '🪁',
  color,
  onComplete,
  mascot = 'pung',
}) {
  const [phase, setPhase] = useState('ready'); // ready | running | done
  const [wind, setWind] = useState(0);
  const [height, setHeight] = useState(0);
  const [timeLeftMs, setTimeLeftMs] = useState(durationMs);
  const [flash, setFlash] = useState(null); // 'gain' | 'lose'

  const windRef = useRef(0); // 탭하는 순간의 "진짜" 바람 값을 읽기 위한 ref (state는 비동기라 못 믿는다)
  const heightRef = useRef(0);
  const startRef = useRef(0);
  const timerRef = useRef(null);
  const flashTimeoutRef = useRef(null);

  const swayAnim = useRef(new Animated.Value(0)).current; // 연이 바람에 흔들리는 연출용 (점수 무관)
  const sparkleAnim = useRef(new Animated.Value(0)).current; // 잘 감았을 때 반짝이는 피드백

  // 연출용 좌우 흔들림은 게임 진행과 무관하게 계속 돈다 — 화면에 떠 있는 동안 늘 살아있는 느낌.
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(swayAnim, {
          toValue: 1,
          duration: 600,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(swayAnim, {
          toValue: -1,
          duration: 1200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(swayAnim, {
          toValue: 0,
          duration: 600,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [swayAnim]);

  useEffect(
    () => () => {
      timerRef.current && clearInterval(timerRef.current);
      flashTimeoutRef.current && clearTimeout(flashTimeoutRef.current);
    },
    []
  );

  const finish = (success) => {
    clearInterval(timerRef.current);
    setPhase('done');
    onComplete({
      success,
      score: Math.round(heightRef.current),
      elapsedMs: success ? Date.now() - startRef.current : durationMs,
    });
  };

  const start = () => {
    windRef.current = 0;
    heightRef.current = 0;
    setWind(0);
    setHeight(0);
    setTimeLeftMs(durationMs);
    setFlash(null);
    setPhase('running');
    startRef.current = Date.now();
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      const t = Date.now() - startRef.current;
      const left = durationMs - t;
      if (left <= 0) {
        setTimeLeftMs(0);
        finish(false);
        return;
      }
      setTimeLeftMs(left);
      // 바람은 사인파로 계속 오르내린다 — 탭 여부와 무관하게 절대 멈추지 않는다.
      const w = 50 + 50 * Math.sin((2 * Math.PI * t) / 1100 - Math.PI / 2);
      windRef.current = w;
      setWind(w);
    }, 30);
  };

  const handleTap = () => {
    if (phase !== 'running') return;
    const w = windRef.current;
    const inGust = w >= gustMin && w <= gustMax;

    if (inGust) {
      // 돌풍 구간 한가운데에 가까울수록 더 많이 올라간다 (타이밍 보너스).
      const mid = (gustMin + gustMax) / 2;
      const halfSpan = Math.max(1, (gustMax - gustMin) / 2);
      const closeness = 1 - Math.min(1, Math.abs(w - mid) / halfSpan);
      const gain = 8 + closeness * 4;
      heightRef.current = Math.min(targetHeight, heightRef.current + gain);
      setFlash('gain');
      sparkleAnim.setValue(1);
      Animated.timing(sparkleAnim, {
        toValue: 0,
        duration: 420,
        useNativeDriver: true,
      }).start();
    } else {
      // 타이밍을 놓치고 감으면 줄이 헛돌며 높이를 까먹는다 — 리스크/리워드.
      heightRef.current = Math.max(0, heightRef.current - 4);
      setFlash('lose');
    }
    setHeight(heightRef.current);

    flashTimeoutRef.current && clearTimeout(flashTimeoutRef.current);
    flashTimeoutRef.current = setTimeout(() => setFlash(null), 380);

    if (heightRef.current >= targetHeight) {
      finish(true);
    }
  };

  useTapKey(handleTap, phase === 'running');

  const retry = () => start();

  const swayX = swayAnim.interpolate({ inputRange: [-1, 1], outputRange: [-14, 14] });
  const sparkleScale = sparkleAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.8] });
  const windPct = Math.max(0, Math.min(100, wind));
  const heightPct = Math.max(0, Math.min(100, (height / targetHeight) * 100));
  const kiteTranslateY = -(Math.min(height, targetHeight) / targetHeight) * 220;
  const seconds = Math.max(0, Math.ceil(timeLeftMs / 1000));

  return (
    <View style={styles.wrap}>
      <Text style={styles.heightText}>
        {i18nT('높이')} {Math.round(height)} / {i18nT(targetHeight)}
        {phase === 'running' ? i18nT('  ·  {p0}초', { p0: seconds }) : ''}
      </Text>

      <View style={styles.field}>
        <View style={styles.playerMascot} pointerEvents="none">
          <Mascot which={mascot} size={52} />
        </View>

        <Animated.Text
          style={[
            styles.kite,
            {
              transform: [{ translateY: kiteTranslateY }, { translateX: swayX }],
            },
          ]}
        >
          {icon}
        </Animated.Text>

        {/* 잘 감았을 때 연 근처에서 반짝 터지는 피드백 — 숫자 대신 눈에 바로 보이는 보상 연출 */}
        <Animated.Text
          pointerEvents="none"
          style={[
            styles.sparkle,
            {
              transform: [{ translateY: kiteTranslateY }, { scale: sparkleScale }],
              opacity: sparkleAnim,
            },
          ]}
        >
          ✨
        </Animated.Text>

        {flash === 'gain' && <Text style={styles.flashGain}>{i18nT('쭉!')}</Text>}
        {flash === 'lose' && <Text style={styles.flashLose}>{i18nT('바람이 약해요')}</Text>}
      </View>

      {/* 바람 게이지 — 계속 오르내리며, 돌풍 구간(gustMin~gustMax)이 강조되어 있다 */}
      <View style={styles.gaugeTrack}>
        <View
          style={[
            styles.targetBand,
            { left: `${gustMin}%`, width: `${gustMax - gustMin}%` },
          ]}
        />
        <View style={[styles.gaugeFill, { width: `${windPct}%`, backgroundColor: color }]} />
      </View>
      <Text style={styles.windLabel}>{i18nT('바람')} {Math.round(wind)}</Text>

      {/* 높이 진행도 */}
      <View style={styles.heightTrack}>
        <View style={[styles.heightFill, { width: `${heightPct}%`, backgroundColor: color }]} />
      </View>

      {phase === 'ready' && (
        <Pressable style={[styles.bigBtn, { backgroundColor: color }]} onPress={start}>
          <Text style={styles.bigBtnText}>{i18nT('시작하기')}</Text>
        </Pressable>
      )}
      {phase === 'running' && (
        <Pressable style={[styles.tapBtn, { borderColor: color }]} onPress={handleTap}>
          <Text style={[styles.tapBtnText, { color }]}>{i18nT('얼레 감기!')}</Text>
        </Pressable>
      )}
      {phase === 'done' && (
        <Pressable style={[styles.bigBtn, { backgroundColor: color }]} onPress={retry}>
          <Text style={styles.bigBtnText}>{i18nT('다시 하기')}</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', width: '100%', flex: 1, justifyContent: 'center' },
  heightText: { fontSize: 14, fontWeight: '700', color: colors.ink, marginBottom: 10 },
  field: {
    width: '100%',
    maxWidth: 300,
    height: 260,
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginBottom: 12,
  },
  playerMascot: { position: 'absolute', bottom: -10, left: '50%', marginLeft: -26 },
  kite: { position: 'absolute', bottom: 36, fontSize: 44 },
  sparkle: { position: 'absolute', bottom: 36, fontSize: 30 },
  flashGain: {
    position: 'absolute',
    top: 6,
    alignSelf: 'center',
    fontSize: 18,
    fontWeight: '800',
    color: colors.green,
  },
  flashLose: {
    position: 'absolute',
    top: 6,
    alignSelf: 'center',
    fontSize: 15,
    fontWeight: '800',
    color: colors.accent,
  },
  gaugeTrack: {
    width: '100%',
    maxWidth: 420,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(0,0,0,0.08)',
    overflow: 'hidden',
    marginBottom: 4,
  },
  targetBand: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(120,190,120,0.5)',
  },
  gaugeFill: { height: '100%' },
  windLabel: { fontSize: 12.5, fontWeight: '700', color: colors.muted, marginBottom: 14 },
  heightTrack: {
    width: '100%',
    maxWidth: 420,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(0,0,0,0.08)',
    overflow: 'hidden',
    marginBottom: 20,
  },
  heightFill: { height: '100%', borderRadius: 5 },
  bigBtn: { minWidth: 200, alignItems: 'center', paddingHorizontal: 30, paddingVertical: 14, borderRadius: 4, borderBottomWidth: 4, borderBottomColor: 'rgba(0,0,0,0.28)' },
  bigBtnText: { color: '#fff', fontWeight: '700', fontSize: 17, letterSpacing: 1 },
  tapBtn: {
    width: 220,
    height: 220,
    borderRadius: 110,
    borderWidth: 4,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.paper,
  },
  tapBtnText: { fontWeight: '700', fontSize: 17 },
});
