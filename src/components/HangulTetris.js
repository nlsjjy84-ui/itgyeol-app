import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import Text from '../ui/Text';
import { colors } from '../theme';
import { play } from '../utils/sound';
import { useRaf } from './minigames/common';

// 한글 테트리스 — 규칙은 일반 테트리스와 똑같다.
// 블록은 한글 자모 모양: ㄱ ㄴ ㅁ(4칸), ㄷ(5칸 특수 블록), 모음 ㅣ ㅡ(막대)와 ㅏ ㅓ ㅗ ㅜ(T 블록을 돌린 모양).
// 블록을 돌리면 모음은 실제 글자(ㅗ→ㅏ→ㅜ→ㅓ, ㅡ→ㅣ)로 바뀐다.
const COLS = 10;
const ROWS = 16;

// 기본(처음 나올 때) 모양 — [x, y] 칸 목록. 글자 모양 그대로 시작한다.
const BASE = {
  g: { glyph: 'ㄱ', color: '#c1592f', cells: [[0, 0], [1, 0], [2, 0], [2, 1]] }, // ㄱ
  n: { glyph: 'ㄴ', color: '#3f6f8f', cells: [[0, 0], [0, 1], [0, 2], [1, 2]] }, // ㄴ
  m: { glyph: 'ㅁ', color: '#b08a4a', cells: [[0, 0], [1, 0], [0, 1], [1, 1]] }, // ㅁ
  d: { glyph: 'ㄷ', color: '#8a4f8a', cells: [[0, 0], [1, 0], [0, 1], [0, 2], [1, 2]] }, // ㄷ(5칸)
  i: { glyph: 'ㅣ', color: '#2c7a6b', cells: [[0, 0], [0, 1], [0, 2], [0, 3]], glyphs: ['ㅣ', 'ㅡ'] }, // ㅣ ↔ ㅡ
  t: { glyph: 'ㅗ', color: '#a23b5c', cells: [[1, 0], [0, 1], [1, 1], [2, 1]], glyphs: ['ㅗ', 'ㅏ', 'ㅜ', 'ㅓ'] }, // ㅗ → ㅏ → ㅜ → ㅓ
};
// 자주 나오는 순서(가방 뽑기): 모음 3 : 자음 3 — ㄷ은 드물게
const BAG = ['g', 'n', 'm', 'i', 't', 't', 'i', 'g', 'n', 'm', 'd'];

function rot(cells) {
  const r = cells.map(([x, y]) => [-y, x]);
  const minx = Math.min(...r.map((c) => c[0]));
  const miny = Math.min(...r.map((c) => c[1]));
  return r.map(([x, y]) => [x - minx, y - miny]);
}

function newPiece(kind) {
  const b = BASE[kind];
  return { kind, cells: b.cells.map((c) => c.slice()), r: 0, x: Math.floor((COLS - 2) / 2) - 1, y: 0 };
}

function glyphOf(p) {
  const b = BASE[p.kind];
  if (b.glyphs) return b.glyphs[p.r % b.glyphs.length];
  return b.glyph;
}

function fits(board, cells, x, y) {
  return cells.every(([cx, cy]) => {
    const px = x + cx;
    const py = y + cy;
    return px >= 0 && px < COLS && py < ROWS && (py < 0 || !board[py][px]);
  });
}

const emptyBoard = () => Array.from({ length: ROWS }, () => Array(COLS).fill(null));

export default function HangulTetris({ color, targetLines = 5, dropMs = 900, onDone, resetKey }) {
  const [phase, setPhase] = useState('ready'); // ready | running | over | won
  const [, force] = useState(0);
  const st = useRef({ board: emptyBoard(), cur: null, next: null, lines: 0, acc: 0, bagIdx: 0, start: 0 });

  const draw = () => force((n) => n + 1);
  const pick = () => BAG[Math.floor(Math.random() * BAG.length)];

  const spawn = () => {
    const s = st.current;
    s.cur = s.next ? newPiece(s.next) : newPiece(pick());
    s.next = pick();
    if (!fits(s.board, s.cur.cells, s.cur.x, s.cur.y)) {
      setPhase('over');
      play('geomungo');
    }
  };

  const start = () => {
    const s = st.current;
    s.board = emptyBoard();
    s.lines = 0;
    s.acc = 0;
    s.next = pick();
    s.start = Date.now();
    spawn();
    setPhase('running');
    draw();
  };

  const lock = () => {
    const s = st.current;
    const p = s.cur;
    p.cells.forEach(([cx, cy]) => {
      const px = p.x + cx;
      const py = p.y + cy;
      if (py >= 0) s.board[py][px] = { kind: p.kind, g: glyphOf(p), rot: p.r % 4 };
    });
    // 줄 지우기
    const keep = s.board.filter((row) => row.some((c) => !c));
    const cleared = ROWS - keep.length;
    if (cleared > 0) {
      s.board = [...Array.from({ length: cleared }, () => Array(COLS).fill(null)), ...keep];
      s.lines += cleared;
      play('stamp');
      if (s.lines >= targetLines) {
        setPhase('won');
        onDone && onDone({ mistakes: Math.max(0, 3 - Math.min(3, Math.floor(s.lines / targetLines))), lines: s.lines, elapsedMs: Date.now() - s.start });
        draw();
        return;
      }
    } else {
      play('tap');
    }
    spawn();
  };

  const move = (dx) => {
    const s = st.current;
    if (phase !== 'running' || !s.cur) return;
    if (fits(s.board, s.cur.cells, s.cur.x + dx, s.cur.y)) {
      s.cur.x += dx;
      draw();
    }
  };
  const rotate = () => {
    const s = st.current;
    if (phase !== 'running' || !s.cur) return;
    const nc = rot(s.cur.cells);
    for (const k of [0, -1, 1, -2, 2]) {
      if (fits(s.board, nc, s.cur.x + k, s.cur.y)) {
        s.cur.cells = nc;
        s.cur.x += k;
        s.cur.r += 1;
        draw();
        return;
      }
    }
  };
  const soft = () => {
    const s = st.current;
    if (phase !== 'running' || !s.cur) return;
    if (fits(s.board, s.cur.cells, s.cur.x, s.cur.y + 1)) {
      s.cur.y += 1;
      s.acc = 0;
      draw();
    } else lock();
  };
  const hard = () => {
    const s = st.current;
    if (phase !== 'running' || !s.cur) return;
    while (fits(s.board, s.cur.cells, s.cur.x, s.cur.y + 1)) s.cur.y += 1;
    lock();
    draw();
  };

  useRaf((dt) => {
    const s = st.current;
    if (!s.cur) return;
    // 줄을 지울수록 조금씩 빨라진다(아주 완만하게)
    const ms = Math.max(350, dropMs - s.lines * 60);
    s.acc += dt * 1000;
    if (s.acc >= ms) {
      s.acc = 0;
      if (fits(s.board, s.cur.cells, s.cur.x, s.cur.y + 1)) s.cur.y += 1;
      else lock();
      draw();
    }
  }, phase === 'running');

  // 키보드: ← → 이동, ↑·Z·X 돌리기, ↓ 한 칸, 스페이스 쭉 내리기
  const handlers = useRef({});
  handlers.current = { move, rotate, soft, hard };
  useEffect(() => {
    if (typeof window === 'undefined' || phase !== 'running') return undefined;
    const h = (e) => {
      const c = e.code;
      if (['ArrowLeft', 'KeyA'].includes(c)) handlers.current.move(-1);
      else if (['ArrowRight', 'KeyD'].includes(c)) handlers.current.move(1);
      else if (['ArrowUp', 'KeyZ', 'KeyX', 'KeyW'].includes(c)) handlers.current.rotate();
      else if (['ArrowDown', 'KeyS'].includes(c)) handlers.current.soft();
      else if (c === 'Space') handlers.current.hard();
      else return;
      e.preventDefault();
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [phase]);

  useEffect(() => {
    setPhase('ready');
    st.current = { board: emptyBoard(), cur: null, next: null, lines: 0, acc: 0, bagIdx: 0, start: 0 };
  }, [resetKey]);

  const s = st.current;
  const CELL = 21;
  // 보드에 지금 블록을 겹쳐 그린 칸 목록
  const grid = s.board.map((row) => row.slice());
  if (s.cur && phase !== 'ready') {
    // 착지 위치 그림자
    let gy = s.cur.y;
    while (fits(s.board, s.cur.cells, s.cur.x, gy + 1)) gy += 1;
    s.cur.cells.forEach(([cx, cy]) => {
      const py = gy + cy;
      if (py >= 0 && py < ROWS && !grid[py][s.cur.x + cx]) grid[py][s.cur.x + cx] = { ghost: true, kind: s.cur.kind };
    });
    s.cur.cells.forEach(([cx, cy]) => {
      const py = s.cur.y + cy;
      if (py >= 0 && py < ROWS) grid[py][s.cur.x + cx] = { kind: s.cur.kind, g: glyphOf(s.cur), rot: s.cur.r % 4 };
    });
  }

  return (
    <View style={styles.wrap}>
      <Text style={styles.hud}>
        지운 줄 {s.lines} / {targetLines}
        {phase === 'over' ? '  ·  쌓였어요! 다시 해 봐요' : ''}
        {phase === 'won' ? '  ·  성공!' : ''}
      </Text>
      <View style={styles.row}>
        <View style={[styles.board, { width: COLS * CELL + 4, height: ROWS * CELL + 4, borderColor: color }]}>
          {grid.map((row, y) =>
            row.map((c, x) => {
              if (!c) return null;
              const b = BASE[c.kind];
              return (
                <View
                  key={`${x}-${y}`}
                  style={[
                    styles.cell,
                    { left: x * CELL + 2, top: y * CELL + 2, width: CELL, height: CELL },
                    c.ghost
                      ? { borderWidth: 1.5, borderColor: b.color, borderStyle: 'dashed', backgroundColor: 'transparent', opacity: 0.55 }
                      : { backgroundColor: b.color },
                  ]}
                >
                  {!c.ghost ? (
                    <Text style={[styles.cellText, !BASE[c.kind].glyphs && { transform: [{ rotate: `${(c.rot || 0) * 90}deg` }] }]}>{c.g}</Text>
                  ) : null}
                </View>
              );
            })
          )}
        </View>
        <View style={styles.side}>
          <Text style={styles.sideCap}>다음 글자 블록</Text>
          <View style={styles.nextBox}>
            {s.next ? (
              <Text style={[styles.nextGlyph, { color: BASE[s.next].color }]}>{BASE[s.next].glyph}</Text>
            ) : (
              <Text style={styles.nextGlyph}>·</Text>
            )}
          </View>
          <Text style={styles.sideNote}>ㅗ를 돌리면{'\n'}ㅏ → ㅜ → ㅓ{'\n'}ㅣ를 돌리면 ㅡ</Text>
        </View>
      </View>
      {phase === 'running' ? (
        <View style={styles.pad}>
          <Pressable style={styles.padBtn} onPress={() => move(-1)}><Text style={styles.padTxt}>◀</Text></Pressable>
          <Pressable style={[styles.padBtn, { backgroundColor: color }]} onPress={rotate}><Text style={[styles.padTxt, { color: '#fff' }]}>돌리기</Text></Pressable>
          <Pressable style={styles.padBtn} onPress={() => move(1)}><Text style={styles.padTxt}>▶</Text></Pressable>
          <Pressable style={styles.padBtn} onPress={soft}><Text style={styles.padTxt}>▼</Text></Pressable>
          <Pressable style={styles.padBtn} onPress={hard}><Text style={styles.padTxt}>쭉</Text></Pressable>
        </View>
      ) : (
        <Pressable style={[styles.bigBtn, { backgroundColor: color }]} onPress={start}>
          <Text style={styles.bigBtnText}>{phase === 'ready' ? '시작하기' : '다시 하기'}</Text>
        </Pressable>
      )}
      <Text style={styles.hint}>키보드: ← → 이동 · ↑ 돌리기 · ↓ 한 칸 · 스페이스 쭉 내리기</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', gap: 10 },
  hud: { fontSize: 14, fontWeight: '800', color: colors.ink, textAlign: 'center' },
  row: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  board: { borderWidth: 2, borderRadius: 6, backgroundColor: colors.paper, position: 'relative' },
  cell: { position: 'absolute', borderRadius: 3, alignItems: 'center', justifyContent: 'center' },
  cellText: { fontSize: 12, fontWeight: '800', color: '#fff' },
  side: { width: 92, alignItems: 'center', gap: 8 },
  sideCap: { fontSize: 11, color: colors.muted },
  nextBox: { width: 70, height: 70, borderRadius: 10, borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.paper, alignItems: 'center', justifyContent: 'center' },
  nextGlyph: { fontSize: 38, fontWeight: '800', color: colors.ink },
  sideNote: { fontSize: 10.5, color: colors.muted, textAlign: 'center', lineHeight: 15 },
  pad: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', justifyContent: 'center' },
  padBtn: { minWidth: 50, paddingHorizontal: 12, height: 46, borderRadius: 12, borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.paper, alignItems: 'center', justifyContent: 'center' },
  padTxt: { fontSize: 14, fontWeight: '800', color: colors.ink },
  bigBtn: { paddingHorizontal: 36, paddingVertical: 14, borderRadius: 22 },
  bigBtnText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  hint: { fontSize: 11, color: colors.muted, textAlign: 'center' },
});
