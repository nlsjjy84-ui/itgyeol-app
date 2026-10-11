import React, { useEffect, useRef, useState } from 'react';
import { useAutoStart } from '../../ui/Mission';
import { View, StyleSheet, Pressable } from 'react-native';
import Text from '../../ui/Text';
import { useTime } from '../../ui/Mission';
import SealButton from '../../ui/SealButton';
import { play } from '../../utils/sound';
import { colors } from '../../theme';
import Madang from '../../ui/Madang';
import { t as i18nT } from '../../i18n';

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
  const { timed, scaleMs } = useTime();
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
    const limit = scaleMs(timeLimitFor(n, streak));
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
        const msg = i18nT('시간이 다 됐어요. 다시 자리를 옮겨볼까요?');
        setFlash('wrong');
        setFlashMsg(msg);
        onFail && onFail(msg);
      } else {
        setRemainingMs(left);
      }
    }, 100);
  };
  useAutoStart(phase === 'ready', start);

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
  const timerColor = ratio > 0.5 ? colors.green : ratio > 0.2 ? colors.gold : colors.accent;

  // 미션 안내에서 이미 '시작하기'를 눌렀으므로 바로 시작한다(실패·완료 뒤에만 다시 시작 버튼이 보인다).
  useEffect(() => {
    start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <View style={styles.wrap}>
      <Text style={styles.roundText}>
        {phase === 'playing'
          ? i18nT('제자리 {p0} / {p1}명 · 한 명을 짚고 바꿀 자리를 짚어 봐', { p0: correctCount, p1: n })
          : i18nT('말을 옮기듯, 한 사람을 짚고 바꿀 자리를 짚어 자리를 바꿔 보자')}
      </Text>

      {phase === 'playing' && (
        <View style={styles.timeTrack}>
          <View style={[styles.timeFill, { width: `${Math.max(0, Math.min(100, ratio * 100))}%`, backgroundColor: timerColor }]} />
        </View>
      )}

      <View style={styles.field}>
        <Madang variant="court" seed={52} />
        {positions.map((p, slotIndex) => (
          <Pressable
            key={slotIndex}
            onPress={() => tapSlot(slotIndex)}
            style={[
              styles.slot,
              {
                left: `${p.x * 100}%`,
                top: `${p.y * 100}%`,
                borderColor: selectedSlot === slotIndex ? colors.green : color,
                borderWidth: selectedSlot === slotIndex ? 4 : 2.5,
              },
            ]}
          >
            <Text style={styles.slotText}>{assignment[slotIndex] + 1}</Text>
          </Pressable>
        ))}
        {flash === 'success' && <Text style={styles.flashHit}>{i18nT('원진 완성! 모두 제자리를 찾았어요')}</Text>}
        {flash === 'wrong' && <Text style={styles.flashMiss}>{i18nT(flashMsg)}</Text>}
      </View>

      {phase !== 'playing' && (
        <SealButton label={phase === 'done' ? i18nT('다시 섞어보기') : i18nT('시작하기')} onPress={start} sound="drum" style={{ marginTop: 6, minWidth: 200 }} />
      )}
    </View>
  );
}

const SLOT_SIZE = 44;

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', width: '100%', flex: 1, justifyContent: 'flex-start', paddingTop: 6 },
  roundText: { fontSize: 14, fontWeight: '800', color: colors.ink, marginBottom: 8, textAlign: 'center', backgroundColor: colors.accentSoft, paddingHorizontal: 14, paddingVertical: 6, borderRadius: 3, overflow: 'hidden' },
  timeTrack: {
    width: '100%',
    maxWidth: 340,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(0,0,0,0.08)',
    overflow: 'hidden',
    marginBottom: 12,
  },
  timeFill: { height: '100%' },
  field: {
    overflow: 'hidden',
    width: '100%',
    maxWidth: 340,
    height: 330,
    position: 'relative',
    backgroundColor: colors.paper,
    borderWidth: 2,
    borderColor: colors.ink,
    borderRadius: 6,
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
  slotText: { fontSize: 18, fontWeight: '800', color: colors.ink },
  flashHit: {
    position: 'absolute',
    top: 8,
    left: 8,
    right: 8,
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '800',
    color: colors.green,
  },
  flashMiss: {
    position: 'absolute',
    top: 8,
    left: 8,
    right: 8,
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '800',
    color: colors.accent,
  },
  bigBtn: { minWidth: 200, alignItems: 'center', paddingHorizontal: 30, paddingVertical: 14, borderRadius: 4, borderBottomWidth: 4, borderBottomColor: 'rgba(0,0,0,0.28)' },
  bigBtnText: { color: '#fff', fontWeight: '700', fontSize: 17, letterSpacing: 1 },
});
