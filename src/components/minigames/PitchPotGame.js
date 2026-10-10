import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Pressable, Animated } from 'react-native';
import Text from '../../ui/Text';
import { colors } from '../../theme';
import { useHoldKey, useArrowHold } from '../../utils/useTapKey';
import Mascot from '../Mascot';

function randomTargetX() {
  return 24 + Math.random() * 52; // 24~76% 사이에서 매번 새로 등장 (항아리 위치)
}

// 놀이판을 고정 픽셀 폭으로 두는 이유: 포물선 애니메이션은 transform(translateX/translateY)으로
// 네이티브 드라이버를 태워야 부드러운데, transform은 "left: 40%" 같은 퍼센트 값을 직접
// 보간할 수 없다. 그래서 이 컴포넌트만 예외적으로 조준/목표 위치를 퍼센트 대신
// 픽셀(px)로 환산해 두고, translateX를 그 픽셀 차이만큼만 움직인다.
const FIELD_W = 280;
const FIELD_H = 170;

// 투호(投壺) — 궁중/양반가에서 즐기던 놀이로, 일정 거리 떨어진 항아리에 화살을 던져 넣는다.
// 이 앱의 다른 투척형 놀이(구슬치기 등)는 위로 통통 튀었다 제자리에 떨어지는 수직 움직임이지만,
// 투호는 실제로 활을 쏘듯 "멀리 포물선을 그리며 날아가 항아리 입구로 떨어지는" 동작이 핵심이다.
// 그래서 궤적을 수직 팝업이 아니라 진짜 포물선(올라갔다 내려오는 곡선)으로 구현한다.
//   1) 화살표 키(←/→) 또는 화면의 ◀/▶ 버튼으로 좌우 조준.
//   2) 버튼(또는 스페이스바)을 누르고 있으면 힘(던지는 세기)이 오르내리고, 적절한 구간에서
//      손을 떼면 그 세기만큼 포물선을 그리며 화살이 날아간다.
// 조준과 세기가 둘 다 맞아야 항아리에 명중. 맞힐수록 항아리가 좁아지고(조준 허용치 감소),
// 세기 구간도 좁아지고 빨라져서 점점 어려워진다. 정해진 라운드를 연속으로 맞히면 완성.
export default function PitchPotGame({
  rounds = 3,
  arrowIcon = '🏹',
  jarIcon = '🏺',
  oscSpeedMs = 760,
  targetMin = 60,
  targetMax = 84,
  color,
  onComplete,
  mascot = 'pung',
}) {
  const [phase, setPhase] = useState('ready'); // ready | charging | throwing | done
  const [power, setPower] = useState(0);
  const [round, setRound] = useState(1);
  const [flash, setFlash] = useState(null); // 'hit' | 'miss'
  const [band, setBand] = useState({ min: targetMin, max: targetMax });
  const [aimX, setAimX] = useState(50);
  const [targetX, setTargetX] = useState(randomTargetX());
  const [aimTol, setAimTol] = useState(16);

  const powerRef = useRef(0);
  const bandRef = useRef({ min: targetMin, max: targetMax });
  const speedRef = useRef(oscSpeedMs);
  const aimXRef = useRef(50);
  const targetXRef = useRef(targetX);
  const aimTolRef = useRef(16);
  const chargeStartRef = useRef(0);
  const sessionStartRef = useRef(Date.now());
  const timerRef = useRef(null);

  // 화살의 포물선 비행(0→1)을 담당하는 값. translateX/translateY/rotate를 전부 이 하나로 보간한다.
  const flightAnim = useRef(new Animated.Value(0)).current;
  // 명중했을 때 화살이 항아리 속으로 빨려들어가듯 작아지며 사라지는 값.
  const absorbAnim = useRef(new Animated.Value(1)).current;
  // 명중했을 때 항아리가 "화살을 받았다"는 느낌으로 살짝 출렁이는 값(세로로 눌렸다 펴짐).
  const jarPulseAnim = useRef(new Animated.Value(1)).current;

  // 비행이 시작된 순간의 발사 위치/착지 위치를 픽셀로 고정해 둔다(애니메이션 도중 state가
  // 바뀌어도 이번 비행 궤적은 흔들리지 않도록).
  const launchXpxRef = useRef(0);
  const landXpxRef = useRef(0);

  useEffect(() => () => timerRef.current && clearInterval(timerRef.current), []);

  const moveAim = (delta) => {
    aimXRef.current = Math.max(4, Math.min(96, aimXRef.current + delta));
    setAimX(aimXRef.current);
  };

  const startCharge = () => {
    if (phase !== 'ready') return;
    setPhase('charging');
    chargeStartRef.current = Date.now();
    timerRef.current = setInterval(() => {
      const t = Date.now() - chargeStartRef.current;
      const p = 50 + 50 * Math.sin((2 * Math.PI * t) / speedRef.current - Math.PI / 2);
      powerRef.current = p;
      setPower(p);
    }, 30);
  };

  const resetAll = () => {
    bandRef.current = { min: targetMin, max: targetMax };
    speedRef.current = oscSpeedMs;
    aimTolRef.current = 16;
    setBand(bandRef.current);
    setAimTol(16);
    setRound(1);
  };

  const nextTarget = () => {
    targetXRef.current = randomTargetX();
    setTargetX(targetXRef.current);
  };

  const release = () => {
    if (phase !== 'charging') return;
    clearInterval(timerRef.current);
    const p = powerRef.current;
    const powerHit = p >= bandRef.current.min && p <= bandRef.current.max;
    const aimHit = Math.abs(aimXRef.current - targetXRef.current) <= aimTolRef.current;
    const hit = powerHit && aimHit;

    // 조준/목표를 픽셀로 환산 — 이번 한 번의 비행 궤적 계산용으로만 쓴다.
    const launchXpx = (aimXRef.current / 100) * FIELD_W;
    const targetXpx = (targetXRef.current / 100) * FIELD_W;
    // 명중이면 화살은 당연히 항아리 입구(targetXpx)에 꽂힌다.
    // 빗나가면(조준이 틀렸든 세기가 틀렸든) 화살은 실제로 조준했던 자리 근처에 떨어진
    // 것처럼 보이게 해서 "허공으로 날아가 항아리를 벗어났다"는 느낌을 준다.
    const landXpx = hit ? targetXpx : launchXpx;
    launchXpxRef.current = launchXpx;
    landXpxRef.current = landXpx;

    setPhase('throwing');
    absorbAnim.setValue(1);
    flightAnim.setValue(0);
    Animated.timing(flightAnim, {
      toValue: 1,
      duration: 480,
      useNativeDriver: true,
    }).start(() => {
      setFlash(hit ? 'hit' : 'miss');
      setTimeout(() => setFlash(null), 550);

      if (hit) {
        // 항아리가 화살을 "받는" 작은 펄스 + 화살이 항아리 속으로 줄어들며 사라지는 연출.
        jarPulseAnim.setValue(1);
        Animated.sequence([
          Animated.timing(jarPulseAnim, { toValue: 1.15, duration: 90, useNativeDriver: true }),
          Animated.timing(jarPulseAnim, { toValue: 1, duration: 110, useNativeDriver: true }),
        ]).start();
        Animated.timing(absorbAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }).start();

        if (round >= rounds) {
          onComplete({
            success: true,
            score: round,
            elapsedMs: Date.now() - sessionStartRef.current,
          });
          setPhase('done');
          return;
        }
        // 맞혔으니 다음 라운드는 더 어렵게 — 세기 구간과 조준 허용치를 좁히고 속도를 올린다
        const shrink = Math.max(10, (bandRef.current.max - bandRef.current.min) * 0.8);
        const mid = (bandRef.current.min + bandRef.current.max) / 2;
        bandRef.current = {
          min: Math.max(0, mid - shrink / 2),
          max: Math.min(100, mid + shrink / 2),
        };
        speedRef.current = Math.max(320, speedRef.current * 0.86);
        aimTolRef.current = Math.max(6, aimTolRef.current * 0.78);
        setBand(bandRef.current);
        setAimTol(aimTolRef.current);
        setRound((r) => r + 1);
        nextTarget();
      } else {
        // 빗나가면 처음 난이도로 돌아가 다시 도전
        resetAll();
        nextTarget();
      }
      powerRef.current = 0;
      setPower(0);
      setPhase('ready');
    });
  };

  useHoldKey(startCharge, release, true);
  useArrowHold(
    () => moveAim(-3),
    () => moveAim(3),
    phase === 'ready' || phase === 'charging'
  );

  const retry = () => {
    resetAll();
    nextTarget();
    powerRef.current = 0;
    setPower(0);
    setPhase('ready');
  };

  // 포물선: 가로(translateX)는 발사 위치→착지 위치를 픽셀 차이만큼 선형 이동,
  // 세로(translateY)는 0 → -130(정점) → 0으로 올라갔다 내려오는 곡선을 그린다.
  // 수직 통통 튀기가 아니라 "날아가는" 느낌을 주는 게 이 컴포넌트의 핵심 차별점.
  const flightTranslateX = flightAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, landXpxRef.current - launchXpxRef.current],
  });
  const flightTranslateY = flightAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, -130, 0],
  });
  const flightRotate = flightAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '45deg'],
  });

  const aimed = Math.abs(aimX - targetX) <= aimTol;
  const aimXpx = (aimX / 100) * FIELD_W;
  const targetXpx = (targetX / 100) * FIELD_W;

  return (
    <View style={styles.wrap}>
      <Text style={styles.roundText}>{round} / {rounds} 라운드</Text>

      <View style={styles.aimTrack}>
        <View
          style={[
            styles.aimZone,
            {
              left: `${Math.max(0, targetX - aimTol)}%`,
              width: `${Math.min(100, aimTol * 2)}%`,
              backgroundColor: aimed ? 'rgba(90,180,110,0.55)' : 'rgba(0,0,0,0.08)',
            },
          ]}
        />
        <Text style={[styles.aimMark, { left: `${aimX}%`, color }]}>▲</Text>
      </View>
      <View style={styles.aimBtnRow}>
        <Pressable style={[styles.aimBtn, { borderColor: color }]} onPress={() => moveAim(-6)}>
          <Text style={[styles.aimBtnText, { color }]}>◀ 조준</Text>
        </Pressable>
        <Text style={styles.aimStatus}>{aimed ? '조준 완료!' : '좌우로 조준하세요'}</Text>
        <Pressable style={[styles.aimBtn, { borderColor: color }]} onPress={() => moveAim(6)}>
          <Text style={[styles.aimBtnText, { color }]}>조준 ▶</Text>
        </Pressable>
      </View>

      {/* 놀이판 — 포물선 계산을 위해 퍼센트가 아니라 고정 픽셀 폭(FIELD_W)을 쓴다. */}
      <View style={styles.field}>
        {/* 말풍선 속 안내자가 아니라, 실제로 이 자리에서 활을 쏘고 있는 캐릭터. */}
        <View style={styles.playerMascot} pointerEvents="none">
          <Mascot which={mascot} size={46} />
        </View>

        <Animated.Text
          style={[
            styles.jar,
            {
              left: targetXpx,
              transform: [{ scaleY: jarPulseAnim }],
            },
          ]}
        >
          {jarIcon}
        </Animated.Text>

        {phase === 'throwing' && (
          <Animated.Text
            style={[
              styles.arrow,
              {
                left: launchXpxRef.current,
                transform: [
                  { translateX: flightTranslateX },
                  { translateY: flightTranslateY },
                  { rotate: flightRotate },
                  { scale: absorbAnim },
                ],
                opacity: absorbAnim,
              },
            ]}
          >
            {arrowIcon}
          </Animated.Text>
        )}
        {phase !== 'throwing' && (
          <Text style={[styles.arrowIdle, { left: aimXpx }]}>{arrowIcon}</Text>
        )}

        {flash === 'hit' && <Text style={styles.flashHit}>명중! 항아리에 꽂혔다</Text>}
        {flash === 'miss' && <Text style={styles.flashMiss}>빗나감</Text>}
      </View>

      <View style={styles.gaugeTrack}>
        <View
          style={[
            styles.targetBand,
            { left: `${band.min}%`, width: `${band.max - band.min}%` },
          ]}
        />
        <View style={[styles.gaugeFill, { width: `${power}%`, backgroundColor: color }]} />
      </View>
      <Text style={styles.count}>힘 {Math.round(power)}</Text>

      {phase === 'ready' && (
        <Pressable style={[styles.bigBtn, { backgroundColor: color }]} onPressIn={startCharge}>
          <Text style={styles.bigBtnText}>누르고 있기</Text>
        </Pressable>
      )}
      {phase === 'charging' && (
        <Pressable
          style={[styles.tapBtn, { borderColor: color, backgroundColor: color }]}
          onPressOut={release}
        >
          <Text style={[styles.tapBtnText, { color: '#fff' }]}>손 떼서 던지기!</Text>
        </Pressable>
      )}
      {phase === 'done' && (
        <Pressable style={[styles.bigBtn, { backgroundColor: color }]} onPress={retry}>
          <Text style={styles.bigBtnText}>다시 하기</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', width: '100%', flex: 1, justifyContent: 'center' },
  roundText: { fontSize: 12.5, fontWeight: '700', color: colors.accentDeep, marginBottom: 10 },
  aimTrack: {
    width: '100%',
    maxWidth: 360,
    height: 30,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.05)',
    marginBottom: 4,
    overflow: 'visible',
  },
  aimZone: { position: 'absolute', top: 0, bottom: 0, borderRadius: 8 },
  aimMark: { position: 'absolute', bottom: -16, fontSize: 16, fontWeight: '900', marginLeft: -8 },
  aimBtnRow: {
    width: '100%',
    maxWidth: 360,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
    marginBottom: 10,
  },
  aimBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 14,
    borderWidth: 2,
    backgroundColor: colors.paper,
  },
  aimBtnText: { fontWeight: '700', fontSize: 12.5 },
  aimStatus: { fontSize: 11.5, fontWeight: '700', color: colors.muted },
  // 고정 픽셀 폭 — 포물선 translateX 계산이 이 값을 기준으로 이뤄진다.
  field: {
    width: FIELD_W,
    height: FIELD_H,
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginBottom: 10,
    position: 'relative',
  },
  jar: { fontSize: 32, position: 'absolute', bottom: 4, marginLeft: -16 },
  playerMascot: { position: 'absolute', bottom: -10, left: 20, marginLeft: -23 },
  arrow: { fontSize: 34, position: 'absolute', bottom: 4, marginLeft: -17 },
  arrowIdle: { fontSize: 34, position: 'absolute', bottom: 4, marginLeft: -17 },
  flashHit: {
    position: 'absolute',
    top: 30,
    alignSelf: 'center',
    fontSize: 16,
    fontWeight: '800',
    color: '#2f8f4e',
  },
  flashMiss: {
    position: 'absolute',
    top: 30,
    alignSelf: 'center',
    fontSize: 16,
    fontWeight: '800',
    color: '#b2482f',
  },
  gaugeTrack: {
    width: '100%',
    maxWidth: 420,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(0,0,0,0.08)',
    overflow: 'hidden',
    marginBottom: 14,
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
