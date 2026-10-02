import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Animated } from 'react-native';
import { colors } from '../../theme';
import { useTapKey } from '../../utils/useTapKey';

// 연타형 놀이(줄넘기·고무줄놀이·연날리기 등) 공통 엔진.
// 제한 시간 안에 목표 횟수만큼 두드리면 성공.
// mode='rise'면 아이콘이 진행률만큼 위로 떠오르고(연날리기),
// mode='bounce'면 두드릴 때마다 아이콘이 통통 튄다(줄넘기·고무줄놀이).
export default function MashGame({
  durationMs,
  targetTaps,
  icon = '✋',
  mode = 'bounce',
  color,
  onComplete,
}) {
  const [phase, setPhase] = useState('ready'); // ready | running | done
  const [taps, setTaps] = useState(0);
  const [timeLeftMs, setTimeLeftMs] = useState(durationMs);
  const startRef = useRef(0);
  const tapsRef = useRef(0);
  const timerRef = useRef(null);
  const bounceAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => () => timerRef.current && clearInterval(timerRef.current), []);

  const finish = () => {
    clearInterval(timerRef.current);
    const success = tapsRef.current >= targetTaps;
    setPhase('done');
    onComplete({ success, score: tapsRef.current, elapsedMs: durationMs });
  };

  const start = () => {
    tapsRef.current = 0;
    setTaps(0);
    setTimeLeftMs(durationMs);
    setPhase('running');
    startRef.current = Date.now();
    timerRef.current = setInterval(() => {
      const left = durationMs - (Date.now() - startRef.current);
      if (left <= 0) {
        setTimeLeftMs(0);
        finish();
      } else {
        setTimeLeftMs(left);
      }
    }, 100);
  };

  const handleTap = () => {
    if (phase !== 'running') return;
    tapsRef.current += 1;
    setTaps(tapsRef.current);
    if (mode === 'bounce') {
      bounceAnim.setValue(0);
      Animated.sequence([
        Animated.timing(bounceAnim, { toValue: 1, duration: 90, useNativeDriver: true }),
        Animated.timing(bounceAnim, { toValue: 0, duration: 140, useNativeDriver: true }),
      ]).start();
    }
  };

  useTapKey(handleTap, phase === 'running');

  const pct = Math.min(1, taps / targetTaps);
  const bounceY = bounceAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -34] });
  const riseY = -pct * 110;

  return (
    <View style={styles.wrap}>
      <View style={styles.field}>
        <Animated.Text
          style={[
            styles.icon,
            mode === 'rise'
              ? { transform: [{ translateY: riseY }] }
              : { transform: [{ translateY: bounceY }] },
          ]}
        >
          {icon}
        </Animated.Text>
      </View>
      <View style={styles.gaugeTrack}>
        <View style={[styles.gaugeFill, { width: `${pct * 100}%`, backgroundColor: color }]} />
      </View>
      <Text style={styles.count}>
        {taps} / {targetTaps}
        {phase === 'running' ? `  ·  ${(timeLeftMs / 1000).toFixed(1)}초` : ''}
      </Text>

      {phase !== 'running' ? (
        <Pressable style={[styles.bigBtn, { backgroundColor: color }]} onPress={start}>
          <Text style={styles.bigBtnText}>{phase === 'ready' ? '시작하기' : '다시 하기'}</Text>
        </Pressable>
      ) : (
        <Pressable style={[styles.tapBtn, { borderColor: color }]} onPress={handleTap}>
          <Text style={[styles.tapBtnText, { color }]}>두드리기!</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', width: '100%', flex: 1, justifyContent: 'center' },
  field: { height: 130, alignItems: 'center', justifyContent: 'flex-end', marginBottom: 6 },
  icon: { fontSize: 52 },
  gaugeTrack: {
    width: '100%',
    maxWidth: 420,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(0,0,0,0.08)',
    overflow: 'hidden',
    marginBottom: 16,
  },
  gaugeFill: { height: '100%', borderRadius: 11 },
  count: { fontSize: 16, fontWeight: '700', color: colors.ink, marginBottom: 24 },
  bigBtn: { paddingHorizontal: 36, paddingVertical: 18, borderRadius: 22 },
  bigBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  tapBtn: {
    width: 240,
    height: 240,
    borderRadius: 120,
    borderWidth: 4,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.paper,
  },
  tapBtnText: { fontWeight: '700', fontSize: 19 },
});
