import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Pressable, Animated } from 'react-native';
import Text from '../../ui/Text';
import { colors } from '../../theme';
import { useHoldKey, useArrowHold } from '../../utils/useTapKey';
import Mascot from '../Mascot';

function randomTargetX() {
  return 24 + Math.random() * 52; // 24~76% 사이에서 매번 새로 등장
}

// 투척형 놀이(구슬치기·비석치기·투호·자치기·딱지치기) 공통 엔진.
// 골프·당구류 게임의 기본 조작(조준 + 파워)을 그대로 가져왔다.
//   1) 화살표 키(←/→)를 누르고 있거나 화면의 ◀/▶ 버튼을 눌러 좌우로 조준한다.
//   2) 버튼(또는 스페이스바)을 누르고 있으면 힘이 오르내리고, 목표 구간에서 손을 떼면 던진다.
// 조준과 파워가 둘 다 맞아야 명중. 맞힐수록 과녁이 좁아지고 속도도 빨라져서 점점 어려워진다.
// 정해진 라운드 수를 연속으로 맞히면 완성.
export default function ThrowGame({
  oscSpeedMs,
  targetMin,
  targetMax,
  rounds = 3,
  icon = '⚪',
  targetIcon = '🎯',
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
  const flightAnim = useRef(new Animated.Value(0)).current;
  // 명중했을 때 상대 쪽 물체(목표물)가 실제로 맞고 튕겨나가는 것처럼 보이게 하는 값.
  const knockAnim = useRef(new Animated.Value(0)).current;
  const [knockDir, setKnockDir] = useState(1);

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
    setPhase('throwing');
    flightAnim.setValue(0);
    Animated.timing(flightAnim, {
      toValue: 1,
      duration: 420,
      useNativeDriver: true,
    }).start(() => {
      setFlash(hit ? 'hit' : 'miss');
      setTimeout(() => setFlash(null), 550);

      if (hit) {
        // 맞혔을 때는 내 쪽에서 던진 게 상대 물체를 실제로 맞고 튕겨나가는 것처럼 보이게 한다
        // (그냥 숫자로 "명중"이 뜨는 게 아니라, 구슬이 상대 구슬을 쳐내는 느낌).
        setKnockDir(aimXRef.current >= targetXRef.current ? 1 : -1);
        knockAnim.setValue(0);
        Animated.sequence([
          Animated.timing(knockAnim, { toValue: 1, duration: 220, useNativeDriver: true }),
        ]).start(() => knockAnim.setValue(0));
        if (round >= rounds) {
          onComplete({
            success: true,
            score: round,
            elapsedMs: Date.now() - sessionStartRef.current,
          });
          setPhase('done');
          return;
        }
        // 맞혔으니 다음 라운드는 더 어렵게 — 목표 구간과 조준 허용치를 좁히고 속도를 올린다
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

  const flightY = flightAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -92] });
  const flightOpacity = flightAnim.interpolate({ inputRange: [0, 0.85, 1], outputRange: [1, 1, 0] });
  const aimed = Math.abs(aimX - targetX) <= aimTol;

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

      {/* 던진 것(icon)이 실제로 목표물(targetIcon)을 향해 날아가 맞고 튕겨나가는 한 장면.
          그냥 "명중/빗나감" 숫자 판정이 아니라, 내 쪽 물체가 상대 물체에 가서 부딪히는 걸 보여준다. */}
      <View style={styles.field}>
        {/* 말풍선 속 안내자가 아니라, 실제로 이 자리에서 던지고 있는 캐릭터. */}
        <View style={styles.playerMascot} pointerEvents="none">
          <Mascot which={mascot} size={46} />
        </View>
        <Animated.Text
          style={[
            styles.targetObj,
            {
              left: `${targetX}%`,
              transform: [
                {
                  translateX: knockAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, knockDir * 46],
                  }),
                },
                { scale: knockAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 0.7] }) },
              ],
              opacity: knockAnim.interpolate({ inputRange: [0, 0.7, 1], outputRange: [1, 0.3, 0] }),
            },
          ]}
        >
          {targetIcon}
        </Animated.Text>
        {phase === 'throwing' && (
          <Animated.Text
            style={[
              styles.projectile,
              { left: `${aimX}%`, transform: [{ translateY: flightY }], opacity: flightOpacity },
            ]}
          >
            {icon}
          </Animated.Text>
        )}
        {phase !== 'throwing' && (
          <Text style={[styles.projectileIdle, { left: `${aimX}%` }]}>{icon}</Text>
        )}
        {flash === 'hit' && <Text style={styles.flashHit}>명중! 맞혔다</Text>}
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
          <Text style={[styles.tapBtnText, { color: '#fff' }]}>손 떼서 치기!</Text>
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
  targetMark: { position: 'absolute', top: -2, fontSize: 24, marginLeft: -12 },
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
  field: {
    width: '100%',
    maxWidth: 300,
    height: 110,
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginBottom: 10,
  },
  targetObj: { fontSize: 30, position: 'absolute', top: 2, marginLeft: -15 },
  playerMascot: { position: 'absolute', bottom: -10, left: '22%', marginLeft: -23 },
  projectile: { fontSize: 36, position: 'absolute', bottom: 4, marginLeft: -18 },
  projectileIdle: { fontSize: 36, position: 'absolute', bottom: 4, marginLeft: -18 },
  flashHit: {
    position: 'absolute',
    top: 30,
    alignSelf: 'center',
    fontSize: 18,
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
