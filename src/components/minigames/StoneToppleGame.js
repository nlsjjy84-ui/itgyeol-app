import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Pressable, Animated } from 'react-native';
import Text from '../../ui/Text';
import { colors } from '../../theme';
import { useHoldKey, useArrowHold } from '../../utils/useTapKey';
import Mascot from '../Mascot';

function randomTargetX() {
  return 24 + Math.random() * 52; // 24~76% 사이에서 매번 새로 등장
}

// 비석치기(비석차기) — ThrowGame과 조작(조준+파워, 화살표/버튼, 충전 후 손 떼서 던지기)은
// 그대로 쓰지만, 명중했을 때 보여주는 장면은 완전히 다르게 간다.
//   ThrowGame은 "맞힌 과녁이 튕겨나가며 사라지는" 연출이라 세워둔 비석이 아니라
//   구슬·투호처럼 날아가 부딪히는 놀이에 어울린다.
//   비석치기의 핵심은 세워둔 비석(돌)을 던진 돌로 맞혀 "넘어뜨리는" 것이므로,
//   여기서는 명중 시 비석이 (1) 휘청휘청 흔들리다가 (2) 옆으로 완전히 쓰러져
//   눕는(rotate 90도) 모습을 실제로 보여준다. 그리고 ThrowGame처럼 과녁이 사라지는 게
//   아니라, 쓰러진 비석이 그 자리에 계속 남아 라운드가 진행될수록 "전적"처럼
//   한 줄로 쌓여간다 — 마지막 자리에만 아직 세워져 있는 현재 비석이 서 있는 식.
// 빗나가면(실패) ThrowGame과 동일하게 난이도(파워 구간·조준 허용치·속도)와 함께
// 지금까지 쓰러뜨린 비석 줄도 전부 리셋한다. 부분 보존(쓰러뜨린 것만 유지하고 난이도만
// 리셋) 쪽이 더 "그럴듯"해 보일 수 있지만, 상태가 둘로 갈라지면 버그 여지가 커지므로
// ThrowGame이 쓰는 "실패하면 처음부터 다시" 원칙을 그대로 따르는 쪽을 택했다(의도적 단순화).
export default function StoneToppleGame({
  oscSpeedMs,
  targetMin,
  targetMax,
  rounds = 3,
  stoneIcon = '🪨',
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
  const [toppled, setToppled] = useState([]); // 지금까지 쓰러뜨린 비석들의 x 위치(%) — 전적처럼 누적

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
  // 현재 서 있는 비석의 회전값(도 단위 숫자) — 휘청임(-10~8도)과 완전히 쓰러짐(90도)을
  // 하나의 값으로 이어서 표현한다.
  const rotateAnim = useRef(new Animated.Value(0)).current;
  // 쓰러지면서 살짝 내려앉는 느낌을 주는 보조 이동값.
  const settleY = useRef(new Animated.Value(0)).current;
  // 빗맞았을 때 비석이 부르르 떨리는 흔들림(좌우).
  const shakeAnim = useRef(new Animated.Value(0)).current;

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
    setToppled([]);
    rotateAnim.setValue(0);
    settleY.setValue(0);
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
      if (hit) {
        setFlash('hit');
        setTimeout(() => setFlash(null), 550);

        // 명중: 먼저 좌우로 휘청대고(짧게 네 번), 그다음 완전히 넘어가 눕는다.
        Animated.sequence([
          Animated.timing(rotateAnim, { toValue: -10, duration: 100, useNativeDriver: true }),
          Animated.timing(rotateAnim, { toValue: 8, duration: 110, useNativeDriver: true }),
          Animated.timing(rotateAnim, { toValue: -5, duration: 100, useNativeDriver: true }),
          Animated.timing(rotateAnim, { toValue: 0, duration: 90, useNativeDriver: true }),
          Animated.parallel([
            Animated.timing(rotateAnim, { toValue: 90, duration: 220, useNativeDriver: true }),
            Animated.timing(settleY, { toValue: 8, duration: 220, useNativeDriver: true }),
          ]),
        ]).start(() => {
          // 쓰러진 비석을 전적 줄에 추가 — 다음 라운드에서도 계속 누워있는 채로 남는다.
          setToppled((prev) => [...prev, targetXRef.current]);

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
          rotateAnim.setValue(0);
          settleY.setValue(0);
          powerRef.current = 0;
          setPower(0);
          setPhase('ready');
        });
      } else {
        setFlash('miss');
        setTimeout(() => setFlash(null), 550);

        // 빗나감: 비석은 넘어가지 않고 제자리에서 부르르 떨기만 한다.
        shakeAnim.setValue(0);
        Animated.sequence([
          Animated.timing(shakeAnim, { toValue: -6, duration: 70, useNativeDriver: true }),
          Animated.timing(shakeAnim, { toValue: 6, duration: 70, useNativeDriver: true }),
          Animated.timing(shakeAnim, { toValue: -4, duration: 70, useNativeDriver: true }),
          Animated.timing(shakeAnim, { toValue: 0, duration: 90, useNativeDriver: true }),
        ]).start(() => {
          // 빗나가면 처음 난이도로 돌아가 다시 도전 (쓰러뜨린 전적도 함께 초기화)
          resetAll();
          nextTarget();
          powerRef.current = 0;
          setPower(0);
          setPhase('ready');
        });
      }
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
  const rotateDeg = rotateAnim.interpolate({ inputRange: [-90, 180], outputRange: ['-90deg', '180deg'] });
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

      {/* 던진 돌(stoneIcon, 작게)이 세워둔 비석을 향해 날아가고, 명중하면 비석이
          휘청대다 넘어가 눕는다. 쓰러진 비석들은 치워지지 않고 그 자리에 계속 남아
          라운드가 진행될수록 한 줄로 쌓여가는 "전적"이 된다. */}
      <View style={styles.field}>
        {/* 말풍선 속 안내자가 아니라, 실제로 이 자리에서 던지고 있는 캐릭터. */}
        <View style={styles.playerMascot} pointerEvents="none">
          <Mascot which={mascot} size={46} />
        </View>

        {toppled.map((x, i) => (
          <Animated.Text
            key={i}
            style={[
              styles.stoneToppled,
              {
                left: `${x}%`,
                transform: [{ rotate: '90deg' }, { translateY: 10 }],
              },
            ]}
          >
            {stoneIcon}
          </Animated.Text>
        ))}

        <Animated.Text
          style={[
            styles.stoneStanding,
            {
              left: `${targetX}%`,
              transform: [
                { translateX: shakeAnim },
                { translateY: settleY },
                { rotate: rotateDeg },
              ],
            },
          ]}
        >
          {stoneIcon}
        </Animated.Text>

        {phase === 'throwing' && (
          <Animated.Text
            style={[
              styles.projectile,
              { left: `${aimX}%`, transform: [{ translateY: flightY }], opacity: flightOpacity },
            ]}
          >
            {stoneIcon}
          </Animated.Text>
        )}
        {phase !== 'throwing' && (
          <Text style={[styles.projectileIdle, { left: `${aimX}%` }]}>{stoneIcon}</Text>
        )}
        {flash === 'hit' && <Text style={styles.flashHit}>명중! 비석이 넘어갔다</Text>}
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
  stoneStanding: { fontSize: 32, position: 'absolute', top: 2, marginLeft: -16 },
  stoneToppled: { fontSize: 26, position: 'absolute', top: 10, marginLeft: -13, opacity: 0.85 },
  playerMascot: { position: 'absolute', bottom: -10, left: '22%', marginLeft: -23 },
  projectile: { fontSize: 20, position: 'absolute', bottom: 4, marginLeft: -10 },
  projectileIdle: { fontSize: 20, position: 'absolute', bottom: 4, marginLeft: -10 },
  flashHit: {
    position: 'absolute',
    top: 30,
    alignSelf: 'center',
    fontSize: 18,
    fontWeight: '800',
    color: colors.green,
  },
  flashMiss: {
    position: 'absolute',
    top: 30,
    alignSelf: 'center',
    fontSize: 16,
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
