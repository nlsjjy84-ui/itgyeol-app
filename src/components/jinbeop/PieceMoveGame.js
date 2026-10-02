import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { colors } from '../../theme';

function shuffleAssignment(n) {
  const arr = Array.from({ length: n }, (_, i) => i);
  let guard = 0;
  do {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    guard += 1;
  } while (guard < 8 && n > 1 && arr.every((v, i) => v === i));
  return arr;
}

function timeLimitFor(n, streak) {
  const base = 5000 + n * 900;
  return Math.max(2600, Math.round(base * Math.max(0.5, 1 - streak * 0.08)));
}

// 원진 — 드래그나 그리기가 아니라 "말을 움직이듯" 한 자리를 짚고 다음 자리를 짚으면
// 그 두 사람이 자리를 맞바꾸는, 장기·바둑알처럼 한 수 한 수 옮기는 조작 방식.
export default function PieceMoveGame({ positions, color, streak = 0, onSuccess, onFail }) {
  const n = positions.length;
  const [assignment, setAssignment] = useState(() => shuffleAssignment(n));
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [phase, setPhase] = useState('ready'); // ready | playing | done
  const [remainingMs, setRemainingMs] = useState(0);
  const [limitMs, setLimitMs] = useState(0);
  const [flash, setFlash] = useState(null);
  const [flashMsg, setFlashMsg] = useState('');

  const sessionStartRef = useRef(Date.now());
  const timerRef = useRef(null);

  const clearTimer = () => {
    timerRef.current && clearInterval(timerRef.current);
    timerRef.current = null;
  };

  const start = () => {
    setAssignment(shuffleAssignment(n));
    setSelectedSlot(null);
    setFlash(null);
    sessionStartRef.current = Date.now();
    clearTimer();
    const limit = timeLimitFor(n, streak);
    setLimitMs(limit);
    setRemainingMs(limit);
    setPhase('playing');
    const deadline = Date.now() + limit;
    timerRef.current = setInterval(() => {
      const left = deadline - Date.now();
      if (left <= 0) {
        clearTimer();
        setRemainingMs(0);
        setPhase('ready');
        const msg = '시간이 다 됐어요. 다시 자리를 옮겨볼까요?';
        setFlash('wrong');
        setFlashMsg(msg);
        onFail && onFail(msg);
      } else {
        setRemainingMs(left);
      }
    }, 100);
  };

  const tapSlot = (slotIndex) => {
    if (phase !== 'playing') return;
    if (selectedSlot === null) {
      setSelectedSlot(slotIndex);
      return;
    }
    if (selectedSlot === slotIndex) {
      setSelectedSlot(null);
      return;
    }
    setAssignment((prev) => {
      const next = prev.slice();
      const tmp = next[selectedSlot];
      next[selectedSlot] = next[slotIndex];
      next[slotIndex] = tmp;
      const allCorrect = next.every((personId, i) => personId === i);
      if (allCorrect) {
        clearTimer();
        const elapsed = Date.now() - sessionStartRef.current;
        setPhase('done');
        setFlash('success');
        onSuccess && onSuccess(elapsed);
      }
      return next;
    });
    setSelectedSlot(null);
  };

  const correctCount = assignment.filter((personId, i) => personId === i).length;
  const ratio = limitMs ? remainingMs / limitMs : 1;
  const timerColor = ratio > 0.5 ? '#4c9a5a' : ratio > 0.2 ? '#c18a2f' : '#b2482f';

  return (
    <View style={styles.wrap}>
      <Text style={styles.roundText}>
        {phase === 'playing'
          ? `제자리 ${correctCount} / ${n}명 · 한 명을 짚고 바꿀 자리를 짚어보세요`
          : '말을 옮기듯, 한 사람을 짚고 바꿀 자리를 짚어 자리를 바꿔보세요'}
      </Text>

      {phase === 'playing' && (
        <View style={styles.timeTrack}>
          <View style={[styles.timeFill, { width: `${Math.max(0, Math.min(100, ratio * 100))}%`, backgroundColor: timerColor }]} />
        </View>
      )}

      <View style={styles.field}>
        {positions.map((p, slotIndex) => (
          <Pressable
            key={slotIndex}
            onPress={() => tapSlot(slotIndex)}
            style={[
              styles.slot,
              {
                left: `${p.x * 100}%`,
                top: `${p.y * 100}%`,
                borderColor: selectedSlot === slotIndex ? '#2f8f4e' : color,
                borderWidth: selectedSlot === slotIndex ? 3 : 1.5,
              },
            ]}
          >
            <Text style={styles.slotText}>{assignment[slotIndex] + 1}</Text>
          </Pressable>
        ))}
        {flash === 'success' && <Text style={styles.flashHit}>원진 완성! 모두 제자리를 찾았어요</Text>}
        {flash === 'wrong' && <Text style={styles.flashMiss}>{flashMsg}</Text>}
      </View>

      {phase !== 'playing' && (
        <Pressable style={[styles.bigBtn, { backgroundColor: color }]} onPress={start}>
          <Text style={styles.bigBtnText}>{phase === 'done' ? '다시 섞어보기' : '시작하기'}</Text>
        </Pressable>
      )}
    </View>
  );
}

const SLOT_SIZE = 32;

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', width: '100%', flex: 1, justifyContent: 'center' },
  roundText: { fontSize: 12.5, fontWeight: '700', color: colors.accentDeep, marginBottom: 8, textAlign: 'center', paddingHorizontal: 10 },
  timeTrack: {
    width: '100%',
    maxWidth: 300,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(0,0,0,0.08)',
    overflow: 'hidden',
    marginBottom: 12,
  },
  timeFill: { height: '100%' },
  field: {
    width: '100%',
    maxWidth: 300,
    height: 260,
    position: 'relative',
    backgroundColor: 'rgba(0,0,0,0.04)',
    borderRadius: 16,
    marginBottom: 14,
  },
  slot: {
    position: 'absolute',
    width: SLOT_SIZE,
    height: SLOT_SIZE,
    borderRadius: SLOT_SIZE / 2,
    marginLeft: -SLOT_SIZE / 2,
    marginTop: -SLOT_SIZE / 2,
    backgroundColor: colors.paper,
    alignItems: 'center',
    justifyContent: 'center',
  },
  slotText: { fontSize: 12, fontWeight: '800', color: colors.ink },
  flashHit: {
    position: 'absolute',
    top: 8,
    left: 8,
    right: 8,
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '800',
    color: '#2f8f4e',
  },
  flashMiss: {
    position: 'absolute',
    top: 8,
    left: 8,
    right: 8,
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '800',
    color: '#b2482f',
  },
  bigBtn: { paddingHorizontal: 30, paddingVertical: 16, borderRadius: 20 },
  bigBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
