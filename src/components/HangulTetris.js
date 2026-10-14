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
// 블록은 한글 자모 모양: 자음 ㄱ ㄴ(4칸·짧은 3칸) ㄷ ㅁ, 모음 ㅣ ㅡ(막대), ㅏ ㅓ ㅗ ㅜ(T 블록을 돌린 모양),
//   ㅛ ㅑ ㅠ ㅕ(가지 둘 블록을 돌린 모양), ㅐ ㅒ(세로획 둘을 잇는 큰 블록).
//   큰 자음: ㄷ(6칸, 오른쪽이 열림)
// 칸 안에 글자나 선을 쓰지 않는다. 블록 칸을 하나로 이어 붙여 블록 모양 자체가 글자로 보이게 한다.
// 블록을 돌리면 모음은 실제 글자(ㅗ→ㅏ→ㅜ→ㅓ, ㅛ→ㅑ→ㅠ→ㅕ, ㅡ→ㅣ)로 바뀐다.
const COLS = 12; // 일반 테트리스(10칸)보다 양옆 한 칸씩 넓게 — 큰 글자 블록이 들어갈 자리
const ROWS = 18;

// 기본(처음 나올 때) 모양 — [x, y] 칸 목록. 글자 모양 그대로 시작한다.
const BASE = {
  g: { glyph: 'ㄱ', color: '#e05a47', cells: [[0, 0], [1, 0], [1, 1], [1, 2]] }, // ㄱ — 위 2칸, 오른쪽으로 내려옴
  g3: { glyph: 'ㄱ', color: '#f08a3c', cells: [[0, 0], [1, 0], [1, 1]] }, // 짧은 ㄱ(3칸)
  n: { glyph: 'ㄴ', color: '#3a78c4', cells: [[0, 0], [0, 1], [0, 2], [1, 2]] }, // ㄴ
  n3: { glyph: 'ㄴ', color: '#5bb5e0', cells: [[0, 0], [0, 1], [1, 1]] }, // 짧은 ㄴ(3칸)
  m: { glyph: 'ㅁ', color: '#f2c230', cells: [[0, 0], [1, 0], [0, 1], [1, 1]] }, // ㅁ
  d: { glyph: 'ㄷ', color: '#8e63b8', cells: [[0, 0], [1, 0], [0, 1], [0, 2], [1, 2], [2, 2]] }, // ㄷ(6칸) — 위 2칸, 아래 3칸
  i: { glyph: 'ㅣ', color: '#3fa860', cells: [[0, 0], [0, 1], [0, 2], [0, 3]], glyphs: ['ㅣ', 'ㅡ'] }, // ㅣ ↔ ㅡ
  t: { glyph: 'ㅗ', color: '#e0567f', cells: [[1, 0], [0, 1], [1, 1], [2, 1]], glyphs: ['ㅗ', 'ㅏ', 'ㅜ', 'ㅓ'] }, // ㅗ → ㅏ → ㅜ → ㅓ
  // 긴 ㅣ·ㅡ — 5칸 막대
  il: { glyph: 'ㅣ', color: '#20a39e', cells: [[0, 0], [0, 1], [0, 2], [0, 3], [0, 4]], glyphs: ['ㅣ', 'ㅡ'] },
  // 긴 ㅗ·ㅏ·ㅜ·ㅓ — 가로 5칸 가운데에 가지 하나
  tl: { glyph: 'ㅗ', color: '#f28ab0', cells: [[2, 0], [0, 1], [1, 1], [2, 1], [3, 1], [4, 1]], glyphs: ['ㅗ', 'ㅏ', 'ㅜ', 'ㅓ'] },
  // 아래 셋은 큰 블록이라 드물게 나온다(어려운 블록) — ㅛ·ㅑ·ㅠ·ㅕ, ㅐ, ㅒ
  y: { glyph: 'ㅛ', color: '#8cc63f', cells: [[1, 0], [3, 0], [0, 1], [1, 1], [2, 1], [3, 1], [4, 1]], glyphs: ['ㅛ', 'ㅑ', 'ㅠ', 'ㅕ'] }, // ㅛ → ㅑ → ㅠ → ㅕ
  ae: {
    glyph: 'ㅐ',
    color: '#4a55a2',
    cells: [[0, 0], [0, 1], [0, 2], [0, 3], [0, 4], [1, 2], [2, 0], [2, 1], [2, 2], [2, 3], [2, 4]],
  }, // ㅐ — 세로획 둘을 가운데 가로획 하나로 잇는다
  yae: {
    glyph: 'ㅒ',
    color: '#c26dbc',
    cells: [[0, 0], [0, 1], [0, 2], [0, 3], [0, 4], [1, 1], [1, 3], [2, 0], [2, 1], [2, 2], [2, 3], [2, 4]],
  }, // ㅒ — 세로획 둘을 가로획 둘로 잇는다
};
// 나오는 비율(가중치): 4칸 블록은 자주, 긴 ㅣ·ㅡ, 긴 ㅗ·ㅏ·ㅜ·ㅓ와 ㄷ은 가끔, 큰 모음(ㅛ·ㅑ·ㅠ·ㅕ, ㅐ, ㅒ)은 아주 드물게
const WEIGHT = { g: 6, g3: 4, n: 6, n3: 4, m: 6, i: 7, il: 3, t: 8, tl: 3, d: 3, y: 2, ae: 1, yae: 1 };
const BAG = Object.entries(WEIGHT).flatMap(([k, w]) => Array(w).fill(k));

function rot(cells) {
  const r = cells.map(([x, y]) => [-y, x]);
  const minx = Math.min(...r.map((c) => c[0]));
  const miny = Math.min(...r.map((c) => c[1]));
  return r.map(([x, y]) => [x - minx, y - miny]);
}

let pieceSeq = 0;
function newPiece(kind) {
  const b = BASE[kind];
  pieceSeq += 1;
  return { id: pieceSeq, kind, cells: b.cells.map((c) => c.slice()), r: 0, x: Math.floor((COLS - 2) / 2) - 1, y: 0 };
}

function fits(board, cells, x, y) {
  return cells.every(([cx, cy]) => {
    const px = x + cx;
    const py = y + cy;
    return px >= 0 && px < COLS && py < ROWS && (py < 0 || !board[py][px]);
  });
}

// 블록 색: 일반 테트리스처럼 블록마다 서로 다른 맑은 색 하나(13색). 탁하거나 어두운 색은 쓰지 않는다.
// 칸 처리: 블록 안 칸을 하나하나 나눠 그리고, 칸마다 위·왼쪽은 밝게, 아래·오른쪽은 어둡게 해서 도드라진 블록처럼 보이게 한다.
const shadeCache = {};
function shade(hex, k) {
  const key = `${hex}${k}`;
  if (shadeCache[key]) return shadeCache[key];
  const n = parseInt(hex.slice(1), 16);
  const f = (c) => Math.round(k > 0 ? c + (255 - c) * k : c * (1 + k));
  shadeCache[key] = `rgb(${f((n >> 16) & 255)},${f((n >> 8) & 255)},${f(n & 255)})`;
  return shadeCache[key];
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
    p.cells.forEach(([cx, cy], ci) => {
      const px = p.x + cx;
      const py = p.y + cy;
      if (py >= 0) s.board[py][px] = { kind: p.kind, pid: p.id, ci, lx: cx, ly: cy, r: p.r % 4 };
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
    s.cur.cells.forEach(([cx, cy], ci) => {
      const py = s.cur.y + cy;
      if (py >= 0 && py < ROWS) grid[py][s.cur.x + cx] = { kind: s.cur.kind, pid: s.cur.id, ci, lx: cx, ly: cy, r: s.cur.r % 4 };
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
              if (c.ghost) {
                return <View key={`${x}-${y}`} style={[styles.cell, { left: x * CELL + 2, top: y * CELL + 2, width: CELL, height: CELL, borderWidth: 1.5, borderColor: b.color, borderStyle: 'dashed', backgroundColor: 'transparent', opacity: 0.55 }]} />;
              }
              return (
                <View
                  key={`${x}-${y}`}
                  style={[
                    styles.cell,
                    {
                      left: x * CELL + 2,
                      top: y * CELL + 2,
                      width: CELL,
                      height: CELL,
                      borderRadius: 2,
                      backgroundColor: b.color,
                      borderWidth: 3,
                      borderTopColor: shade(b.color, 0.45),
                      borderLeftColor: shade(b.color, 0.3),
                      borderRightColor: shade(b.color, -0.2),
                      borderBottomColor: shade(b.color, -0.3),
                    },
                  ]}
                />
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
              const on = s.cur && (s.cur.kind === 't' || s.cur.kind === 'tl') && s.cur.r % 4 === i && phase === 'running';
              return <Text key={v} style={[styles.rotGlyph, on && { color: '#fff', backgroundColor: BASE.t.color }]}>{v}</Text>;
            })}
          </View>
          <View style={styles.rotCard}>
            {['ㅛ', 'ㅑ', 'ㅠ', 'ㅕ'].map((v, i) => {
              const on = s.cur && s.cur.kind === 'y' && s.cur.r % 4 === i && phase === 'running';
              return <Text key={v} style={[styles.rotGlyph, on && { color: '#fff', backgroundColor: BASE.y.color }]}>{v}</Text>;
            })}
          </View>
          <View style={styles.rotCard}>
            {['ㅣ', 'ㅡ'].map((v, i) => {
              const on = s.cur && (s.cur.kind === 'i' || s.cur.kind === 'il') && s.cur.r % 2 === i && phase === 'running';
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
