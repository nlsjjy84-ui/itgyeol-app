import React, { useRef, useState } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import Text from '../../ui/Text';
import { useTime } from '../../ui/Mission';
import { play } from '../../utils/sound';
import Dot from '../Dot';
import { colors } from '../../theme';
import Madang from '../../ui/Madang';
import { t as i18nT } from '../../i18n';

const SNAP_THRESHOLD = 34;

function randomScatter(width, height, n) {
  const pad = 30;
  const pts = [];
  for (let i = 0; i < n; i++) {
    pts.push({
      x: pad + Math.random() * Math.max(1, width - pad * 2),
      y: pad + Math.random() * Math.max(1, height - pad * 2),
    });
  }
  return pts;
}

function timeLimitFor(n, streak) {
  const base = 6000 + n * 1800;
  return Math.max(2600, Math.round(base * Math.max(0.5, 1 - streak * 0.07)));
}

// 일자진·방진 — "퍼즐 조각처럼" 끌어다 점선 자리에 맞춰 넣는 놀이. flowSnake·
// sequentialVault·drawMatch·wingMirror처럼 완전히 새 방식을 만들기보다, 이 둘은
// "멈춘 모양을 그대로 채워 넣는" 감각이 자연스러워서 퍼즐 비유를 그대로 쓴다.
// 드래그뿐 아니라 조각을 짚은 뒤(선택) 빈 자리를 짚어도(클릭만으로도) 맞출 수 있다.
export default function PuzzleFitGame({ positions, color, streak = 0, onSuccess, onFail }) {
  const { timed, scaleMs } = useTime();
  const n = positions.length;
  const [stageSize, setStageSize] = useState({ width: 0, height: 0 });
  const [pieces, setPieces] = useState([]);
  const [resetSignal, setResetSignal] = useState(0);
  const [remainingMs, setRemainingMs] = useState(0);
  const [limitMs, setLimitMs] = useState(0);
  const [flash, setFlash] = useState(null);
  const [selectedIdx, setSelectedIdx] = useState(null);
  const [keyboardMove, setKeyboardMove] = useState({ id: null, x: 0, y: 0, nonce: 0 });

  const piecesRef = useRef([]);
  const settledRef = useRef(false);
  const hasDraggedRef = useRef(false);
  const sessionStartRef = useRef(Date.now());
  const timerRef = useRef(null);
  const stageSizeRef = useRef(stageSize);
  stageSizeRef.current = stageSize;

  const targetPx = stageSize.width
    ? positions.map((p) => ({ x: p.x * stageSize.width, y: p.y * stageSize.height }))
    : [];

  const clearTimer = () => {
    timerRef.current && clearInterval(timerRef.current);
    timerRef.current = null;
  };

  const start = (size) => {
    const s = size || stageSizeRef.current;
    if (!s.width || !s.height) return;
    const scattered = randomScatter(s.width, s.height, n);
    piecesRef.current = scattered;
    setPieces(scattered);
    setResetSignal((v) => v + 1);
    setSelectedIdx(null);
    settledRef.current = false;
    hasDraggedRef.current = false;
    setFlash(null);
    sessionStartRef.current = Date.now();
    clearTimer();
    const limit = scaleMs(timeLimitFor(n, streak));
    setLimitMs(limit);
    setRemainingMs(limit);
    const deadline = Date.now() + limit;
    timerRef.current = setInterval(() => {
      const left = deadline - Date.now();
      if (left <= 0) {
        clearTimer();
        setRemainingMs(0);
        if (!settledRef.current) {
          settledRef.current = true;
          setFlash('wrong');
          onFail && onFail(i18nT('시간이 다 됐어요! 다시 맞춰볼까요?'));
        }
      } else {
        setRemainingMs(left);
      }
    }, 100);
  };

  const onStageLayout = (e) => {
    const { width, height } = e.nativeEvent.layout;
    setStageSize({ width, height });
    if (piecesRef.current.length === 0) start({ width, height });
  };

  const evaluate = () => {
    const targets = positions.map((p) => ({
      x: p.x * stageSizeRef.current.width,
      y: p.y * stageSizeRef.current.height,
    }));
    const used = new Array(n).fill(false);
    let matched = 0;
    targets.forEach((t) => {
      let bestI = -1;
      let bestD = Infinity;
      piecesRef.current.forEach((p, i) => {
        if (used[i]) return;
        const d = Math.hypot(p.x - t.x, p.y - t.y);
        if (d < bestD) {
          bestD = d;
          bestI = i;
        }
      });
      if (bestI !== -1 && bestD <= SNAP_THRESHOLD) {
        used[bestI] = true;
        matched += 1;
      }
    });
    return matched;
  };

  const handleDragEnd = (id, x, y) => {
    const next = piecesRef.current.slice();
    next[id] = { x, y };
    piecesRef.current = next;
    hasDraggedRef.current = true;
    if (settledRef.current) return;
    const matched = evaluate();
    if (matched === n) {
      settledRef.current = true;
      clearTimer();
      const elapsed = Date.now() - sessionStartRef.current;
      setFlash('success');
      onSuccess && onSuccess(elapsed);
    }
  };

  const ratio = limitMs ? remainingMs / limitMs : 1;
  const timerColor = ratio > 0.5 ? colors.green : ratio > 0.2 ? colors.gold : colors.accent;

  return (
    <View style={styles.wrap}>
      <Text style={styles.roundText}>{i18nT('조각을 점선 자리로 끌어다(또는 짚은 뒤 자리를 짚어) 퍼즐을 맞춰보세요')}</Text>

      <View style={styles.timerRow}>
        <View style={styles.timerTrack}>
          <View style={[styles.timerFill, { width: `${Math.max(0, Math.min(100, ratio * 100))}%`, backgroundColor: timerColor }]} />
        </View>
        <Text style={[styles.timerSeconds, { color: timerColor }]}>{timed ? i18nT('⏱ {p0}초', { p0: Math.max(0, Math.ceil(remainingMs / 1000)) }) : i18nT('시간 제한 없음')}</Text>
      </View>

      <View style={styles.stage} onLayout={onStageLayout}>
        <Madang variant="court" seed={54} />
        {targetPx.map((t, i) => (
          <Pressable
            key={`ghost-${i}`}
            style={[styles.ghost, { left: t.x - 18, top: t.y - 18, borderColor: color }]}
            onPress={() => {
              if (selectedIdx === null) return;
              setKeyboardMove((m) => ({ id: selectedIdx, x: t.x, y: t.y, nonce: m.nonce + 1 }));
              setSelectedIdx(null);
            }}
          />
        ))}
        {pieces.map((p, i) => (
          <Dot
            key={i}
            id={i}
            x={p.x}
            y={p.y}
            resetSignal={resetSignal}
            onDragEnd={handleDragEnd}
            onSelect={setSelectedIdx}
            selected={i === selectedIdx}
            tintColor={color}
            forcePos={keyboardMove.id === i ? { x: keyboardMove.x, y: keyboardMove.y } : undefined}
            forceSignal={keyboardMove.id === i ? keyboardMove.nonce : undefined}
          />
        ))}
        {flash === 'success' && <Text style={styles.flashHit}>{i18nT('완성! 퍼즐이 꼭 맞았어요')}</Text>}
        {flash === 'wrong' && <Text style={styles.flashMiss}>{i18nT('시간이 다 됐어요')}</Text>}
      </View>

      <Pressable style={[styles.secondaryBtn, { borderColor: color }]} onPress={() => start(stageSize)}>
        <Text style={[styles.secondaryBtnText, { color }]}>{i18nT('다시 섞기')}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', width: '100%', flex: 1, justifyContent: 'flex-start', paddingTop: 6 },
  roundText: { fontSize: 14, fontWeight: '800', color: colors.ink, marginBottom: 8, textAlign: 'center', backgroundColor: colors.accentSoft, paddingHorizontal: 14, paddingVertical: 6, borderRadius: 3, overflow: 'hidden' },
  timerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    width: '100%',
    maxWidth: 340,
    marginBottom: 10,
  },
  timerTrack: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(0,0,0,0.08)',
    overflow: 'hidden',
  },
  timerFill: { height: '100%' },
  timerSeconds: { fontSize: 12, fontWeight: '800', minWidth: 36, textAlign: 'right' },
  stage: {
    width: '100%',
    flex: 1,
    minHeight: 240,
    position: 'relative',
    backgroundColor: colors.borderSoft,
    borderWidth: 2,
    borderColor: colors.ink,
    borderRadius: 6,
    marginBottom: 14,
    overflow: 'hidden',
  },
  ghost: {
    position: 'absolute',
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    opacity: 0.55,
  },
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
  secondaryBtn: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 18,
    borderWidth: 2,
    backgroundColor: colors.paper,
  },
  secondaryBtnText: { fontWeight: '700', fontSize: 13 },
});
