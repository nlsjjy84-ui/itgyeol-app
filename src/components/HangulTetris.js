import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useAutoStart } from '../ui/Mission';
import { View, StyleSheet, Pressable } from 'react-native';
import Text from '../ui/Text';
import { colors } from '../theme';
import { play } from '../utils/sound';
import { useRaf, usePad } from './minigames/common';
import Svg, { Line } from 'react-native-svg';
import Madang from '../ui/Madang';
import { t as i18nT } from '../i18n';

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
  useAutoStart(phase === 'ready', start);

  const lock = () => {
    const s = st.current;
    const p = s.cur;
    p.cells.forEach(([cx, cy]) => {
      const px = p.x + cx;
      const py = p.y + cy;
      if (py >= 0) s.board[py][px] = { kind: p.kind, g: glyphOf(p), rot: p.r % 4 };
    });
    // 줄 지우기
    const clearedRows = [];
    s.board.forEach((row, yy) => { if (row.every((c) => c)) clearedRows.push(yy); });
    const keep = s.board.filter((row) => row.some((c) => !c));
    const cleared = ROWS - keep.length;
    if (cleared > 0) s.flash = { rows: clearedRows, t: 0.5 };
    if (cleared > 0) {
      s.board = [...Array.from({ length: cleared }, () => Array(COLS).fill(null)), ...keep];
      s.lines += cleared;
      play('stamp');
      if (s.lines >= targetLines) {
        setTimeout(() => { st.current.flash = null; draw(); }, 600);
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
    if (s.flash) { s.flash.t -= dt; if (s.flash.t <= 0) s.flash = null; }
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

  // 손가락 조작: 판 위에서 좌우로 밀면 이동, 톡 치면 돌리기, 아래로 휙 쓸면 쭉 내리기
  const gest = useRef(null);
  const pad = usePad({
    onDown: (x, y) => { gest.current = { x0: x, y0: y, lastX: x, t: Date.now(), moved: false }; },
    onMove: (x, y) => {
      const gg = gest.current;
      if (!gg) return;
      const step = 21;
      while (x - gg.lastX >= step) { move(1); gg.lastX += step; gg.moved = true; }
      while (gg.lastX - x >= step) { move(-1); gg.lastX -= step; gg.moved = true; }
      if (Math.abs(y - gg.y0) > 10) gg.moved = true;
    },
    onUp: (x, y) => {
      const gg = gest.current;
      gest.current = null;
      if (!gg) return;
      const dy = y - gg.y0;
      const dt = Date.now() - gg.t;
      if (dy > 50 && Math.abs(x - gg.x0) < 60) hard();
      else if (!gg.moved && dt < 300) rotate();
    },
  });
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
        {i18nT('지운 줄')} {i18nT(s.lines)} / {i18nT(targetLines)}
        {i18nT(phase === 'over' ? '  ·  쌓였어요! 다시 해 봐요' : '')}
        {i18nT(phase === 'won' ? '  ·  성공!' : '')}
      </Text>
      <View style={styles.row}>
        <View ref={pad.ref} {...pad.handlers} style={[styles.board, { width: COLS * CELL + 4, height: ROWS * CELL + 4, borderColor: color }]}>
          <Madang variant="hanji" seed={61} />
          {/* 정간보처럼 옅은 칸선 */}
          <View pointerEvents="none" style={StyleSheet.absoluteFill}>
            <Svg width={COLS * CELL + 4} height={ROWS * CELL + 4}>
              {Array.from({ length: COLS - 1 }).map((_, i) => (
                <Line key={`v${i}`} x1={2 + (i + 1) * CELL} y1="2" x2={2 + (i + 1) * CELL} y2={ROWS * CELL + 2} stroke={colors.fiber} strokeOpacity="0.25" strokeWidth="0.6" />
              ))}
              {Array.from({ length: ROWS - 1 }).map((_, i) => (
                <Line key={`h${i}`} x1="2" y1={2 + (i + 1) * CELL} x2={COLS * CELL + 2} y2={2 + (i + 1) * CELL} stroke={colors.fiber} strokeOpacity="0.25" strokeWidth="0.6" />
              ))}
            </Svg>
          </View>
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
                      : { backgroundColor: '#ead2a2', borderWidth: 1.5, borderColor: b.color, borderBottomWidth: 3 },
                  ]}
                >
                  {!c.ghost ? (
                    <Text style={[styles.cellText, { color: b.color }, !BASE[c.kind].glyphs && { transform: [{ rotate: `${(c.rot || 0) * 90}deg` }] }]}>{i18nT(c.g)}</Text>
                  ) : null}
                </View>
              );
            })
          )}
          {s.flash ? (
            <View pointerEvents="none" style={StyleSheet.absoluteFill}>
              {s.flash.rows.map((ry) => (
                <View key={ry} style={{ position: 'absolute', left: 2, right: 2, top: ry * CELL + 2, height: CELL, backgroundColor: '#fff6d8', opacity: Math.min(1, s.flash.t * 2.4), borderTopWidth: 1, borderBottomWidth: 1, borderColor: colors.gold }} />
              ))}
              <Text style={[styles.pop, { top: s.flash.rows[0] * CELL - 26, opacity: Math.min(1, s.flash.t * 2.4), color }]}>{i18nT(s.flash.rows.length > 1 ? '펑펑!' : '펑!')}</Text>
            </View>
          ) : null}
        </View>
        <View style={styles.side}>
          <Text style={styles.sideCap}>{i18nT('다음 글자 블록')}</Text>
          <View style={styles.nextBox}>
            {s.next ? (
              <Text style={[styles.nextGlyph, { color: BASE[s.next].color }]}>{i18nT(BASE[s.next].glyph)}</Text>
            ) : (
              <Text style={styles.nextGlyph}>·</Text>
            )}
          </View>
          <Text style={styles.sideCap}>{i18nT('돌리면 바뀌는 모음')}</Text>
          <View style={styles.rotCard}>
            {['ㅗ', 'ㅏ', 'ㅜ', 'ㅓ'].map((v, i) => {
              const on = s.cur && s.cur.kind === 't' && s.cur.r % 4 === i && phase === 'running';
              return <Text key={v} style={[styles.rotGlyph, on && { color: '#fff', backgroundColor: BASE.t.color }]}>{v}</Text>;
            })}
          </View>
          <View style={styles.rotCard}>
            {['ㅣ', 'ㅡ'].map((v, i) => {
              const on = s.cur && s.cur.kind === 'i' && s.cur.r % 2 === i && phase === 'running';
              return <Text key={v} style={[styles.rotGlyph, on && { color: '#fff', backgroundColor: BASE.i.color }]}>{v}</Text>;
            })}
          </View>
        </View>
      </View>
      {phase === 'running' ? (
        <View style={styles.pad}>
          <Pressable style={styles.padBtn} onPress={() => move(-1)}><Text style={styles.padTxt}>◀</Text></Pressable>
          <Pressable style={[styles.padBtn, { backgroundColor: color }]} onPress={rotate}><Text style={[styles.padTxt, { color: '#fff' }]}>{i18nT('돌리기')}</Text></Pressable>
          <Pressable style={styles.padBtn} onPress={() => move(1)}><Text style={styles.padTxt}>▶</Text></Pressable>
          <Pressable style={styles.padBtn} onPress={soft}><Text style={styles.padTxt}>▼</Text></Pressable>
          <Pressable style={styles.padBtn} onPress={hard}><Text style={styles.padTxt}>{i18nT('쭉')}</Text></Pressable>
        </View>
      ) : (
        <Pressable style={[styles.bigBtn, { backgroundColor: color }]} onPress={start}>
          <Text style={styles.bigBtnText}>{i18nT(phase === 'ready' ? '시작하기' : '다시 하기')}</Text>
        </Pressable>
      )}
      <Text style={styles.hint}>{i18nT('판 위에서: 좌우로 밀기 = 이동 · 톡 = 돌리기 · 아래로 휙 = 쭉 내리기')}</Text>
      <Text style={styles.hint}>{i18nT('키보드: ← → 이동 · ↑ 돌리기 · ↓ 한 칸 · 스페이스 쭉 내리기')}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', gap: 10 },
  hud: { fontSize: 14, fontWeight: '800', color: colors.ink, textAlign: 'center' },
  row: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  board: { borderWidth: 2, borderRadius: 6, backgroundColor: colors.paper, position: 'relative', overflow: 'hidden', userSelect: 'none' },
  cell: { position: 'absolute', borderRadius: 3, alignItems: 'center', justifyContent: 'center' },
  cellText: { fontSize: 15, fontWeight: '900', color: '#fff', lineHeight: 17, userSelect: 'none' },
  pop: { position: 'absolute', left: 0, right: 0, textAlign: 'center', fontSize: 22, fontWeight: '900' },
  rotCard: { flexDirection: 'row', gap: 3, flexWrap: 'wrap', justifyContent: 'center' },
  rotGlyph: { width: 20, height: 22, textAlign: 'center', fontSize: 14, fontWeight: '800', color: colors.ink, borderRadius: 3, overflow: 'hidden', borderWidth: 1, borderColor: colors.border, lineHeight: 20 },
  side: { width: 92, alignItems: 'center', gap: 8 },
  sideCap: { fontSize: 11, color: colors.muted },
  nextBox: { width: 70, height: 70, borderRadius: 10, borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.paper, alignItems: 'center', justifyContent: 'center' },
  nextGlyph: { fontSize: 38, fontWeight: '800', color: colors.ink },
  sideNote: { fontSize: 10.5, color: colors.muted, textAlign: 'center', lineHeight: 15 },
  pad: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', justifyContent: 'center' },
  padBtn: { minWidth: 50, paddingHorizontal: 12, height: 46, borderRadius: 12, borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.paper, alignItems: 'center', justifyContent: 'center' },
  padTxt: { fontSize: 14, fontWeight: '800', color: colors.ink },
  bigBtn: { minWidth: 200, alignItems: 'center', paddingHorizontal: 30, paddingVertical: 14, borderRadius: 4, borderBottomWidth: 4, borderBottomColor: 'rgba(0,0,0,0.28)' },
  bigBtnText: { color: '#fff', fontWeight: '700', fontSize: 17, letterSpacing: 1 },
  hint: { fontSize: 11, color: colors.muted, textAlign: 'center' },
});
