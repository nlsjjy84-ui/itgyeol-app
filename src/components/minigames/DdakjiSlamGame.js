import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Pressable, Animated, Easing } from 'react-native';
import Text from '../../ui/Text';
import { colors } from '../../theme';
import { useHoldKey } from '../../utils/useTapKey';
import Mascot from '../Mascot';

// 딱지치기 — 구슬치기·비석치기·투호·자치기와 달리 "조준"이 아예 없는 놀이다.
// 실제 딱지치기는 내 딱지를 상대 딱지 옆 바닥에 얼마나 세게, 좋은 타이밍에
// 내리치느냐가 전부다 — 바람(충격파)을 일으켜 상대 딱지를 뒤집으면 이기는 것이지,
// 좌우로 어디를 노리는지는 애초에 중요하지 않다. 그래서 ThrowGame류의
// 화살표 조준(useArrowHold) 축을 통째로 빼고, 오직 "누르고 있는 동안 오르내리는
// 힘(파워) 게이지"라는 단일 축만 남겼다 — useHoldKey만 쓰는 이유.
// 대신 내리치는 손맛을 눈으로 보여주기 위해, 명중 여부와 무관하게
// ①내 딱지가 위에서 아래로 떨어지는 슬램 모션 ②착지 순간의 찌그러짐(스쿼시)
// ③동심원으로 퍼지는 충격파(세게 칠수록 더 크게) ④명중 시 상대 딱지가
// 옆에서 보면 납작해졌다가 돌아오는 2D 방식의 "뒤집힘" 애니메이션을 넣었다.
export default function DdakjiSlamGame({
  rounds = 3,
  oscSpeedMs = 820,
  targetMin = 58,
  targetMax = 80,
  myIcon = '🟦',
  oppIcon = '🟧',
  color,
  onComplete, // ({ success, score, elapsedMs }) => void
  mascot = 'pung',
}) {
  const [phase, setPhase] = useState('ready'); // ready | charging | slamming | done
  const [power, setPower] = useState(0);
  const [round, setRound] = useState(1);
  const [flash, setFlash] = useState(null); // 'hit' | 'miss'
  const [band, setBand] = useState({ min: targetMin, max: targetMax });

  const powerRef = useRef(0);
  const bandRef = useRef({ min: targetMin, max: targetMax });
  const speedRef = useRef(oscSpeedMs);
  const chargeStartRef = useRef(0);
  const sessionStartRef = useRef(Date.now());
  const timerRef = useRef(null);

  // 슬램 모션: 내 딱지가 공중(-90)에서 바닥(0)으로 빠르게 떨어진다.
  const slamAnim = useRef(new Animated.Value(0)).current;
  // 착지 순간의 찌그러짐(스쿼시) — scaleY는 눌리고 scaleX는 퍼진다.
  const squashY = useRef(new Animated.Value(1)).current;
  const squashX = useRef(new Animated.Value(1)).current;
  // 바닥에서 동심원으로 번지는 충격파. 세게 칠수록(명중) 더 크게 퍼진다.
  const shockScale = useRef(new Animated.Value(0.2)).current;
  const shockOpacity = useRef(new Animated.Value(0)).current;
  const [shockHit, setShockHit] = useState(false);
  const [showShock, setShowShock] = useState(false);
  // 상대 딱지 — 명중하면 옆에서 본 것처럼 납작해졌다가(scaleX) 180도 돌며 뒤집힌다.
  const oppScaleX = useRef(new Animated.Value(1)).current;
  const oppRotate = useRef(new Animated.Value(0)).current; // 0 -> 1 (0deg -> 180deg)

  useEffect(() => () => timerRef.current && clearInterval(timerRef.current), []);

  const startCharge = () => {
    if (phase !== 'ready') return;
    setFlash(null);
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
    setBand(bandRef.current);
    setRound(1);
  };

  const release = () => {
    if (phase !== 'charging') return;
    clearInterval(timerRef.current);
    const p = powerRef.current;
    const hit = p >= bandRef.current.min && p <= bandRef.current.max;
    setPhase('slamming');

    // 1) 내 딱지를 공중에서 바닥으로 내리친다 — Easing.in으로 점점 빨라지는
    //    낙하 가속도를 흉내 낸다.
    slamAnim.setValue(0);
    Animated.timing(slamAnim, {
      toValue: 1,
      duration: 180,
      easing: Easing.in(Easing.quad),
      useNativeDriver: true,
    }).start(() => {
      // 2) 착지 순간: 찌그러짐(스쿼시) + 충격파를 동시에 터뜨린다.
      squashY.setValue(1);
      squashX.setValue(1);
      Animated.parallel([
        Animated.sequence([
          Animated.timing(squashY, { toValue: 0.55, duration: 75, useNativeDriver: true }),
          Animated.timing(squashY, { toValue: 1, duration: 75, useNativeDriver: true }),
        ]),
        Animated.sequence([
          Animated.timing(squashX, { toValue: 1.3, duration: 75, useNativeDriver: true }),
          Animated.timing(squashX, { toValue: 1, duration: 75, useNativeDriver: true }),
        ]),
      ]).start();

      setShockHit(hit);
      setShowShock(true);
      shockScale.setValue(0.2);
      shockOpacity.setValue(0.9);
      Animated.parallel([
        Animated.timing(shockScale, {
          toValue: hit ? 2.6 : 1.3,
          duration: 420,
          useNativeDriver: true,
        }),
        Animated.timing(shockOpacity, { toValue: 0, duration: 420, useNativeDriver: true }),
      ]).start(() => setShowShock(false));

      if (hit) {
        // 3) 명중 — 상대 딱지가 옆에서 본 것처럼 납작해졌다가(scaleX) 180도
        //    돌아가며 "뒤집어지는" 느낌을 2D로 흉내 낸다.
        oppScaleX.setValue(1);
        oppRotate.setValue(0);
        Animated.parallel([
          Animated.sequence([
            Animated.timing(oppScaleX, { toValue: 0.05, duration: 170, useNativeDriver: true }),
            Animated.timing(oppScaleX, { toValue: 1, duration: 170, useNativeDriver: true }),
          ]),
          Animated.timing(oppRotate, { toValue: 1, duration: 340, useNativeDriver: true }),
        ]).start();
      } else {
        // 바람은 느꼈지만 뒤집히지는 않은, 아주 작은 흔들림만 준다.
        oppScaleX.setValue(1);
        Animated.sequence([
          Animated.timing(oppScaleX, { toValue: 1.05, duration: 90, useNativeDriver: true }),
          Animated.timing(oppScaleX, { toValue: 1, duration: 90, useNativeDriver: true }),
        ]).start();
      }

      setFlash(hit ? 'hit' : 'miss');
      setTimeout(() => setFlash(null), 550);

      setTimeout(() => {
        if (hit) {
          if (round >= rounds) {
            onComplete({
              success: true,
              score: round,
              elapsedMs: Date.now() - sessionStartRef.current,
            });
            setPhase('done');
            return;
          }
          // 맞혔으니 다음 라운드는 더 어렵게 — 목표 구간을 좁히고 속도를 올린다
          const shrink = Math.max(10, (bandRef.current.max - bandRef.current.min) * 0.8);
          const mid = (bandRef.current.min + bandRef.current.max) / 2;
          bandRef.current = {
            min: Math.max(0, mid - shrink / 2),
            max: Math.min(100, mid + shrink / 2),
          };
          speedRef.current = Math.max(320, speedRef.current * 0.86);
          setBand(bandRef.current);
          setRound((r) => r + 1);
          // 뒤집힌 상대 딱지를 다음 판을 위해 원래 자세로 되돌려둔다.
          oppRotate.setValue(0);
        } else {
          // 못 뒤집으면 처음 난이도로 돌아가 다시 도전
          resetAll();
        }
        powerRef.current = 0;
        setPower(0);
        slamAnim.setValue(0);
        setPhase('ready');
      }, 380);
    });
  };

  useHoldKey(startCharge, release, true);

  const retry = () => {
    resetAll();
    powerRef.current = 0;
    setPower(0);
    slamAnim.setValue(0);
    oppRotate.setValue(0);
    setPhase('ready');
  };

  const slamY = slamAnim.interpolate({ inputRange: [0, 1], outputRange: [-90, 0] });
  const oppRotateDeg = oppRotate.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] });

  return (
    <View style={styles.wrap}>
      <Text style={styles.roundText}>{round} / {rounds} 라운드</Text>

      {/* 좌우 조준이 없으니 이 게임엔 조준 트랙이 없다 — 오직 위에서 아래로
          내리치는 한 축만 존재한다. */}
      <View style={styles.field}>
        <View style={styles.playerMascot} pointerEvents="none">
          <Mascot which={mascot} size={46} />
        </View>

        {/* 상대 딱지 — 좌우로 움직이지 않고 항상 같은 자리에 놓여있다(뒤집는 대상일 뿐). */}
        <Animated.Text
          style={[
            styles.oppTile,
            {
              transform: [{ scaleX: oppScaleX }, { rotate: oppRotateDeg }],
            },
          ]}
        >
          {oppIcon}
        </Animated.Text>

        {/* 바닥에서 퍼지는 충격파 — 명중이면 훨씬 크게 번진다. */}
        {showShock && (
          <Animated.View
            pointerEvents="none"
            style={[
              styles.shockwave,
              {
                borderColor: color,
                opacity: shockOpacity,
                transform: [{ scale: shockScale }],
              },
            ]}
          />
        )}

        {/* 내 딱지 — 평소엔 공중에 띄워뒀다가, 손을 떼는 순간 바닥까지 내리친다. */}
        <Animated.Text
          style={[
            styles.myTile,
            {
              transform: [
                { translateY: slamY },
                { scaleY: squashY },
                { scaleX: squashX },
              ],
            },
          ]}
        >
          {myIcon}
        </Animated.Text>

        <View style={styles.groundLine} />

        {flash === 'hit' && <Text style={styles.flashHit}>뒤집었다!</Text>}
        {flash === 'miss' && <Text style={styles.flashMiss}>안 뒤집혔어요</Text>}
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
          <Text style={[styles.tapBtnText, { color: '#fff' }]}>손 떼서 내리치기!</Text>
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
  field: {
    width: '100%',
    maxWidth: 300,
    height: 150,
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginBottom: 14,
  },
  groundLine: {
    position: 'absolute',
    bottom: 18,
    left: 10,
    right: 10,
    height: 2,
    borderRadius: 1,
    backgroundColor: 'rgba(0,0,0,0.12)',
  },
  playerMascot: { position: 'absolute', bottom: 8, left: '16%', marginLeft: -23 },
  oppTile: {
    position: 'absolute',
    bottom: 18,
    left: '62%',
    marginLeft: -18,
    fontSize: 34,
  },
  myTile: {
    position: 'absolute',
    bottom: 18,
    left: '38%',
    marginLeft: -18,
    fontSize: 34,
  },
  shockwave: {
    position: 'absolute',
    bottom: -2,
    left: '50%',
    marginLeft: -30,
    width: 60,
    height: 60,
    borderRadius: 999,
    borderWidth: 3,
  },
  // 충전 중(또는 충전 직후) 내 딱지가 공중에 떠 있는 위치(-90)와 겹치지 않도록
  // 판정 문구는 필드 바깥 위쪽에 띄운다.
  flashHit: {
    position: 'absolute',
    top: -26,
    alignSelf: 'center',
    fontSize: 18,
    fontWeight: '800',
    color: '#2f8f4e',
  },
  flashMiss: {
    position: 'absolute',
    top: -26,
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
