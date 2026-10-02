import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Animated, Easing } from 'react-native';
import { colors } from '../../theme';
import { useTapKey } from '../../utils/useTapKey';

// 팽이치기 — 채찍(탭)으로 팽이를 계속 쳐서 회전 속도를 유지하는 놀이.
// 치지 않으면 속도가 점점 줄어들고, 목표 속도 이상을 일정 시간 동안 유지하면 성공한다.
export default function WhipSpinGame({
  holdSec = 4,
  limitSec = 16,
  threshold = 55,
  icon = '🌀',
  color,
  onComplete,
}) {
  const [phase, setPhase] = useState('ready'); // ready | running | done
  const [speed, setSpeed] = useState(0);
  const [heldMs, setHeldMs] = useState(0);
  const [flash, setFlash] = useState(null);
  const speedRef = useRef(0);
  const heldRef = useRef(0);
  const elapsedRef = useRef(0);
  const startRef = useRef(0);
  const timerRef = useRef(null);
  const spinAnim = useRef(new Animated.Value(0)).current;
  const spinLoopRef = useRef(null);

  useEffect(
    () => () => {
      timerRef.current && clearInterval(timerRef.current);
      spinLoopRef.current && spinLoopRef.current.stop();
    },
    []
  );

  const runSpinLoop = (currentSpeed) => {
    spinLoopRef.current && spinLoopRef.current.stop();
    const duration = Math.max(140, 1800 - currentSpeed * 16);
    spinAnim.setValue(0);
    spinLoopRef.current = Animated.loop(
      Animated.timing(spinAnim, {
        toValue: 1,
        duration,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    spinLoopRef.current.start();
  };

  const finish = (success) => {
    clearInterval(timerRef.current);
    spinLoopRef.current && spinLoopRef.current.stop();
    setPhase('done');
    onComplete({
      success,
      score: Math.round(heldRef.current / 100),
      elapsedMs: Date.now() - startRef.current,
    });
  };

  const start = () => {
    speedRef.current = 60;
    heldRef.current = 0;
    elapsedRef.current = 0;
    setSpeed(60);
    setHeldMs(0);
    setPhase('running');
    startRef.current = Date.now();
    runSpinLoop(60);
    timerRef.current = setInterval(() => {
      elapsedRef.current += 150;
      speedRef.current = Math.max(0, speedRef.current - 2.4);
      setSpeed(speedRef.current);
      runSpinLoop(speedRef.current);
      if (speedRef.current >= threshold) {
        heldRef.current += 150;
        setHeldMs(heldRef.current);
      }
      if (heldRef.current >= holdSec * 1000) {
        finish(true);
        return;
      }
      if (speedRef.current <= 0 || elapsedRef.current >= limitSec * 1000) {
        finish(false);
      }
    }, 150);
  };

  const whip = () => {
    if (phase !== 'running') return;
    speedRef.current = Math.min(100, speedRef.current + 16);
    setSpeed(speedRef.current);
    runSpinLoop(speedRef.current);
    setFlash('hit');
    setTimeout(() => setFlash(null), 120);
  };

  useTapKey(whip, phase === 'running');

  const retry = () => {
    setPhase('ready');
  };

  const spinDeg = spinAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const heldPct = Math.min(1, heldMs / (holdSec * 1000));
  const overThreshold = speed >= threshold;

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>
        속도 {threshold} 이상을 {holdSec}초 동안 유지하면 성공!
      </Text>

      <Pressable style={styles.field} onPress={whip} disabled={phase !== 'running'}>
        <Animated.Text style={[styles.topIcon, { transform: [{ rotate: spinDeg }] }]}>
          {icon}
        </Animated.Text>
        {flash === 'hit' && <Text style={styles.whipFlash}>착!</Text>}
      </Pressable>

      <View style={styles.gaugeTrack}>
        <View style={[styles.thresholdMark, { left: `${threshold}%` }]} />
        <View
          style={[
            styles.gaugeFill,
            { width: `${speed}%`, backgroundColor: overThreshold ? '#2f8f4e' : color },
          ]}
        />
      </View>
      <Text style={styles.count}>속도 {Math.round(speed)}</Text>

      <View style={styles.holdTrack}>
        <View style={[styles.holdFill, { width: `${heldPct * 100}%`, backgroundColor: color }]} />
      </View>
      <Text style={styles.holdLabel}>
        유지 {(heldMs / 1000).toFixed(1)} / {holdSec}초
      </Text>

      {phase !== 'running' ? (
        <Pressable style={[styles.bigBtn, { backgroundColor: color }]} onPress={start}>
          <Text style={styles.bigBtnText}>{phase === 'ready' ? '시작하기' : '다시 하기'}</Text>
        </Pressable>
      ) : (
        <Pressable style={[styles.tapBtn, { borderColor: color }]} onPress={whip}>
          <Text style={[styles.tapBtnText, { color }]}>채찍질!</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', width: '100%', flex: 1, justifyContent: 'center' },
  label: { fontSize: 12.5, fontWeight: '700', color: colors.accentDeep, marginBottom: 10, textAlign: 'center' },
  field: { height: 100, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  topIcon: { fontSize: 64 },
  whipFlash: {
    position: 'absolute',
    top: 4,
    fontSize: 16,
    fontWeight: '800',
    color: '#2f8f4e',
  },
  gaugeTrack: {
    width: '100%',
    maxWidth: 420,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(0,0,0,0.08)',
    overflow: 'hidden',
    marginBottom: 8,
  },
  thresholdMark: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 3,
    backgroundColor: 'rgba(30,30,30,0.5)',
    zIndex: 2,
  },
  gaugeFill: { height: '100%' },
  count: { fontSize: 14, fontWeight: '700', color: colors.ink, marginBottom: 14 },
  holdTrack: {
    width: '100%',
    maxWidth: 420,
    height: 12,
    borderRadius: 6,
    backgroundColor: 'rgba(0,0,0,0.06)',
    overflow: 'hidden',
    marginBottom: 6,
  },
  holdFill: { height: '100%' },
  holdLabel: { fontSize: 12, color: colors.muted, fontWeight: '600', marginBottom: 22 },
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
