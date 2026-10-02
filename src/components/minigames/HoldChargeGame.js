import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { colors } from '../../theme';
import { useHoldKey } from '../../utils/useTapKey';

// 힘 조절형 놀이(구슬치기·팽이치기·자치기·딱지치기 등) 공통 엔진.
// 누르고 있으면 힘 게이지가 오르내리고, 목표 구간 안에서 손을 떼면 성공.
export default function HoldChargeGame({ oscSpeedMs, targetMin, targetMax, color, onComplete }) {
  const [phase, setPhase] = useState('ready'); // ready | charging | done
  const [power, setPower] = useState(0);
  const powerRef = useRef(0);
  const startRef = useRef(0);
  const timerRef = useRef(null);

  useEffect(() => () => timerRef.current && clearInterval(timerRef.current), []);

  const startCharge = () => {
    if (phase !== 'ready') return;
    setPhase('charging');
    startRef.current = Date.now();
    timerRef.current = setInterval(() => {
      const t = Date.now() - startRef.current;
      const p = 50 + 50 * Math.sin((2 * Math.PI * t) / oscSpeedMs - Math.PI / 2);
      powerRef.current = p;
      setPower(p);
    }, 30);
  };

  const release = () => {
    if (phase !== 'charging') return;
    clearInterval(timerRef.current);
    const p = powerRef.current;
    const success = p >= targetMin && p <= targetMax;
    setPhase('done');
    onComplete({ success, score: Math.round(p), elapsedMs: Date.now() - startRef.current });
  };

  const retry = () => {
    powerRef.current = 0;
    setPower(0);
    setPhase('ready');
  };

  useHoldKey(startCharge, release, true);

  return (
    <View style={styles.wrap}>
      <View style={styles.gaugeTrack}>
        <View
          style={[styles.targetBand, { left: `${targetMin}%`, width: `${targetMax - targetMin}%` }]}
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
  gaugeTrack: {
    width: '100%',
    maxWidth: 420,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(0,0,0,0.08)',
    overflow: 'hidden',
    marginBottom: 16,
  },
  targetBand: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(120,190,120,0.45)',
  },
  gaugeFill: { height: '100%' },
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
  },
  tapBtnText: { fontWeight: '700', fontSize: 19 },
});
