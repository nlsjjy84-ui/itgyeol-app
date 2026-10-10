import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Pressable, Image } from 'react-native';
import Text from '../../ui/Text';
import { colors } from '../../theme';
import { useTapKey } from '../../utils/useTapKey';

// 포폴에 있던 실제 상모돌리기 원화 — 가운데서 각도에 맞춰 같이 돌아가며
// "진짜로 상모를 돌리고 있는" 느낌을 준다 (이모지 사람 아이콘 대신).
const PUNG_SPIN_IMAGE = require('../../../assets/characters/pung_spin.png');

const RING = 260;
const DOT = 24;
const RADIUS = RING / 2 - DOT / 2 - 6;

// 타이밍형 놀이(상모돌리기 등) 공통 엔진.
// 원을 도는 점이 맨 위의 뚜렷한 "여기!" 구간을 지날 때 탭 해서 목표 횟수만큼 맞히면 성공.
// 맞힐 때마다 회전 속도가 점점 빨라져서 더 어려워진다.
export default function RhythmClickGame({
  speedDegPerSec,
  sweetSpotDeg,
  targetHits,
  maxAttempts,
  icon,
  color,
  onComplete,
}) {
  const [phase, setPhase] = useState('ready'); // ready | running | done
  const [angle, setAngle] = useState(0);
  const [hits, setHits] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [flash, setFlash] = useState(null); // 'hit' | 'miss'
  const angleRef = useRef(0);
  const hitsRef = useRef(0);
  const attemptsRef = useRef(0);
  const speedRef = useRef(speedDegPerSec);
  const startRef = useRef(0);
  const timerRef = useRef(null);
  const flashTimeoutRef = useRef(null);

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
    onComplete({ success, score: hitsRef.current, elapsedMs: Date.now() - startRef.current });
  };

  const start = () => {
    angleRef.current = 0;
    hitsRef.current = 0;
    attemptsRef.current = 0;
    speedRef.current = speedDegPerSec;
    setAngle(0);
    setHits(0);
    setAttempts(0);
    setPhase('running');
    startRef.current = Date.now();
    timerRef.current = setInterval(() => {
      angleRef.current = (angleRef.current + (speedRef.current * 40) / 1000) % 360;
      setAngle(angleRef.current);
    }, 40);
  };

  const handleTap = () => {
    if (phase !== 'running') return;
    attemptsRef.current += 1;
    setAttempts(attemptsRef.current);
    const a = angleRef.current;
    const diff = Math.min(a, 360 - a); // 맨 위(0도)까지의 각도 차이
    const isHit = diff <= sweetSpotDeg;
    if (isHit) {
      hitsRef.current += 1;
      setHits(hitsRef.current);
      setFlash('hit');
      speedRef.current *= 1.12; // 맞힐수록 점점 빨라진다
    } else {
      setFlash('miss');
    }
    flashTimeoutRef.current && clearTimeout(flashTimeoutRef.current);
    flashTimeoutRef.current = setTimeout(() => setFlash(null), 180);

    if (hitsRef.current >= targetHits) {
      finish(true);
    } else if (attemptsRef.current >= maxAttempts) {
      finish(false);
    }
  };

  useTapKey(handleTap, phase === 'running');

  const rad = (angle * Math.PI) / 180;
  const dotX = RING / 2 + Math.sin(rad) * RADIUS - DOT / 2;
  const dotY = RING / 2 - Math.cos(rad) * RADIUS - DOT / 2;

  return (
    <View style={styles.wrap}>
      <View
        style={[
          styles.ring,
          { borderColor: color },
          flash === 'hit' && styles.ringHit,
          flash === 'miss' && styles.ringMiss,
        ]}
      >
        <Pressable
          style={[styles.sweetSpot, { backgroundColor: color }]}
          onPress={handleTap}
        >
          <Text style={styles.sweetSpotLabel}>여기! (클릭)</Text>
        </Pressable>
        <Image
          source={PUNG_SPIN_IMAGE}
          resizeMode="contain"
          style={[styles.centerImage, { transform: [{ rotate: `${angle}deg` }] }]}
        />
        <View style={[styles.movingDot, { left: dotX, top: dotY, backgroundColor: color }]} />
      </View>
      <Text style={styles.count}>
        {hits} / {targetHits} 성공
        {phase === 'running' ? `  ·  ${attempts}/${maxAttempts}번 시도` : ''}
      </Text>

      {phase !== 'running' ? (
        <Pressable style={[styles.bigBtn, { backgroundColor: color }]} onPress={start}>
          <Text style={styles.bigBtnText}>{phase === 'ready' ? '시작하기' : '다시 하기'}</Text>
        </Pressable>
      ) : (
        <Pressable style={[styles.tapBtn, { borderColor: color }]} onPress={handleTap}>
          <Text style={[styles.tapBtnText, { color }]}>맞춰 탭!</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', width: '100%', flex: 1, justifyContent: 'center' },
  ring: {
    width: RING,
    height: RING,
    borderRadius: RING / 2,
    borderWidth: 4,
    marginBottom: 20,
  },
  ringHit: { backgroundColor: 'rgba(120,180,120,0.25)' },
  ringMiss: { backgroundColor: 'rgba(190,100,100,0.18)' },
  sweetSpot: {
    position: 'absolute',
    top: -16,
    left: RING / 2 - 36,
    width: 72,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 3,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  sweetSpotLabel: { color: '#fff', fontWeight: '800', fontSize: 13 },
  centerImage: {
    position: 'absolute',
    top: RING / 2 - 44,
    left: RING / 2 - 44,
    width: 88,
    height: 88,
  },
  movingDot: {
    position: 'absolute',
    width: DOT,
    height: DOT,
    borderRadius: DOT / 2,
  },
  count: { fontSize: 16, fontWeight: '700', color: colors.ink, marginBottom: 24 },
  bigBtn: { paddingHorizontal: 36, paddingVertical: 18, borderRadius: 22 },
  bigBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  tapBtn: {
    width: 240,
    height: 90,
    borderRadius: 26,
    borderWidth: 4,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.paper,
  },
  tapBtnText: { fontWeight: '700', fontSize: 18 },
});
